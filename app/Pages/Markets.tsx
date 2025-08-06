'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Trophy, Clock, TrendingUp, Users } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';

interface MarketsProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

// Mock data for recent winners
const recentWinners = [
  {
    id: 1,
    username: "CryptoKing",
    potName: "Fashion Pot",
    earnings: "$2,400",
    timeAgo: "2 hours ago",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center",
    category: "Fashion",
    description: "Predicted that sustainable fashion brands would outperform luxury brands in Q4"
  },
  {
    id: 2,
    username: "TechWiz",
    potName: "Tech Innovation Pot",
    earnings: "$1,800",
    timeAgo: "5 hours ago",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop&crop=center",
    category: "Technology",
    description: "Correctly predicted Apple's quarterly earnings would exceed expectations"
  },
  {
    id: 3,
    username: "SportsFan",
    potName: "Sports Betting Pot",
    earnings: "$3,200",
    timeAgo: "1 day ago",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop&crop=center",
    category: "Sports",
    description: "Won big on predicting the underdog team's championship victory"
  },
  {
    id: 4,
    username: "EcoPredictor",
    potName: "Climate Action Pot",
    earnings: "$1,500",
    timeAgo: "2 days ago",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop&crop=center",
    category: "Environment",
    description: "Successfully predicted renewable energy adoption rates for 2024"
  },
  {
    id: 5,
    username: "MovieBuff",
    potName: "Entertainment Pot",
    earnings: "$900",
    timeAgo: "3 days ago",
    image: "https://images.unsplash.com/photo-1489599804799-ace913254dce?w=400&h=300&fit=crop&crop=center",
    category: "Entertainment",
    description: "Predicted box office numbers for the latest blockbuster movie"
  },
  {
    id: 6,
    username: "FoodieOracle",
    potName: "Food Trends Pot",
    earnings: "$750",
    timeAgo: "4 days ago",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop&crop=center",
    category: "Food",
    description: "Correctly predicted the rise of plant-based protein alternatives"
  }
];

// Mock statistics
const platformStats = {
  totalWinnings: "$127,500",
  activeUsers: "2,847",
  livePots: "23",
  weeklyGrowth: "+15.3%"
};

const Markets = ({ activeSection, setActiveSection }: MarketsProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [currentLanguage] = useState<Language>(() => {
    const savedLang = Cookies.get('language');
    if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
      return savedLang as Language;
    }
    return 'en';
  });

  useEffect(() => {
    setIsVisible(true);
    Cookies.set('language', currentLanguage, { sameSite: 'lax' });
  }, [currentLanguage]);

  // Auto-rotate slideshow every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWinnerIndex((prevIndex) => 
        (prevIndex + 1) % recentWinners.length
      );
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const t = getTranslation(currentLanguage);

  return (
    <div className="min-h-screen bg-[#fefefe] text-[#111111] overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            
            {/* Platform Stats - Clean Apple Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-thin text-gray-900 mb-2">{platformStats.totalWinnings}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Winnings</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-thin text-gray-900 mb-2">{platformStats.activeUsers}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-thin text-gray-900 mb-2">{platformStats.livePots}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Live Pots</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-thin text-green-600 mb-2">{platformStats.weeklyGrowth}</div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">Weekly Growth</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Winner Slideshow */}
      <section className="relative z-10 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="relative h-[400px] overflow-hidden">
            {recentWinners.map((winner, index) => (
              <div
                key={winner.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentWinnerIndex 
                    ? 'opacity-100 translate-x-0' 
                    : index < currentWinnerIndex 
                      ? 'opacity-0 -translate-x-full' 
                      : 'opacity-0 translate-x-full'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-center h-full">
                  {/* Image Section - Reduced from 3/5 to 1/2 */}
                  <div className="w-full lg:w-1/2 h-full relative">
                    <img
                      src={winner.image}
                      alt={winner.category}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                  </div>
                  
                  {/* Content Section - Increased from 2/5 to 1/2 */}
                  <div className="w-full lg:w-1/2 px-6 lg:px-16 py-6 lg:py-0 flex items-center h-full">
                    <div className="max-w-md mx-auto lg:mx-0">
                      {/* Winner Badge - Sleeker */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-light text-gray-400 uppercase tracking-widest">Winner</span>
                      </div>
                      
                      {/* Winner Info - More refined typography */}
                      <div className="mb-4">
                        <h2 className="text-3xl lg:text-4xl font-light text-gray-900 mb-3 tracking-tight">{winner.username}</h2>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-medium text-green-600">{winner.earnings}</span>
                          <span className="text-base font-light text-gray-500">from {winner.potName}</span>
                        </div>
                        <p className="text-sm font-light text-gray-600 leading-relaxed mb-4">
                          {winner.description}
                        </p>
                      </div>
                      
                      {/* Meta Info - Cleaner */}
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 font-light rounded-full">
                          {winner.category}
                        </span>
                        <span className="font-light">{winner.timeAgo}</span>
                      </div>
                      
                      {/* Action Button - More refined */}
                      <button 
                        onClick={() => setActiveSection('bitcoinPot')}
                        className="px-6 py-3 bg-gray-900 text-white text-sm font-light rounded-full hover:bg-gray-800 transition-all duration-300 hover:scale-105 tracking-wide"
                      >
                        Start Predicting
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Slideshow Indicators */}
          <div className="flex justify-center mt-8 gap-2">
            {recentWinners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentWinnerIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentWinnerIndex 
                    ? 'bg-gray-900 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action - Minimalist */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-6xl font-thin mb-8 text-gray-900">Ready to Win Big?</h2>
          <p className="text-2xl font-light text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of predictors and start earning from your insights
          </p>
          <button 
            onClick={() => setActiveSection('bitcoinPot')}
            className="px-12 py-4 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 hover:scale-105 text-lg"
          >
            Browse Active Pots
          </button>
        </div>
      </section>

      {/* Footer - Clean */}
      <footer className="relative z-10 px-6 py-16 text-center text-gray-500 text-sm">
        <p className="font-light">&copy; {new Date().getFullYear()} Foresight - Survival of the Brightest</p>
        <p className="mt-2 text-xs font-light text-gray-400">
          Prediction markets for entertainment purposes only. Please predict responsibly.
        </p>
      </footer>
    </div>
  );
};

export default Markets;