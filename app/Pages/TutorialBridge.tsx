'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, DollarSign, TrendingUp, Trophy, Users, Clock, ArrowRight, Wallet } from 'lucide-react';
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import Cookies from 'js-cookie';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_TO_TABLE_MAPPING, getMarketDisplayName } from '../Database/config';
import { getPrice } from '../Constants/getPrice';
import { getPredictionPercentages } from '../Database/actions';
import { getHourlyPredictionData } from '../Database/actions3';
import ResponsiveLogo from '../Sections/ResponsiveLogo';

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
  const [weeklyScheduleOpen, setWeeklyScheduleOpen] = useState(false);
  const [entryFeesOpen, setEntryFeesOpen] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('Tomorrow\'s Predictions');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hourlyData, setHourlyData] = useState<Array<{
    time: string;
    positivePercentage: number;
    negativePercentage: number;
    totalPredictions: number;
  }>>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    percentage: number;
    type: 'yes' | 'no';
    time: string;
  } | null>(null);
  const [potBalance, setPotBalance] = useState<string>('');
  
  // Random line display state - generate on component mount
  const [lineDisplay, setLineDisplay] = useState<'yes' | 'no' | 'both'>('both');
  
  const { address, isConnected } = useAccount();

  // Generate random line display on component mount
  useEffect(() => {
    const randomNum = Math.floor(Math.random() * 9); // 0-8 (9 numbers for equal 3-way split)
    
    if (randomNum >= 0 && randomNum <= 2) {
      setLineDisplay('yes'); // 33.3% chance (0, 1, 2)
    } else if (randomNum >= 3 && randomNum <= 5) {
      setLineDisplay('no');  // 33.3% chance (3, 4, 5)
    } else {
      setLineDisplay('both'); // 33.3% chance (6, 7, 8)
    }
  }, []);

  // Detect screen size for responsive circle sizing
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


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
    if (!isLoadingPrice) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500); // Small delay to ensure smooth transition
      
      return () => clearTimeout(timer);
    }
  }, [isLoadingPrice, isConnected]);

  // Load hourly prediction data for the selected market
  useEffect(() => {
    const loadHourlyData = async () => {
      try {
        if (marketInfo.address) {
          // Determine market type based on contract address (same logic as LandingPage)
          const marketType = CONTRACT_TO_TABLE_MAPPING[marketInfo.address as keyof typeof CONTRACT_TO_TABLE_MAPPING];
          const marketId = getMarketDisplayName(marketType);
          
          if (marketId) {
            const data = await getHourlyPredictionData(marketId, marketType);
            setHourlyData(data);
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

  const participantsData = useMemo(() => [participants1, participants2], [participants1, participants2]);

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
    
    const savedIcon = Cookies.get('selectedMarketIcon');
    if (savedIcon) {
      setSelectedIcon(savedIcon);
    }
    
    // Load pot balance from cookies
    const savedPotBalances = Cookies.get('potBalances');
    if (savedPotBalances) {
      try {
        const potBalances = JSON.parse(savedPotBalances);
        const marketType = CONTRACT_TO_TABLE_MAPPING[savedMarket as keyof typeof CONTRACT_TO_TABLE_MAPPING];
        const marketName = getMarketDisplayName(marketType);
        if (potBalances[marketName]) {
          setPotBalance(potBalances[marketName]);
        }
      } catch (error) {
        console.error('Error parsing pot balances from cookies:', error);
      }
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
      const fees = ['0.01', '0.01', '0.01', '0.01', '0.01', '0.01', '0.01'];
      
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

    updateDashboard();
    const interval = setInterval(updateDashboard, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Get selected market from cookie - separate useEffect to avoid infinite loops
  useEffect(() => {
    const getSelectedMarket = () => {
      const selectedMarketAddress = Cookies.get('selectedMarket');
      console.log('Selected pot address from cookie:', selectedMarketAddress);
      
      // Check if the selected market address exists in our CONTRACT_ADDRESSES
      if (selectedMarketAddress && selectedMarketAddress in CONTRACT_ADDRESSES) {
        const marketType = CONTRACT_ADDRESSES[selectedMarketAddress as keyof typeof CONTRACT_ADDRESSES];
        setMarketInfo({ 
          name: getMarketDisplayName(marketType), 
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

    getSelectedMarket();
  }, []); // Only run once on mount


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


  return (
    <div className="min-h-screen bg-white text-black w-full overflow-x-hidden mt-8">
      <div className="w-full sm:max-w-5xl sm:mx-auto p-0 sm:p-6">
    
        {/* Desktop Two-Column Layout */}
        <div className="hidden md:flex md:gap-8 bg-white rounded-xl">
          {/* Left Column - Question and Chart */}
          <div className="md:flex-1 md:p-6">
            {/* Question Header */}
            <div className="flex items-center gap-3 mb-6">
              {/* Market Icon */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {selectedIcon?.slice(0, 4) === 'http' ? (
                    <img 
                      src={selectedIcon} 
                      alt="Market Icon" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-2xl">{selectedIcon || '📊'}</span>
                  )}
                </div>
              </div>
              
              {/* Question Text */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                  {selectedQuestion.replace(/\?$/, '')} <span>tomorrow?</span>
                </h1>
                {potBalance && (
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-700 text-base">{potBalance}</span> in pot 
                  </div>
                )}
              </div>
            </div>
            
            {/* Chart Container */}
            <div className="bg-white rounded-lg relative w-full">
              {/* Chart Legend */}
              <div className="flex items-center gap-6 mb-4 px-4">
                {(lineDisplay === 'yes' || lineDisplay === 'both') && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">
                      Yes {hourlyData.length > 0 ? (hourlyData[hourlyData.length - 1]?.positivePercentage ?? 50) : 50}%
                    </span>
                  </div>
                )}
                {(lineDisplay === 'no' || lineDisplay === 'both') && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">
                      No {hourlyData.length > 0 ? (hourlyData[hourlyData.length - 1]?.negativePercentage ?? 50) : 50}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <svg
                  viewBox="0 0 100 50"
                  className="w-full h-64"
                  preserveAspectRatio="none"
                  >

                  {/* Grid lines - Percentage based */}
                  {[0, 20, 40, 60, 80, 100].map((y) => {
                    const yPos = 45 - (y * 0.4); // Scale from 0-100% to 45-5 (inverted)
                    return (
                      <line
                        key={y}
                        x1="5"
                        y1={yPos}
                        x2="95"
                        y2={yPos}
                        stroke="#e0e0e0"
                        strokeWidth="0.1"
                        strokeDasharray="0.5 1"
                      />
                    );
                  })}
                  
                  
                  {/* Yes (Positive) Line - Green */}
                  {hourlyData.length > 1 && (lineDisplay === 'yes' || lineDisplay === 'both') && (
                    <>
                      <path
                        d={hourlyData.map((point, index) => {
                          // Map time to x-axis position using percentage coordinates
                          const timeMap: Record<string, number> = {
                            '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                          };
                          const xIndex = timeMap[point.time] || 0;
                          const x = 5 + (xIndex * 7.5); // Same spacing as x-axis labels
                          // Convert percentage to y position (inverted: 45 = 0%, 5 = 100%)
                          const y = 45 - (point.positivePercentage * 0.4) - 0.2; // Slight offset up
                          
                          if (index === 0) {
                            return `M ${x} ${y}`;
                          } else {
                            const prevPoint = hourlyData[index - 1];
                            const prevY = 45 - (prevPoint.positivePercentage * 0.4) - 0.2;
                            // Step-based movement: horizontal first, then vertical
                            return `L ${x} ${prevY} L ${x} ${y}`;
                          }
                        }).join(' ')}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="0.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Large invisible hover areas for Yes line */}
                      {hourlyData.map((point, index) => {
                        const timeMap: Record<string, number> = {
                          '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                        };
                        const xIndex = timeMap[point.time] || 0;
                        const x = isMobile ? 60 + (xIndex * 32) : 70 + (xIndex * 40);
                        const baseY = isMobile ? 320 : 240;
                        const scale = isMobile ? 2.6 : 1.8;
                        const y = baseY - (point.positivePercentage * scale) - 2;
                        
                        return (
                          <circle
                            key={`yes-hover-${index}`}
                            cx={x}
                            cy={y}
                            r="1.5" // Scaled for percentage coordinates
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({
                              x,
                              y: y - 1.5,
                              percentage: point.positivePercentage,
                              type: 'yes',
                              time: point.time
                            })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                      
                      {/* Hover zones along Yes line segments for better sensitivity */}
                      {hourlyData.map((point, index) => {
                        if (index === 0) return null;
                        
                        const timeMap: Record<string, number> = {
                          '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                        };
                        const xIndex = timeMap[point.time] || 0;
                        const x = isMobile ? 60 + (xIndex * 32) : 70 + (xIndex * 40);
                        const baseY = isMobile ? 320 : 240;
                        const scale = isMobile ? 2.6 : 1.8;
                        const y = baseY - (point.positivePercentage * scale) - 2;
                        
                        const prevPoint = hourlyData[index - 1];
                        const prevXIndex = timeMap[prevPoint.time] || 0;
                        const prevX = isMobile ? 60 + (prevXIndex * 32) : 70 + (prevXIndex * 40);
                        const prevY = baseY - (prevPoint.positivePercentage * scale) - 2;
                        
                        return (
                          <g key={`yes-segment-${index}`}>
                            {/* Horizontal segment */}
                            <line
                              x1={prevX}
                              y1={prevY}
                              x2={x}
                              y2={prevY}
                              stroke="transparent"
                              strokeWidth="1.2"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint({
                                x: (prevX + x) / 2,
                                y: prevY - 1.5,
                                percentage: prevPoint.positivePercentage,
                                type: 'yes',
                                time: prevPoint.time
                              })}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            {/* Vertical segment */}
                            <line
                              x1={x}
                              y1={prevY}
                              x2={x}
                              y2={y}
                              stroke="transparent"
                              strokeWidth="1.2"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint({
                                x,
                                y: Math.min(prevY, y) - 1.5,
                                percentage: point.positivePercentage,
                                type: 'yes',
                                time: point.time
                              })}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        );
                      })}
                    </>
                  )}
                  
                  {/* No (Negative) Line - Blue */}
                  {hourlyData.length > 1 && (lineDisplay === 'no' || lineDisplay === 'both') && (
                    <>
                      <path
                        d={hourlyData.map((point, index) => {
                          // Map time to x-axis position (2-hour intervals)
                          const timeMap: Record<string, number> = {
                            '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                          };
                          const xIndex = timeMap[point.time] || 0;
                          const x = 5 + (xIndex * 7.5); // Same spacing as x-axis labels
                          // Add slight downward offset to No line
                          const y = 45 - (point.negativePercentage * 0.4) + 0.2; // Slight offset down
                          
                          if (index === 0) {
                            return `M ${x} ${y}`;
                          } else {
                            const prevPoint = hourlyData[index - 1];
                            const prevY = 45 - (prevPoint.negativePercentage * 0.4) + 0.2;
                            // Step-based movement: horizontal first, then vertical
                            return `L ${x} ${prevY} L ${x} ${y}`;
                          }
                        }).join(' ')}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="0.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Large invisible hover areas for No line */}
                      {hourlyData.map((point, index) => {
                        const timeMap: Record<string, number> = {
                          '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                        };
                        const xIndex = timeMap[point.time] || 0;
                        const x = 5 + (xIndex * 7.5); // Same spacing as x-axis labels
                        const y = 45 - (point.negativePercentage * 0.4) + 0.2; // Slight offset down
                        
                        return (
                          <circle
                            key={`no-hover-${index}`}
                            cx={x}
                            cy={y}
                            r="1.5" // Scaled for percentage coordinates
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({
                              x,
                              y: y - 1.5,
                              percentage: point.negativePercentage,
                              type: 'no',
                              time: point.time
                            })}
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        );
                      })}
                      
                      {/* Hover zones along No line segments for better sensitivity */}
                      {hourlyData.map((point, index) => {
                        if (index === 0) return null;
                        
                        const timeMap: Record<string, number> = {
                          '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                        };
                        const xIndex = timeMap[point.time] || 0;
                        const x = 5 + (xIndex * 7.5); // Same spacing as x-axis labels
                        const y = 45 - (point.negativePercentage * 0.4) + 0.2; // Slight offset down
                        
                        const prevPoint = hourlyData[index - 1];
                        const prevXIndex = timeMap[prevPoint.time] || 0;
                        const prevX = 5 + (prevXIndex * 7.5);
                        const prevY = 45 - (prevPoint.negativePercentage * 0.4) + 0.2;
                        
                        return (
                          <g key={`no-segment-${index}`}>
                            {/* Horizontal segment */}
                            <line
                              x1={prevX}
                              y1={prevY}
                              x2={x}
                              y2={prevY}
                              stroke="transparent"
                              strokeWidth="1.2"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint({
                                x: (prevX + x) / 2,
                                y: prevY - 1.5,
                                percentage: prevPoint.negativePercentage,
                                type: 'no',
                                time: prevPoint.time
                              })}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                            {/* Vertical segment */}
                            <line
                              x1={x}
                              y1={prevY}
                              x2={x}
                              y2={y}
                              stroke="transparent"
                              strokeWidth="1.2"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPoint({
                                x,
                                y: Math.min(prevY, y) - 1.5,
                                percentage: point.negativePercentage,
                                type: 'no',
                                time: point.time
                              })}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        );
                      })}
                    </>
                  )}
                  
                  {/* Tip circle - Green (Yes) - Only at the end of the line with pulse animation */}
                  {hourlyData.length > 0 && (lineDisplay === 'yes' || lineDisplay === 'both') && (() => {
                    const lastPoint = hourlyData[hourlyData.length - 1];
                    const timeMap: Record<string, number> = {
                      '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                    };
                    const xIndex = timeMap[lastPoint.time] || 0;
                    const x = 5 + (xIndex * 7.5); // Same spacing as x-axis labels
                    const y = 45 - (lastPoint.positivePercentage * 0.4) - 0.2; // Slight offset up
                    
                    // Circle sizing for percentage coordinates
                    const baseRadius = 0.5;
                    const maxRadius = 0.7;
                    const strokeWidth = 0.08;
                    
                    return (
                      <circle
                        cx={x}
                        cy={y}
                        r={baseRadius}
                        fill="#a855f7"
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
                  {hourlyData.length > 0 && (lineDisplay === 'no' || lineDisplay === 'both') && (() => {
                    const lastPoint = hourlyData[hourlyData.length - 1];
                    const timeMap: Record<string, number> = {
                      '12am': 0, '2am': 1, '4am': 2, '6am': 3, '8am': 4, '10am': 5, '12pm': 6, '2pm': 7, '4pm': 8, '6pm': 9, '8pm': 10, '10pm': 11
                    };
                    const xIndex = timeMap[lastPoint.time] || 0;
                    const x = 5 + (xIndex * 7.5); // Same spacing as x-axis labels
                    const y = 45 - (lastPoint.negativePercentage * 0.4) + 0.2; // Slight offset down
                    
                    // Circle sizing for percentage coordinates
                    const baseRadius = 0.5;
                    const maxRadius = 0.7;
                    const strokeWidth = 0.08;
                    
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
                  
                  {/* Sleek hover tooltip */}
                  {hoveredPoint && (
                    <g>
                      {/* Tooltip background */}
                      <rect
                        x={hoveredPoint.x - 2.5}
                        y={hoveredPoint.y - 1.2}
                        width="5"
                        height="2.4"
                        fill="rgba(0, 0, 0, 0.8)"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="0.1"
                        rx="0.6"
                        ry="0.6"
                      />
                      {/* Tooltip text */}
                      <text
                        x={hoveredPoint.x}
                        y={hoveredPoint.y + 2}
                        fill="white"
                        fontSize="1.1"
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        {hoveredPoint.percentage}%
                      </text>
                      {/* Small indicator dot */}
                      <circle
                        cx={hoveredPoint.x}
                        cy={hoveredPoint.y + 1.5}
                        r="0.2"
                        fill={hoveredPoint.type === 'yes' ? '#a855f7' : '#3b82f6'}
                      />
                    </g>
                  )}
              </svg>
              
              {/* Y-axis labels - HTML overlay */}
              {[0, 20, 40, 60, 80, 100].map((y) => {
                // Match the exact grid line calculation: 45 - (y * 0.4)
                const svgY = 45 - (y * 0.4);
                const percentage = svgY / 50; // Convert SVG coordinate to percentage (viewBox height is 50)
                const topPosition = `${percentage * 100}%`;
                return (
                  <div
                    key={y}
                    className={`absolute right-1 text-xs font-medium text-gray-600 opacity-60 ${y === 0 ? 'invisible' : ''}`}
                    style={{ 
                      top: topPosition,
                      transform: 'translateY(-50%)'
                    }}
                  >
                    {y}%
                  </div>
                );
              })}
              
              {/* X-axis labels - HTML overlay */}
              <div className="flex justify-between px-2 mt-1">
                {['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'].map((timeLabel) => (
                  <span 
                    key={timeLabel} 
                    className={`text-xs font-medium text-gray-600 opacity-60 ${timeLabel === '12am' || timeLabel === '10pm' ? 'invisible' : ''}`}
                  >
                    {timeLabel}
                  </span>
                ))}
              </div>
              
              
              </div>
              
            </div>
          </div>

          {/* Right Column - Rules and Actions */}
          <div className="md:w-80 md:p-6 md:bg-white md:rounded-r-xl md:shadow-sm md:shadow-white/50">
            {/* View Pot Button */}
            <div className="mb-6">
              <button
                onClick={() => setActiveSection(marketInfo.section)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
              >
                <Wallet className="w-5 h-5" />
                View Pot
              </button>
            </div>

            {/* Rules Summary - Always Expanded on Desktop */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <span className="text-black font-semibold">How it works</span>
              </div>
              
              <div className="px-6 py-4 bg-white">
                <p className="text-gray-600 mb-4 text-sm">
                  Can you predict what's going to happen tomorrow and survive until Saturday?
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold mb-1 text-sm">Daily Predictions</h4>
                    <p className="text-xs text-gray-600">Make correct predictions each day to stay alive</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold mb-1 text-sm">Get Eliminated?</h4>
                    <p className="text-xs text-gray-600">Re-enter by paying today's entry fee</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold mb-1 text-sm">Win Big</h4>
                    <p className="text-xs text-gray-600">Survivors split the pot on Saturday</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <button 
                onClick={() => setActiveSection('home')}
                className="text-sm text-gray-500 hover:text-black transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Keep Original Design */}
        <div className="md:hidden bg-white rounded-none sm:rounded-xl">
          <div className="p-0 sm:p-4 md:p-6">
            {/* Question Header - Compact on mobile */}
            <div className="flex items-center gap-3 mb-6 sm:mb-3 pl-2 pr-4 sm:px-0">
              {/* Market Icon - Smaller on mobile */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {selectedIcon?.slice(0, 4) === 'http' ? (
                    <img 
                      src={selectedIcon} 
                      alt="Market Icon" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-lg sm:text-xl">{selectedIcon || '📊'}</span>
                  )}
                </div>
              </div>
              
              {/* Question Text and Actions */}
              <div className="flex-1 min-w-0 md:mr-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                  {selectedQuestion.replace(/\?$/, '')} <span>tomorrow?</span>
                </h1>
              </div>
            </div>
            
            {/* Chart Container - Mobile */}
            <div className="bg-white rounded-none sm:rounded-lg p-0 sm:p-4 relative w-full">
              {/* Chart Legend - Mobile */}
              <div className="flex items-center gap-3 mb-4 px-2 sm:px-0">
                {(lineDisplay === 'yes' || lineDisplay === 'both') && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">
                      Yes {hourlyData.length > 0 ? (hourlyData[hourlyData.length - 1]?.positivePercentage ?? 50) : 50}%
                    </span>
                  </div>
                )}
                {(lineDisplay === 'no' || lineDisplay === 'both') && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-700">
                      No {hourlyData.length > 0 ? (hourlyData[hourlyData.length - 1]?.negativePercentage ?? 50) : 50}%
                    </span>
                  </div>
                )}
              </div>
                
              <div className="relative">
                <svg
                  viewBox="0 0 100 50"
                  className="w-full h-48"
                  preserveAspectRatio="none"
                  >
                  {/* All the same SVG content as desktop - Grid lines, paths, etc. */}
                  {[0, 20, 40, 60, 80, 100].map((y) => {
                    const yPos = 45 - (y * 0.4);
                    return (
                      <line
                        key={y}
                        x1="5"
                        y1={yPos}
                        x2="95"
                        y2={yPos}
                        stroke="#e0e0e0"
                        strokeWidth="0.1"
                        strokeDasharray="0.5 1"
                      />
                    );
                  })}
                  {/* Removed - using desktop chart content */}
                </svg>
                
                {/* Y-axis labels - Mobile */}
                {[0, 20, 40, 60, 80, 100].map((y) => {
                  const svgY = 45 - (y * 0.4);
                  const percentage = svgY / 50;
                  const topPosition = `${percentage * 100}%`;
                  return (
                    <div
                      key={y}
                      className={`absolute right-1 text-xs font-medium text-gray-600 opacity-60 ${y === 0 ? 'invisible' : ''}`}
                      style={{ 
                        top: topPosition,
                        transform: 'translateY(-50%)'
                      }}
                    >
                      {y}%
                    </div>
                  );
                })}
                
                {/* X-axis labels - Mobile */}
                <div className="flex justify-between px-2 mt-1">
                  {['12am', '2am', '4am', '6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'].map((timeLabel) => (
                    <span 
                      key={timeLabel} 
                      className={`text-xs font-medium text-gray-600 opacity-60 ${timeLabel === '12am' || timeLabel === '10pm' ? 'invisible' : ''}`}
                    >
                      {timeLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Pot Balance */}
          {potBalance && (
            <div className="mt-2 px-4">
              <div className="text-sm text-gray-600 text-left opacity-60">
                <span className="text-gray-700 text-base">{potBalance}</span> in pot 
              </div>
            </div>
          )}

          {/* Mobile View Pot Button */}
          <div className="mb-6 px-4 mt-8">
            <button
              onClick={() => setActiveSection(marketInfo.section)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
            >
              <Wallet className="w-4 h-4" />
              View Pot
            </button>
          </div>

          {/* Mobile Rules Summary Dropdown */}
          <div className="bg-white rounded-none sm:rounded-xl shadow-sm border-0 sm:border border-gray-200 overflow-hidden mb-4 sm:mb-8">
            <button
              onClick={() => setIsRulesOpen(!isRulesOpen)}
              className="w-full px-4 sm:px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex justify-between items-center"
            >
              <span className="text-black font-semibold pr-4">Rules Summary - How it works</span>
              {isRulesOpen ? (
                <FaChevronUp className="text-gray-600 flex-shrink-0" />
              ) : (
                <FaChevronDown className="text-gray-600 flex-shrink-0" />
              )}
            </button>
            
            {isRulesOpen && (
              <div className="px-6 py-4 bg-white border-t border-gray-200">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 mb-6 text-sm">
                    Can you predict what's going to happen tomorrow and survive until Saturday?
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-bold mb-2 text-sm">Daily Predictions</h4>
                      <p className="text-xs text-gray-600">Make correct predictions each day to stay alive</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-bold mb-2 text-sm">Get Eliminated?</h4>
                      <p className="text-xs text-gray-600">Re-enter by paying today's entry fee</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-bold mb-2 text-sm">Win Big</h4>
                      <p className="text-xs text-gray-600">Survivors split the pot on Saturday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Back to Home */}
          <div className="text-center mb-8">
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
  );
};

export default Dashboard;