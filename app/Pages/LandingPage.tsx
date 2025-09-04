'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { formatUnits } from 'viem';
import { ArrowRight, Bookmark, Check } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getMarkets, Market } from '../Constants/markets';
import { CustomAlert, useCustomAlert } from '../Components/CustomAlert';
import { addBookmark, removeBookmark, isMarketBookmarked, getPredictionPercentages, getTomorrowsBet, placeBitcoinBet } from '../Database/actions';
import { CONTRACT_TO_TABLE_MAPPING, getMarketDisplayName } from '../Database/config';
import { getPrice } from '../Constants/getPrice';
import { useContractData } from '../hooks/useContractData';
import { useCountdownTimer } from '../hooks/useCountdownTimer';

// Types for prediction data
interface TodaysBet {
  id: number;
  walletAddress: string;
  prediction: string;
  betDate: string;
  createdAt: Date;
}

type TableType = typeof CONTRACT_TO_TABLE_MAPPING[keyof typeof CONTRACT_TO_TABLE_MAPPING];

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isMobileSearchActive?: boolean;
  searchQuery?: string;
  selectedMarket?: string;
  setSelectedMarket?: (market: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

// Helper function to get contract address from markets data
const getContractAddress = (marketId: string): string | null => {
  const marketOptions = getMarkets(getTranslation('en'), 'options');
  const market = marketOptions.find(m => m.id === marketId || m.name === marketId);
  return market?.contractAddress || null;
};

const LandingPage = ({ activeSection, setActiveSection, isMobileSearchActive = false, searchQuery = '', selectedMarket: propSelectedMarket = 'Trending', setSelectedMarket, onLoadingChange }: LandingPageProps) => {
  const { contractAddresses, participantsData, balancesData, isConnected, address } = useContractData();
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const selectedMarket = propSelectedMarket;
  const { alertState, showAlert, closeAlert } = useCustomAlert();
  const availableMarkets = ["random topics", "crypto", "stocks"];
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation state for selected market
  const [animatingMarket, setAnimatingMarket] = useState<string | null>(null);
  const [previousSelectedMarket, setPreviousSelectedMarket] = useState(selectedMarket);
  
  // Trigger animation when selectedMarket changes
  useEffect(() => {
    if (selectedMarket !== previousSelectedMarket) {
      setAnimatingMarket(selectedMarket);
      setPreviousSelectedMarket(selectedMarket);
      const timer = setTimeout(() => setAnimatingMarket(null), 600);
      return () => clearTimeout(timer);
    }
  }, [selectedMarket, previousSelectedMarket]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Bookmark state
  const [bookmarkedMarkets, setBookmarkedMarkets] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<string | null>(null);
  
  // Prediction percentages state
  const [predictionPercentages, setPredictionPercentages] = useState<Record<string, {
    positivePercentage: number;
    negativePercentage: number;
    totalPredictions: number;
  }>>({});
  
  // Pot balances state
  const [potBalances, setPotBalances] = useState<Record<string, string>>({});
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  
  // User prediction state for each market
  const [userPredictions, setUserPredictions] = useState<Record<string, TodaysBet | null>>({});
  
  // Vote change loading states
  const [voteChangeLoading, setVoteChangeLoading] = useState<Record<string, boolean>>({});
  
  // 24-hour countdown timer using custom hook
  const timeUntilMidnight = useCountdownTimer();
  
  // Pagination state
  const [displayedMarketsCount, setDisplayedMarketsCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const MARKETS_PER_PAGE = 12;
  
  // Animation state for position swapping
  const [swapAnimation, setSwapAnimation] = useState<{
    fromIndex: number;
    toIndex: number;
    isAnimating: boolean;
  } | null>(null);



  // Load more markets function
  const loadMoreMarkets = () => {
    if (isLoadingMore) return;
    
    // Get marketOptions to avoid reference before initialization
    const currentMarketOptions = getMarkets(getTranslation(currentLanguage), 'options');
    
    // Check if there are actually more markets to load
    const totalAvailableMarkets = searchQuery 
      ? currentMarketOptions.filter(option => {
          const marketData = getMarkets(getTranslation(currentLanguage), option.id);
          const market = marketData[0];
          return market && (
            market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            market.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }).length
      : currentMarketOptions.length;
    
    // Don't load more if we've already displayed all available markets
    if (displayedMarketsCount >= totalAvailableMarkets) {
      return;
    }
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedMarketsCount(prev => Math.min(prev + MARKETS_PER_PAGE, totalAvailableMarkets));
      setIsLoadingMore(false);
    }, 500);
  };

  // Reset pagination when search changes
  useEffect(() => {
    setDisplayedMarketsCount(12);
  }, [searchQuery]);

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore) return;
      
      // Get marketOptions inside the effect to avoid reference before initialization
      const currentMarketOptions = getMarkets(getTranslation(currentLanguage), 'options');
      
      // Check if there are more markets to load before triggering scroll load
      const totalAvailableMarkets = searchQuery 
        ? currentMarketOptions.filter(option => {
            const marketData = getMarkets(getTranslation(currentLanguage), option.id);
            const market = marketData[0];
            return market && (
              market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              market.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }).length
        : currentMarketOptions.length;
      
      // Don't trigger loading if we've already displayed all available markets
      if (displayedMarketsCount >= totalAvailableMarkets) {
        return;
      }
      
      // Check if user scrolled near bottom of page
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      if (scrollTop + windowHeight >= docHeight - 800) { // 800px before bottom
        loadMoreMarkets();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, displayedMarketsCount, searchQuery, currentLanguage]);
  
  


  // Function to get next Saturday midnight (pot closes)
  const getNextSaturdayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilSaturday;
    
    if (currentDay === 6) {
      // Saturday - next Saturday (next week)
      daysUntilSaturday = 7;
    } else {
      // Sunday (0) to Friday (5) - this Saturday
      daysUntilSaturday = 6 - currentDay;
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(0, 0, 0, 0); // Midnight UTC
    return nextSaturday;
  };

  // Function to get next midnight
  const getNextMidnight = (): Date => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    return midnight;
  };



  // Loading effect with progress simulation
  useEffect(() => {
    const initializeApp = async () => {
      // Simulate progressive loading - 4 second total duration
      const loadingSteps = [
        { progress: 15, delay: 100, label: 'Loading markets...' },
        { progress: 30, delay: 300, label: 'Fetching data...' },
        { progress: 50, delay: 400, label: 'Setting up interface...' },
        { progress: 75, delay: 500, label: 'Finalizing...' },
        { progress: 100, delay: 300, label: 'Ready!' }
      ];
      
      for (const step of loadingSteps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        setLoadingProgress(step.progress);
      }
      
      // Complete loading
      setTimeout(() => {
        setIsLoading(false);
        setIsVisible(true);
        // Notify parent that loading is complete
        onLoadingChange?.(false);
      }, 400);
    };
    
    // Notify parent that loading started
    onLoadingChange?.(true);
    
    initializeApp();
    
    // Initialize language
    const savedLang = Cookies.get('language') as Language | undefined;
    if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }
  }, []);

 

  useEffect(() => {
    const detectLanguage = async () => {
      // Check if language is already cached
      const cachedLanguage = localStorage.getItem('detectedLanguage');
      const cacheTimestamp = localStorage.getItem('languageDetectionTime');
      const ONE_HOUR = 60 * 60 * 1000;
      
      // Use cached result if less than 1 hour old
      if (cachedLanguage && cacheTimestamp && 
          (Date.now() - parseInt(cacheTimestamp)) < ONE_HOUR) {
        console.log('Using cached language detection:', cachedLanguage);
        setCurrentLanguage(cachedLanguage as Language);
        return;
      }

      try {
        console.log('Detecting language via geo IP...');
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const isBrazil = data.country === 'BR';
        const detectedLang = isBrazil ? 'pt-BR' : 'en';
        
        // Cache the result
        localStorage.setItem('detectedLanguage', detectedLang);
        localStorage.setItem('languageDetectionTime', Date.now().toString());
        
        setCurrentLanguage(detectedLang);
      } catch (err) {
        console.error('Geo IP detection failed:', err);
        setCurrentLanguage('en'); // fallback
      }
    };
    
    detectLanguage();
  }, []);





  const t = getTranslation(currentLanguage);

  const markets = getMarkets(t, selectedMarket);
  const marketOptions = getMarkets(t, 'options');

  // Load bookmark status for all possible markets (optimized)
  useEffect(() => {
    let isCancelled = false;
    
    const loadBookmarkStatus = async () => {
      if (!isConnected || !address) {
        setBookmarkedMarkets(new Set());
        return;
      }

      try {
        console.log('📑 Loading bookmark status for user:', address);
        
        // Get all possible market IDs from all categories
        const allPossibleMarkets = [
          ...marketOptions, // From options category
        ];

        // Loop through all market options and get markets from each category
        marketOptions.forEach(option => {
          try {
            const categoryMarkets = getMarkets(t, option.id);
            allPossibleMarkets.push(...categoryMarkets);
          } catch (error) {
            // Ignore categories that don't exist or have errors
            console.log(`Category ${option.id} not found or has no markets`);
          }
        });

        // Remove duplicates by creating a Map with market.id as key
        const uniqueMarkets = Array.from(
          new Map(allPossibleMarkets.map(market => [market.id, market])).values()
        );

        console.log('📑 Checking bookmarks for', uniqueMarkets.length, 'markets');

        // Batch the bookmark checks to prevent overwhelming the database
        const BATCH_SIZE = 10;
        const bookmarkedSet = new Set<string>();
        
        for (let i = 0; i < uniqueMarkets.length; i += BATCH_SIZE) {
          if (isCancelled) return;
          
          const batch = uniqueMarkets.slice(i, i + BATCH_SIZE);
          const batchChecks = await Promise.all(
            batch.map(async (market) => {
              const isBookmarked = await isMarketBookmarked(address, market.id);
              return { marketId: market.id, isBookmarked };
            })
          );
          
          batchChecks
            .filter(check => check.isBookmarked)
            .forEach(check => bookmarkedSet.add(check.marketId));
          
          // Small delay between batches to prevent overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (!isCancelled) {
          setBookmarkedMarkets(bookmarkedSet);
          console.log('📑 Loaded', bookmarkedSet.size, 'bookmarks');
        }
      } catch (error) {
        console.error('Error loading bookmark status:', error);
      }
    };

    // Add debouncing to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      loadBookmarkStatus();
      loadUserPredictions();
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [address, isConnected]); // Removed marketOptions and t to prevent excessive re-runs

  // Load prediction percentages for markets with contract addresses
  useEffect(() => {
    const loadPredictionPercentages = async () => {
      try {
        console.log('📊 Loading prediction percentages...');
        
        const marketsWithContracts = ['Trending', 'Crypto', 'stocks']; // Markets that have prediction data
        const percentagePromises = marketsWithContracts.map(async (marketId) => {
          const percentages = await getPredictionPercentages(marketId);
          return { marketId, percentages };
        });

        const results = await Promise.all(percentagePromises);
        const percentagesMap = results.reduce((acc, { marketId, percentages }) => {
          acc[marketId] = percentages;
          return acc;
        }, {} as Record<string, any>);

        setPredictionPercentages(percentagesMap);
        console.log('📊 Loaded prediction percentages:', percentagesMap);

      } catch (error) {
        console.error('Error loading prediction percentages:', error);
      }
    };

    loadPredictionPercentages();

    // Load percentages once on component mount only
    // Removed automatic refresh to prevent continuous re-renders
    
  }, []); // Load percentages once on component mount

  // Use fallback ETH price to avoid CORS issues
  useEffect(() => {
    setEthPrice(4700); // Fallback ETH price
    console.log('💰 Using fallback ETH price: 4700');
  }, []);

  // Helper function to convert ETH to USD (same as in PredictionPotTest)
  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

  // Update pot balances when contract balances or ETH price changes
  useEffect(() => {
    if (!ethPrice) return;

    const newPotBalances: Record<string, string> = {};
    
    // Calculate balances for each contract
    balancesData.forEach((balance, index) => {
      if (balance?.value) {
        const usdAmount = ethToUsd(balance.value);
        const contractAddress = contractAddresses[index];
        const marketType = CONTRACT_TO_TABLE_MAPPING[contractAddress];
        
        // Map contract to market name using utility function
        const marketName = getMarketDisplayName(marketType);
        
        // Show 2 decimal places if under $10, otherwise round to nearest dollar
        const formattedAmount = usdAmount < 10 ? usdAmount.toFixed(2) : usdAmount.toFixed(0);
        newPotBalances[marketName] = `$${formattedAmount}`;
        console.log(`💰 ${marketName} pot balance: ${formatUnits(balance.value, 18)} ETH = ${newPotBalances[marketName]}`);
      }
    });

    setPotBalances(newPotBalances);
    Cookies.set('potBalances', JSON.stringify(newPotBalances), { expires: 1/24 }); // 1 hour expiry
  }, [ethPrice, balancesData.length, ...balancesData.map(b => b?.value)]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async (market: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering market click
    
    if (!isConnected || !address) {
      showAlert('Please connect your wallet to bookmark markets', 'info', 'Connect Wallet');
      return;
    }

    const isCurrentlyBookmarked = bookmarkedMarkets.has(market.id);
    setBookmarkLoading(market.id);

    try {
      if (isCurrentlyBookmarked) {
        const result = await removeBookmark(address, market.id);
        if (result.success) {
          setBookmarkedMarkets(prev => {
            const newSet = new Set(prev);
            newSet.delete(market.id);
            return newSet;
          });
          showAlert('Bookmark removed', 'success', 'Success');
        } else {
          showAlert(result.message, 'error', 'Error');
        }
      } else {
        const contractAddress = getContractAddress(market.id);
        const result = await addBookmark(
          address,
          market.id,
          selectedMarket, // market category
          contractAddress || undefined
        );
        if (result.success) {
          setBookmarkedMarkets(prev => new Set(prev).add(market.id));
          showAlert('Market bookmarked!', 'success', 'Success');
        } else {
          showAlert(result.message, 'error', 'Error');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showAlert('Failed to update bookmark', 'error', 'Error');
    } finally {
      setBookmarkLoading(null);
    }
  };

  // Helper function to check if user is a participant in the selected market
  const isUserParticipant = (contractAddress: string): boolean => {
    if (!isConnected || !address) return false;

    const contractIndex = contractAddresses.findIndex(addr => addr === contractAddress);
    if (contractIndex === -1) return false;

    const participants = participantsData[contractIndex];
    if (!participants || !Array.isArray(participants)) return false;

    return participants.some(
      (participant: string) => participant.toLowerCase() === address.toLowerCase()
    );
  };

  // Helper function to get real pot balance for a market
  const getRealPotBalance = (marketId: string): string => {
    // Check if we have real balance data
    if (potBalances[marketId]) {
      return potBalances[marketId];
    }
    
    // Fallback to $0 if no data
    return '$0';
  };

  // Function to load user predictions for all markets
  const loadUserPredictions = async () => {
    if (!isConnected || !address) {
      setUserPredictions({});
      return;
    }

    try {
      console.log('📊 Loading user predictions for wallet:', address);
      
      // Load predictions for each table type
      const predictionPromises = Object.values(CONTRACT_TO_TABLE_MAPPING).map(async (tableType) => {
        try {
          const prediction = await getTomorrowsBet(address, tableType);
          return { tableType, prediction };
        } catch (error) {
          console.error(`Error loading prediction for ${tableType}:`, error);
          return { tableType, prediction: null };
        }
      });

      const results = await Promise.all(predictionPromises);
      
      // Convert results to Record<string, TodaysBet | null> keyed by market name
      const predictionsMap: Record<string, TodaysBet | null> = {};
      results.forEach(({ tableType, prediction }) => {
        // Map table types to market names using utility function
        const marketName = getMarketDisplayName(tableType);
        
        predictionsMap[marketName] = prediction;
        if (prediction) {
          console.log(`✅ User has ${prediction.prediction} prediction for ${marketName}`);
        }
      });
      
      setUserPredictions(predictionsMap);
    } catch (error) {
      console.error('Error loading user predictions:', error);
    }
  };

  // Helper function to get button content based on user's prediction
  const getButtonContent = (marketId: string, buttonType: 'positive' | 'negative') => {
    const prediction = userPredictions[marketId];
    const contractAddress = getContractAddress(marketId);
    const isParticipant = contractAddress && isUserParticipant(contractAddress);
    const isLoading = voteChangeLoading[marketId];
    
    // Show loading spinner if vote is being changed
    if (isLoading) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      );
    }
    
    if (prediction && prediction.prediction === buttonType) {
      // User has voted for this option
      if (isParticipant) {
        // Show confirmed tick for participants (they can't click to change from same option)
        return (
          <div className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {/* <span>✓</span> */}
          </div>
        );
      }
    }
    
    // For participants who haven't voted or want to change: show clickable option
    // For non-participants: show default option (will navigate to pot entry)
    return buttonType === 'positive' ? 'Yes' : 'No';
  };

  // Helper function to get button styling based on user's prediction
  const getButtonStyles = (marketId: string, buttonType: 'positive' | 'negative', baseClasses: string) => {
    const prediction = userPredictions[marketId];
    const contractAddress = getContractAddress(marketId);
    const isParticipant = contractAddress && isUserParticipant(contractAddress);
    const isLoading = voteChangeLoading[marketId];
    
    // Loading state
    if (isLoading) {
      return baseClasses.replace(/hover:bg-\w+-\d+/, 'cursor-wait opacity-50');
    }
    
    if (prediction && prediction.prediction === buttonType) {
      // User has voted for this option - show confirmed styling
      if (buttonType === 'positive') {
        return baseClasses.replace('bg-green-50 hover:bg-blue-200 text-green-700', 'bg-green-600 text-white cursor-default');
      } else {
        return baseClasses.replace('bg-red-50 hover:bg-purple-200 text-red-700', 'bg-red-600 text-white cursor-default');
      }
    }
    
    // If user is participant and has voted for the opposite option, make this button more prominent (change vote)
    if (isParticipant && prediction && prediction.prediction !== buttonType) {
      if (buttonType === 'positive') {
        return baseClasses.replace('bg-green-50 hover:bg-blue-200 text-green-700', 'bg-green-100 hover:bg-green-200 text-green-800');
      } else {
        return baseClasses.replace('bg-red-50 hover:bg-purple-200 text-red-700', 'bg-red-100 hover:bg-red-200 text-red-800');
      }
    }
    
    // Default button styling
    return baseClasses;
  };

  // Function to handle vote changes for participants
  const handleVoteChange = async (marketId: string, newVote: 'positive' | 'negative') => {
    if (!isConnected || !address) {
      showAlert('Please connect your wallet to vote', 'info', 'Connect Wallet');
      return;
    }

    // Check if user is a participant in this market
    const contractAddress = getContractAddress(marketId);
    if (!contractAddress || !isUserParticipant(contractAddress)) {
      showAlert('You must be a pot participant to vote', 'info', 'Join Pot');
      return;
    }

    // Get the table type for this market
    const tableType = Object.entries(CONTRACT_TO_TABLE_MAPPING).find(
      ([addr]) => addr === contractAddress
    )?.[1];

    if (!tableType) {
      showAlert('Unable to determine market type', 'error', 'Error');
      return;
    }

    try {
      // Set loading state for this market
      setVoteChangeLoading(prev => ({ ...prev, [marketId]: true }));

      // Place/update the prediction
      await placeBitcoinBet(address, newVote, tableType);
      
      // Update local state immediately for better UX
      const updatedPrediction: TodaysBet = {
        id: Date.now(), // temporary ID
        walletAddress: address,
        prediction: newVote,
        betDate: new Date().toISOString().split('T')[0],
        createdAt: new Date()
      };
      
      setUserPredictions(prev => ({
        ...prev,
        [marketId]: updatedPrediction
      }));

      // Show success message
      // showAlert(`Vote changed to ${newVote === 'positive' ? 'Yes' : 'No'} for ${marketId}`, 'success', 'Vote Updated');
      
    } catch (error) {
      console.error('Error changing vote:', error);
      showAlert(error instanceof Error ? error.message : 'Failed to change vote', 'error', 'Error');
    } finally {
      // Clear loading state
      setVoteChangeLoading(prev => ({ ...prev, [marketId]: false }));
    }
  };

  // Helper function to handle button clicks - support vote changing for participants
  const handleButtonClick = (marketId: string, buttonType: 'positive' | 'negative', originalClickHandler: (e: React.MouseEvent) => void) => {
    return async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      const prediction = userPredictions[marketId];
      const contractAddress = getContractAddress(marketId);
      const isParticipant = contractAddress && isUserParticipant(contractAddress);
      
      // If user is a participant and has already voted for this option, do nothing
      if (prediction && prediction.prediction === buttonType && isParticipant) {
        return;
      }
      
      // If user is a participant and wants to change their vote
      if (prediction && prediction.prediction !== buttonType && isParticipant) {
        await handleVoteChange(marketId, buttonType);
        return;
      }
      
      // If user is a participant but hasn't voted yet
      if (isParticipant && !prediction) {
        await handleVoteChange(marketId, buttonType);
        return;
      }
      
      // For non-participants, execute original click handler (navigate to pot entry)
      originalClickHandler(e);
    };
  };

  // Function to handle market selection with position swap animation
  const handleMarketSelection = (newMarketId: string, currentMarketsList: any[]) => {
    // If it's the same market, don't do anything
    if (newMarketId === selectedMarket) return;
    
    // Find indices of current selected and new selected markets
    const currentSelectedIndex = currentMarketsList.findIndex(market => market.tabId === selectedMarket);
    const newSelectedIndex = currentMarketsList.findIndex(market => market.tabId === newMarketId);
    
    if (currentSelectedIndex === -1 || newSelectedIndex === -1) return;
    
    // If new selected is already first, no need to animate
    if (newSelectedIndex === 0) {
      setSelectedMarket?.(newMarketId);
      return;
    }
    
    // Start swap animation
    setSwapAnimation({
      fromIndex: currentSelectedIndex,
      toIndex: newSelectedIndex,
      isAnimating: true
    });
    
    // After animation completes, update the selected market
    setTimeout(() => {
      setSelectedMarket?.(newMarketId);
      setSwapAnimation(null);
    }, 600); // Match CSS animation duration
  };

  
const handleMarketClick = (marketId: string) => {
  const contractAddress = getContractAddress(marketId);
  
  if (contractAddress) {
    // Find the market question from the correct category
    let market: Market | undefined = undefined;
    
    // Try to find the market in the specific category first
    if (marketId === 'Trending') {
      const trendingMarkets = getMarkets(t, 'Trending');
      market = trendingMarkets.find(m => m.id === marketId);
    } else if (marketId === 'Crypto') {
      const cryptoMarkets = getMarkets(t, 'Crypto');
      market = cryptoMarkets.find(m => m.id === marketId);
    }
    
    // Fallback: try to find in current markets or options
    if (!market) {
      market = markets.find(m => m.id === marketId);
    }
    
    const marketQuestion = market?.question || '';
    const marketIcon = market?.icon || '';
    
    // Set the cookies with proper options
    Cookies.set('selectedMarket', contractAddress, { 
      sameSite: 'lax',
      expires: 7 // Cookie expires in 7 days
    });
    
    Cookies.set('selectedMarketQuestion', marketQuestion, { 
      sameSite: 'lax',
      expires: 7 // Cookie expires in 7 days
    });
    
    Cookies.set('selectedMarketIcon', marketIcon, { 
      sameSite: 'lax',
      expires: 7 // Cookie expires in 7 days
    });
    
    // Always route to TutorialBridge (dashboard) so users can see the chart and choose their action
    setTimeout(() => {
      setActiveSection('dashboard');
    }, 200);
    
  } else {
    showAlert(`${markets.find((m) => m.id === marketId)?.name} ${t.comingSoon}`, 'info', 'Coming Soon');
  }
};


  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gray-900 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-md mx-auto text-center relative z-10 px-6">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/10">
            Logo/Text
            {/* <div className="bg-gradient-to-br from-purple-700 via-purple-1000 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-purple-900/25 relative overflow-hidden px-6 py-4">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              <span className="text-xl font-black text-white drop-shadow-lg relative z-10 tracking-tight">prediwin.com</span>
            </div> */}
            
            {/* Title */}
            <h1 className="text-3xl font-black text-purple-700 mb-4 tracking-tight">PrediWin</h1>
            <p className="text-gray-600 text-base mb-8">Loading your questions...</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-1000 to-purple-700 rounded-full transition-all duration-300 ease-out relative"
                style={{ width: `${loadingProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 animate-pulse"></div>
              </div>
            </div>
            
            {/* Progress Text */}
            <div className="text-gray-500 text-sm font-medium">
              {loadingProgress}%
            </div>
            
            {/* Animated dots */}
            <div className="flex justify-center gap-1 mt-6">
              <div className="w-2 h-2 bg-purple-1000 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-1000 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-purple-1000 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        @keyframes pulse-right {
          0% { transform: translateX(0); }
          50% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes professional-glow {
          0%, 100% {
            box-shadow: 
              0 0 0 1px rgba(220, 38, 38, 0.3),
              0 0 8px rgba(220, 38, 38, 0.15),
              0 0 16px rgba(220, 38, 38, 0.1);
          }
          50% {
            box-shadow: 
              0 0 0 1px rgba(220, 38, 38, 0.6),
              0 0 12px rgba(220, 38, 38, 0.3),
              0 0 24px rgba(220, 38, 38, 0.2),
              0 0 32px rgba(220, 38, 38, 0.1);
          }
        }
        
        @keyframes swapToFirst {
          0% { 
            transform: translateY(0) translateX(0) scale(1);
            z-index: 1;
          }
          50% { 
            transform: translateY(-20px) translateX(-10px) scale(1.05);
            z-index: 10;
          }
          100% { 
            transform: translateY(var(--swap-distance)) translateX(0) scale(1);
            z-index: 1;
          }
        }
        
        @keyframes swapFromFirst {
          0% { 
            transform: translateY(0) translateX(0) scale(1);
            z-index: 1;
          }
          50% { 
            transform: translateY(20px) translateX(10px) scale(0.95);
            z-index: 10;
          }
          100% { 
            transform: translateY(var(--swap-distance)) translateX(0) scale(1);
            z-index: 1;
          }
        }
        
        .swap-to-first {
          animation: swapToFirst 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          position: relative;
        }
        
        .swap-from-first {
          animation: swapFromFirst 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          position: relative;
        }
        
        .pulsing-glow-selected {
          background: linear-gradient(135deg, rgb(220, 38, 38), rgb(239, 68, 68), rgb(55, 65, 81));
          animation: professional-glow 2.5s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(17, 0, 0, 0.2);
          }
          50% { 
            transform: scale(1.02); 
            box-shadow: 0 0 0 3px rgba(17, 0, 0, 0.08), 0 0 10px rgba(170, 0, 0, 0.1);
          }
        }
        
        .animate-pulse-right {
          animation: pulse-right 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
      
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">

      {/* Markets Grid */}
      <section className="relative z-10 px-2 md:px-6 pt-2 md:mt-[5.5rem]">
        <div className="md:max-w-7xl md:mx-auto">
          
{/* Mobile Markets Display - All Markets */}
<div className="md:hidden space-y-4 -translate-y-2">
  {(() => {
    // Get all markets and deduplicate by ID
    const allMarkets = marketOptions.map(option => {
      const marketData = getMarkets(t, option.id);
      const market = marketData[0]; // Get the first (main) market for each option
      
      if (market) {
        // Store the tab option ID so we can match it later
        market.tabId = option.id;
        // Update pot size with real balance
        market.potSize = getRealPotBalance(option.id);
        return market;
      } else {
        // Create a fallback market for categories without data
        return {
          id: option.id,
          name: option.name,
          symbol: option.symbol,
          color: option.color || '#666666',
          question: `${option.name} predictions coming soon...`,
          icon: option.icon || '🔮',
          currentPrice: '-',
          participants: 0,
          potSize: getRealPotBalance(option.id),
          tabId: option.id
        };
      }
    });
    
    // Filter markets based on search query
    const filteredMarkets = searchQuery 
      ? allMarkets.filter(market => 
          market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          market.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allMarkets;

    // Reorder: selected market first, then others (match by tabId) - move displaced market further down
    const selectedMarketData = filteredMarkets.find(market => market.tabId === selectedMarket);
    const otherMarkets = filteredMarkets.filter(market => market.tabId !== selectedMarket);
    
    // Insert the selected market first, but put the previously selected market at position 16 instead of 2
    let orderedMarkets: typeof filteredMarkets = [];
    if (selectedMarketData) {
      // Debug logging
      console.log('selectedMarket:', selectedMarket);
      console.log('previousSelectedMarket:', previousSelectedMarket);
      
      orderedMarkets = [selectedMarketData];
      
      // We want to move "Trending" market to position 16+, so filter it out from early positions
      const trendingMarket = otherMarkets.find(market => market.tabId === 'Trending');
      const otherMarketsFiltered = otherMarkets.filter(market => market.tabId !== 'Trending');
      
      // Add first 15 other markets (excluding Trending)
      orderedMarkets = [...orderedMarkets, ...otherMarketsFiltered.slice(0, 15)];
      
      // Add the Trending market at position 16+ (only if it's not the currently selected market)
      if (trendingMarket && selectedMarket !== 'Trending') {
        orderedMarkets = [...orderedMarkets, trendingMarket];
      }
      
      // Add any remaining markets
      orderedMarkets = [...orderedMarkets, ...otherMarketsFiltered.slice(15)];
      
      console.log('orderedMarkets first 5:', orderedMarkets.slice(0, 5).map(m => m.tabId));
    } else {
      orderedMarkets = filteredMarkets;
    }
    
    // Apply pagination
    const displayedMarkets = orderedMarkets.slice(0, displayedMarketsCount);
    
    return displayedMarkets.map((market, index) => {
      // Calculate animation classes
      const isSwapping = swapAnimation && swapAnimation.isAnimating;
      const isSwappingToFirst = isSwapping && swapAnimation.toIndex === index;
      const isSwappingFromFirst = isSwapping && swapAnimation.fromIndex === index;
      
      // Calculate swap distance for CSS variable
      const swapDistance = isSwapping 
        ? `${(Math.abs(swapAnimation.toIndex - swapAnimation.fromIndex) * 100)}px`
        : '0px';
      
      return (
      <div key={`mobile-${market.id}-${index}`}>
        <div 
          onClick={() => {
            if (!isSwapping) {
              handleMarketClick(market.id);
            }
          }}
          className={`group rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-500  hover:shadow-purple-200 ${
                        isSwappingToFirst ? 'swap-to-first' : isSwappingFromFirst ? 'swap-from-first' : ''
                      } ${animatingMarket === market.tabId ? 'animate-scale-once' : ''}`}
          style={{
            '--swap-distance': swapDistance
          } as React.CSSProperties}
        >
          <div className={`p-3 h-full transition-all duration-300 border-b border-gray-200 ${
            market.tabId === selectedMarket 
              ? 'bg-white shadow-lg shadow-purple-100/50' 
              : 'bg-white'
          }`}>
            {/* Background Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1"></div>
            
            {/* Countdown Timer - Above image (only for selected market) */}
            {market.tabId === selectedMarket && (
              <div className="flex justify-end mb-2">
                <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
                 
                </div>
              </div>
            )}
            
            {/* Header with Icon, Question, and Percentage */}
            <div className="flex items-start gap-3 mb-3 relative">
              {/* Small Square Image */}
              <div className="flex-shrink-0">
                <div className="rounded-lg w-16 h-16 bg-white overflow-hidden relative">
                  {market.icon?.slice(0, 4) === 'http' ? (
                    <img 
                      src={market.icon} 
                      alt={`${market.name} Icon`} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm text-gray-600">{market.icon}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Question */}
              <div className="flex-1 flex items-start pr-16">
                <p className="text-sm leading-tight font-['Inter','system-ui','-apple-system','Segoe_UI','Roboto','Helvetica_Neue',sans-serif]" style={{
                  color: '#000000', 
                  fontWeight: '510',
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: market.question.length > 50 ? 'flex-start' : 'center'
                }}>
                  {market.question}
                </p>
              </div>

              {/* Percentage Display - Top Right */}
              {predictionPercentages[market.tabId || market.id] && (
                <div className="absolute top-0 right-0">
                  <div className="text-right flex flex-col items-end">
                    {/* Thermometer Arc */}
                    <div className="w-12 h-6 mb-1 relative">
                      <svg className="w-12 h-6" viewBox="0 0 100 50">
                        {/* Background arc */}
                        <path
                          d="M 10 45 A 40 40 0 0 1 90 45"
                          stroke="#e5e7eb"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                        />
                        {/* Progress arc */}
                        <path
                          d="M 10 45 A 40 40 0 0 1 90 45"
                          stroke={
                            predictionPercentages[market.tabId || market.id].positivePercentage >= 80 ? '#10b981' :
                            predictionPercentages[market.tabId || market.id].positivePercentage >= 60 ? '#f59e0b' :
                            predictionPercentages[market.tabId || market.id].positivePercentage >= 40 ? '#f97316' : '#ef4444'
                          }
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${predictionPercentages[market.tabId || market.id].positivePercentage * 1.26} 126`}
                          className="transition-all duration-300"
                        />
                      </svg>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                                  {(() => {
                                    const totalVotes = predictionPercentages[market.tabId || market.id]?.totalPredictions ?? 0;
                                    console.log('totalVotes for', market.id, totalVotes);
                                    const positive = Math.round((predictionPercentages[market.tabId || market.id]?.positivePercentage ?? 0) / 100 * totalVotes);
                                    console.log('positive votes for', market.id, positive);
                                    const negative = totalVotes - positive;
                                    console.log('negative votes for', market.id, negative);
                                    const smoothedPercentage = (((positive + 0.5) / (positive + negative + 1)) * 100).toFixed(0);
                                    return smoothedPercentage;
                                  })()}%
                                </div>
                                <div className="text-xs text-gray-500">chance</div>
                  </div>
                </div>
              )}
            </div>

            {/* Yes/No Buttons - Side by Side in Center */}
            <div className="flex justify-center gap-2 mb-3">
              <button 
                onClick={handleButtonClick(market.id, 'positive', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('Yes button clicked for market:', market.id);
                  Cookies.set('votingPreference', 'positive', { sameSite: 'lax', expires: 1 });
                  Cookies.set('selectedMarketForVoting', market.id, { sameSite: 'lax', expires: 1 });
                  // Visual feedback
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                  (e.currentTarget as HTMLButtonElement).style.color = 'white';
                  // Navigate to market after brief visual feedback
                  setTimeout(() => {
                    handleMarketClick(market.id);
                  }, 300);
                })}
                className={getButtonStyles(market.id, 'positive', "bg-green-50 hover:bg-blue-200 text-green-700 px-22 py-2 rounded-lg text-base font-bold transition-all duration-200 flex-1 max-w-[213px] flex items-center justify-center")}
              >
                {getButtonContent(market.id, 'positive')}
              </button>
              <button 
                onClick={handleButtonClick(market.id, 'negative', (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  console.log('No button clicked for market:', market.id);
                  Cookies.set('votingPreference', 'negative', { sameSite: 'lax', expires: 1 });
                  Cookies.set('selectedMarketForVoting', market.id, { sameSite: 'lax', expires: 1 });
                  // Visual feedback
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ef4444';
                  (e.currentTarget as HTMLButtonElement).style.color = 'white';
                  // Navigate to market after brief visual feedback
                  setTimeout(() => {
                    handleMarketClick(market.id);
                  }, 300);
                })}
                className={getButtonStyles(market.id, 'negative', "bg-red-50 hover:bg-purple-200 text-red-700 px-22 py-2 rounded-lg text-base font-bold transition-all duration-200 flex-1 max-w-[213px] flex items-center justify-center")}
              >
                {getButtonContent(market.id, 'negative')}
              </button>
            </div>

            {/* Stats Footer */}
            <div className="flex justify-between items-center pt-2">
              <div className="text-[13px] font-['Inter','system-ui','-apple-system','Segoe_UI','Roboto','Helvetica_Neue',sans-serif] text-gray-500 leading-none" style={{fontWeight: '350'}}>{market.potSize} In pot<span className="ml-4"style={{fontWeight: '350'}}>⇄ Weekly</span></div>
              
              {(() => {
                const contractAddress = getContractAddress(market.id);
                const userIsParticipant = contractAddress ? isUserParticipant(contractAddress) : false;
                
                if (userIsParticipant) {
                  return (
                    <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium flex items-center gap-1">
                      {timeUntilMidnight}
                    </div>
                  );
                } else {
                  return (
                    <button
                      onClick={(e) => handleBookmarkToggle(market, e)}
                      disabled={bookmarkLoading === market.id}
                      className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {bookmarkLoading === market.id ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-purple-700 border-t-transparent"></div>
                      ) : (
                        <Bookmark 
                          className={`w-4 h-4 transition-all duration-200 ${
                            bookmarkedMarkets.has(market.id) 
                              ? 'text-purple-700 fill-purple-700' 
                              : 'text-gray-500'
                          }`} 
                        />
                      )}
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
      );
    });
  })()}

{/* Mobile Loading More Indicator */}
{(() => {
  const allMarkets = marketOptions.length;
  const hasMoreMarkets = displayedMarketsCount < allMarkets && !searchQuery;
  
  return (
    <div className="md:hidden">
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          <span className="ml-3 text-gray-600">Loading more pots...</span>
        </div>
      )}
      
      {hasMoreMarkets && !isLoadingMore && (
        <div className="text-center py-6">
          <button
            onClick={loadMoreMarkets}
            className="bg-purple-700 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Load More Pots ({allMarkets - displayedMarketsCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
})()}
</div>
        </div>
      </section>

      {/* Desktop Markets Grid - Full Width */}
      <section className="relative z-10 px-6 -mt-24 pb-16 hidden md:block">
        <div className="max-w-7xl mx-auto">
          {/* All Markets Display - Full Width Grid */}
          <div className="grid grid-cols-3 gap-4">
                {(() => {
                  // Get all markets and deduplicate by ID
                  const allMarkets = marketOptions.map(option => {
                    const marketData = getMarkets(t, option.id);
                    const market = marketData[0]; // Get the first (main) market for each option
                    
                    if (market) {
                      // Store the tab option ID so we can match it later
                      market.tabId = option.id;
                      // Update pot size with real balance
                      market.potSize = getRealPotBalance(option.id);
                      return market;
                    } else {
                      // Create a fallback market for categories without data
                      return {
                        id: option.id,
                        name: option.name,
                        symbol: option.symbol,
                        color: option.color || '#666666',
                        question: `${option.name} predictions coming soon...`,
                        icon: option.icon || '🔮',
                        currentPrice: '-',
                        participants: 0,
                        potSize: getRealPotBalance(option.id),
                        tabId: option.id
                      };
                    }
                  });
                  
                  // Filter markets based on search query
                  const filteredMarkets = searchQuery 
                    ? allMarkets.filter(market => 
                        market.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        market.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    : allMarkets;

                  // Reorder: selected market first, then others (match by tabId) - move displaced market further down
                  const selectedMarketData = filteredMarkets.find(market => market.tabId === selectedMarket);
                  const otherMarkets = filteredMarkets.filter(market => market.tabId !== selectedMarket);
                  
                  // Insert the selected market first, but put the previously selected market at position 16 instead of 2
                  let orderedMarkets: typeof filteredMarkets = [];
                  if (selectedMarketData) {
                    orderedMarkets = [selectedMarketData];
                    
                    // We want to move "Trending" market to position 16+, so filter it out from early positions
                    const trendingMarket = otherMarkets.find(market => market.tabId === 'Trending');
                    const otherMarketsFiltered = otherMarkets.filter(market => market.tabId !== 'Trending');
                    
                    // Add first 15 other markets (excluding Trending)
                    orderedMarkets = [...orderedMarkets, ...otherMarketsFiltered.slice(0, 15)];
                    
                    // Add the Trending market at position 16+ (only if it's not the currently selected market)
                    if (trendingMarket && selectedMarket !== 'Trending') {
                      orderedMarkets = [...orderedMarkets, trendingMarket];
                    }
                    
                    // Add any remaining markets
                    orderedMarkets = [...orderedMarkets, ...otherMarketsFiltered.slice(15)];
                  } else {
                    orderedMarkets = filteredMarkets;
                  }
                  
                  // Apply pagination for desktop
                  const displayedMarkets = orderedMarkets.slice(0, displayedMarketsCount);
                  
                  return displayedMarkets.map((market, index) => {
                    // Calculate animation classes
                    const isSwapping = swapAnimation && swapAnimation.isAnimating;
                    const isSwappingToFirst = isSwapping && swapAnimation.toIndex === index;
                    const isSwappingFromFirst = isSwapping && swapAnimation.fromIndex === index;
                    
                    // Calculate swap distance for CSS variable (desktop uses grid so different calculation)
                    const swapDistance = isSwapping 
                      ? `${(Math.abs(swapAnimation.toIndex - swapAnimation.fromIndex) * 180)}px`
                      : '0px';
                    
                    return (
                    <div
                      key={`desktop-${market.id}-${index}`}
                      onClick={() => {
                        if (!isSwapping) {
                          handleMarketClick(market.id);
                        }
                      }}
                      className={`group hover:scale-[1.004] rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-500  hover:shadow-purple-200 ${
                        isSwappingToFirst ? 'swap-to-first' : isSwappingFromFirst ? 'swap-from-first' : ''
                      } ${animatingMarket === market.tabId ? 'animate-scale-once' : ''}`}
                      style={{
                        '--swap-distance': swapDistance
                      } as React.CSSProperties}
                    >
                      <div className="rounded-2xl p-3 h-full flex flex-col min-h-[140px] transition-all duration-300 bg-white border border-gray-200 hover:border-gray-300">
                        
                        
                        {/* Header with Icon, Question, and Percentage */}
                        <div className="flex items-start gap-3 mb-3 relative">
                          {/* Small Square Image */}
                          <div className="flex-shrink-0">
                            <div className="rounded-lg w-20 h-20 bg-white overflow-hidden relative">
                              {market.icon?.slice(0, 4) === 'http' ? (
                                <img 
                                  src={market.icon} 
                                  alt={`${market.name} Icon`} 
                                  className="absolute inset-0 w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-lg text-gray-600">{market.icon}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Question */}
                          <div className="flex-1 pr-16">
                            <p className="text-sm leading-tight line-clamp-3 font-['Inter','system-ui','-apple-system','Segoe_UI','Roboto','Helvetica_Neue',sans-serif]" style={{color: '#000000', fontWeight: '510'}}>
                              {market.question}
                            </p>
                          </div>

                          {/* Percentage Display - Top Right */}
                          {predictionPercentages[market.tabId || market.id] && (
                            <div className="absolute top-0 right-0">
                              <div className="text-right flex flex-col items-end">
                                {/* Thermometer Arc */}
                                <div className="w-12 h-6 mb-1 relative">
                                  <svg className="w-12 h-6" viewBox="0 0 100 50">
                                    {/* Background arc */}
                                    <path
                                      d="M 10 45 A 40 40 0 0 1 90 45"
                                      stroke="#e5e7eb"
                                      strokeWidth="6"
                                      fill="none"
                                      strokeLinecap="round"
                                    />
                                    {/* Progress arc */}
                                    <path
                                      d="M 10 45 A 40 40 0 0 1 90 45"
                                      stroke={
                                        predictionPercentages[market.tabId || market.id].positivePercentage >= 80 ? '#10b981' :
                                        predictionPercentages[market.tabId || market.id].positivePercentage >= 60 ? '#f59e0b' :
                                        predictionPercentages[market.tabId || market.id].positivePercentage >= 40 ? '#f97316' : '#ef4444'
                                      }
                                      strokeWidth="6"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeDasharray={`${predictionPercentages[market.tabId || market.id].positivePercentage * 1.26} 126`}
                                      className="transition-all duration-300"
                                    />
                                  </svg>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {(() => {
                                    const totalVotes = predictionPercentages[market.tabId || market.id]?.totalPredictions ?? 0;
                                    console.log('totalVotes for', market.id, totalVotes);
                                    const positive = Math.round((predictionPercentages[market.tabId || market.id]?.positivePercentage ?? 0) / 100 * totalVotes);
                                    console.log('positive votes for', market.id, positive);
                                    const negative = totalVotes - positive;
                                    console.log('negative votes for', market.id, negative);
                                    const smoothedPercentage = (((positive + 0.5) / (positive + negative + 1)) * 100).toFixed(0);
                                    return smoothedPercentage;
                                  })()}%
                                </div>
                                <div className="text-xs text-gray-500">chance</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Yes/No Buttons - Side by Side in Center */}
                        <div className="flex justify-center gap-2 mb-3">
                          <button 
                            onClick={handleButtonClick(market.id, 'positive', (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('Yes button clicked for market:', market.id);
                              Cookies.set('votingPreference', 'positive', { sameSite: 'lax', expires: 1 });
                              Cookies.set('selectedMarketForVoting', market.id, { sameSite: 'lax', expires: 1 });
                              // Visual feedback
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981';
                              (e.currentTarget as HTMLButtonElement).style.color = 'white';
                              // Navigate to market after brief visual feedback
                              setTimeout(() => {
                                handleMarketClick(market.id);
                              }, 300);
                            })}
                            className={getButtonStyles(market.id, 'positive', "bg-green-50 hover:bg-blue-200 text-green-700 px-20 py-2 rounded-lg text-base font-bold transition-all duration-200 flex-1 max-w-[180px]")}
                          >
                            {getButtonContent(market.id, 'positive')}
                          </button>
                          <button 
                            onClick={handleButtonClick(market.id, 'negative', (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('No button clicked for market:', market.id);
                              Cookies.set('votingPreference', 'negative', { sameSite: 'lax', expires: 1 });
                              Cookies.set('selectedMarketForVoting', market.id, { sameSite: 'lax', expires: 1 });
                              // Visual feedback
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ef4444';
                              (e.currentTarget as HTMLButtonElement).style.color = 'white';
                              // Navigate to market after brief visual feedback
                              setTimeout(() => {
                                handleMarketClick(market.id);
                              }, 300);
                            })}
                            className={getButtonStyles(market.id, 'negative', "bg-red-50 hover:bg-purple-200 text-red-700 px-20 py-2 rounded-lg text-base font-bold transition-all duration-200 flex-1 max-w-[180px]")}
                          >
                            {getButtonContent(market.id, 'negative')}
                          </button>
                        </div>

                        {/* Stats Footer - Compact */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
              <div className="text-[13px] font-['Inter','system-ui','-apple-system','Segoe_UI','Roboto','Helvetica_Neue',sans-serif] text-gray-500 leading-none" style={{fontWeight: '350'}}>{market.potSize} In pot<span className="ml-4"style={{fontWeight: '350'}}>⇄ Weekly</span></div>
                          
                          {(() => {
                            const contractAddress = getContractAddress(market.id);
                            const userIsParticipant = contractAddress ? isUserParticipant(contractAddress) : false;
                            
                            if (userIsParticipant) {
                              return (
                                <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium flex items-center gap-1">
                                  {timeUntilMidnight}
                                </div>
                              );
                            } else {
                              return (
                                <button
                                  onClick={(e) => handleBookmarkToggle(market, e)}
                                  disabled={bookmarkLoading === market.id}
                                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  {bookmarkLoading === market.id ? (
                                    <div className="w-3 h-3 animate-spin rounded-full border-2 border-purple-700 border-t-transparent"></div>
                                  ) : (
                                    <Bookmark 
                                      className={`w-3 h-3 transition-all duration-200 ${
                                        bookmarkedMarkets.has(market.id) 
                                          ? 'text-purple-700 fill-purple-700' 
                                          : 'text-gray-500 '
                                      }`} 
                                    />
                                  )}
                                </button>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                    );
                  });
                })()}
          </div>

          {/* Desktop Loading More Indicator */}
          {(() => {
            const allMarkets = marketOptions.length;
            const hasMoreMarkets = displayedMarketsCount < allMarkets && !searchQuery;
            
            return (
              <>
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
                    <span className="ml-4 text-gray-600 text-lg">Loading more pots...</span>
                  </div>
                )}
                
                {hasMoreMarkets && !isLoadingMore && (
                  <div className="text-center py-8">
                    <button
                      onClick={loadMoreMarkets}
                      className="bg-purple-700 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                    >
                      Load More Pots ({allMarkets - displayedMarketsCount} remaining)
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      {/* Thousands of Winners Section - Desktop */}
      <section className="relative z-10 px-6 py-16 hidden md:block">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-4 mb-12">
            <h2 className="text-4xl font-light text-gray-900 tracking-tight">
              <span className="text-purple-700 font-medium">Thousands</span> of winners,
            </h2>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              will you be next?
            </h3>
          </div>
          
          {/* Minimalist Entry Button */}
          <button
            onClick={() => handleMarketClick('Trending')}
            className="group relative bg-black border-2 border-black text-white px-20 py-5 rounded-lg font-semibold text-xl tracking-[0.1em] uppercase transition-all duration-300 hover:bg-purple-700 hover:border-purple-700 hover:text-white overflow-hidden shadow-xl hover:shadow-purple-200"
          >
            <span className="relative z-10">Enter</span>
            
            {/* Sliding fill effect */}
            <div className="absolute inset-0 bg-purple-700 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
            
            {/* Subtle arrows that appear on hover */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-lg">→</span>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-lg">←</span>
            </div>
          </button>
        </div>
      </section>

      {/* Sleek Call to Action - Mobile Only */}
      <section id="call-to-action" className="relative z-10 px-6 mt-16 mb-16 md:hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-2 tracking-tight">
            <span className="text-purple-700 font-medium">Thousands</span> of winners,
          </h2>
          <h3 className="text-xl font-black text-gray-900 mb-10 tracking-tight">
            will you be next?
          </h3>
          
          {/* Minimalist Entry Button - Mobile */}
          <button
            onClick={() => handleMarketClick('Trending')}
            className="group relative bg-white border-2 border-black text-black px-12 py-4 rounded-lg font-semibold text-base tracking-[0.1em] uppercase transition-all duration-300 hover:bg-purple-700 hover:border-purple-700 hover:text-white overflow-hidden mx-auto shadow-lg hover:shadow-purple-200"
          >
            <span className="relative z-10">Enter</span>
            
            {/* Sliding fill effect */}
            <div className="absolute inset-0 bg-purple-700 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
            
            {/* Subtle arrows that appear on hover */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-xs">→</span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-xs">←</span>
            </div>
          </button>
        </div>
      </section>

      <footer className="relative z-10 px-6 py-10 bg-white text-center text-purple-700 text-sm shadow-md">
        &copy; {new Date().getFullYear()} {t.footerText}
      </footer>
      
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        autoClose={alertState.autoClose}
      />
    </div>
    </div>
  );
};

export default LandingPage;