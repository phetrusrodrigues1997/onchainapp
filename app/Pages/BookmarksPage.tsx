'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import Cookies from 'js-cookie';
import { Bookmark, X, Trophy, Users, TrendingUp } from 'lucide-react';
import { getUserBookmarks, removeBookmark } from '../Database/actions';
import { CONTRACT_TO_TABLE_MAPPING } from '../Database/config';
import { getPrice } from '../Constants/getPrice';
import LoadingScreen from '../Components/LoadingScreen';

interface BookmarksPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface BookmarkItem {
  id: number;
  walletAddress: string;
  marketId: string;
  marketName: string;
  marketQuestion: string;
  marketCategory: string;
  contractAddress?: string | null;
}

// Use centralized contract mapping from config
const CONTRACT_ADDRESSES = CONTRACT_TO_TABLE_MAPPING;

// Prediction Pot ABI (same as TutorialBridge)
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const BookmarksPage = ({ activeSection, setActiveSection }: BookmarksPageProps) => {
  const { address, isConnected } = useAccount();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  
  // Markets you've entered functionality
  const [userPots, setUserPots] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'entered'>('entered');
  
  // Pot balances state
  const [potBalances, setPotBalances] = useState<Record<string, string>>({});
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  // Get contract addresses array - memoized to prevent re-creation
  const contractAddresses = useMemo(() => 
    Object.keys(CONTRACT_ADDRESSES) as Array<keyof typeof CONTRACT_ADDRESSES>,
    []
  );

  // Dynamically create hooks for all contract addresses
  const contractReadResults = contractAddresses.map((address) => ({
    address,
    participants: useReadContract({
      address: address as `0x${string}`,
      abi: PREDICTION_POT_ABI,
      functionName: 'getParticipants',
      query: { enabled: isConnected && !!address }
    }),
    balance: useBalance({
      address: address as `0x${string}`,
      chainId: 8453
    })
  }));

  const participantsData = contractReadResults.map(result => result.participants.data);
  const balancesData = contractReadResults.map(result => result.balance.data);

  // Update userPots when participant data changes
  useEffect(() => {
    if (!isConnected || !address) {
      setUserPots([]);
      return;
    }

    const participatingPots: string[] = [];
    
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
  }, [participantsData, address, isConnected, contractAddresses]);

  // Load bookmarks when component mounts or address changes
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!isConnected || !address) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📑 Loading bookmarks for:', address);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Database query took too long')), 10000) // 10 second timeout
        );
        
        const bookmarksPromise = getUserBookmarks(address);
        
        const userBookmarks = await Promise.race([bookmarksPromise, timeoutPromise]);
        setBookmarks(userBookmarks as any);
        console.log('📑 Bookmarks loaded successfully, count:', (userBookmarks as any).length);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        // Set empty bookmarks on error so page still loads
        setBookmarks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [address, isConnected]);

  // Fetch ETH price and calculate pot balances
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getPrice('ETH');
        setEthPrice(price);
        console.log('💰 ETH price fetched:', price);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
        setEthPrice(4700); // Fallback price
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to convert ETH to USD (same as in other components)
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
        const marketType = CONTRACT_ADDRESSES[contractAddress];
        
        // Map contract to market name
        let marketName = '';
        if (marketType === 'featured') {
          marketName = 'Trending';
        } else if (marketType === 'crypto') {
          marketName = 'Crypto';
        } else if (marketType === 'stocks') {
          marketName = 'stocks';
        }
        
        // Show 2 decimal places if under $10, otherwise round to nearest dollar
        const formattedAmount = usdAmount < 10 ? usdAmount.toFixed(2) : usdAmount.toFixed(0);
        newPotBalances[contractAddress] = `$${formattedAmount}`;
        console.log(`💰 ${marketName} pot balance: ${formatUnits(balance.value, 18)} ETH = ${newPotBalances[contractAddress]}`);
      }
    });

    setPotBalances(newPotBalances);
  }, [balancesData, ethPrice, contractAddresses]);

  const handleRemoveBookmark = async (marketId: string) => {
    if (!address) return;

    try {
      setRemoving(marketId);
      const result = await removeBookmark(address, marketId);
      
      if (result.success) {
        // Remove from local state
        setBookmarks(prev => prev.filter(bookmark => bookmark.marketId !== marketId));
      } else {
        console.error('Failed to remove bookmark:', result.message);
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    } finally {
      setRemoving(null);
    }
  };


  const handleViewMarket = (bookmark: BookmarkItem) => {
    if (bookmark.contractAddress) {
      // Set cookies for market navigation if contract address is available
      Cookies.set('selectedMarket', bookmark.contractAddress, { 
        sameSite: 'lax',
        expires: 7 
      });
      
      Cookies.set('selectedMarketQuestion', bookmark.marketQuestion, { 
        sameSite: 'lax',
        expires: 7 
      });

      // Navigate to dashboard/prediction page
      setTimeout(() => {
        setActiveSection('dashboard');
      }, 200);
    } else {
      // Fallback: navigate to home and show the market category
      setActiveSection('home');
      // Could potentially set the selected market category here if needed
    }
  };

  const handleMarketClick = (contractAddress: string) => {
    Cookies.set('selectedMarket', contractAddress);
    setActiveSection('bitcoinPot');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to view your bookmarked pots.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen title="Prediwin" subtitle="Loading your bookmarks..." />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-8 h-8 text-purple-700" />
            <h1 className="text-3xl font-bold text-gray-900">Your Pots</h1>
          </div>
          <p className="text-gray-600">Pots you've bookmarked and entered</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('entered')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'entered'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy className="w-5 h-5" />
            Entered pots
            {userPots.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                activeTab === 'entered' ? 'bg-green-100' : 'bg-gray-200'
              }`}>
                {userPots.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            Bookmarked
            {bookmarks.length > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                activeTab === 'bookmarks' ? 'bg-purple-100' : 'bg-gray-200'
              }`}>
                {bookmarks.length}
              </span>
            )}
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'bookmarks' ? (
          /* Bookmarks Tab Content */
          bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No bookmarks yet</h2>
              <p className="text-gray-600 mb-6">Start bookmarking questions to see them here.</p>
              <button
                onClick={() => setActiveSection('home')}
                className="bg-purple-700 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Explore
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {bookmark.marketCategory}
                        </span>
                      </div>

                      {/* Market Question */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {bookmark.marketQuestion}
                      </h3>

                      {/* Market Name */}
                      <p className="text-gray-600 text-sm">
                        {bookmark.marketName}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveBookmark(bookmark.marketId)}
                      disabled={removing === bookmark.marketId}
                      className="ml-4 p-2 text-gray-400 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove bookmark"
                    >
                      {removing === bookmark.marketId ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleViewMarket(bookmark)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {bookmark.contractAddress ? 'View Pot' : 'Go to Category'}
                    </button>
                    {bookmark.contractAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full self-center">
                          Contract Available
                        </span>
                        {potBalances[bookmark.contractAddress] && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full self-center">
                            {potBalances[bookmark.contractAddress]} in pot
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Entered Markets Tab Content */
          userPots.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No pots entered yet</h2>
              <p className="text-gray-600 mb-6">Enter prediction pots to start competing and making predictions.</p>
              <button
                onClick={() => setActiveSection('home')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Find Pots to Enter
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-gray-900">Pots You've Entered</h2>
                {/* <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                  {userPots.length} Active
                </span> */}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPots.map((contractAddress) => {
                  const marketType = CONTRACT_ADDRESSES[contractAddress as keyof typeof CONTRACT_ADDRESSES];
                  const marketName = marketType === 'featured' ? 'Trending' : 'Crypto';
                  
                  return (
                    <button 
                      key={contractAddress}
                      onClick={() => handleMarketClick(contractAddress)}
                      className="text-left p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            {marketName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active Participant
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        You're participating in this pot. Click to make predictions and check your status.
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-green-600 font-medium">
                            Enter →
                          </div>
                          {potBalances[contractAddress] && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {potBalances[contractAddress]} in pot
                            </div>
                          )}
                        </div>
                        {/* <div className="text-xs text-gray-500 font-mono">
                          {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
                        </div> */}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Trophy className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">Your Active Pots</h4>
                    <p className="text-green-700 text-sm">
                      You're currently participating in {userPots.length} pot{userPots.length !== 1 ? 's' : ''}. 
                      Click on any pot above to make predictions and compete for the pot.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;