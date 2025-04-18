import { pgTable, text, integer, boolean, serial } from "drizzle-orm/pg-core";

export const userPoints = pgTable("user_points", {
  walletAddress: text("wallet_address").primaryKey(), // Unique identifier for each user
  points: integer("points").default(0).notNull(),     // Points, starting at 0 by default
  username: text("username").unique(),                // Unique username, nullable by default
});

export const Messages = pgTable("Messages", {
  id: serial("id").primaryKey(), // Auto-incrementing ID as primary key
  from: text("from").notNull(), // Sender's address or identifier
  to: text("to").notNull(), // Recipient's address or identifier
  message: text("message").notNull(), // The message content
  read: boolean("read").default(false).notNull(), // Read status, default to false
  datetime: text("datetime").notNull(), // Timestamp of when the message was sent
});