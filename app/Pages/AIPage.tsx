'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Check, X, RotateCcw, Trophy, Zap, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';
import { getTriviaStats, updateTriviaStats, resetTriviaStats } from '../Database/actions';
import { getRandomQuestion } from '../Constants/triviaQuestions';

interface AIPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

interface GameStats {
  correctAnswers: number;
  totalQuestions: number;
  currentStreak: number;
  bestStreak: number;
}

const AITriviaGame = ({ activeSection, setActiveSection }: AIPageProps) => {
  const { address, isConnected } = useAccount();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    correctAnswers: 0,
    totalQuestions: 0,
    currentStreak: 0,
    bestStreak: 0
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  
  // Delayed save system
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStatsRef = useRef<{ isCorrect: boolean } | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load stats from database on mount and when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadStatsFromDatabase();
    } else {
      // Load from localStorage if no wallet connected
      const savedStats = localStorage.getItem('prediwin-trivia-stats');
      if (savedStats) {
        setGameStats(JSON.parse(savedStats));
      }
      setIsLoadingStats(false);
    }
  }, [isConnected, address]);

  // Load stats from database
  const loadStatsFromDatabase = async () => {
    if (!address) return;
    
    setIsLoadingStats(true);
    try {
      const stats = await getTriviaStats(address);
      setGameStats({
        correctAnswers: stats.correctAnswers,
        totalQuestions: stats.totalQuestions,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak
      });
    } catch (error) {
      console.error('Error loading trivia stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Delayed database save function
  const saveToDatabase = useCallback(async () => {
    if (!pendingStatsRef.current || !isConnected || !address) {
      return;
    }

    try {
      await updateTriviaStats(address, pendingStatsRef.current.isCorrect);
      pendingStatsRef.current = null;
      console.log('Stats saved to database');
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }, [isConnected, address]);

  // Schedule delayed save
  const scheduleDelayedSave = useCallback((isCorrect: boolean) => {
    // Store the result for delayed processing
    pendingStatsRef.current = { isCorrect };
    
    // Clear any existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Save after 3 seconds of inactivity
    saveTimerRef.current = setTimeout(() => {
      saveToDatabase();
    }, 3000);
  }, [saveToDatabase]);

  // Page unload and visibility change handlers
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingStatsRef.current) {
        saveToDatabase();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && pendingStatsRef.current) {
        saveToDatabase();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
    };
  }, [saveToDatabase]);

  // Save pending updates when activeSection changes (user navigates away)
  useEffect(() => {
    if (activeSection !== 'AI' && pendingStatsRef.current) {
      saveToDatabase();
    }
  }, [activeSection, saveToDatabase]);

  // Handle when timer expires
  const handleTimeExpired = useCallback(() => {
    if (!currentQuestion || showResult) return;
    
    setShowResult(true);
    setIsCorrect(false);
    setTimerActive(false);
    
    // Calculate new stats for timeout (treated as incorrect)
    const newStats = {
      ...gameStats,
      totalQuestions: gameStats.totalQuestions + 1,
      currentStreak: 0, // Reset streak on timeout
      bestStreak: gameStats.bestStreak
    };

    // Update UI immediately
    setGameStats(newStats);

    // Handle persistence
    if (isConnected && address) {
      scheduleDelayedSave(false);
    } else {
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(newStats));
    }
  }, [currentQuestion, showResult, gameStats, isConnected, address, scheduleDelayedSave]);

  // Timer logic for questions
  useEffect(() => {
    if (timerActive && timeRemaining > 0 && !showResult) {
      questionTimerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && !showResult) {
      // Time's up - treat as incorrect answer
      handleTimeExpired();
    }

    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
    };
  }, [timerActive, timeRemaining, showResult, handleTimeExpired]);

  // Generate a new question from offline questions
  const generateQuestion = () => {
    setIsLoading(true);
    setTimerActive(false);
    
    // Clear any existing timer
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }
    
    // Small delay to show loading animation
    setTimeout(() => {
      const question = getRandomQuestion();
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsLoading(false);
      setTimeRemaining(15);
      setTimerActive(true);
    }, 500);
  };

  // Check answer
  const checkAnswer = (selectedIndex: number) => {
    if (!currentQuestion || showResult) return;

    // Stop the timer
    setTimerActive(false);
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }

    setSelectedAnswer(selectedIndex);
    const correct = selectedIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // Calculate new stats immediately for UI
    const newStats = {
      ...gameStats,
      totalQuestions: gameStats.totalQuestions + 1,
      correctAnswers: correct ? gameStats.correctAnswers + 1 : gameStats.correctAnswers,
      currentStreak: correct ? gameStats.currentStreak + 1 : 0,
      bestStreak: correct 
        ? Math.max(gameStats.bestStreak, gameStats.currentStreak + 1)
        : gameStats.bestStreak
    };

    // Update UI immediately
    setGameStats(newStats);

    // Handle persistence
    if (isConnected && address) {
      // For connected users: schedule delayed database save
      scheduleDelayedSave(correct);
    } else {
      // For non-connected users: continue using localStorage immediately
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(newStats));
    }
  };

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    generateQuestion();
  };

  // Reset game
  const resetGame = () => {
    // Clear timer
    setTimerActive(false);
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }
    
    setGameStarted(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setTimeRemaining(15);
  };

  // Reset stats
  const resetStats = async () => {
    const freshStats = {
      correctAnswers: 0,
      totalQuestions: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    // Update UI immediately
    setGameStats(freshStats);

    if (isConnected && address) {
      try {
        // Save any pending changes first, then reset
        if (pendingStatsRef.current) {
          await saveToDatabase();
        }
        await resetTriviaStats(address);
      } catch (error) {
        console.error('Error resetting database stats:', error);
        // Fallback to localStorage
        localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
      }
    } else {
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
    }
  };

  // Calculate accuracy
  const accuracy = gameStats.totalQuestions > 0 
    ? Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100)
    : 0;

  // Progress to 100 correct answers
  const progress = Math.min((gameStats.correctAnswers / 100) * 100, 100);

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-light text-black mb-4">AI Trivia</h1>
            <p className="text-xl text-gray-600 font-light">
              Test your knowledge with curated trivia questions
            </p>
          </div>

          {/* Stats Overview */}
          {gameStats.totalQuestions > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="text-center">
                <div className="text-3xl font-light text-black mb-2">{gameStats.correctAnswers}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-black mb-2">{accuracy}%</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-black mb-2">{gameStats.currentStreak}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Streak</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-black mb-2">{gameStats.bestStreak}</div>
                <div className="text-sm text-gray-500 uppercase tracking-wider">Best</div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {gameStats.correctAnswers > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Progress to 100 correct answers</span>
                <span className="text-sm text-black font-medium">{gameStats.correctAnswers}/100</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {gameStats.correctAnswers >= 100 && (
                <div className="mt-4 p-4 bg-black text-white rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="w-5 h-5" />
                    <span>Congratulations! You've earned a 0.01 USDC discount!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={startGame}
              className="w-full max-w-md mx-auto bg-black text-white py-4 px-8 rounded-none font-light text-lg transition-all hover:bg-gray-900 flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5" />
              {gameStats.totalQuestions > 0 ? 'Continue Playing' : 'Start Game'}
            </button>
            
            {gameStats.totalQuestions > 0 && (
              <button
                onClick={resetStats}
                className="w-full max-w-md mx-auto border border-gray-300 text-gray-600 py-3 px-8 rounded-none font-light transition-all hover:border-black hover:text-black flex items-center justify-center gap-3"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Statistics
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={resetGame}
            className="text-gray-500 hover:text-black transition-colors mb-4 flex items-center gap-2 mx-auto"
          >
            ← Back to Menu
          </button>
          
          {/* Stats Bar */}
          <div className="flex justify-center gap-8 mb-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-light text-black">{gameStats.correctAnswers}</div>
              <div className="text-gray-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-black">{gameStats.currentStreak}</div>
              <div className="text-gray-500">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-black">{accuracy}%</div>
              <div className="text-gray-500">Accuracy</div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="w-full max-w-md mx-auto bg-gray-100 h-1 rounded">
            <div 
              className="bg-black h-1 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{gameStats.correctAnswers}/100 to earn discount</div>
        </div>

        {/* Question Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin w-8 h-8 border-2 border-black border-r-transparent rounded-full mb-4"></div>
              <p className="text-gray-600">Loading question...</p>
            </div>
          ) : currentQuestion ? (
            <div>
              {/* Category and Timer */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500 uppercase tracking-wider">
                  {currentQuestion.category}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  timeRemaining <= 5 
                    ? 'bg-red-100 text-red-700' 
                    : timeRemaining <= 10 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Clock className="w-4 h-4" />
                  {timeRemaining}s
                </div>
              </div>
              
              {/* Question */}
              <h2 className="text-2xl font-light text-black mb-8 text-center leading-relaxed">
                {currentQuestion.question}
              </h2>

              {/* Answer Options */}
              <div className="grid gap-3 max-w-2xl mx-auto">
                {currentQuestion.options.map((option, index) => {
                  let buttonClass = "w-full p-4 text-left border transition-all font-light text-lg ";
                  
                  if (showResult) {
                    if (index === currentQuestion.correctAnswer) {
                      buttonClass += "border-green-500 bg-green-50 text-green-700";
                    } else if (index === selectedAnswer && !isCorrect) {
                      buttonClass += "border-red-500 bg-red-50 text-red-700";
                    } else {
                      buttonClass += "border-gray-200 text-gray-500";
                    }
                  } else {
                    buttonClass += selectedAnswer === index 
                      ? "border-black bg-black text-white"
                      : "border-gray-200 hover:border-black hover:bg-gray-50 text-black";
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => !showResult && checkAnswer(index)}
                      disabled={showResult}
                      className={buttonClass}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="flex-1 text-left">
                          {option}
                        </span>
                        {showResult && index === currentQuestion.correctAnswer && (
                          <Check className="w-5 h-5 ml-auto flex-shrink-0" />
                        )}
                        {showResult && index === selectedAnswer && !isCorrect && (
                          <X className="w-5 h-5 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Result and Next Question */}
        {showResult && (
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 ${
              isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              {isCorrect ? 'Correct!' : timeRemaining === 0 ? 'Time\'s up!' : 'Incorrect'}
            </div>
            
            <button
              onClick={generateQuestion}
              className="bg-black text-white py-3 px-8 rounded-none font-light transition-all hover:bg-gray-900"
            >
              Next Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITriviaGame;