'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getMarkets } from '../Constants/markets';

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const LandingPage = ({ activeSection, setActiveSection }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState('crypto');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Function to update arrow visibility
  const updateArrowVisibility = () => {
    const container = carouselRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const savedLang = Cookies.get('language') as Language | undefined;
    if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }
    setIsVisible(true);
  }, []);

  useEffect(() => {
  const detectLanguage = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      const isBrazil = data.country === 'BR';
      setCurrentLanguage(isBrazil ? 'pt-BR' : 'en');
    } catch (err) {
      console.error('Geo IP detection failed:', err);
      setCurrentLanguage('en'); // fallback
    }
  };
  detectLanguage();
}, []);


  // Update arrow visibility when selectedMarket changes
  useEffect(() => {
    // Use setTimeout to ensure DOM is updated after selectedMarket change
    const timer = setTimeout(() => {
      updateArrowVisibility();
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedMarket]);

  // Update arrow visibility on window resize
  useEffect(() => {
    const handleResize = () => {
      updateArrowVisibility();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initial arrow state check after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setShowLanguageDropdown(false);
    Cookies.set('language', language, { sameSite: 'lax' });
  };

  const t = getTranslation(currentLanguage);

  const markets = getMarkets(t, selectedMarket);
  const marketOptions = getMarkets(t, 'options');

  const handleMarketClick = (marketId: string) => {
    if (marketId === 'bitcoin') {
      setActiveSection('bitcoinPot');
    } else {
      alert(`${markets.find((m) => m.id === marketId)?.name} ${t.comingSoon}`);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollLeft = () => {
    const container = carouselRef.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = carouselRef.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#fefefe] text-[#111111] overflow-hidden -mt-32">
      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-16">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
          ></div>
        </div>
      </section>

      {/* Markets Grid */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 relative">
            {/* Market Carousel */}
            <div className="relative -translate-y-1/3">

              {/* Left Arrow - Only shown when there's content to scroll left */}
              {showLeftArrow && (
                <button
                  onClick={scrollLeft}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Right Arrow - Only shown when there's content to scroll right */}
              {showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Scrollable Markets Container */}
              <div
                ref={carouselRef}
                 className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-0 md:px-12 transform: md:-translate-x-12"
                onScroll={handleScroll}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {marketOptions.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => setSelectedMarket(market.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 hover:bg-[rgba(211,200,26,0.5)]  ${selectedMarket === market.id
                        ? 'border-[#d3c81a] bg-[rgba(211,200,26,0.5)] '
                        : 'border-gray-200 bg-white hover:border-[#d3c81a]'
                      }`}
                    style={{
                      minWidth: 'fit-content',
                      height: '40px',
                      
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{
                        backgroundColor: selectedMarket === market.id ? market.color : `${market.color}20`,
                        color: selectedMarket === market.id ? 'white' : market.color,
                      }}
                    >
                      {market.icon}
                    </div>

                    {/* Name */}
                    <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                      {market.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {markets.map((market) => (
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
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 px-6 py-20">
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