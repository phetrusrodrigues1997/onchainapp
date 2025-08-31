'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Trophy, Users, Clock, ArrowRight, Wallet } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_TO_TABLE_MAPPING } from '../Database/config';
import { getPrice } from '../Constants/getPrice';

interface DashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  selectedMarket?: string;
}

// Use centralized contract mapping from config
const CONTRACT_ADDRESSES = CONTRACT_TO_TABLE_MAPPING;

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
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  
  const { address, isConnected } = useAccount();

  // Get ETH balance
  const ethBalance = useBalance({
    address,
    chainId: 8453
  });

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        setIsLoadingPrice(true);
        const price = await getPrice('ETH');
        setEthPrice(price);
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(4700); // Fallback price
        setIsLoadingPrice(false);
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle initial loading completion
  useEffect(() => {
    // Wait for price to load and wallet connection to be established
    if (!isLoadingPrice && (isConnected === false || (isConnected && ethBalance.isSuccess))) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500); // Small delay to ensure smooth transition
      
      return () => clearTimeout(timer);
    }
  }, [isLoadingPrice, isConnected, ethBalance.isSuccess]);

  // Check user participation in pots
  useEffect(() => {
    if (!isConnected || !address) {
      setUserPots([]);
    }
  }, [address, isConnected]);

  // Helper function to convert ETH to USD
  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

  // Check if user has sufficient balance (at least $0.01 USD worth of ETH)
  const hasInsufficientBalance = isConnected && ethBalance.data && ethToUsd(ethBalance.data.value) < 0.01;

  // Get contract addresses array
  const contractAddresses = Object.keys(CONTRACT_ADDRESSES) as Array<keyof typeof CONTRACT_ADDRESSES>;

  // Read participants from all contracts - hooks must be called at top level
  const { data: participants1 } = useReadContract({
    address: contractAddresses[0] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address }
  });

  const { data: participants2 } = useReadContract({
    address: contractAddresses[1] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address }
  });

  const participantsData = [participants1, participants2];

  // Set up the selected market address from cookie
  useEffect(() => {
    const savedMarket = Cookies.get('selectedMarket');
    if (savedMarket) {
      setSelectedMarketAddress(savedMarket);
    }
  }, []);

  // Check if user has the specific wallet address
  const SPECIAL_ADDRESS = '0xA90611B6AFcBdFa9DDFfCB2aa2014446297b6680';
  const isSpecialUser = address && address.toLowerCase() === SPECIAL_ADDRESS.toLowerCase();

  // Update userPots when participant data changes
  useEffect(() => {
    if (!isConnected || !address) return;

    const participatingPots: string[] = [];

    // Check all contracts
    participantsData.forEach((participants, index) => {
      if (participants && Array.isArray(participants)) {
        const isParticipant = participants.some(
          (participant: string) => participant.toLowerCase() === address.toLowerCase()
        );
        if (isParticipant) {
          participatingPots.push(contractAddresses[index]);
        }
      }
    });

    setUserPots(participatingPots);
  }, [participantsData, address, isConnected]);


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
      console.log('Selected pot address from cookie:', selectedMarketAddress);
      
      // Check if the selected market address exists in our CONTRACT_ADDRESSES
      if (selectedMarketAddress && selectedMarketAddress in CONTRACT_ADDRESSES) {
        const marketType = CONTRACT_ADDRESSES[selectedMarketAddress as keyof typeof CONTRACT_ADDRESSES];
        setMarketInfo({ 
          name: marketType === 'featured' ? 'Trending' : 'Crypto', 
          section: 'bitcoinPot',  // Both markets use the same section, PredictionPotTest handles the difference
          address: selectedMarketAddress 
        });
      } else {
        // Default to first market if no cookie or unknown address
        const defaultAddress = contractAddresses[0];
        setMarketInfo({ 
          name: 'Trending', 
          section: 'bitcoinPot',
          address: defaultAddress 
        });
      }
    };

    updateDashboard();
    getSelectedMarket();
    const interval = setInterval(updateDashboard, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);


  // Show loading screen while background processes complete
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Trophy className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Pots</h2>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-gray-500 text-sm mt-4">Fetching latest prices and pot data...</p>
        </div>
      </div>
    );
  }

  // If user has insufficient ETH balance, show funding message
  if (hasInsufficientBalance) {
    return (
      <div className="min-h-screen bg-white text-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center shadow-lg max-w-md">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Fund Your Account</h2>
              <p className="text-gray-600 mb-6">
                You need at least $0.01 worth of ETH to participate in prediction pots. 
                Current balance: <span className="font-semibold text-red-500">
                  ${ethBalance.data ? ethToUsd(ethBalance.data.value).toFixed(4) : '$0.00'}
                </span>
              </p>
              <button
                onClick={() => setActiveSection('buy')}
                className="w-full bg-purple-700 text-white px-6 py-3 rounded-lg hover:bg-black transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Let's fund your account →
              </button>
              <div className="mt-4">
                <button 
                  onClick={() => setActiveSection('home')}
                  className="text-sm text-gray-500 hover:text-black transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
  className="absolute top-4 right-4 md:top-6 md:right-6 bg-purple-700 text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg hover:bg-black transition-all duration-200 text-sm md:text-base font-medium shadow-lg hover:shadow-xl"
  style={{
    animation: 'subtlePulse 2s infinite'
  }}
>
  <span className="md:hidden">Enter →</span>
  <span className="hidden md:inline">Enter Pot →</span>
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
              <h4 className="font-semibold mb-1">My Pots</h4>
              <p className="text-sm text-gray-600">View pots you've already entered</p>
            </button>
            
            {/* User's Active Markets - Mobile: Show right after Make Predictions button */}
            {showActiveMarkets && isConnected && userPots.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Your Active Pots</h3>
                  <Trophy className="w-5 h-5 text-black" />
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {userPots.map((contractAddress) => {
                    const marketType = CONTRACT_ADDRESSES[contractAddress as keyof typeof CONTRACT_ADDRESSES];
                    const marketName = marketType === 'featured' ? 'Trending' : 'Crypto';
                    
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
                <p className="text-gray-600 mb-3">You haven't entered any pots yet.</p>
                <button 
                  onClick={() => setActiveSection('bitcoinPot')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Enter a Pot →
                </button>
              </div>
            )}
            
            {/* Mobile: Show connect wallet message */}
            {showActiveMarkets && !isConnected && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">Connect your wallet to see your active pots.</p>
              </div>
            )}
            
            <button 
              onClick={() => setActiveSection('createPot')}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Create Private Pot</h4>
              <p className="text-sm text-gray-600">Deploy your own prediction pot</p>
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
                <p className="text-sm text-gray-600">Predict on pots you've already entered</p>
              </button>
              
              <button 
                onClick={() => setActiveSection('createPot')}
                className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                <h4 className="font-semibold mb-1">Create Private Pot</h4>
                <p className="text-sm text-gray-600">Deploy your own prediction pot</p>
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
                  <h3 className="text-lg font-bold">Your Active Pots</h3>
                  <Trophy className="w-5 h-5 text-black" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userPots.map((contractAddress) => {
                    const marketType = CONTRACT_ADDRESSES[contractAddress as keyof typeof CONTRACT_ADDRESSES];
                    const marketName = marketType === 'featured' ? 'Trending' : 'Crypto';
                    
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
                <p className="text-gray-600 mb-3">You haven't entered any pots yet.</p>
                <button 
                  onClick={() => setActiveSection('bitcoinPot')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Enter a pot →
                </button>
              </div>
            )}
            
            {/* Desktop: Show connect wallet message */}
            {showActiveMarkets && !isConnected && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">Connect your wallet to see your active pots.</p>
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