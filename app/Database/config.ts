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