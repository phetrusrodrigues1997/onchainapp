import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
export const db = drizzle(sqlConnection);