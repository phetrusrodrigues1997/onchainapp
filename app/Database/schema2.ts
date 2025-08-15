import { pgTable, text, boolean, serial, timestamp, integer } from "drizzle-orm/pg-core";

// Master table to track all created pots
export const PrivatePots = pgTable("private_pots", {
  id: serial("id").primaryKey(),
  contractAddress: text("contract_address").notNull().unique(), // The deployed pot contract address
  creatorAddress: text("creator_address").notNull(), // Who created this pot
  potName: text("pot_name").notNull(), // Name of the prediction pot
  description: text("description").notNull(), // What users are predicting
  entryAmount: integer("entry_amount").default(10000).notNull(), // Entry amount in USDC micros (default 0.01 USDC)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Template for dynamic pot-specific tables
// For each pot with address 0x123..., we'll create tables like:
// - pot_0x123_predictions (user predictions for this pot)  
// - pot_0x123_participants (who joined this pot)
// - pot_0x123_wrong_predictions (who made wrong predictions)

// This function will be used to create pot-specific table schemas dynamically
export function createPotPredictionsTable(contractAddress: string) {
  const tableName = `pot_${contractAddress.toLowerCase().slice(2)}_predictions`; // Remove 0x prefix
  
  return pgTable(tableName, {
    id: serial("id").primaryKey(),
    walletAddress: text("wallet_address").notNull(),
    prediction: text("prediction").notNull(), // "positive" or "negative" or custom values
    predictionDate: text("prediction_date").notNull(), // Date of prediction (YYYY-MM-DD)
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
}

export function createPotParticipantsTable(contractAddress: string) {
  const tableName = `pot_${contractAddress.toLowerCase().slice(2)}_participants`;
  
  return pgTable(tableName, {
    id: serial("id").primaryKey(),
    walletAddress: text("wallet_address").notNull(),
    entryAmount: integer("entry_amount").notNull(), // Amount in USDC micros (6 decimals)
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    transactionHash: text("transaction_hash"), // Optional: track the blockchain transaction
  });
}

export function createPotWrongPredictionsTable(contractAddress: string) {
  const tableName = `pot_${contractAddress.toLowerCase().slice(2)}_wrong_predictions`;
  
  return pgTable(tableName, {
    id: serial("id").primaryKey(),
    walletAddress: text("wallet_address").notNull(),
    reEntryFee: integer("re_entry_fee").notNull(), // Re-entry fee in USDC micros
    createdAt: timestamp("created_at").defaultNow().notNull(),
  });
}


