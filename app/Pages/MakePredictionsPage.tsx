import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseEther } from 'viem';
import { placeBitcoinBet, getTomorrowsBet, getTodaysBet, getReEntryFee, submitEvidence, getUserEvidenceSubmission, getAllEvidenceSubmissions, processReEntry } from '../Database/actions';
import { getProvisionalOutcome } from '../Database/OwnerActions';
import { checkMissedPredictionPenalty } from '../Database/actions3';
import { TrendingUp, TrendingDown, Shield, Zap, AlertTriangle, Clock, FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import Cookies from 'js-cookie';
import { getMarkets } from '../Constants/markets';
import { getTranslation } from '../Languages/languages';
import { getPrice } from '../Constants/getPrice';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACT_TO_TABLE_MAPPING } from '../Database/config';

// UK timezone helper function (simplified and more reliable)
const getUKTime = (date: Date = new Date()): Date => {
  // Use Intl.DateTimeFormat to get UK time directly
  const ukTimeString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
  
  // Parse the UK time string (format: YYYY-MM-DD, HH:MM:SS)
  return new Date(ukTimeString.replace(', ', 'T'));
};

// Helper function to get table type from contract address using markets.ts
const getTableTypeFromContract = (contractAddress: string): string => {
  const marketOptions = getMarkets(getTranslation('en'), 'options');
  const market = marketOptions.find(m => m.contractAddress === contractAddress);
  
  if (market?.id === 'Trending') return 'featured';
  if (market?.id === 'crypto') return 'crypto';
  if (market?.id === 'stocks') return 'stocks';
  
  // Fallback for unknown contracts
  return 'featured';
};

// Use centralized table mapping from config
const tableMapping = CONTRACT_TO_TABLE_MAPPING;
type TableType = typeof tableMapping[keyof typeof tableMapping];

// Contract ABI for PredictionPot (includes both read and write functions)
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "enterPot",
    "outputs": [],
    "stateMutability": "payable",
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

interface TodaysBet {
  id: number;
  walletAddress: string;
  prediction: string;
  betDate: string;
  createdAt: Date;
}

interface MarketOutcome {
  id: number;
  contractAddress: string;
  outcome: 'positive' | 'negative';
  setAt: Date;
  evidenceWindowExpires: Date;
  finalOutcome?: 'positive' | 'negative' | null;
  isDisputed: boolean;
}

interface EvidenceSubmission {
  id: number;
  walletAddress: string;
  contractAddress: string;
  evidence: string;
  submittedAt: Date;
  paymentTxHash: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface MakePredictionsProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function MakePredicitions({ activeSection, setActiveSection }: MakePredictionsProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const queryClient = useQueryClient();
  
  // TESTING TOGGLE - Set to false to test prediction logic on Saturdays
  const SHOW_RESULTS_DAY_INFO = false; // Toggle this on/off as needed
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [tomorrowsBet, setTomorrowsBet] = useState<TodaysBet | null>(null);
  const [todaysBet, setTodaysBet] = useState<TodaysBet | null>(null);
  const [isBetLoading, setIsBetLoading] = useState<boolean>(true);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [selectedTableType, setSelectedTableType] = useState<TableType>('featured');
  const [reEntryFee, setReEntryFee] = useState<number | null>(null);
  const [allReEntryFees, setAllReEntryFees] = useState<{market: string, fee: number}[]>([]);
  const [marketQuestion, setMarketQuestion] = useState<string>('');
  
  // Missed prediction penalty state
  const [missedPredictionCheck, setMissedPredictionCheck] = useState<{
    isChecking: boolean;
    shouldBlock: boolean;
    missedDate?: string;
    message?: string;
  }>({
    isChecking: true,
    shouldBlock: false
  });
  
  // Evidence submission system state
  const [marketOutcome, setMarketOutcome] = useState<MarketOutcome | null>(null);
  const [evidenceText, setEvidenceText] = useState<string>('');
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState<boolean>(false);
  const [userEvidenceSubmission, setUserEvidenceSubmission] = useState<EvidenceSubmission | null>(null);
  const [timeUntilEvidenceExpires, setTimeUntilEvidenceExpires] = useState<number>(0);
  const [isEvidenceSectionExpanded, setIsEvidenceSectionExpanded] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  
  // Admin evidence review state
  const [allEvidenceSubmissions, setAllEvidenceSubmissions] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [isLoadingEvidence, setIsLoadingEvidence] = useState<boolean>(false);
  
  // Re-entry transaction state
  const [isReEntryLoading, setIsReEntryLoading] = useState<boolean>(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  // Voting preference from cookies
  const [votingPreference, setVotingPreference] = useState<string | null>(null);
  const [selectedMarketForVoting, setSelectedMarketForVoting] = useState<string | null>(null);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState<boolean>(false);
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });


  
  const [timeUntilNewQuestion, setTimeUntilNewQuestion] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  // Check if betting is allowed (Sunday through Friday, unless testing toggle is off) - UK timezone
  const isBettingAllowed = (): boolean => {
    if (!SHOW_RESULTS_DAY_INFO) {
      return true; // Always allow betting when testing toggle is off
    }
    const ukNow = getUKTime();
    const day = ukNow.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    return day !== 6; // All days except Saturday
  };

  // Check if today is Saturday (results day) - only when toggle is enabled - UK timezone
  const isResultsDay = (): boolean => {
    if (!SHOW_RESULTS_DAY_INFO) {
      return false; // Never show results day when testing toggle is off
    }
    const ukNow = getUKTime();
    const day = ukNow.getDay();
    return day === 6; // Saturday
  };

  // Check if outcome has been set for this market
  const hasOutcomeBeenSet = (): boolean => {
    return marketOutcome !== null;
  };

  // Check if evidence submission window is active (within 1 hour of outcome being set AND final outcome not yet set)
  const isEvidenceWindowActive = (): boolean => {
    if (!marketOutcome) return false;
    
    // If final outcome is already set, evidence window is closed
    if (marketOutcome.finalOutcome) return false;
    
    // Check if we're still within the time window
    const now = new Date();
    return now < marketOutcome.evidenceWindowExpires;
  };

  // Format time remaining in evidence window
  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get tonight's midnight (when new question becomes available) - UK timezone
  const getTonightMidnight = (): Date => {
    const ukNow = getUKTime();
    // Create tomorrow's midnight in UK timezone
    const tomorrow = new Date(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate() + 1, 0, 0, 0, 0);
    return tomorrow;
  };

  // Get tomorrow's midnight (when previous prediction outcome will be revealed - 24 hours after next question) - UK timezone
  const getTomorrowMidnight = (): Date => {
    const ukNow = getUKTime();
    // Create day after tomorrow's midnight in UK timezone
    const dayAfterTomorrow = new Date(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate() + 2, 0, 0, 0, 0);
    return dayAfterTomorrow;
  };

  // Update countdown timers
  const updateCountdowns = () => {
    const ukNow = getUKTime();
    
    // Time until new question (tonight's midnight)
    const tonightMidnight = getTonightMidnight();
    const diffToNewQuestion = tonightMidnight.getTime() - ukNow.getTime();
    
    if (diffToNewQuestion > 0) {
      const hours = Math.floor(diffToNewQuestion / (1000 * 60 * 60));
      const minutes = Math.floor((diffToNewQuestion % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffToNewQuestion % (1000 * 60)) / 1000);
      setTimeUntilNewQuestion({ hours, minutes, seconds });
    } else {
      setTimeUntilNewQuestion({ hours: 0, minutes: 0, seconds: 0 });
    }
  };

  // Check if user has already submitted evidence
  const hasUserSubmittedEvidence = (): boolean => {
    return userEvidenceSubmission !== null;
  };

  // Helper functions for ETH price and entry amount calculations
  const usdToEth = (usdAmount: number): bigint => {
    const fallbackEthPrice = 4700; // Fallback ETH price
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethAmount = usdAmount / currentEthPrice;
    return parseEther(ethAmount.toString());
  };

  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

  // Get dynamic entry amount based on day of week (USD equivalent in ETH)
  const getDynamicEntryAmount = (): bigint => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    
    // USD pricing that we want to maintain (simplified - all days $0.01 for now)
    const usdPrices = {
      0: 0.01, // Sunday: $0.01
      1: 0.02, // Monday: $0.02  
      2: 0.04, // Tuesday: $0.03
      3: 0.08, // Wednesday: $0.04
      4: 0.16, // Thursday: $0.05
      5: 0.32, // Friday: $0.06
      6: 0.01, // Saturday: Closed (fallback to Sunday price)
    };
    
    const usdPrice = usdPrices[day as keyof typeof usdPrices];
    return usdToEth(usdPrice);
  };

  // Helper function to get timer urgency level
  const getTimerUrgency = (hours: number, minutes: number, seconds: number) => {
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    if (totalMinutes <= 15) return 'critical'; // < 15 minutes
    if (totalMinutes <= 60) return 'urgent';   // < 1 hour
    return 'normal';
  };

  // Helper function to get timer styling based on urgency
  const getTimerStyling = (urgency: string, baseColor: string) => {
    switch (urgency) {
      case 'critical':
        return {
          container: `bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-400 ${baseColor === 'blue' ? 'animate-pulse' : 'animate-bounce'}`,
          text: 'text-purple-800',
          icon: 'bg-purple-700',
          timer: 'text-purple-900'
        };
      case 'urgent':
        return {
          container: `bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 animate-pulse`,
          text: 'text-orange-700',
          icon: 'bg-orange-600',
          timer: 'text-orange-900'
        };
      default:
        return {
          container: `bg-gradient-to-r from-${baseColor}-50 to-${baseColor}-100 border border-${baseColor}-200`,
          text: `text-${baseColor}-700`,
          icon: `bg-${baseColor}-600`,
          timer: `text-${baseColor}-900`
        };
    }
  };

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getPrice('ETH');
        setEthPrice(price);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(4700); // Fallback price
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Add useEffect to handle cookie retrieval
  useEffect(() => {
    const savedContract = Cookies.get('selectedMarket');
    const savedQuestion = Cookies.get('selectedMarketQuestion');
    
    // Set the market question if available
    if (savedQuestion) {
      setMarketQuestion(savedQuestion);
      console.log('Loaded pot question:', savedQuestion);
    }
    
    // Load voting preference from cookies
    const preference = Cookies.get('votingPreference');
    const marketForVoting = Cookies.get('selectedMarketForVoting');
    setVotingPreference(preference || null);
    setSelectedMarketForVoting(marketForVoting || null);
    console.log('Loaded voting preference:', preference, 'for market:', marketForVoting);
    
    // Validate contract address is in our allowed list
    if (savedContract && tableMapping[savedContract as keyof typeof tableMapping]) {
      setContractAddress(savedContract);
      const tableType = tableMapping[savedContract as keyof typeof tableMapping];
      setSelectedTableType(tableType);
    } else {
      // Fallback to default contract if no valid cookie is found
      setContractAddress('0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22');
      setSelectedTableType('featured');
      console.log('No valid contract cookie found, using default');
    }
  }, []);

  // Check for missed prediction penalties when user connects and contract is set
  useEffect(() => {
    const checkMissedPredictions = async () => {
      if (!address || !isConnected || !contractAddress) {
        setMissedPredictionCheck({ isChecking: false, shouldBlock: false });
        return;
      }

      console.log('🔍 Checking missed prediction penalties for user...');
      setMissedPredictionCheck(prev => ({ ...prev, isChecking: true }));

      try {
        const result = await checkMissedPredictionPenalty(address, contractAddress, selectedTableType);
        
        setMissedPredictionCheck({
          isChecking: false,
          shouldBlock: result.shouldBlock,
          missedDate: result.missedDate,
          message: result.message
        });

        if (result.shouldBlock) {
          console.log(`🚫 User blocked due to missed prediction: ${result.message}`);
        } else {
          console.log('✅ User cleared for predictions');
        }
      } catch (error) {
        console.error('Error checking missed predictions:', error);
        // On error, allow user to proceed (safer to allow than incorrectly block)
        setMissedPredictionCheck({ isChecking: false, shouldBlock: false });
      }
    };

    checkMissedPredictions();
  }, [address, isConnected, contractAddress, selectedTableType]);

  // Countdown timer effect
  useEffect(() => {
    updateCountdowns(); // Initial update
    const interval = setInterval(updateCountdowns, 1000); // Update every second
    return () => clearInterval(interval);
  }, []);

  // Read contract data to get participants
  const { data: participants } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: !!contractAddress }
  }) as { data: string[] | undefined };

  // Check if the user is a participant
  const isParticipant = address && participants && Array.isArray(participants) 
    ? participants.some(participant => participant.toLowerCase() === address.toLowerCase())
    : false;

  // Auto-submission effect for voting preference
  useEffect(() => {
    const autoSubmitPrediction = async () => {
      // Only auto-submit if:
      // 1. User has a voting preference from landing page
      // 2. User is connected and is a participant
      // 3. User hasn't already made a prediction (no tomorrowsBet)
      // 4. Betting is allowed
      // 5. Haven't already auto-submitted
      // 6. Data is fully loaded
      if (
        votingPreference &&
        selectedMarketForVoting &&
        address &&
        isParticipant &&
        !tomorrowsBet &&
        isBettingAllowed() &&
        !hasAutoSubmitted &&
        isDataLoaded &&
        !isLoading
      ) {
        console.log('Auto-submitting prediction:', votingPreference, 'for market:', selectedMarketForVoting);
        setHasAutoSubmitted(true);
        
        // Clear cookies after auto-submission
        Cookies.remove('votingPreference');
        Cookies.remove('selectedMarketForVoting');
        
        // Auto-submit the prediction
        await handlePlaceBet(votingPreference as 'positive' | 'negative');
      }
    };

    autoSubmitPrediction();
  }, [votingPreference, selectedMarketForVoting, address, isParticipant, tomorrowsBet, isDataLoaded, isLoading, hasAutoSubmitted]);

  // Load user's evidence submission if any - now takes outcomeDate parameter to avoid race condition
  const loadUserEvidenceSubmission = useCallback(async (outcomeDate: string) => {
    if (!address || !selectedTableType) return null;
    
    try {
      const submission = await getUserEvidenceSubmission(
        address, 
        selectedTableType, 
        outcomeDate
      );
      
      const formattedSubmission = submission ? {
        id: submission.id,
        walletAddress: address,
        contractAddress,
        evidence: submission.evidence,
        submittedAt: submission.submittedAt,
        paymentTxHash: '', // Will be implemented with payment system
        status: submission.status as 'pending' | 'approved' | 'rejected'
      } : null;
      
      setUserEvidenceSubmission(formattedSubmission);
      console.log('Loading evidence submission for user:', address, formattedSubmission);
      return formattedSubmission;
    } catch (error) {
      console.error('Error loading evidence submission:', error);
      return null;
    }
  }, [address, selectedTableType, contractAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load market outcome for current contract
  const loadMarketOutcome = useCallback(async () => {
    if (!contractAddress || !selectedTableType) return;
    
    try {
      const provisionalOutcomeData = await getProvisionalOutcome(selectedTableType);
      
      if (provisionalOutcomeData) {
        const marketOutcomeData = {
          id: 1,
          contractAddress,
          outcome: provisionalOutcomeData.outcome,
          setAt: new Date(provisionalOutcomeData.setAt),
          evidenceWindowExpires: new Date(provisionalOutcomeData.evidenceWindowExpires),
          finalOutcome: provisionalOutcomeData.finalOutcome,
          isDisputed: provisionalOutcomeData.isDisputed || false
        };
        
        setMarketOutcome(marketOutcomeData);
        
        // Calculate remaining time
        const now = new Date().getTime();
        const expiry = new Date(provisionalOutcomeData.evidenceWindowExpires).getTime();
        const remaining = Math.max(0, expiry - now);
        setTimeUntilEvidenceExpires(remaining);
        
        // Load evidence submission AFTER market outcome is set
        if (address) {
          const outcomeDate = marketOutcomeData.setAt.toISOString().split('T')[0];
          await loadUserEvidenceSubmission(outcomeDate);
        }
        
        console.log('Loaded provisional outcome:', provisionalOutcomeData);
      } else {
        setMarketOutcome(null);
        setUserEvidenceSubmission(null); // Clear evidence if no outcome
        console.log('No provisional outcome set yet');
      }
    } catch (error) {
      console.error('Error loading pot outcome:', error);
    }
  }, [contractAddress, selectedTableType, address, loadUserEvidenceSubmission]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBets = useCallback(async () => {
    if (!address || !selectedTableType) return;

    setIsBetLoading(true);
    try {
      // Load both tomorrow's bet (for betting interface) and today's bet (for results display)
      const [tomorrowBet, todayBet, reEntryAmount] = await Promise.all([
        getTomorrowsBet(address, selectedTableType),
        getTodaysBet(address, selectedTableType),
        getReEntryFee(address, selectedTableType)
      ]);
      
      setTomorrowsBet(tomorrowBet);
      setTodaysBet(todayBet);
      setReEntryFee(reEntryAmount);
      // Remove problematic allReEntryFees dependency
    } catch (error) {
      console.error("Error loading bets:", error);
      setTomorrowsBet(null);
      setTodaysBet(null);
      setReEntryFee(null);
    } finally {
      setIsBetLoading(false);
    }
  }, [address, selectedTableType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data on component mount and when key dependencies change
  useEffect(() => {
    const loadAllData = async () => {
      if (address && isParticipant && selectedTableType) {
        setIsDataLoaded(false);
        try {
          await Promise.all([
            loadBets(),
            loadMarketOutcome() // This will also load evidence submission after outcome is loaded
          ]);
        } finally {
          setIsDataLoaded(true);
        }
      } else {
        setIsDataLoaded(true); // Set to true even if we can't load data
      }
    };
    
    loadAllData();
  }, [address, isParticipant, selectedTableType, loadBets, loadMarketOutcome]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && isReEntryLoading) {
      const completeReEntry = async () => {
        try {
          // Remove user from wrong predictions table
          const success = await processReEntry(address!, selectedTableType);
          if (success) {
            setIsReEntryLoading(false);
            showMessage('Re-entry successful! You can now predict again.');
            setReEntryFee(null); // Clear re-entry fee
            // Refresh contract data
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            // Reload bets to refresh UI
            await loadBets();
          } else {
            setIsReEntryLoading(false);
            showMessage('Re-entry payment processed but database update failed. Please contact support.');
          }
        } catch (error) {
          setIsReEntryLoading(false);
          showMessage('Re-entry payment processed but database update failed. Please contact support.');
        }
      };
      
      completeReEntry();
    }
  }, [isConfirmed, isReEntryLoading, address, selectedTableType, queryClient, loadBets]);

  // Timer effect for evidence window countdown
  useEffect(() => {
    if (!marketOutcome || !isEvidenceWindowActive()) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = marketOutcome.evidenceWindowExpires.getTime();
      const remaining = Math.max(0, expiry - now);
      
      if (remaining <= 0) {
        setTimeUntilEvidenceExpires(0);
        clearInterval(timer);
      } else {
        setTimeUntilEvidenceExpires(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [marketOutcome, isEvidenceWindowActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePlaceBet = async (prediction: 'positive' | 'negative') => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Pass the table type string instead of the table object
      await placeBitcoinBet(address, prediction, selectedTableType);
      
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowFormatted = tomorrow.toLocaleDateString();
      showMessage(`Bet placed successfully for ${tomorrowFormatted}!`);
      await loadBets(); // Reload to show the new bet
    } catch (error: unknown) {
      console.error('Error placing bet:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to place bet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle re-entry pot payment
  const handleReEntry = async () => {
    if (!contractAddress || !reEntryFee) return;
    
    setIsReEntryLoading(true);
    
    try {
      const entryAmount = getDynamicEntryAmount();
      
      // Use writeContract to enter the pot with ETH payment
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
        args: [],
        value: entryAmount, // Send ETH as value
      });
      
      showMessage('Re-entry payment submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Re-entry payment failed:', error);
      showMessage('Re-entry payment failed. Please try again.');
      setIsReEntryLoading(false);
    }
  };

  const handleEvidenceSubmission = async () => {
    if (!address || !evidenceText.trim() || !selectedTableType || !marketOutcome) return;
    
    setIsSubmittingEvidence(true);
    try {
      // Submit evidence to database (without payment for now)
      const outcomeDate = marketOutcome.setAt.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
      const result = await submitEvidence(
        address,
        selectedTableType,
        outcomeDate,
        evidenceText.trim()
        // paymentTxHash will be added when payment system is implemented
      );
      
      if (result.success) {
        showMessage('Evidence submitted successfully! Awaiting admin review.');
        setEvidenceText('');
        // Reload evidence submission with proper parameters
        await loadUserEvidenceSubmission(outcomeDate);
      } else {
        showMessage(result.error || 'Failed to submit evidence. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error submitting evidence:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Load all evidence submissions for admin review
  const loadAllEvidenceSubmissions = async () => {
    if (!marketOutcome || !selectedTableType) return;
    
    setIsLoadingEvidence(true);
    try {
      const outcomeDate = marketOutcome.setAt.toISOString().split('T')[0];
      const submissions = await getAllEvidenceSubmissions(selectedTableType, outcomeDate);
      setAllEvidenceSubmissions(submissions);
      console.log('Loaded all evidence submissions:', submissions);
    } catch (error) {
      console.error('Error loading evidence submissions:', error);
      showMessage('Failed to load evidence submissions');
    } finally {
      setIsLoadingEvidence(false);
    }
  };

  // Toggle admin panel and load evidence if opening
  const toggleAdminPanel = async () => {
    if (!showAdminPanel) {
      await loadAllEvidenceSubmissions();
    }
    setShowAdminPanel(!showAdminPanel);
  };

  // Reload market outcome data (useful for refreshing after admin sets provisional outcome)
  const refreshMarketData = async () => {
    try {
      await loadMarketOutcome();
      showMessage('Pot data refreshed');
    } catch (error) {
      console.error('Error refreshing pot data:', error);
      showMessage('Failed to refresh pot data');
    }
  };

  // Check if user is admin/owner (for main prediction markets)
  // In a real app, this would check against a list of admin addresses
  const isAdmin = () => {
    if (!address || !isConnected) return false;
    
    // Add specific admin wallet addresses here
    const adminAddresses: string[] = [
      // Add your admin wallet addresses here (lowercase)
      // '0x1234567890123456789012345678901234567890'
    ];
    
    // Check if current user is in admin list
    const normalizedAddress = address.toLowerCase();
    return adminAddresses.includes(normalizedAddress);
  };

  // Rest of your component remains the same...
  // If wallet is not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 flex items-center justify-center relative overflow-hidden">
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-900 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-700 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-md mx-auto text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl shadow-gray-900/10 relative">
            {/* Floating Bitcoin icon with glassmorphism */}
            <div className="w-24 h-24 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-900/25 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-4xl font-black text-white drop-shadow-lg">₿</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Connect Wallet</h1>
            <p className="text-gray-600 text-lg">Connect to start predicting</p>
            
            {/* Subtle pulse indicator */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not a participant in the pot
  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 flex items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-purple-900 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-md mx-auto text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl shadow-gray-900/10">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Access Required</h1>
            <p className="text-gray-600 mb-8 text-lg">You must join the pot first</p>
            <button className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300">
              Enter Pot
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-gray-900 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/6 w-48 h-48 bg-gray-700 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-2/3 left-1/2 w-32 h-32 bg-gray-600 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="max-w-lg mx-auto pt-12 relative z-10">
        {(isBetLoading || !isDataLoaded) ? (
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <span className="font-medium">Loading your bet...</span>
            </div>
          </div>
        ) : missedPredictionCheck.isChecking ? (
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <span className="font-medium">Checking prediction requirements...</span>
            </div>
          </div>
        ) : missedPredictionCheck.shouldBlock ? (
          <div className="bg-white/70 backdrop-blur-xl border border-red-200/50 rounded-3xl p-8 mb-8 shadow-2xl shadow-gray-900/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Prediction Required</h2>
              <div className="text-gray-600 font-light mb-4 leading-relaxed">
                {missedPredictionCheck.message}
              </div>
              {missedPredictionCheck.missedDate && (
                <div className="text-sm text-gray-500 mb-6">
                  Missed prediction date: {missedPredictionCheck.missedDate}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setActiveSection('bitcoinPot')}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
            >
              Pay Re-entry Fee
            </button>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => setActiveSection('home')}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Go to Home
              </button>
            </div>
          </div>
        ) : reEntryFee && reEntryFee > 0 ? (
          // Re-entry Required Message
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Re-entry Required</h2>
              <p className="text-gray-600 text-sm mb-6">
                Wrong prediction in {selectedTableType === 'featured' ? 'Trending' : 'Crypto'}. Pay today&apos;s entry fee to continue.
              </p>
              
              <button
                onClick={handleReEntry}
                disabled={isReEntryLoading || isPending || isConfirming}
                className="w-full bg-black text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReEntryLoading || isPending || isConfirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  `Enter Pot (${ethToUsd(getDynamicEntryAmount()).toFixed(2)} USD)`
                )}
              </button>
            </div>
          </div>
        ) : (
          <>

            {/* Tomorrow's Bet Interface */}
            {(hasOutcomeBeenSet() && marketOutcome && isEvidenceWindowActive()) ? (
              // PRIORITY: Evidence submission interface when window is active
              <div className="space-y-6">
                {/* Market Outcome Display - Compressed */}
                <div className={`bg-gradient-to-br backdrop-blur-xl border-2 rounded-2xl p-6 mb-6 mt-16 shadow-xl relative overflow-hidden ${
                  marketOutcome?.outcome === 'positive' 
                    ? 'from-green-50 via-white to-green-50 border-green-200 shadow-green-900/10' 
                    : 'from-purple-100 via-white to-purple-100 border-purple-200 shadow-purple-900/10'
                }`}>
                  <div className="flex items-center justify-center gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg ${
                      marketOutcome?.outcome === 'positive' 
                        ? 'from-green-500 to-green-600' 
                        : 'from-purple-1000 to-purple-700'
                    }`}>
                      {marketOutcome?.outcome === 'positive' ? (
                        <TrendingUp className="w-8 h-8 text-white" />
                      ) : (
                        <TrendingDown className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Daily Outcome Set</h2>
                      <div className={`inline-flex items-center px-6 py-2 rounded-xl bg-gradient-to-br backdrop-blur-sm border shadow-md ${
                        marketOutcome?.outcome === 'positive' 
                          ? 'from-green-50/80 to-white/80 border-green-200/30' 
                          : 'from-purple-100/80 to-white/80 border-purple-200/30'
                      }`}>
                        <div className={`text-2xl font-black tracking-tight ${
                          marketOutcome?.outcome === 'positive' ? 'text-green-700' : 'text-purple-700'
                        }`}>
                          {marketOutcome?.outcome === 'positive' ? 'YES' : 'NO'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {marketOutcome?.finalOutcome && marketOutcome.finalOutcome !== marketOutcome.outcome && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
                      <p className="text-yellow-800 font-semibold text-sm text-center">
                        ⚠️ Outcome disputed and updated to: <span className="font-bold">
                          {marketOutcome.finalOutcome === 'positive' ? 'YES' : 'NO'}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Evidence Submission Interface - Collapsible */}
                {isEvidenceWindowActive() && !hasUserSubmittedEvidence() && (
                  <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 backdrop-blur-xl border-2 border-purple-300 rounded-3xl p-8 mb-8 shadow-2xl shadow-purple-900/20 relative overflow-hidden">
                    {/* Collapsible Header */}
                    <div 
                      className="cursor-pointer hover:bg-purple-50/50 rounded-2xl p-2 -m-2 transition-colors duration-200"
                      onClick={() => setIsEvidenceSectionExpanded(!isEvidenceSectionExpanded)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <AlertTriangle className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Dispute the Outcome?</h3>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-600" />
                              <p className="text-purple-800 font-bold text-sm">
                                {formatTimeRemaining(timeUntilEvidenceExpires)} remaining
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-purple-600">
                          <span className="text-sm font-medium">
                            {isEvidenceSectionExpanded ? 'Collapse' : 'Expand'}
                          </span>
                          {isEvidenceSectionExpanded ? 
                            <ChevronUp className="w-5 h-5" /> : 
                            <ChevronDown className="w-5 h-5" />
                          }
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isEvidenceSectionExpanded && (
                      <div className="mt-8 space-y-6">
                        <div className="bg-purple-100 rounded-2xl p-4 border border-purple-200">
                          <p className="text-purple-800 text-sm text-center font-medium">
                            Submit evidence against this outcome within the time limit
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-900 font-bold mb-3">
                            Evidence Against Outcome
                          </label>
                          <textarea
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                            placeholder="Provide detailed evidence why this outcome is incorrect. Include links, sources, or explanations..."
                            className="w-full text-black h-32 p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all duration-200"
                            disabled={isSubmittingEvidence}
                          />
                        </div>

                        <div className="bg-gradient-to-r from-black to-gray-900 border border-gray-700 rounded-2xl p-6">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                            <div className="text-white">
                              <p className="font-bold mb-2 text-purple-300">Evidence Submission Terms:</p>
                              <ul className="text-sm space-y-1 text-gray-300">
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
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
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
                )}

                {/* Evidence Submitted Status */}
                {hasUserSubmittedEvidence() && (
                  <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-10 mb-8 shadow-2xl shadow-blue-900/10">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <FileText className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Evidence Submitted</h3>
                      <div className="bg-blue-100 rounded-2xl p-6 border border-blue-200 mb-6">
                        <p className="text-blue-800 font-bold mb-2">Status: {userEvidenceSubmission?.status === 'pending' ? 'Under Review' : userEvidenceSubmission?.status}</p>
                        <p className="text-blue-700 text-sm">
                          Admin will review your evidence within 24 hours
                        </p>
                      </div>
                      <div className="text-gray-600 text-sm">
                        <p className="mb-1">📄 Evidence submitted: {userEvidenceSubmission?.submittedAt.toLocaleString()}</p>
                        <p>⏳ Status: {userEvidenceSubmission?.status === 'pending' ? 'Under Review' : userEvidenceSubmission?.status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence Window Expired */}
                {!isEvidenceWindowActive() && !hasUserSubmittedEvidence() && (
                  <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 backdrop-blur-xl border-2 border-gray-200 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <Clock className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Evidence Window Closed</h3>
                      <p className="text-gray-600 text-lg mb-6">
                        The 1-hour evidence submission window has expired
                      </p>
                      <div className="bg-gray-100 rounded-2xl p-6 border border-gray-200">
                        <p className="text-gray-700 font-medium">
                          The pot outcome is now final and pot distribution will proceed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : tomorrowsBet ? (
              <div className="bg-white border-2 border-black rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Header Section */}
                <div className="bg-black text-white px-6 py-4 text-center">
                  <h2 className="text-2xl font-bold tracking-tight">You Chose</h2>
                  <p className="text-gray-300 text-sm mt-1">
                    For: {new Date(new Date().getTime() + 24*60*60*1000).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Main Prediction Display */}
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                      tomorrowsBet.prediction === 'positive' 
                        ? 'bg-black' 
                        : 'bg-purple-700'
                    }`}>
                      {tomorrowsBet.prediction === 'positive' ? (
                        <TrendingUp className="w-10 h-10 text-white" />
                      ) : (
                        <TrendingDown className="w-10 h-10 text-white" />
                      )}
                    </div>
                    
                    <div className="text-left">
                      <div className="text-5xl font-black text-black tracking-tight mb-2">
                        {tomorrowsBet.prediction === 'positive' ? 'YES' : 'NO'}
                      </div>
                      {/* <div className="text-gray-600 text-sm font-medium">
                        Set at {new Date(tomorrowsBet.createdAt).toLocaleTimeString('en-GB', {
                          timeZone: 'Europe/London',
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </div> */}
                    </div>
                  </div>

                  {/* Market Question */}
                  {/* {marketQuestion && (
                    <div className="bg-black rounded-2xl p-6 mb-8 text-center">
                      <p className="text-white font-semibold text-lg leading-relaxed">
                        {marketQuestion}
                      </p>
                    </div>
                  )} */}

                  {/* Status Indicators */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <div className="w-5 h-5 bg-purple-700 rounded-full flex items-center justify-center mx-auto mb-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-black font-bold text-xs">Ongoing</div>
                    </div>
                    
                    <div className="bg-white border-2 border-black rounded-lg p-2 text-center">
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center mx-auto mb-1">
                        <Shield className="w-2.5 h-2.5 text-white" />
                      </div>
                      <div className="text-black font-bold text-xs">Locked</div>
                    </div>
                  </div>
                </div>

              </div>
            ) : isResultsDay() ? (
              // Saturday - Results Day message (when no outcome set yet)
              <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-10 mb-8 shadow-2xl shadow-blue-900/10 relative overflow-hidden">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Zap className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Results Day! 🎉</h2>
                  
                  <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-2xl p-6 border border-blue-200 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <p className="text-blue-800 font-bold text-lg">
                      Outcome will be set soon!
                    </p>
                    <p className="text-blue-600 text-sm mt-2">
                      You&apos;ll have 1 hour to submit evidence if you disagree
                    </p>
                  </div>
                  <div className="text-gray-600 text-sm">
                    <p className="mb-1">📊 Your predictions are locked in</p>
                    <p>⚖️ Evidence submission window opens after outcome is set</p>
                  </div>
                  
                  {/* Refresh button to check for new outcomes */}
                  <div className="mt-8 pt-6 border-t border-blue-200 text-center">
                    <button
                      onClick={refreshMarketData}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔄 Check for Outcome Updates
                    </button>
                  </div>
                </div>
              </div>
            ) : !isBettingAllowed() ? (
              // This case should never happen now since betting is only closed on Saturday (which is Results Day)
              // But keeping this as a fallback
              <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 relative overflow-hidden">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Shield className="w-12 h-12 text-gray-600" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Predictions Closed</h2>
                  <p className="text-gray-600 text-lg mb-6">
                    Predictions can be placed Sunday through Friday
                  </p>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <p className="text-gray-700 font-medium mb-2">Prediction Schedule:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Sunday - Friday:</span>
                        <span className="text-green-600 font-bold">✓ Predictions Open</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Saturday:</span>
                        <span className="text-purple-700 font-bold">✗ Results Day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Premium betting interface
          <div className="bg-white border-2 border-black rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
            {/* Red accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-700"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                {votingPreference && !tomorrowsBet ? (
                  <div className="mb-4">
                    <h2 className="text-2xl font-black text-purple-700 mb-2 tracking-tight">
                      Auto-Submitting Your Choice
                    </h2>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3 max-w-md mx-auto">
                      <p className="text-gray-700 text-sm">
                        Submitting: <span className="font-bold text-purple-700">
                          {votingPreference === 'positive' ? 'Yes' : 'No'}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-3xl font-black text-black mb-3 tracking-tight">Your Call?</h2>
                )}
                {marketQuestion && (
                  <div className="bg-black text-white rounded-2xl p-3 mb-4 mx-auto max-w-md">
                    <p className="text-white font-semibold text-sm leading-relaxed">
                      {marketQuestion.replace(/\?$/, '')} <span className="text-purple-300">tomorrow?</span>
                    </p>
                  </div>
                )}
                <p className="text-black text-base font-semibold">
                  Predict for {new Date(new Date().getTime() + 24*60*60*1000).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* YES Button - Black */}
                <button
                  onClick={() => handlePlaceBet('positive')}
                  disabled={isLoading || !isBettingAllowed()}
                  className="group relative bg-black hover:bg-[#009900] disabled:opacity-50 disabled:cursor-not-allowed text-white p-6 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl border-2 border-black overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="p-2 bg-white/10 rounded-lg mb-3 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="tracking-wide">YES</div>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-purple-700 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>

                {/* NO Button - White with red accent */}
                <button
                  onClick={() => handlePlaceBet('negative')}
                  disabled={isLoading || !isBettingAllowed()}
                  className="group relative bg-white hover:bg-purple-100 border-2 border-black hover:border-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-black hover:text-purple-700 p-6 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="p-2 bg-black/10 group-hover:bg-purple-100 rounded-lg mb-3 backdrop-blur-sm flex items-center justify-center transition-colors duration-300">
                      <TrendingDown className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="tracking-wide">NO</div>
                  </div>
                </button>
              </div>

              {isLoading && (
                <div className="text-center mt-8">
                  <div className="inline-flex items-center gap-3 text-black bg-white border-2 border-black px-6 py-3 rounded-xl shadow-lg">
                    <div className="relative">
                      <Zap className="w-6 h-6 text-purple-700" />
                      <div className="absolute inset-0 animate-ping">
                        <Zap className="w-6 h-6 text-purple-700 opacity-30" />
                      </div>
                    </div>
                    <span className="font-bold">Placing bet...</span>
                  </div>
                </div>
              )}
              </div>
            </div>
            )}
          </>
        )}

        {/* Enhanced Status Message */}
        {message && (
          <div className={`p-6 rounded-2xl mb-8 text-center backdrop-blur-xl border shadow-xl transform animate-in fade-in duration-500 ${
            message.includes('Failed') || message.includes('Error') 
              ? 'bg-purple-100/80 border-purple-200/50 text-purple-700 shadow-purple-900/10' 
              : 'bg-green-50/80 border-green-200/50 text-green-700 shadow-green-900/10'
          }`}>
            <p className="font-bold text-lg">{message}</p>
          </div>
        )}

        {/* Universal Dual Timer System - Always Visible */}
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl shadow-gray-900/10">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center mb-4 sm:mb-6">You must return tomorrow</h3>
            

            {/* New Question Timer */}
            {(() => {
              const urgency = getTimerUrgency(timeUntilNewQuestion.hours, timeUntilNewQuestion.minutes, timeUntilNewQuestion.seconds);
              
              // Custom styling for purple/black/white theme
              let containerClass, textClass, iconClass, timerClass;
              
              if (urgency === 'critical') {
                containerClass = 'bg-gradient-to-r from-purple-100 to-white border-2 border-purple-500 animate-pulse';
                textClass = 'text-purple-900';
                iconClass = 'bg-purple-700';
                timerClass = 'text-purple-900';
              } else if (urgency === 'urgent') {
                containerClass = 'bg-gradient-to-r from-purple-50 to-white border-2 border-purple-300 animate-pulse';
                textClass = 'text-purple-800';
                iconClass = 'bg-purple-600';
                timerClass = 'text-purple-900';
              } else {
                containerClass = 'bg-gradient-to-r from-black to-gray-900 border border-gray-800';
                textClass = 'text-white';
                iconClass = 'bg-purple-700';
                timerClass = 'text-white';
              }
              
              return (
                <div className={`${containerClass} rounded-xl p-3 sm:p-4`}>
                  <div className="flex items-center justify-between">
                    <div className={`${textClass} font-bold text-sm sm:text-base`}>Next Question in:</div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 ${iconClass} rounded-full flex items-center justify-center`}>
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span className={`font-bold ${timerClass} text-base sm:text-lg tracking-wider`}>
                        {timeUntilNewQuestion.hours.toString().padStart(2, '0')}:
                        {timeUntilNewQuestion.minutes.toString().padStart(2, '0')}:
                        {timeUntilNewQuestion.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            
          </div>
        </div>

        {/* Previous Prediction Section - Below Main Interface */}
        {todaysBet && (
          <div className="bg-gradient-to-br from-blue-50/80 via-white/80 to-blue-50/80 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-2xl shadow-blue-900/10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-3 sm:mb-4">Previous Prediction</h3>
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <div className={`p-2 sm:p-3 rounded-xl shadow-md ${
                  todaysBet.prediction === 'positive' ? 'bg-[#00dd00]' : 'bg-[#dd0000]'
                }`}>
                  {todaysBet.prediction === 'positive' ? (
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  ) : (
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                    {todaysBet.prediction === 'positive' ? 'YES' : 'NO'}
                  </div>
                  <div className="text-gray-500 text-xs font-medium">
                    For: {new Date(todaysBet.betDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div> 
          </div>
        )}

        {/* Premium Rules Section - Only show when no provisional outcome is set */}
        {!hasOutcomeBeenSet() && (
          <div className="bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 text-center shadow-xl shadow-gray-900/5 relative overflow-hidden">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/10 via-transparent to-gray-900/10"></div>
            </div>
            
            <div className="relative z-10 text-gray-700 text-sm font-bold tracking-wide">
             Wrong predictions will require a re-entry fee to continue.
            </div>
          </div>
        )}


        {/* Admin Evidence Review Panel - Removed - Now available on dedicated admin page */}
        {false && isAdmin() && hasOutcomeBeenSet() && marketOutcome && (
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-8 mt-8 shadow-2xl shadow-blue-900/10 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Admin Panel</h3>
                  <p className="text-blue-700 font-medium">Review Evidence Submissions</p>
                </div>
              </div>
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

            {/* Evidence List */}
            {showAdminPanel && (
              <div className="space-y-4">
                {isLoadingEvidence ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center gap-3 text-blue-600">
                      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="font-medium">Loading evidence submissions...</span>
                    </div>
                  </div>
                ) : allEvidenceSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No evidence submissions yet</p>
                    <p className="text-gray-500 text-sm">Evidence will appear here when users dispute the outcome</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-100 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-blue-900 mb-2">📋 Evidence Summary</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-blue-800">{allEvidenceSubmissions.length}</div>
                          <div className="text-blue-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-orange-800">{allEvidenceSubmissions.filter(e => e.status === 'pending').length}</div>
                          <div className="text-orange-600">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-green-800">{allEvidenceSubmissions.filter(e => e.status === 'approved').length}</div>
                          <div className="text-green-600">Approved</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {allEvidenceSubmissions.map((submission, index) => (
                        <div key={submission.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h5 className="font-bold text-gray-900">Evidence #{index + 1}</h5>
                              <p className="text-sm text-gray-600">
                                From: {submission.walletAddress.slice(0, 6)}...{submission.walletAddress.slice(-4)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Submitted: {new Date(submission.submittedAt).toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              submission.status === 'pending' 
                                ? 'bg-orange-100 text-orange-800'
                                : submission.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {submission.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-700 mb-2">Evidence:</h6>
                            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                              {submission.evidence}
                            </p>
                          </div>

                          {submission.reviewNotes && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h6 className="font-semibold text-blue-700 mb-1">Admin Review:</h6>
                              <p className="text-blue-800 text-sm">{submission.reviewNotes}</p>
                              {submission.reviewedAt && (
                                <p className="text-blue-600 text-xs mt-1">
                                  Reviewed: {new Date(submission.reviewedAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}