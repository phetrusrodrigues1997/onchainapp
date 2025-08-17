'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, Trophy, Users, Clock } from 'lucide-react';
import Cookies from 'js-cookie';

interface DashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  selectedMarket?: string;
}

const Dashboard = ({ activeSection, setActiveSection, selectedMarket }: DashboardProps) => {
  const [currentDay, setCurrentDay] = useState('');
  const [currentEntryFee, setCurrentEntryFee] = useState('0.00');
  const [timeUntilClose, setTimeUntilClose] = useState('');
  const [marketInfo, setMarketInfo] = useState({ name: '', section: '', address: '' });

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
      console.log('Selected market address from cookie:', selectedMarketAddress);
      
      // Map contract addresses to market info
      if (selectedMarketAddress === '0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794') {
        setMarketInfo({ 
          name: '', 
          section: 'bitcoinPot',
          address: selectedMarketAddress 
        });
      } else if (selectedMarketAddress === '0xD4B6F1CF1d063b760628952DDf32a44974129697') {
        setMarketInfo({ 
          name: '', 
          section: 'bitcoinPot',  // Both markets use the same section, PredictionPotTest handles the difference
          address: selectedMarketAddress 
        });
      } else {
        // Default to Bitcoin market if no cookie or unknown address
        setMarketInfo({ 
          name: 'Bitcoin Market', 
          section: 'bitcoinPot',
          address: '0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794' 
        });
      }
    };

    updateDashboard();
    getSelectedMarket();
    const interval = setInterval(updateDashboard, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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
            className="absolute top-4 right-4 md:top-6 md:right-6 bg-[#0000aa] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm md:text-base font-medium shadow-lg hover:shadow-xl"
            style={{
              animation: 'subtlePulse 2s infinite'
            }}
          >
            Enter Market →
          </button>
          
          {/* Custom CSS for subtle pulse */}
          <style jsx>{`
            @keyframes subtlePulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.04); opacity: 0.8; }
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
            <h3 className="text-lg md:text-xl font-bold mb-4 max-w-[calc(100%-140px)] md:max-w-none mx-auto">
              {marketInfo.name}
            </h3>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveSection('makePredictions')}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Make Predictions</h4>
              <p className="text-sm text-gray-600">Predict on markets you've already entered</p>
            </button>
            
            <button 
              onClick={() => setActiveSection('createPot')}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Create Private Market</h4>
              <p className="text-sm text-gray-600">Deploy your own prediction market</p>
            </button>
            
            <button 
              onClick={() => setActiveSection('AI')}
              className="text-left p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
              <h4 className="font-semibold mb-1">Play Games</h4>
              <p className="text-sm text-gray-600">AI trivia and other games</p>
            </button>
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