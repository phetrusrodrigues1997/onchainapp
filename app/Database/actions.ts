"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {  Messages, FeaturedBets, CryptoBets } from "./schema"; // Import the schema
import { eq, sql, and } from "drizzle-orm";
import { WrongPredictions, WrongPredictionsCrypto } from "./schema";
import { ImageURLs, ReferralCodes, Referrals, FreeEntries } from "./schema";
import { desc } from "drizzle-orm";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);



/**
 * Sets a unique username for a given wallet address.
 * If the wallet address doesn't exist, creates a new entry with the username.
 * If the username is already taken, throws an error.
 */

/**
 * Stores a new image URL for a wallet address.
 * Each entry gets a timestamp automatically.
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

export async function saveImageUrl(walletAddress: string, imageUrl: string) {
  try {
    const result = await db
      .insert(ImageURLs)
      .values({
        walletAddress,
        imageUrl,
      })
      .returning();

    return result;
  } catch (error) {
    console.error("Error saving image URL:", error);
    throw new Error("Failed to save image URL");
  }
}

// export async function setUsername(walletAddress: string, newUsername: string) {
//   try {
//     await db
//       .insert(userPoints)
//       .values({ walletAddress, username: newUsername })
//       .onConflictDoUpdate({
//         target: userPoints.walletAddress,
//         set: { username: newUsername },
//       });
//   } catch (error: unknown) {
//     if (error.code === '23505' && error.constraint === 'user_points_username_key') {
//       throw new Error('Username is already taken');
//     } else {
//       console.error("Error setting username:", error);
//       throw new Error('Failed to set username');
//     }
//   }
// }

// export async function getUsername(walletAddress: string): Promise<string | null> {
//   try {
//     const result = await db
//       .select({ username: userPoints.username })
//       .from(userPoints)
//       .where(eq(userPoints.walletAddress, walletAddress))
//       .limit(1);
//     return result.length > 0 ? result[0].username : null;
//   } catch (error) {
//     console.error("Error fetching username:", error);
//     throw new Error("Failed to fetch username");
//   }
// }

/**
 * Retrieves the wallet address for a given username.
 * Returns null if the username doesn't exist.
 */
// export async function getWalletAddress(username: string): Promise<string | null> {
//   try {
//     const result = await db
//       .select({ walletAddress: userPoints.walletAddress })
//       .from(userPoints)
//       .where(eq(userPoints.username, username))
//       .limit(1);
//     return result.length > 0 ? result[0].walletAddress : null;
//   } catch (error) {
//     console.error("Error fetching wallet address:", error);
//     throw new Error("Failed to fetch wallet address");
//   }
// }

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
 * Places a Bitcoin price prediction bet for the next day.
 * Only allows one bet per wallet per prediction day.
 */

/**
 * Gets re-entry fee for a wallet address if they need to pay to re-enter
 */
export async function getReEntryFee(walletAddress: string, typeTable: string): Promise<number | null> {
  try {
    console.log(`getReEntryFee called with: ${walletAddress}, ${typeTable}`);
    const wrongPredictionTable = getWrongPredictionsTableFromType(typeTable);
    console.log(`Using table:`, wrongPredictionTable);
    
    const result = await db
      .select({ reEntryFeeUsdc: wrongPredictionTable.reEntryFeeUsdc })
      .from(wrongPredictionTable)
      .where(eq(wrongPredictionTable.walletAddress, walletAddress))
      .limit(1);
    
    console.log(`getReEntryFee result:`, result);
    return result.length > 0 ? result[0].reEntryFeeUsdc : null;
  } catch (error) {
    console.error("Error getting re-entry fee:", error);
    return null;
  }
}

/**
 * Gets all markets that require re-entry for a wallet address
 */
export async function getAllReEntryFees(walletAddress: string): Promise<{market: string, fee: number}[]> {
  try {
    const results: {market: string, fee: number}[] = [];
    
    // Check featured market
    const featuredResult = await db
      .select({ reEntryFeeUsdc: WrongPredictions.reEntryFeeUsdc })
      .from(WrongPredictions)
      .where(eq(WrongPredictions.walletAddress, walletAddress))
      .limit(1);
    
    if (featuredResult.length > 0) {
      results.push({ market: 'featured', fee: featuredResult[0].reEntryFeeUsdc });
    }
    
    // Check crypto market
    const cryptoResult = await db
      .select({ reEntryFeeUsdc: WrongPredictionsCrypto.reEntryFeeUsdc })
      .from(WrongPredictionsCrypto)
      .where(eq(WrongPredictionsCrypto.walletAddress, walletAddress))
      .limit(1);
    
    if (cryptoResult.length > 0) {
      results.push({ market: 'crypto', fee: cryptoResult[0].reEntryFeeUsdc });
    }
    
    return results;
  } catch (error) {
    console.error("Error getting all re-entry fees:", error);
    return [];
  }
}

/**
 * Debug function to check wrong predictions table usage
 */
export async function debugWrongPredictions(walletAddress: string): Promise<void> {
  try {
    console.log(`=== DEBUG: Wrong Predictions for ${walletAddress} ===`);
    
    // Check featured market (WrongPredictions table)
    const featuredResult = await db
      .select()
      .from(WrongPredictions)
      .where(eq(WrongPredictions.walletAddress, walletAddress));
    
    console.log(`Featured Market (WrongPredictions table): ${featuredResult.length} entries`);
    featuredResult.forEach((entry, i) => {
      console.log(`  ${i+1}. Fee: ${entry.reEntryFeeUsdc}, Date: ${entry.wrongPredictionDate}`);
    });
    
    // Check crypto market (WrongPredictionsCrypto table)  
    const cryptoResult = await db
      .select()
      .from(WrongPredictionsCrypto)
      .where(eq(WrongPredictionsCrypto.walletAddress, walletAddress));
    
    console.log(`Crypto Market (WrongPredictionsCrypto table): ${cryptoResult.length} entries`);
    cryptoResult.forEach((entry, i) => {
      console.log(`  ${i+1}. Fee: ${entry.reEntryFeeUsdc}, Date: ${entry.wrongPredictionDate}`);
    });
    
    console.log('=== END DEBUG ===');
  } catch (error) {
    console.error("Error in debugWrongPredictions:", error);
  }
}

/**
 * ADMIN FUNCTION: Clear wrong predictions for a specific wallet across all markets
 * This can help fix data that was created with the old buggy logic
 */
export async function clearWrongPredictionsForWallet(walletAddress: string): Promise<void> {
  try {
    console.log(`Clearing wrong predictions for wallet: ${walletAddress}`);
    
    // Clear from featured market table
    const featuredDeleted = await db
      .delete(WrongPredictions)
      .where(eq(WrongPredictions.walletAddress, walletAddress))
      .returning();
    
    // Clear from crypto market table  
    const cryptoDeleted = await db
      .delete(WrongPredictionsCrypto)
      .where(eq(WrongPredictionsCrypto.walletAddress, walletAddress))
      .returning();
    
    console.log(`Cleared ${featuredDeleted.length} entries from Featured market`);
    console.log(`Cleared ${cryptoDeleted.length} entries from Crypto market`);
    
  } catch (error) {
    console.error("Error clearing wrong predictions for wallet:", error);
    throw error;
  }
}

/**
 * Processes re-entry payment and removes user from wrong predictions
 */
export async function processReEntry(walletAddress: string, typeTable: string): Promise<boolean> {
  try {
    const wrongPredictionTable = getWrongPredictionsTableFromType(typeTable);
    const result = await db
      .delete(wrongPredictionTable)
      .where(eq(wrongPredictionTable.walletAddress, walletAddress))
      .returning();
    
    return result.length > 0;
  } catch (error) {
    console.error("Error processing re-entry:", error);
    return false;
  }
}

export async function placeBitcoinBet(walletAddress: string, prediction: 'positive' | 'negative', typeTable: string) {
  try {
    // Server-side schedule validation - betting only allowed Sunday-Friday
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    if (day === 6) {
      throw new Error('Betting is not allowed on Saturdays (Results Day).');
    }
    
    // Get tomorrow's date for the prediction
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const predictionDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const betsTable = getTableFromType(typeTable);
    const wrongPredictionTable = getWrongPredictionsTableFromType(typeTable);
    
    // 1. Check if the user has wrong predictions (but don't block - they can re-enter)
    const wrongPrediction = await db
      .select()
      .from(wrongPredictionTable)
      .where(eq(wrongPredictionTable.walletAddress, walletAddress))
      .limit(1);

    if (wrongPrediction.length > 0) {
      const reEntryFee = wrongPrediction[0].reEntryFeeUsdc;
      throw new Error(`You need to pay today's entry fee to re-enter after your wrong prediction. Please pay the re-entry fee first.`);
    }

    // 2. Check if the user already placed a bet for tomorrow
    const existingBet = await db
      .select()
      .from(betsTable)
      .where(and(
        eq(betsTable.walletAddress, walletAddress),
        eq(betsTable.betDate, predictionDate)
      ))
      .limit(1);

    if (existingBet.length > 0) {
      // 3. If a bet exists, update the prediction
      await db
        .update(betsTable)
        .set({ prediction })
        .where(and(
          eq(betsTable.walletAddress, walletAddress),
          eq(betsTable.betDate, predictionDate)
        ));
      return { updated: true, predictionDate };
    }

    // 4. Otherwise, insert new bet for tomorrow
    const result = await db
      .insert(betsTable)
      .values({
        walletAddress,
        prediction,
        betDate: predictionDate,
      })
      .returning();

    return { ...result[0], predictionDate };

  } catch (error: unknown) {
    console.error("Error placing Bitcoin prediction:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to place Bitcoin prediction");
  }
}


/**
 * Gets the user's bet for tomorrow (the active prediction).
 */
export async function getTomorrowsBet(walletAddress: string, tableType: string) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const predictionDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const betsTable = getTableFromType(tableType);
    const result = await db
      .select()
      .from(betsTable)
      .where(and(
        eq(betsTable.walletAddress, walletAddress),
        eq(betsTable.betDate, predictionDate)
      ))
      .limit(1);

    return result.length > 0 ? { ...result[0], predictionDate } : null;
  } catch (error) {
    console.error("Error fetching tomorrow's bet:", error);
    throw new Error("Failed to fetch tomorrow's bet");
  }
}

/**
 * Gets the user's bet for today (for display purposes).
 */
export async function getTodaysBet(walletAddress: string, tableType: string) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const betsTable = getTableFromType(tableType);
    const result = await db
      .select()
      .from(betsTable)
      .where(and(
        eq(betsTable.walletAddress, walletAddress),
        eq(betsTable.betDate, today)
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
export async function getBetsForDate(date: string, typeTable: string) {
  try {
    const betsTable = getTableFromType(typeTable);
    return db
      .select()
      .from(betsTable)
      .where(eq(betsTable.betDate, date));
  } catch (error) {
    console.error("Error fetching bets for date:", error);
    throw new Error("Failed to fetch bets for date");
  }

  
}

export async function getLatestImageUrl(walletAddress: string): Promise<string | null> {
  try {
    const result = await db
      .select({ imageUrl: ImageURLs.imageUrl })
      .from(ImageURLs)
      .where(eq(ImageURLs.walletAddress, walletAddress))
      .orderBy(desc(ImageURLs.createdAt))
      .limit(1);

    return result.length > 0 ? result[0].imageUrl : null;
  } catch (error) {
    console.error("Failed to retrieve image URL:", error);
    return null;
  }
}

// ====== REFERRAL SYSTEM FUNCTIONS ======

/**
 * Generates a unique referral code for a wallet address
 * Returns existing code if already exists
 */
export async function generateReferralCode(walletAddress: string): Promise<string> {
  try {
    // Check if user already has a referral code
    const existingCode = await db
      .select({ referralCode: ReferralCodes.referralCode })
      .from(ReferralCodes)
      .where(eq(ReferralCodes.walletAddress, walletAddress))
      .limit(1);

    if (existingCode.length > 0) {
      return existingCode[0].referralCode;
    }

    // Generate a new unique 8-character code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Check if code already exists
      const existing = await db
        .select()
        .from(ReferralCodes)
        .where(eq(ReferralCodes.referralCode, referralCode))
        .limit(1);
        
      isUnique = existing.length === 0;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      throw new Error("Failed to generate unique referral code");
    }

    // Save the new referral code
    await db
      .insert(ReferralCodes)
      .values({
        walletAddress,
        referralCode,
      });

    return referralCode;
  } catch (error) {
    console.error("Error generating referral code:", error);
    throw new Error("Failed to generate referral code");
  }
}

/**
 * Records a new referral when someone uses a referral code
 */
export async function recordReferral(referralCode: string, referredWallet: string): Promise<boolean> {
  try {
    // Input validation
    if (!referralCode || typeof referralCode !== 'string') {
      throw new Error("Invalid referral code format");
    }
    
    // Sanitize referral code (alphanumeric only, max 10 chars)
    const sanitizedCode = referralCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);
    if (sanitizedCode.length < 1) {
      throw new Error("Invalid referral code");
    }
    
    // Find the referrer by their referral code
    const referrer = await db
      .select({ walletAddress: ReferralCodes.walletAddress })
      .from(ReferralCodes)
      .where(eq(ReferralCodes.referralCode, sanitizedCode))
      .limit(1);

    if (referrer.length === 0) {
      throw new Error("Invalid referral code");
    }

    const referrerWallet = referrer[0].walletAddress;

    // Check if this person was already referred by this referrer
    const existingReferral = await db
      .select()
      .from(Referrals)
      .where(and(
        eq(Referrals.referrerWallet, referrerWallet),
        eq(Referrals.referredWallet, referredWallet)
      ))
      .limit(1);

    if (existingReferral.length > 0) {
      return false; // Already referred
    }

    // Record the referral
    await db
      .insert(Referrals)
      .values({
        referrerWallet,
        referredWallet,
        referralCode: sanitizedCode,
        potEntryConfirmed: false,
      });

    return true;
  } catch (error) {
    console.error("Error recording referral:", error);
    throw new Error("Failed to record referral");
  }
}

/**
 * Confirms pot entry for a referral and updates free entries if milestone reached
 */
export async function confirmReferralPotEntry(referredWallet: string): Promise<void> {
  try {
    // Update all referrals for this wallet to confirmed
    const updatedReferrals = await db
      .update(Referrals)
      .set({ 
        potEntryConfirmed: true,
        confirmedAt: new Date()
      })
      .where(and(
        eq(Referrals.referredWallet, referredWallet),
        eq(Referrals.potEntryConfirmed, false)
      ))
      .returning();

    // For each referrer, check if they've reached the milestone
    for (const referral of updatedReferrals) {
      await checkAndUpdateFreeEntries(referral.referrerWallet);
    }
  } catch (error) {
    console.error("Error confirming referral pot entry:", error);
    throw new Error("Failed to confirm referral pot entry");
  }
}

/**
 * Checks if a referrer has reached the milestone of 3 confirmed referrals
 * and awards free entries accordingly
 */
async function checkAndUpdateFreeEntries(referrerWallet: string): Promise<void> {
  try {
    // Count confirmed referrals
    const confirmedReferrals = await db
      .select()
      .from(Referrals)
      .where(and(
        eq(Referrals.referrerWallet, referrerWallet),
        eq(Referrals.potEntryConfirmed, true)
      ));

    const confirmedCount = confirmedReferrals.length;
    const freeEntriesEarned = Math.floor(confirmedCount / 3);

    if (freeEntriesEarned > 0) {
      // Check if free entries record exists
      const existingRecord = await db
        .select()
        .from(FreeEntries)
        .where(eq(FreeEntries.walletAddress, referrerWallet))
        .limit(1);

      if (existingRecord.length === 0) {
        // Create new record
        await db
          .insert(FreeEntries)
          .values({
            walletAddress: referrerWallet,
            earnedFromReferrals: freeEntriesEarned,
            usedEntries: 0,
          });
      } else {
        // Update existing record
        await db
          .update(FreeEntries)
          .set({
            earnedFromReferrals: freeEntriesEarned,
            updatedAt: new Date(),
          })
          .where(eq(FreeEntries.walletAddress, referrerWallet));
      }
    }
  } catch (error) {
    console.error("Error updating free entries:", error);
    throw new Error("Failed to update free entries");
  }
}

/**
 * Gets detailed free entries breakdown for a wallet
 */
export async function getFreeEntriesBreakdown(walletAddress: string): Promise<{
  total: number;
  fromReferrals: number;
  fromTrivia: number;
  fromWordle: number;
  used: number;
}> {
  try {
    const result = await db
      .select({
        earnedFromReferrals: FreeEntries.earnedFromReferrals,
        earnedFromTrivia: FreeEntries.earnedFromTrivia,
        earnedFromWordle: FreeEntries.earnedFromWordle,
        used: FreeEntries.usedEntries,
      })
      .from(FreeEntries)
      .where(eq(FreeEntries.walletAddress, walletAddress))
      .limit(1);

    if (result.length === 0) {
      return {
        total: 0,
        fromReferrals: 0,
        fromTrivia: 0,
        fromWordle: 0,
        used: 0,
      };
    }

    const { earnedFromReferrals, earnedFromTrivia, earnedFromWordle, used } = result[0];
    const total = earnedFromReferrals + earnedFromTrivia + earnedFromWordle;
    
    return {
      total: Math.max(0, total - used),
      fromReferrals: earnedFromReferrals,
      fromTrivia: earnedFromTrivia,
      fromWordle: earnedFromWordle,
      used,
    };
  } catch (error) {
    console.error("Error getting free entries breakdown:", error);
    return {
      total: 0,
      fromReferrals: 0,
      fromTrivia: 0,
      fromWordle: 0,
      used: 0,
    };
  }
}

/**
 * Gets the available free entries for a wallet
 */
export async function getAvailableFreeEntries(walletAddress: string): Promise<number> {
  try {
    const result = await db
      .select({
        earnedFromReferrals: FreeEntries.earnedFromReferrals,
        earnedFromTrivia: FreeEntries.earnedFromTrivia,
        earnedFromWordle: FreeEntries.earnedFromWordle,
        used: FreeEntries.usedEntries,
      })
      .from(FreeEntries)
      .where(eq(FreeEntries.walletAddress, walletAddress))
      .limit(1);

    if (result.length === 0) {
      return 0;
    }

    const { earnedFromReferrals, earnedFromTrivia, earnedFromWordle, used } = result[0];
    const totalEarned = earnedFromReferrals + earnedFromTrivia + earnedFromWordle;
    return Math.max(0, totalEarned - used);
  } catch (error) {
    console.error("Error getting available free entries:", error);
    return 0;
  }
}

/**
 * Awards a free entry for trivia game victory (100 correct answers)
 */
export async function awardTriviaFreeEntry(walletAddress: string): Promise<boolean> {
  try {
    const existingRecord = await db
      .select()
      .from(FreeEntries)
      .where(eq(FreeEntries.walletAddress, walletAddress))
      .limit(1);

    if (existingRecord.length === 0) {
      // Create new record
      await db
        .insert(FreeEntries)
        .values({
          walletAddress,
          earnedFromReferrals: 0,
          earnedFromTrivia: 1,
          earnedFromWordle: 0,
          usedEntries: 0,
        });
    } else {
      // Update existing record
      await db
        .update(FreeEntries)
        .set({
          earnedFromTrivia: sql`${FreeEntries.earnedFromTrivia} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(FreeEntries.walletAddress, walletAddress));
    }

    return true;
  } catch (error) {
    console.error("Error awarding trivia free entry:", error);
    return false;
  }
}

/**
 * Awards a free entry for wordle game victory
 */
export async function awardWordleFreeEntry(walletAddress: string): Promise<boolean> {
  try {
    const existingRecord = await db
      .select()
      .from(FreeEntries)
      .where(eq(FreeEntries.walletAddress, walletAddress))
      .limit(1);

    if (existingRecord.length === 0) {
      // Create new record
      await db
        .insert(FreeEntries)
        .values({
          walletAddress,
          earnedFromReferrals: 0,
          earnedFromTrivia: 0,
          earnedFromWordle: 1,
          usedEntries: 0,
        });
    } else {
      // Update existing record
      await db
        .update(FreeEntries)
        .set({
          earnedFromWordle: sql`${FreeEntries.earnedFromWordle} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(FreeEntries.walletAddress, walletAddress));
    }

    return true;
  } catch (error) {
    console.error("Error awarding wordle free entry:", error);
    return false;
  }
}

/**
 * Uses a free entry for pot entry
 */
export async function consumeFreeEntry(walletAddress: string): Promise<boolean> {
  try {
    const availableEntries = await getAvailableFreeEntries(walletAddress);
    
    if (availableEntries <= 0) {
      return false;
    }

    // Increment used entries
    await db
      .update(FreeEntries)
      .set({
        usedEntries: sql`${FreeEntries.usedEntries} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(FreeEntries.walletAddress, walletAddress));

    return true;
  } catch (error) {
    console.error("Error using free entry:", error);
    return false;
  }
}

/**
 * Gets referral stats for a wallet
 */
export async function getReferralStats(walletAddress: string) {
  try {
    // Get referral code
    const codeResult = await db
      .select({ referralCode: ReferralCodes.referralCode })
      .from(ReferralCodes)
      .where(eq(ReferralCodes.walletAddress, walletAddress))
      .limit(1);

    // Count total and confirmed referrals
    const referrals = await db
      .select({
        confirmed: Referrals.potEntryConfirmed,
      })
      .from(Referrals)
      .where(eq(Referrals.referrerWallet, walletAddress));

    const totalReferrals = referrals.length;
    const confirmedReferrals = referrals.filter(r => r.confirmed).length;
    
    // Get free entries info
    const freeEntriesResult = await db
      .select({
        earnedFromReferrals: FreeEntries.earnedFromReferrals,
        earnedFromTrivia: FreeEntries.earnedFromTrivia,
        earnedFromWordle: FreeEntries.earnedFromWordle,
        used: FreeEntries.usedEntries,
      })
      .from(FreeEntries)
      .where(eq(FreeEntries.walletAddress, walletAddress))
      .limit(1);

    const freeEntries = freeEntriesResult.length > 0 ? freeEntriesResult[0] : { 
      earnedFromReferrals: 0, 
      earnedFromTrivia: 0, 
      earnedFromWordle: 0, 
      used: 0 
    };

    const totalEarned = freeEntries.earnedFromReferrals + freeEntries.earnedFromTrivia + freeEntries.earnedFromWordle;

    return {
      referralCode: codeResult.length > 0 ? codeResult[0].referralCode : null,
      totalReferrals,
      confirmedReferrals,
      freeEntriesEarned: totalEarned,
      freeEntriesFromReferrals: freeEntries.earnedFromReferrals,
      freeEntriesFromTrivia: freeEntries.earnedFromTrivia,
      freeEntriesFromWordle: freeEntries.earnedFromWordle,
      freeEntriesUsed: freeEntries.used,
      freeEntriesAvailable: Math.max(0, totalEarned - freeEntries.used),
    };
  } catch (error) {
    console.error("Error getting referral stats:", error);
    return {
      referralCode: null,
      totalReferrals: 0,
      confirmedReferrals: 0,
      freeEntriesEarned: 0,
      freeEntriesFromReferrals: 0,
      freeEntriesFromTrivia: 0,
      freeEntriesFromWordle: 0,
      freeEntriesUsed: 0,
      freeEntriesAvailable: 0,
    };
  }
}



