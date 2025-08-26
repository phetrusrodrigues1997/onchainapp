import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { placeBitcoinBet, getTomorrowsBet, getTodaysBet, getReEntryFee, submitEvidence, getUserEvidenceSubmission, getAllEvidenceSubmissions } from '../Database/actions';
import { getProvisionalOutcome } from '../Database/OwnerActions';
import { TrendingUp, TrendingDown, Shield, Zap, AlertTriangle, Clock, FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import Cookies from 'js-cookie';

// Define table identifiers instead of passing table objects
const tableMapping = {
  "0x5AA958a4008b71d484B6b0B044e5387Db16b5CfD": "featured",
  "0x53B8Cbc599142b29D92eA4eC74fCC4f59454AcD8": "crypto",
} as const;

type TableType = typeof tableMapping[keyof typeof tableMapping];

// Contract ABI for PredictionPot (minimal version to check participants)
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
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

  // Timer states for countdown displays
  const [timeUntilOutcome, setTimeUntilOutcome] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });
  
  const [timeUntilNewQuestion, setTimeUntilNewQuestion] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  // Check if betting is allowed (Sunday through Friday, unless testing toggle is off)
  const isBettingAllowed = (): boolean => {
    if (!SHOW_RESULTS_DAY_INFO) {
      return true; // Always allow betting when testing toggle is off
    }
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    return day !== 6; // All days except Saturday
  };

  // Check if today is Saturday (results day) - only when toggle is enabled
  const isResultsDay = (): boolean => {
    if (!SHOW_RESULTS_DAY_INFO) {
      return false; // Never show results day when testing toggle is off
    }
    const now = new Date();
    const day = now.getDay();
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

  // Get tomorrow midnight (when outcome will be revealed)
  const getTomorrowMidnight = (): Date => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  };

  // Get today midnight (when new question becomes available)
  const getTodayMidnight = (): Date => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // This gives us tomorrow at 00:00 (same as next midnight)
    return midnight;
  };

  // Update countdown timers
  const updateCountdowns = () => {
    const now = new Date();
    
    // Time until outcome is revealed (tomorrow midnight)
    const tomorrowMidnight = getTomorrowMidnight();
    const diffToOutcome = tomorrowMidnight.getTime() - now.getTime();
    
    if (diffToOutcome > 0) {
      const hours = Math.floor(diffToOutcome / (1000 * 60 * 60));
      const minutes = Math.floor((diffToOutcome % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffToOutcome % (1000 * 60)) / 1000);
      setTimeUntilOutcome({ hours, minutes, seconds });
    } else {
      setTimeUntilOutcome({ hours: 0, minutes: 0, seconds: 0 });
    }

    // Time until new question (today midnight)
    const todayMidnight = getTodayMidnight();
    const diffToNewQuestion = todayMidnight.getTime() - now.getTime();
    
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

  // Add useEffect to handle cookie retrieval
  useEffect(() => {
    const savedContract = Cookies.get('selectedMarket');
    const savedQuestion = Cookies.get('selectedMarketQuestion');
    
    // Set the market question if available
    if (savedQuestion) {
      setMarketQuestion(savedQuestion);
      console.log('Loaded market question:', savedQuestion);
    }
    
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
  }, [address, selectedTableType, contractAddress]);

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
      console.error('Error loading market outcome:', error);
    }
  }, [contractAddress, selectedTableType, address, loadUserEvidenceSubmission]);

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
  }, [address, selectedTableType]);

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
  }, [marketOutcome, isEvidenceWindowActive]);

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
      showMessage('Market data refreshed');
    } catch (error) {
      console.error('Error refreshing market data:', error);
      showMessage('Failed to refresh market data');
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
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-red-900 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-md mx-auto text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 shadow-2xl shadow-gray-900/10">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Access Required</h1>
            <p className="text-gray-600 mb-8 text-lg">You must join the market first</p>
            <button className="bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 transform duration-300">
              Enter Market
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
        ) : reEntryFee && reEntryFee > 0 ? (
          // Re-entry Required Message
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Re-entry Required</h2>
              <p className="text-gray-600 text-sm mb-6">
                Wrong prediction in {selectedTableType === 'featured' ? 'Featured Market' : 'Crypto Market'}. Pay today's entry fee to continue.
              </p>
              
              <button
                onClick={() => setActiveSection('bitcoinPot')}
                className="w-full bg-black text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Pay Entry Fee
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Today's Bet Results (Previous Prediction Awaiting Outcome) */}
            {todaysBet && (
              <div className="bg-gradient-to-br from-blue-50/80 via-white/80 to-blue-50/80 backdrop-blur-xl border border-blue-200/50 rounded-3xl p-6 mb-8 shadow-2xl shadow-blue-900/10 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-gray-700 mb-4">Previous Prediction</h3>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl shadow-md ${
                      todaysBet.prediction === 'positive' ? 'bg-[#00dd00]' : 'bg-[#dd0000]'
                    }`}>
                      {todaysBet.prediction === 'positive' ? (
                        <TrendingUp className="w-6 h-6 text-white" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-black text-gray-900 tracking-tight">
                        {todaysBet.prediction === 'positive' ? 'YES' : 'NO'}
                      </div>
                      <div className="text-gray-500 text-xs font-medium">
                        {new Date(todaysBet.betDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Outcome Countdown */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700 font-medium text-sm">Result in:</span>
                    </div>
                    <span className="font-bold text-blue-900 text-lg tracking-wider">
                      {timeUntilOutcome.hours.toString().padStart(2, '0')}:
                      {timeUntilOutcome.minutes.toString().padStart(2, '0')}:
                      {timeUntilOutcome.seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                </div> 
              </div>
            )}

            {/* Tomorrow's Bet Interface */}
            {(hasOutcomeBeenSet() && marketOutcome && isEvidenceWindowActive()) ? (
              // PRIORITY: Evidence submission interface when window is active
              <div className="space-y-6">
                {/* Market Outcome Display - Compressed */}
                <div className={`bg-gradient-to-br backdrop-blur-xl border-2 rounded-2xl p-6 mb-6 mt-16 shadow-xl relative overflow-hidden ${
                  marketOutcome?.outcome === 'positive' 
                    ? 'from-green-50 via-white to-green-50 border-green-200 shadow-green-900/10' 
                    : 'from-red-50 via-white to-red-50 border-red-200 shadow-red-900/10'
                }`}>
                  <div className="flex items-center justify-center gap-6">
                    <div className={`w-16 h-16 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg ${
                      marketOutcome?.outcome === 'positive' 
                        ? 'from-green-500 to-green-600' 
                        : 'from-red-500 to-red-600'
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
                          : 'from-red-50/80 to-white/80 border-red-200/30'
                      }`}>
                        <div className={`text-2xl font-black tracking-tight ${
                          marketOutcome?.outcome === 'positive' ? 'text-green-700' : 'text-red-700'
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
                        <div className="flex items-center gap-2 text-orange-600">
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
                        <div className="bg-orange-100 rounded-2xl p-4 border border-orange-200">
                          <p className="text-orange-700 text-sm text-center">
                            Submit evidence against this outcome within the time limit
                          </p>
                        </div>

                        <div>
                          <label className="block text-gray-700 font-bold mb-3">
                            Evidence Against Outcome
                          </label>
                          <textarea
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                            placeholder="Provide detailed evidence why this outcome is incorrect. Include links, sources, or explanations..."
                            className="w-full text-black h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            disabled={isSubmittingEvidence}
                          />
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
                          The market outcome is now final and pot distribution will proceed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : tomorrowsBet ? (
              <div className="bg-white border-2 border-black rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Header Section */}
                <div className="bg-black text-white px-8 py-6 text-center">
                  <h2 className="text-2xl font-bold tracking-tight">Prediction Confirmed</h2>
                  <p className="text-gray-300 text-sm mt-1">
                    {new Date(new Date().getTime() + 24*60*60*1000).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Main Prediction Display */}
                <div className="p-8 text-center">
                  <div className="flex items-center justify-center gap-8 mb-8">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                      tomorrowsBet.prediction === 'positive' 
                        ? 'bg-black' 
                        : 'bg-red-600'
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
                      <div className="text-gray-600 text-sm font-medium">
                        Set at {new Date(tomorrowsBet.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
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
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-black font-bold text-sm">Active</div>
                    </div>
                    
                    <div className="bg-white border-2 border-black rounded-xl p-4 text-center">
                      <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-black font-bold text-sm">Locked</div>
                    </div>
                  </div>
                </div>

                {/* Timer Bars - Bottom Section (Dual Timer System) */}
                <div className="bg-black">
                  {/* Outcome Timer - Show if there's a previous prediction awaiting results */}
                  {todaysBet && (
                    <div className="px-6 py-3 border-b border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">Previous Result</div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                          <span className="font-bold text-white text-lg tracking-wider">
                            {timeUntilOutcome.hours.toString().padStart(2, '0')}:
                            {timeUntilOutcome.minutes.toString().padStart(2, '0')}:
                            {timeUntilOutcome.seconds.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* New Question Timer */}
                  <div className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-medium">Next Question</div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-bold text-white text-lg tracking-wider">
                          {timeUntilNewQuestion.hours.toString().padStart(2, '0')}:
                          {timeUntilNewQuestion.minutes.toString().padStart(2, '0')}:
                          {timeUntilNewQuestion.seconds.toString().padStart(2, '0')}
                        </span>
                      </div>
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
                      You'll have 1 hour to submit evidence if you disagree
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
                        <span className="text-red-600 font-bold">✗ Results Day</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Premium betting interface
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 relative overflow-hidden">
            {/* Subtle animated background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 animate-pulse"></div>
            </div>
            
            <div className="relative z-10">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Your Call?</h2>
                {marketQuestion && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 mx-auto max-w-md">
                    <p className="text-gray-800 font-semibold text-base leading-relaxed">
                      {marketQuestion}
                    </p>
                  </div>
                )}
                <p className="text-gray-600 text-lg mb-4">
                  Predict for {new Date(new Date().getTime() + 24*60*60*1000).toLocaleDateString()}
                </p>
                
                {/* Dual Timer System */}
                <div className="space-y-3 mb-6 max-w-xs mx-auto">
                  {/* Previous Result Timer - Only show if there's a todaysBet */}
                  {todaysBet && (
                    <div className="bg-white border-2 border-blue-600 rounded-xl p-3">
                      <div className="text-center mb-2">
                        <span className="text-blue-700 font-medium text-sm">Previous Result</span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-bold text-blue-900 text-lg tracking-wider">
                          {timeUntilOutcome.hours.toString().padStart(2, '0')}:
                          {timeUntilOutcome.minutes.toString().padStart(2, '0')}:
                          {timeUntilOutcome.seconds.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Next Question Timer */}
                  <div className="bg-white border-2 border-black rounded-xl p-3">
                    <div className="text-center mb-2">
                      <span className="text-gray-700 font-medium text-sm">Next Question</span>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                        <Clock className="w-3 h-3 text-white" />
                      </div>
                      <span className="font-bold text-black text-lg tracking-wider">
                        {timeUntilNewQuestion.hours.toString().padStart(2, '0')}:
                        {timeUntilNewQuestion.minutes.toString().padStart(2, '0')}:
                        {timeUntilNewQuestion.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {/* Premium Bullish Button */}
                <button
                  onClick={() => handlePlaceBet('positive')}
                  disabled={isLoading || !isBettingAllowed()}
                  className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-black hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white p-6 sm:p-10 rounded-3xl font-black text-xl sm:text-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-3xl shadow-gray-900/25 overflow-hidden"
                >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="p-2 sm:p-3 bg-white/10 rounded-2xl mb-4 sm:mb-6 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 sm:w-14 sm:h-14 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="tracking-wide">YES</div>
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gray-900 to-black opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                </button>

                {/* Premium Bearish Button */}
                <button
                  onClick={() => handlePlaceBet('negative')}
                  disabled={isLoading || !isBettingAllowed()}
                  className="group relative bg-gradient-to-br from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 p-6 sm:p-10 rounded-3xl font-black text-xl sm:text-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-3xl shadow-gray-900/10 overflow-hidden"
                >
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="p-2 sm:p-3 bg-gray-900/10 rounded-2xl mb-4 sm:mb-6 backdrop-blur-sm flex items-center justify-center">
                      <TrendingDown className="w-10 h-10 sm:w-14 sm:h-14 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="tracking-wide">NO</div>
                  </div>
                </button>
              </div>

              {isLoading && (
                <div className="text-center mt-8">
                  <div className="inline-flex items-center gap-3 text-gray-900 bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border border-gray-200/50 shadow-lg">
                    <div className="relative">
                      <Zap className="w-6 h-6" />
                      <div className="absolute inset-0 animate-ping">
                        <Zap className="w-6 h-6 opacity-30" />
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
              ? 'bg-red-50/80 border-red-200/50 text-red-700 shadow-red-900/10' 
              : 'bg-green-50/80 border-green-200/50 text-green-700 shadow-green-900/10'
          }`}>
            <p className="font-bold text-lg">{message}</p>
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
              Predict tomorrow's outcome • Wrong predictions require re-entry fee
            </div>
          </div>
        )}

        {/* Admin Evidence Review Panel - Only visible to admins/owners */}
        {isAdmin() && hasOutcomeBeenSet() && marketOutcome && (
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
                                : 'bg-red-100 text-red-800'
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