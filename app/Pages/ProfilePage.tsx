import React, { useState } from 'react';
import { Upload, Trophy, Award, Crown } from 'lucide-react';
import { useAccount } from 'wagmi';
import { saveImageUrl } from '../Database/actions';
import { getLatestImageUrl } from '../Database/actions'; // adjust path
import { useEffect } from 'react'; // Add to top


const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop&crop=center');

  const { address } = useAccount();
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
    potsWon: 127,
    accuracy: '73.2%',
    totalPredictions: 342,
    rank: 23
  };

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'CryptoOracle', earnings: '$89,420', potsWon: 445, accuracy: '81.3%' },
    { rank: 2, name: 'MarketMaven', earnings: '$76,890', potsWon: 398, accuracy: '79.8%' },
    { rank: 3, name: 'PredictionKing', earnings: '$65,230', potsWon: 356, accuracy: '78.4%' },
    { rank: 4, name: 'TradeWizard', earnings: '$58,940', potsWon: 321, accuracy: '76.9%' },
    { rank: 5, name: 'ForecastPro', earnings: '$52,110', potsWon: 289, accuracy: '75.6%' },
    { rank: 22, name: 'SmartTrader', earnings: '$25,890', potsWon: 134, accuracy: '74.1%' },
    { rank: 23, name: 'You', earnings: '$24,750', potsWon: 127, accuracy: '73.2%', isCurrentUser: true },
    { rank: 24, name: 'MarketShark', earnings: '$23,640', potsWon: 121, accuracy: '72.8%' },
    { rank: 25, name: 'ProfitSeeker', earnings: '$22,380', potsWon: 118, accuracy: '72.3%' },
  ];

interface UserStats {
    totalEarnings: string;
    potsWon: number;
    accuracy: string;
    totalPredictions: number;
    rank: number;
}

interface LeaderboardUser {
    rank: number;
    name: string;
    earnings: string;
    potsWon: number;
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
                <div className="text-center sm:text-left">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">{userStats.totalEarnings}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Total Earnings</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">{userStats.potsWon}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Pots Won</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xl sm:text-2xl font-semibold text-gray-900">{userStats.accuracy}</div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Accuracy</div>
                </div>
                <div className="text-center sm:text-left">
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
              {user.potsWon}
            </td>
            <td className="px-2 sm:px-6 py-3">
              <div className="flex flex-col">
                <span className="text-sm text-gray-800">{user.accuracy}</span>
                <span className="text-xs text-gray-500 sm:hidden">
                  {user.potsWon} pots
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