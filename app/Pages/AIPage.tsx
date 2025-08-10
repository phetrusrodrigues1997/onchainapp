'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Check, X, RotateCcw, Trophy, Zap } from 'lucide-react';
import { useAccount } from 'wagmi';
import { getTriviaStats, updateTriviaStats, resetTriviaStats } from '../Database/actions';

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


  // Generate a new question using OpenAI
  const generateQuestion = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate question');
      }

      const data = await response.json();
      setCurrentQuestion(data.question);
      setSelectedAnswer(null);
      setShowResult(false);
    } catch (error) {
      console.error('Error generating question:', error);
      // Fallback question if API fails
      setCurrentQuestion({
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        category: "Geography"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check answer using OpenAI
  const checkAnswer = async (selectedIndex: number) => {
    if (!currentQuestion) return;

    setSelectedAnswer(selectedIndex);
    const correct = selectedIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // Update stats in database if wallet connected, otherwise localStorage
    if (isConnected && address) {
      try {
        const updatedStats = await updateTriviaStats(address, correct);
        setGameStats({
          correctAnswers: updatedStats.correctAnswers,
          totalQuestions: updatedStats.totalQuestions,
          currentStreak: updatedStats.currentStreak,
          bestStreak: updatedStats.bestStreak
        });
      } catch (error) {
        console.error('Error updating database stats:', error);
        // Fallback to localStorage on database error
        const newStats = {
          ...gameStats,
          totalQuestions: gameStats.totalQuestions + 1,
          correctAnswers: correct ? gameStats.correctAnswers + 1 : gameStats.correctAnswers,
          currentStreak: correct ? gameStats.currentStreak + 1 : 0,
          bestStreak: correct 
            ? Math.max(gameStats.bestStreak, gameStats.currentStreak + 1)
            : gameStats.bestStreak
        };
        localStorage.setItem('prediwin-trivia-stats', JSON.stringify(newStats));
        setGameStats(newStats);
      }
    } else {
      // Update localStorage for non-connected users
      const newStats = {
        ...gameStats,
        totalQuestions: gameStats.totalQuestions + 1,
        correctAnswers: correct ? gameStats.correctAnswers + 1 : gameStats.correctAnswers,
        currentStreak: correct ? gameStats.currentStreak + 1 : 0,
        bestStreak: correct 
          ? Math.max(gameStats.bestStreak, gameStats.currentStreak + 1)
          : gameStats.bestStreak
      };
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(newStats));
      setGameStats(newStats);
    }
  };

  // Start the game
  const startGame = () => {
    setGameStarted(true);
    generateQuestion();
  };

  // Reset game
  const resetGame = () => {
    setGameStarted(false);
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  // Reset stats
  const resetStats = async () => {
    const freshStats = {
      correctAnswers: 0,
      totalQuestions: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    if (isConnected && address) {
      try {
        await resetTriviaStats(address);
        setGameStats(freshStats);
      } catch (error) {
        console.error('Error resetting database stats:', error);
        // Fallback to localStorage
        localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
        setGameStats(freshStats);
      }
    } else {
      localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
      setGameStats(freshStats);
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
              Test your knowledge with AI-generated questions
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
              <p className="text-gray-600">Generating question...</p>
            </div>
          ) : currentQuestion ? (
            <div>
              {/* Category */}
              <div className="text-sm text-gray-500 uppercase tracking-wider mb-4 text-center">
                {currentQuestion.category}
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
              {isCorrect ? 'Correct!' : 'Incorrect'}
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