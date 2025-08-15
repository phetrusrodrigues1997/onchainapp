'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Check, X, RotateCcw, Trophy, Zap, Clock, Gamepad2, Grid3X3, Lock, Star } from 'lucide-react';
import { getRandomQuestion } from '../Constants/triviaQuestions';
import { useAccount } from 'wagmi';
import { EmailCollectionModal, useEmailCollection } from '../Components/EmailCollectionModal';
import { checkEmailExists, saveUserEmail } from '../Database/emailActions';
import Wordle from './wordlePage';

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

// *** PROGRESSIVE MILESTONE SYSTEM ***
// First free entry: 100 correct answers
// Second free entry: 200 correct answers 
// Third free entry: 300 correct answers (and so on...)
// Each subsequent milestone increases by 100

// Helper function to calculate milestone for Nth free entry
const getMilestoneForEntry = (entryNumber: number): number => {
  return entryNumber * 100;
};

const GamesHub = ({ activeSection, setActiveSection }: AIPageProps) => {
  // Game selection state
  const [selectedGame, setSelectedGame] = useState<'hub' | 'trivia' | 'wordle'>('hub');
  
  // Trivia game states
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
  const [currentMilestone, setCurrentMilestone] = useState(getMilestoneForEntry(1));
  const [triviaFreeEntries, setTriviaFreeEntries] = useState(0);
  
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  
  // Wallet and email collection
  const { address, isConnected } = useAccount();
  const emailModalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    showModal: showEmailModal,
    showEmailModal: triggerEmailModal,
    hideEmailModal,
    markEmailCollected,
    setIsEmailCollected,
    isDismissed,
    isEmailCollected: hookEmailCollected
  } = useEmailCollection(address);

  // Load stats from localStorage and set current milestone
  useEffect(() => {
    const savedStats = localStorage.getItem('prediwin-trivia-stats');
    if (savedStats) {
      try {
        const parsedStats = JSON.parse(savedStats);
        setGameStats(parsedStats);
      } catch (error) {
        console.error('Error parsing saved stats:', error);
      }
    }
    
    // Load current milestone based on user's free entries
    if (address) {
      loadCurrentMilestone();
    }
  }, [address]);

  // Function to load the current milestone target based on trivia-specific free entries
  const loadCurrentMilestone = async () => {
    if (!address) return;
    
    try {
      const freeEntriesResponse = await fetch(`/api/user/free-entries?address=${address}&detailed=true`);
      const freeEntriesData = await freeEntriesResponse.json();
      const triviaEntries = freeEntriesData.fromTrivia || 0;
      setTriviaFreeEntries(triviaEntries);
      
      // Calculate milestone based ONLY on trivia free entries earned
      const milestone = getMilestoneForEntry(triviaEntries + 1);
      setCurrentMilestone(milestone);
    } catch (error) {
      console.error('Error loading milestone:', error);
      setCurrentMilestone(getMilestoneForEntry(1)); // Default to first milestone
      setTriviaFreeEntries(0);
    }
  };

  // Email collection logic - trigger 2 seconds after wallet connects
  useEffect(() => {
    const handleEmailCollection = async () => {
      console.log('🔍 AIPage Email Debug:', {
        isConnected,
        address,
        activeSection,
        condition: isConnected && address && activeSection === 'AI'
      });

      if (isConnected && address && activeSection === 'AI') {
        console.log('✅ Wallet connected on AI page, checking email...');
        console.log('📧 Hook email collected state:', hookEmailCollected);
        console.log('📧 Dismissal state:', isDismissed);
        
        // First check the hook's state - it's the single source of truth
        if (hookEmailCollected) {
          console.log('📧 Hook says email already collected, not showing modal');
          return;
        }

        if (isDismissed) {
          console.log('📧 Modal was dismissed, not showing modal');
          return;
        }
        
        // Only check database if hook doesn't have email collected info yet
        try {
          const emailExists = await checkEmailExists(address);
          console.log('📧 Database email check result:', emailExists);
          
          if (emailExists) {
            console.log('📧 Database says email exists, updating hook state');
            setIsEmailCollected(true);
            return;
          }
          
          // Clear any existing timer
          if (emailModalRef.current) {
            clearTimeout(emailModalRef.current);
          }
          
          console.log('⏰ Setting 2-second timer for email modal...');
          // Show modal after 2 seconds
          emailModalRef.current = setTimeout(() => {
            console.log('🎯 Timer triggered! Showing email modal...');
            triggerEmailModal();
          }, 2000);
        } catch (error) {
          console.error('❌ Error checking email status:', error);
        }
      } else {
        console.log('❌ Conditions not met for email modal');
        // Clear timer if wallet disconnects or user leaves page
        if (emailModalRef.current) {
          clearTimeout(emailModalRef.current);
          emailModalRef.current = null;
        }
      }
    };

    handleEmailCollection();
    
    return () => {
      if (emailModalRef.current) {
        clearTimeout(emailModalRef.current);
      }
    };
  }, [isConnected, address, activeSection, triggerEmailModal, setIsEmailCollected, isDismissed, hookEmailCollected]);

  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    if (!address) return;
    
    console.log('📧 Starting email submission for:', email);
    try {
      const result = await saveUserEmail(address, email, 'AI');
      console.log('📧 saveUserEmail result:', result);
      
      if (result.success) {
        console.log('📧 Email saved successfully, marking as collected in hook...');
        markEmailCollected(); // This should be the single source of truth
        console.log('📧 Hook state updated with markEmailCollected()');
      } else {
        throw new Error(result.error || 'Failed to save email');
      }
    } catch (error) {
      console.error('❌ Email submission error:', error);
      throw error;
    }
  };

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
      
      // Reset milestone to appropriate level based on current trivia free entries
      const resetMilestone = getMilestoneForEntry(triviaFreeEntries + 1);
      setCurrentMilestone(resetMilestone);
      
      // Return to menu
      setGameStarted(false);
      setCurrentQuestion(null);
      setShowResult(false);
    }, 10 * 60 * 1000); // 10 minutes
  }, [triviaFreeEntries]);

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

    // Reset milestone to appropriate level based on current trivia free entries
    const resetMilestone = getMilestoneForEntry(triviaFreeEntries + 1);
    setCurrentMilestone(resetMilestone);

    // Save to localStorage
    localStorage.setItem('prediwin-trivia-stats', JSON.stringify(freshStats));
  }, [currentQuestion, showResult, triviaFreeEntries]);

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
      
      // Reset milestone to appropriate level based on current trivia free entries
      const resetMilestone = getMilestoneForEntry(triviaFreeEntries + 1);
      setCurrentMilestone(resetMilestone);
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

    // Check if milestone reached (using current cached milestone, not API call)
    if (newStats.correctAnswers === currentMilestone && !congratulationsShown) {
      setCongratulationsShown(true);
      
      // Award free entry for trivia victory
      if (address) {
        awardTriviaFreeEntry(address).then(() => {
          // Update milestone for next reward after awarding
          const nextMilestone = getMilestoneForEntry(triviaFreeEntries + 2);
          setCurrentMilestone(nextMilestone);
          setTriviaFreeEntries(prev => prev + 1);
        });
      }
      
      // Reset the game after awarding entry
      setTimeout(() => {
        resetGame();
        setCongratulationsShown(false);
      }, 5000); // Show congratulations for 5 seconds, then reset
    }

    // Save to localStorage
    localStorage.setItem('prediwin-trivia-stats', JSON.stringify(newStats));
  }

  // Function to award trivia free entry via API
  const awardTriviaFreeEntry = async (walletAddress: string) => {
    try {
      const response = await fetch('/api/trivia/award-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      if (response.ok) {
        console.log('Free entry awarded for trivia victory!');
      } else {
        console.error('Failed to award free entry');
      }
    } catch (error) {
      console.error('Error awarding free entry:', error);
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

  // Progress to current milestone
  const progress = Math.min((gameStats.correctAnswers / currentMilestone) * 100, 100);

  // Render different game views
  if (selectedGame === 'wordle') {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto p-4">
          <button
            onClick={() => setSelectedGame('hub')}
            className="mb-4 text-gray-600 hover:text-black transition-colors flex items-center gap-2"
          >
            ← Back to Games
          </button>
          <Wordle 
            activeSection={activeSection} 
            setActiveSection={setActiveSection}
          />
        </div>
      </div>
    );
  }

  if (selectedGame === 'trivia' && !gameStarted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedGame('hub')}
              className="text-gray-600 hover:text-black transition-colors flex items-center gap-2 mx-auto"
            >
              ← Back to Games
            </button>
          </div>
          
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
          <div className="bg-[#f2f2f2]  rounded-lg p-6 mb-8">
            <div className="text-center">
               <div className="text-red-600 text-xl font-semibold mb-3">⚠️ Win free pot entries by answering questions correctly in a row!</div>
               <div className="text-gray-700 space-y-2 text-sm">
                <p><strong>🎯 1st Free Entry:</strong> {getMilestoneForEntry(1)} correct answers</p>
                <p><strong>🎯 2nd Free Entry:</strong> {getMilestoneForEntry(2)} correct answers</p>
                <p><strong>🎯 3rd Free Entry:</strong> {getMilestoneForEntry(3)} correct answers (and so on...)</p>
                <p className="text-red-600"><strong>⚡ ONE wrong answer</strong> → All progress resets to zero</p>
                <p className="text-red-600"><strong>⏱️ 10 minutes inactive</strong> → All progress resets to zero</p>
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
                <span className="text-sm text-gray-600">Progress to next free entry</span>
                <span className="text-sm text-black font-medium">{gameStats.correctAnswers}/{currentMilestone}</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {congratulationsShown && gameStats.correctAnswers >= getMilestoneForEntry(1) && (
                <div className="mt-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-yellow-800 mb-2">🎉 Congratulations! 🎉</h3>
                    <p className="text-lg text-yellow-700 mb-2">
                      You've successfully answered <strong>{gameStats.correctAnswers} questions correctly</strong> in a single session!
                    </p>
                    <p className="text-yellow-600 mb-2">
                      Amazing dedication to knowledge! 🧠✨
                    </p>
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3 mt-3">
                      <p className="text-green-800 font-medium">
                        🎁 <strong>Free Pot Entry Earned!</strong>
                      </p>
                      <p className="text-green-700 text-sm">
                        You can now enter any prediction pot for free!
                      </p>
                      <p className="text-green-600 text-xs mt-2">
                        Game will reset in 5 seconds... Next milestone: {getMilestoneForEntry(triviaFreeEntries + 2)} correct answers!
                      </p>
                    </div>
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
        
        {/* Email Collection Modal */}
        <EmailCollectionModal
          isOpen={showEmailModal}
          onClose={hideEmailModal}
          onSubmit={handleEmailSubmit}
          sourcePage="AI"
        />
      </div>
    );
  }

  if (selectedGame === 'trivia' && gameStarted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => {
                resetGame();
                setSelectedGame('hub');
              }}
              className="text-gray-500 hover:text-black transition-colors mb-4 flex items-center gap-2 mx-auto"
            >
              ← Back to Games
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
          <div className="text-xs text-gray-500 mt-1">{gameStats.correctAnswers}/{currentMilestone} to earn free entry</div>
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
        
        {/* Email Collection Modal */}
        <EmailCollectionModal
          isOpen={showEmailModal}
          onClose={hideEmailModal}
          onSubmit={handleEmailSubmit}
          sourcePage="AI"
        />
      </div>
    );
  }

  // Main Games Hub Interface
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-full mb-8">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-light text-black mb-6">Games Hub</h1>
          <p className="text-2xl text-gray-600 font-light max-w-2xl mx-auto">
            Challenge your mind with our collection of engaging games
          </p>
        </div>

        {/* Available Games */}
        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          

          {/* Wordle Game */}
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-black transition-all group cursor-pointer"
               onClick={() => setSelectedGame('wordle')}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Grid3X3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-light text-black mb-3">Wordle</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Guess the 5-letter word in 6 attempts. Be the first to solve today's puzzle and earn a free pot entry!
              </p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <Star className="w-4 h-4 mr-2" />
                🎁 Free pot entry reward
              </div>
            </div>
          </div>

          {/* AI Trivia Game */}
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-black transition-all group cursor-pointer"
               onClick={() => setSelectedGame('trivia')}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-light text-black mb-3">AI Trivia</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Test your knowledge across 25+ categories. First milestone: {getMilestoneForEntry(1)} correct answers. Each additional free entry requires 100 more correct answers!
              </p>
              <div className="flex items-center text-sm text-green-600 font-medium">
                <Trophy className="w-4 h-4 mr-2" />
                🎁 Free pot entry reward
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-12 max-w-3xl mx-auto">
          <h2 className="text-3xl font-light text-black mb-6">More Games Coming Soon</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We're working on exciting new games to expand your gaming experience
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Coming Soon Game Cards */}
            {[
              { name: 'Chess Puzzles', icon: '♟️' },
              { name: 'Math Challenge', icon: '🔢' },
              { name: 'Memory Game', icon: '🧠' },
              { name: 'Word Search', icon: '🔍' }
            ].map((game, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 relative">
                <div className="absolute top-2 right-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl mb-3">{game.icon}</div>
                <h4 className="text-sm font-medium text-gray-600">{game.name}</h4>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            Stay tuned for updates and new game releases!
          </div>
        </div>
        
        {/* Email Collection Modal */}
        <EmailCollectionModal
          isOpen={showEmailModal}
          onClose={hideEmailModal}
          onSubmit={handleEmailSubmit}
          sourcePage="AI"
        />
      </div>
    </div>
  );
};

export default GamesHub;