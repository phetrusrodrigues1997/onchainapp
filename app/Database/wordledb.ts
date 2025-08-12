// wordledb.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { pgTable, serial, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
// Example queries
import { eq } from "drizzle-orm";
// Make sure we only connect on the server, not during client-side hydration


const sqlConnection = neon(process.env.DATABASE_URL_2!);
export const db = drizzle(sqlConnection);

// Example schema (Drizzle)


export const wordWinners = pgTable(
  "word_winners",
  {
    id: serial("id").primaryKey(),
    wordDate: varchar("word_date", { length: 10 }).notNull(), // YYYY-MM-DD
    word: varchar("word", { length: 5 }).notNull(),
    winner: varchar("winner", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      wordDateIdx: uniqueIndex("word_winners_word_date_idx").on(table.wordDate),
    };
  }
);



export async function getWinnerByDate(date: string) {
  return await db
    .select()
    .from(wordWinners)
    .where(eq(wordWinners.wordDate, date));
}

export async function addWinner(date: string, word: string, winner?: string) {
  return await db.insert(wordWinners).values({
    wordDate: date,
    word,
    winner,
  });
}
