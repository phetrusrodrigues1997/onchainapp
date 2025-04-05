import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const userPoints = pgTable("user_points", {
  walletAddress: text("wallet_address").primaryKey(), // Unique identifier for each user
  points: integer("points").default(0).notNull(),     // Points, starting at 0 by default
  username: text("username").unique(),                // Unique username, nullable by default
});