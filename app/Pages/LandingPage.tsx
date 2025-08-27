'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getMarkets } from '../Constants/markets';
import { CustomAlert, useCustomAlert } from '../Components/CustomAlert';

interface LandingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  isMobileSearchActive?: boolean;
}

const contractAddresses = {
  Featured: '0x5AA958a4008b71d484B6b0B044e5387Db16b5CfD',
  Crypto: '0x53B8Cbc599142b29D92eA4eC74fCC4f59454AcD8',
  solana: '0xSolanaAddress...'
} as const;

const LandingPage = ({ activeSection, setActiveSection, isMobileSearchActive = false }: LandingPageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [selectedMarket, setSelectedMarket] = useState('Featured');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const { alertState, showAlert, closeAlert } = useCustomAlert();
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);
  const availableMarkets = ["random topics", "crypto"];
  
  



  // Function to update arrow visibility
  const updateArrowVisibility = () => {
    const container = carouselRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  

  

  // Function to get next Saturday midnight (pot closes)
  const getNextSaturdayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilSaturday;
    
    if (currentDay === 6) {
      // Saturday - next Saturday (next week)
      daysUntilSaturday = 7;
    } else {
      // Sunday (0) to Friday (5) - this Saturday
      daysUntilSaturday = 6 - currentDay;
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setHours(0, 0, 0, 0); // Midnight UTC
    return nextSaturday;
  };

  // Function to get next midnight
  const getNextMidnight = (): Date => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0); // Next midnight
    return midnight;
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

  // Auto-rotate market every 7 seconds (disabled when searching)
  useEffect(() => {
    if (searchQuery) return; // Don't auto-rotate when user is searching
    
    const interval = setInterval(() => {
      setSelectedMarket(prevMarket => {
        const currentMarketOptions = getMarkets(getTranslation(currentLanguage), 'options');
        const currentIndex = currentMarketOptions.findIndex(market => market.id === prevMarket);
        const nextIndex = (currentIndex + 1) % currentMarketOptions.length;
        return currentMarketOptions[nextIndex].id;
      });
    }, 17000);

    return () => clearInterval(interval);
  }, [currentLanguage, searchQuery]);

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSelectedMarket('Featured');
      return;
    }
    
    const currentMarketOptions = getMarkets(getTranslation(currentLanguage), 'options');
    const matchingMarket = currentMarketOptions.find(market => 
      market.name.toLowerCase().includes(query.toLowerCase()) ||
      market.id.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matchingMarket) {
      setSelectedMarket(matchingMarket.id);
    }
  };

  // Keyboard shortcut for search (forward slash)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const searchInput = document.querySelector('input[placeholder="Search markets..."]') as HTMLInputElement;
        if (searchInput && document.activeElement !== searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);


  const t = getTranslation(currentLanguage);

  const markets = getMarkets(t, selectedMarket);
  const marketOptions = getMarkets(t, 'options');

  
const handleMarketClick = (marketId: string) => {
  if (contractAddresses[marketId as keyof typeof contractAddresses]) {
    const contractAddress = contractAddresses[marketId as keyof typeof contractAddresses];
    console.log('Selected market:', marketId, 'Contract address:', contractAddress);
    
    // Find the market question
    const market = markets.find(m => m.id === marketId);
    const marketQuestion = market?.question || '';
    
    // Set the cookies with proper options
    Cookies.set('selectedMarket', contractAddress, { 
      sameSite: 'lax',
      expires: 7 // Cookie expires in 7 days
    });
    
    Cookies.set('selectedMarketQuestion', marketQuestion, { 
      sameSite: 'lax',
      expires: 7 // Cookie expires in 7 days
    });
    
    // Optional: Add a small delay to ensure cookie is set before navigation
    setTimeout(() => {
      setActiveSection('dashboard');
    }, 200);
    
  } else {
    showAlert(`${markets.find((m) => m.id === marketId)?.name} ${t.comingSoon}`, 'info', 'Coming Soon');
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
    <>
      <style>{`
        @keyframes pulse-right {
          0% { transform: translateX(0); }
          50% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes professional-glow {
          0%, 100% {
            box-shadow: 
              0 0 0 1px rgba(220, 38, 38, 0.3),
              0 0 8px rgba(220, 38, 38, 0.15),
              0 0 16px rgba(220, 38, 38, 0.1);
          }
          50% {
            box-shadow: 
              0 0 0 1px rgba(220, 38, 38, 0.6),
              0 0 12px rgba(220, 38, 38, 0.3),
              0 0 24px rgba(220, 38, 38, 0.2),
              0 0 32px rgba(220, 38, 38, 0.1);
          }
        }
        
        .pulsing-glow-selected {
          background: linear-gradient(135deg, rgb(220, 38, 38), rgb(239, 68, 68), rgb(55, 65, 81));
          animation: professional-glow 2.5s ease-in-out infinite;
        }
        
        @keyframes pulse-glow {
          0%, 100% { 
            transform: scale(1); 
            box-shadow: 0 0 0 0 rgba(17, 0, 0, 0.2);
          }
          50% { 
            transform: scale(1.02); 
            box-shadow: 0 0 0 3px rgba(17, 0, 0, 0.08), 0 0 10px rgba(170, 0, 0, 0.1);
          }
        }
        
        .animate-pulse-right {
          animation: pulse-right 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
      
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden -mt-[10.5rem]">
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
          <div className="text-right mb-12 relative">
            {/* Live Markets Link */}
<div className={`mb-6 -translate-y-1/4 flex justify-between items-center ${isMobileSearchActive ? 'md:flex hidden' : ''}`}>
  {/* Left button */}
  <button 
    onClick={() => setActiveSection('discord')}
    className="group inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
  >
    {/* Smaller red circle with question mark */}
    <span className="flex items-center justify-center w-3 h-3 rounded-full bg-red-600 text-white text-[9px] font-bold">
      i
    </span>
    
    {/* Larger text */}
    <span className="text-red-600">How it works</span>
  </button>

  {/* Right section with search bar and live markets button */}
  <div className="flex items-center gap-3">
    {/* Search Bar - Hidden on mobile */}
    <div className="hidden md:flex relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search markets..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-[355px] pl-10 pr-10 py-2 bg-white border-2 border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors duration-200"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <span className="text-gray-400 text-sm font-mono">/</span>
      </div>
    </div>
    
    <button 
      onClick={() => setActiveSection('liveMarkets')}
      className="group relative inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-red-600 transition-all duration-200 hover:scale-105 animate-pulse-glow shadow-lg shadow-gray-300"
    >
      {/* Live indicator dot */}
      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
      
      <span className="relative">
        Live markets
      </span>
      
      {/* Arrow with hover animation */}
      <span className="transform group-hover:translate-x-0.5 transition-transform duration-200 text-xs animate-pulse-right">→</span>
    </button>
  </div>
</div>

{/* Mobile Search Bar - Only shown when search is active */}
{isMobileSearchActive && (
  <div className="md:hidden mb-6 -translate-y-1/4">
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search markets..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-black rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-red-600 transition-colors duration-200"
        autoFocus
      />
    </div>
  </div>
)}

            
            {/* Market Carousel */}
            <div className={`relative -translate-y-1/3 ${isMobileSearchActive ? 'md:block hidden' : ''}`}>

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
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-400 hover:bg-red-50 font-bold text-gray-700'
                      }`}
                    style={{
                      minWidth: 'fit-content',
                      height: '40px',
                      
                    }}
                  >
                    {/* Icon */}
                    {selectedMarket === market.id && (
  <div
    className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold flex-shrink-0 text-red-600"
  >
    {market.icon}
  </div>
)}


                    {/* Name */}
                    <span
  className={`text-sm whitespace-nowrap ${
    selectedMarket === market.id ? 'font-bold text-red-700' : 'font-medium text-gray-700'
  }`}
>
  {market.name}
</span>

                  </button>
                ))}
              </div>
            </div>
          </div>

          
          
{/* Mobile Markets Display - All Markets */}
<div className="max-w-md mx-auto md:hidden -translate-y-12 space-y-4">
  {(() => {
    // Get all markets and deduplicate by ID
    const allMarkets = marketOptions.map(option => {
      const marketData = getMarkets(t, option.id);
      const market = marketData[0]; // Get the first (main) market for each option
      
      if (market) {
        // Store the tab option ID so we can match it later
        market.tabId = option.id;
        return market;
      } else {
        // Create a fallback market for categories without data
        return {
          id: option.id,
          name: option.name,
          symbol: option.symbol,
          color: option.color || '#666666',
          question: `${option.name} predictions coming soon...`,
          icon: option.icon || '🔮',
          currentPrice: '-',
          participants: 0,
          potSize: '$0',
          tabId: option.id
        };
      }
    });
    
    // Reorder: selected market first, then others (match by tabId)
    const selectedMarketData = allMarkets.find(market => market.tabId === selectedMarket);
    const otherMarkets = allMarkets.filter(market => market.tabId !== selectedMarket);
    const orderedMarkets = selectedMarketData ? [selectedMarketData, ...otherMarkets] : allMarkets;
    
    return orderedMarkets.map((market, index) => (
      <div key={`mobile-${market.id}-${index}`} className="max-w-md mx-auto">
        <div 
          onClick={() => handleMarketClick(market.id)}
          className={`group bg-white rounded-2xl p-[2px] cursor-pointer relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-rotate-1 hover:shadow-[0_25px_50px_rgba(220,38,38,0.15)] bg-gradient-to-r from-red-600 via-red-500 to-gray-800 hover:from-red-700 hover:via-red-600 hover:to-black 
          }`}
        >
          <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl p-4 h-full">
            {/* Background Gradient Accent */}
            <div className="absolute top-0 left-0 right-0 h-1"></div>
            
            {/* Countdown Timer - Above image (only for selected market) */}
            {market.tabId === selectedMarket && (
              <div className="flex justify-end mb-2">
                <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
                 
                </div>
              </div>
            )}
            
            {/* Header with Icon and Price */}
            <div className="flex flex-col items-center mb-3">
              <div className="w-full mb-2">
                <div className="rounded-xl w-full h-32 bg-gray-50 overflow-hidden relative">
                  {market.icon?.slice(0, 4) === 'http' ? (
                    <img 
                      src={market.icon} 
                      alt={`${market.name} Icon`} 
                      className="absolute inset-0 w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg text-gray-600">{market.icon}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-3">
              <p className="text-base font-semibold text-gray-900 leading-snug text-center">
                {market.question}
              </p>
            </div>

            {/* Trading Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button className="bg-white hover:bg-gray-50 border-2 border-black hover:border-red-600 text-black hover:text-red-600 py-3 px-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md">
                YES
              </button>
              <button className="bg-red-600 hover:bg-red-700 border-2 border-red-600 hover:border-red-700 text-white py-3 px-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md">
                NO
              </button>
            </div>

            {/* Stats Footer */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    availableMarkets.includes(market.name.toLowerCase())
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                  }`}
                ></div>        
                <span className={`text-sm font-semibold ${availableMarkets.includes(market.name.toLowerCase()) ? 'text-red-600' : 'text-gray-600'}`}>
                  {availableMarkets.includes(market.name.toLowerCase()) ? 'Available' : 'Soon'}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-bold text-gray-900">{market.potSize}</div>
                <div className="text-xs text-gray-600">Volume</div>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </div>
        </div>
      </div>
    ));
  })()}
</div>
        </div>
      </section>

      {/* Desktop Markets Grid - Full Width */}
      <section className="relative z-10 px-6 -mt-20 pb-16 hidden md:block">
        <div className="max-w-7xl mx-auto">
          {/* All Markets Display - Full Width Grid */}
          <div className="grid grid-cols-4 gap-4">
                {(() => {
                  // Get all markets and deduplicate by ID
                  const allMarkets = marketOptions.map(option => {
                    const marketData = getMarkets(t, option.id);
                    const market = marketData[0]; // Get the first (main) market for each option
                    
                    if (market) {
                      // Store the tab option ID so we can match it later
                      market.tabId = option.id;
                      return market;
                    } else {
                      // Create a fallback market for categories without data
                      return {
                        id: option.id,
                        name: option.name,
                        symbol: option.symbol,
                        color: option.color || '#666666',
                        question: `${option.name} predictions coming soon...`,
                        icon: option.icon || '🔮',
                        currentPrice: '-',
                        participants: 0,
                        potSize: '$0',
                        tabId: option.id
                      };
                    }
                  });
                  
                  // Reorder: selected market first, then others (match by tabId)
                  const selectedMarketData = allMarkets.find(market => market.tabId === selectedMarket);
                  const otherMarkets = allMarkets.filter(market => market.tabId !== selectedMarket);
                  const orderedMarkets = selectedMarketData ? [selectedMarketData, ...otherMarkets] : allMarkets;
                  
                  return orderedMarkets.map((market, index) => (
                    <div
                      key={`desktop-${market.id}-${index}`}
                      onClick={() => handleMarketClick(market.id)}
                      className={`group rounded-2xl p-[2px] cursor-pointer relative overflow-hidden transition-all duration-500 hover:scale-105 hover:-rotate-1 hover:shadow-[0_25px_40px_rgba(220,38,38,0.15)] ${
                        market.tabId === selectedMarket ? 'scale-105 pulsing-glow-selected' : 'bg-gradient-to-r from-red-600 via-red-500 to-gray-800 hover:from-red-700 hover:via-red-600 hover:to-black'
                      }`}
                    >
                      <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-xl p-3 h-full flex flex-col min-h-[240px]">
                        {/* Countdown Timer - Above image */}
                        {market.tabId === selectedMarket && (
                          <div className="flex justify-end mb-2">
                            <div className="text-xs text-gray-600 font-medium whitespace-nowrap">
                              
                            </div>
                          </div>
                        )}
                        
                        {/* Header with Icon */}
                        <div className="flex flex-col items-center mb-2">
                          <div className="rounded-lg flex items-center justify-center w-full h-32 bg-gray-50 overflow-hidden mb-1">
                            {market.icon?.slice(0, 4) === 'http' ? (
                              <img 
                                src={market.icon} 
                                alt={`${market.name} Icon`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <span className="text-2xl text-gray-600">{market.icon}</span>
                            )}
                          </div>
                        </div>

                        {/* Question */}
                        <div className="mb-2 flex-1 flex items-center justify-center">
                          <p className="text-sm font-semibold text-gray-900 leading-tight text-center line-clamp-3">
                            {market.question}
                          </p>
                        </div>

                        {/* Trading Buttons */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <button className="bg-white hover:bg-gray-50 border border-black hover:border-red-600 text-black hover:text-red-600 py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105">
                            YES
                          </button>
                          <button className="bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 text-white py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105">
                            NO
                          </button>
                        </div>

                        {/* Stats Footer - Compact */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <div className="flex items-center space-x-1">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                availableMarkets.includes(market.name.toLowerCase())
                                  ? 'bg-red-500 animate-pulse'
                                  : 'bg-gray-400'
                              }`}
                            ></div>
                            <span className={`text-[10px] font-medium ${availableMarkets.includes(market.name.toLowerCase()) ? 'text-red-600' : 'text-gray-600'}`}>
                              {availableMarkets.includes(market.name.toLowerCase()) ? 'Available' : 'Soon'}
                            </span>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-[10px] font-bold text-gray-900 leading-none">{market.potSize}</div>
                            <div className="text-[9px] text-gray-500 leading-none">Volume</div>
                          </div>
                          
                          <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    </div>
                  ));
                })()}
          </div>
        </div>
      </section>

      {/* Thousands of Winners Section - Desktop */}
      <section className="relative z-10 px-6 py-16 hidden md:block">
        <div className="max-w-4xl mx-auto text-center">
          <div className="space-y-4 mb-12">
            <h2 className="text-4xl font-light text-gray-900 tracking-tight">
              <span className="text-red-600 font-medium">Thousands</span> of winners,
            </h2>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              will you be next?
            </h3>
          </div>
          
          {/* Minimalist Entry Button */}
          <button
            onClick={() => handleMarketClick('Featured')}
            className="group relative bg-black border-2 border-black text-white px-20 py-5 rounded-lg font-semibold text-xl tracking-[0.1em] uppercase transition-all duration-300 hover:bg-red-600 hover:border-red-600 hover:text-white overflow-hidden shadow-xl hover:shadow-red-200"
          >
            <span className="relative z-10">Enter</span>
            
            {/* Sliding fill effect */}
            <div className="absolute inset-0 bg-red-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
            
            {/* Subtle arrows that appear on hover */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-lg">→</span>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-lg">←</span>
            </div>
          </button>
        </div>
      </section>

      {/* Sleek Call to Action - Mobile Only */}
      <section id="call-to-action" className="relative z-10 px-6 mt-16 mb-16 md:hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-2 tracking-tight">
            <span className="text-red-600 font-medium">Thousands</span> of winners,
          </h2>
          <h3 className="text-xl font-black text-gray-900 mb-10 tracking-tight">
            will you be next?
          </h3>
          
          {/* Minimalist Entry Button - Mobile */}
          <button
            onClick={() => handleMarketClick('Featured')}
            className="group relative bg-white border-2 border-black text-black px-12 py-4 rounded-lg font-semibold text-base tracking-[0.1em] uppercase transition-all duration-300 hover:bg-red-600 hover:border-red-600 hover:text-white overflow-hidden mx-auto shadow-lg hover:shadow-red-200"
          >
            <span className="relative z-10">Enter</span>
            
            {/* Sliding fill effect */}
            <div className="absolute inset-0 bg-red-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
            
            {/* Subtle arrows that appear on hover */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-xs">→</span>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <span className="text-white text-xs">←</span>
            </div>
          </button>
        </div>
      </section>

      <footer className="relative z-10 px-6 py-10 bg-white text-center text-red-600 text-sm shadow-md">
        &copy; {new Date().getFullYear()} {t.footerText}
      </footer>
      
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        autoClose={alertState.autoClose}
      />
    </div>
    </>
  );
};

export default LandingPage;