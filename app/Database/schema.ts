import { pgTable, text, integer, boolean, serial, timestamp } from "drizzle-orm/pg-core";


export const Messages = pgTable("Messages", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  from: text("from").notNull(), // Sender's address or identifier
  to: text("to").notNull(), // Recipient's address or identifier
  message: text("message").notNull(), // The message content
  read: boolean("read").default(false).notNull(), // Read status, default to false
  datetime: text("datetime").notNull(), // Timestamp of when the message was sent
});

export const BitcoinBets = pgTable("bitcoin_bets", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  walletAddress: text("wallet_address").notNull(), // Bettor's wallet address
  prediction: text("prediction").notNull(), // "positive" or "negative"
  betDate: text("bet_date").notNull(), // Date of the bet (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the bet was placed
});

export const WrongPredictions = pgTable("wrong_Predictions", {
  walletAddress: text("walletAddress").notNull(),});

  export const ImageURLs = pgTable("image_urls", {
  id: serial("id").primaryKey(),                // Auto-incremented ID
  walletAddress: text("wallet_address").notNull(), // Associated user's wallet address
  imageUrl: text("image_url").notNull(),        // URL to the image
  createdAt: timestamp("created_at").defaultNow().notNull(), // Timestamp for when the image was added
});

export const EthereumBets = pgTable("ethereum_bets", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  walletAddress: text("wallet_address").notNull(), // Bettor's wallet address
  prediction: text("prediction").notNull(), // "positive" or "negative"
  betDate: text("bet_date").notNull(), // Date of the bet (YYYY-MM-DD format)
  createdAt: timestamp("created_at").defaultNow().notNull(), // When the bet was placed
});