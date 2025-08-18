import React, { useState, useEffect } from 'react';
import { Upload, Trophy, Award, Crown, Wallet, DollarSign, Zap, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { saveImageUrl, getLatestImageUrl, getUserStats, getLeaderboard, getUserRank } from '../Database/actions';


// USDC Contract ABI (minimal)
const USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

interface ProfilePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const ProfilePage = ({ setActiveSection }: ProfilePageProps) => {
  const defaultProfileImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&crop=center';
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [hasCustomImage, setHasCustomImage] = useState(false);
  const [isMyStatsExpanded, setIsMyStatsExpanded] = useState(true);

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

  // Get USDC balance
  const { data: userUsdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && isConnected }
  }) as { data: bigint | undefined };

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
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum?.usd || 0);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
        setEthPrice(3500); // Fallback price
      }
    };
    fetchEthPrice();
  }, []);

  // Format USDC balance
  const formatUsdcBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.00';
    try {
      const formatted = formatUnits(balance, 6);
      return parseFloat(formatted).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  // Format ETH balance in USD
  const formatEthBalanceUSD = (): string => {
    if (!ethBalance?.value || !ethPrice) return '$0.00';
    try {
      const ethAmount = parseFloat(formatUnits(ethBalance.value, 18));
      const usdValue = ethAmount * ethPrice;
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
      const earningsInDollars = stats.totalEarningsUSDC / 1000000;
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
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-3 mb-3 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-white/10 rounded-lg backdrop-blur-sm">
                <Wallet className="w-3 h-3" />
              </div>
              <h2 className="text-base font-bold">Wallet Balance</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* USDC Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-300">USDC Balance</div>
                    <div className="text-base font-bold">${formatUsdcBalance(userUsdcBalance)}</div>
                  </div>
                </div>
              </div>
              
              {/* ETH Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <Zap className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-300">ETH Balance</div>
                    <div className="text-base font-bold">{formatEthBalanceUSD()}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-2 flex flex-col sm:flex-row gap-1.5">
              <button
                onClick={() => setActiveSection('messagesPage')}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/20 transition-all duration-200 group"
              >
                <MessageCircle className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform duration-200" />
                <span className="text-white text-xs font-medium">Messages</span>
              </button>
              
              <button
                onClick={() => setActiveSection('referralProgram')}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/20 transition-all duration-200 group"
              >
                <Trophy className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform duration-200" />
                <span className="text-white text-xs font-medium">Referrals</span>
              </button>
            </div>
           
          </div>
        )}

        {/* My Stats - Collapsible Section */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">
          {/* Header with toggle */}
          <div 
            className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsMyStatsExpanded(!isMyStatsExpanded)}
          >
            <h2 className="text-lg font-semibold text-gray-900">My Stats</h2>
            {isMyStatsExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
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