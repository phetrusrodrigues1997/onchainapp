import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../Database/db';
import { LiveQuestions } from '../../Database/schema';
import { desc, eq, and, lte, gte } from 'drizzle-orm';

// Get the current active question
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // First, try to get the current active question within its time window
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
      .orderBy(desc(LiveQuestions.startTime))
      .limit(1);

    if (currentQuestion.length > 0) {
      const question = currentQuestion[0];
      const timeRemaining = Math.max(0, Math.floor((question.endTime.getTime() - now.getTime()) / 1000));
      
      return NextResponse.json({
        question: question.question,
        timeRemaining,
        questionId: question.id,
        startTime: question.startTime.toISOString(),
        endTime: question.endTime.toISOString()
      });
    }

    // If no active question found, check if there's a recent question that should still be active
    // Look for any question that should be active right now (regardless of isActive flag)
    const shouldBeActiveQuestion = await db
      .select()
      .from(LiveQuestions)
      .where(
        and(
          lte(LiveQuestions.startTime, now),
          gte(LiveQuestions.endTime, now)
        )
      )
      .orderBy(desc(LiveQuestions.startTime))
      .limit(1);

    if (shouldBeActiveQuestion.length > 0) {
      const question = shouldBeActiveQuestion[0];
      
      // If this question isn't marked as active, fix that
      if (!question.isActive) {
        await db
          .update(LiveQuestions)
          .set({ isActive: false })
          .where(eq(LiveQuestions.isActive, true)); // Deactivate others
          
        await db
          .update(LiveQuestions)
          .set({ isActive: true })
          .where(eq(LiveQuestions.id, question.id)); // Activate this one
      }
      
      const timeRemaining = Math.max(0, Math.floor((question.endTime.getTime() - now.getTime()) / 1000));
      
      return NextResponse.json({
        question: question.question,
        timeRemaining,
        questionId: question.id,
        startTime: question.startTime.toISOString(),
        endTime: question.endTime.toISOString()
      });
    }

    // Only generate new question if no question should be active right now
    // Check if the latest question has truly expired
    const latestQuestion = await db
      .select()
      .from(LiveQuestions)
      .orderBy(desc(LiveQuestions.endTime))
      .limit(1);

    let shouldGenerateNew = false;
    
    if (latestQuestion.length === 0) {
      // No questions at all, generate first one
      shouldGenerateNew = true;
    } else {
      // Check if the latest question has expired (with a small buffer)
      const latestEndTime = latestQuestion[0].endTime.getTime();
      const bufferTime = 5 * 1000; // 5 seconds buffer (reduced from 30s for better sync)
      if (now.getTime() > (latestEndTime + bufferTime)) {
        shouldGenerateNew = true;
      }
    }

    if (shouldGenerateNew) {
      // Generate a new question
      const newQuestion = await generateNewQuestion();
      return NextResponse.json(newQuestion);
    }

    // If we reach here, return the latest question (even if slightly expired)
    if (latestQuestion.length > 0) {
      const question = latestQuestion[0];
      const timeRemaining = Math.max(0, Math.floor((question.endTime.getTime() - now.getTime()) / 1000));
      
      return NextResponse.json({
        question: question.question,
        timeRemaining,
        questionId: question.id,
        startTime: question.startTime.toISOString(),
        endTime: question.endTime.toISOString(),
        expired: timeRemaining === 0
      });
    }

    // Ultimate fallback
    return NextResponse.json({
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: 0,
      questionId: null,
      error: "No questions available"
    });

  } catch (error) {
    console.error('Error fetching live question:', error);
    
    return NextResponse.json({
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: 0,
      questionId: null,
      error: "Failed to fetch question"
    });
  }
}

// Generate a new question and store it in the database
async function generateNewQuestion() {
  try {
    // Double-check if a new question was already created by another request (race condition fix)
    const currentTime = new Date();
    const recentQuestion = await db
      .select()
      .from(LiveQuestions)
      .where(
        and(
          eq(LiveQuestions.isActive, true),
          lte(LiveQuestions.startTime, currentTime),
          gte(LiveQuestions.endTime, currentTime)
        )
      )
      .limit(1);

    if (recentQuestion.length > 0) {
      // Another request already generated a question, return it
      const question = recentQuestion[0];
      const timeRemaining = Math.max(0, Math.floor((question.endTime.getTime() - currentTime.getTime()) / 1000));
      
      return {
        question: question.question,
        timeRemaining,
        questionId: question.id,
        startTime: question.startTime.toISOString(),
        endTime: question.endTime.toISOString(),
        isNew: false // Not actually new, just found existing
      };
    }

    // First, deactivate all existing questions
    await db
      .update(LiveQuestions)
      .set({ isActive: false })
      .where(eq(LiveQuestions.isActive, true));

    // Generate question using shared utility
    const { generateQuestion } = await import('../../Services/questionGenerator');
    const data = await generateQuestion();
    
    // Calculate start and end times
    const INTERVAL_MINUTES = 15; // This should match your component's QUESTION_INTERVAL_MINUTES
    const endTime = new Date(currentTime.getTime() + (INTERVAL_MINUTES * 60 * 1000));

    // Insert new question into database
    const insertedQuestion = await db
      .insert(LiveQuestions)
      .values({
        question: data.question,
        startTime: currentTime,
        endTime: endTime,
        isActive: true
      })
      .returning();

    const newQuestion = insertedQuestion[0];
    const timeRemaining = Math.floor((endTime.getTime() - currentTime.getTime()) / 1000);

    return {
      question: newQuestion.question,
      timeRemaining,
      questionId: newQuestion.id,
      startTime: newQuestion.startTime.toISOString(),
      endTime: newQuestion.endTime.toISOString(),
      isNew: true
    };

  } catch (error) {
    console.error('Error generating new question:', error);
    
    // Return fallback question without saving to database
    return {
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: 15 * 60, // 15 minutes
      questionId: null,
      error: "Failed to generate new question"
    };
  }
}

// Force generate a new question (for admin/testing purposes)
export async function POST(request: NextRequest) {
  try {
    const newQuestion = await generateNewQuestion();
    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Error force generating question:', error);
    return NextResponse.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}