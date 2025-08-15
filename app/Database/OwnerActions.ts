"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { WrongPredictions, WrongPredictionsCrypto, FeaturedBets, CryptoBets, LivePredictions, LiveQuestions } from "../Database/schema";
import { eq, inArray, lt, asc } from "drizzle-orm";

// Database setup
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

/**
 * Sets the actual Bitcoin price movement outcome for the current day.
 * @param outcome - Either "positive" or "negative".
 * @param betsTable - Table to use instead of BitcoinBets (must match its shape).
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

// Helper function to get current day's entry fee for re-entry
const getNextDayEntryFee = (): number => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc. (use today, not tomorrow)
  
  // Dynamic pricing: Sunday 0.01 to Friday 0.06 USDC (in micros - 6 decimals)
  const basePrices = {
    0: 10000, // Sunday: 0.01 USDC
    1: 20000, // Monday: 0.02 USDC  
    2: 30000, // Tuesday: 0.03 USDC
    3: 40000, // Wednesday: 0.04 USDC
    4: 50000, // Thursday: 0.05 USDC
    5: 60000, // Friday: 0.06 USDC
    6: 10000, // Saturday: Fallback to Sunday price
  };
  
  return basePrices[day as keyof typeof basePrices];
};

export async function setDailyOutcome(
  outcome: "positive" | "negative",
  tableType: string
) {
  const opposite = outcome === "positive" ? "negative" : "positive";
  const betsTable = getTableFromType(tableType);
  const wrongPredictionTable = getWrongPredictionsTableFromType(tableType);

  try {
    const wrongBets = await db
      .select()
      .from(betsTable)
      .where(eq(betsTable.prediction, opposite));

    if (wrongBets.length > 0) {
      const nextDayFee = getNextDayEntryFee();
      const today = new Date().toISOString().split('T')[0];
      
      const wrongAddresses = wrongBets.map(bet => ({
        walletAddress: bet.walletAddress,
        reEntryFeeUsdc: nextDayFee,
        wrongPredictionDate: today,
      }));

      await db
        .insert(wrongPredictionTable)
        .values(wrongAddresses)
        .onConflictDoNothing();

      await db
        .delete(betsTable)
        .where(inArray(betsTable.walletAddress, wrongAddresses.map(w => w.walletAddress)));
    }
    
    // Remove all predictions that were just processed (yesterday's results)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    await db
      .delete(betsTable)
      .where(eq(betsTable.betDate, yesterdayISO));
      
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
    const wrongPredictionTable = getWrongPredictionsTableFromType(tableType);
    const betsTable = getTableFromType(tableType);
    await db.delete(wrongPredictionTable);
    console.log("Cleared wrong_predictions table");
    await db.delete(betsTable);
    console.log("Cleared bets table");

  } catch (err) {
    console.error("Failed to clear tables", err);
    throw new Error("Could not clear wrong predictions");
  }
}

/**
 * Gets the wallet addresses of users who are still in the game.
 * @param betsTable - Table to use instead of BitcoinBets (must match its shape).
 */
export async function determineWinners(typeTable: string) {
  try {
    const betsTable = getTableFromType(typeTable);
    const winners = await db
      .select({ walletAddress: betsTable.walletAddress })
      .from(betsTable);

  

    return winners.map(w => w.walletAddress).join(",");
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
    
    console.log(`Question rotation: Found ${allQuestions.length} questions`);
    
    // Remove the oldest question if we have more than 1
    if (allQuestions.length > 1) {
      const questionToDelete = allQuestions[0];
      
      await db
        .delete(LiveQuestions)
        .where(eq(LiveQuestions.id, questionToDelete.id));
      
      console.log(`Question rotation: Removed completed question ID ${questionToDelete.id}`);
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
    
    console.log(`Question rotation complete: ${finalCount} questions now available`);
    
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

