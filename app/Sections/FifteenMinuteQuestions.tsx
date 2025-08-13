'use client';

import { useState, useEffect, useCallback } from 'react';

// Configure the time interval for new questions (in minutes)
const QUESTION_INTERVAL_MINUTES = 15;

interface FifteenMinuteQuestionsProps {
  className?: string;
}

interface ImageData {
  url: string;
  source: 'static' | 'unsplash' | 'pexels' | 'fallback';
  alt: string;
}

export default function FifteenMinuteQuestions({ className = '' }: FifteenMinuteQuestionsProps) {
  const [question, setQuestion] = useState<string>('Loading question...');
  const [imageData, setImageData] = useState<ImageData | null>(null);
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
      setImageData(data.image);
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
      setImageData({
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        source: 'fallback',
        alt: 'Default prediction image'
      });
      setTimeRemaining(QUESTION_INTERVAL_MINUTES * 60);
    }
    
    setIsLoading(false);
    setIsInitialLoad(false); // After first load, no longer initial
  }, [isInitialLoad]); // Add isInitialLoad as dependency

  useEffect(() => {
    // Preload critical images for better performance
    const preloadImages = [
      'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    ];
    
    preloadImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    
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
  }, [timeRemaining, fetchCurrentQuestion]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-2xl -translate-y-8  mx-auto ${className}`}>
      <div className="text-center">
        {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {QUESTION_INTERVAL_MINUTES}-Minute Prediction
        </h2> */}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            {isInitialLoad ? (
              // Initial loading screen
              <>
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  <div 
                    className="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-purple-400 rounded-full animate-spin"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading Live Markets</h3>
                <p className="text-gray-600 animate-pulse">Generating your next prediction...</p>
              </>
            ) : (
              // Question refresh loading
              <>
                <div className="relative mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div 
                      className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: '200ms' }}
                    ></div>
                    <div 
                      className="w-3 h-3 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: '400ms' }}
                    ></div>
                  </div>
                </div>
                <p className="text-gray-700 font-medium animate-pulse">Loading next question...</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Countdown Timer - Top Right */}
            <div className="flex justify-end mb-3">
              <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-mono font-bold">
                {formatTime(timeRemaining)}
              </div>
            </div>
            
            {/* Image Display */}
            {imageData && (
              <div className="mb-4 overflow-hidden rounded-lg">
                <img
                  src={imageData.url}
                  alt={imageData.alt}
                  className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    // Fallback to default image if loading fails
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
                  }}
                />
                {/* <div className="text-xs text-gray-500 mt-2 text-center">
                  Source: {imageData.source === 'static' ? 'Curated' : 
                           imageData.source === 'unsplash' ? 'Unsplash' :
                           imageData.source === 'pexels' ? 'Pexels' : 'Default'}
                </div> */}
              </div>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-lg font-medium text-gray-800 leading-relaxed">
                {question}
              </p>
            </div>
            
            <div className="flex justify-center items-center space-x-4">
              <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                YES
              </button>
              <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                NO
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}