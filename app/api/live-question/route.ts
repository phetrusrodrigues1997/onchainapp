import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../Database/db';
import { LiveQuestions } from '../../Database/schema';
import { asc, eq } from 'drizzle-orm';

const QUESTION_INTERVAL_MINUTES = 60;


// Simple function to bootstrap initial questions if database is empty
async function ensureInitialQuestions() {
  try {
    const questionCount = await db
      .select()
      .from(LiveQuestions)
      .then(result => result.length);
    
    // Only generate initial batch if database is completely empty
    if (questionCount === 0) {
      
      const { generateQuestionBatch } = await import('../../Services/questionGenerator');
      const questionBatch = await generateQuestionBatch(2); // Start with just 2 questions
      
      for (const questionData of questionBatch) {
        await db
          .insert(LiveQuestions)
          .values({
            question: questionData.question,
          });
      }
      
    }
    
  } catch (error) {
    console.error('Error ensuring initial questions exist:', error);
  }
}

// Get the first question from the table
export async function GET(request: NextRequest) {
  try {
    // First, ensure we have initial questions if database is empty
    await ensureInitialQuestions();
    
    // Get the first question (ordered by ID)
    const firstQuestion = await db
      .select()
      .from(LiveQuestions)
      .orderBy(asc(LiveQuestions.id))
      .limit(1);

    if (firstQuestion.length > 0) {
      const question = firstQuestion[0];
      
      return NextResponse.json({
        question: question.question,
        timeRemaining: QUESTION_INTERVAL_MINUTES * 60, // Always 15 minutes
        questionId: question.id
      });
    }

    // Fallback: if no questions exist (shouldn't happen after cleanup), return default
    return NextResponse.json({
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: QUESTION_INTERVAL_MINUTES * 60,
      questionId: null,
      fallback: true
    });

  } catch (error) {
    console.error('Error fetching live question:', error);
    
    return NextResponse.json({
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: QUESTION_INTERVAL_MINUTES * 60,
      questionId: null,
      error: "Failed to fetch question"
    });
  }
}

// Force populate questions (for initial setup or admin use)
export async function POST(request: NextRequest) {
  try {
    const { generateQuestionBatch } = await import('../../Services/questionGenerator');
    
    // Generate 20 questions (simplified approach)
    const questionBatch = await generateQuestionBatch(20);
    const generatedQuestions = [];
    
    // Insert all questions (simplified schema)
    for (const questionData of questionBatch) {
      try {
        const result = await db
          .insert(LiveQuestions)
          .values({
            question: questionData.question,
          })
          .returning();
        
        generatedQuestions.push(result[0]);
      } catch (error) {
        console.error(`Failed to generate question:`, error);
      }
    }
    
    return NextResponse.json({
      message: `Generated ${generatedQuestions.length} questions`,
      questions: generatedQuestions.map(q => ({
        id: q.id,
        question: q.question
      }))
    });
  } catch (error) {
    console.error('Error force generating questions:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}