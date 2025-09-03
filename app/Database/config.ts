// Database configuration constants
// TESTING TOGGLE - Set to false to allow betting on Saturdays for testing
export const ENFORCE_SATURDAY_RESTRICTIONS = true; // Toggle this on/off as needed

// Centralized contract address to table type mappings
// Used across PredictionPotTest, MakePredictionsPage, LandingPage, BookmarksPage, TutorialBridge, AdminEvidenceReviewPage
export const CONTRACT_TO_TABLE_MAPPING = {
  "0xd1547F5bC0390F5020B2A80F262e28ccfeF2bf9c": "featured",
  "0xe9b69d0EA3a6E018031931d300319769c6629866": "crypto", 
  "0xf07E717e1dB49dDdB207C68cCb433BaE4Bc65fC9": "stocks",
} as const;

// Type for contract addresses
export type ContractAddress = keyof typeof CONTRACT_TO_TABLE_MAPPING;
export type TableType = typeof CONTRACT_TO_TABLE_MAPPING[ContractAddress];

// Utility function to convert table type to display name
export const getMarketDisplayName = (tableType: TableType): string => {
  switch (tableType) {
    case 'featured':
      return 'Trending';
    case 'crypto':
      return 'Crypto';
    case 'stocks':
      return 'stocks';
    default:
      return tableType; // fallback to the original table type
  }
};

// UK timezone helper function
export const getUKTime = (date: Date = new Date()): Date => {
  // Use Intl.DateTimeFormat to get UK time directly
  const ukTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);

  const year = parseInt(ukTime.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(ukTime.find(part => part.type === 'month')?.value || '0') - 1; // months are 0-indexed
  const day = parseInt(ukTime.find(part => part.type === 'day')?.value || '0');
  const hour = parseInt(ukTime.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(ukTime.find(part => part.type === 'minute')?.value || '0');
  const second = parseInt(ukTime.find(part => part.type === 'second')?.value || '0');

  return new Date(year, month, day, hour, minute, second);
};

// Get tonight's midnight (UK timezone) - when timer resets to 24 hours
export const getTonightMidnight = (): Date => {
  const ukNow = getUKTime();
  // Create tomorrow's midnight in UK timezone
  const tomorrow = new Date(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate() + 1, 0, 0, 0, 0);
  return tomorrow;
};

// Format milliseconds to HH:MM:SS format
export const formatTime = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Calculate time until midnight UK time
export const getTimeUntilMidnight = (): string => {
  const ukNow = getUKTime();
  const tonightMidnight = getTonightMidnight();
  const timeLeft = tonightMidnight.getTime() - ukNow.getTime();
  
  if (timeLeft <= 0) {
    return '00:00:00';
  } else {
    return formatTime(timeLeft);
  }
};