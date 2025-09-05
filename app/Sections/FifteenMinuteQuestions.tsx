'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import { AlertTriangle, Clock, FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { placeLivePrediction, getUserLivePrediction, submitEvidence, getUserEvidenceSubmission, getAllEvidenceSubmissions } from '../Database/actions';
import { determineWinnersLive, clearLivePredictions, setProvisionalOutcome, getProvisionalOutcome, clearLiveMarketOutcome, clearLiveEvidenceSubmissions } from '../Database/OwnerActions';
import { getPrice } from '../Constants/getPrice';

// Configure the time interval for new questions (in minutes)
const QUESTION_INTERVAL_MINUTES = 60;

// Contract ABI matching PredictionPot.sol exactly
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
    "inputs": [{"internalType": "address", "name": "participant", "type": "address"}],
    "name": "enterPotFree",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
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

// Live pot contract address - PredictionPot (ETH-based, lightweight version)
const LIVE_POT_ADDRESS = '0xDc6725F0E3D654c3Fde0480428b194ab19F20a9E';

interface FifteenMinuteQuestionsProps {
  className?: string;
  setActiveSection?: (section: string) => void;
}

interface QuestionData {
  question: string;
  timeRemaining: number;
  questionId: string | null;
}

export default function FifteenMinuteQuestions({ className = '', setActiveSection }: FifteenMinuteQuestionsProps) {
  const { address } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const queryClient = useQueryClient();
  
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    question: 'Loading question...',
    timeRemaining: 0, // Will be calculated on first fetch
    questionId: null
  });
  const [nextQuestion, setNextQuestion] = useState<QuestionData | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userPrediction, setUserPrediction] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  
  // Loading and pot entry state
  const [isLoading, setIsLoading] = useState(true);
  const [hasEnteredPot, setHasEnteredPot] = useState(false);
  const [isCheckingPotEntry, setIsCheckingPotEntry] = useState(false);
    const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  
  
  // Owner functionality state
  const [outcomeInput, setOutcomeInput] = useState<'positive' | 'negative' | ''>('');
  const [finalOutcomeInput, setFinalOutcomeInput] = useState<'positive' | 'negative' | ''>(''); // Separate state for final outcome
  const [isProcessing, setIsProcessing] = useState(false);
  const [processMessage, setProcessMessage] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  
  // Evidence submission state
  const [evidenceText, setEvidenceText] = useState<string>('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [userEvidenceSubmission, setUserEvidenceSubmission] = useState<any>(null);
  const [isEvidenceSectionExpanded, setIsEvidenceSectionExpanded] = useState(true);
  const [marketOutcome, setMarketOutcome] = useState<any>(null);
  const [allEvidenceSubmissions, setAllEvidenceSubmissions] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [timeUntilEvidenceExpires, setTimeUntilEvidenceExpires] = useState<number>(0);
  
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

  // Read pot participants to check if user has entered
  const { data: participants } = useReadContract({
    address: LIVE_POT_ADDRESS as `0x${string}`,
    abi: [
      {
        "inputs": [],
        "name": "getParticipants",
        "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'getParticipants',
    query: { enabled: !!address }
  }) as { data: string[] | undefined };

  // Wait for transaction receipt
  const { data: receipt, isSuccess: isDistributionConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check if current user is owner
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  // Check if user has entered the pot
  const checkPotEntry = async () => {
    if (!address || !participants) {
      console.log('No address or participants, setting hasEnteredPot to false');
      setHasEnteredPot(false);
      return;
    }
    
    const hasEntered = participants.some(
      participant => participant.toLowerCase() === address.toLowerCase()
    );
    console.log('User has entered pot:', hasEntered);
    setHasEnteredPot(hasEntered);
  };

  // Calculate seconds until next hour (top of the hour :00)
  const getSecondsUntilNextSlot = (): number => {
    const now = new Date();
    
    // Next slot is always at :00 of the next hour
    const nextHour = new Date(now);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
    
    return Math.floor((nextHour.getTime() - now.getTime()) / 1000);
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
        timeRemaining: getSecondsUntilNextSlot(), // Calculate real-time remaining
        questionId: data.questionId
      };
      
    } catch (error) {
      console.error('Error fetching live question:', error);
      return {
        question: `Will bitcoin fall by $1000 in the next ${QUESTION_INTERVAL_MINUTES} minutes?`,
        timeRemaining: getSecondsUntilNextSlot(), // Calculate real-time remaining
        questionId: null
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
        const newTimeRemaining = getSecondsUntilNextSlot(); // Recalculate real-time remaining
        
        // Prefetch next question 30 seconds before current expires
        if (newTimeRemaining === 30 && !nextQuestion) {
          prefetchNextQuestion();
        }
        
        // Server-side cleanup will handle expired questions automatically
        // No frontend deletion needed
        
        // Transition when 15-minute mark is reached
        if (newTimeRemaining === 0 && prev.timeRemaining > 0 && nextQuestion) {
          transitionToNextQuestion();
        }
        
        // If we hit the 15-minute mark and no next question, fetch immediately
        if (newTimeRemaining === 0 && prev.timeRemaining > 0 && !nextQuestion) {
          // Force immediate fetch and update
          fetchCurrentQuestion().then(question => {
            if (question && question.questionId !== prev.questionId) {
              // If a new question is available, update immediately without transition
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
    const baseInterval = getSecondsUntilNextSlot() > 120 ? 120 * 1000 : 60 * 1000; // 2 min or 1 min
    
    fetchIntervalRef.current = setInterval(async () => {
      // Don't fetch if we're about to transition (within 10 seconds of 15-minute mark)
      const timeRemaining = getSecondsUntilNextSlot();
      if (timeRemaining > 10) {
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

  // Initialize and setup smart fetching with loading screen
  useEffect(() => {
    const initializeQuestions = async () => {
      // Show loading for at least 2 seconds
      const loadingPromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      const question = await fetchCurrentQuestion();
      if (question) {
        setCurrentQuestion(question);
        
        // If question expires soon, prefetch the next one
        if (question.timeRemaining <= 60) {
          setTimeout(prefetchNextQuestion, 1000);
        }
      }
      
      setupSmartFetching();
      
      // Wait for loading screen duration
      await loadingPromise;
      setIsLoading(false);
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

  // Check pot entry when participants data changes
  useEffect(() => {
    checkPotEntry();
  }, [participants, address]);

  // Add effect to refresh contract data when user might have entered pot
  useEffect(() => {
    // Set up an interval to periodically refresh contract data
    // This ensures the UI updates when user enters pot from another component
    const refreshInterval = setInterval(() => {
      if (address && !hasEnteredPot) {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
      }
    }, 2000); // Check every 2 seconds if user hasn't entered pot yet

    return () => clearInterval(refreshInterval);
  }, [address, hasEnteredPot, queryClient]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Page became visible, sync with current question
        // This will also trigger server-side cleanup of expired questions
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

  // Fetch ETH price
    useEffect(() => {
      const fetchEthPrice = async () => {
        try {
          const price = await getPrice('ETH');
          setEthPrice(price);
          setIsLoadingPrice(false);
        } catch (error) {
          console.error('Failed to fetch ETH price:', error);
          setEthPrice(3000); // Fallback price
          setIsLoadingPrice(false);
        }
      };
  
      fetchEthPrice();
      
      // Refresh price every 5 minutes
      const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatEthBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.0000';
    try {
      const formatted = formatUnits(balance, 18);
      return parseFloat(formatted).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const handlePrediction = async (prediction: 'positive' | 'negative') => {
    // Security Layer 1: Basic validation
    if (!address || isSubmitting || isTransitioning) {
      console.warn('❌ Prediction blocked: Basic validation failed');
      return;
    }
    
    // Security Layer 2: Pot participation validation
    if (!hasEnteredPot) {
      console.error('❌ SECURITY: User attempted to predict without being in pot');
      alert('❌ You must be a pot participant to make predictions!');
      return;
    }
    
    // Security Layer 3: Real-time contract validation
    if (!participants || !participants.some(p => p.toLowerCase() === address.toLowerCase())) {
      console.error('❌ SECURITY: User not found in contract participants');
      alert('❌ You are not a confirmed pot participant!');
      // Force refresh participant state
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      return;
    }
    
    console.log('✅ Prediction security validation passed for:', address);
    
    setIsSubmitting(true);
    try {
      await placeLivePrediction(address, prediction);
      setUserPrediction(prediction);
      console.log('✅ Prediction placed successfully:', { address, prediction });
    } catch (error) {
      console.error('❌ Failed to place prediction:', error);
      alert('Failed to place prediction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load user's existing prediction on component mount
  useEffect(() => {
    const loadUserPrediction = async () => {
      if (!address) {
        console.log('No address, skipping prediction load');
        return;
      }
      
      try {
        const prediction = await getUserLivePrediction(address);
        
        if (prediction && (prediction.prediction === 'positive' || prediction.prediction === 'negative')) {
          console.log('Setting user prediction to:', prediction.prediction);
          setUserPrediction(prediction.prediction as 'positive' | 'negative');
        } else {
          console.log('No valid prediction found, user prediction remains null');
          setUserPrediction(null);
        }
      } catch (error) {
        console.error('Failed to load user prediction:', error);
        setUserPrediction(null);
      }
    };

    loadUserPrediction();
  }, [address]);

  // Load market outcome and evidence data
  useEffect(() => {
    const loadMarketData = async () => {
      if (!address) return;
      
      try {
        // Get provisional outcome set by admin
        const outcome = await getProvisionalOutcome('live', 'Live Question');
        setMarketOutcome(outcome);
        
        if (outcome) {
          // Load user's evidence submission
          const outcomeDate = outcome.setAt.split('T')[0]; // setAt is already a string from toISOString()
          const userEvidence = await getUserEvidenceSubmission(address, 'live', outcomeDate);
          setUserEvidenceSubmission(userEvidence);
          
          // Calculate time until evidence expires
          const now = new Date().getTime();
          const expiry = new Date(outcome.evidenceWindowExpires).getTime();
          setTimeUntilEvidenceExpires(Math.max(0, Math.floor((expiry - now) / 1000)));
        }
      } catch (error) {
        console.error('Failed to load market data:', error);
      }
    };

    loadMarketData();
  }, [address]); // Note: We'll reload this manually when needed
  
  // Load admin evidence submissions
  useEffect(() => {
    const loadAllEvidence = async () => {
      if (!isOwner || !marketOutcome) return;
      
      try {
        const outcomeDate = marketOutcome.setAt.split('T')[0]; // setAt is already a string from toISOString()
        const evidence = await getAllEvidenceSubmissions('live', outcomeDate);
        setAllEvidenceSubmissions(evidence);
      } catch (error) {
        console.error('Failed to load evidence submissions:', error);
      }
    };

    loadAllEvidence();
  }, [isOwner, marketOutcome, showAdminPanel]);

  // Handle evidence submission
  const handleEvidenceSubmission = async () => {
    console.log('Evidence submission triggered!');
    console.log('Validation check:', {
      address: !!address,
      evidenceText: evidenceText.length,
      marketOutcome: !!marketOutcome
    });
    
    if (!address) {
      console.log('No address - user not connected');
      setProcessMessage('Please connect your wallet first.');
      setTimeout(() => setProcessMessage(''), 3000);
      return;
    }
    
    if (!evidenceText.trim()) {
      console.log('No evidence text provided');
      setProcessMessage('Please enter evidence text.');
      setTimeout(() => setProcessMessage(''), 3000);
      return;
    }
    
    if (!marketOutcome) {
      console.log('No market outcome available');
      setProcessMessage('No market outcome available for evidence submission.');
      setTimeout(() => setProcessMessage(''), 3000);
      return;
    }
    
    console.log('All validation passed, submitting evidence...');
    setIsSubmittingEvidence(true);
    
    try {
      const outcomeDate = marketOutcome.setAt.split('T')[0]; // setAt is already a string from toISOString()
      console.log('Submitting evidence for date:', outcomeDate);
      
      const result = await submitEvidence(
        address,
        'live',
        outcomeDate,
        evidenceText.trim()
      );
      
      console.log('Evidence submission result:', result);
      
      if (result.success) {
        setProcessMessage('Evidence submitted successfully! Awaiting admin review.');
        setEvidenceText('');
        
        // Reload evidence submission
        const userEvidence = await getUserEvidenceSubmission(address, 'live', outcomeDate);
        setUserEvidenceSubmission(userEvidence);
        
        setTimeout(() => setProcessMessage(''), 5000);
      } else {
        setProcessMessage(result.error || 'Failed to submit evidence. Please try again.');
        setTimeout(() => setProcessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error submitting evidence:', error);
      setProcessMessage('Failed to submit evidence. Please try again.');
      setTimeout(() => setProcessMessage(''), 5000);
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Handle setting provisional outcome (admin only)
  const handleSetOutcome = async () => {
    if (!address || !outcomeInput.trim() || isProcessing) return;

    if (outcomeInput !== "positive" && outcomeInput !== "negative") {
      setProcessMessage("Please select 'positive' or 'negative'");
      setTimeout(() => setProcessMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    try {
      console.log('🟡 Setting provisional outcome for live:', { outcome: outcomeInput, tableType: 'live' });
      
      // setProvisionalOutcome returns plain object on success, throws on error
      const result = await setProvisionalOutcome(outcomeInput as 'positive' | 'negative', 'live', 'Live Question');
      console.log('✅ setProvisionalOutcome result:', result);
      
      setProcessMessage('Provisional outcome set! Evidence window is now open.');
      
      // Reload market outcome and evidence data
      console.log('Loading market outcome...');
      const outcome = await getProvisionalOutcome('live', 'Live Question');
      console.log('Market outcome loaded:', outcome);
      setMarketOutcome(outcome);
      
      // Also reload user evidence data if outcome was set
      if (outcome && address) {
        const outcomeDate = outcome.setAt.split('T')[0];
        console.log('Loading user evidence for date:', outcomeDate);
        const userEvidence = await getUserEvidenceSubmission(address, 'live', outcomeDate);
        console.log('User evidence loaded:', userEvidence);
        setUserEvidenceSubmission(userEvidence);
      }
      
      setTimeout(() => setProcessMessage(''), 5000);
    } catch (error) {
      console.error('❌ Failed to set provisional outcome:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Show more specific error message
      let errorMessage = 'Failed to set provisional outcome';
      if (error instanceof Error) {
        if (error.message.includes('Only plain objects') || error.message.includes('Server Components')) {
          errorMessage = 'Server component serialization error - contact support';
        } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = 'Database table missing - please run database migrations';
        } else if (error.message.includes('connection')) {
          errorMessage = 'Database connection error - check DATABASE_URL';
        } else {
          errorMessage = error.message;
        }
      }
      
      setProcessMessage(errorMessage);
      setTimeout(() => setProcessMessage(''), 8000); // Longer timeout for error messages
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle automated winner processing and pot distribution
  const handleProcessWinners = async () => {
    if (!address || !finalOutcomeInput.trim() || isProcessing) return;

    if (finalOutcomeInput !== "positive" && finalOutcomeInput !== "negative") {
      setProcessMessage("Please select final outcome");
      return;
    }

    setIsProcessing(true);
    setLastAction('processWinners');
    
    try {
      // Step 1: Determine winners using final outcome
      setProcessMessage("Step 1/3: Determining winners based on final outcome...");
      const winnersString = await determineWinnersLive(finalOutcomeInput as "positive" | "negative");
      
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
          setProcessMessage("Step 3/5: Clearing live predictions...");
          await clearLivePredictions();
          
          setProcessMessage("Step 4/5: Clearing market outcome...");
          await clearLiveMarketOutcome();
          
          setProcessMessage("Step 5/5: Clearing evidence submissions...");
          await clearLiveEvidenceSubmissions();
          
          // Participants automatically cleared by distributePot contract function (delete participants)
          setProcessMessage("🎉 Winners processed successfully! Pot distributed, predictions cleared, outcome reset, and participants reset!");
          setOutcomeInput('');
          setFinalOutcomeInput('');
          
          // Clear the UI state since we've cleaned up the database
          setMarketOutcome(null);
          setUserEvidenceSubmission(null);
          setAllEvidenceSubmissions([]);
          console.log('✅ Complete cleanup finished - ready for next round');
          
          setTimeout(() => {
            setProcessMessage('');
          }, 5000);
          
        } catch (error) {
          console.error('Error in finishProcessing:', error);
          setProcessMessage("Pot distributed but failed to clear predictions. Please clear manually.");
        } finally {
          setIsProcessing(false);
          setLastAction('');
        }
      };
      
      finishProcessing();
    }
  }, [isDistributionConfirmed, receipt, isProcessing, lastAction]);

  // Helper functions for evidence system
  const isEvidenceWindowActive = () => {
    if (!marketOutcome) return false;
    
    // If final outcome is already set, evidence window is closed
    if (marketOutcome.finalOutcome) return false;
    
    // Check if we're still within the time window
    const now = new Date().getTime();
    const expiry = new Date(marketOutcome.evidenceWindowExpires).getTime();
    return now < expiry;
  };

  const hasUserSubmittedEvidence = () => {
    return userEvidenceSubmission !== null;
  };

  const ethToUsd = (ethAmount: bigint): number => {
      const fallbackEthPrice = 4700;
      const currentEthPrice = ethPrice || fallbackEthPrice;
      const ethValue = Number(formatUnits(ethAmount, 18));
      return ethValue * currentEthPrice;
    };

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const toggleAdminPanel = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  // Update evidence countdown timer
  useEffect(() => {
    if (!isEvidenceWindowActive()) return;

    const interval = setInterval(() => {
      if (marketOutcome) {
        const now = new Date().getTime();
        const expiry = new Date(marketOutcome.evidenceWindowExpires).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeUntilEvidenceExpires(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [marketOutcome]);

  // Show loading screen
  console.log('Render check - isLoading:', isLoading, 'hasEnteredPot:', hasEnteredPot, 'isOwner:', isOwner);
  
  if (isLoading) {
    console.log('Showing loading screen');
    return (
      <div className={`relative max-w-4xl mx-auto -translate-y-8 ${className}`}>
        <div className="relative bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-black text-white px-6 py-4 text-center">
            <span className="text-lg font-mono tracking-wider">LOADING LIVE PREDICTIONS</span>
          </div>
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-6"></div>
            <p className="text-xl font-bold text-gray-700 mb-2">Setting up your prediction environment...</p>
            <p className="text-gray-500">This will only take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  // Show pot entry requirement if user hasn't entered
  if (!hasEnteredPot && !isOwner) {
    return (
      <div className={`relative max-w-4xl mx-auto -translate-y-8 ${className}`}>
        <div className="relative bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-purple-700 text-white px-6 py-4 text-center">
            <span className="text-lg font-mono tracking-wider">POT ENTRY REQUIRED</span>
          </div>
          <div className="p-12 text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enter the Prediction Pot First</h2>
            <p className="text-gray-600 mb-6">
              You must enter the live prediction pot before you can view questions and make predictions.
            </p>
            <p className="text-sm text-gray-500">
              Go to the pot entry section to join this round.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                currentQuestion.timeRemaining > 30 ? 'bg-yellow-500' : 'bg-purple-1000'
              }`}></div>
              <span className="text-sm font-mono tracking-wider">LIVE PREDICTION</span>
              {isTransitioning && (
                <span className="text-xs text-gray-400 animate-pulse">UPDATING...</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono transition-colors duration-300 ${
                currentQuestion.timeRemaining < 60 ? 'text-purple-400' : 'text-white'
              }`}>
                {formatTime(currentQuestion.timeRemaining)}
              </span>
            </div>
          </div>

          <div className="p-8">
            {/* Pot Balance Display - Top Right */}
            <div className="flex justify-end mb-2">
              <div className="text-xs text-gray-500 font-mono">
                Total Value: <span className='text-sm text-green-400'>${ethToUsd(potBalance ?? BigInt(0)).toFixed(2)} USD</span>
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
                    'bg-gradient-to-r from-purple-700 via-purple-1000 to-purple-700'
                  }`}
                  style={{ 
                    width: `${Math.max(2, (currentQuestion.timeRemaining / (QUESTION_INTERVAL_MINUTES * 60)) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs font-mono text-gray-500">
                <span>STARTED</span>
                <span className={`transition-colors duration-300 ${
                  currentQuestion.timeRemaining < 60 ? 'text-purple-1000 font-bold animate-pulse' : 
                  currentQuestion.timeRemaining < 120 ? 'text-yellow-600 font-semibold' : ''
                }`}>
                  {currentQuestion.timeRemaining < 60 ? 'URGENT' : 
                   currentQuestion.timeRemaining < 120 ? 'ENDING SOON' : 'TIME REMAINING'}
                </span>
                <span>EXPIRES</span>
              </div>
            </div>
            
            {/* Action Buttons or Prediction Display */}
            {userPrediction === null ? (
              // Show buttons if no prediction made yet
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => handlePrediction('positive')}
                  className={`group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                    isTransitioning || isSubmitting || !address || !hasEnteredPot ? 'opacity-60 cursor-wait' : ''
                  }`} 
                  disabled={isTransitioning || isSubmitting || !address || !hasEnteredPot}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    <span className="text-3xl">{isSubmitting ? '⏳' : '✓'}</span>
                    <span className="tracking-widest">YES</span>
                  </div>
                  {/* Button Corner Effects */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
                
                <button 
                  onClick={() => handlePrediction('negative')}
                  className={`group relative bg-white border-4 border-black text-black font-black text-xl py-6 px-8 transition-all duration-200 hover:bg-black hover:text-white hover:shadow-2xl transform hover:scale-105 active:scale-95 ${
                    isTransitioning || isSubmitting || !address || !hasEnteredPot ? 'opacity-60 cursor-wait' : ''
                  }`} 
                  disabled={isTransitioning || isSubmitting || !address || !hasEnteredPot}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-1000 to-purple-700 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    <span className="text-3xl">{isSubmitting ? '⏳' : '✗'}</span>
                    <span className="tracking-widest">NO</span>
                  </div>
                  {/* Button Corner Effects */}
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-purple-1000 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-purple-1000 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              </div>
            ) : (
              // Show prediction if user has already made one
              <div className="flex justify-center">
                <div className={`relative px-8 py-6 rounded-lg border-4 ${
                  userPrediction === 'positive' 
                    ? 'bg-green-100 border-green-600 text-green-800' 
                    : 'bg-purple-100 border-purple-700 text-purple-800'
                }`}>
                  <div className="flex items-center justify-center space-x-3">
                    <span className="text-3xl">
                      {userPrediction === 'positive' ? '✓' : '✗'}
                    </span>
                    <div className="text-center">
                      <div className="text-xl font-black tracking-wider">
                        YOUR PREDICTION
                      </div>
                      <div className="text-2xl font-black tracking-widest">
                        {userPrediction === 'positive' ? 'YES' : 'NO'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
          </div>
        </div>


        {/* Evidence Submission Interface - For Participants */}
        {!isOwner && marketOutcome && isEvidenceWindowActive() && !hasUserSubmittedEvidence() && hasEnteredPot && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-gradient-to-br from-orange-50 via-white to-orange-50 backdrop-blur-xl border-2 border-orange-200 rounded-3xl p-8 mb-8 shadow-2xl shadow-orange-900/10 relative overflow-hidden">
              {/* Collapsible Header */}
              <div 
                className="cursor-pointer"
                onClick={() => setIsEvidenceSectionExpanded(!isEvidenceSectionExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Dispute the Outcome?</h3>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <p className="text-orange-800 font-bold text-sm">
                          {formatTimeRemaining(timeUntilEvidenceExpires)} remaining
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-orange-600">
                    {isEvidenceSectionExpanded ? (
                      <ChevronUp className="w-8 h-8" />
                    ) : (
                      <ChevronDown className="w-8 h-8" />
                    )}
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-orange-100 rounded-2xl">
                  <p className="text-orange-900 font-bold text-center">
                    Admin set outcome: <span className="px-2 py-1 bg-orange-200 rounded font-black">
                      {marketOutcome.outcome.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>

              {/* Collapsible Content */}
              {isEvidenceSectionExpanded && (
                <div className="mt-6 space-y-6">
                  <textarea
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    placeholder="Provide detailed evidence to dispute this outcome. Include sources, links, or clear explanations..."
                    className="w-full h-32 p-4 border-2 border-orange-200 rounded-2xl focus:border-orange-400 focus:outline-none resize-none bg-white/80 backdrop-blur-sm text-gray-800 placeholder-orange-400"
                    maxLength={1000}
                    disabled={isSubmittingEvidence}
                  />
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Character count: {evidenceText.length}/1000</span>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <div className="text-yellow-800">
                        <p className="font-bold mb-2">Evidence Submission Terms:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Submit detailed evidence to dispute the outcome</li>
                          <li>• Include sources, links, or clear explanations</li>
                          <li>• Admin will review within 24 hours</li>
                          <li>• One submission per outcome per user</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleEvidenceSubmission}
                    disabled={!evidenceText.trim() || isSubmittingEvidence}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
                  >
                    {isSubmittingEvidence ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting Evidence...
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        Submit Evidence
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Evidence Submitted Status */}
        {!isOwner && hasUserSubmittedEvidence() && (
          <div className="max-w-4xl mx-auto mt-6">
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-10 mb-8 shadow-2xl shadow-blue-900/10">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <FileText className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Evidence Submitted!</h3>
                <p className="text-blue-700 text-lg font-medium mb-6">
                  Your evidence has been submitted for admin review.
                </p>
                <div className="bg-blue-100 rounded-2xl p-6">
                  <p className="text-blue-800 font-bold text-sm mb-2">Your Evidence:</p>
                  <p className="text-blue-700 text-sm italic">
                    "{userEvidenceSubmission?.evidence}"
                  </p>
                  <p className="text-blue-600 text-xs mt-2">
                    Submitted: {userEvidenceSubmission ? new Date(userEvidenceSubmission.submittedAt).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Owner Controls - Manual Outcome Setting + Evidence Review */}
        {isOwner && (
          <div className="max-w-4xl mx-auto mt-6" style={{ position: 'relative', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'black', color: 'white', padding: '20px', border: '2px solid red', borderRadius: '12px' }}>
              <h2 style={{ marginBottom: '10px' }}>🔧 OWNER CONTROLS</h2>
              
              <div style={{ marginBottom: '20px' }}>
                {/* Set Provisional Outcome */}
                {!marketOutcome && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Set Question Outcome (Opens Evidence Window)
                    </label>
                    <select
                      value={outcomeInput}
                      onChange={(e) => setOutcomeInput(e.target.value as 'positive' | 'negative' | '')}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-1000 focus:border-transparent mb-4"
                    >
                      <option value="">Select outcome...</option>
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                    </select>
                    
                    <button
                      onClick={handleSetOutcome}
                      disabled={!outcomeInput || isProcessing}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                    >
                      {isProcessing ? 'Setting...' : 'Set Outcome & Open Evidence Window'}
                    </button>
                  </div>
                )}

                {/* Current Outcome Status */}
                {marketOutcome && (
                  <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between mb-2">
                        <span>Current Outcome:</span>
                        <span className="px-2 py-1 bg-blue-600 text-white rounded font-bold">
                          {marketOutcome.outcome.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Evidence Window:</span>
                        <span className={`font-bold ${isEvidenceWindowActive() ? 'text-green-400' : 'text-purple-400'}`}>
                          {isEvidenceWindowActive() ? 'ACTIVE' : 'EXPIRED'}
                        </span>
                      </div>
                      {isEvidenceWindowActive() && (
                        <div className="flex justify-between">
                          <span>Time Remaining:</span>
                          <span className="text-orange-400 font-bold">
                            {formatTimeRemaining(timeUntilEvidenceExpires)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Evidence Review Panel */}
                {marketOutcome && (
                  <div className="mb-4">
                    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-2 border-blue-200 rounded-3xl p-6 shadow-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <FileText className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Admin Panel</h3>
                            <p className="text-blue-700 font-medium">Review Evidence Submissions</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (setActiveSection) {
                                setActiveSection('adminEvidenceReview');
                              }
                            }}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            Evidence Review Page
                          </button>
                          <button
                            onClick={toggleAdminPanel}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            {showAdminPanel ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                Show Evidence ({allEvidenceSubmissions.length})
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Evidence List */}
                      {showAdminPanel && (
                        <div className="mt-6 space-y-4">
                          {allEvidenceSubmissions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p className="font-medium">No evidence submissions yet</p>
                            </div>
                          ) : (
                            allEvidenceSubmissions.map((evidence: any) => (
                              <div key={evidence.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="font-bold text-gray-900">Submission #{evidence.id}</p>
                                    <p className="text-sm text-gray-600">
                                      From: {evidence.walletAddress.slice(0, 8)}...{evidence.walletAddress.slice(-6)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(evidence.submittedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                  <p className="text-sm text-gray-800 italic">
                                    "{evidence.evidence}"
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generate Questions Button */}
                <button 
                  onClick={async () => {
                    console.log('Generating questions for current time...');
                    try {
                      const response = await fetch('/api/live-question', {
                        method: 'POST',
                      });
                      const data = await response.json();
                      console.log('Questions generated:', data);
                      alert('Questions generated successfully! Refresh the page to see new questions.');
                    } catch (error) {
                      console.error('Failed to generate questions:', error);
                      alert('Failed to generate questions');
                    }
                  }}
                  style={{
                    marginBottom: '16px',
                    padding: '8px 16px',
                    backgroundColor: 'blue',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Questions for Current Time
                </button>

                {/* Final Distribution Controls */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Final Outcome (After Evidence Review)
                  </label>
                  <select
                    value={finalOutcomeInput}
                    onChange={(e) => setFinalOutcomeInput(e.target.value as 'positive' | 'negative' | '')}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-1000 focus:border-transparent mb-4"
                  >
                    <option value="">Select final outcome...</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>

                <button
                  onClick={handleProcessWinners}
                  disabled={!finalOutcomeInput || isProcessing || isPending}
                  style={{
                    width: '100%',
                    backgroundColor: finalOutcomeInput ? 'green' : 'gray',
                    color: 'white',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: finalOutcomeInput ? 'pointer' : 'not-allowed',
                    pointerEvents: 'all',
                    position: 'relative',
                    zIndex: 9999,
                    opacity: finalOutcomeInput ? 1 : 0.6
                  }}
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
                      ? 'bg-purple-900/50 border border-purple-1000 text-purple-200' 
                      : 'bg-green-900/50 border border-green-500 text-green-200'
                  }`}>
                    {processMessage}
                  </div>
                )}

                <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">
                    <strong>Evidence-Based Process:</strong> Set the initial outcome to open the evidence window. 
                    Participants can submit disputes during this period. Review all evidence before making the final 
                    distribution decision. Winners are determined based on the final outcome you set.
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