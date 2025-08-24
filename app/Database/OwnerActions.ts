"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { WrongPredictions, WrongPredictionsCrypto, FeaturedBets, CryptoBets, LivePredictions, LiveQuestions, UsersTable, MarketOutcomes } from "../Database/schema";
import { eq, inArray, lt, asc, sql, and } from "drizzle-orm";

// Database setup
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

/**
 * Sets the provisional outcome with 1-hour evidence window.
 * @param outcome - Either "positive" or "negative".
 * @param tableType - Table type ('featured' or 'crypto').
 */

/**
 * Sets the final outcome and processes winners immediately.
 * @param outcome - Either "positive" or "negative".
 * @param tableType - Table type ('featured' or 'crypto').
 * @param contractParticipants - List of participants from the contract.
 */

const getTableFromType = (tableType: string) => {
  switch (tableType) {
    case 'featured':
      return FeaturedBets;
    case 'crypto':
      return CryptoBets;
    default:
      throw new Error(`Invalid table type: ${tableType}. Must be 'featured' or 'crypto'`);
  }
};

const getWrongPredictionsTableFromType = (tableType: string) => {
  switch (tableType) {
    case 'featured':
      return WrongPredictions;
    case 'crypto':
      return WrongPredictionsCrypto;
    default:
      throw new Error(`Invalid table type: ${tableType}. Must be 'featured' or 'crypto'`);
  }
};


export async function setProvisionalOutcome(
  outcome: "positive" | "negative",
  tableType: string,
  outcomeDate?: string
) {
  const today = new Date();
  const targetDate = outcomeDate || today.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Calculate 1-hour evidence window expiry
  const evidenceWindowExpires = new Date(today.getTime() + 60 * 60 * 1000); // 1 hour from now

  try {
    console.log(`🟡 Setting provisional outcome for ${tableType}: ${outcome} on ${targetDate}`);
    console.log(`🟡 Evidence window expires at: ${evidenceWindowExpires.toISOString()}`);

    // Check if there's already an outcome for this market and date
    const existingOutcome = await db.select()
      .from(MarketOutcomes)
      .where(and(
        eq(MarketOutcomes.marketType, tableType),
        eq(MarketOutcomes.outcomeDate, targetDate)
      ));

    if (existingOutcome.length > 0) {
      // Update existing outcome
      const result = await db.update(MarketOutcomes)
        .set({
          provisionalOutcome: outcome,
          provisionalOutcomeSetAt: today,
          evidenceWindowExpires: evidenceWindowExpires,
          isDisputed: false // Reset dispute status
        })
        .where(eq(MarketOutcomes.id, existingOutcome[0].id));

      console.log(`Updated existing provisional outcome for ${tableType} on ${targetDate}`);
      return result;
    } else {
      // Insert new outcome record
      const result = await db.insert(MarketOutcomes).values({
        marketType: tableType,
        outcomeDate: targetDate,
        provisionalOutcome: outcome,
        evidenceWindowExpires: evidenceWindowExpires,
        isDisputed: false
      });

      console.log(`Created new provisional outcome for ${tableType} on ${targetDate}. Evidence window expires at: ${evidenceWindowExpires.toISOString()}`);
      return result;
    }
  } catch (error) {
    console.error(`❌ Error setting provisional outcome for ${tableType}:`, error);
    console.error(`❌ Error details:`, {
      outcome,
      tableType,
      targetDate,
      evidenceWindowExpires: evidenceWindowExpires.toISOString(),
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error(`Failed to set provisional outcome for ${tableType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getProvisionalOutcome(tableType: string, outcomeDate?: string) {
  const targetDate = outcomeDate || new Date().toISOString().split('T')[0]; // Today if no date provided
  
  try {
    // Get outcome record for the specified market type and date
    const result = await db.select()
      .from(MarketOutcomes)
      .where(and(
        eq(MarketOutcomes.marketType, tableType),
        eq(MarketOutcomes.outcomeDate, targetDate)
      ))
      .limit(1);

    if (result.length === 0) {
      return null; // No provisional outcome set
    }

    const outcomeData = result[0];
    const now = new Date();
    const evidenceExpiry = new Date(outcomeData.evidenceWindowExpires);
    const isWindowActive = now < evidenceExpiry;

    return {
      outcome: outcomeData.provisionalOutcome as 'positive' | 'negative',
      setAt: outcomeData.provisionalOutcomeSetAt.toISOString(), // Convert to string
      evidenceWindowExpires: evidenceExpiry.toISOString(), // Convert to string
      isEvidenceWindowActive: isWindowActive,
      finalOutcome: outcomeData.finalOutcome as 'positive' | 'negative' | null,
      isDisputed: outcomeData.isDisputed
    };
  } catch (error) {
    console.error(`Error getting provisional outcome for ${tableType}:`, error);
    throw new Error(`Failed to get provisional outcome for ${tableType}: ${error}`);
  }
}

export async function setDailyOutcome(
  outcome: "positive" | "negative",
  tableType: string,
  contractParticipants: string[] = []
) {
  const opposite = outcome === "positive" ? "negative" : "positive";
  const betsTable = getTableFromType(tableType);
  const wrongPredictionTable = getWrongPredictionsTableFromType(tableType);

  try {
    // First, update the MarketOutcomes table to mark this as the final outcome
    const today = new Date();
    const targetDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`🔴 Setting final outcome for ${tableType}: ${outcome} on ${targetDate}`);
    
    // Check if there's an existing outcome for this market and date
    const existingOutcome = await db.select()
      .from(MarketOutcomes)
      .where(and(
        eq(MarketOutcomes.marketType, tableType),
        eq(MarketOutcomes.outcomeDate, targetDate)
      ));

    if (existingOutcome.length > 0) {
      // Update existing outcome to mark it as final
      await db.update(MarketOutcomes)
        .set({
          finalOutcome: outcome,
          finalOutcomeSetAt: today,
        })
        .where(eq(MarketOutcomes.id, existingOutcome[0].id));
      
      console.log(`✅ Updated existing outcome to final for ${tableType} on ${targetDate}`);
    } else {
      // Create new outcome record (shouldn't happen in normal flow, but just in case)
      console.warn(`⚠️ No existing provisional outcome found, creating final outcome directly`);
      await db.insert(MarketOutcomes).values({
        marketType: tableType,
        outcomeDate: targetDate,
        provisionalOutcome: outcome,
        finalOutcome: outcome,
        finalOutcomeSetAt: today,
        evidenceWindowExpires: today, // Set to now since it's final
        isDisputed: false
      });
    }
    // Get all users who made predictions
    const allPredictors = await db
      .select({ walletAddress: betsTable.walletAddress })
      .from(betsTable);

    // Get all wrong predictions
    const allWrongBets = await db
      .select()
      .from(betsTable)
      .where(eq(betsTable.prediction, opposite));

    // Filter to only include wrong predictions from current pot participants
    let wrongBets = allWrongBets;
    if (contractParticipants.length > 0) {
      const normalizedParticipants = contractParticipants.map(addr => addr.toLowerCase());
      wrongBets = allWrongBets.filter(bet => 
        normalizedParticipants.includes(bet.walletAddress.toLowerCase())
      );
      
      
      // Find participants who didn't predict (these will be eliminated)
      const nonPredictors = contractParticipants.filter(participant => 
        !allPredictors.some(predictor => predictor.walletAddress.toLowerCase() === participant.toLowerCase())
      );
      
      // Add non-predictors to wrong predictions table so they must pay re-entry fee
      if (nonPredictors.length > 0) {
        
        const todayDateString = targetDate; // Use the same date string we calculated above
        
        const nonPredictorRecords = nonPredictors.map(participant => ({
          walletAddress: participant,
          wrongPredictionDate: todayDateString,
        }));

        await db
          .insert(wrongPredictionTable)
          .values(nonPredictorRecords)
          .onConflictDoNothing();
          
      }
    } else {
      console.warn("No contract participants provided to setDailyOutcome - using old logic (potential exploit!)");
    }

    if (wrongBets.length > 0) {
      const wrongPredictionDate = targetDate; // Use the same date string we calculated above
      
      const wrongAddresses = wrongBets.map(bet => ({
        walletAddress: bet.walletAddress,
        wrongPredictionDate: wrongPredictionDate,
      }));

      await db
        .insert(wrongPredictionTable)
        .values(wrongAddresses)
        .onConflictDoNothing();

      await db
        .delete(betsTable)
        .where(inArray(betsTable.walletAddress, wrongAddresses.map(w => w.walletAddress)));
    }
    
    // Only clear ALL predictions on non-Saturday days
    // On Saturday, keep correct predictions for winner determination
    const currentDay = new Date();
    const dayOfWeek = currentDay.getUTCDay(); // 0 = Sunday, 6 = Saturday
    
    if (dayOfWeek !== 6) {
      // Clear ALL processed predictions (both right and wrong have been handled)
      await db
        .delete(betsTable)
        .where(inArray(betsTable.walletAddress, allPredictors.map(p => p.walletAddress)));
    } else {
      console.log("Saturday detected - keeping correct predictions in table for winner determination");
    }
      
  } catch (error) {
    console.error("Error processing outcome:", error);
    throw new Error("Failed to set daily outcome");
  }
}

/**
 * Checks if a user is eligible to bet.
 * @param address - Wallet address.
 * @param betsTable - Table to use instead of BitcoinBets (must match its shape).
 */
export async function canUserBet(
  address: string,
  typeTable: string
): Promise<boolean> {
  const betsTable = getTableFromType(typeTable);
  const wrongPredictionTable = getWrongPredictionsTableFromType(typeTable);
  const [alreadyBet, isWrong] = await Promise.all([
    db.select().from(betsTable).where(eq(betsTable.walletAddress, address)),
    db.select().from(wrongPredictionTable).where(eq(wrongPredictionTable.walletAddress, address)),
  ]);

  return alreadyBet.length === 0 && isWrong.length === 0;
}

/**
 * Clears all wrong predictions.
 */
export async function clearWrongPredictions(tableType: string) {
  try {
    console.log(`🧹 Starting clearWrongPredictions for tableType: ${tableType}`);
    const wrongPredictionTable = getWrongPredictionsTableFromType(tableType);
    const betsTable = getTableFromType(tableType);
    
    console.log(`🗑️ Clearing wrong predictions table...`);
    const wrongPredictionsResult = await db.delete(wrongPredictionTable);
    console.log(`✅ Cleared wrong predictions table, affected rows:`, wrongPredictionsResult);
    
    console.log(`🗑️ Clearing bets table (${tableType})...`);
    const betsTableResult = await db.delete(betsTable);
    console.log(`✅ Cleared bets table, affected rows:`, betsTableResult);
    
    console.log(`🎉 Successfully cleared both tables for ${tableType}`);
  } catch (err) {
    console.error("❌ Failed to clear tables", err);
    throw new Error("Could not clear wrong predictions");
  }
}

/**
 * Gets the wallet addresses of users who are still in the game.
 * Only considers participants who are BOTH in the pot AND made predictions.
 * Note: Non-predictor elimination is now handled in setDailyOutcome().
 * @param typeTable - Table type ('featured' or 'crypto')
 * @param contractParticipants - Array of wallet addresses currently in the pot contract
 */
export async function determineWinners(typeTable: string, contractParticipants: string[] = []) {
  try {
    const betsTable = getTableFromType(typeTable);
    
    // Get all users who made predictions
    const allPredictors = await db
      .select({ walletAddress: betsTable.walletAddress })
      .from(betsTable);

    // If no contract participants provided, fall back to old behavior (for backward compatibility)
    if (contractParticipants.length === 0) {
      console.warn("No contract participants provided - using old logic (potential exploit!)");
      return allPredictors.map(w => w.walletAddress).join(",");
    }

    // Normalize addresses to lowercase for comparison
    const normalizedParticipants = contractParticipants.map(addr => addr.toLowerCase());
    
    // Filter to only include predictors who are also pot participants
    const eligibleWinners = allPredictors.filter(predictor => 
      normalizedParticipants.includes(predictor.walletAddress.toLowerCase())
    );


    return eligibleWinners.map(w => w.walletAddress).join(",");
  } catch (error) {
    console.error("Error determining winners:", error);
    throw new Error("Failed to determine winners");
  }
}

/**
 * Gets the wallet addresses of users who made correct live predictions.
 * This function should be called after manually determining the correct answer for the live question.
 * Also rotates to the next question by removing the current one and generating a new one.
 * @param correctAnswer - Either "positive" or "negative" - the correct answer for the live question
 */
export async function determineWinnersLive(correctAnswer: "positive" | "negative") {
  try {
    console.log(`Looking for winners with prediction: ${correctAnswer}`);
    
    // Get all users who predicted correctly (no date filtering)
    const winners = await db
      .select({ walletAddress: LivePredictions.walletAddress })
      .from(LivePredictions)
      .where(eq(LivePredictions.prediction, correctAnswer));

    console.log(`Found ${winners.length} winners for ${correctAnswer} prediction`);

    // After determining winners, rotate to next question
    await rotateToNextQuestion();

    return winners.map(w => w.walletAddress).join(",");
  } catch (error) {
    console.error("Error determining live prediction winners:", error);
    throw new Error("Failed to determine live prediction winners");
  }
}

/**
 * Rotates to the next question by removing the current (oldest) question and generating a new one
 */
async function rotateToNextQuestion() {
  try {
    // Get all questions ordered by creation time (oldest first)
    const allQuestions = await db
      .select()
      .from(LiveQuestions)
      .orderBy(asc(LiveQuestions.id));
    
    
    // Remove the oldest question if we have more than 1
    if (allQuestions.length > 1) {
      const questionToDelete = allQuestions[0];
      
      await db
        .delete(LiveQuestions)
        .where(eq(LiveQuestions.id, questionToDelete.id));
      
    } else {
      console.log('Question rotation: Only 1 question found, keeping it and adding another');
    }
    
    // Generate one new question to maintain supply
    const { generateQuestionBatch } = await import('../Services/questionGenerator');
    const questionBatch: { question: string }[] = await generateQuestionBatch(1);
    
    if (questionBatch.length > 0) {
      await db
        .insert(LiveQuestions)
        .values({
          question: questionBatch[0].question,
        });
      
      console.log(`Question rotation: Generated new question: "${questionBatch[0].question}"`);
    }
    
    const finalCount = await db
      .select()
      .from(LiveQuestions)
      .then(result => result.length);
    
    
  } catch (error) {
    console.error('Error during question rotation:', error);
    throw new Error('Failed to rotate to next question');
  }
}

/**
 * Clears all live predictions (no date filtering - matches the determineWinnersLive logic)
 */
export async function clearLivePredictions() {
  try {
    // Clear ALL predictions (no date filtering)
    await db
      .delete(LivePredictions);
      
    console.log("Cleared all live predictions");
  } catch (error) {
    console.error("Failed to clear live predictions:", error);
    throw new Error("Could not clear live predictions");
  }
}

/**
 * Updates winner statistics after a pot is distributed
 * This should be called AFTER the smart contract distributes the pot
 * @param winnerAddresses - Array of winner wallet addresses (from determineWinners)
 * @param potAmountPerWinner - Amount each winner received in ETH wei (18 decimals)
 */
export async function updateWinnerStats(winnerAddresses: string[], potAmountPerWinner: bigint) {
  try {
    console.log(`🔍 updateWinnerStats called with:`, { winnerAddresses, potAmountPerWinner });
    console.log(`Updating stats for ${winnerAddresses.length} winners, ${potAmountPerWinner} ETH wei each`);
    
    // Ensure we have an array of addresses
    const addresses = Array.isArray(winnerAddresses) ? winnerAddresses : [];
    
    console.log(`📍 Processing addresses:`, addresses);
    
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      if (!address) {
        console.log(`⚠️ Skipping empty address at index ${i}`);
        continue;
      }
      
      console.log(`📝 Updating stats for address ${i + 1}/${addresses.length}: ${address}`);
      
      // Normalize wallet address to lowercase for consistency with profile image saving
      const normalizedAddress = address.toLowerCase();
      
      // First check if user exists
      const existingUser = await db
        .select()
        .from(UsersTable)
        .where(eq(UsersTable.walletAddress, normalizedAddress))
        .limit(1);
      
      let result;
      if (existingUser.length > 0) {
        // Update existing user
        console.log(`📝 User ${normalizedAddress} exists, updating stats...`);
        result = await db
          .update(UsersTable)
          .set({
            potsWon: sql`${UsersTable.potsWon} + 1`,
            totalEarningsETH: sql`${UsersTable.totalEarningsETH} + ${potAmountPerWinner}`,
          })
          .where(eq(UsersTable.walletAddress, normalizedAddress))
          .returning();
      } else {
        // Insert new user
        console.log(`📝 User ${normalizedAddress} doesn't exist, creating new entry...`);
        result = await db
          .insert(UsersTable)
          .values({
            walletAddress: normalizedAddress,
            potsWon: 1,
            totalEarningsETH: potAmountPerWinner,
          })
          .returning();
      }
      
      console.log(`✅ Updated user ${address}:`, result);
    }
    
    console.log(`✅ Successfully updated winner stats for ${addresses.length} users`);
    return true;
  } catch (error) {
    console.error("❌ Error updating winner stats:", error);
    throw new Error("Failed to update winner stats");
  }
}

/**
 * Gets all wrong predictions for a specific market type (to remove from contract)
 * @param tableType - Table type ('featured' or 'crypto')
 */
export async function getWrongPredictions(tableType: string): Promise<string[]> {
  try {
    const wrongPredictionTable = getWrongPredictionsTableFromType(tableType);
    const wrongPredictions = await db
      .select({ walletAddress: wrongPredictionTable.walletAddress })
      .from(wrongPredictionTable);
    
    return wrongPredictions.map(wp => wp.walletAddress);
  } catch (error) {
    console.error("Error getting wrong predictions:", error);
    return [];
  }
}

