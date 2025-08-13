'use client';

import { useState, useEffect, useCallback } from 'react';

// Configure the time interval for new questions (in minutes)
const QUESTION_INTERVAL_MINUTES = 15;

interface FifteenMinuteQuestionsProps {
  className?: string;
}

export default function FifteenMinuteQuestions({ className = '' }: FifteenMinuteQuestionsProps) {
  const [question, setQuestion] = useState<string>('Loading question...');
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const fetchCurrentQuestion = useCallback(async () => {
    setIsLoading(true);
    
    // Add a minimum delay for smooth loading experience  
    const minLoadTime = isInitialLoad ? 2000 : 1500; // 2s for initial, 1.5s for subsequent
    const startTime = Date.now();
    
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
      
      // Ensure minimum loading time has passed
      const elapsed = Date.now() - startTime;
      const remainingTime = minLoadTime - elapsed;
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setQuestion(data.question);
      setTimeRemaining(data.timeRemaining || 0);
      
      // If the question is expired or has very little time left, it will auto-refresh
      if (data.timeRemaining <= 5 && !data.expired) {
        // Schedule a refresh in a few seconds to get the new question
        setTimeout(() => {
          fetchCurrentQuestion();
        }, (data.timeRemaining + 1) * 1000);
      }
      
    } catch (error) {
      console.error('Error fetching live question:', error);
      
      // Still respect minimum loading time even for fallback
      const elapsed = Date.now() - startTime;
      const remainingTime = minLoadTime - elapsed;
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setQuestion(`Will something unexpected happen in the next ${QUESTION_INTERVAL_MINUTES} minutes?`);
      setTimeRemaining(QUESTION_INTERVAL_MINUTES * 60);
    }
    
    setIsLoading(false);
    setIsInitialLoad(false); // After first load, no longer initial
  }, [isInitialLoad]); // Add isInitialLoad as dependency

  useEffect(() => {
    fetchCurrentQuestion();
  }, []);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Fetch new question when timer reaches zero
            fetchCurrentQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]); // Remove fetchCurrentQuestion from dependencies to prevent infinite re-renders

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
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm font-mono tracking-wider">LIVE PREDICTION</span>
          </div>
          {!isLoading && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              {isInitialLoad ? (
                // Dramatic initial loading
                <>
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-8 border-gray-200 border-t-black rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-24 h-24 border-8 border-transparent border-b-gray-800 rounded-full animate-spin" 
                         style={{ animationDirection: 'reverse', animationDelay: '150ms' }}></div>
                    <div className="absolute inset-4 w-16 h-16 border-4 border-gray-300 border-r-black rounded-full animate-spin"
                         style={{ animationDuration: '1s' }}></div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-black tracking-wider">SYNCHRONIZING</h3>
                    <div className="flex justify-center space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div 
                          key={i}
                          className="w-2 h-8 bg-black"
                          style={{ 
                            opacity: 0.3 + (i * 0.2),
                            animationDelay: `${i * 200}ms`
                          }}
                        ></div>
                      ))}
                    </div>
                    <p className="text-gray-600 font-mono text-sm tracking-wide">CONNECTING TO GLOBAL FEED</p>
                  </div>
                </>
              ) : (
                // Quick refresh loading
                <>
                  <div className="flex space-x-3 mb-4">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className="w-3 h-12 bg-black"
                        style={{ 
                          opacity: 0.2 + (i * 0.15),
                          transform: `scaleY(${0.5 + (i * 0.1)})`
                        }}
                      ></div>
                    ))}
                  </div>
                  <p className="text-black font-mono font-bold tracking-wider">LOADING NEXT PREDICTION</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Main Question Area */}
              <div className="relative mb-8">
                <div className="relative bg-black text-white p-8 rounded-lg shadow-inner">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"></div>
                  
                  <p className="text-2xl md:text-3xl font-bold leading-tight text-center tracking-wide">
                    {question}
                  </p>
                  
                  {/* Corner Brackets */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white"></div>
                </div>
              </div>

              {/* Time Pressure Indicator */}
              <div className="mb-6">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-black via-gray-700 to-black transition-all duration-1000"
                    style={{ 
                      width: `${(timeRemaining / (QUESTION_INTERVAL_MINUTES * 60)) * 100}%`
                    }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs font-mono text-gray-500">
                  <span>STARTED</span>
                  <span className={timeRemaining < 60 ? 'text-red-500 font-bold' : ''}>
                    {timeRemaining < 60 ? 'URGENT' : 'TIME REMAINING'}
                  </span>
                  <span>EXPIRES</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-6">
                <button className="group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    <span className="text-3xl">✓</span>
                    <span className="tracking-widest">YES</span>
                  </div>
                  {/* Button Corner Effects */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
                
                <button className="group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95">
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
                  GLOBAL SYNCHRONIZATION • ID: {timeRemaining > 0 ? 'ACTIVE' : 'EXPIRED'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      </div>
    </>
  );
}