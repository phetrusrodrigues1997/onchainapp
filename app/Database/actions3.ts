"use server";

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, desc, asc } from 'drizzle-orm';
import { PotParticipationHistory, FeaturedBets, CryptoBets, StocksBets, UserPredictionHistory } from './schema';
import { getBetsTableName, getWrongPredictionsTableName, TableType } from './config';

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
 * Records when a user re-enters a pot after paying penalty
 */
export async function recordPotReEntry(
  walletAddress: string,
  contractAddress: string,
  tableType: string, // 'featured', 'crypto', etc.
  eventDate: string // YYYY-MM-DD format
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🔄 Recording pot re-entry for ${walletAddress} in ${tableType} pot on ${eventDate}`);
    
    await getDb().insert(PotParticipationHistory).values({
      walletAddress: walletAddress.toLowerCase(),
      contractAddress: contractAddress.toLowerCase(),
      tableType,
      eventType: 're-entry',
      eventDate,
    });

    return { 
      success: true, 
      message: 'Pot re-entry recorded successfully' 
    };
  } catch (error) {
    console.error('Error recording pot re-entry:', error);
    return { 
      success: false, 
      message: 'Failed to record pot re-entry' 
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
  tableType: TableType
): Promise<void> {
  try {
    console.log(`🔍 === STARTING PENALTY CHECK ===`);
    console.log(`🔍 Wallet: ${walletAddress}`);
    console.log(`🔍 Contract: ${contractAddress}`);
    console.log(`🔍 Market Type: ${tableType}`);

    // Get today's date and day of week
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    console.log(`🔍 Today: ${todayString}, Day of week: ${dayOfWeek} (0=Sunday, 1=Monday, etc.)`);

    // Only Sunday has no predictions required (fresh start of the week)
    // Monday-Saturday all require predictions
    if (dayOfWeek === 0) {
      console.log(`✅ It's Sunday - no predictions required yet, EXITING`);
      return;
    }

    console.log(`🔍 Not Sunday - continuing penalty check...`);

    console.log(`🗓️ Checking if ${walletAddress} made prediction for TODAY: ${todayString} (day ${dayOfWeek})`);

    const sql = neon(process.env.DATABASE_URL!);

    // STEP 1: Check if user is currently a participant in this pot
    console.log(`🔍 STEP 1: Checking participation for wallet: ${walletAddress.toLowerCase()}, contract: ${contractAddress}`);
    
    // First, let's see ALL entries for this user/contract combo for debugging
    const allEntries = await sql`
      SELECT event_type, event_date, event_timestamp, wallet_address, contract_address
      FROM pot_participation_history
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND contract_address = ${contractAddress.toLowerCase()}
      ORDER BY event_timestamp DESC
    `;
    
    console.log(`🔍 All participation history for this user/contract:`, allEntries);
    
    // Let's also check what entries exist for just this wallet (any contract)
    const walletEntries = await sql`
      SELECT event_type, event_date, event_timestamp, wallet_address, contract_address
      FROM pot_participation_history
      WHERE wallet_address = ${walletAddress.toLowerCase()}
      ORDER BY event_timestamp DESC
      LIMIT 5
    `;
    
    console.log(`🔍 Recent entries for this wallet (any contract):`, walletEntries);
    
    // And let's check what entries exist for just this contract (any wallet)
    const contractEntries = await sql`
      SELECT event_type, event_date, event_timestamp, wallet_address, contract_address
      FROM pot_participation_history
      WHERE contract_address = ${contractAddress}
      ORDER BY event_timestamp DESC
      LIMIT 5
    `;
    
    console.log(`🔍 Recent entries for this contract (any wallet):`, contractEntries);
    
    // Simplified participation check - just check if they have any entry without a later exit
    const participantCheck = await sql`
      SELECT COUNT(*) as participant_count
      FROM pot_participation_history
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND contract_address = ${contractAddress.toLowerCase()}
      AND event_type = 'entry'
      AND NOT EXISTS (
        SELECT 1 FROM pot_participation_history ph2
        WHERE ph2.wallet_address = ${walletAddress.toLowerCase()}
        AND ph2.contract_address = ${contractAddress.toLowerCase()}
        AND ph2.event_type = 'exit'
        AND ph2.event_timestamp > pot_participation_history.event_timestamp
      )
    `;

    console.log(`🔍 Participation query result:`, participantCheck);
    const isParticipant = parseInt(participantCheck[0].participant_count) > 0;
    console.log(`🔍 Is participant? ${isParticipant} (count: ${participantCheck[0].participant_count})`);
    
    if (!isParticipant) {
      console.log(`❌ User ${walletAddress} is not showing as participant in ${contractAddress} - this might be incorrect!`);
      console.log(`🔍 Debug: Check the participation history above to see if there's an issue with the query logic`);
      return;
    }

    console.log(`🎯 User ${walletAddress} IS a participant - checking penalty status...`);

    // STEP 2: Check if user is already in wrong predictions table (don't double-penalize)
    console.log(`🔍 STEP 2: Checking if already penalized for table type: ${tableType}`);
    
    const wrongTable = getWrongPredictionsTableName(tableType);
    console.log(`🔍 Using wrong predictions table: ${wrongTable}`);
    
    // Use template string for table name since sql.identifier doesn't exist in Neon
    // Note: wrong predictions tables use "walletAddress" column (camelCase)
    const alreadyPenalized = await sql(
      `SELECT COUNT(*) as penalty_count
       FROM "${wrongTable}"
       WHERE "walletAddress" = $1`,
      [walletAddress.toLowerCase()]
    );

    console.log(`🔍 Already penalized query result:`, alreadyPenalized);
    const penaltyCount = parseInt(alreadyPenalized[0].penalty_count);
    console.log(`🔍 Penalty count: ${penaltyCount}`);

    if (penaltyCount > 0) {
      console.log(`✅ User ${walletAddress} already in wrong predictions table - no additional penalty needed`);
      return;
    }

    console.log(`🔍 User ${walletAddress} is participant and not yet penalized - checking today's prediction...`);

    // STEP 3: Get the bets table for this market type
    const tableName = getBetsTableName(tableType);

    // Check if they entered or re-entered the pot today (if so, no penalty for missing today's prediction)
    console.log(`🔍 STEP 4: Checking if user entered/re-entered today (${todayString})`);
    
    const entryToday = await sql`
      SELECT COUNT(*) as entry_count 
      FROM pot_participation_history
      WHERE wallet_address = ${walletAddress.toLowerCase()} 
      AND contract_address = ${contractAddress.toLowerCase()}
      AND event_type IN ('entry', 're-entry')
      AND event_date = ${todayString}
    `;

    console.log(`🔍 Entry today query result:`, entryToday);
    const enteredToday = parseInt(entryToday[0].entry_count) > 0;
    console.log(`🔍 Entered today? ${enteredToday} (count: ${entryToday[0].entry_count})`);
    
    if (enteredToday) {
      console.log(`✅ User ${walletAddress} entered or re-entered today - no prediction penalty required`);
      return;
    }

    // Check if they made a prediction for today
    console.log(`🔍 STEP 5: Checking predictions for table: ${tableName}, date: ${todayString}`);
    
    // Use template string for table name
    const result = await sql(
      `SELECT COUNT(*) as prediction_count 
       FROM ${tableName}
       WHERE wallet_address = $1 
       AND bet_date = $2`,
      [walletAddress.toLowerCase(), todayString]
    );

    console.log(`🔍 Prediction query result:`, result);
    const predictionCount = parseInt(result[0].prediction_count);
    console.log(`📊 Found ${predictionCount} predictions for ${walletAddress} on ${todayString} in ${tableName}`);

    if (predictionCount === 0) {
      console.log(`❌ PENALTY REQUIRED: User ${walletAddress} missed required prediction for ${todayString}`);
      console.log(`🔍 Calling addMissedPredictionPenalty with params:`, {
        walletAddress,
        tableType,
        todayString
      });
      
      await addMissedPredictionPenalty(walletAddress, tableType, todayString);
      console.log(`✅ Successfully added ${walletAddress} to wrong predictions table for ${tableType}`);
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
  tableType: TableType,
  missedDate: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🚫 STARTING addMissedPredictionPenalty for ${walletAddress} (${tableType}, ${missedDate})`);

    // Import the wrong predictions tables (we need to add this import at the top)
    // For now, use direct SQL to avoid circular imports
    const sql = neon(process.env.DATABASE_URL!);
    
    const wrongTableName = getWrongPredictionsTableName(tableType);
    console.log(`🔍 Using wrong table name: ${wrongTableName} for table type: ${tableType}`);
    console.log(`🔍 About to insert:`, {
      wallet_address: walletAddress.toLowerCase(),
      wrong_prediction_date: missedDate,
      table: wrongTableName
    });

    // Use template string for table name
    // Note: wrong predictions tables use "walletAddress" and "wrong_prediction_date" columns
    const insertResult = await sql(
      `INSERT INTO "${wrongTableName}" ("walletAddress", wrong_prediction_date, created_at)
       VALUES ($1, $2, NOW())
       RETURNING "walletAddress", wrong_prediction_date`,
      [walletAddress.toLowerCase(), missedDate]
    );

    console.log(`🔍 Insert result:`, insertResult);
    console.log(`✅ Successfully added ${walletAddress} to ${wrongTableName} for ${missedDate}`);
    return { success: true, message: 'Penalty added successfully' };

  } catch (error) {
    console.error('❌ Error adding missed prediction penalty:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
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

export async function clearPotParticipationHistory(contract: string) {
  await getDb()
    .delete(PotParticipationHistory)
    .where(eq(PotParticipationHistory.contractAddress, contract.toLowerCase()));
    console.log(`🧹 Clearing pot participation history for contract: ${contract.toLowerCase()}`);
}

/**
 * Records a user's prediction in the prediction history table
 * This provides a comprehensive log of all predictions made by users with question context
 */
export async function recordUserPrediction(
  walletAddress: string,
  questionName: string,
  prediction: 'positive' | 'negative',
  contractAddress: string,
  predictionDate: string // YYYY-MM-DD format
): Promise<{ success: boolean; message: string }> {
  try {
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const normalizedContractAddress = contractAddress.toLowerCase();
    console.log(`📝 Recording prediction: ${normalizedWalletAddress} predicted ${prediction} for ${questionName} (${normalizedContractAddress}) on ${predictionDate}`);
    
    // Check if user already has a prediction for this question and date
    const existingPrediction = await getDb()
      .select()
      .from(UserPredictionHistory)
      .where(
        and(
          eq(UserPredictionHistory.walletAddress, normalizedWalletAddress),
          eq(UserPredictionHistory.questionName, questionName),
          eq(UserPredictionHistory.predictionDate, predictionDate)
        )
      )
      .limit(1);

    if (existingPrediction.length > 0) {
      // Update existing prediction
      await getDb()
        .update(UserPredictionHistory)
        .set({
          prediction,
          contractAddress: normalizedContractAddress, // Update contract address in case it changed
          createdAt: new Date(), // Update timestamp to reflect the change
        })
        .where(
          and(
            eq(UserPredictionHistory.walletAddress, normalizedWalletAddress),
            eq(UserPredictionHistory.questionName, questionName),
            eq(UserPredictionHistory.predictionDate, predictionDate)
          )
        );

      console.log(`✅ Updated existing prediction for ${normalizedWalletAddress}: ${prediction} on ${questionName}`);
      return { 
        success: true, 
        message: 'Prediction updated successfully' 
      };
    } else {
      // Insert new prediction
      await getDb().insert(UserPredictionHistory).values({
        walletAddress: normalizedWalletAddress,
        questionName,
        prediction,
        contractAddress: normalizedContractAddress,
        predictionDate,
      });

      console.log(`✅ Inserted new prediction for ${normalizedWalletAddress}: ${prediction} on ${questionName}`);
      return { 
        success: true, 
        message: 'Prediction recorded successfully' 
      };
    }
  } catch (error) {
    console.error('Error recording user prediction:', error);
    return { 
      success: false, 
      message: 'Failed to record prediction' 
    };
  }
}

/**
 * Gets all predictions made by a specific wallet address for a specific contract
 * Returns the question names and predictions for analysis
 */
export async function getUserPredictionsByContract(
  walletAddress: string,
  contractAddress: string
): Promise<Array<{
  questionName: string;
  prediction: 'positive' | 'negative';
  predictionDate: string;
  createdAt: Date;
}>> {
  try {
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const normalizedContractAddress = contractAddress.toLowerCase();
    
    console.log(`🔍 Getting predictions for wallet: ${normalizedWalletAddress}, contract: ${normalizedContractAddress}`);
    
    const predictions = await getDb()
      .select({
        questionName: UserPredictionHistory.questionName,
        prediction: UserPredictionHistory.prediction,
        predictionDate: UserPredictionHistory.predictionDate,
        createdAt: UserPredictionHistory.createdAt,
      })
      .from(UserPredictionHistory)
      .where(
        and(
          eq(UserPredictionHistory.walletAddress, normalizedWalletAddress),
          eq(UserPredictionHistory.contractAddress, normalizedContractAddress)
        )
      )
      .orderBy(desc(UserPredictionHistory.createdAt)); // Most recent first

    console.log(`📊 Found ${predictions.length} predictions for ${normalizedWalletAddress} in contract ${normalizedContractAddress}`);
    
    // Cast prediction type since we know it's either 'positive' or 'negative'
    return predictions.map(prediction => ({
      ...prediction,
      prediction: prediction.prediction as 'positive' | 'negative'
    }));
    
  } catch (error) {
    console.error('Error getting user predictions by contract:', error);
    return [];
  }
}

/**
 * Enhanced function to get user predictions with their results from market outcomes
 * Matches predictions to outcomes using questionName + predictionDate
 */
export async function getUserPredictionsWithResults(
  walletAddress: string,
  contractAddress: string
): Promise<Array<{
  questionName: string;
  prediction: 'positive' | 'negative';
  predictionDate: string;
  createdAt: Date;
  status: 'pending' | 'correct' | 'incorrect';
  actualOutcome?: string;
  isProvisional?: boolean;
}>> {
  try {
    const normalizedWalletAddress = walletAddress.toLowerCase();
    const normalizedContractAddress = contractAddress.toLowerCase();
    
    console.log(`🔍 Getting predictions with results for wallet: ${normalizedWalletAddress}, contract: ${normalizedContractAddress}`);
    
    // Get user's predictions
    const predictions = await getUserPredictionsByContract(walletAddress, contractAddress);
    
    // Get table type from contract address
    const { CONTRACT_TO_TABLE_MAPPING } = await import('./config');
    const tableType = CONTRACT_TO_TABLE_MAPPING[contractAddress as keyof typeof CONTRACT_TO_TABLE_MAPPING];
    
    if (!tableType) {
      console.warn('Unknown contract address, returning predictions without results');
      return predictions.map(p => ({ ...p, status: 'pending' as const }));
    }
    
    // Get all market outcomes for this table type
    const { MarketOutcomes } = await import('./schema');
    const { eq, and } = await import('drizzle-orm');
    
    const predictionsWithResults = await Promise.all(
      predictions.map(async (prediction) => {
        try {
          // Look for market outcome that matches question + date + table type
          const outcome = await getDb()
            .select()
            .from(MarketOutcomes)
            .where(and(
              eq(MarketOutcomes.questionName, prediction.questionName),
              eq(MarketOutcomes.outcomeDate, prediction.predictionDate),
              eq(MarketOutcomes.marketType, tableType)
            ))
            .limit(1);
          
          const result = outcome[0];
          let status: 'pending' | 'correct' | 'incorrect';
          let actualOutcome: string | undefined;
          let isProvisional = false;
          
          if (!result) {
            // No outcome set yet
            status = 'pending';
          } else if (result.finalOutcome) {
            // Final outcome available
            actualOutcome = result.finalOutcome;
            status = result.finalOutcome === prediction.prediction ? 'correct' : 'incorrect';
          } else if (result.provisionalOutcome) {
            // Only provisional outcome available
            actualOutcome = result.provisionalOutcome;
            status = result.provisionalOutcome === prediction.prediction ? 'correct' : 'incorrect';
            isProvisional = true;
          } else {
            status = 'pending';
          }
          
          return {
            ...prediction,
            status,
            actualOutcome,
            isProvisional
          };
        } catch (error) {
          console.error(`Error getting outcome for prediction ${prediction.questionName}:`, error);
          return { ...prediction, status: 'pending' as const };
        }
      })
    );
    
    console.log(`✅ Retrieved ${predictionsWithResults.length} predictions with results`);
    return predictionsWithResults;
    
  } catch (error) {
    console.error('Error getting user predictions with results:', error);
    // Fallback to basic predictions without results
    return (await getUserPredictionsByContract(walletAddress, contractAddress))
      .map(p => ({ ...p, status: 'pending' as const }));
  }
}

