"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { WrongPredictions, BitcoinBets } from "../Database/schema";
import { eq, inArray, sql, desc, and } from "drizzle-orm";
import { ethers, JsonRpcProvider } from "ethers";
import { values } from "lodash";

// Database setup
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);




/**
 * Sets the actual Bitcoin price movement outcome for the current day.
 * @param outcome - Either "positive" or "negative".
 */
export async function setDailyOutcome(outcome: "positive" | "negative") {
  const opposite = outcome === "positive" ? "negative" : "positive";

  try {
    // Get all users with wrong prediction
    const wrongBets = await db
      .select()
      .from(BitcoinBets)
      .where(eq(BitcoinBets.prediction, opposite));

    // Insert wrong predictors into wrong_predictions
    const wrongAddresses = wrongBets.map(bet => ({ walletAddress: bet.walletAddress }));

    if (wrongAddresses.length > 0) {
      await db
        .insert(WrongPredictions)
        .values(wrongAddresses)
        .onConflictDoNothing(); // avoid duplicate inserts

      // Remove wrong bets from BitcoinBets
      await db
  .delete(BitcoinBets)
  .where(inArray(BitcoinBets.walletAddress, wrongAddresses.map(w => w.walletAddress)));
    }

    
   
    
  } catch (error) {
    console.error("Error processing outcome:", error);
    throw new Error("Failed to set daily outcome");
  }
}


export async function canUserBet(address: string): Promise<boolean> {
  const [alreadyBet, isWrong] = await Promise.all([
    db
      .select()
      .from(BitcoinBets)
      .where(eq(BitcoinBets.walletAddress, address)),
    
    db
      .select()
      .from(WrongPredictions)
      .where(eq(WrongPredictions.walletAddress, address)),
  ]);

  return alreadyBet.length === 0 && isWrong.length === 0;
}

export async function clearWrongPredictions() {
  try {
    await db.delete(WrongPredictions);
    console.log("Cleared wrong_predictions table");
  } catch (err) {
    console.error("Failed to clear wrong_predictions table", err);
    throw new Error("Could not clear wrong predictions");
  }
}


/**
 * Determines the winners who correctly predicted all three days and writes their wallet addresses to a text file.
 */
export async function determineWinners() {
  try {
    
 

    // Find participants with correct predictions for all three days
    const winners = await db
      .select({ walletAddress: BitcoinBets.walletAddress })
      .from(BitcoinBets);

    const winnerAddresses = winners.map((w) => w.walletAddress);

    // Write winners to a text file
    const fs = require("fs");
    fs.writeFileSync("winners.txt", winnerAddresses.join(","));

    return winnerAddresses; // Optional: return winners for frontend use
  } catch (error) {
    console.error("Error determining winners:", error);
    throw new Error("Failed to determine winners");
  }
}