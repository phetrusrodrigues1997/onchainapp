import { pgTable, text, boolean, serial, timestamp, integer, bigint } from "drizzle-orm/pg-core";


export const Messages = pgTable("Messages", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  from: text("from").notNull(), // Sender's address or identifier
  to: text("to").notNull(), // Recipient's address or identifier
  message: text("message").notNull(), // The message content
  read: boolean("read").default(false).notNull(), // Read status, default to false
  datetime: text("datetime").notNull(), // Timestamp of when the message was sent
  contractAddress: text("contract_address"), // Optional: For contract-specific announcements
});

export const FeaturedBets = pgTable("featured_bets", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  walletAddress: text("wallet_address").notNull(), // Bettor's wallet address
  prediction: text("prediction").notNull(), // "positive" or "negative"
  betDate: text("bet_date").notNull(), // Date of the bet (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the bet was placed
  
});

export const WrongPredictions = pgTable("wrong_Predictions", {
  id: serial("id").primaryKey(),
  walletAddress: text("walletAddress").notNull(),
  wrongPredictionDate: text("wrong_prediction_date").notNull(), // Date they made wrong prediction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const WrongPredictionsCrypto = pgTable("wrong_predictions_crypto", {
  id: serial("id").primaryKey(),
  walletAddress: text("walletAddress").notNull(),
  wrongPredictionDate: text("wrong_prediction_date").notNull(), // Date they made wrong prediction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const WrongPredictionsStocks = pgTable("wrong_predictions_stocks", {
  id: serial("id").primaryKey(),
  walletAddress: text("walletAddress").notNull(),
  wrongPredictionDate: text("wrong_prediction_date").notNull(), // Date they made wrong prediction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const CryptoBets = pgTable("crypto_bets", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  walletAddress: text("wallet_address").notNull(), // Bettor's wallet address
  prediction: text("prediction").notNull(), // "positive" or "negative"
  betDate: text("bet_date").notNull(), // Date of the bet (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the bet was placed
  
});

export const StocksBets = pgTable("stocks_bets", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  walletAddress: text("wallet_address").notNull(), // Bettor's wallet address
  prediction: text("prediction").notNull(), // "positive" or "negative"
  betDate: text("bet_date").notNull(), // Date of the bet (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the bet was placed
  
});

// Referral system tables
export const ReferralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  referralCode: text("referral_code").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const Referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerWallet: text("referrer_wallet").notNull(), // who referred
  referredWallet: text("referred_wallet").notNull(), // who was referred  
  referralCode: text("referral_code").notNull(),
  potEntryConfirmed: boolean("pot_entry_confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const FreeEntries = pgTable("free_entries", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  earnedFromReferrals: integer("earned_from_referrals").default(0).notNull(),
  earnedFromTrivia: integer("earned_from_trivia").default(0).notNull(),
  earnedFromWordle: integer("earned_from_wordle").default(0).notNull(),
  usedEntries: integer("used_entries").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const UsersTable = pgTable("users_table", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull().unique(), // Each wallet can only have one entry
  imageUrl: text("image_url"), // Optional profile image URL
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
  lastWordlePlay: timestamp("last_wordle_play"), // Last time user played Wordle
  wordlePlaysToday: integer("wordle_plays_today").default(0).notNull(), // Number of plays today
  potsWon: integer("pots_won").default(0).notNull(), // Total pots won across all markets
  totalEarningsETH: bigint("total_earnings_eth", { mode: "bigint" }).default(BigInt(0)).notNull(), // Total earnings in ETH wei (18 decimals)
});

// Synchronized questions for prediction market
export const LiveQuestions = pgTable("live_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(), // The generated question
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Live predictions table - same schema as featured_predictions but for live prediction markets
export const LivePredictions = pgTable("live_predictions", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  walletAddress: text("wallet_address").notNull(), // Bettor's wallet address
  prediction: text("prediction").notNull(), // "positive" or "negative"
  betDate: text("bet_date").notNull(), // Date of the bet (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the bet was placed
});

// Market outcomes table - stores provisional outcomes for markets
export const MarketOutcomes = pgTable("market_outcomes", {
  id: serial("id").primaryKey(),
  marketType: text("market_type").notNull(), // "featured" or "crypto"
  outcomeDate: text("outcome_date").notNull(), // Date the outcome is for (YYYY-MM-DD)
  provisionalOutcome: text("provisional_outcome").notNull(), // "positive" or "negative"
  provisionalOutcomeSetAt: timestamp("provisional_outcome_set_at").defaultNow().notNull(),
  evidenceWindowExpires: timestamp("evidence_window_expires").notNull(),
  finalOutcome: text("final_outcome"), // Set after evidence window or if no disputes
  finalOutcomeSetAt: timestamp("final_outcome_set_at"),
  isDisputed: boolean("is_disputed").default(false).notNull(),
});

// Evidence submissions for disputing market outcomes
export const EvidenceSubmissions = pgTable("evidence_submissions", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(), // Who submitted the evidence
  marketType: text("market_type").notNull(), // "featured" or "crypto"
  outcomeDate: text("outcome_date").notNull(), // Date of the disputed outcome (YYYY-MM-DD)
  evidence: text("evidence").notNull(), // The evidence text submitted by user
  submittedAt: timestamp("submitted_at").defaultNow().notNull(), // When evidence was submitted
  paymentTxHash: text("payment_tx_hash"), // Transaction hash for the $5 USDC payment (for future implementation)
  status: text("status").notNull().default('pending'), // "pending", "approved", "rejected"
  reviewedBy: text("reviewed_by"), // Admin who reviewed the evidence
  reviewedAt: timestamp("reviewed_at"), // When the evidence was reviewed
  reviewNotes: text("review_notes"), // Admin notes about the decision
  refundTxHash: text("refund_tx_hash"), // If approved, transaction hash for refund (for future implementation)
});

// Prediction market ideas submitted by users
export const PredictionIdeas = pgTable("prediction_ideas", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(), // Who submitted the idea
  idea: text("idea").notNull(), // The prediction market idea text
  category: text("category").notNull(), // Category: crypto, stocks, sports, politics, entertainment, weather, tech, other
  submittedAt: timestamp("submitted_at").defaultNow().notNull(), // When idea was submitted
  likes: integer("likes").default(0).notNull(), // Number of community likes
  status: text("status").notNull().default('pending'), // "pending", "approved", "implemented", "rejected"
  reviewedBy: text("reviewed_by"), // Admin who reviewed the idea
  reviewedAt: timestamp("reviewed_at"), // When the idea was reviewed
  reviewNotes: text("review_notes"), // Admin notes about the decision
  implementedAt: timestamp("implemented_at"), // When the idea was turned into a live market
  marketAddress: text("market_address"), // Contract address if implemented as a market
});

// Bookmarks table - stores user's bookmarked markets
export const Bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(), // User who bookmarked
  marketId: text("market_id").notNull(), // Market ID being bookmarked
  marketCategory: text("market_category").notNull(), // Category (Featured, Crypto, etc.)
  contractAddress: text("contract_address"), // Contract address if available
  // Note: marketName and marketQuestion columns removed - we get live data from markets.ts
});

// Pot participation history - tracks entry/exit events for fair prediction requirements
export const PotParticipationHistory = pgTable("pot_participation_history", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(), // User's wallet address
  contractAddress: text("contract_address").notNull(), // Which pot contract
  tableType: text("table_type").notNull(), // featured/crypto/etc - for easier querying
  eventType: text("event_type").notNull(), // 'entry' or 'exit'
  eventDate: text("event_date").notNull(), // YYYY-MM-DD format when event occurred
  eventTimestamp: timestamp("event_timestamp").defaultNow().notNull(), // Exact timestamp of event
});

// User announcement read status - tracks which users have read which announcements
export const UserAnnouncementReads = pgTable("user_announcement_reads", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(), // User who read the announcement
  announcementId: integer("announcement_id").notNull(), // Message ID from Messages table
  readAt: timestamp("read_at").defaultNow().notNull(), // When the user read it
});

// User prediction tracking - keeps record of all predictions made by users with question context
export const UserPredictionHistory = pgTable("user_prediction_history", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(), // User who made the prediction
  questionName: text("question_name").notNull(), // The question/asset they predicted on (e.g., "Bitcoin", "Tesla", etc.)
  prediction: text("prediction").notNull(), // "positive" or "negative"
  contractAddress: text("contract_address").notNull(), // The prediction pot contract address
  predictionDate: text("prediction_date").notNull(), // Date of the prediction (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the prediction was made
});

