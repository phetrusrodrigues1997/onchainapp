"use server";

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, desc, asc } from 'drizzle-orm';
import { PotParticipationHistory } from './schema';

// Initialize database connection only when needed (server-side)
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  return drizzle(sql);
}

/**
 * Records when a user enters a pot
 */
export async function recordPotEntry(
  walletAddress: string,
  contractAddress: string,
  tableType: string, // 'featured', 'crypto', etc.
  eventDate: string // YYYY-MM-DD format
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 Recording pot entry for ${walletAddress} in ${tableType} pot on ${eventDate}`);
    
    await getDb().insert(PotParticipationHistory).values({
      walletAddress: walletAddress.toLowerCase(),
      contractAddress: contractAddress.toLowerCase(),
      tableType,
      eventType: 'entry',
      eventDate,
    });

    return { 
      success: true, 
      message: 'Pot entry recorded successfully' 
    };
  } catch (error) {
    console.error('Error recording pot entry:', error);
    return { 
      success: false, 
      message: 'Failed to record pot entry' 
    };
  }
}

/**
 * Records when a user exits a pot
 */
export async function recordPotExit(
  walletAddress: string,
  contractAddress: string,
  tableType: string,
  eventDate: string // YYYY-MM-DD format
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📝 Recording pot exit for ${walletAddress} from ${tableType} pot on ${eventDate}`);
    
    await getDb().insert(PotParticipationHistory).values({
      walletAddress: walletAddress.toLowerCase(),
      contractAddress: contractAddress.toLowerCase(),
      tableType,
      eventType: 'exit',
      eventDate,
    });

    return { 
      success: true, 
      message: 'Pot exit recorded successfully' 
    };
  } catch (error) {
    console.error('Error recording pot exit:', error);
    return { 
      success: false, 
      message: 'Failed to record pot exit' 
    };
  }
}

/**
 * Checks if a user was actively participating in a pot on a specific date
 * Returns true if they had entered ON OR BEFORE that date and hadn't exited
 * (Users can predict starting from their entry day - same day predictions allowed)
 */
export async function isUserActiveOnDate(
  walletAddress: string,
  contractAddress: string,
  targetDate: string // YYYY-MM-DD format
): Promise<boolean> {
  try {
    console.log(`🔍 Checking if ${walletAddress} was active on ${targetDate} in pot ${contractAddress}`);
    
    // Get all entry/exit events for this user and contract up to the target date
    const events = await getDb()
      .select()
      .from(PotParticipationHistory)
      .where(
        and(
          eq(PotParticipationHistory.walletAddress, walletAddress.toLowerCase()),
          eq(PotParticipationHistory.contractAddress, contractAddress.toLowerCase())
        )
      )
      .orderBy(asc(PotParticipationHistory.eventDate), asc(PotParticipationHistory.eventTimestamp));

    // Filter events that happened ON OR BEFORE the target date (users can predict on entry day)
    const relevantEvents = events.filter(event => event.eventDate <= targetDate);
    
    if (relevantEvents.length === 0) {
      console.log(`📊 No events found for ${walletAddress} on/before ${targetDate} - not active`);
      return false;
    }

    // Check the most recent event - if it's an entry, user is active; if exit, not active
    const mostRecentEvent = relevantEvents[relevantEvents.length - 1];
    const isActive = mostRecentEvent.eventType === 'entry';
    
    console.log(`📊 Most recent event for ${walletAddress} on/on/before ${targetDate}: ${mostRecentEvent.eventType} on ${mostRecentEvent.eventDate} - Eligible: ${isActive}`);
    
    return isActive;
  } catch (error) {
    console.error('Error checking user active status:', error);
    return false; // Default to not active on error
  }
}

/**
 * Gets all users who were eligible for making predictions on a specific date
 * (i.e., users who had entered the pot ON OR BEFORE that date and hadn't exited)
 * Users can predict starting from their entry day (same day predictions allowed)
 */
export async function getEligiblePredictors(
  contractAddress: string,
  targetDate: string // YYYY-MM-DD format
): Promise<string[]> {
  try {
    console.log(`🎯 Getting eligible predictors for pot ${contractAddress} on ${targetDate}`);
    
    // Get all entry/exit events for this contract up to the target date
    const events = await getDb()
      .select()
      .from(PotParticipationHistory)
      .where(eq(PotParticipationHistory.contractAddress, contractAddress.toLowerCase()))
      .orderBy(asc(PotParticipationHistory.eventDate), asc(PotParticipationHistory.eventTimestamp));

    // Filter events that happened ON OR BEFORE the target date (users can predict on entry day)
    const relevantEvents = events.filter(event => event.eventDate <= targetDate);
    
    if (relevantEvents.length === 0) {
      console.log(`📊 No events found for pot ${contractAddress} on/before ${targetDate}`);
      return [];
    }

    // Group events by wallet address and find the most recent event for each user
    const userEventMap = new Map<string, typeof relevantEvents[0]>();
    
    for (const event of relevantEvents) {
      const currentEvent = userEventMap.get(event.walletAddress);
      if (!currentEvent || 
          event.eventDate > currentEvent.eventDate || 
          (event.eventDate === currentEvent.eventDate && event.eventTimestamp > currentEvent.eventTimestamp)) {
        userEventMap.set(event.walletAddress, event);
      }
    }

    // Filter users whose most recent event was an entry (meaning they're active)
    const eligibleUsers = Array.from(userEventMap.entries())
      .filter(([_, event]) => event.eventType === 'entry')
      .map(([walletAddress, _]) => walletAddress);

    console.log(`📊 Found ${eligibleUsers.length} eligible predictors for ${targetDate}: ${eligibleUsers.slice(0, 3).join(', ')}${eligibleUsers.length > 3 ? '...' : ''}`);
    
    return eligibleUsers;
  } catch (error) {
    console.error('Error getting eligible predictors:', error);
    return [];
  }
}

/**
 * Gets the participation history for a specific user and contract
 * Useful for debugging and user interface displays
 */
export async function getUserParticipationHistory(
  walletAddress: string,
  contractAddress?: string
): Promise<Array<{
  id: number;
  contractAddress: string;
  tableType: string;
  eventType: 'entry' | 'exit';
  eventDate: string;
  eventTimestamp: Date;
}>> {
  try {
    console.log(`📋 Getting participation history for ${walletAddress}${contractAddress ? ` in pot ${contractAddress}` : ' (all pots)'}`);
    
    // Build the where conditions
    const whereConditions = contractAddress 
      ? and(
          eq(PotParticipationHistory.walletAddress, walletAddress.toLowerCase()),
          eq(PotParticipationHistory.contractAddress, contractAddress.toLowerCase())
        )
      : eq(PotParticipationHistory.walletAddress, walletAddress.toLowerCase());

    const events = await getDb()
      .select()
      .from(PotParticipationHistory)
      .where(whereConditions);

    const sortedEvents = events.sort((a, b) => {
      // Sort by date first, then by timestamp
      if (a.eventDate !== b.eventDate) {
        return b.eventDate.localeCompare(a.eventDate); // Descending date order
      }
      return new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime(); // Descending timestamp
    });

    console.log(`📋 Found ${sortedEvents.length} participation events for ${walletAddress}`);
    
    // Cast eventType to the correct type since we know it's either 'entry' or 'exit'
    return sortedEvents.map(event => ({
      ...event,
      eventType: event.eventType as 'entry' | 'exit'
    }));
  } catch (error) {
    console.error('Error getting user participation history:', error);
    return [];
  }
}

/**
 * Checks if a user missed making predictions they were required to make and should be penalized.
 * This function should be called when users visit the prediction page to immediately block
 * users who failed to make required predictions, rather than waiting for daily outcome processing.
 * 
 * @param walletAddress - The user's wallet address
 * @param contractAddress - The prediction pot contract address  
 * @param tableType - The table type ('featured', 'crypto', etc.)
 * @returns Object indicating if user should be blocked and why
 */
export async function checkMissedPredictionPenalty(
  walletAddress: string,
  contractAddress: string,
  tableType: string
): Promise<{
  shouldBlock: boolean;
  missedDate?: string;
  message?: string;
}> {
  try {
    console.log(`🔍 Checking missed prediction penalty for ${walletAddress} in ${tableType} market`);

    // Get the corresponding bets table for this table type
    const getBetsTableName = (type: string) => {
      switch (type) {
        case 'featured': return 'FeaturedBets';
        case 'crypto': return 'CryptoBets'; 
        case 'stocks': return 'StocksBets';
        default: return 'FeaturedBets';
      }
    };

    // Calculate yesterday's date (the day they should have made a prediction for)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`🗓️ Checking if ${walletAddress} should have predicted for ${yesterdayString}`);

    // Check if user was eligible to make predictions for yesterday
    const wasEligibleYesterday = await isUserActiveOnDate(walletAddress, contractAddress, yesterdayString);
    
    if (!wasEligibleYesterday) {
      console.log(`✅ User ${walletAddress} was not eligible for ${yesterdayString} predictions - no penalty`);
      return { shouldBlock: false };
    }

    console.log(`⚠️ User ${walletAddress} WAS eligible for ${yesterdayString} predictions - checking if they predicted...`);

    // Check if user made a prediction for yesterday in the appropriate table
    // Note: We need to import and use the actual table schemas here
    // For now, we'll use a direct SQL query approach since we can't easily import the table schemas
    
    const sql = neon(process.env.DATABASE_URL!);
    const betsTableName = getBetsTableName(tableType).toLowerCase(); // Convert to snake_case for SQL
    const actualTableName = betsTableName === 'featuredbets' ? 'featured_bets' : 
                            betsTableName === 'cryptobets' ? 'crypto_bets' :
                            betsTableName === 'stocksbets' ? 'stocks_bets' : 'featured_bets';

    const result = await sql`
      SELECT COUNT(*) as prediction_count 
      FROM ${sql(actualTableName)}
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND bet_date = ${yesterdayString}
    `;

    const predictionCount = parseInt(result[0].prediction_count);
    console.log(`📊 Found ${predictionCount} predictions for ${walletAddress} on ${yesterdayString}`);

    if (predictionCount === 0) {
      // User was eligible but didn't predict - they should be penalized
      console.log(`❌ User ${walletAddress} missed required prediction for ${yesterdayString} - adding to wrong predictions`);
      
      // Add user to wrong predictions table immediately
      const addPenaltyResult = await addMissedPredictionPenalty(walletAddress, tableType, yesterdayString);
      
      if (addPenaltyResult.success) {
        return {
          shouldBlock: true,
          missedDate: yesterdayString,
          message: `You missed making a prediction for ${yesterdayString}. Please pay today's entry fee to re-enter the pot.`
        };
      } else {
        // If we couldn't add the penalty, don't block (safer to allow than incorrectly block)
        console.error(`Failed to add penalty for ${walletAddress}: ${addPenaltyResult.message}`);
        return { shouldBlock: false };
      }
    }

    // User made predictions as required
    console.log(`✅ User ${walletAddress} made predictions as required for ${yesterdayString}`);
    return { shouldBlock: false };

  } catch (error) {
    console.error('Error checking missed prediction penalty:', error);
    // On error, don't block user (safer to allow than incorrectly block)
    return { shouldBlock: false };
  }
}

/**
 * Helper function to add a user to the wrong predictions table for missing a required prediction
 */
async function addMissedPredictionPenalty(
  walletAddress: string,
  tableType: string,
  missedDate: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🚫 Adding missed prediction penalty for ${walletAddress} (${tableType}, ${missedDate})`);

    // Import the wrong predictions tables (we need to add this import at the top)
    // For now, use direct SQL to avoid circular imports
    const sql = neon(process.env.DATABASE_URL!);
    
    const getWrongTableName = (type: string) => {
      switch (type) {
        case 'featured': return 'wrong_predictions';
        case 'crypto': return 'wrong_predictions_crypto'; 
        case 'stocks': return 'wrong_predictions_stocks';
        default: return 'wrong_predictions';
      }
    };

    const wrongTableName = getWrongTableName(tableType);

    await sql`
      INSERT INTO ${sql(wrongTableName)} (wallet_address, wrong_prediction_date, created_at)
      VALUES (${walletAddress.toLowerCase()}, ${missedDate}, NOW())
      ON CONFLICT (wallet_address, wrong_prediction_date) DO NOTHING
    `;

    console.log(`✅ Successfully added ${walletAddress} to ${wrongTableName} for ${missedDate}`);
    return { success: true, message: 'Penalty added successfully' };

  } catch (error) {
    console.error('Error adding missed prediction penalty:', error);
    return { success: false, message: 'Failed to add penalty' };
  }
}