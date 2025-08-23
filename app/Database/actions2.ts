"use server";

import { db2, getTableName } from "./db2";
import { PrivatePots } from "./schema2";
import { eq, sql } from "drizzle-orm";
import { pgTable, text, boolean, serial, timestamp, integer } from "drizzle-orm/pg-core";

// Security validation functions
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>"\\']/g, '');
};

const isValidPrediction = (prediction: string): prediction is 'positive' | 'negative' => {
  return ['positive', 'negative'].includes(prediction);
};

const sanitizeTableName = (contractAddress: string): string => {
  // Remove 0x prefix and ensure only hexadecimal characters
  const clean = contractAddress.toLowerCase().replace('0x', '').replace(/[^a-f0-9]/g, '');
  if (clean.length !== 40) {
    throw new Error('Invalid contract address for table name');
  }
  return clean;
};

const validatePotName = (potName: string): boolean => {
  return potName.length >= 1 && potName.length <= 100 && !/[<>"\\'`]/.test(potName);
};

const validateDescription = (description: string): boolean => {
  return description.length <= 500 && !/[<>"\\'`]/.test(description);
};

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
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return { success: false, error: "Invalid contract address" };
    }
    if (!creatorAddress || typeof creatorAddress !== 'string') {
      return { success: false, error: "Invalid creator address" };
    }
    if (!potName || typeof potName !== 'string') {
      return { success: false, error: "Invalid pot name" };
    }
    if (!description || typeof description !== 'string') {
      return { success: false, error: "Invalid description" };
    }

    // Sanitize inputs
    const sanitizedContractAddress = sanitizeString(contractAddress);
    const sanitizedCreatorAddress = sanitizeString(creatorAddress);
    const sanitizedPotName = sanitizeString(potName);
    const sanitizedDescription = sanitizeString(description);

    // Validate Ethereum addresses
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      return { success: false, error: "Invalid contract address format" };
    }
    if (!isValidEthereumAddress(sanitizedCreatorAddress)) {
      return { success: false, error: "Invalid creator address format" };
    }

    // Validate pot name and description
    if (!validatePotName(sanitizedPotName)) {
      return { success: false, error: "Invalid pot name" };
    }
    if (!validateDescription(sanitizedDescription)) {
      return { success: false, error: "Invalid description" };
    }

    // Insert pot into master table with validated data
    const result = await db2.insert(PrivatePots).values({
      contractAddress: sanitizedContractAddress.toLowerCase(),
      creatorAddress: sanitizedCreatorAddress.toLowerCase(),
      potName: sanitizedPotName,
      description: sanitizedDescription,
    }).returning();

    // Create the dynamic tables for this pot
    await createPotTables(sanitizedContractAddress);

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
  try {
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      throw new Error("Invalid contract address");
    }

    const sanitizedAddress = sanitizeString(contractAddress);
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedAddress)) {
      throw new Error("Invalid Ethereum address format");
    }

    // Sanitize table name - CRITICAL for SQL injection prevention
    const cleanAddress = sanitizeTableName(sanitizedAddress);
  
    // Create predictions table with properly sanitized table name
    const predictionsTableName = `pot_${cleanAddress}_predictions`;
    await db2.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(predictionsTableName)} (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        prediction TEXT NOT NULL,
        prediction_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create participants table
const participantsTableName = `pot_${cleanAddress}_participants`;
await db2.execute(sql`
  CREATE TABLE IF NOT EXISTS ${sql.identifier(participantsTableName)} (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    entry_amount BIGINT NOT NULL,        -- ✅ use BIGINT for wei/USDC micros
    joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
    transaction_hash TEXT
  )
`);


    // Create wrong predictions table
    const wrongPredictionsTableName = `pot_${cleanAddress}_wrong_predictions`;
    await db2.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(wrongPredictionsTableName)} (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);


    // Create outcome votes table
    const outcomeVotesTableName = `pot_${cleanAddress}_outcome_votes`;
    await db2.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.identifier(outcomeVotesTableName)} (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL UNIQUE,
        outcome_vote TEXT NOT NULL,
        voted_at TIMESTAMP DEFAULT NOW() NOT NULL
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
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return null;
    }

    const sanitizedAddress = sanitizeString(contractAddress);
    
    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedAddress)) {
      console.error("Invalid Ethereum address format in getPotDetails");
      return null;
    }

    const result = await db2.select().from(PrivatePots)
      .where(eq(PrivatePots.contractAddress, sanitizedAddress.toLowerCase()))
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
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return { success: false, error: "Invalid contract address" };
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return { success: false, error: "Invalid wallet address" };
    }
    if (!prediction || typeof prediction !== 'string') {
      return { success: false, error: "Invalid prediction" };
    }
    if (!predictionDate || typeof predictionDate !== 'string') {
      return { success: false, error: "Invalid prediction date" };
    }

    // Sanitize inputs
    const sanitizedContractAddress = sanitizeString(contractAddress);
    const sanitizedWalletAddress = sanitizeString(walletAddress);
    const sanitizedPrediction = sanitizeString(prediction);
    const sanitizedDate = sanitizeString(predictionDate);

    // Validate Ethereum addresses
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      return { success: false, error: "Invalid contract address format" };
    }
    if (!isValidEthereumAddress(sanitizedWalletAddress)) {
      return { success: false, error: "Invalid wallet address format" };
    }

    // Validate prediction
    if (!isValidPrediction(sanitizedPrediction)) {
      return { success: false, error: "Invalid prediction value" };
    }

    // Validate date format (basic check for ISO date)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedDate)) {
      return { success: false, error: "Invalid date format" };
    }

    const tableName = getTableName(sanitizedContractAddress, 'predictions');
    
    // Check if user already made a prediction for this date
    const existing = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()} 
      AND prediction_date = ${sanitizedDate}
    `);

    if (existing.rows.length > 0) {
      // Update existing prediction
      await db2.execute(sql`
        UPDATE ${sql.identifier(tableName)} 
        SET prediction = ${sanitizedPrediction}, created_at = NOW()
        WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()} 
        AND prediction_date = ${sanitizedDate}
      `);
    } else {
      // Create new prediction
      await db2.execute(sql`
        INSERT INTO ${sql.identifier(tableName)} (wallet_address, prediction, prediction_date)
        VALUES (${sanitizedWalletAddress.toLowerCase()}, ${sanitizedPrediction}, ${sanitizedDate})
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
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return null;
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return null;
    }
    if (!predictionDate || typeof predictionDate !== 'string') {
      return null;
    }

    // Sanitize inputs
    const sanitizedContractAddress = sanitizeString(contractAddress);
    const sanitizedWalletAddress = sanitizeString(walletAddress);
    const sanitizedDate = sanitizeString(predictionDate);

    // Validate Ethereum addresses
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      console.error("Invalid contract address format in getUserPrediction");
      return null;
    }
    if (!isValidEthereumAddress(sanitizedWalletAddress)) {
      console.error("Invalid wallet address format in getUserPrediction");
      return null;
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitizedDate)) {
      console.error("Invalid date format in getUserPrediction");
      return null;
    }

    const tableName = getTableName(sanitizedContractAddress, 'predictions');
    
    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)} 
      WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()} 
      AND prediction_date = ${sanitizedDate}
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
 * Get participants with their prediction status and email (if available)
 */
export async function getParticipantsWithDetails(
  contractAddress: string,
  predictionDate?: string
) {
  try {
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return [];
    }

    const sanitizedContractAddress = sanitizeString(contractAddress);
    
    // Validate Ethereum address
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      console.error("Invalid contract address format in getParticipantsWithDetails");
      return [];
    }

    // Use today's date if not provided
    const dateToCheck = predictionDate || new Date().toISOString().split('T')[0];
    
    const participantsTable = getTableName(sanitizedContractAddress, 'participants');
    const predictionsTable = getTableName(sanitizedContractAddress, 'predictions');
    
    // Get participants with their prediction status
    const result = await db2.execute(sql`
      SELECT 
        p.wallet_address,
        p.entry_amount,
        p.joined_at,
        pred.prediction,
        pred.prediction_date
      FROM ${sql.identifier(participantsTable)} p
      LEFT JOIN ${sql.identifier(predictionsTable)} pred 
        ON p.wallet_address = pred.wallet_address 
        AND pred.prediction_date = ${dateToCheck}
      ORDER BY p.joined_at ASC
    `);

    return result.rows;
  } catch (error) {
    console.error("Error getting participants with details:", error);
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
      getTableName(contractAddress, 'wrong_predictions'),
      getTableName(contractAddress, 'outcome_votes')
    ];

    // Drop all tables for this contract
    for (const tableName of tables) {
      try {
        await db2.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(tableName)}`);
      } catch (error) {
        console.warn(`Failed to drop table ${tableName}:`, error);
        // Continue dropping other tables even if one fails
      }
    }

    // Remove from PrivatePots registry
    await db2.delete(PrivatePots).where(eq(PrivatePots.contractAddress, contractAddress));
    
    return { success: true };
  } catch (error) {
    console.error("Error cleaning up pot tables:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// ========== VOTING SYSTEM ==========


// ========== OUTCOME VOTING ==========

/**
 * Cast a vote for the pot outcome (positive or negative)
 */
export async function castOutcomeVote(contractAddress: string, walletAddress: string, outcome: 'positive' | 'negative') {
  try {
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return { success: false, error: "Invalid contract address" };
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return { success: false, error: "Invalid wallet address" };
    }
    if (!isValidPrediction(outcome)) {
      return { success: false, error: "Invalid outcome vote" };
    }

    // Sanitize inputs
    const sanitizedContractAddress = sanitizeString(contractAddress);
    const sanitizedWalletAddress = sanitizeString(walletAddress);

    // Validate Ethereum addresses
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      return { success: false, error: "Invalid contract address format" };
    }
    if (!isValidEthereumAddress(sanitizedWalletAddress)) {
      return { success: false, error: "Invalid wallet address format" };
    }

    // Check if user is a participant
    const participantsTable = getTableName(sanitizedContractAddress, 'participants');
    const participantCheck = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(participantsTable)} 
      WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()}
    `);

    if (participantCheck.rows.length === 0) {
      return { success: false, error: "Only participants can vote on outcomes" };
    }

    const outcomeVotesTable = getTableName(sanitizedContractAddress, 'outcome_votes');

    // Check if user already voted on outcome
    const existingVote = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(outcomeVotesTable)} 
      WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()}
    `);

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await db2.execute(sql`
        UPDATE ${sql.identifier(outcomeVotesTable)}
        SET outcome_vote = ${outcome}, voted_at = NOW()
        WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()}
      `);
    } else {
      // Insert new vote
      await db2.execute(sql`
        INSERT INTO ${sql.identifier(outcomeVotesTable)} (wallet_address, outcome_vote)
        VALUES (${sanitizedWalletAddress.toLowerCase()}, ${outcome})
      `);
    }

    return { success: true };
  } catch (error) {
    console.error("Error casting outcome vote:", error);
    return { success: false, error: "Failed to cast outcome vote" };
  }
}

/**
 * Get outcome voting status for a pot
 */
export async function getOutcomeVotingStatus(contractAddress: string) {
  try {
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return null;
    }

    const sanitizedContractAddress = sanitizeString(contractAddress);
    
    if (!isValidEthereumAddress(sanitizedContractAddress)) {
      return null;
    }

    // Get total participants
    const participantsTable = getTableName(sanitizedContractAddress, 'participants');
    const participantsResult = await db2.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(participantsTable)}
    `);

    const totalParticipants = parseInt(participantsResult.rows[0]?.count as string || '0');

    // Get outcome votes
    const outcomeVotesTable = getTableName(sanitizedContractAddress, 'outcome_votes');
    const votesResult = await db2.execute(sql`
      SELECT outcome_vote, COUNT(*) as count 
      FROM ${sql.identifier(outcomeVotesTable)} 
      GROUP BY outcome_vote
    `);

    let positiveVotes = 0;
    let negativeVotes = 0;
    
    votesResult.rows.forEach((row: any) => {
      if (row.outcome_vote === 'positive') {
        positiveVotes = parseInt(row.count);
      } else if (row.outcome_vote === 'negative') {
        negativeVotes = parseInt(row.count);
      }
    });

    const totalOutcomeVotes = positiveVotes + negativeVotes;
    const requiredVotes = Math.floor(totalParticipants / 2) + 1; // More than half
    const majorityAchieved = Math.max(positiveVotes, negativeVotes) >= requiredVotes;
    const majorityOutcome = positiveVotes > negativeVotes ? 'positive' : negativeVotes > positiveVotes ? 'negative' : null;

    return {
      totalParticipants,
      totalOutcomeVotes,
      positiveVotes,
      negativeVotes,
      requiredVotes,
      majorityAchieved,
      majorityOutcome
    };
  } catch (error) {
    console.error("Error getting outcome voting status:", error);
    return null;
  }
}

/**
 * Check if user has voted on outcome
 */
export async function hasUserVotedOutcome(contractAddress: string, walletAddress: string) {
  try {
    // Input validation
    if (!contractAddress || typeof contractAddress !== 'string') {
      return false;
    }
    if (!walletAddress || typeof walletAddress !== 'string') {
      return false;
    }

    const sanitizedContractAddress = sanitizeString(contractAddress);
    const sanitizedWalletAddress = sanitizeString(walletAddress);

    if (!isValidEthereumAddress(sanitizedContractAddress) || !isValidEthereumAddress(sanitizedWalletAddress)) {
      return false;
    }

    const outcomeVotesTable = getTableName(sanitizedContractAddress, 'outcome_votes');
    const result = await db2.execute(sql`
      SELECT * FROM ${sql.identifier(outcomeVotesTable)} 
      WHERE wallet_address = ${sanitizedWalletAddress.toLowerCase()}
    `);

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error checking user outcome vote:", error);
    return null;
  }
}