import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { LiveQuestions } from "../../Database/schema";

// Initialize database connection
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection);

export async function GET(request: NextRequest) {
  try {
    // Get all questions from the database
    const allQuestions = await db
      .select()
      .from(LiveQuestions)
      .limit(10); // Limit to first 10

    const now = new Date();
    
    return NextResponse.json({
      currentTime: now.toISOString(),
      totalQuestions: allQuestions.length,
      questions: allQuestions.map(q => ({
        id: q.id,
        question: q.question,
        createdAt: q.createdAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error debugging questions:', error);
    return NextResponse.json({ error: 'Failed to debug questions' }, { status: 500 });
  }
}