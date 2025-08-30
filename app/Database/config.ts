// Database configuration constants
// TESTING TOGGLE - Set to false to allow betting on Saturdays for testing
export const ENFORCE_SATURDAY_RESTRICTIONS = false; // Toggle this on/off as needed

// Centralized contract address to table type mappings
// Used across PredictionPotTest, MakePredictionsPage, LandingPage, BookmarksPage, TutorialBridge, AdminEvidenceReviewPage
export const CONTRACT_TO_TABLE_MAPPING = {
  "0xb526c2Ee313f9D4866D8e5238C148f35EF73ed9F": "featured",
  "0x8C80DDC694A590d472d543e428A5e11FDF6cCEf0": "crypto", 
  "0x3349594e7DCFFB7E2fdC2734556D5C31A57b9992": "stocks",
} as const;

// Type for contract addresses
export type ContractAddress = keyof typeof CONTRACT_TO_TABLE_MAPPING;
export type TableType = typeof CONTRACT_TO_TABLE_MAPPING[ContractAddress];