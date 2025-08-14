'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { placeLivePrediction } from '../Database/actions';
import { determineWinnersLive, clearLivePredictions } from '../Database/OwnerActions';

// Configure the time interval for new questions (in minutes)
const QUESTION_INTERVAL_MINUTES = 15;

// Contract ABI for owner functions
const LIVE_POT_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address[]", "name": "winners", "type": "address[]"}],
    "name": "distributePot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Live pot contract address
const LIVE_POT_ADDRESS = '0xbaA1ef49db42a483B42477D633E9ABc77EFdF965';

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
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    question: 'Loading question...',
    timeRemaining: 0,
    questionId: null,
    startTime: '',
    endTime: ''
  });
  const [nextQuestion, setNextQuestion] = useState<QuestionData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userPrediction, setUserPrediction] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Owner functionality state
  const [outcomeInput, setOutcomeInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Read contract owner
  const { data: owner } = useReadContract({
    address: LIVE_POT_ADDRESS as `0x${string}`,
    abi: LIVE_POT_ABI,
    functionName: 'owner',
  }) as { data: string | undefined };

  // Read pot balance
  const { data: potBalance } = useReadContract({
    address: LIVE_POT_ADDRESS as `0x${string}`,
    abi: LIVE_POT_ABI,
    functionName: 'getBalance',
  }) as { data: bigint | undefined };

  // Wait for transaction receipt
  const { data: receipt, isSuccess: isDistributionConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check if current user is owner
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

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
          // Force immediate fetch and update
          fetchCurrentQuestion().then(question => {
            if (question && question.questionId !== prev.questionId) {
              // If a new question is available, update immediately without transition
              setCurrentQuestion(question);
            }
          });
        }
        
        // Additional backup: if timer is at 0 for more than 2 seconds, force refresh
        if (newTimeRemaining === 0 && prev.timeRemaining === 0) {
          fetchCurrentQuestion().then(question => {
            if (question && question.questionId !== prev.questionId) {
              setCurrentQuestion(question);
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

  const formatUsdcBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.00';
    try {
      const formatted = formatUnits(balance, 6);
      return parseFloat(formatted).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const handlePrediction = async (prediction: 'positive' | 'negative') => {
    if (!address || isSubmitting || isTransitioning) return;
    
    setIsSubmitting(true);
    try {
      await placeLivePrediction(address, prediction);
      setUserPrediction(prediction);
    } catch (error) {
      console.error('Failed to place prediction:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle automated winner processing and pot distribution
  const handleProcessWinners = async () => {
    if (!address || !outcomeInput.trim() || isProcessing) return;

    if (outcomeInput !== "positive" && outcomeInput !== "negative") {
      setProcessMessage("Please enter 'positive' or 'negative'");
      return;
    }

    setIsProcessing(true);
    setLastAction('processWinners');
    
    try {
      // Step 1: Determine winners
      setProcessMessage("Step 1/3: Determining winners...");
      const winnersString = await determineWinnersLive(outcomeInput as "positive" | "negative");
      
      if (!winnersString || winnersString.trim() === "") {
        setProcessMessage("No winners found for this question");
        setIsProcessing(false);
        setLastAction('');
        return;
      }
      
      // Parse winner addresses
      const addresses = winnersString.split(',').map(addr => addr.trim()).filter(addr => addr);
      
      if (addresses.length === 0) {
        setProcessMessage("No valid winner addresses found");
        setIsProcessing(false);
        setLastAction('');
        return;
      }
      
      setProcessMessage(`Found ${addresses.length} winner(s). Step 2/3: Distributing pot...`);
      
      // Step 2: Distribute pot using the blockchain contract
      await writeContract({
        address: LIVE_POT_ADDRESS as `0x${string}`,
        abi: LIVE_POT_ABI,
        functionName: 'distributePot',
        args: [addresses],
      });
      
      setProcessMessage("Pot distribution transaction submitted! Step 3/3 will happen after confirmation...");
    } catch (error) {
      console.error('Failed to process winners:', error);
      setProcessMessage('Failed to process winners and distribute pot');
      setIsProcessing(false);
      setLastAction('');
    }
  };

  // Handle transaction confirmation
  useEffect(() => {
    if (isDistributionConfirmed && receipt && isProcessing && lastAction === 'processWinners') {
      // This handles the combined action - pot distribution is confirmed, now clear predictions
      const finishProcessing = async () => {
        try {
          setProcessMessage("Step 3/3: Clearing live predictions...");
          await clearLivePredictions();
          setProcessMessage("🎉 Winners processed successfully! Pot distributed and predictions cleared!");
          setOutcomeInput('');
          setTimeout(() => {
            setProcessMessage('');
          }, 5000);
        } catch (error) {
          setProcessMessage("Pot distributed but failed to clear predictions. Please clear manually.");
        } finally {
          setIsProcessing(false);
          setLastAction('');
        }
      };
      
      finishProcessing();
    }
  }, [isDistributionConfirmed, receipt, isProcessing, lastAction]);

  return (
    <>
      <style>{`
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
      
      <div className={`relative max-w-4xl mx-auto -translate-y-8 ${className}`}>
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
            {/* Pot Balance Display - Top Right */}
            <div className="flex justify-end mb-2">
              <div className="text-xs text-gray-500 font-mono">
                Pot: ${formatUsdcBalance(potBalance)}
              </div>
            </div>

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
              <button 
                onClick={() => handlePrediction('positive')}
                className={`group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                  isTransitioning || isSubmitting || !address ? 'opacity-60 cursor-wait' : ''
                } ${userPrediction === 'positive' ? 'bg-green-100 border-green-600' : ''}`} 
                disabled={isTransitioning || isSubmitting || !address}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <span className="text-3xl">{isSubmitting && userPrediction !== 'positive' ? '⏳' : '✓'}</span>
                  <span className="tracking-widest">{userPrediction === 'positive' ? 'SELECTED' : 'YES'}</span>
                </div>
                {/* Button Corner Effects */}
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              
              <button 
                onClick={() => handlePrediction('negative')}
                className={`group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                  isTransitioning || isSubmitting || !address ? 'opacity-60 cursor-wait' : ''
                } ${userPrediction === 'negative' ? 'bg-red-100 border-red-600' : ''}`} 
                disabled={isTransitioning || isSubmitting || !address}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  <span className="text-3xl">{isSubmitting && userPrediction !== 'negative' ? '⏳' : '✗'}</span>
                  <span className="tracking-widest">{userPrediction === 'negative' ? 'SELECTED' : 'NO'}</span>
                </div>
                {/* Button Corner Effects */}
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>

            
          </div>
        </div>

        {/* Owner Controls */}
        {isOwner && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-black text-white border-2 border-red-500 rounded-xl shadow-2xl overflow-hidden">
              <div className="bg-red-600 text-white px-6 py-4">
                <h2 className="text-xl font-black tracking-wider">🔧 OWNER CONTROLS</h2>
                <p className="text-red-200 text-sm">Set outcome and process winners automatically</p>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Question Outcome
                  </label>
                  <input
                    type="text"
                    placeholder="positive or negative"
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>

                <button
                  onClick={handleProcessWinners}
                  disabled={isProcessing || isPending || !outcomeInput.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                  {isProcessing || isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Winners...
                    </>
                  ) : (
                    '🏆 Process Winners & Distribute Pot'
                  )}
                </button>

                {processMessage && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    processMessage.includes('Failed') || processMessage.includes('Please enter') 
                      ? 'bg-red-900/50 border border-red-500 text-red-200' 
                      : 'bg-green-900/50 border border-green-500 text-green-200'
                  }`}>
                    {processMessage}
                  </div>
                )}

                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">
                    <strong>Instructions:</strong> Enter "positive" or "negative" as the correct answer for the current question. 
                    The system will automatically find winners who predicted correctly, distribute the pot equally among them, 
                    and clear today's predictions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}