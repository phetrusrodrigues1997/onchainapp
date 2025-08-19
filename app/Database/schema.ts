import { pgTable, text, boolean, serial, timestamp, integer } from "drizzle-orm/pg-core";


export const Messages = pgTable("Messages", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  from: text("from").notNull(), // Sender's address or identifier
  to: text("to").notNull(), // Recipient's address or identifier
  message: text("message").notNull(), // The message content
  read: boolean("read").default(false).notNull(), // Read status, default to false
  datetime: text("datetime").notNull(), // Timestamp of when the message was sent
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


export const CryptoBets = pgTable("crypto_bets", {
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
  email: text("email"), // Optional email address
  sourcePage: text("source_page"), // Optional: where the user data was collected from
  imageUrl: text("image_url"), // Optional profile image URL
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
  lastWordlePlay: timestamp("last_wordle_play"), // Last time user played Wordle
  wordlePlaysToday: integer("wordle_plays_today").default(0).notNull(), // Number of plays today
  potsWon: integer("pots_won").default(0).notNull(), // Total pots won across all markets
  totalEarningsUSDC: integer("total_earnings_usdc").default(0).notNull(), // Total earnings in micro-USDC (6 decimals)
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

