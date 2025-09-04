"use server";

import { db2, getTableName } from "./db2";
import { PrivatePots } from "./schema2";
import { eq, sql } from "drizzle-orm";

// Security validation functions
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>"\\']/g, '');
};

const isValidOutcome = (outcome: string): outcome is 'positive' | 'negative' => {
  return ['positive', 'negative'].includes(outcome);
};

// ========== POT CREATOR ACTIONS ==========


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
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return { success: false, error: "Invalid contract address" };
    }
    if (!creatorAddress || typeof creatorAddress !== 'string') {
      return { success: false, error: "Invalid creator address" };
    }
    if (!predictionDate || typeof predictionDate !== 'string') {
      return { success: false, error: "Invalid prediction date" };
    }
    if (!correctOutcome || typeof correctOutcome !== 'string') {
      return { success: false, error: "Invalid outcome" };
    }

    // Sanitize inputs
    const sanitizedContractAddress = sanitizeString(contractAddress);
    const sanitizedCreatorAddress = sanitizeString(creatorAddress);
    const sanitizedDate = sanitizeString(predictionDate);
    const sanitizedOutcome = sanitizeString(correctOutcome);

    // Validate Ethereum addresses
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      return { success: false, error: "Invalid contract address format" };
    }
    if (!isValidEthereumAddress(sanitizedCreatorAddress)) {
      return { success: false, error: "Invalid creator address format" };
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedDate)) {
      return { success: false, error: "Invalid date format" };
    }

    // Validate outcome
    if (!isValidOutcome(sanitizedOutcome)) {
      return { success: false, error: "Invalid outcome value" };
    }

    // Verify the caller is the pot creator
    const pot = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, sanitizedContractAddress.toLowerCase()))
      .limit(1);

    if (!pot[0] || pot[0].creatorAddress !== sanitizedCreatorAddress.toLowerCase()) {
      return { success: false, error: "Not authorized - only pot creator can set outcomes" };
    }

    // Check outcome voting results - creator can only set outcome that achieved majority
    const outcomeVotesTable = getTableName(sanitizedContractAddress, 'outcome_votes');
    const outcomeVotesResult = await db2.execute(sql`
      SELECT outcome_vote, COUNT(*) as count 
      FROM ${sql.identifier(outcomeVotesTable)} 
      GROUP BY outcome_vote
    `);

    // Get total participants for majority calculation
    const participantsTable = getTableName(sanitizedContractAddress, 'participants');
    const participantsResult = await db2.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(participantsTable)}
    `);

    const totalParticipants = parseInt(participantsResult.rows[0]?.count as string || '0');
    const requiredVotes = Math.floor(totalParticipants / 2) + 1;

    if (totalParticipants > 0 && outcomeVotesResult.rows.length > 0) {
      let positiveVotes = 0;
      let negativeVotes = 0;
      
      outcomeVotesResult.rows.forEach((row: any) => {
        if (row.outcome_vote === 'positive') {
          positiveVotes = parseInt(row.count);
        } else if (row.outcome_vote === 'negative') {
          negativeVotes = parseInt(row.count);
        }
      });

      // Check if any outcome achieved majority
      const majorityAchieved = Math.max(positiveVotes, negativeVotes) >= requiredVotes;
      
      if (majorityAchieved) {
        const majorityOutcome = positiveVotes > negativeVotes ? 'positive' : 'negative';
        
        // Creator can only set the outcome that achieved majority
        if (sanitizedOutcome !== majorityOutcome) {
          return { 
            success: false, 
            error: `Cannot set ${sanitizedOutcome} outcome. Participants voted for ${majorityOutcome} (${majorityOutcome === 'positive' ? positiveVotes : negativeVotes} votes vs ${requiredVotes} required).` 
          };
        }
      } else {
        // If no majority achieved, warn but allow (for backwards compatibility)
        console.warn(`No majority vote achieved. Positive: ${positiveVotes}, Negative: ${negativeVotes}, Required: ${requiredVotes}`);
      }
    }

    const predictionsTable = getTableName(sanitizedContractAddress, 'predictions');
    const wrongPredictionsTable = getTableName(sanitizedContractAddress, 'wrong_predictions');

    // Get all predictions for this date
    const predictions = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(predictionsTable)} 
      WHERE prediction_date = ${sanitizedDate}
    `);

    // Separate winners and losers
    const winners: string[] = [];
    const losers: string[] = [];

    predictions.rows.forEach((row: any) => {
      if (row.prediction === sanitizedOutcome) {
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
          (wallet_address, re_entry_fee)
          VALUES (${walletAddress.toLowerCase()}, 10000)
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