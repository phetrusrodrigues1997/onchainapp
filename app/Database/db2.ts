import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// New Neon database connection for private pots
const sqlConnection = neon('postgresql://neondb_owner:npg_Ecmjs83owBzR@ep-restless-shadow-abbello7-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');
export const db2 = drizzle(sqlConnection);

// Helper function to create table name from contract address
export function getTableName(contractAddress: string, tableType: 'predictions' | 'participants' | 'wrong_predictions' | 'messages'): string {
  const cleanAddress = contractAddress.toLowerCase().replace('0x', '');
  return `pot_${cleanAddress}_${tableType}`;
}