"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { userPoints, Messages, BitcoinBets } from "./schema"; // Import the schema
import { eq, sql, and } from "drizzle-orm";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

/**
 * Records 50 points for a wallet address when a swap is completed.
 * If the wallet address doesn't exist, creates a new entry with 50 points.
 * If it exists, increments the points by 50.
 */
export async function recordSwapPoints(walletAddress: string) {
  try {
    await db
      .insert(userPoints)
      .values({ walletAddress, points: 50 })
      .onConflictDoUpdate({
        target: userPoints.walletAddress,
        set: { points: sql`${userPoints.points} + 50` },
      });
  } catch (error) {
    console.error("Error recording swap points:", error);
    throw new Error("Failed to record swap points");
  }
}

/**
 * Retrieves the current points for a given wallet address.
 * Returns 0 if the wallet address doesn't exist.
 */
export async function getUserPoints(walletAddress: string): Promise<number> {
  try {
    const result = await db
      .select({ points: userPoints.points })
      .from(userPoints)
      .where(eq(userPoints.walletAddress, walletAddress))
      .limit(1);
    return result.length > 0 ? result[0].points : 0;
  } catch (error) {
    console.error("Error fetching user points:", error);
    throw new Error("Failed to fetch user points");
  }
}

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
    
    // Check if user already has a bet for today
    const existingBet = await db
      .select()
      .from(BitcoinBets)
      .where(and(
        eq(BitcoinBets.walletAddress, walletAddress),
        eq(BitcoinBets.betDate, today)
      ))
      .limit(1);

    if (existingBet.length > 0) {
      throw new Error('You have already placed a bet for today');
    }

    // Place the bet
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