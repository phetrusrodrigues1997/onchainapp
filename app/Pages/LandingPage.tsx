'use client';

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Star, ArrowRight, ChevronDown } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const LandingPage = ({ activeSection, setActiveSection }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    const savedLang = Cookies.get('language') as Language | undefined;
    if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }
    setIsVisible(true);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setShowLanguageDropdown(false);
    Cookies.set('language', language, { sameSite: 'lax' });
  };

  const t = getTranslation(currentLanguage);

  const markets = [
    {
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: '₿',
      color: '#F7931A',
      question: t.bitcoinQuestion,
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
      question: t.ethereumQuestion,
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
      question: t.solanaQuestion,
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
      question: t.teslaQuestion,
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
      question: t.nvidiaQuestion,
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
      question: t.sp500Question,
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
      alert(`${markets.find((m) => m.id === marketId)?.name} ${t.comingSoon}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fefefe] text-[#111111] overflow-hidden -mt-32">
      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          ></div>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 relative">
            <h2 className="text-4xl text-[#111111] font-bold mb-4">
              {t.marketsTitle}
            </h2>

            {/* Language Selector */}
            <div className="absolute top-0 right-0">
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center space-x-2 bg-[#efefef] hover:bg-gray-200 px-3 py-2 rounded-xl border border-gray-200 transition-all text-sm"
                >
                  <span className="text-lg">
                    {supportedLanguages.find(lang => lang.code === currentLanguage)?.flag}
                  </span>
                  <span className="font-medium">
                    {supportedLanguages.find(lang => lang.code === currentLanguage)?.name}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showLanguageDropdown && (
                  <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[180px] overflow-hidden z-50">
                    {supportedLanguages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-all text-sm ${
                          currentLanguage === language.code ? 'bg-purple-50 text-purple-700' : ''
                        }`}
                      >
                        <span className="text-lg">{language.flag}</span>
                        <span className="font-medium">{language.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
              <div
                key={market.id}
                onClick={() => handleMarketClick(market.id)}
                className="group bg-[#f4f4f4] backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 cursor-pointer"
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
        </div>
      </section>

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

      <footer className="relative z-10 px-6 py-10 bg-white text-center text-[#666666] text-sm">
        &copy; {new Date().getFullYear()} {t.footerText}
      </footer>
    </div>
  );
};

export default LandingPage;
