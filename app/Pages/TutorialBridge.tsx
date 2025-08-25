'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Trophy, Users, Clock, ArrowRight } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAccount, useReadContract } from 'wagmi';

interface DashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  selectedMarket?: string;
}

// Contract addresses mapping
const CONTRACT_ADDRESSES = {
  "0x5AA958a4008b71d484B6b0B044e5387Db16b5CfD": "featured",
  "0x53B8Cbc599142b29D92eA4eC74fCC4f59454AcD8": "crypto",
} as const;

// Prediction Pot ABI
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
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "participant", "type": "address"}],
    "name": "removeParticipant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const Dashboard = ({ activeSection, setActiveSection, selectedMarket }: DashboardProps) => {
  const [currentDay, setCurrentDay] = useState('');
  const [currentEntryFee, setCurrentEntryFee] = useState('0.00');
  const [timeUntilClose, setTimeUntilClose] = useState('');
  const [marketInfo, setMarketInfo] = useState({ name: '', section: '', address: '' });
  const [userPots, setUserPots] = useState<string[]>([]);
  const [showActiveMarkets, setShowActiveMarkets] = useState(false);
  const [selectedMarketAddress, setSelectedMarketAddress] = useState<string>('');
  
  const { address, isConnected } = useAccount();

  // Check user participation in pots
  useEffect(() => {
    if (!isConnected || !address) {
      setUserPots([]);
    }
  }, [address, isConnected]);

  // Read participants from first contract
  const { data: participants1 } = useReadContract({
    address: '0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22' as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address }
  });

  // Read participants from second contract  
  const { data: participants2 } = useReadContract({
    address: '0x9FBD4dA12183a374a65A94Eb66F8165c9A7be198' as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address }
  });

  // Set up the selected market address from cookie
  useEffect(() => {
    const savedMarket = Cookies.get('selectedMarket');
    if (savedMarket) {
      setSelectedMarketAddress(savedMarket);
    }
  }, []);

  // Simple owner check - hardcoded owner address
  const OWNER_ADDRESS = '0xA90611B6AFcBdFa9DDFfCB2aa2014446297b6680';
  const isOwner = address && address.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // Update userPots when participant data changes
  useEffect(() => {
    if (!isConnected || !address) return;

    const participatingPots: string[] = [];

    // Check first contract
    if (participants1 && Array.isArray(participants1)) {
      const isParticipant1 = participants1.some(
        (participant: string) => participant.toLowerCase() === address.toLowerCase()
      );
      if (isParticipant1) {
        participatingPots.push('0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22');
      }
    }

    // Check second contract
    if (participants2 && Array.isArray(participants2)) {
      const isParticipant2 = participants2.some(
        (participant: string) => participant.toLowerCase() === address.toLowerCase()
      );
      if (isParticipant2) {
        participatingPots.push('0x9FBD4dA12183a374a65A94Eb66F8165c9A7be198');
      }
    }

    setUserPots(participatingPots);

    // Check if user is already a participant in the selected market and redirect to predictions
    // BUT only if they are NOT the owner
    if (selectedMarketAddress && participatingPots.includes(selectedMarketAddress)) {
      if (!isOwner) {
        console.log('User is participant but not owner, redirecting to predictions');
        setActiveSection('makePrediction');
      } else {
        console.log('User is owner, keeping normal dashboard flow');
      }
    }
  }, [participants1, participants2, address, isConnected, setActiveSection, selectedMarketAddress, isOwner]);


  useEffect(() => {
    const updateDashboard = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const fees = ['0.01', '0.02', '0.03', '0.04', '0.05', '0.06', '0.00'];
      
      setCurrentDay(days[dayOfWeek]);
      setCurrentEntryFee(fees[dayOfWeek]);

      // Calculate time until Saturday midnight UTC
      const nextSaturday = new Date();
      nextSaturday.setUTCDate(now.getUTCDate() + (6 - dayOfWeek));
      nextSaturday.setUTCHours(0, 0, 0, 0);
      
      const timeDiff = nextSaturday.getTime() - now.getTime();
      const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (dayOfWeek === 6) {
        setTimeUntilClose('Pot distribution in progress');
      } else {
        setTimeUntilClose(`${daysLeft}d ${hoursLeft}h until results`);
      }
    };

    // Get selected market from cookie
    const getSelectedMarket = () => {
      const selectedMarketAddress = Cookies.get('selectedMarket');
      console.log('Selected market address from cookie:', selectedMarketAddress);
      
      // Map contract addresses to market info
      if (selectedMarketAddress === '0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22') {
        setMarketInfo({ 
          name: '', 
          section: 'bitcoinPot',
          address: selectedMarketAddress 
        });
      } else if (selectedMarketAddress === '0x9FBD4dA12183a374a65A94Eb66F8165c9A7be198') {
        setMarketInfo({ 
          name: '', 
          section: 'bitcoinPot',  // Both markets use the same section, PredictionPotTest handles the difference
          address: selectedMarketAddress 
        });
      } else {
        // Default to Bitcoin market if no cookie or unknown address
        setMarketInfo({ 
          name: 'Bitcoin Market', 
          section: 'bitcoinPot',
          address: '0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22' 
        });
      }
    };

    updateDashboard();
    getSelectedMarket();
    const interval = setInterval(updateDashboard, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Your Market</h1>
          <p className="text-gray-600">Choose a prediction market to enter</p>
        </div> */}

        {/* Current Status Banner */}
        {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="w-6 h-6 text-black" />
              <div>
                <h3 className="font-bold">{currentDay}</h3>
                <p className="text-sm text-gray-600">${currentEntryFee} USDC entry fee today</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Clock className="w-6 h-6 text-black" />
              <div className="text-right">
                <h3 className="font-bold">Weekly Cycle</h3>
                <p className="text-sm text-gray-600">{timeUntilClose}</p>
              </div>
            </div>
          </div>
        </div> */}

        {/* Elimination Market Explanation */}
        <div className="border border-gray-200 rounded-lg p-6 md:p-8 mb-8 relative">
          {/* Enter Market Button - Positioned absolutely in top right, responsive */}
          <button
  onClick={() => setActiveSection(marketInfo.section)}
  className="absolute top-4 right-4 md:top-6 md:right-6 bg-red-600 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg hover:bg-black transition-all duration-200 text-sm md:text-base font-medium shadow-lg hover:shadow-xl"
  style={{
    animation: 'subtlePulse 2s infinite'
  }}
>
  <span className="md:hidden">Enter →</span>
  <span className="hidden md:inline">Enter Market →</span>
</button>

          
          {/* Custom CSS for subtle pulse */}
          <style>{`
            @keyframes subtlePulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.04); opacity: 0.85; }
            }
          `}</style>
          
          {/* Centered Headers - Always perfectly centered */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <Trophy className="w-10 h-10 md:w-12 md:h-12 text-black" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 max-w-[calc(100%-140px)] md:max-w-none mx-auto">
              How it works
            </h2>
            
          </div>
          
          <div className="text-center max-w-3xl mx-auto px-2">
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              
                Can you predict what's going to happen tomorrow and survive until Saturday?
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-left">
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <h4 className="font-bold mb-2 text-sm md:text-base">🎯 Daily Predictions</h4>
                <p className="text-xs md:text-sm text-gray-600">Make correct predictions each day to stay alive</p>
              </div>
              
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                <h4 className="font-bold mb-2 text-sm md:text-base">⚡ Get Eliminated?</h4>
                <p className="text-xs md:text-sm text-gray-600">Re-enter by paying today's entry fee</p>
              </div>
              
              <div className="bg-gray-50 p-3 md:p-4 rounded-lg sm:col-span-2 md:col-span-1">
                <h4 className="font-bold mb-2 text-sm md:text-base">🏆 Win Big</h4>
                <p className="text-xs md:text-sm text-gray-600">Survivors split the pot on Saturday</p>
              </div>
            </div>
          </div>
        </div>


        {/* Additional Options */}
        <div className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Other Options</h2>
            <Users className="w-6 h-6 text-black" />
          </div>
          
          {/* Mobile: Stack layout with Active Markets after Make Predictions */}
          <div className="md:hidden space-y-4">
            <button 
              onClick={() => setShowActiveMarkets(!showActiveMarkets)}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Make Predictions</h4>
              <p className="text-sm text-gray-600">Predict on markets you've already entered</p>
            </button>
            
            {/* User's Active Markets - Mobile: Show right after Make Predictions button */}
            {showActiveMarkets && isConnected && userPots.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Your Active Markets</h3>
                  <Trophy className="w-5 h-5 text-black" />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {userPots.map((contractAddress) => {
                    const marketType = CONTRACT_ADDRESSES[contractAddress as keyof typeof CONTRACT_ADDRESSES];
                    const marketName = marketType === 'featured' ? 'Featured Market' : 'Crypto Market';
                    
                    const handleMarketClick = () => {
                      Cookies.set('selectedMarket', contractAddress);
                      setActiveSection('bitcoinPot');
                    };
                    
                    return (
                      <button 
                        key={contractAddress}
                        onClick={handleMarketClick}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-green-800 text-sm">{marketName}</h4>
                            <p className="text-xs text-green-600">You're participating</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-green-500 text-xs">✓</div>
                            <ArrowRight className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Mobile: Show message if no active markets */}
            {showActiveMarkets && isConnected && userPots.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-3">You haven't entered any markets yet.</p>
                <button 
                  onClick={() => setActiveSection('bitcoinPot')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Enter a Market →
                </button>
              </div>
            )}
            
            {/* Mobile: Show connect wallet message */}
            {showActiveMarkets && !isConnected && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">Connect your wallet to see your active markets.</p>
              </div>
            )}
            
            <button 
              onClick={() => setActiveSection('createPot')}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Create Private Market</h4>
              <p className="text-sm text-gray-600">Deploy your own prediction market</p>
            </button>
            
            <button 
              onClick={() => setActiveSection('AI')}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Play Games</h4>
              <p className="text-sm text-gray-600">AI trivia and other games</p>
            </button>
          </div>

          {/* Desktop: Grid layout with Active Markets at bottom */}
          <div className="hidden md:block">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button 
                onClick={() => setShowActiveMarkets(!showActiveMarkets)}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                <h4 className="font-semibold mb-1">Make Predictions</h4>
                <p className="text-sm text-gray-600">Predict on markets you've already entered</p>
              </button>
              
              <button 
                onClick={() => setActiveSection('createPot')}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                <h4 className="font-semibold mb-1">Create Private Market</h4>
                <p className="text-sm text-gray-600">Deploy your own prediction market</p>
              </button>
              
              <button 
                onClick={() => setActiveSection('AI')}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                <h4 className="font-semibold mb-1">Play Games</h4>
                <p className="text-sm text-gray-600">AI trivia and other games</p>
              </button>
            </div>

            {/* User's Active Markets - Desktop: Show below all buttons */}
            {showActiveMarkets && isConnected && userPots.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Your Active Markets</h3>
                  <Trophy className="w-5 h-5 text-black" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userPots.map((contractAddress) => {
                    const marketType = CONTRACT_ADDRESSES[contractAddress as keyof typeof CONTRACT_ADDRESSES];
                    const marketName = marketType === 'featured' ? 'Featured Market' : 'Crypto Market';
                    
                    const handleMarketClick = () => {
                      Cookies.set('selectedMarket', contractAddress);
                      setActiveSection('bitcoinPot');
                    };
                    
                    return (
                      <button 
                        key={contractAddress}
                        onClick={handleMarketClick}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-green-800 text-sm">{marketName}</h4>
                            <p className="text-xs text-green-600">You're participating</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-green-500 text-xs">✓</div>
                            <ArrowRight className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Desktop: Show message if no active markets */}
            {showActiveMarkets && isConnected && userPots.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-3">You haven't entered any markets yet.</p>
                <button 
                  onClick={() => setActiveSection('bitcoinPot')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Enter a Market →
                </button>
              </div>
            )}
            
            {/* Desktop: Show connect wallet message */}
            {showActiveMarkets && !isConnected && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">Connect your wallet to see your active markets.</p>
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button 
            onClick={() => setActiveSection('home')}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;