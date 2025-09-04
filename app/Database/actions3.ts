"use server";

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, desc, asc } from 'drizzle-orm';
import { PotParticipationHistory, FeaturedBets, CryptoBets, StocksBets } from './schema';

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
 * @returns void - Directly adds user to wrong predictions table if they missed today's prediction
 */
export async function checkMissedPredictionPenalty(
  walletAddress: string,
  contractAddress: string,
  tableType: string
): Promise<void> {
  try {
    console.log(`🔍 Checking missed prediction penalty for ${walletAddress} in ${tableType} market`);

    // Get today's date and day of week
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Only Sunday has no predictions required (fresh start of the week)
    // Monday-Saturday all require predictions
    if (dayOfWeek === 0) {
      console.log(`✅ It's Sunday - no predictions required yet`);
      return;
    }

    console.log(`🗓️ Checking if ${walletAddress} made prediction for TODAY: ${todayString} (day ${dayOfWeek})`);

    const sql = neon(process.env.DATABASE_URL!);

    // STEP 1: Check if user is currently a participant in this pot
    const participantCheck = await sql`
      SELECT COUNT(*) as participant_count
      FROM pot_participation_history
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND contract_address = ${contractAddress}
      AND event_type = 'entry'
      AND NOT EXISTS (
        SELECT 1 FROM pot_participation_history ph2
        WHERE ph2.wallet_address = ${walletAddress.toLowerCase()}
        AND ph2.contract_address = ${contractAddress}
        AND ph2.event_type = 'exit'
        AND ph2.event_timestamp > pot_participation_history.event_timestamp
      )
    `;

    const isParticipant = parseInt(participantCheck[0].participant_count) > 0;
    
    if (!isParticipant) {
      console.log(`✅ User ${walletAddress} is not a participant in ${contractAddress} - no penalty check needed`);
      return;
    }

    console.log(`🎯 User ${walletAddress} IS a participant - checking penalty status...`);

    // STEP 2: Check if user is already in wrong predictions table (don't double-penalize)
    const getWrongPredictionsTable = (type: string) => {
      switch (type) {
        case 'featured': return 'wrong_Predictions';
        case 'crypto': return 'wrong_predictions_crypto';
        case 'stocks': return 'wrong_predictions_stocks';
        default: return 'wrong_Predictions';
      }
    };

    const wrongTable = getWrongPredictionsTable(tableType);
    const alreadyPenalized = await sql`
      SELECT COUNT(*) as penalty_count
      FROM ${sql(wrongTable)}
      WHERE wallet_address = ${walletAddress.toLowerCase()}
    `;

    if (parseInt(alreadyPenalized[0].penalty_count) > 0) {
      console.log(`✅ User ${walletAddress} already in wrong predictions table - no additional penalty needed`);
      return;
    }

    console.log(`🔍 User ${walletAddress} is participant and not yet penalized - checking today's prediction...`);

    // STEP 3: Get the bets table for this market type
    const getBetsTableName = (type: string) => {
      switch (type) {
        case 'featured': return 'featured_bets';
        case 'crypto': return 'crypto_bets'; 
        case 'stocks': return 'stocks_bets';
        default: return 'featured_bets';
      }
    };

    const tableName = getBetsTableName(tableType);

    // Check if they entered the pot today (if so, no penalty for missing today's prediction)
    const entryToday = await sql`
      SELECT COUNT(*) as entry_count 
      FROM pot_participation_history
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND contract_address = ${contractAddress}
      AND event_type = 'entry'
      AND event_date = ${todayString}
    `;

    const enteredToday = parseInt(entryToday[0].entry_count) > 0;
    
    if (enteredToday) {
      console.log(`✅ User ${walletAddress} entered today - no prediction penalty required`);
      return;
    }

    // Check if they made a prediction for today
    const result = await sql`
      SELECT COUNT(*) as prediction_count 
      FROM ${sql(tableName)}
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND bet_date = ${todayString}
    `;

    const predictionCount = parseInt(result[0].prediction_count);
    console.log(`📊 Found ${predictionCount} predictions for ${walletAddress} on ${todayString}`);

    if (predictionCount === 0) {
      // TODO: We should also check if they're actually in the pot before penalizing
      // For now, just add to wrong predictions - the existing reEntry logic will handle the rest
      console.log(`❌ User ${walletAddress} missed required prediction for ${todayString} - adding to wrong predictions`);
      
      await addMissedPredictionPenalty(walletAddress, tableType, todayString);
      console.log(`✅ Added ${walletAddress} to wrong predictions table for ${tableType}`);
    } else {
      console.log(`✅ User ${walletAddress} made prediction for ${todayString} - no penalty needed`);
    }

  } catch (error) {
    console.error('Error checking missed prediction penalty:', error);
    // On error, do nothing (safer to allow than incorrectly penalize)
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

// UK timezone helper functions (copied from actions.ts for consistency)
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
  const ukOffset = getUKOffset(date);
  return new Date(date.getTime() + ukOffset);
};

const getTodayUKDateString = (): string => {
  const ukTime = getUKTime();
  return ukTime.toISOString().split('T')[0];
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

const getTableFromType = (tableType: string) => {
  switch (tableType) {
    case 'featured':
      return FeaturedBets;
    case 'crypto':
      return CryptoBets;
    case 'stocks':
      return StocksBets;
    default:
      throw new Error(`Invalid table type: ${tableType}. Must be 'featured', 'crypto', or 'stocks'`);
  }
};

export async function getHourlyPredictionData(marketId: string, tableType: string) {
  try {
    // Get current time in UK timezone using Intl.DateTimeFormat (more reliable)
    const now = new Date();
    const ukFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    const ukParts = ukFormatter.formatToParts(now);
    const ukDateStr = `${ukParts.find(p => p.type === 'year')?.value}-${ukParts.find(p => p.type === 'month')?.value}-${ukParts.find(p => p.type === 'day')?.value}`;
    const currentHour = parseInt(ukParts.find(p => p.type === 'hour')?.value || '0');
    
    // Calculate tomorrow's date in UK timezone (simple string manipulation)
    const [year, month, day] = ukDateStr.split('-').map(Number);
    const ukTomorrow = new Date(year, month - 1, day + 1); // month is 0-indexed
    const tomorrowDateStr = `${ukTomorrow.getFullYear()}-${String(ukTomorrow.getMonth() + 1).padStart(2, '0')}-${String(ukTomorrow.getDate()).padStart(2, '0')}`;
    
    // Debug logging removed - function working correctly
    
    // All possible time slots (every 2 hours) with AM/PM format
    const allTimeSlots = [
      { hour: '12am', startHour: 0, endHour: 1, positive: 0, negative: 0 },
      { hour: '2am', startHour: 2, endHour: 3, positive: 0, negative: 0 },
      { hour: '4am', startHour: 4, endHour: 5, positive: 0, negative: 0 },
      { hour: '6am', startHour: 6, endHour: 7, positive: 0, negative: 0 },
      { hour: '8am', startHour: 8, endHour: 9, positive: 0, negative: 0 },
      { hour: '10am', startHour: 10, endHour: 11, positive: 0, negative: 0 },
      { hour: '12pm', startHour: 12, endHour: 13, positive: 0, negative: 0 },
      { hour: '2pm', startHour: 14, endHour: 15, positive: 0, negative: 0 },
      { hour: '4pm', startHour: 16, endHour: 17, positive: 0, negative: 0 },
      { hour: '6pm', startHour: 18, endHour: 19, positive: 0, negative: 0 },
      { hour: '8pm', startHour: 20, endHour: 21, positive: 0, negative: 0 },
      { hour: '10pm', startHour: 22, endHour: 23, positive: 0, negative: 0 },
    ];
    
    // Include all time slots - we'll show data for any slot that has predictions
    // regardless of current time, as this gives a complete view of prediction sentiment
    const timeSlots = [...allTimeSlots]; // Include all slots initially
    
    // If no complete periods yet (e.g., it's 1 AM, we're still in the first period), 
    // include at least the current period  
    if (timeSlots.length === 0) {
      timeSlots.push(allTimeSlots[0]);
    }

    const db = getDb();
    const betsTable = getTableFromType(tableType);
    
    // Query the appropriate table for tomorrow's predictions with creation time
    const bets = await db
      .select({
        prediction: betsTable.prediction,
        createdAt: betsTable.createdAt
      })
      .from(betsTable)
      .where(eq(betsTable.betDate, tomorrowDateStr));
      
    // Process each bet and assign to appropriate time slot
    bets.forEach((bet) => {
      const betDate = new Date(bet.createdAt);
      const hour = betDate.getHours(); // Get hour in 24-hour format
      
      // Find which time slot this hour belongs to
      const timeSlot = timeSlots.find(slot => hour >= slot.startHour && hour <= slot.endHour);
      
      if (timeSlot) {
        if (bet.prediction === 'positive') {
          timeSlot.positive++;
        } else if (bet.prediction === 'negative') {
          timeSlot.negative++;
        }
      }
    });

    // Calculate cumulative percentages for each time slot
    let cumulativePositive = 0;
    let cumulativeNegative = 0;
    
    const chartData = timeSlots.map(slot => {
      cumulativePositive += slot.positive;
      cumulativeNegative += slot.negative;
      
      const total = cumulativePositive + cumulativeNegative;
      
      if (total === 0) {
        return {
          time: slot.hour,
          positivePercentage: 50,
          negativePercentage: 50,
          totalPredictions: 0
        };
      }
      
      const positivePercentage = Math.round((cumulativePositive / total) * 100);
      const negativePercentage = Math.round((cumulativeNegative / total) * 100);
      
      return {
        time: slot.hour,
        positivePercentage,
        negativePercentage,
        totalPredictions: total
      };
    });

    return chartData;

  } catch (error) {
    console.error("Error getting hourly prediction data:", error);
    // Return default data structure on error - just show current period
    const currentUKTime = getUKTime();
    const currentHour = currentUKTime.getHours();
    
    // Determine current time slot (every 2 hours) in AM/PM format
    let currentTimeSlot = '12am';
    if (currentHour >= 22) currentTimeSlot = '10pm';
    else if (currentHour >= 20) currentTimeSlot = '8pm';
    else if (currentHour >= 18) currentTimeSlot = '6pm';
    else if (currentHour >= 16) currentTimeSlot = '4pm';
    else if (currentHour >= 14) currentTimeSlot = '2pm';
    else if (currentHour >= 12) currentTimeSlot = '12pm';
    else if (currentHour >= 10) currentTimeSlot = '10am';
    else if (currentHour >= 8) currentTimeSlot = '8am';
    else if (currentHour >= 6) currentTimeSlot = '6am';
    else if (currentHour >= 4) currentTimeSlot = '4am';
    else if (currentHour >= 2) currentTimeSlot = '2am';
    
    return [
      { time: currentTimeSlot, positivePercentage: 50, negativePercentage: 50, totalPredictions: 0 }
    ];
  }
}