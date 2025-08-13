import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../Database/db';
import { LiveQuestions } from '../../Database/schema';
import { eq, and, lte, gte, desc } from 'drizzle-orm';

// This endpoint can be called by cron jobs to ensure there's always an active question
export async function POST(request: NextRequest) {
  try {
    // Check if there's an active question that hasn't expired
    const now = new Date();
    
    const currentQuestion = await db
      .select()
      .from(LiveQuestions)
      .where(
        and(
          eq(LiveQuestions.isActive, true),
          lte(LiveQuestions.startTime, now),
          gte(LiveQuestions.endTime, now)
        )
      )
      .limit(1);

    if (currentQuestion.length > 0) {
      return NextResponse.json({ 
        message: 'Active question exists', 
        questionId: currentQuestion[0].id,
        endTime: currentQuestion[0].endTime,
        timeRemaining: Math.floor((currentQuestion[0].endTime.getTime() - now.getTime()) / 1000)
      });
    }

    // No active question found, generate a new one
    console.log('No active question found, generating new one...');

    // First, deactivate all existing questions
    await db
      .update(LiveQuestions)
      .set({ isActive: false })
      .where(eq(LiveQuestions.isActive, true));

    // Generate question using shared utility
    let questionData;
    try {
      const { generateQuestionWithImage } = await import('../../Services/questionGenerator');
      questionData = await generateQuestionWithImage();
    } catch (error) {
      console.error('Failed to generate question, using fallback:', error);
      // Fallback question
      questionData = {
        question: "Will something unexpected happen in the next 15 minutes?",
        image: {
          url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
          source: 'fallback',
          alt: 'Default prediction image'
        }
      };
    }

    // Calculate start and end times
    const INTERVAL_MINUTES = 15;
    const endTime = new Date(now.getTime() + (INTERVAL_MINUTES * 60 * 1000));

    // Insert new question into database
    const insertedQuestion = await db
      .insert(LiveQuestions)
      .values({
        question: questionData.question,
        imageUrl: questionData.image.url,
        imageAlt: questionData.image.alt,
        startTime: now,
        endTime: endTime,
        isActive: true
      })
      .returning();

    const newQuestion = insertedQuestion[0];
    
    console.log(`Generated new question: "${newQuestion.question}" (ID: ${newQuestion.id})`);

    return NextResponse.json({
      message: 'New question generated',
      questionId: newQuestion.id,
      question: newQuestion.question,
      startTime: newQuestion.startTime,
      endTime: newQuestion.endTime,
      timeRemaining: Math.floor((endTime.getTime() - now.getTime()) / 1000)
    });

  } catch (error) {
    console.error('Error in question scheduler:', error);
    return NextResponse.json({ 
      error: 'Failed to schedule question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Get current active question
    const currentQuestion = await db
      .select()
      .from(LiveQuestions)
      .where(
        and(
          eq(LiveQuestions.isActive, true),
          lte(LiveQuestions.startTime, now),
          gte(LiveQuestions.endTime, now)
        )
      )
      .limit(1);

    // Get latest question (even if expired)
    const latestQuestion = await db
      .select()
      .from(LiveQuestions)
      .orderBy(desc(LiveQuestions.createdAt))
      .limit(1);

    const status = {
      currentTime: now.toISOString(),
      hasActiveQuestion: currentQuestion.length > 0,
      activeQuestion: currentQuestion.length > 0 ? {
        id: currentQuestion[0].id,
        question: currentQuestion[0].question,
        startTime: currentQuestion[0].startTime,
        endTime: currentQuestion[0].endTime,
        timeRemaining: Math.floor((currentQuestion[0].endTime.getTime() - now.getTime()) / 1000)
      } : null,
      latestQuestion: latestQuestion.length > 0 ? {
        id: latestQuestion[0].id,
        question: latestQuestion[0].question,
        createdAt: latestQuestion[0].createdAt,
        isActive: latestQuestion[0].isActive
      } : null,
      totalQuestions: await db.select().from(LiveQuestions).then(rows => rows.length)
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking scheduler status:', error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}

