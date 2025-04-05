"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { userPoints } from "./schema"; // Import the schema
import { eq, sql } from "drizzle-orm";

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