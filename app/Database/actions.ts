"use server";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {  Messages, FeaturedBets, CryptoBets, LivePredictions, Bookmarks } from "./schema"; // Import the schema
import { eq, sql, and } from "drizzle-orm";
import { WrongPredictions, WrongPredictionsCrypto } from "./schema";
import { ENFORCE_SATURDAY_RESTRICTIONS } from "./config";
import { ReferralCodes, Referrals, FreeEntries, UsersTable } from "./schema";
import { EvidenceSubmissions, MarketOutcomes, PredictionIdeas } from "./schema";
import { desc } from "drizzle-orm";
import { getPrice } from '../Constants/getPrice';

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

// UK timezone helper functions
const getUKOffset = (date: Date): number => {
  // Create a date in UK timezone and compare to UTC
  const ukDateString = date.toLocaleString('en-GB', { 
    timeZone: 'Europe/London',
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
  
  const utcDateString = date.toLocaleString('en-GB', { 
    timeZone: 'UTC',
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
  
  // Parse both dates and find the difference
  const ukTime = new Date(ukDateString.replace(/(\d{2})\/(\d{2})\/(\d{4}), (.+)/, '$3-$2-$1 $4'));
  const utcTime = new Date(utcDateString.replace(/(\d{2})\/(\d{2})\/(\d{4}), (.+)/, '$3-$2-$1 $4'));
  
  return ukTime.getTime() - utcTime.getTime(); // Difference in milliseconds
};

const getUKTime = (date: Date = new Date()): Date => {
  const ukOffsetMs = getUKOffset(date);
  return new Date(date.getTime() + ukOffsetMs);
};

const getUKDateString = (date: Date = new Date()): string => {
  const ukTime = getUKTime(date);
  return ukTime.toLocaleDateString('en-GB', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
};

const getTomorrowUKDateString = (date: Date = new Date()): string => {
  const ukTime = getUKTime(date);
  ukTime.setDate(ukTime.getDate() + 1); // Add 1 day to UK time
  return ukTime.toLocaleDateString('en-GB', {
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
};



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
    // Normalize wallet address to lowercase for consistency
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Check if user already exists in users_table
    const existingUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.walletAddress, normalizedWalletAddress))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user's imageUrl
      const result = await db
        .update(UsersTable)
        .set({ imageUrl })
        .where(eq(UsersTable.walletAddress, normalizedWalletAddress))
        .returning();
      return result;
    } else {
      // Create new user entry with just walletAddress and imageUrl
      const result = await db
        .insert(UsersTable)
        .values({
          walletAddress: normalizedWalletAddress,
          imageUrl,
        })
        .returning();
      return result;
    }
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

// Alias for createMessage to match MessagingPage import
export async function sendMessage(from: string, to: string, message: string, datetime: string) {
  return createMessage(from, to, message, datetime);
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

// Alias for updateMessageReadStatus to match MessagingPage import
export async function markAsRead(id: number) {
  return updateMessageReadStatus(id);
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
 * Returns null if no re-entry needed, otherwise returns today's dynamic entry fee
 */
export async function getReEntryFee(walletAddress: string, typeTable: string): Promise<number | null> {
  try {
    const wrongPredictionTable = getWrongPredictionsTableFromType(typeTable);
    
    const result = await db
      .select({ walletAddress: wrongPredictionTable.walletAddress })
      .from(wrongPredictionTable)
      .where(eq(wrongPredictionTable.walletAddress, walletAddress))
      .limit(1);
    
    
    // If user has wrong prediction, return today's dynamic entry fee
    if (result.length > 0) {
      const now = new Date();
      const ukNow = getUKTime(now);
      const day = ukNow.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
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
    }
    
    return null;
  } catch (error) {
    console.error("Error getting re-entry fee:", error);
    return null;
  }
}


/**
 * Debug function to check wrong predictions table usage
 */
export async function debugWrongPredictions(walletAddress: string): Promise<void> {
  try {
    
    // Check featured market (WrongPredictions table)
    const featuredResult = await db
      .select()
      .from(WrongPredictions)
      .where(eq(WrongPredictions.walletAddress, walletAddress));
    
    
    
    
    
    
  } catch (error) {
    console.error("Error in debugWrongPredictions:", error);
  }
}


/**
 * Check if a wallet address has wrong predictions for a specific market type
 * @param walletAddress - User's wallet address
 * @param tableType - Market type: "featured" or "crypto"
 * @returns Promise<boolean> - true if user has wrong predictions, false otherwise
 */
export async function hasWrongPredictions(walletAddress: string, tableType: string): Promise<boolean> {
  try {
    const normalizedWalletAddress = walletAddress.toLowerCase();

    const wrongPredictionTable = getWrongPredictionsTableFromType(tableType);
    
    
      const result = await db
        .select()
        .from(wrongPredictionTable)
        .where(eq(wrongPredictionTable.walletAddress, normalizedWalletAddress))
        .limit(1);
      return result.length > 0;
    
    
    return false;
  } catch (error) {
    console.error("Error checking wrong predictions:", error);
    return false;
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
    // Server-side schedule validation - betting only allowed Sunday-Friday (unless testing toggle is disabled)
    if (ENFORCE_SATURDAY_RESTRICTIONS) {
      const now = new Date();
      const ukNow = getUKTime(now);
      const day = ukNow.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
      if (day === 6) {
        throw new Error('Betting is not allowed on Saturdays (Results Day).');
      }
    }
    
    // Get tomorrow's date for the prediction (in UK timezone)
    const now = new Date();
    const predictionDate = getTomorrowUKDateString(now);
    
    const betsTable = getTableFromType(typeTable);
    const wrongPredictionTable = getWrongPredictionsTableFromType(typeTable);
    
    // 1. Check if the user has wrong predictions (but don't block - they can re-enter)
    const wrongPrediction = await db
      .select()
      .from(wrongPredictionTable)
      .where(eq(wrongPredictionTable.walletAddress, walletAddress))
      .limit(1);

    if (wrongPrediction.length > 0) {
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
      // Create UK timezone timestamp for updated_at
      const ukUpdatedAt = getUKTime(now);
      
      await db
        .update(betsTable)
        .set({ 
          prediction,
          createdAt: ukUpdatedAt // Update timestamp to UK time when prediction changes
        })
        .where(and(
          eq(betsTable.walletAddress, walletAddress),
          eq(betsTable.betDate, predictionDate)
        ));
      return { updated: true, predictionDate };
    }

    // 4. Otherwise, insert new bet for tomorrow
    // Create UK timezone timestamp for created_at
    const ukCreatedAt = getUKTime(now);
    
    // DEBUG: Log timezone information
    const ukOffsetMs = getUKOffset(now);
    console.log('=== TIMEZONE DEBUG ===');
    console.log('Server time (now):', now.toISOString());
    console.log('UK time (calculated):', ukCreatedAt.toISOString());
    console.log('UK offset detected:', ukOffsetMs / (60 * 60 * 1000), 'hours');
    console.log('Current UK timezone:', ukOffsetMs === 0 ? 'GMT' : 'BST');
    console.log('Prediction date:', predictionDate);
    console.log('======================');
    
    const result = await db
      .insert(betsTable)
      .values({
        walletAddress,
        prediction,
        betDate: predictionDate,
        createdAt: ukCreatedAt, // Override default with UK timezone
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
    const predictionDate = getTomorrowUKDateString();
    
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
    const today = getUKDateString();
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
    // Normalize wallet address to lowercase for consistency
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    const result = await db
      .select({ imageUrl: UsersTable.imageUrl })
      .from(UsersTable)
      .where(eq(UsersTable.walletAddress, normalizedWalletAddress))
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

/**
 * Places a live prediction for the current question
 */
export async function placeLivePrediction(walletAddress: string, prediction: 'positive' | 'negative') {
  try {
    const today = getUKDateString();
    
    // SECURITY: Server-side pot participation validation would require contract query here
    // Currently relying on client-side validation with triple-layer security:
    // 1. UI blocks non-participants 2. handlePrediction validates 3. Real-time contract check
    console.log(`🔒 Processing live prediction for: ${walletAddress}`);
    
    // Check if user already made a prediction (no date filtering)
    const existingPrediction = await db
      .select()
      .from(LivePredictions)
      .where(eq(LivePredictions.walletAddress, walletAddress))
      .limit(1);

    if (existingPrediction.length > 0) {
      // Update existing prediction instead of blocking
      const result = await db
        .update(LivePredictions)
        .set({ prediction })
        .where(eq(LivePredictions.walletAddress, walletAddress))
        .returning();
      
      return { updated: true, alreadyExists: true, ...result[0] };
    } else {
      // Insert new prediction
      const result = await db
        .insert(LivePredictions)
        .values({
          walletAddress,
          prediction,
          betDate: today,
        })
        .returning();
      
      return { updated: false, alreadyExists: false, ...result[0] };
    }
  } catch (error) {
    console.error("Error placing live prediction:", error);
    throw new Error("Failed to place live prediction");
  }
}

export async function getUserLivePrediction(walletAddress: string) {
  try {
    // Remove date filtering to match other live prediction functions
    const result = await db
      .select()
      .from(LivePredictions)
      .where(eq(LivePredictions.walletAddress, walletAddress))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error getting user live prediction:", error);
    throw new Error("Failed to get user live prediction");
  }
}

// Wordle 24-hour cooldown functions
export async function canPlayWordle(walletAddress: string): Promise<boolean> {
  try {
    const user = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.walletAddress, walletAddress))
      .limit(1);

    if (user.length === 0) {
      // New user can play
      return true;
    }

    const lastPlay = user[0].lastWordlePlay;
    if (!lastPlay) {
      // Never played before
      return true;
    }

    // Check if 24 hours have passed
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return lastPlay < twentyFourHoursAgo;
  } catch (error) {
    console.error('Error checking Wordle eligibility:', error);
    return false;
  }
}

export async function recordWordlePlay(walletAddress: string): Promise<void> {
  try {
    const now = new Date();
    
    // Try to insert new user, or update existing user's last play time
    await db
      .insert(UsersTable)
      .values({
        walletAddress,
        lastWordlePlay: now,
        wordlePlaysToday: 1,
      })
      .onConflictDoUpdate({
        target: UsersTable.walletAddress,
        set: {
          lastWordlePlay: now,
          wordlePlaysToday: sql`${UsersTable.wordlePlaysToday} + 1`,
        },
      });
  } catch (error) {
    console.error('Error recording Wordle play:', error);
    throw error;
  }
}

export async function getLastWordlePlay(walletAddress: string): Promise<Date | null> {
  try {
    const user = await db
      .select({
        lastWordlePlay: UsersTable.lastWordlePlay
      })
      .from(UsersTable)
      .where(eq(UsersTable.walletAddress, walletAddress))
      .limit(1);

    return user.length > 0 ? user[0].lastWordlePlay : null;
  } catch (error) {
    console.error('Error getting last Wordle play:', error);
    return null;
  }
}

/**
 * Updates winner statistics after a pot is distributed
 * @param winnerAddresses - Array of winner wallet addresses
 * @param potAmountPerWinner - Amount each winner received in ETH wei (18 decimals)
 */
export async function updateWinnerStats(winnerAddresses: string[], potAmountPerWinner: bigint) {
  try {
    console.log(`Updating stats for ${winnerAddresses.length} winners, ${potAmountPerWinner} ETH wei each`);
    
    for (const address of winnerAddresses) {
      // Upsert user entry and update stats
      await db
        .insert(UsersTable)
        .values({
          walletAddress: address,
          potsWon: 1,
          totalEarningsETH: potAmountPerWinner,
        })
        .onConflictDoUpdate({
          target: UsersTable.walletAddress,
          set: {
            potsWon: sql`${UsersTable.potsWon} + 1`,
            totalEarningsETH: sql`${UsersTable.totalEarningsETH} + ${potAmountPerWinner}`,
          },
        });
    }
    
    console.log(`Successfully updated winner stats for ${winnerAddresses.length} users`);
    return true;
  } catch (error) {
    console.error("Error updating winner stats:", error);
    throw new Error("Failed to update winner stats");
  }
}

/**
 * Gets user statistics for ProfilePage
 * @param walletAddress - User's wallet address
 */
export async function getUserStats(walletAddress: string) {
  try {
    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();
    
    const user = await db
      .select({
        potsWon: UsersTable.potsWon,
        totalEarningsETH: UsersTable.totalEarningsETH, // ETH values in wei (18 decimals)
      })
      .from(UsersTable)
      .where(eq(UsersTable.walletAddress, normalizedAddress))
      .limit(1);

    if (user.length === 0) {
      return {
        potsWon: 0,
        totalEarningsETH: BigInt(0),
        totalEarnings: '$0.00', // Formatted for display
      };
    }

    // Convert ETH wei to USD for display
    const ethAmount = Number(user[0].totalEarningsETH) / 1000000000000000000; // Convert wei to ETH
    let ethPriceUSD = 4700; // Fallback ETH price
    try {
      ethPriceUSD = await getPrice('ETH') || 4700;
    } catch (error) {
      console.warn('Failed to fetch ETH price, using fallback:', error);
    }
    const earningsInDollars = ethAmount * ethPriceUSD;
    
    return {
      potsWon: user[0].potsWon,
      totalEarningsETH: user[0].totalEarningsETH,
      totalEarnings: `$${earningsInDollars.toFixed(2)}`, // Formatted for display
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return {
      potsWon: 0,
      totalEarningsETH: BigInt(0),
      totalEarnings: '$0.00',
    };
  }
}

/**
 * Get leaderboard data with top 10 users + current user's position
 * @param currentUserAddress - Address of current user to highlight them
 */
export async function getLeaderboard(currentUserAddress?: string) {
  try {
    // Get ALL users ordered by total earnings (descending), then by pots won (descending)
    const allUsers = await db
      .select({
        walletAddress: UsersTable.walletAddress,
        potsWon: UsersTable.potsWon,
        totalEarningsETH: UsersTable.totalEarningsETH,
        imageUrl: UsersTable.imageUrl,
      })
      .from(UsersTable)
      .where(sql`${UsersTable.potsWon} > 0 OR ${UsersTable.totalEarningsETH} > 0`) // Only users with activity
      .orderBy(
        sql`${UsersTable.totalEarningsETH} DESC`, 
        sql`${UsersTable.potsWon} DESC`
      );

    // Get ETH price once for all users
    let ethPriceUSD = 4700; // Fallback ETH price
    try {
      ethPriceUSD = await getPrice('ETH') || 4700;
    } catch (error) {
      console.warn('Failed to fetch ETH price for leaderboard, using fallback:', error);
    }

    // Helper function to format user data
    const formatUser = (user: any, index: number) => {
      // Convert ETH wei to USD for display
      const ethAmount = Number(user.totalEarningsETH) / 1000000000000000000; // Convert wei to ETH
      const earningsInDollars = ethAmount * ethPriceUSD;
      const rank = index + 1;
      
      // Calculate accuracy (placeholder - we'd need prediction data for real accuracy)
      const baseAccuracy = 65;
      const performanceBonus = Math.min(15, (earningsInDollars / Math.max(user.potsWon, 1)) * 2);
      const accuracy = Math.min(95, baseAccuracy + performanceBonus);
      
      return {
        rank,
        walletAddress: user.walletAddress,
        name: `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
        earnings: `$${earningsInDollars.toFixed(2)}`,
        earningsRaw: earningsInDollars,
        marketsWon: user.potsWon,
        accuracy: `${accuracy.toFixed(1)}%`,
        imageUrl: user.imageUrl || null, // Include profile image if available
        isCurrentUser: currentUserAddress ? user.walletAddress === currentUserAddress.toLowerCase() : false,
      };
    };

    // Get top 10 users
    const top10 = allUsers.slice(0, 10).map((user, index) => formatUser(user, index));

    // If we have a current user, find their position
    if (currentUserAddress) {
      const normalizedCurrentUser = currentUserAddress.toLowerCase();
      const userIndex = allUsers.findIndex(user => 
        user.walletAddress === normalizedCurrentUser
      );

      if (userIndex >= 0) {
        const userRank = userIndex + 1;
        
        // If user is not in top 10, add them separately
        if (userRank > 10) {
          const currentUser = formatUser(allUsers[userIndex], userIndex);
          
          // Return top 10 + separator + user position
          return {
            users: top10,
            currentUser: currentUser,
            showSeparator: true,
            totalUsers: allUsers.length
          };
        }
      }
    }

    // If user is in top 10 or no current user, just return top 10
    return {
      users: top10,
      currentUser: null,
      showSeparator: false,
      totalUsers: allUsers.length
    };

  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return {
      users: [],
      currentUser: null,
      showSeparator: false,
      totalUsers: 0
    };
  }
}

/**
 * Get user's rank in the leaderboard
 */
export async function getUserRank(walletAddress: string) {
  try {
    // Get all users ordered by earnings, then find the user's position
    const users = await db
      .select({
        walletAddress: UsersTable.walletAddress,
        totalEarningsETH: UsersTable.totalEarningsETH,
        potsWon: UsersTable.potsWon,
      })
      .from(UsersTable)
      .where(sql`${UsersTable.potsWon} > 0 OR ${UsersTable.totalEarningsETH} > 0`)
      .orderBy(
        sql`${UsersTable.totalEarningsETH} DESC`, 
        sql`${UsersTable.potsWon} DESC`
      );

    const userIndex = users.findIndex(user => 
      user.walletAddress === walletAddress.toLowerCase()
    );

    return userIndex >= 0 ? userIndex + 1 : null; // Return rank (1-based) or null if not found
  } catch (error) {
    console.error("Error getting user rank:", error);
    return null;
  }
}

// ========== EVIDENCE SUBMISSION SYSTEM ==========

/**
 * Input validation and sanitization functions
 */
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const isValidTableType = (tableType: string): boolean => {
  return tableType === 'featured' || tableType === 'crypto' || tableType === 'live';
};

const sanitizeString = (input: string): string => {
  // Remove null bytes, control characters, and trim whitespace
  return input.replace(/[\x00-\x1f\x7f-\x9f]/g, '').trim();
};

const isValidDateString = (dateString: string): boolean => {
  // Check if it's a valid YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  // Check if it's a valid date
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Submit evidence for disputing a market outcome
 * Includes comprehensive input validation and sanitization
 */
export async function submitEvidence(
  walletAddress: string, 
  marketType: string, 
  outcomeDate: string, 
  evidence: string,
  paymentTxHash?: string
) {
  try {
    // Input validation
    if (!walletAddress || typeof walletAddress !== 'string') {
      return { success: false, error: "Invalid wallet address" };
    }
    if (!marketType || typeof marketType !== 'string') {
      return { success: false, error: "Invalid market type" };
    }
    if (!outcomeDate || typeof outcomeDate !== 'string') {
      return { success: false, error: "Invalid outcome date" };
    }
    if (!evidence || typeof evidence !== 'string') {
      return { success: false, error: "Evidence text is required" };
    }

    // Sanitize inputs
    const sanitizedWalletAddress = sanitizeString(walletAddress);
    const sanitizedMarketType = sanitizeString(marketType);
    const sanitizedOutcomeDate = sanitizeString(outcomeDate);
    const sanitizedEvidence = sanitizeString(evidence);
    const sanitizedPaymentTxHash = paymentTxHash ? sanitizeString(paymentTxHash) : null;

    // Validate Ethereum address format
    if (!isValidEthereumAddress(sanitizedWalletAddress)) {
      return { success: false, error: "Invalid wallet address format" };
    }

    // Validate market type
    if (!isValidTableType(sanitizedMarketType)) {
      return { success: false, error: "Invalid market type. Must be 'featured' or 'crypto'" };
    }

    // Validate date format
    if (!isValidDateString(sanitizedOutcomeDate)) {
      return { success: false, error: "Invalid date format. Must be YYYY-MM-DD" };
    }

    // Validate evidence length (prevent extremely long inputs)
    if (sanitizedEvidence.length < 10) {
      return { success: false, error: "Evidence must be at least 10 characters long" };
    }
    if (sanitizedEvidence.length > 5000) {
      return { success: false, error: "Evidence must be less than 5000 characters" };
    }

    // Validate payment hash format if provided
    if (sanitizedPaymentTxHash && !isValidEthereumAddress(sanitizedPaymentTxHash)) {
      // Transaction hashes are 66 characters (0x + 64 hex chars)
      if (!/^0x[a-fA-F0-9]{64}$/.test(sanitizedPaymentTxHash)) {
        return { success: false, error: "Invalid payment transaction hash format" };
      }
    }

    // Check if market outcome exists and evidence window is active
    const marketOutcome = await db
      .select()
      .from(MarketOutcomes)
      .where(
        and(
          eq(MarketOutcomes.marketType, sanitizedMarketType),
          eq(MarketOutcomes.outcomeDate, sanitizedOutcomeDate)
        )
      )
      .limit(1);

    if (marketOutcome.length === 0) {
      return { success: false, error: "Market outcome not found" };
    }

    // Check if evidence window is still active
    const now = new Date();
    const evidenceExpiry = new Date(marketOutcome[0].evidenceWindowExpires);
    if (now > evidenceExpiry) {
      return { success: false, error: "Evidence submission window has expired" };
    }

    // Check if user has already submitted evidence for this outcome
    const existingEvidence = await db
      .select()
      .from(EvidenceSubmissions)
      .where(
        and(
          eq(EvidenceSubmissions.walletAddress, sanitizedWalletAddress.toLowerCase()),
          eq(EvidenceSubmissions.marketType, sanitizedMarketType),
          eq(EvidenceSubmissions.outcomeDate, sanitizedOutcomeDate)
        )
      )
      .limit(1);

    if (existingEvidence.length > 0) {
      return { success: false, error: "You have already submitted evidence for this outcome" };
    }

    // Insert evidence submission
    const result = await db
      .insert(EvidenceSubmissions)
      .values({
        walletAddress: sanitizedWalletAddress.toLowerCase(),
        marketType: sanitizedMarketType,
        outcomeDate: sanitizedOutcomeDate,
        evidence: sanitizedEvidence,
        paymentTxHash: sanitizedPaymentTxHash,
        status: 'pending'
      })
      .returning({ id: EvidenceSubmissions.id });

    // Mark market as disputed
    await db
      .update(MarketOutcomes)
      .set({ isDisputed: true })
      .where(
        and(
          eq(MarketOutcomes.marketType, sanitizedMarketType),
          eq(MarketOutcomes.outcomeDate, sanitizedOutcomeDate)
        )
      );

    return { 
      success: true, 
      submissionId: result[0].id,
      message: "Evidence submitted successfully" 
    };

  } catch (error) {
    console.error("Error submitting evidence:", error);
    return { success: false, error: "Failed to submit evidence. Please try again." };
  }
}

/**
 * Get user's evidence submission for a specific market outcome
 */
export async function getUserEvidenceSubmission(
  walletAddress: string, 
  marketType: string, 
  outcomeDate: string
) {
  try {
    // Input validation and sanitization
    if (!walletAddress || typeof walletAddress !== 'string') {
      return null;
    }
    if (!marketType || typeof marketType !== 'string') {
      return null;
    }
    if (!outcomeDate || typeof outcomeDate !== 'string') {
      return null;
    }

    const sanitizedWalletAddress = sanitizeString(walletAddress);
    const sanitizedMarketType = sanitizeString(marketType);
    const sanitizedOutcomeDate = sanitizeString(outcomeDate);

    if (!isValidEthereumAddress(sanitizedWalletAddress)) {
      return null;
    }
    if (!isValidTableType(sanitizedMarketType)) {
      return null;
    }
    if (!isValidDateString(sanitizedOutcomeDate)) {
      return null;
    }

    const evidence = await db
      .select({
        id: EvidenceSubmissions.id,
        evidence: EvidenceSubmissions.evidence,
        submittedAt: EvidenceSubmissions.submittedAt,
        status: EvidenceSubmissions.status,
        reviewedAt: EvidenceSubmissions.reviewedAt,
        reviewNotes: EvidenceSubmissions.reviewNotes,
      })
      .from(EvidenceSubmissions)
      .where(
        and(
          eq(EvidenceSubmissions.walletAddress, sanitizedWalletAddress.toLowerCase()),
          eq(EvidenceSubmissions.marketType, sanitizedMarketType),
          eq(EvidenceSubmissions.outcomeDate, sanitizedOutcomeDate)
        )
      )
      .limit(1);

    return evidence.length > 0 ? evidence[0] : null;

  } catch (error) {
    console.error("Error getting user evidence submission:", error);
    return null;
  }
}

/**
 * Get all evidence submissions for a market outcome (admin function)
 */
export async function getAllEvidenceSubmissions(
  marketType: string, 
  outcomeDate: string
) {
  try {
    // Input validation and sanitization
    if (!marketType || typeof marketType !== 'string') {
      return [];
    }
    if (!outcomeDate || typeof outcomeDate !== 'string') {
      return [];
    }

    const sanitizedMarketType = sanitizeString(marketType);
    const sanitizedOutcomeDate = sanitizeString(outcomeDate);

    if (!isValidTableType(sanitizedMarketType)) {
      return [];
    }
    if (!isValidDateString(sanitizedOutcomeDate)) {
      return [];
    }

    const submissions = await db
      .select()
      .from(EvidenceSubmissions)
      .where(
        and(
          eq(EvidenceSubmissions.marketType, sanitizedMarketType),
          eq(EvidenceSubmissions.outcomeDate, sanitizedOutcomeDate)
        )
      )
      .orderBy(EvidenceSubmissions.submittedAt);

    return submissions;

  } catch (error) {
    console.error("Error getting evidence submissions:", error);
    return [];
  }
}

// ==================== PREDICTION IDEAS FUNCTIONS ====================

/**
 * Submit a new prediction market idea
 */
export async function submitPredictionIdea({
  walletAddress,
  idea,
  category
}: {
  walletAddress: string;
  idea: string;
  category: string;
}) {
  try {
    // Validate inputs
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 10) {
      throw new Error('Invalid wallet address');
    }

    if (!idea || typeof idea !== 'string' || idea.trim().length < 10) {
      throw new Error('Idea must be at least 10 characters long');
    }

    if (!category || typeof category !== 'string') {
      throw new Error('Category is required');
    }

    const validCategories = ['crypto', 'stocks', 'sports', 'politics', 'entertainment', 'weather', 'tech', 'other'];
    if (!validCategories.includes(category)) {
      throw new Error('Invalid category');
    }

    // Sanitize inputs
    const sanitizedWalletAddress = walletAddress.trim().toLowerCase();
    const sanitizedIdea = idea.trim().substring(0, 500); // Limit to 500 characters
    const sanitizedCategory = category.toLowerCase();

    // Insert the idea
    const result = await db
      .insert(PredictionIdeas)
      .values({
        walletAddress: sanitizedWalletAddress,
        idea: sanitizedIdea,
        category: sanitizedCategory,
        submittedAt: new Date(),
        likes: 0,
        status: 'pending'
      })
      .returning();

    console.log('✅ Prediction idea submitted successfully:', result[0]);
    return { success: true, idea: result[0] };

  } catch (error) {
    console.error('❌ Error submitting prediction idea:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get recent prediction ideas (for community display)
 */
export async function getRecentPredictionIdeas(limit: number = 20) {
  try {
    const ideas = await db
      .select()
      .from(PredictionIdeas)
      .where(eq(PredictionIdeas.status, 'pending'))
      .orderBy(desc(PredictionIdeas.submittedAt))
      .limit(limit);

    return ideas;

  } catch (error) {
    console.error("Error getting recent prediction ideas:", error);
    return [];
  }
}

/**
 * Get prediction ideas by user wallet address
 */
export async function getUserPredictionIdeas(walletAddress: string) {
  try {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Invalid wallet address');
    }

    const sanitizedAddress = walletAddress.trim().toLowerCase();

    const ideas = await db
      .select()
      .from(PredictionIdeas)
      .where(eq(PredictionIdeas.walletAddress, sanitizedAddress))
      .orderBy(desc(PredictionIdeas.submittedAt));

    return ideas;

  } catch (error) {
    console.error("Error getting user prediction ideas:", error);
    return [];
  }
}

/**
 * Like a prediction idea (increment likes counter)
 */
export async function likePredictionIdea(ideaId: number) {
  try {
    if (!ideaId || typeof ideaId !== 'number') {
      throw new Error('Invalid idea ID');
    }

    const result = await db
      .update(PredictionIdeas)
      .set({
        likes: sql`${PredictionIdeas.likes} + 1`
      })
      .where(eq(PredictionIdeas.id, ideaId))
      .returning();

    if (result.length === 0) {
      throw new Error('Idea not found');
    }

    return { success: true, likes: result[0].likes };

  } catch (error) {
    console.error("Error liking prediction idea:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update prediction idea status (admin function)
 */
export async function updatePredictionIdeaStatus({
  ideaId,
  status,
  reviewedBy,
  reviewNotes,
  marketAddress
}: {
  ideaId: number;
  status: 'approved' | 'implemented' | 'rejected';
  reviewedBy: string;
  reviewNotes?: string;
  marketAddress?: string;
}) {
  try {
    if (!ideaId || typeof ideaId !== 'number') {
      throw new Error('Invalid idea ID');
    }

    if (!status || !['approved', 'implemented', 'rejected'].includes(status)) {
      throw new Error('Invalid status');
    }

    if (!reviewedBy || typeof reviewedBy !== 'string') {
      throw new Error('Reviewer address is required');
    }

    const updateData: any = {
      status,
      reviewedBy: reviewedBy.trim().toLowerCase(),
      reviewedAt: new Date()
    };

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes.trim();
    }

    if (status === 'implemented' && marketAddress) {
      updateData.implementedAt = new Date();
      updateData.marketAddress = marketAddress.trim();
    }

    const result = await db
      .update(PredictionIdeas)
      .set(updateData)
      .where(eq(PredictionIdeas.id, ideaId))
      .returning();

    if (result.length === 0) {
      throw new Error('Idea not found');
    }

    return { success: true, idea: result[0] };

  } catch (error) {
    console.error("Error updating prediction idea status:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get user profiles for a list of wallet addresses
 */
export async function getUserProfiles(walletAddresses: string[]) {
  try {
    if (!walletAddresses || walletAddresses.length === 0) {
      return [];
    }

    console.log('🔍 Looking for profiles for addresses:', walletAddresses);

    // Sanitize wallet addresses
    const sanitizedAddresses = walletAddresses.map(addr => addr.trim().toLowerCase());

    // Use IN clause instead of ANY for better compatibility
    const profiles = await db
      .select({
        walletAddress: UsersTable.walletAddress,
        imageUrl: UsersTable.imageUrl
      })
      .from(UsersTable)
      .where(sql`LOWER(${UsersTable.walletAddress}) IN (${sql.join(sanitizedAddresses.map(addr => sql`${addr}`), sql`, `)})`);

    console.log('📸 Found profiles:', profiles);
    return profiles;

  } catch (error) {
    console.error("Error getting user profiles:", error);
    return [];
  }
}

// Bookmark functions
export async function addBookmark(walletAddress: string, marketId: string, marketName: string, marketQuestion: string, marketCategory: string, contractAddress?: string) {
  try {
    // Check if bookmark already exists
    const existingBookmark = await db
      .select()
      .from(Bookmarks)
      .where(and(
        eq(Bookmarks.walletAddress, walletAddress),
        eq(Bookmarks.marketId, marketId)
      ))
      .limit(1);

    if (existingBookmark.length > 0) {
      console.log('📑 Bookmark already exists for market:', marketId);
      return { success: false, message: 'Market already bookmarked' };
    }

    // Add new bookmark
    await db.insert(Bookmarks).values({
      walletAddress,
      marketId,
      marketName,
      marketQuestion,
      marketCategory,
      contractAddress,
    });

    console.log('📑 Bookmark added successfully for market:', marketId);
    return { success: true, message: 'Market bookmarked successfully' };

  } catch (error) {
    console.error("Error adding bookmark:", error);
    return { success: false, message: 'Failed to add bookmark' };
  }
}

export async function removeBookmark(walletAddress: string, marketId: string) {
  try {
    await db
      .delete(Bookmarks)
      .where(and(
        eq(Bookmarks.walletAddress, walletAddress),
        eq(Bookmarks.marketId, marketId)
      ));

    console.log('📑 Bookmark removed successfully for market:', marketId);
    return { success: true, message: 'Bookmark removed successfully' };

  } catch (error) {
    console.error("Error removing bookmark:", error);
    return { success: false, message: 'Failed to remove bookmark' };
  }
}

export async function getUserBookmarks(walletAddress: string) {
  try {
    const bookmarks = await db
      .select()
      .from(Bookmarks)
      .where(eq(Bookmarks.walletAddress, walletAddress))
      .orderBy(desc(Bookmarks.bookmarkedAt));

    console.log('📑 Retrieved bookmarks for user:', walletAddress, 'Count:', bookmarks.length);
    return bookmarks;

  } catch (error) {
    console.error("Error getting user bookmarks:", error);
    return [];
  }
}

export async function isMarketBookmarked(walletAddress: string, marketId: string) {
  try {
    // Select only essential columns to avoid issues with missing contract_address column
    const bookmark = await db
      .select({
        id: Bookmarks.id,
        marketId: Bookmarks.marketId,
        walletAddress: Bookmarks.walletAddress
      })
      .from(Bookmarks)
      .where(and(
        eq(Bookmarks.walletAddress, walletAddress),
        eq(Bookmarks.marketId, marketId)
      ))
      .limit(1);

    return bookmark.length > 0;

  } catch (error) {
    console.error("Error checking bookmark status:", error);
    return false;
  }
}


