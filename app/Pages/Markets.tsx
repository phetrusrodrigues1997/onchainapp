'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Star, ArrowRight, Search } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getMarkets } from '../Constants/allMarkets';


interface MarketsProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const Markets = ({ activeSection, setActiveSection }: MarketsProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
  const savedLang = Cookies.get('language');
  if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
    return savedLang as Language;
  }
  return 'en';
});


  // Update cookie when language changes
  useEffect(() => {
    Cookies.set('language', currentLanguage, { sameSite: 'lax' });
  }, [currentLanguage]);

  const t = getTranslation(currentLanguage);

  const markets = getMarkets(t);

  const filteredMarkets = markets.filter(market =>
    market.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMarketClick = (marketId: string) => {
    if (marketId === 'bitcoin') {
      setActiveSection('bitcoinPot');
    } else {
      alert(`${markets.find((m) => m.id === marketId)?.name} ${t.comingSoon}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fefefe] text-[#111111] overflow-hidden">
      {/* Hero Section with Search */}
      <section className="relative z-10 px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 text-lg bg-[#f3f3f3] border border-gray-200 rounded-2xl focus:outline-none focus:border-[#d3c81a] focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {filteredMarkets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">
                {t.noMarketsFound.replace('{query}', searchQuery)}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMarkets.map((market) => (
                <div
                  key={market.id}
                  onClick={() => handleMarketClick(market.id)}
                  className="group bg-[#fcfcfc] backdrop-blur-sm rounded-2xl p-6 border border-[#aaaaaa] hover:border-[#d3c81a] transition-all hover:transform hover:scale-105 cursor-pointer"
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
                        <h3 className="text-xl font-bold text-[#111111]">{market.name}</h3>
                        <p className="text-sm text-gray-400">{market.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#111111]">{market.currentPrice}</div>
                      <div className="text-sm text-gray-400">{t.currentPrice}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-lg font-semibold text-center text-[#111111] mb-4">
                      {market.question}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 py-3 rounded-xl font-bold transition-all group-hover:scale-105">
                      {t.higher}
                    </button>
                    <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-3 rounded-xl font-bold transition-all group-hover:scale-105">
                      {t.lower}
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-sm font-bold text-[#111111]">{market.participants}</div>
                      <div className="text-xs text-gray-400">{t.players}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: market.color }}>
                        {market.potSize}
                      </div>
                      <div className="text-xs text-gray-400">{t.potSize}</div>
                    </div>
                    <div className="text-center">
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t.howItWorksTitle}</h2>
            <p className="text-xl text-[#666666]">{t.howItWorksSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="text-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                  {step}
                </div>
                <h3 className="text-xl font-bold mb-4">{t[`step${step}Title` as keyof typeof t]}</h3>
                <p className="text-[#666666]">{t[`step${step}Description` as keyof typeof t]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-10 bg-white text-center text-[#666666] text-sm">
        &copy; {new Date().getFullYear()} {t.footerText}
      </footer>
    </div>
  );
};

export default Markets;
