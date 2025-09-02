'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Trophy, Users, Clock, ArrowRight, Wallet } from 'lucide-react';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Cookies from 'js-cookie';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_TO_TABLE_MAPPING } from '../Database/config';
import { getPrice } from '../Constants/getPrice';
import { getPredictionPercentages } from '../Database/actions';
import { getHourlyPredictionData } from '../Database/actions3';

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
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('Tomorrow\'s Predictions');
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hourlyData, setHourlyData] = useState<Array<{
    time: string;
    positivePercentage: number;
    negativePercentage: number;
    totalPredictions: number;
  }>>([
    { time: '12am', positivePercentage: 50, negativePercentage: 50, totalPredictions: 0 },
  ]);
  
  const { address, isConnected } = useAccount();

  // Detect screen size for responsive circle sizing
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Load hourly prediction data for the selected market
  useEffect(() => {
    const loadHourlyData = async () => {
      try {
        if (marketInfo.address) {
          // Determine market type based on contract address (same logic as LandingPage)
          const marketType = CONTRACT_TO_TABLE_MAPPING[marketInfo.address as keyof typeof CONTRACT_TO_TABLE_MAPPING];
          let marketId = '';
          
          if (marketType === 'featured') {
            marketId = 'Trending';
          } else if (marketType === 'crypto') {
            marketId = 'Crypto';
          }
          
          if (marketId) {
            console.log('📊 Loading hourly prediction data for market:', marketId, 'tableType:', marketType);
            const data = await getHourlyPredictionData(marketId, marketType);
            setHourlyData(data);
            console.log('📊 Loaded hourly prediction data:', data);
          }
        }
      } catch (error) {
        console.error('Error loading hourly prediction data:', error);
        // Keep default data on error
      }
    };

    loadHourlyData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadHourlyData, 30000);
    return () => clearInterval(interval);
  }, [marketInfo.address]);

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

  // Set up the selected market address and question from cookies
  useEffect(() => {
    const savedMarket = Cookies.get('selectedMarket');
    if (savedMarket) {
      setSelectedMarketAddress(savedMarket);
    }
    
    const savedQuestion = Cookies.get('selectedMarketQuestion');
    if (savedQuestion) {
      setSelectedQuestion(savedQuestion);
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
      const fees = ['0.01', '0.02', '0.04', '0.08', '0.16', '0.32', '0.01'];
      
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
    <div className="min-h-screen bg-white text-black">
      <div className="px-6 md:px-6">
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

        </div> {/* Close max-w-4xl container */}
      </div> {/* Close px-6 container */}
      
        {/* Elimination Market Explanation - Full width on mobile */}
        <div className="border-0 md:border md:border-gray-200 md:rounded-lg p-0 md:p-8 mb-8 relative md:max-w-4xl md:mx-auto md:px-6">
          {/* Enter Market Button - Desktop only, positioned absolutely in top right */}
          <button
  onClick={() => setActiveSection(marketInfo.section)}
  className="hidden md:block absolute top-6 right-6 bg-purple-700 text-white px-5 py-2.5 rounded-lg hover:bg-black transition-all duration-200 text-base font-medium shadow-lg hover:shadow-xl"
  style={{
    animation: 'subtlePulse 2s infinite'
  }}
>
  Enter Pot →
</button>

          
          {/* Custom CSS for subtle pulse */}
          <style>{`
            @keyframes subtlePulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.04); opacity: 0.85; }
            }
            @keyframes staticPulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.1); }
            }
          `}</style>
          
          {/* Left-aligned Question Header */}
          <div className="text-left mb-8 px-6 md:px-0">
            <h2 className="text-lg md:text-xl font-bold mb-6 pr-4 md:pr-32 leading-relaxed">
              {selectedQuestion}
            </h2>
            
            {/* Timeline Chart */}
            <div className="w-full md:max-w-6xl md:mx-auto px-0 md:px-3">
              {/* SVG Line Chart */}
              <div className="bg-white rounded-none md:rounded-lg p-1 md:p-6 mb-4 relative">
                <svg
                  viewBox="0 0 400 300"
                  className="w-full h-96 md:h-72 lg:h-80"
                  style={{ minHeight: '350px' }}
                >
                  {/* Top-left Legend - Horizontal Layout */}
                  <g>
                    {/* Yes percentage with green dot */}
                    <circle cx="15" cy="20" r="5" fill="#10b981" />
                    <text x="28" y="24" fontSize="14" fill="#666" fontWeight="600">
                      Yes {hourlyData[hourlyData.length - 1]?.positivePercentage || 50}%
                    </text>
                    
                    {/* No percentage with blue dot - positioned horizontally */}
                    <circle cx="110" cy="20" r="5" fill="#3b82f6" />
                    <text x="123" y="24" fontSize="14" fill="#666" fontWeight="600">
                      No {hourlyData[hourlyData.length - 1]?.negativePercentage || 50}%
                    </text>
                  </g>

                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <line
                      key={y}
                      x1="40"
                      y1={240 - (y * 1.8)}
                      x2="380"
                      y2={240 - (y * 1.8)}
                      stroke="#f0f0f0"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Y-axis labels - Positioned within viewBox */}
                  {[0, 25, 50, 75, 100].map((y) => (
                    <text
                      key={y}
                      x="395"
                      y={245 - (y * 1.8)}
                      fontSize="13"
                      fill="#666"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {y}%
                    </text>
                  ))}
                  
                  {/* X-axis labels - Always show full timeline every 3 hours */}
                  {['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'].map((timeLabel, index) => (
                    <text
                      key={timeLabel}
                      x={50 + (index * 47.14)} // 330 / 7 spaces = ~47.14 units apart
                      y="275"
                      fontSize="13"
                      fill="#666"
                      textAnchor="middle"
                      fontWeight="500"
                    >
                      {timeLabel}
                    </text>
                  ))}
                  
                  {/* Yes (Positive) Line - Green */}
                  {hourlyData.length > 1 && (
                    <path
                      d={hourlyData.map((point, index) => {
                        // Map time to x-axis position
                        const timeMap: Record<string, number> = {
                          '12am': 0, '3am': 1, '6am': 2, '9am': 3, '12pm': 4, '3pm': 5, '6pm': 6, '9pm': 7
                        };
                        const xIndex = timeMap[point.time] || 0;
                        const x = 50 + (xIndex * 47.14);
                        // Add slight upward offset (+2 pixels) to Yes line
                        const y = 240 - (point.positivePercentage * 1.8) - 2;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  
                  {/* No (Negative) Line - Blue */}
                  {hourlyData.length > 1 && (
                    <path
                      d={hourlyData.map((point, index) => {
                        // Map time to x-axis position
                        const timeMap: Record<string, number> = {
                          '12am': 0, '3am': 1, '6am': 2, '9am': 3, '12pm': 4, '3pm': 5, '6pm': 6, '9pm': 7
                        };
                        const xIndex = timeMap[point.time] || 0;
                        const x = 50 + (xIndex * 47.14);
                        // Add slight downward offset (+2 pixels) to No line  
                        const y = 240 - (point.negativePercentage * 1.8) + 2;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  
                  {/* Tip circle - Green (Yes) - Only at the end of the line with pulse animation */}
                  {hourlyData.length > 0 && (() => {
                    const lastPoint = hourlyData[hourlyData.length - 1];
                    const timeMap: Record<string, number> = {
                      '12am': 0, '3am': 1, '6am': 2, '9am': 3, '12pm': 4, '3pm': 5, '6pm': 6, '9pm': 7
                    };
                    const xIndex = timeMap[lastPoint.time] || 0;
                    const x = 50 + (xIndex * 47.14);
                    const y = 240 - (lastPoint.positivePercentage * 1.8) - 2;
                    
                    // Responsive circle sizing
                    const baseRadius = isMobile ? 4.5 : 3.5;
                    const maxRadius = isMobile ? 6 : 5;
                    const strokeWidth = isMobile ? 2 : 1.5;
                    
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        r={baseRadius}
                        fill="#10b981"
                        stroke="white"
                        strokeWidth={strokeWidth}
                        className="tip-circle"
                      >
                        <animate
                          attributeName="opacity"
                          values="1;0.6;1"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="r"
                          values={`${baseRadius};${maxRadius};${baseRadius}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    );
                  })()}
                  
                  {/* Tip circle - Blue (No) - Only at the end of the line with pulse animation */}
                  {hourlyData.length > 0 && (() => {
                    const lastPoint = hourlyData[hourlyData.length - 1];
                    const timeMap: Record<string, number> = {
                      '12am': 0, '3am': 1, '6am': 2, '9am': 3, '12pm': 4, '3pm': 5, '6pm': 6, '9pm': 7
                    };
                    const xIndex = timeMap[lastPoint.time] || 0;
                    const x = 50 + (xIndex * 47.14);
                    const y = 240 - (lastPoint.negativePercentage * 1.8) + 2;
                    
                    // Responsive circle sizing
                    const baseRadius = isMobile ? 4.5 : 3.5;
                    const maxRadius = isMobile ? 6 : 5;
                    const strokeWidth = isMobile ? 2 : 1.5;
                    
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        r={baseRadius}
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth={strokeWidth}
                        className="tip-circle"
                      >
                        <animate
                          attributeName="opacity"
                          values="1;0.6;1"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="r"
                          values={`${baseRadius};${maxRadius};${baseRadius}`}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    );
                  })()}
                </svg>
              </div>
              
              
              {/* Mobile Enter Button - Below chart */}
              <div className="block md:hidden text-center mb-8">
                <button
                  onClick={() => setActiveSection(marketInfo.section)}
                  className="bg-purple-700 text-white px-6 py-3 rounded-lg hover:bg-black transition-all duration-200 text-base font-medium shadow-lg hover:shadow-xl"
                  style={{
                    animation: 'subtlePulse 2s infinite'
                  }}
                >
                  Enter Pot →
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="px-6 md:px-6">
        <div className="max-w-4xl mx-auto">
        {/* Rules Summary Dropdown */}
        <div className="border border-gray-300 rounded-lg overflow-hidden mb-8">
          <button
            onClick={() => setIsRulesOpen(!isRulesOpen)}
            className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center"
          >
            <span className="text-black font-semibold pr-4">Rules Summary - How it works</span>
            {isRulesOpen ? (
              <FaChevronUp className="text-gray-600 flex-shrink-0" />
            ) : (
              <FaChevronDown className="text-gray-600 flex-shrink-0" />
            )}
          </button>
          
          {isRulesOpen && (
            <div className="px-6 py-4 bg-white border-t border-gray-300">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                <p className="text-gray-600 mb-6 text-sm md:text-base">
                  Can you predict what's going to happen tomorrow and survive until Saturday?
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-left">
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-bold mb-2 text-sm md:text-base">Daily Predictions</h4>
                    <p className="text-xs md:text-sm text-gray-600">Make correct predictions each day to stay alive</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-bold mb-2 text-sm md:text-base">Get Eliminated?</h4>
                    <p className="text-xs md:text-sm text-gray-600">Re-enter by paying today's entry fee</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg sm:col-span-2 md:col-span-1">
                    <h4 className="font-bold mb-2 text-sm md:text-base">Win Big</h4>
                    <p className="text-xs md:text-sm text-gray-600">Survivors split the pot on Saturday</p>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        </div> {/* Close max-w-4xl container */}
      </div> {/* Close px-6 container */}
    </div>
  );
};

export default Dashboard;