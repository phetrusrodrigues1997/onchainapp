import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { placeBitcoinBet, getTomorrowsBet, getTodaysBet, getReEntryFee } from '../Database/actions';
import { getProvisionalOutcome } from '../Database/OwnerActions';
import { TrendingUp, TrendingDown, Shield, Zap, AlertTriangle, Clock, FileText, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import Cookies from 'js-cookie';

// Define table identifiers instead of passing table objects
const tableMapping = {
  "0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794": "featured",
  "0xD4B6F1CF1d063b760628952DDf32a44974129697": "crypto",
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
  finalOutcome?: 'positive' | 'negative';
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

export default function MakePredicitions() {
  const { address, isConnected } = useAccount();
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

  // Check if betting is allowed (Sunday through Friday)
  const isBettingAllowed = (): boolean => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    return day !== 6; // All days except Saturday
  };

  // Check if today is Saturday (results day)
  const isResultsDay = (): boolean => {
    const now = new Date();
    const day = now.getDay();
    return day === 6; // Saturday
  };

  // Check if outcome has been set for this market
  const hasOutcomeBeenSet = (): boolean => {
    return marketOutcome !== null;
  };

  // Check if evidence submission window is active (within 1 hour of outcome being set)
  const isEvidenceWindowActive = (): boolean => {
    if (!marketOutcome) return false;
    const now = new Date();
    return now < marketOutcome.evidenceWindowExpires;
  };

  // Format time remaining in evidence window
  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
      setContractAddress('0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794');
      setSelectedTableType('featured');
      console.log('No valid contract cookie found, using default');
    }
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

  // Load market outcome for current contract
  const loadMarketOutcome = useCallback(async () => {
    if (!contractAddress || !selectedTableType) return;
    
    try {
      const provisionalOutcomeData = await getProvisionalOutcome(selectedTableType);
      
      if (provisionalOutcomeData) {
        setMarketOutcome({
          id: 1,
          contractAddress,
          outcome: provisionalOutcomeData.outcome,
          setAt: new Date(provisionalOutcomeData.setAt),
          evidenceWindowExpires: new Date(provisionalOutcomeData.evidenceWindowExpires),
          isDisputed: false
        });
        
        // Calculate remaining time
        const now = new Date().getTime();
        const expiry = new Date(provisionalOutcomeData.evidenceWindowExpires).getTime();
        const remaining = Math.max(0, expiry - now);
        setTimeUntilEvidenceExpires(remaining);
        
        console.log('Loaded provisional outcome:', provisionalOutcomeData);
      } else {
        setMarketOutcome(null);
        console.log('No provisional outcome set yet');
      }
    } catch (error) {
      console.error('Error loading market outcome:', error);
    }
  }, [contractAddress, selectedTableType]);

  // Load user's evidence submission if any
  const loadUserEvidenceSubmission = useCallback(async () => {
    if (!address || !contractAddress) return;
    
    try {
      // TODO: Implement getUserEvidenceSubmission in Database/actions
      // const submission = await getUserEvidenceSubmission(address, contractAddress);
      // setUserEvidenceSubmission(submission);
      
      console.log('Loading evidence submission for user:', address);
    } catch (error) {
      console.error('Error loading evidence submission:', error);
    }
  }, [address, contractAddress]);

  const loadBets = useCallback(async () => {
    if (!address) return;

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
      setAllReEntryFees(allReEntryFees);
    } catch (error) {
      console.error("Error loading bets:", error);
      setTomorrowsBet(null);
      setTodaysBet(null);
      setReEntryFee(null);
    } finally {
      setIsBetLoading(false);
    }
  }, [address, selectedTableType]);

  // Load bets on component mount and when address changes
  useEffect(() => {
    if (address && isParticipant) {
      loadBets();
      loadMarketOutcome();
      loadUserEvidenceSubmission();
    }
  }, [address, isParticipant, selectedTableType, loadBets, loadMarketOutcome, loadUserEvidenceSubmission]);

  // Timer effect for evidence window countdown
  useEffect(() => {
    if (!isEvidenceWindowActive()) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = marketOutcome?.evidenceWindowExpires.getTime() || 0;
      const remaining = expiry - now;
      
      if (remaining <= 0) {
        setTimeUntilEvidenceExpires(0);
        clearInterval(timer);
      } else {
        setTimeUntilEvidenceExpires(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [marketOutcome]);

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
    if (!address || !evidenceText.trim() || !contractAddress) return;
    
    setIsSubmittingEvidence(true);
    try {
      // TODO: Implement evidence submission with $5 USDC payment
      // This would involve:
      // 1. USDC approval for $5 (5000000 with 6 decimals)
      // 2. Contract call to submit evidence and payment
      // 3. Database record of evidence submission
      
      // For now, simulate the submission
      console.log('Submitting evidence:', evidenceText);
      console.log('Payment: $5 USDC');
      
      // TODO: Implement submitEvidence in Database/actions
      // await submitEvidence(address, contractAddress, evidenceText, txHash);
      
      showMessage('Evidence submitted successfully! Payment of $5 USDC processed.');
      setEvidenceText('');
      await loadUserEvidenceSubmission();
    } catch (error: unknown) {
      console.error('Error submitting evidence:', error);
      showMessage(error instanceof Error ? error.message : 'Failed to submit evidence. Please try again.');
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  // Reload market outcome data (useful for refreshing after admin sets provisional outcome)
  const refreshMarketData = () => {
    loadMarketOutcome();
    showMessage('Market data refreshed');
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
        {isBetLoading ? (
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <span className="font-medium">Loading your bet...</span>
            </div>
          </div>
        ) : reEntryFee ? (
          // Re-entry Required Message
          <div className="bg-orange-50/80 backdrop-blur-xl border-2 border-orange-200 rounded-3xl p-10 mb-8 shadow-2xl shadow-orange-900/10 relative overflow-hidden">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Re-entry Required</h2>
              <p className="text-orange-700 text-lg mb-4 font-medium">
                You made a wrong prediction in <span className="font-bold">{selectedTableType === 'featured' ? 'Featured Market' : 'Crypto Market'}</span> and need to pay today's entry fee to re-enter this specific market.
              </p>
              
              {/* Show info about other markets if they also need re-entry */}
              {allReEntryFees.length > 1 && (
                <div className="bg-orange-100 rounded-2xl p-4 border border-orange-200 mb-4">
                  <div className="text-sm font-bold text-orange-900 mb-2">📋 All markets requiring re-entry:</div>
                  <div className="space-y-1 text-sm text-orange-800">
                    {allReEntryFees.map((entry) => (
                      <div key={entry.market} className="flex justify-between">
                        <span>{entry.market === 'featured' ? '₿ Featured Market' : '🪙 Crypto Market'}</span>
                        <span className={entry.market === selectedTableType ? 'font-bold text-orange-900' : ''}>
                          {(entry.fee / 1000000).toFixed(2)} USDC {entry.market === selectedTableType ? '← Current' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-orange-700 mt-2 italic">
                    💡 Each market requires separate re-entry. You can re-enter them individually.
                  </div>
                </div>
              )}
              
              <div className="bg-orange-100 rounded-2xl p-6 border border-orange-200 mb-6">
                <p className="text-orange-800 font-bold text-lg mb-2">
                  Return to market entry page to pay today's entry fee for this market
                </p>
                <p className="text-orange-600 text-sm">
                  Then come back here to resume predicting in {selectedTableType === 'featured' ? 'Featured Market' : 'Crypto Market'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Today's Bet Results (if any) */}
            {todaysBet && (
              <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 mb-6 shadow-2xl shadow-gray-900/10 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-gray-700 mb-4">Today's Prediction Results</h3>
                  <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/30 shadow-lg">
                    {todaysBet.prediction === 'positive' ? (
                      <div className="p-3 bg-[#00dd00] rounded-xl shadow-md">
                        <TrendingUp className="w-8 h-8 text-white" />
                      </div>
                    ) : (
                      <div className="p-3 bg-[#dd0000] rounded-xl shadow-md">
                        <TrendingDown className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-2xl font-black text-gray-900 tracking-tight">
                        {todaysBet.prediction === 'positive' ? 'YES' : 'NO'}
                      </div>
                      <div className="text-gray-500 text-xs font-medium">
                        Awaiting results...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tomorrow's Bet Interface */}
            {tomorrowsBet ? (
              <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-gray-700 mb-6">Tomorrow's Prediction</h3>
                  <div className="inline-flex items-center gap-6 px-10 py-8 rounded-3xl bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/30 shadow-xl">
                    {tomorrowsBet.prediction === 'positive' ? (
                      <div className="p-4 bg-[#00dd00] rounded-2xl shadow-lg">
                        <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                    ) : (
                      <div className="p-4 bg-[#dd0000] rounded-2xl shadow-lg">
                        <TrendingDown className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <div className="text-4xl font-black text-gray-900 tracking-tight mb-1">
                        {tomorrowsBet.prediction === 'positive' ? 'YES' : 'NO'}
                      </div>
                      <div className="text-gray-500 text-sm font-medium">
                        {new Date(tomorrowsBet.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-lg mt-6 font-medium">
                    Prediction set for {new Date(new Date().getTime() + 24*60*60*1000).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : hasOutcomeBeenSet() ? (
              // Market outcome has been set - show outcome and evidence submission interface
              <div className="space-y-6">
                {/* Market Outcome Display */}
                <div className={`bg-gradient-to-br backdrop-blur-xl border-2 rounded-3xl p-10 mb-8 shadow-2xl relative overflow-hidden ${
                  marketOutcome?.outcome === 'positive' 
                    ? 'from-green-50 via-white to-green-50 border-green-200 shadow-green-900/10' 
                    : 'from-red-50 via-white to-red-50 border-red-200 shadow-red-900/10'
                }`}>
                  <div className="text-center">
                    <div className={`w-24 h-24 bg-gradient-to-br rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg ${
                      marketOutcome?.outcome === 'positive' 
                        ? 'from-green-500 to-green-600' 
                        : 'from-red-500 to-red-600'
                    }`}>
                      {marketOutcome?.outcome === 'positive' ? (
                        <TrendingUp className="w-12 h-12 text-white" />
                      ) : (
                        <TrendingDown className="w-12 h-12 text-white" />
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Market Outcome Set</h2>
                    <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-br backdrop-blur-sm border shadow-lg ${
                      marketOutcome?.outcome === 'positive' 
                        ? 'from-green-50/80 to-white/80 border-green-200/30' 
                        : 'from-red-50/80 to-white/80 border-red-200/30'
                    }`}>
                      <div className={`text-4xl font-black tracking-tight ${
                        marketOutcome?.outcome === 'positive' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {marketOutcome?.outcome === 'positive' ? 'YES' : 'NO'}
                      </div>
                    </div>
                    
                    {marketOutcome?.finalOutcome && marketOutcome.finalOutcome !== marketOutcome.outcome && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mt-4">
                        <p className="text-yellow-800 font-semibold">
                          ⚠️ Outcome was disputed and updated to: <span className="font-bold">
                            {marketOutcome.finalOutcome === 'positive' ? 'YES' : 'NO'}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
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
                            Evidence Against Outcome ($5 USDC required)
                          </label>
                          <textarea
                            value={evidenceText}
                            onChange={(e) => setEvidenceText(e.target.value)}
                            placeholder="Provide detailed evidence why this outcome is incorrect. Include links, sources, or explanations..."
                            className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                            disabled={isSubmittingEvidence}
                          />
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                            <div className="text-yellow-800">
                              <p className="font-bold mb-2">Evidence Submission Terms:</p>
                              <ul className="text-sm space-y-1">
                                <li>• $5 USDC fee required to submit evidence</li>
                                <li>• Fee is refunded if your evidence is accepted</li>
                                <li>• Fee is lost if evidence is rejected</li>
                                <li>• Admin will review within 24 hours</li>
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
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6" />
                              Submit Evidence ($5 USDC)
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
                        <p>💰 $5 USDC payment processed</p>
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
            ) : isResultsDay() ? (
              // Saturday - Results Day message (when no outcome set yet)
              <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 backdrop-blur-xl border-2 border-blue-200 rounded-3xl p-10 mb-8 shadow-2xl shadow-blue-900/10 relative overflow-hidden">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Zap className="w-12 h-12 text-white animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Results Day! 🎉</h2>
                  <p className="text-gray-700 text-lg mb-6 font-medium">
                    Today is Saturday - waiting for admin to set the outcome
                  </p>
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
                {/* <div className="w-20 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div> */}
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
      </div>
    </div>
  );
}