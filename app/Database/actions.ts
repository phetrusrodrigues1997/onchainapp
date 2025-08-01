"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { userPoints, Messages, BitcoinBets } from "./schema"; // Import the schema
import { eq, sql, and } from "drizzle-orm";
import { WrongPredictions } from "./schema";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);



/**
 * Sets a unique username for a given wallet address.
 * If the wallet address doesn't exist, creates a new entry with the username.
 * If the username is already taken, throws an error.
 */
export async function setUsername(walletAddress: string, newUsername: string) {
  try {
    await db
      .insert(userPoints)
      .values({ walletAddress, username: newUsername })
      .onConflictDoUpdate({
        target: userPoints.walletAddress,
        set: { username: newUsername },
      });
  } catch (error: any) {
    if (error.code === '23505' && error.constraint === 'user_points_username_key') {
      throw new Error('Username is already taken');
    } else {
      console.error("Error setting username:", error);
      throw new Error('Failed to set username');
    }
  }
}

export async function getUsername(walletAddress: string): Promise<string | null> {
  try {
    const result = await db
      .select({ username: userPoints.username })
      .from(userPoints)
      .where(eq(userPoints.walletAddress, walletAddress))
      .limit(1);
    return result.length > 0 ? result[0].username : null;
  } catch (error) {
    console.error("Error fetching username:", error);
    throw new Error("Failed to fetch username");
  }
}

/**
 * Retrieves the wallet address for a given username.
 * Returns null if the username doesn't exist.
 */
export async function getWalletAddress(username: string): Promise<string | null> {
  try {
    const result = await db
      .select({ walletAddress: userPoints.walletAddress })
      .from(userPoints)
      .where(eq(userPoints.username, username))
      .limit(1);
    return result.length > 0 ? result[0].walletAddress : null;
  } catch (error) {
    console.error("Error fetching wallet address:", error);
    throw new Error("Failed to fetch wallet address");
  }
}

export async function createMessage(from: string, to: string, message: string, datetime: string) {
  return db.insert(Messages).values({ from, to, message, datetime }).returning();
}

// Function to get unread messages for a recipient
export async function getUnreadMessages(to: string) {
  return db
    .select()
    .from(Messages)
    .where(and(eq(Messages.to, to)));
}

// Function to set a message's read status to true
export async function updateMessageReadStatus(id: number) {
  return db
    .update(Messages)
    .set({ read: true })
    .where(eq(Messages.id, id))
    .returning();
}

// New function to delete a message
export async function deleteMessage(id: number) {
  try {
    return db
      .delete(Messages)
      .where(eq(Messages.id, id))
      .returning();
  } catch (error) {
    console.error("Error deleting message:", error);
    throw new Error("Failed to delete message");
  }
}

// Function to get all messages for a user (both sent and received)
export async function getAllMessages(address: string) {
  try {
    return db
      .select()
      .from(Messages)
      .where(
        sql`${Messages.from} = ${address} OR ${Messages.to} = ${address}`
      );
  } catch (error) {
    console.error("Error fetching all messages:", error);
    throw new Error("Failed to fetch all messages");
  }
}

/**
 * Places a Bitcoin price prediction bet for today.
 * Only allows one bet per wallet per day.
 */

export async function placeBitcoinBet(walletAddress: string, prediction: 'positive' | 'negative') {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // 1. Check if the user is blocked due to wrong prediction
    const isBlocked = await db
      .select()
      .from(WrongPredictions)
      .where(eq(WrongPredictions.walletAddress, walletAddress))
      .limit(1);

    if (isBlocked.length > 0) {
      throw new Error('You are temporarily blocked from betting due to an incorrect prediction.');
    }

    // 2. Check if the user already placed a bet today
    const existingBet = await db
      .select()
      .from(BitcoinBets)
      .where(and(
        eq(BitcoinBets.walletAddress, walletAddress),
        eq(BitcoinBets.betDate, today)
      ))
      .limit(1);

    if (existingBet.length > 0) {
      // 3. If a bet exists, update the prediction
      await db
        .update(BitcoinBets)
        .set({ prediction })
        .where(and(
          eq(BitcoinBets.walletAddress, walletAddress),
          eq(BitcoinBets.betDate, today)
        ));
      return { updated: true };
    }

    // 4. Otherwise, delete all previous bets for this wallet and insert new bet
await db
  .delete(BitcoinBets)
  .where(eq(BitcoinBets.walletAddress, walletAddress))
  .execute();

return db
  .insert(BitcoinBets)
  .values({
    walletAddress,
    prediction,
    betDate: today,
  })
  .returning();


  } catch (error: any) {
    console.error("Error placing Bitcoin bet:", error);
    throw new Error(error.message || "Failed to place Bitcoin bet");
  }
}


/**
 * Gets the user's bet for today (if any).
 */
export async function getTodaysBet(walletAddress: string) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const result = await db
      .select()
      .from(BitcoinBets)
      .where(and(
        eq(BitcoinBets.walletAddress, walletAddress),
        eq(BitcoinBets.betDate, today)
      ))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error fetching today's bet:", error);
    throw new Error("Failed to fetch today's bet");
  }
}

/**
 * Gets all bets for a specific date.
 */
export async function getBetsForDate(date: string) {
  try {
    return db
      .select()
      .from(BitcoinBets)
      .where(eq(BitcoinBets.betDate, date));
  } catch (error) {
    console.error("Error fetching bets for date:", error);
    throw new Error("Failed to fetch bets for date");
  }
}