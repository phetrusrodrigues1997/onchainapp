'use client';

import React, { useState, useEffect } from 'react';
import { Star, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const LandingPage = ({ activeSection, setActiveSection }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const markets = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: '₿',
      color: '#F7931A',
      question: 'Will Bitcoin end the day higher?',
      icon: '₿',
      currentPrice: '$67,234',
      participants: 127,
      potSize: '$1,270',
    },
    {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'Ξ',
      color: '#627EEA',
      question: 'Will Ethereum end the day higher?',
      icon: 'Ξ',
      currentPrice: '$3,456',
      participants: 89,
      potSize: '$890',
    },
    {
      id: 'solana',
      name: 'Solana',
      symbol: 'SOL',
      color: '#9945FF',
      question: 'Will Solana end the day higher?',
      icon: '◎',
      currentPrice: '$198',
      participants: 64,
      potSize: '$640',
    },
    {
      id: 'tesla',
      name: 'Tesla',
      symbol: 'TSLA',
      color: '#E31837',
      question: 'Will Tesla stock end the day higher?',
      icon: '🚗',
      currentPrice: '$248.50',
      participants: 156,
      potSize: '$1,560',
    },
    {
      id: 'nvidia',
      name: 'NVIDIA',
      symbol: 'NVDA',
      color: '#76B900',
      question: 'Will NVIDIA stock end the day higher?',
      icon: '🎮',
      currentPrice: '$876.20',
      participants: 203,
      potSize: '$2,030',
    },
    {
      id: 'sp500',
      name: 'S&P 500',
      symbol: 'SPX',
      color: '#1f77b4',
      question: 'Will S&P 500 end the day higher?',
      icon: '📈',
      currentPrice: '5,987',
      participants: 78,
      potSize: '$780',
    },
  ];

  const handleMarketClick = (marketId: string) => {
    if (marketId === 'bitcoin') {
      setActiveSection('bitcoinPot');
    } else {
      alert(`${markets.find((m) => m.id === marketId)?.name} market coming soon!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-black overflow-hidden">
      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
           

            {/* <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
               Choose Your Market
              </span>
              <br />
            </h1> */}

            
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            
            <h2 className="text-4xl font-bold mb-4">
              Will you predict higher or lower?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <div
                key={market.id}
                onClick={() => handleMarketClick(market.id)}
                className="group bg-[#ededed] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                      style={{
                        backgroundColor: `${market.color}20`,
                        color: market.color,
                      }}
                    >
                      {market.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black">{market.name}</h3>
                      <p className="text-sm text-gray-400">{market.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-black">{market.currentPrice}</div>
                    <div className="text-sm text-gray-400">Current Price</div>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-lg font-semibold text-center text-black mb-4">
                    {market.question}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 py-3 rounded-xl font-bold transition-all group-hover:scale-105">
                    📈 Higher
                  </button>
                  <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-3 rounded-xl font-bold transition-all group-hover:scale-105">
                    📉 Lower
                  </button>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-sm font-bold text-black">{market.participants}</div>
                    <div className="text-xs text-gray-400">Players</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold" style={{ color: market.color }}>
                      {market.potSize}
                    </div>
                    <div className="text-xs text-gray-400">Pot Size</div>
                  </div>
                  <div className="text-center">
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-[#666666]">Simple 3-step process to start winning</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold mb-4">Choose Your Market</h3>
              <p className="text-[#666666]">
                Pick from Bitcoin, Ethereum, Tesla, and more. Each market has its own daily pot.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold mb-4">Make Your Prediction</h3>
              <p className="text-[#666666]">
                Will it end higher or lower? Pay the entry fee and lock in your prediction for the day.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold mb-4">Win or Lose</h3>
              <p className="text-[#666666]">
                If your prediction is correct, you share the pot with other winners. Wrong guess? Try again tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-10 bg-[#111827] text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Foresight Markets — All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
