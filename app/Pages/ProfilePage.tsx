import React, { useState, useEffect } from 'react';
import { Upload, Trophy, Award, Crown, Wallet, DollarSign, Zap, MessageCircle } from 'lucide-react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { saveImageUrl, getLatestImageUrl } from '../Database/actions';


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
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&crop=center');

  const { address, isConnected } = useAccount();

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
      }
    }
  };

  fetchImage();
}, [address]);

  // Mock user data
  const userStats = {
    totalEarnings: '$24,750',
    marketsWon: 127,
    accuracy: '73.2%',
    totalPredictions: 342,
    rank: 23
  };

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'CryptoOracle', earnings: '$89,420', marketsWon: 445, accuracy: '81.3%' },
    { rank: 2, name: 'MarketMaven', earnings: '$76,890', marketsWon: 398, accuracy: '79.8%' },
    { rank: 3, name: 'PredictionKing', earnings: '$65,230', marketsWon: 356, accuracy: '78.4%' },
    { rank: 4, name: 'TradeWizard', earnings: '$58,940', marketsWon: 321, accuracy: '76.9%' },
    { rank: 5, name: 'ForecastPro', earnings: '$52,110', marketsWon: 289, accuracy: '75.6%' },
    { rank: 22, name: 'SmartTrader', earnings: '$25,890', marketsWon: 134, accuracy: '74.1%' },
    { rank: 23, name: 'You', earnings: '$24,750', marketsWon: 127, accuracy: '73.2%', isCurrentUser: true },
    { rank: 24, name: 'MarketShark', earnings: '$23,640', marketsWon: 121, accuracy: '72.8%' },
    { rank: 25, name: 'ProfitSeeker', earnings: '$22,380', marketsWon: 118, accuracy: '72.3%' },
  ];

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
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-6 mb-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Wallet Balance</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* USDC Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">USDC Balance</div>
                    <div className="text-2xl font-bold">${formatUsdcBalance(userUsdcBalance)}</div>
                  </div>
                </div>
                {/* <div className="text-xs text-gray-400 mt-2">
                  For your predictions
                </div> */}
              </div>
              
              {/* ETH Balance */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">ETH Balance</div>
                    <div className="text-2xl font-bold">{formatEthBalanceUSD()}</div>
                  </div>
                </div>
                {/* <div className="text-xs text-gray-400 mt-2">
                  For gas fees
                </div> */}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setActiveSection('messagesPage')}
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 transition-all duration-200 group"
              >
                <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
                <span className="text-white font-medium">Messages</span>
              </button>
              
              <button
                onClick={() => setActiveSection('referralProgram')}
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20 transition-all duration-200 group"
              >
                <Trophy className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
                <span className="text-white font-medium">Referrals</span>
              </button>
            </div>
           
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* Profile Image Section */}
            <div className="flex-shrink-0 w-full sm:w-auto flex justify-center lg:justify-start">
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
            </div>

            {/* Main Info Section */}
            <div className="flex flex-col w-full gap-6 lg:gap-8">
              
              {/* Stats Grid - Responsive Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">{userStats.totalEarnings}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Total Earnings</div>
                </div>
                <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">{userStats.marketsWon}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Markets Won</div>
                </div>
                <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">{userStats.accuracy}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Accuracy</div>
                </div>
                <div className="text-center sm:text-left p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">#{userStats.rank}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Global Rank</div>
                </div>
              </div>

              {/* Trading Profile Content */}
              <div className="lg:flex-1">
                <h1 className="text-lg font-semibold text-gray-900 mb-4 text-center sm:text-left">Trading Profile</h1>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center sm:text-left">
                    <div className="text-gray-900 font-medium">{userStats.totalPredictions}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Total Predictions</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-gray-900 font-medium">8 Days</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Win Streak</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
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
        {leaderboard.map((user) => (
          <tr 
            key={user.rank} 
            className={`${user.isCurrentUser ? 'bg-gray-50 border-l-2 border-gray-400' : ''} hover:bg-gray-50 transition-colors`}
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
              <div className="flex flex-col">
                <span className={`text-sm font-medium truncate max-w-[80px] sm:max-w-none ${user.isCurrentUser ? 'text-gray-900' : 'text-gray-800'}`}>
                  {user.name}
                </span>
                {user.isCurrentUser && (
                  <span className="text-xs text-gray-500 uppercase tracking-wide">You</span>
                )}
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
                  {user.marketsWon} markets
                </span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
      </div>
    </div>
  );
};

export default ProfilePage;