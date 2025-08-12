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
  reEntryFeeUsdc: integer("re_entry_fee_usdc").notNull(), // Fee in USDC micros (6 decimals)
  wrongPredictionDate: text("wrong_prediction_date").notNull(), // Date they made wrong prediction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const WrongPredictionsCrypto = pgTable("wrong_predictions_crypto", {
  id: serial("id").primaryKey(),
  walletAddress: text("walletAddress").notNull(),
  reEntryFeeUsdc: integer("re_entry_fee_usdc").notNull(), // Fee in USDC micros (6 decimals)
  wrongPredictionDate: text("wrong_prediction_date").notNull(), // Date they made wrong prediction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

  export const ImageURLs = pgTable("image_urls", {
  id: serial("id").primaryKey(),                // Auto-incremented ID
  walletAddress: text("wallet_address").notNull(), // Associated user's wallet address
  imageUrl: text("image_url").notNull(),        // URL to the image
  createdAt: timestamp("created_at").defaultNow().notNull(), // Timestamp for when the image was added
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
  walletAddress: text("wallet_address").notNull().unique(), // Each wallet can only have one email
  email: text("email").notNull(),
  sourcePage: text("source_page").notNull(), // 'PredictionPot', 'AI', or 'PrivatePot'
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

