"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { WrongPredictions, BitcoinBets } from "../Database/schema";
import { eq, inArray } from "drizzle-orm";

// Database setup
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

/**
 * Sets the actual Bitcoin price movement outcome for the current day.
 * @param outcome - Either "positive" or "negative".
 * @param betsTable - Table to use instead of BitcoinBets (must match its shape).
 */
export async function setDailyOutcome(
  outcome: "positive" | "negative",
  betsTable = BitcoinBets, wrongPredictionTable = WrongPredictions
) {
  const opposite = outcome === "positive" ? "negative" : "positive";

  try {
    const wrongBets = await db
      .select()
      .from(betsTable)
      .where(eq(betsTable.prediction, opposite));

    const wrongAddresses = wrongBets.map(bet => ({
      walletAddress: bet.walletAddress,
    }));

    if (wrongAddresses.length > 0) {
      await db
        .insert(wrongPredictionTable)
        .values(wrongAddresses)
        .onConflictDoNothing();

      await db
        .delete(betsTable)
        .where(inArray(betsTable.walletAddress, wrongAddresses.map(w => w.walletAddress)));
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
  betsTable = BitcoinBets, wrongPredictionTable = WrongPredictions
): Promise<boolean> {
  const [alreadyBet, isWrong] = await Promise.all([
    db.select().from(betsTable).where(eq(betsTable.walletAddress, address)),
    db.select().from(wrongPredictionTable).where(eq(wrongPredictionTable.walletAddress, address)),
  ]);

  return alreadyBet.length === 0 && isWrong.length === 0;
}

/**
 * Clears all wrong predictions.
 */
export async function clearWrongPredictions(wrongPredictionTable = WrongPredictions) {
  try {
    await db.delete(wrongPredictionTable);
    console.log("Cleared wrong_predictions table");
  } catch (err) {
    console.error("Failed to clear wrong_predictions table", err);
    throw new Error("Could not clear wrong predictions");
  }
}

/**
 * Gets the wallet addresses of users who are still in the game.
 * @param betsTable - Table to use instead of BitcoinBets (must match its shape).
 */
export async function determineWinners(betsTable = BitcoinBets) {
  try {
    const winners = await db
      .select({ walletAddress: betsTable.walletAddress })
      .from(betsTable);

    return winners.map(w => w.walletAddress).join(",");
  } catch (error) {
    console.error("Error determining winners:", error);
    throw new Error("Failed to determine winners");
  }
}
