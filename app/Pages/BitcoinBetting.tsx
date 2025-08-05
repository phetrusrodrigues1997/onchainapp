import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { placeBitcoinBet, getTodaysBet } from '../Database/actions';
import { TrendingUp, TrendingDown, Shield, Zap } from 'lucide-react';
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

export default function BitcoinBetting() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [todaysBet, setTodaysBet] = useState<TodaysBet | null>(null);
  const [isBetLoading, setIsBetLoading] = useState<boolean>(true);
  const [contractAddress, setContractAddress] = useState<string>('');
  const [selectedTableType, setSelectedTableType] = useState<TableType>('featured');

  // Add useEffect to handle cookie retrieval
  useEffect(() => {
    const savedContract = Cookies.get('selectedMarket');
    
    if (savedContract) {
      setContractAddress(savedContract);
      // Set the table type based on contract address
      const tableType = tableMapping[savedContract as keyof typeof tableMapping];
      if (tableType) {
        setSelectedTableType(tableType);
      } else {
        setSelectedTableType('featured'); // Default fallback
      }
    } else {
      // Fallback to bitcoin contract if no cookie is found
      setContractAddress('0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794');
      setSelectedTableType('crypto');
      console.log('No cookie found, using default bitcoin contract');
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

  // Load today's bet on component mount and when address changes
  useEffect(() => {
    if (address && isParticipant) {
      loadTodaysBet();
    }
  }, [address, isParticipant, selectedTableType]);

  const loadTodaysBet = async () => {
    if (!address) return;

    setIsBetLoading(true);
    try {
      // Pass the table type string instead of the table object
      const bet = await getTodaysBet(address, selectedTableType);
      setTodaysBet(bet);
    } catch (error) {
      console.error("Error loading today's bet:", error);
      setTodaysBet(null);
    } finally {
      setIsBetLoading(false);
    }
  };

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handlePlaceBet = async (prediction: 'positive' | 'negative') => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Pass the table type string instead of the table object
      await placeBitcoinBet(address, prediction, selectedTableType);
      
      
      showMessage(`Bet placed successfully! `);
      await loadTodaysBet(); // Reload to show the new bet
    } catch (error: any) {
      console.error('Error placing bet:', error);
      showMessage(error.message || 'Failed to place bet. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
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
        {isBetLoading ? (
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
              <span className="font-medium">Loading your bet...</span>
            </div>
          </div>
        ) : todaysBet ? (
          // Enhanced bet display with premium feel
          <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-10 mb-8 shadow-2xl shadow-gray-900/10 text-center relative overflow-hidden">
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5">
              <div className={`absolute inset-0 ${
                todaysBet.prediction === 'positive' 
                  ? 'bg-gradient-to-br from-green-500/20 to-transparent' 
                  : 'bg-gradient-to-br from-red-500/20 to-transparent'
              }`}></div>
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-6 px-10 py-8 rounded-3xl bg-gradient-to-br from-gray-50/80 to-white/80 backdrop-blur-sm border border-gray-200/30 shadow-xl">
                {todaysBet.prediction === 'positive' ? (
                  <div className="p-4 bg-[#00dd00] rounded-2xl shadow-lg">
                    <TrendingUp className="w-12 h-12 text-white " />
                  </div>
                ) : (
                  <div className="p-4 bg-[#dd0000] rounded-2xl shadow-lg">
                    <TrendingDown className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <div className="text-4xl font-black text-gray-900 tracking-tight mb-1">
                    {todaysBet.prediction === 'positive' ? 'YES' : 'NO'}
                  </div>
                  <div className="text-gray-500 text-sm font-medium">
                    {new Date(todaysBet.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-lg mt-8 font-medium">Come back tomorrow!</p>
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
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Your Call?</h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Premium Bullish Button */}
                <button
                  onClick={() => handlePlaceBet('positive')}
                  disabled={isLoading}
                  className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-black hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white p-10 rounded-3xl font-black text-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-3xl shadow-gray-900/25 overflow-hidden"
                >
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="p-3 bg-white/10 rounded-2xl w-fit mx-auto mb-6 backdrop-blur-sm">
                      <TrendingUp className="w-14 h-14 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div className="tracking-wide">YES</div>
                  </div>
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gray-900 to-black opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                </button>

                {/* Premium Bearish Button */}
                <button
                  onClick={() => handlePlaceBet('negative')}
                  disabled={isLoading}
                  className="group relative bg-gradient-to-br from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 p-10 rounded-3xl font-black text-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-3xl shadow-gray-900/10 overflow-hidden"
                >
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="p-3 bg-gray-900/10 rounded-2xl w-fit mx-auto mb-6 backdrop-blur-sm">
                      <TrendingDown className="w-14 h-14 group-hover:scale-110 transition-transform duration-300" />
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

        {/* Premium Rules Section */}
        <div className="bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-6 text-center shadow-xl shadow-gray-900/5 relative overflow-hidden">
          {/* Subtle pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/10 via-transparent to-gray-900/10"></div>
          </div>
          
          <div className="relative z-10 text-gray-700 text-sm font-bold tracking-wide">
            One prediction per day • Pot participants only
          </div>
        </div>
      </div>
    </div>
  );
}