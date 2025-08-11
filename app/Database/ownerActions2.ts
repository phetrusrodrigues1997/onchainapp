"use server";

import { db2, getTableName } from "./db2";
import { PrivatePots } from "./schema2";
import { eq, sql } from "drizzle-orm";

// ========== POT CREATOR ACTIONS ==========

/**
 * Close a pot to new entries (only pot creator can do this)
 */
export async function closePotEntries(
  contractAddress: string,
  creatorAddress: string
) {
  try {
    // Verify the caller is the pot creator
    const pot = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()))
      .limit(1);

    if (!pot[0] || pot[0].creatorAddress !== creatorAddress.toLowerCase()) {
      return { success: false, error: "Not authorized - only pot creator can close entries" };
    }

    // Update pot status
    await db2.update(PrivatePots)
      .set({ isActive: false })
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()));

    return { success: true };
  } catch (error) {
    console.error("Error closing pot entries:", error);
    return { success: false, error: "Failed to close pot entries" };
  }
}

/**
 * Set outcome for predictions and determine winners (only pot creator)
 */
export async function setPotOutcome(
  contractAddress: string,
  creatorAddress: string,
  predictionDate: string,
  correctOutcome: string // "positive", "negative", or custom value
) {
  try {
    // Verify the caller is the pot creator
    const pot = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()))
      .limit(1);

    if (!pot[0] || pot[0].creatorAddress !== creatorAddress.toLowerCase()) {
      return { success: false, error: "Not authorized - only pot creator can set outcomes" };
    }

    const predictionsTable = getTableName(contractAddress, 'predictions');
    const wrongPredictionsTable = getTableName(contractAddress, 'wrong_predictions');

    // Get all predictions for this date
    const predictions = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(predictionsTable)} 
      WHERE prediction_date = ${predictionDate}
    `);

    // Separate winners and losers
    const winners: string[] = [];
    const losers: string[] = [];

    predictions.rows.forEach((row: any) => {
      if (row.prediction === correctOutcome) {
        winners.push(row.wallet_address);
      } else {
        losers.push(row.wallet_address);
      }
    });

    // Add wrong predictors to wrong_predictions table
    for (const walletAddress of losers) {
      try {
        await db2.execute(sql`
          INSERT INTO ${sql.identifier(wrongPredictionsTable)} 
          (wallet_address, re_entry_fee, wrong_prediction_date)
          VALUES (${walletAddress}, 10000, ${predictionDate})
        `);
      } catch (insertError) {
        // Ignore duplicate errors, user already has wrong prediction for this date
        console.log(`User ${walletAddress} already has wrong prediction for ${predictionDate}`);
      }
    }

    return { 
      success: true, 
      winners: winners,
      losers: losers,
      totalWinners: winners.length,
      totalLosers: losers.length
    };
  } catch (error) {
    console.error("Error setting pot outcome:", error);
    return { success: false, error: "Failed to set pot outcome" };
  }
}

/**
 * Get prediction statistics for a pot (creator analytics)
 */
export async function getPotStats(
  contractAddress: string,
  creatorAddress: string
) {
  try {
    // Verify the caller is the pot creator
    const pot = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()))
      .limit(1);

    if (!pot[0] || pot[0].creatorAddress !== creatorAddress.toLowerCase()) {
      return { success: false, error: "Not authorized - only pot creator can view stats" };
    }

    const predictionsTable = getTableName(contractAddress, 'predictions');
    const participantsTable = getTableName(contractAddress, 'participants');

    // Get total participants
    const participantsResult = await db2.execute(sql`
      SELECT COUNT(*) as total, SUM(entry_amount) as total_pot 
      FROM ${sql.identifier(participantsTable)}
    `);

    // Get total predictions by outcome
    const predictionsResult = await db2.execute(sql`
      SELECT prediction, COUNT(*) as count 
      FROM ${sql.identifier(predictionsTable)} 
      GROUP BY prediction
    `);

    // Get predictions by date
    const dateResult = await db2.execute(sql`
      SELECT prediction_date, COUNT(*) as count 
      FROM ${sql.identifier(predictionsTable)} 
      GROUP BY prediction_date 
      ORDER BY prediction_date DESC
    `);

    const totalParticipants = participantsResult.rows[0]?.total || 0;
    const totalPot = participantsResult.rows[0]?.total_pot || 0;

    return {
      success: true,
      stats: {
        totalParticipants: Number(totalParticipants),
        totalPotValue: Number(totalPot), // in USDC micros
        predictionsByOutcome: predictionsResult.rows,
        predictionsByDate: dateResult.rows,
        potInfo: pot[0]
      }
    };
  } catch (error) {
    console.error("Error getting pot stats:", error);
    return { success: false, error: "Failed to get pot stats" };
  }
}

/**
 * Clear wrong predictions for a user (when they re-enter)
 */
export async function clearWrongPredictionsForUser(
  contractAddress: string,
  walletAddress: string
) {
  try {
    const wrongPredictionsTable = getTableName(contractAddress, 'wrong_predictions');

    await db2.execute(sql`
      DELETE FROM ${sql.identifier(wrongPredictionsTable)} 
      WHERE wallet_address = ${walletAddress.toLowerCase()}
    `);

    return { success: true };
  } catch (error) {
    console.error("Error clearing wrong predictions:", error);
    return { success: false, error: "Failed to clear wrong predictions" };
  }
}

/**
 * Get all wrong predictors for a pot
 */
export async function getWrongPredictors(contractAddress: string) {
  try {
    const wrongPredictionsTable = getTableName(contractAddress, 'wrong_predictions');

    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(wrongPredictionsTable)} 
      ORDER BY created_at DESC
    `);

    return result.rows;
  } catch (error) {
    console.error("Error getting wrong predictors:", error);
    return [];
  }
}

/**
 * Add message to pot (creator announcements, etc.)
 */
export async function addPotMessage(
  contractAddress: string,
  fromAddress: string,
  message: string,
  toAddress?: string
) {
  try {
    const messagesTable = getTableName(contractAddress, 'messages');
    const datetime = new Date().toISOString();

    await db2.execute(sql`
      INSERT INTO ${sql.identifier(messagesTable)} 
      (from_address, to_address, message, datetime)
      VALUES (${fromAddress.toLowerCase()}, ${toAddress?.toLowerCase() || null}, ${message}, ${datetime})
    `);

    return { success: true };
  } catch (error) {
    console.error("Error adding pot message:", error);
    return { success: false, error: "Failed to add message" };
  }
}

/**
 * Get messages for a pot
 */
export async function getPotMessages(
  contractAddress: string,
  walletAddress?: string
) {
  try {
    const messagesTable = getTableName(contractAddress, 'messages');

    let query;
    if (walletAddress) {
      // Get messages for specific user (public messages + messages to them)
      query = sql`
        SELECT * FROM ${sql.identifier(messagesTable)} 
        WHERE to_address IS NULL OR to_address = ${walletAddress.toLowerCase()}
        ORDER BY datetime DESC
        LIMIT 50
      `;
    } else {
      // Get all public messages
      query = sql`
        SELECT * FROM ${sql.identifier(messagesTable)} 
        WHERE to_address IS NULL
        ORDER BY datetime DESC
        LIMIT 50
      `;
    }

    const result = await db2.execute(query);
    return result.rows;
  } catch (error) {
    console.error("Error getting pot messages:", error);
    return [];
  }
}

/**
 * Update pot entry amount (creator only)
 */
export async function updatePotEntryAmount(
  contractAddress: string,
  creatorAddress: string,
  entryAmount: number // Amount in USDC micros (e.g., 10000 = 0.01 USDC)
) {
  try {
    // Verify the caller is the pot creator
    const pot = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()))
      .limit(1);

    if (!pot[0] || pot[0].creatorAddress !== creatorAddress.toLowerCase()) {
      return { success: false, error: "Not authorized - only pot creator can update entry amount" };
    }

    await db2.update(PrivatePots)
      .set({ entryAmount })
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()));

    return { success: true };
  } catch (error) {
    console.error("Error updating entry amount:", error);
    return { success: false, error: "Failed to update entry amount" };
  }
}

/**
 * Update pot details (creator only)
 */
export async function updatePotDetails(
  contractAddress: string,
  creatorAddress: string,
  updates: {
    potName?: string;
    description?: string;
  }
) {
  try {
    // Verify the caller is the pot creator
    const pot = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()))
      .limit(1);

    if (!pot[0] || pot[0].creatorAddress !== creatorAddress.toLowerCase()) {
      return { success: false, error: "Not authorized - only pot creator can update details" };
    }

    const updateData: any = {};
    if (updates.potName) updateData.potName = updates.potName;
    if (updates.description) updateData.description = updates.description;

    await db2.update(PrivatePots)
      .set(updateData)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()));

    return { success: true };
  } catch (error) {
    console.error("Error updating pot details:", error);
    return { success: false, error: "Failed to update pot details" };
  }
}