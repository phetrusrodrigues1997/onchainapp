"use server";

import { db2, getTableName } from "./db2";
import { PrivatePots } from "./schema2";
import { eq, sql } from "drizzle-orm";
import { pgTable, text, boolean, serial, timestamp, integer } from "drizzle-orm/pg-core";

// ========== POT MANAGEMENT ==========

/**
 * Register a new private pot in the master table
 */
export async function createPrivatePot(
  contractAddress: string,
  creatorAddress: string,
  potName: string,
  description: string
) {
  try {
    // Insert pot into master table
    const result = await db2.insert(PrivatePots).values({
      contractAddress: contractAddress.toLowerCase(),
      creatorAddress: creatorAddress.toLowerCase(),
      potName,
      description,
    }).returning();

    // Create the dynamic tables for this pot
    await createPotTables(contractAddress);

    return { success: true, pot: result[0] };
  } catch (error) {
    console.error("Error creating private pot:", error);
    return { success: false, error: "Failed to create pot" };
  }
}

/**
 * Create all necessary tables for a specific pot
 */
export async function createPotTables(contractAddress: string) {
  const cleanAddress = contractAddress.toLowerCase().replace('0x', '');
  
  try {
    // Create predictions table
    await db2.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(`pot_${cleanAddress}_predictions`)} (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        prediction TEXT NOT NULL,
        prediction_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create participants table  
    await db2.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(`pot_${cleanAddress}_participants`)} (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        entry_amount INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
        transaction_hash TEXT
      )
    `);

    // Create wrong predictions table
    await db2.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(`pot_${cleanAddress}_wrong_predictions`)} (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        re_entry_fee INTEGER NOT NULL,
        wrong_prediction_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    

    return { success: true };
  } catch (error) {
    console.error("Error creating pot tables:", error);
    return { success: false, error: "Failed to create tables" };
  }
}

// ========== POT QUERIES ==========

/**
 * Get pot details by contract address
 */
export async function getPotDetails(contractAddress: string) {
  try {
    const result = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, contractAddress.toLowerCase()))
      .limit(1);
    
    return result[0] || null;
  } catch (error) {
    console.error("Error getting pot details:", error);
    return null;
  }
}

/**
 * Get all pots created by a specific address
 */
export async function getPotsByCreator(creatorAddress: string) {
  try {
    const result = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.creatorAddress, creatorAddress.toLowerCase()));
    
    return result;
  } catch (error) {
    console.error("Error getting pots by creator:", error);
    return [];
  }
}

// ========== PREDICTIONS ==========

/**
 * Make a prediction for a specific pot
 */
export async function makePrediction(
  contractAddress: string,
  walletAddress: string,
  prediction: string,
  predictionDate: string
) {
  try {
    const tableName = getTableName(contractAddress, 'predictions');
    
    // Check if user already made a prediction for this date
    const existing = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND prediction_date = ${predictionDate}
    `);

    if (existing.rows.length > 0) {
      // Update existing prediction
      await db2.execute(sql`
        UPDATE ${sql.identifier(tableName)} 
        SET prediction = ${prediction}, created_at = NOW()
        WHERE wallet_address = ${walletAddress.toLowerCase()} 
        AND prediction_date = ${predictionDate}
      `);
    } else {
      // Create new prediction
      await db2.execute(sql`
        INSERT INTO ${sql.identifier(tableName)} (wallet_address, prediction, prediction_date)
        VALUES (${walletAddress.toLowerCase()}, ${prediction}, ${predictionDate})
      `);
    }

    return { success: true };
  } catch (error) {
    console.error("Error making prediction:", error);
    return { success: false, error: "Failed to make prediction" };
  }
}

/**
 * Get user's prediction for a specific date
 */
export async function getUserPrediction(
  contractAddress: string,
  walletAddress: string,
  predictionDate: string
) {
  try {
    const tableName = getTableName(contractAddress, 'predictions');
    
    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND prediction_date = ${predictionDate}
    `);

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting user prediction:", error);
    return null;
  }
}

/**
 * Get all predictions for a specific date
 */
export async function getPredictionsForDate(
  contractAddress: string,
  predictionDate: string
) {
  try {
    const tableName = getTableName(contractAddress, 'predictions');
    
    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE prediction_date = ${predictionDate}
    `);

    return result.rows;
  } catch (error) {
    console.error("Error getting predictions for date:", error);
    return [];
  }
}

// ========== PARTICIPANTS ==========

/**
 * Add a participant to a pot
 */
export async function addParticipant(
  contractAddress: string,
  walletAddress: string,
  entryAmount: number,
  transactionHash?: string
) {
  try {
    const tableName = getTableName(contractAddress, 'participants');
    
    // Check if user already exists
    const existing = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE wallet_address = ${walletAddress.toLowerCase()}
    `);

    if (existing.rows.length > 0) {
      // Update existing entry
      await db2.execute(sql`
        UPDATE ${sql.identifier(tableName)} 
        SET entry_amount = entry_amount + ${entryAmount}, 
            transaction_hash = ${transactionHash || null}
        WHERE wallet_address = ${walletAddress.toLowerCase()}
      `);
    } else {
      // Insert new entry
      await db2.execute(sql`
        INSERT INTO ${sql.identifier(tableName)} (wallet_address, entry_amount, transaction_hash)
        VALUES (${walletAddress.toLowerCase()}, ${entryAmount}, ${transactionHash || null})
      `);
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding participant:", error);
    return { success: false, error: "Failed to add participant" };
  }
}

/**
 * Get all participants for a pot
 */
export async function getParticipants(contractAddress: string) {
  try {
    const tableName = getTableName(contractAddress, 'participants');
    
    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      ORDER BY joined_at ASC
    `);

    return result.rows;
  } catch (error) {
    console.error("Error getting participants:", error);
    return [];
  }
}

/**
 * Check if user is participant in pot
 */
export async function isParticipant(contractAddress: string, walletAddress: string) {
  try {
    const tableName = getTableName(contractAddress, 'participants');
    
    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE wallet_address = ${walletAddress.toLowerCase()}
    `);

    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking participant:", error);
    return false;
  }
}

/**
 * Clean up all tables for a completed pot (after distribution)
 */
export async function cleanupPotTables(contractAddress: string) {
  try {
    const tables = [
      getTableName(contractAddress, 'predictions'),
      getTableName(contractAddress, 'participants'), 
      getTableName(contractAddress, 'wrong_predictions')
    ];

    // Drop all tables for this contract
    for (const tableName of tables) {
      try {
        await db2.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(tableName)}`);
        console.log(`Dropped table: ${tableName}`);
      } catch (error) {
        console.warn(`Failed to drop table ${tableName}:`, error);
        // Continue dropping other tables even if one fails
      }
    }

    // Remove from PrivatePots registry
    await db2.delete(PrivatePots).where(eq(PrivatePots.contractAddress, contractAddress));
    console.log(`Cleaned up pot: ${contractAddress}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error cleaning up pot tables:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}