import React, { useState, useEffect } from 'react';
import { Upload, Trophy, Award, Crown, Wallet, DollarSign, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { saveImageUrl, getLatestImageUrl, getUserStats, getLeaderboard, getUserRank } from '../Database/actions';
import { getPrice } from '../Constants/getPrice';


// Profile now tracks ETH earnings instead of USDC

interface ProfilePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const ETHToken = {
  chainId: 8453,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  image:"https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",

};

const ProfilePage = ({ setActiveSection }: ProfilePageProps) => {
  const defaultProfileImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&crop=center';
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [isMyStatsExpanded, setIsMyStatsExpanded] = useState(false);

  const { address, isConnected } = useAccount();

  // Real user data state
  const [userStats, setUserStats] = useState({
    totalEarnings: '$0.00',
    marketsWon: 0,
    accuracy: '0.0%',
    totalPredictions: 0,
    rank: null as number | null
  });

  // Real leaderboard data state
  const [leaderboardData, setLeaderboardData] = useState<{
    users: any[];
    currentUser: any | null;
    showSeparator: boolean;
    totalUsers: number;
  }>({
    users: [],
    currentUser: null,
    showSeparator: false,
    totalUsers: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  // Removed USDC balance reading - now using ETH

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address: address as `0x${string}`,
    query: { enabled: !!address && isConnected }
  });

  // State for ETH price
  const [ethPrice, setEthPrice] = useState<number>(0);

  // Fetch ETH price on mount
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getPrice('ETH');
        setEthPrice(price ?? 4700);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(4700); // Fallback price
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Removed USDC balance formatting

  // Helper function to convert ETH to USD
  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

  // Format ETH balance in USD
  const formatEthBalanceUSD = (): string => {
    if (!ethBalance?.value) return '$0.00';
    try {
      const usdValue = ethToUsd(ethBalance.value);
      return `$${usdValue.toFixed(2)}`;
    } catch {
      return '$0.00';
    }
  };
  useEffect(() => {
  const fetchImage = async () => {
    if (address) {
      const img = await getLatestImageUrl(address);
      if (img) {
        setProfileImage(img);
        setHasCustomImage(true);
      } else {
        setProfileImage(defaultProfileImage);
        setHasCustomImage(false);
      }
    }
  };

  fetchImage();
}, [address, defaultProfileImage]);

// Load user stats and leaderboard data
useEffect(() => {
  const loadData = async () => {
    if (!address) {
      setIsLoadingStats(false);
      setIsLoadingLeaderboard(false);
      return;
    }

    try {
      // Load user stats
      setIsLoadingStats(true);
      const stats = await getUserStats(address);
      const rank = await getUserRank(address);
      
      // Calculate placeholder accuracy (we'd need prediction data for real accuracy)
      const baseAccuracy = 65;
      // Note: Database still stores values as totalEarningsUSDC but they're now ETH values in wei
      // The database actions already convert to dollars, so stats.totalEarnings is already in USD format
      const earningsString = stats.totalEarnings || '$0.00';
      const earningsInDollars = parseFloat(earningsString.replace('$', '')) || 0;
      const performanceBonus = Math.min(15, (earningsInDollars / Math.max(stats.potsWon, 1)) * 2);
      const accuracy = Math.min(95, baseAccuracy + performanceBonus);
      
      setUserStats({
        totalEarnings: stats.totalEarnings,
        marketsWon: stats.potsWon,
        accuracy: `${accuracy.toFixed(1)}%`,
        totalPredictions: stats.potsWon * 3, // Rough estimate - we'd need real prediction data
        rank: rank
      });
      setIsLoadingStats(false);

      // Load leaderboard
      setIsLoadingLeaderboard(true);
      const leaderboard = await getLeaderboard(address);
      setLeaderboardData(leaderboard);
      setIsLoadingLeaderboard(false);

    } catch (error) {
      console.error('Error loading profile data:', error);
      setIsLoadingStats(false);
      setIsLoadingLeaderboard(false);
    }
  };

  loadData();
}, [address]);

interface UserStats {
    totalEarnings: string;
    marketsWon: number;
    accuracy: string;
    totalPredictions: number;
    rank: number;
}

interface LeaderboardUser {
    rank: number;
    name: string;
    earnings: string;
    marketsWon: number;
    accuracy: string;
    isCurrentUser?: boolean;
}

const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e: ProgressEvent<FileReader>) => {
    if (e.target && typeof e.target.result === 'string') {
      const base64Image = e.target.result;
      setProfileImage(base64Image); // Update UI
      setHasCustomImage(true); // Mark as having custom image

      if (address) {
        try {
          await saveImageUrl(address, base64Image); // Save to DB
          console.log("Image URL saved successfully");
        } catch (err) {
          console.error("Failed to save image:", err);
        }
      }
    }
  };
  reader.readAsDataURL(file);
};


  return (
    <div className="min-h-screen bg-[#fdfdfd] py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        
        {/* Wallet Balance Section */}
        {isConnected && address && (
          <div className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-xl md:rounded-2xl p-3 md:p-4 mb-3 md:mb-4 text-white shadow-2xl shadow-purple-900/20 overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-700/10 via-gray-600/10 to-black/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-purple-1000/20 to-gray-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-tr from-purple-400/20 to-white/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="p-1.5 md:p-2 bg-gradient-to-br from-white/20 to-white/10 rounded-lg md:rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
                  <Wallet className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                    Wallet Overview
                  </h2>
                 
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                {/* ETH Balance - Takes 2/3 on desktop */}
                <div className="md:col-span-2 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-transparent rounded-lg md:rounded-xl flex items-center justify-center  group-hover:scale-105 transition-transform duration-300">
                      <img 
      src={ETHToken.image} 
      alt="ETH"
      className="w-8 h-8 md:w-12 md:h-12 object-cover" // match approx. text-md size (~1.25rem = 20px)
    />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-300 font-medium uppercase tracking-wider mb-0.5">
                        Portfolio Value
                      </div>
                      <div className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                        {formatEthBalanceUSD()}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        ETH on Base Network
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Button - Takes 1/3 on desktop, full width on mobile */}
                <div className="md:col-span-1 flex flex-col gap-1.5 md:gap-2">
                  <button
                    onClick={() => setActiveSection('referralProgram')}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg md:rounded-xl px-3 py-2 md:py-2.5 border border-purple-1000/50 transition-all duration-300 group shadow-lg hover:shadow-purple-1000/25 hover:scale-105"
                  >
                    <Trophy className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-white text-xs md:text-sm font-semibold">Referrals</span>
                  </button>
                </div>
              </div>
            </div>
           
          </div>
        )}

        {/* My Stats - Collapsible Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6 shadow-sm hover:shadow-md transition-all duration-300">
          {/* Header with toggle */}
          <div 
            className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/30 transition-all duration-300 group"
            onClick={() => setIsMyStatsExpanded(!isMyStatsExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-700 rounded-lg shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                Tap for Stats & Earnings
              </h2>
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full animate-pulse">
                <Zap className="w-3 h-3" />
                <span>New</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              
              {isMyStatsExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
              )}
            </div>
          </div>

          {/* Collapsible Content */}
          {isMyStatsExpanded && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start pt-4">

                {/* Profile Image Section */}
                <div className="flex-shrink-0 w-full sm:w-auto flex flex-col items-center lg:items-start">
                  <div className="relative group w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 cursor-pointer">
                      <Upload className="text-white opacity-0 group-hover:opacity-100 w-5 h-5 sm:w-6 sm:h-6" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {!hasCustomImage && (
                    <p className="text-xs text-gray-500 mt-2 text-center lg:text-left">Set profile image</p>
                  )}
                </div>

                {/* Main Info Section */}
                <div className="flex flex-col w-full gap-6 lg:gap-8">
                  
                  {/* Stats Grid - Responsive Layout */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                    <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-16 rounded mx-auto sm:mx-0"></div>
                        ) : (
                          userStats.totalEarnings
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Total Earnings</div>
                    </div>
                    <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-12 rounded mx-auto sm:mx-0"></div>
                        ) : (
                          userStats.marketsWon
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Pots Won</div>
                    </div>
                    <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-14 rounded mx-auto sm:mx-0"></div>
                        ) : (
                          userStats.accuracy
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Win Rate</div>
                    </div>
                    <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                      <div className="text-xl sm:text-2xl font-semibold text-gray-900">
                        {isLoadingStats ? (
                          <div className="animate-pulse bg-gray-300 h-6 w-12 rounded mx-auto sm:mx-0"></div>
                        ) : (
                          userStats.rank ? `#${userStats.rank}` : 'Unranked'
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Global Rank</div>
                    </div>
                  </div>

                  {/* Trading Profile Content */}
                  <div className="lg:flex-1">
                    <h1 className="text-lg font-semibold text-gray-900 mb-4 text-center sm:text-left">Prediction History</h1>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center sm:text-left">
                        <div className="text-gray-900 font-medium">
                          {isLoadingStats ? (
                            <div className="animate-pulse bg-gray-300 h-5 w-8 rounded mx-auto sm:mx-0"></div>
                          ) : (
                            `${userStats.totalPredictions}+`
                          )}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Est. Predictions</div>
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="text-gray-900 font-medium">
                          {isLoadingStats ? (
                            <div className="animate-pulse bg-gray-300 h-5 w-12 rounded mx-auto sm:mx-0"></div>
                          ) : (
                            userStats.marketsWon > 0 ? 'Active' : 'New Trader'
                          )}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
<div className="bg-white rounded-lg border border-gray-200">
  <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
    <h2 className="text-lg font-semibold text-gray-900">Global Leaderboard</h2>
  </div>
  
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader</th>
          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Pots Won</th>
          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {isLoadingLeaderboard ? (
          // Loading skeleton
          [...Array(10)].map((_, index) => (
            <tr key={`loading-${index}`} className="hover:bg-gray-50 transition-colors">
              <td className="px-2 sm:px-6 py-3 whitespace-nowrap">
                <div className="animate-pulse bg-gray-300 h-4 w-8 rounded"></div>
              </td>
              <td className="px-2 sm:px-6 py-3">
                <div className="animate-pulse bg-gray-300 h-4 w-24 rounded"></div>
              </td>
              <td className="px-2 sm:px-6 py-3 whitespace-nowrap">
                <div className="animate-pulse bg-gray-300 h-4 w-16 rounded"></div>
              </td>
              <td className="px-2 sm:px-6 py-3 whitespace-nowrap hidden sm:table-cell">
                <div className="animate-pulse bg-gray-300 h-4 w-8 rounded"></div>
              </td>
              <td className="px-2 sm:px-6 py-3">
                <div className="animate-pulse bg-gray-300 h-4 w-12 rounded"></div>
              </td>
            </tr>
          ))
        ) : leaderboardData.totalUsers === 0 ? (
          // Empty state
          <tr>
            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
              <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p>No leaderboard data yet. Be the first to win a pot!</p>
            </td>
          </tr>
        ) : (
          <>
            {/* Top 10 Users */}
            {leaderboardData.users.map((user) => (
              <tr 
                key={user.rank} 
                className={`${user.isCurrentUser ? 'bg-blue-50 border-l-2 border-blue-400' : ''} hover:bg-gray-50 transition-colors`}
              >
                <td className="px-2 sm:px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-900">#{user.rank}</span>
                    {user.rank <= 3 && (
                      <Crown className={`w-3 h-3 ml-1 ${user.rank === 1 ? 'text-yellow-500' : user.rank === 2 ? 'text-gray-400' : 'text-amber-600'}`} />
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3">
                  <div className="flex items-center gap-2">
                    {/* Profile Picture */}
                    {user.imageUrl ? (
                      <img 
                        src={user.imageUrl} 
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-base text-gray-600 font-medium">
                          {user.name.charAt(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col min-w-0">
                      <span className={`text-sm font-medium truncate max-w-[80px] sm:max-w-none ${user.isCurrentUser ? 'text-blue-900 font-semibold' : 'text-gray-800'}`}>
                        {user.name}
                      </span>
                      {user.isCurrentUser && (
                        <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">You</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {user.earnings}
                </td>
                <td className="px-2 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-800 hidden sm:table-cell">
                  {user.marketsWon}
                </td>
                <td className="px-2 sm:px-6 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{user.accuracy}</span>
                    <span className="text-xs text-gray-500 sm:hidden">
                      {user.marketsWon} pots
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {/* Separator Row (if user is outside top 10) */}
            {leaderboardData.showSeparator && (
              <tr className="bg-gray-100">
                <td colSpan={5} className="px-6 py-2 text-center">
                  <div className="flex items-center justify-center">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-4 text-xs text-gray-500 font-medium">• • •</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                </td>
              </tr>
            )}

            {/* Current User Position (if outside top 10) */}
            {leaderboardData.currentUser && leaderboardData.showSeparator && (
              <tr className="bg-blue-50 border-l-2 border-blue-400 hover:bg-blue-100 transition-colors">
                <td className="px-2 sm:px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-blue-900">#{leaderboardData.currentUser.rank}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3">
                  <div className="flex items-center gap-2">
                    {/* Profile Picture */}
                    {leaderboardData.currentUser.imageUrl ? (
                      <img 
                        src={leaderboardData.currentUser.imageUrl} 
                        alt={leaderboardData.currentUser.name}
                        className="w-16 h-16 rounded-full object-cover border border-blue-300"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center">
                        <span className="text-base text-blue-700 font-medium">
                          {leaderboardData.currentUser.name.charAt(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-blue-900 truncate max-w-[80px] sm:max-w-none">
                        {leaderboardData.currentUser.name}
                      </span>
                      <span className="text-xs text-blue-600 uppercase tracking-wide font-medium">You</span>
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                  {leaderboardData.currentUser.earnings}
                </td>
                <td className="px-2 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-800 hidden sm:table-cell">
                  {leaderboardData.currentUser.marketsWon}
                </td>
                <td className="px-2 sm:px-6 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-800">{leaderboardData.currentUser.accuracy}</span>
                    <span className="text-xs text-gray-500 sm:hidden">
                      {leaderboardData.currentUser.marketsWon} pots
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </>
        )}
      </tbody>
    </table>
  </div>
</div>
      </div>
    </div>
  );
};

export default ProfilePage;