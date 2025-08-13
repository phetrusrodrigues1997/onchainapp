'use client';

import { useState, useEffect, useRef } from 'react';

// Configure the time interval for new questions (in minutes)
const QUESTION_INTERVAL_MINUTES = 15;

interface FifteenMinuteQuestionsProps {
  className?: string;
}

interface QuestionData {
  question: string;
  timeRemaining: number;
  questionId: string | null;
  startTime: string;
  endTime: string;
}

export default function FifteenMinuteQuestions({ className = '' }: FifteenMinuteQuestionsProps) {
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    question: 'Loading question...',
    timeRemaining: 0,
    questionId: null,
    startTime: '',
    endTime: ''
  });
  const [nextQuestion, setNextQuestion] = useState<QuestionData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate seconds until next 15-minute slot
  const getSecondsUntilNextSlot = (): number => {
    const now = new Date();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();
    const roundedMinutes = Math.ceil(minutes / QUESTION_INTERVAL_MINUTES) * QUESTION_INTERVAL_MINUTES;
    
    if (roundedMinutes >= 60) {
      // Next slot is in the next hour
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      nextHour.setUTCMinutes(0, 0, 0);
      return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
    } else {
      // Next slot is in current hour
      const nextSlot = new Date(now);
      nextSlot.setUTCMinutes(roundedMinutes, 0, 0);
      return Math.floor((nextSlot.getTime() - now.getTime()) / 1000);
    }
  };

  const fetchCurrentQuestion = async (): Promise<QuestionData | null> => {
    try {
      const response = await fetch('/api/live-question', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch live question');
      }
      
      const data = await response.json();
      
      return {
        question: data.question,
        timeRemaining: data.timeRemaining || 0,
        questionId: data.questionId,
        startTime: data.startTime || '',
        endTime: data.endTime || ''
      };
      
    } catch (error) {
      console.error('Error fetching live question:', error);
      return {
        question: `Will something unexpected happen in the next ${QUESTION_INTERVAL_MINUTES} minutes?`,
        timeRemaining: QUESTION_INTERVAL_MINUTES * 60,
        questionId: null,
        startTime: '',
        endTime: ''
      };
    }
  };

  // Smooth transition to next question
  const transitionToNextQuestion = () => {
    if (!nextQuestion) return;

    setIsTransitioning(true);
    
    // Fade out current question, then fade in new one
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentQuestion(nextQuestion);
      setNextQuestion(null);
      
      // Fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Half of transition time
    }, 300); // Half of transition time
  };

  // Prefetch next question for smooth transition
  const prefetchNextQuestion = async () => {
    const question = await fetchCurrentQuestion();
    if (question && question.questionId !== currentQuestion.questionId) {
      setNextQuestion(question);
      
      // If current question has expired, transition immediately
      if (currentQuestion.timeRemaining <= 0) {
        transitionToNextQuestion();
      }
    }
  };

  // Smart fetching strategy
  const setupSmartFetching = () => {
    // Clear existing intervals
    if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Set up countdown timer (updates every second)
    countdownIntervalRef.current = setInterval(() => {
      setCurrentQuestion(prev => {
        const newTimeRemaining = Math.max(0, prev.timeRemaining - 1);
        
        // Prefetch next question 30 seconds before current expires
        if (newTimeRemaining === 30 && !nextQuestion) {
          prefetchNextQuestion();
        }
        
        // Transition when current question expires
        if (newTimeRemaining === 0 && nextQuestion) {
          transitionToNextQuestion();
        }
        
        // If we hit 0 and no next question, fetch immediately
        if (newTimeRemaining === 0 && !nextQuestion) {
          fetchCurrentQuestion().then(question => {
            if (question && question.questionId !== prev.questionId) {
              setNextQuestion(question);
              transitionToNextQuestion();
            }
          });
        }
        
        return {
          ...prev,
          timeRemaining: newTimeRemaining
        };
      });
    }, 1000);

    // Set up smart background fetching
    // Fetch every 2 minutes, but more frequently when close to transition
    const baseInterval = currentQuestion.timeRemaining > 120 ? 120 * 1000 : 60 * 1000; // 2 min or 1 min
    
    fetchIntervalRef.current = setInterval(async () => {
      // Don't fetch if we're about to transition
      if (currentQuestion.timeRemaining > 10) {
        const question = await fetchCurrentQuestion();
        if (question && question.questionId !== currentQuestion.questionId) {
          // Update current question only if it's a different question
          // and we're not in a transition period
          if (!nextQuestion && !isTransitioning) {
            setCurrentQuestion(question);
          }
        }
      }
    }, baseInterval);
  };

  // Initialize and setup smart fetching
  useEffect(() => {
    const initializeQuestions = async () => {
      const question = await fetchCurrentQuestion();
      if (question) {
        setCurrentQuestion(question);
        
        // If question expires soon, prefetch the next one
        if (question.timeRemaining <= 60) {
          setTimeout(prefetchNextQuestion, 1000);
        }
      }
      
      setupSmartFetching();
    };

    initializeQuestions();

    return () => {
      // Cleanup all intervals and timeouts
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []); // Only run once on mount

  // Recalibrate timing when question changes
  useEffect(() => {
    if (currentQuestion.questionId) {
      setupSmartFetching();
    }
  }, [currentQuestion.questionId]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Page became visible, sync with current question
        const question = await fetchCurrentQuestion();
        if (question && question.questionId !== currentQuestion.questionId) {
          setCurrentQuestion(question);
          setNextQuestion(null);
          setIsTransitioning(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentQuestion.questionId]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, 20px); }
        }
        
        .animated-grid {
          background-image: 
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          animation: grid-move 20s linear infinite;
        }

        .question-transition {
          transition: opacity 0.6s ease-in-out, transform 0.6s ease-in-out;
        }

        .question-fade-out {
          opacity: 0.3;
          transform: scale(0.98);
        }

        .time-bar-transition {
          transition: width 1s linear;
        }
      `}</style>
      
      <div className={`relative max-w-4xl mx-auto ${className}`}>
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 animated-grid"></div>
        </div>
      
        {/* Subtle Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-800 to-black opacity-10 rounded-xl blur-sm"></div>
        
        <div className="relative bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
          {/* Top Status Bar */}
          <div className="bg-black text-white px-6 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                currentQuestion.timeRemaining > 60 ? 'bg-green-500' : 
                currentQuestion.timeRemaining > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-mono tracking-wider">LIVE PREDICTION</span>
              {isTransitioning && (
                <span className="text-xs text-gray-400 animate-pulse">UPDATING...</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono transition-colors duration-300 ${
                currentQuestion.timeRemaining < 60 ? 'text-red-400' : 'text-white'
              }`}>
                {formatTime(currentQuestion.timeRemaining)}
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Main Question Area */}
            <div className="relative mb-8">
              <div className={`relative bg-black text-white p-8 rounded-lg shadow-inner question-transition ${
                isTransitioning ? 'question-fade-out' : ''
              }`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                
                <p className="text-2xl md:text-3xl font-bold leading-tight text-center tracking-wide">
                  {currentQuestion.question}
                </p>
                
                {/* Corner Brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white"></div>
              </div>
              
              {/* Next question preview (subtle) */}
              {nextQuestion && currentQuestion.timeRemaining <= 30 && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute bottom-2 right-2 bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs font-mono opacity-60">
                    NEXT: {nextQuestion.question.substring(0, 30)}...
                  </div>
                </div>
              )}
            </div>

            {/* Time Pressure Indicator */}
            <div className="mb-6">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full time-bar-transition ${
                    currentQuestion.timeRemaining > 300 ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-600' :
                    currentQuestion.timeRemaining > 60 ? 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-red-600 via-red-500 to-red-600'
                  }`}
                  style={{ 
                    width: `${Math.max(2, (currentQuestion.timeRemaining / (QUESTION_INTERVAL_MINUTES * 60)) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs font-mono text-gray-500">
                <span>STARTED</span>
                <span className={`transition-colors duration-300 ${
                  currentQuestion.timeRemaining < 60 ? 'text-red-500 font-bold animate-pulse' : 
                  currentQuestion.timeRemaining < 120 ? 'text-yellow-600 font-semibold' : ''
                }`}>
                  {currentQuestion.timeRemaining < 60 ? 'URGENT' : 
                   currentQuestion.timeRemaining < 120 ? 'ENDING SOON' : 'TIME REMAINING'}
                </span>
                <span>EXPIRES</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-6">
              <button className={`group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                isTransitioning ? 'opacity-60 cursor-wait' : ''
              }`} disabled={isTransitioning}>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <span className="text-3xl">✓</span>
                  <span className="tracking-widest">YES</span>
                </div>
                {/* Button Corner Effects */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              
              <button className={`group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                isTransitioning ? 'opacity-60 cursor-wait' : ''
              }`} disabled={isTransitioning}>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <span className="text-3xl">✗</span>
                  <span className="tracking-widest">NO</span>
                </div>
                {/* Button Corner Effects */}
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>

            {/* Bottom Status */}
            <div className="mt-6 text-center">
              <p className="text-xs font-mono text-gray-500 tracking-wider">
                GLOBAL SYNCHRONIZATION • ID: {currentQuestion.questionId ? currentQuestion.questionId : 'ACTIVE'}
                {nextQuestion && (
                  <span className="ml-2 text-gray-400">• NEXT READY</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}