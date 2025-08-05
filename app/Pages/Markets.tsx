'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { ArrowRight, Search } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getMarkets } from '../Constants/allMarkets';


interface MarketsProps {
  setActiveSection: (section: string) => void;
}

const Markets = ({ setActiveSection }: MarketsProps) => {
  const [isVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLanguage] = useState<Language>(() => {
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

  const availableMarkets = ["bitcoin"];

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
                  className="group bg-white rounded-lg p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {/* Compact Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center">
                        {market.icon?.slice(0, 4) === 'http' ? (
                          <img src={market.icon} alt={`${market.name} Icon`} className="w-9 h-8" />
                        ) : (
                          <span className="text-sm text-gray-600">{market.icon}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-md font-semibold text-gray-900">{market.name}</h3>
                        <p className="text-xs text-gray-500">{market.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{market.currentPrice}</div>
                      <div className="text-xs text-gray-400 uppercase tracking-wide">Current</div>
                    </div>
                  </div>
                
                  {/* Compact Question */}
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
                      {market.question}
                    </p>
                  </div>
                
                  {/* Compact Trading Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button className="bg-white hover:bg-green-50 border border-gray-200 hover:border-green-500 text-gray-800 hover:text-green-700 py-1.5 px-2 rounded text-xs font-semibold uppercase tracking-wide transition-all duration-150">
                      YES
                    </button>
                    <button className="bg-white hover:bg-red-50 border border-gray-200 hover:border-red-500 text-gray-800 hover:text-red-700 py-1.5 px-2 rounded text-xs font-semibold uppercase tracking-wide transition-all duration-150">
                      NO
                    </button>
                  </div>
                
                  {/* Compact Stats Footer */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${availableMarkets.includes(market.name.toLowerCase()) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div className={`text-xs font-medium ${availableMarkets.includes(market.name.toLowerCase()) ? 'text-green-600' : 'text-red-600'}`}>
                        {availableMarkets.includes(market.name.toLowerCase()) ? 'Live' : 'Soon'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs font-semibold text-gray-900">{market.potSize}</div>
                      <div className="text-xs text-gray-400">Volume</div>
                    </div>
                    
                    <div className="text-center">
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-all duration-200" />
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
