"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { WrongPredictions, WrongPredictionsCrypto, FeaturedBets, CryptoBets } from "../Database/schema";
import { eq, inArray, lt } from "drizzle-orm";

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
      return FeaturedBets;
  }
};

const getWrongPredictionsTableFromType = (tableType: string) => {
  switch (tableType) {
    case 'featured':
      return WrongPredictions;
    case 'crypto':
      return WrongPredictionsCrypto;
    default:
      return WrongPredictions;
  }
};

// Helper function to get next day's entry fee
const getNextDayEntryFee = (): number => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = tomorrow.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
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
  tableType: string = 'bitcoin'
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
    
    // Remove all predictions for today after processing
    const today = new Date().toISOString().split('T')[0];
    await db
      .delete(betsTable)
      .where(eq(betsTable.betDate, today));
      
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
  typeTable: string = 'bitcoin'
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
export async function clearWrongPredictions(tableType: string = 'bitcoin') {
  try {
    const wrongPredictionTable = getWrongPredictionsTableFromType(tableType); // Default to Bitcoin
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
export async function determineWinners(typeTable: string = 'bitcoin') {
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
