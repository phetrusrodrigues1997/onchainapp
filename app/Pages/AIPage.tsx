'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Check, X, RotateCcw, Trophy, Zap, Clock } from 'lucide-react';
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
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(18);
  const [timerActive, setTimerActive] = useState(false);
  const [congratulationsShown, setCongratulationsShown] = useState(false);
  
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Load stats from localStorage only
  useEffect(() => {
    const savedStats = localStorage.getItem('prediwin-trivia-stats');
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setGameStats(parsedStats);
        // Check if user already hit 100 milestone
        if (parsedStats.correctAnswers >= 100) {
          setCongratulationsShown(true);
        }
      } catch (error) {
        console.error('Error parsing saved stats:', error);
      }
    }
  }, []);

  // Inactivity timer - reset stats after 10 minutes of inactivity
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = new Date();
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    inactivityTimerRef.current = setTimeout(() => {
      // Reset stats due to inactivity
      const freshStats = {
        correctAnswers: 0,
        totalQuestions: 0,
        currentStreak: 0,
        bestStreak: 0
      };
      setGameStats(freshStats);
      setCongratulationsShown(false);
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
      
      // Return to menu
      setGameStarted(false);
      setCurrentQuestion(null);
      setShowResult(false);
    }, 10 * 60 * 1000); // 10 minutes
  }, []);

  // Start inactivity timer when game starts
  useEffect(() => {
    if (gameStarted) {
      resetInactivityTimer();
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    }
  }, [gameStarted, resetInactivityTimer]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) {
        clearTimeout(questionTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  // Handle when timer expires
  const handleTimeExpired = useCallback(() => {
    if (!currentQuestion || showResult) return;
    
    setShowResult(true);
    setIsCorrect(false);
    setTimerActive(false);
    
    // Reset all stats to zero on timeout (treated as wrong answer)
    const freshStats = {
      correctAnswers: 0,
      totalQuestions: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    // Update UI immediately
    setGameStats(freshStats);
    setCongratulationsShown(false);

    // Save to localStorage
    localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
  }, [currentQuestion, showResult]);

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
    // Reset inactivity timer on user activity
    resetInactivityTimer();
    
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
      setTimeRemaining(18);
      setTimerActive(true);
    }, 500);
  };

  // Check answer
  const checkAnswer = (selectedIndex: number) => {
    if (!currentQuestion || showResult) return;

    // Reset inactivity timer on user activity
    resetInactivityTimer();

    // Stop the timer
    setTimerActive(false);
    if (questionTimerRef.current) {
      clearTimeout(questionTimerRef.current);
    }

    setSelectedAnswer(selectedIndex);
    const correct = selectedIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // If wrong answer, reset all stats to zero
    if (!correct) {
      const freshStats = {
        correctAnswers: 0,
        totalQuestions: 0,
        currentStreak: 0,
        bestStreak: 0
      };
      setGameStats(freshStats);
      setCongratulationsShown(false);
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
      return;
    }

    // Calculate new stats for correct answer
    const newStats = {
      ...gameStats,
      totalQuestions: gameStats.totalQuestions + 1,
      correctAnswers: gameStats.correctAnswers + 1,
      currentStreak: gameStats.currentStreak + 1,
      bestStreak: Math.max(gameStats.bestStreak, gameStats.currentStreak + 1)
    };

    // Update UI immediately
    setGameStats(newStats);

    // Check if user just hit 100 correct answers milestone
    if (newStats.correctAnswers === 100 && !congratulationsShown) {
      setCongratulationsShown(true);
    }

    // Save to localStorage
    localStorage.setItem('prediwin-trivia-stats', JSON.stringify(newStats));
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
    setTimeRemaining(18);
  };

  // Reset stats
  const resetStats = () => {
    const freshStats = {
      correctAnswers: 0,
      totalQuestions: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    // Update UI immediately
    setGameStats(freshStats);
    setCongratulationsShown(false);

    // Save to localStorage
    localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
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

          {/* Challenge Rules Warning */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
            <div className="text-center">
              <div className="text-red-600 text-xl font-semibold mb-3">⚠️ Challenge Rules</div>
              <div className="text-red-700 space-y-2">
                <p><strong>Goal:</strong> Answer 100 questions correctly in a row</p>
                <p><strong>⚡ ONE wrong answer</strong> → All progress resets to zero</p>
                <p><strong>⏱️ 10 minutes inactive</strong> → All progress resets to zero</p>
                <p><strong>⏰ 18 seconds per question</strong> → Time up = wrong answer</p>
              </div>
            </div>
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
              {congratulationsShown && gameStats.correctAnswers >= 100 && (
                <div className="mt-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-yellow-800 mb-2">🎉 Congratulations! 🎉</h3>
                    <p className="text-lg text-yellow-700 mb-2">
                      You've successfully answered <strong>100 questions correctly</strong> in a single session!
                    </p>
                    <p className="text-yellow-600">
                      Amazing dedication to knowledge! 🧠✨
                    </p>
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