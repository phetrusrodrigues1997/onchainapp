import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// New Neon database connection for private pots
const sqlConnection = neon(process.env.DATABASE_URL_2!);
export const db2 = drizzle(sqlConnection);

// Helper function to create table name from contract address
export function getTableName(contractAddress: string, tableType: 'predictions' | 'participants' | 'wrong_predictions' | 'outcome_votes'): string {
  const cleanAddress = contractAddress.toLowerCase().replace('0x', '');
  return `pot_${cleanAddress}_${tableType}`;
}