'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getMarkets } from '../Constants/markets';

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const contractAddresses = {
  Featured: '0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794',
  Crypto: '0xD4B6F1CF1d063b760628952DDf32a44974129697',
  solana: '0xSolanaAddress...'
} as const;

const LandingPage = ({ activeSection, setActiveSection }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [selectedMarket, setSelectedMarket] = useState('Featured');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const availableMarkets = ["featured - random topics", "crypto"];



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


  const t = getTranslation(currentLanguage);

  const markets = getMarkets(t, selectedMarket);
  const marketOptions = getMarkets(t, 'options');

  
const handleMarketClick = (marketId: string) => {
  if (contractAddresses[marketId as keyof typeof contractAddresses]) {
    const contractAddress = contractAddresses[marketId as keyof typeof contractAddresses];
    console.log('Selected market:', marketId, 'Contract address:', contractAddress);
    // Set the cookie with proper options
    Cookies.set('selectedMarket', contractAddress, { 
      sameSite: 'lax',
      expires: 7 // Cookie expires in 7 days
    });
    
    // Optional: Add a small delay to ensure cookie is set before navigation
    setTimeout(() => {
      setActiveSection('bitcoinPot');
    }, 200);
    
    console.log('Set cookie selectedMarket:', contractAddress); // Debug log
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
    <div className="min-h-screen bg-[#fbfbfb] text-[#111111] overflow-hidden -mt-32 md:-mt-40">
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
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200  ${selectedMarket === market.id
                        ? 'border-[#666666] '
                        : 'hover:border-[#666666] font-bold'
                      }`}
                    style={{
                      minWidth: 'fit-content',
                      height: '40px',
                      
                    }}
                  >
                    {/* Icon */}
                    {selectedMarket === market.id && (
  <div
    className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0"
    style={{
      color: 'black',
    }}
  >
    {market.icon}
  </div>
)}


                    {/* Name */}
                    <span
  className={`text-sm whitespace-nowrap text-gray-800 ${
    selectedMarket === market.id ? 'font-bold' : 'font-medium'
  }`}
>
  {market.name}
</span>

                  </button>
                ))}
              </div>
            </div>
          </div>

          
          
<div className={`max-w-md mx-auto ${selectedMarket === 'Crypto' || selectedMarket.toLowerCase() === 'crypto' || markets[0].name?.toLowerCase().includes('crypto') ? '-translate-y-6' : '-translate-y-12'}`} >

  <div 
    onClick={() => handleMarketClick(markets[0].id)}
    className="group bg-white rounded-xl p-4 border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
  >
    
    {/* Background Gradient Accent */}
    <div className="absolute top-0 left-0 right-0 h-1 "></div>
    
    {/* Header with Icon and Price */}
    <div className="flex flex-col items-center mb-2">
      <div className="flex items-center justify-center mb-1">
        <div className={`rounded-xl flex items-center justify-center ${
  selectedMarket === 'Featured' ? 'w-70 h-58' : 'w-38 h-24'
}`}>
  {markets[0].icon?.slice(0, 4) === 'http' ? (
    <img 
      src={markets[0].icon} 
      alt={`${markets[0].name} Icon`} 
      className={selectedMarket === 'Featured' ? 'w-70 h-54 object-contain' : 'w-38 h-24 object-contain'} 
    />
  ) : (
    <span className="text-lg text-white">{markets[0].icon}</span>
  )}
</div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{markets[0].name}</h2>
        <p className="text-sm text-gray-500 font-medium">{markets[0].symbol}</p>
      </div>
    </div>

    {/* Question */}
    <div className="mb-3">
      <p className="text-lg font-semibold text-gray-800 leading-snug text-center">
        {markets[0].question}
      </p>
    </div>

    {/* Trading Buttons */}
    <div className="grid grid-cols-2 gap-3 mb-2">
      <button className="bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-400 text-green-700 py-3 px-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-150 hover:scale-105">
        YES
      </button>
      <button className="bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 text-red-700 py-3 px-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-150 hover:scale-105">
        NO
      </button>
    </div>

    {/* Stats Footer */}
    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
      <div className="flex items-center space-x-2">
<div
  className={`w-2.5 h-2.5 rounded-full ${
    availableMarkets.includes(markets[0].name.toLowerCase())
      ? 'bg-green-500 animate-pulse'
      : 'bg-red-500'
  }`}
></div>        <span className={`text-sm font-medium ${availableMarkets.includes(markets[0].name.toLowerCase()) ? 'text-green-600' : 'text-red-600'}`}>
          {availableMarkets.includes(markets[0].name.toLowerCase()) ? 'Live' : 'Soon'}
        </span>
      </div>
      
      <div className="text-center">
        <div className="text-sm font-bold text-gray-900">{markets[0].potSize}</div>
        <div className="text-xs text-gray-400">Volume</div>
      </div>
      
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
    </div>
  </div>
</div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 px-6 mt-16 ">
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