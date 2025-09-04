import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { LivePredictions } from "../../Database/schema";
import { eq, and } from "drizzle-orm";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get user's prediction for today
    const userPrediction = await db
      .select()
      .from(LivePredictions)
      .where(and(
        eq(LivePredictions.walletAddress, walletAddress.toLowerCase()),
        eq(LivePredictions.betDate, today)
      ))
      .limit(1);
    
    if (userPrediction.length > 0) {
      return NextResponse.json({ 
        prediction: userPrediction[0].prediction,
        betDate: userPrediction[0].betDate 
      });
    } else {
      return NextResponse.json({ prediction: null });
    }
    
  } catch (error) {
    console.error('Error fetching user prediction:', error);
    return NextResponse.json({ error: 'Failed to fetch user prediction' }, { status: 500 });
  }
}