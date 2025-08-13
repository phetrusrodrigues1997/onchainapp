import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../Database/db';
import { LiveQuestions } from '../../Database/schema';
import { desc, lte, gte, and } from 'drizzle-orm';

const QUESTION_INTERVAL_MINUTES = 15;

// Define batch generation times (UTC hours)
const BATCH_GENERATION_HOURS = [10, 13, 16, 20, 0]; // 10am, 1pm, 4pm, 8pm, midnight UTC

// Calculate which 15-minute slot we're currently in
function getCurrentTimeSlot(): Date {
  const now = new Date();
  const minutes = now.getUTCMinutes();
  const roundedMinutes = Math.floor(minutes / QUESTION_INTERVAL_MINUTES) * QUESTION_INTERVAL_MINUTES;
  
  const slotTime = new Date(now);
  slotTime.setUTCMinutes(roundedMinutes, 0, 0);
  
  return slotTime;
}

// Check if we're in a batch generation window (within 15 minutes after generation times)
// This is now used for logging/optimization only, not as a hard requirement
function isInBatchGenerationWindow(): boolean {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinutes = now.getUTCMinutes();
  
  // Check if current time is within 15 minutes after any batch generation hour
  for (const hour of BATCH_GENERATION_HOURS) {
    if (currentHour === hour && currentMinutes < 15) {
      return true;
    }
  }
  
  return false;
}

// Get the last batch generation time that should have occurred
function getLastBatchGenerationTime(): Date {
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinutes = now.getUTCMinutes();
  
  // Find the most recent batch generation time
  let targetHour = BATCH_GENERATION_HOURS[0]; // default to first one
  
  for (let i = BATCH_GENERATION_HOURS.length - 1; i >= 0; i--) {
    const hour = BATCH_GENERATION_HOURS[i];
    if (currentHour > hour || (currentHour === hour && currentMinutes >= 0)) {
      targetHour = hour;
      break;
    }
  }
  
  // If no hour found today, use the last hour from yesterday
  const batchTime = new Date(now);
  if (currentHour < BATCH_GENERATION_HOURS[0]) {
    batchTime.setUTCDate(batchTime.getUTCDate() - 1);
    targetHour = BATCH_GENERATION_HOURS[BATCH_GENERATION_HOURS.length - 1];
  }
  
  batchTime.setUTCHours(targetHour, 0, 0, 0);
  return batchTime;
}

// Generate 24 questions starting from a specific time
function generateTimeSlots(startTime: Date, count: number = 24): Date[] {
  const slots = [];
  for (let i = 0; i < count; i++) {
    const slot = new Date(startTime);
    slot.setUTCMinutes(slot.getUTCMinutes() + (i * QUESTION_INTERVAL_MINUTES));
    slots.push(slot);
  }
  return slots;
}

// Smart batch generation - ensures we always have enough questions
async function ensureQuestionsExistSmart() {
  try {
    const now = new Date();
    const currentSlot = getCurrentTimeSlot();
    
    // Check how many future questions we have from current time
    const futureQuestions = await db
      .select()
      .from(LiveQuestions)
      .where(gte(LiveQuestions.startTime, currentSlot))
      .orderBy(desc(LiveQuestions.startTime));
    
    console.log(`Found ${futureQuestions.length} future questions from current slot`);
    
    // If we have less than 5 questions ahead, generate more
    const questionsNeeded = Math.max(0, 5 - futureQuestions.length);
    
    if (questionsNeeded === 0) {
      console.log('Sufficient questions available');
      return;
    }
    
    console.log(`Need to generate ${questionsNeeded} more questions`);
    
    // Determine start time for new questions
    let startSlot;
    if (futureQuestions.length > 0) {
      // Continue from the last existing question
      const latestQuestion = futureQuestions[0];
      startSlot = new Date(latestQuestion.endTime);
    } else {
      // No future questions, start from current slot
      startSlot = currentSlot;
    }
    
    // Always generate at least 5 questions, but preferably 24 for efficiency
    const questionsToGenerate = questionsNeeded < 20 ? 24 : questionsNeeded;
    
    // Generate time slots
    const timeSlots = generateTimeSlots(startSlot, questionsToGenerate);
    
    // Use batch generation for efficiency
    const { generateQuestionBatch } = await import('../../Services/questionGenerator');
    const questionBatch = await generateQuestionBatch(questionsToGenerate);
    
    console.log(`Generated ${questionBatch.length} questions via OpenAI batch`);
    
    // Insert all questions into database
    let insertedCount = 0;
    for (let i = 0; i < Math.min(timeSlots.length, questionBatch.length); i++) {
      const slotTime = timeSlots[i];
      const endTime = new Date(slotTime.getTime() + (QUESTION_INTERVAL_MINUTES * 60 * 1000));
      const questionData = questionBatch[i];
      
      try {
        await db
          .insert(LiveQuestions)
          .values({
            question: questionData.question,
            startTime: slotTime,
            endTime: endTime,
            isActive: false // Not used in new system
          });
        
        insertedCount++;
        console.log(`Inserted question for slot: ${slotTime.toISOString()}`);
      } catch (error) {
        console.error(`Failed to insert question for slot ${slotTime.toISOString()}:`, error);
      }
    }
    
    console.log(`Successfully inserted ${insertedCount} new questions`);
    
  } catch (error) {
    console.error('Error in smart question generation:', error);
  }
}

// Get the current question for this time slot
export async function GET(request: NextRequest) {
  try {
    const currentSlot = getCurrentTimeSlot();
    const endSlot = new Date(currentSlot.getTime() + (QUESTION_INTERVAL_MINUTES * 60 * 1000));
    
    // Find the question for current time slot
    const currentQuestion = await db
      .select()
      .from(LiveQuestions)
      .where(
        and(
          lte(LiveQuestions.startTime, currentSlot),
          gte(LiveQuestions.endTime, currentSlot)
        )
      )
      .limit(1);

    if (currentQuestion.length > 0) {
      const question = currentQuestion[0];
      const now = new Date();
      const timeRemaining = Math.max(0, Math.floor((question.endTime.getTime() - now.getTime()) / 1000));
      
      // Background task: ensure we have enough questions for the future
      ensureQuestionsExistSmart().catch(console.error);
      
      return NextResponse.json({
        question: question.question,
        timeRemaining,
        questionId: question.id,
        startTime: question.startTime.toISOString(),
        endTime: question.endTime.toISOString(),
        slotTime: currentSlot.toISOString()
      });
    }

    console.log('No question found for current slot, generating immediately');
    
    // No question for current slot - generate immediately
    await ensureQuestionsExistSmart();
    
    // Try to find question again after generation
    const newQuestion = await db
      .select()
      .from(LiveQuestions)
      .where(
        and(
          lte(LiveQuestions.startTime, currentSlot),
          gte(LiveQuestions.endTime, currentSlot)
        )
      )
      .limit(1);

    if (newQuestion.length > 0) {
      const question = newQuestion[0];
      const now = new Date();
      const timeRemaining = Math.max(0, Math.floor((question.endTime.getTime() - now.getTime()) / 1000));
      
      return NextResponse.json({
        question: question.question,
        timeRemaining,
        questionId: question.id,
        startTime: question.startTime.toISOString(),
        endTime: question.endTime.toISOString(),
        slotTime: currentSlot.toISOString(),
        wasGenerated: true
      });
    }

    // Ultimate fallback: if generation failed, return a default
    const timeRemaining = Math.floor((endSlot.getTime() - new Date().getTime()) / 1000);
    
    return NextResponse.json({
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: Math.max(0, timeRemaining),
      questionId: null,
      startTime: currentSlot.toISOString(),
      endTime: endSlot.toISOString(),
      slotTime: currentSlot.toISOString(),
      fallback: true
    });

  } catch (error) {
    console.error('Error fetching live question:', error);
    
    const now = new Date();
    return NextResponse.json({
      question: "Will something unexpected happen in the next 15 minutes?",
      timeRemaining: QUESTION_INTERVAL_MINUTES * 60,
      questionId: null,
      error: "Failed to fetch question",
      timestamp: now.toISOString()
    });
  }
}

// Force populate questions (for initial setup or admin use)
export async function POST(request: NextRequest) {
  try {
    const currentSlot = getCurrentTimeSlot();
    
    // Generate 24 questions starting from current slot
    const slots = generateTimeSlots(currentSlot, 24);
    const { generateQuestionBatch } = await import('../../Services/questionGenerator');
    
    const questionBatch = await generateQuestionBatch(24);
    const generatedQuestions = [];
    
    for (let i = 0; i < Math.min(slots.length, questionBatch.length); i++) {
      const slotTime = slots[i];
      const endTime = new Date(slotTime.getTime() + (QUESTION_INTERVAL_MINUTES * 60 * 1000));
      const questionData = questionBatch[i];
      
      try {
        const result = await db
          .insert(LiveQuestions)
          .values({
            question: questionData.question,
            startTime: slotTime,
            endTime: endTime,
            isActive: false
          })
          .returning();
        
        generatedQuestions.push(result[0]);
      } catch (error) {
        console.error(`Failed to generate question for slot ${slotTime.toISOString()}:`, error);
      }
    }
    
    return NextResponse.json({
      message: `Generated ${generatedQuestions.length} questions via batch generation`,
      questions: generatedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        startTime: q.startTime.toISOString(),
        endTime: q.endTime.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error force generating questions:', error);
    return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}