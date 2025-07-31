import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { placeBitcoinBet, getTodaysBet } from '../Database/actions';

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
      <div className="min-h-screen bg-invisible p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-invisible backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-[#ffffff] mb-6 text-center">
              <span style={{ color: '#F7931A' }}>₿</span>itcoin Price Prediction
            </h1>
            <div className="text-center text-[#F5F5F5]">
              Please connect your wallet to place your Bitcoin price prediction.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is not a participant in the pot
  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-invisible p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-invisible backdrop-blur-sm border border-white/20 rounded-lg p-6">
            <h1 className="text-3xl font-bold text-[#ffffff] mb-6 text-center">
              <span style={{ color: '#F7931A' }}>₿</span>itcoin Price Prediction
            </h1>
            <div className="bg-[#2C2C47] p-6 rounded-lg text-center">
              <div className="text-[#F5F5F5] text-lg mb-4">
                🚫 Access Restricted
              </div>
              <div className="text-[#A0A0B0]">
                You must be a participant in the Bitcoin Pot to place predictions.
                <br />
                Please enter the pot first to unlock betting functionality.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-invisible p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-invisible backdrop-blur-sm border border-white/20 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-[#ffffff] mb-6 text-center">
            <span style={{ color: '#F7931A' }}>₿</span>itcoin Price Prediction
          </h1>

          <div className="bg-[#2C2C47] p-6 rounded-lg mb-6">
            <div className="text-center mb-6">
              <div className="text-[#A0A0B0] text-sm mb-2">Today's Date</div>
              <div className="text-[#F5F5F5] text-lg font-semibold">{getTodaysDate()}</div>
            </div>

            {todaysBet ? (
              // Show existing bet
              <div className="text-center">
                <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#d3c81a]">
                  <div className="text-[#d3c81a] text-sm mb-2">Your Prediction for Today</div>
                  <div className="text-[#F5F5F5] text-2xl font-bold mb-2">
                    {todaysBet.prediction === 'positive' ? '📈 POSITIVE' : '📉 NEGATIVE'}
                  </div>
                  <div className="text-[#A0A0B0] text-sm">
                    You predicted Bitcoin will end the day {todaysBet.prediction}
                  </div>
                  <div className="text-[#A0A0B0] text-xs mt-2">
                    Bet placed at: {new Date(todaysBet.createdAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-[#A0A0B0] text-sm mt-4">
                  You can only place one prediction per day. Come back tomorrow for another prediction!
                </div>
              </div>
            ) : (
              // Show betting interface
              <div>
                <div className="text-center mb-6">
                  <div className="text-[#F5F5F5] text-lg mb-2">
                    Will Bitcoin's price end today higher or lower than it started?
                  </div>
                  <div className="text-[#A0A0B0] text-sm">
                    Make your prediction for today's Bitcoin price movement
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Positive Button */}
                  <button
                    onClick={() => handlePlaceBet('positive')}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="text-3xl mb-2">📈</div>
                    <div>POSITIVE</div>
                    <div className="text-sm opacity-80 mt-1">Bitcoin will end higher</div>
                  </button>

                  {/* Negative Button */}
                  <button
                    onClick={() => handlePlaceBet('negative')}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-6 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="text-3xl mb-2">📉</div>
                    <div>NEGATIVE</div>
                    <div className="text-sm opacity-80 mt-1">Bitcoin will end lower</div>
                  </button>
                </div>

                {isLoading && (
                  <div className="text-center mt-4">
                    <div className="text-[#d3c81a]">Placing your bet...</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('Failed') || message.includes('Error') ? 'bg-red-900/50 border border-red-500' : 'bg-green-900/50 border border-green-500'}`}>
              <p className="text-[#F5F5F5]">{message}</p>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-[#1a1a2e] p-4 rounded-lg border border-[#d3c81a]/30">
            <div className="text-[#d3c81a] text-sm font-semibold mb-2">How it works:</div>
            <ul className="text-[#A0A0B0] text-sm space-y-1">
              <li>• Predict if Bitcoin will end the day positive or negative</li>
              <li>• You can only make one prediction per day</li>
              <li>• Only Bitcoin Pot participants can place predictions</li>
              <li>• Results are determined at the end of each trading day</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}