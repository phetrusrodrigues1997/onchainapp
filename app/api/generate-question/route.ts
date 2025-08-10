import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// List of diverse topics for questions
const topics = [
  'Science', 'History', 'Geography', 'Literature', 'Mathematics', 'Sports', 
  'Technology', 'Art', 'Music', 'Movies', 'Nature', 'Space', 'Animals', 
  'Food', 'Culture', 'Politics', 'Economics', 'Philosophy', 'Medicine', 
  'Chemistry', 'Physics', 'Biology', 'Psychology', 'Archaeology', 'Languages'
];

export async function POST(request: NextRequest) {
  try {
    // Select a random topic
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Cheapest model
      messages: [
        {
          role: "system",
          content: `You are a trivia question generator. Generate a single, factual multiple-choice question about ${randomTopic}. 
          
          Return ONLY a valid JSON object with this exact structure:
          {
            "question": "The actual question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "category": "${randomTopic}"
          }
          
          Rules:
          - Make the question challenging but fair
          - Ensure the correct answer is factually accurate
          - Make the wrong answers plausible but clearly incorrect
          - correctAnswer should be the index (0-3) of the correct option
          - Keep questions appropriate for all audiences
          - Vary difficulty levels`
        }
      ],
      max_tokens: 200,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let questionData;
    try {
      questionData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Fallback question
      questionData = {
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 2,
        category: "Science"
      };
    }

    // Validate the structure
    if (!questionData.question || !Array.isArray(questionData.options) || 
        questionData.options.length !== 4 || typeof questionData.correctAnswer !== 'number' ||
        questionData.correctAnswer < 0 || questionData.correctAnswer > 3) {
      throw new Error('Invalid question structure');
    }

    return NextResponse.json({ question: questionData });

  } catch (error) {
    console.error('Error generating question:', error);
    
    // Return a fallback question if OpenAI fails
    const fallbackQuestions = [
      {
        question: "Which element has the chemical symbol 'O'?",
        options: ["Oxygen", "Gold", "Silver", "Iron"],
        correctAnswer: 0,
        category: "Science"
      },
      {
        question: "What year did World War II end?",
        options: ["1944", "1945", "1946", "1947"],
        correctAnswer: 1,
        category: "History"
      },
      {
        question: "What is the capital of Australia?",
        options: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correctAnswer: 2,
        category: "Geography"
      }
    ];

    const randomFallback = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    
    return NextResponse.json({ question: randomFallback });
  }
}