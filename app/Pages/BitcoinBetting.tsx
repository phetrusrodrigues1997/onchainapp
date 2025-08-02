import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { placeBitcoinBet, getTodaysBet } from '../Database/actions';
import { TrendingUp, TrendingDown, Clock, Shield, Zap, CheckCircle2 } from 'lucide-react';

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

interface BitcoinBettingProps {
  contractAddress: string;
}

interface TodaysBet {
  id: number;
  walletAddress: string;
  prediction: string;
  betDate: string;
  createdAt: Date;
}

export default function BitcoinBetting({ contractAddress }: BitcoinBettingProps) {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [todaysBet, setTodaysBet] = useState<TodaysBet | null>(null);

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
  }, [address, isParticipant]);

  const loadTodaysBet = async () => {
    if (!address) return;
    
    try {
      const bet = await getTodaysBet(address);
      setTodaysBet(bet);
    } catch (error) {
      console.error('Error loading today\'s bet:', error);
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
      await placeBitcoinBet(address, prediction);
      showMessage(`Bet placed successfully! You predicted Bitcoin will end ${prediction} today.`);
      await loadTodaysBet(); // Reload to show the new bet
    } catch (error: any) {
      console.error('Error placing bet:', error);
      showMessage(error.message || 'Failed to place bet. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaysDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // If wallet is not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-transparent p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
              <span className="text-3xl font-bold text-white">₿</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h1>
            <p className="text-gray-600">Connect to start predicting</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not a participant in the pot
  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-transparent p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
            <p className="text-gray-600 mb-6">Join the Bitcoin Pot first</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl">
              Enter Pot
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25">
            <span className="text-4xl font-bold text-white">₿</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {todaysBet ? (
          // Show existing bet - MINIMAL
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 mb-6 shadow-2xl text-center">
            <div className={`inline-flex items-center gap-4 px-8 py-6 rounded-2xl ${
              todaysBet.prediction === 'positive' 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              {todaysBet.prediction === 'positive' ? (
                <TrendingUp className="w-12 h-12 text-green-600" />
              ) : (
                <TrendingDown className="w-12 h-12 text-red-600" />
              )}
              <div>
                <div className={`text-3xl font-bold ${
                  todaysBet.prediction === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {todaysBet.prediction === 'positive' ? 'BULLISH' : 'BEARISH'}
                </div>
                <div className="text-gray-500 text-sm">
                  {new Date(todaysBet.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-6">Come back tomorrow!</p>
          </div>
        ) : (
          // Show betting interface - MINIMAL
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 mb-6 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Call?</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-red-500 mx-auto rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Positive Button */}
              <button
                onClick={() => handlePlaceBet('positive')}
                disabled={isLoading}
                className="group bg-gradient-to-br from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25"
              >
                <TrendingUp className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <div>BULLISH</div>
              </button>

              {/* Negative Button */}
              <button
                onClick={() => handlePlaceBet('negative')}
                disabled={isLoading}
                className="group bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-8 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25"
              >
                <TrendingDown className="w-12 h-12 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <div>BEARISH</div>
              </button>
            </div>

            {isLoading && (
              <div className="text-center mt-6">
                <div className="inline-flex items-center gap-2 text-orange-500">
                  <Zap className="w-5 h-5 animate-pulse" />
                  <span className="font-medium">Placing bet...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-center ${
            message.includes('Failed') || message.includes('Error') 
              ? 'bg-red-50 border-2 border-red-200 text-red-700' 
              : 'bg-green-50 border-2 border-green-200 text-green-700'
          }`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Minimal Rules */}
        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-4 text-center">
          <div className="text-orange-600 text-sm font-semibold mb-2">
            One prediction per day • Pot participants only
          </div>
        </div>
      </div>
    </div>
  );
}