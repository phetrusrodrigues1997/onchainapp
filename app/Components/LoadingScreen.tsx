'use client';

import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  title = "Prediwin", 
  subtitle = "Loading prediction markets...", 
  showProgress = false
}) => {
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    const loadingSteps = [
      { progress: 15, delay: 400 },
      { progress: 30, delay: 600 },
      { progress: 50, delay: 700 },
      { progress: 75, delay: 800 },
      { progress: 100, delay: 600 }
    ];
    
    const runProgressSteps = async () => {
      for (const step of loadingSteps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        setLoadingProgress(step.progress);
      }
    };
    
    runProgressSteps();
  }, [showProgress]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-md mx-auto text-center relative z-10 px-6">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/10">
          {/* Title */}
          <h1 className="text-3xl font-black text-purple-700 mb-4 tracking-tight">{title}</h1>
          <p className="text-gray-600 text-base mb-8">{subtitle}</p>
          
          {showProgress ? (
            <>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-1000 to-purple-700 rounded-full transition-all duration-300 ease-out relative"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Text */}
              <div className="text-gray-500 text-sm font-medium">
                {loadingProgress}%
              </div>
            </>
          ) : (
            /* Bouncing red dots for non-progress loading */
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-purple-700 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-700 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-purple-700 rounded-full animate-bounce delay-200"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;