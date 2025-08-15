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
  const { alertState, showAlert, closeAlert } = useCustomAlert();
  const [showRightArrow, setShowRightArrow] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const availableMarkets = ["random topics", "crypto"];
  
  // Countdown state for timer
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });



  // Function to update arrow visibility
  const updateArrowVisibility = () => {
    const container = carouselRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Get countdown label based on current day
  const getCountdownLabel = (): string => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    
    if (day === 6) return 'Results day! New pot starts in:'; // Saturday
    if (day >= 0 && day <= 5) return 'Refreshes in:'; // Sunday-Friday
    return 'Pot opens in:'; // Fallback
  };

  // Check if should use 24h countdown (Sunday-Friday) or long countdown (Saturday only)
  const isShortCountdown = (): boolean => {
    const now = new Date();
    const day = now.getDay();
    return day >= 0 && day <= 5; // Sunday-Friday use 24h countdown to next midnight
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

  // Function to update countdown
  const updateCountdown = () => {
    const now = new Date();
    const target = isShortCountdown() ? getNextMidnight() : getNextMidnight(); // Always use next midnight for consistency
    const difference = target.getTime() - now.getTime();

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeUntilMidnight({ days, hours, minutes, seconds });
    } else {
      setTimeUntilMidnight({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  useEffect(() => {
    const savedLang = Cookies.get('language') as Language | undefined;
    if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
      setCurrentLanguage(savedLang);
    }
    setIsVisible(true);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
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
      setActiveSection('tutorial');
    }, 200);
    
    console.log('Set cookie selectedMarket:', contractAddress); // Debug log
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
    <div className="min-h-screen bg-[#fdfdfd] text-[#111111] overflow-hidden -mt-44">
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
            <div className="mb-6 -translate-y-1/4">
              <button 
                onClick={() => setActiveSection('liveMarkets')}
                className="group relative inline-flex items-center gap-1.5 bg-black text-white px-3 py-1.5 rounded-full text-xs font-medium hover:bg-gray-800 transition-all duration-200 hover:scale-105"
              >
                {/* Live indicator dot */}
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                
                <span className="relative">
                  Live Predictions
                </span>
                
                {/* Arrow with hover animation */}
                <span className="transform group-hover:translate-x-0.5 transition-transform duration-200 text-xs">→</span>
              </button>
            </div>
            
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

          
          
<div className={'max-w-md mx-auto md:hidden -translate-y-12'} >

  <div 
    onClick={() => handleMarketClick(markets[0].id)}
    className="group bg-white rounded-xl p-4 border border-gray-300 hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
  >
    
    {/* Background Gradient Accent */}
    <div className="absolute top-0 left-0 right-0 h-1 "></div>
    
    {/* Countdown Timer - Above image */}
    <div className="flex justify-end mb-2">
      <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
        <span className="text-[10px] text-gray-400 mr-1">{getCountdownLabel()}</span>
        <span className="text-[11px] font-bold">
          {isShortCountdown() ? (
            `${timeUntilMidnight.hours.toString().padStart(2, '0')}H ${timeUntilMidnight.minutes.toString().padStart(2, '0')}M ${timeUntilMidnight.seconds.toString().padStart(2, '0')}S`
          ) : (
            `${timeUntilMidnight.days}D ${timeUntilMidnight.hours.toString().padStart(2, '0')}H ${timeUntilMidnight.minutes.toString().padStart(2, '0')}M`
          )}
        </span>
      </div>
    </div>
    
    {/* Header with Icon and Price */}
    <div className="flex flex-col items-center mb-3">
      <div className="flex items-center justify-center mb-2">
        <div className="rounded-xl flex items-center justify-center w-full h-48 bg-gray-50 overflow-hidden">
  {markets[0].icon?.slice(0, 4) === 'http' ? (
    <img 
      src={markets[0].icon} 
      alt={`${markets[0].name} Icon`} 
      className="w-full h-full object-cover" 
    />
  ) : (
    <span className="text-lg text-gray-600">{markets[0].icon}</span>
  )}
</div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">{markets[0].name}</h2>
        <p className="text-sm text-gray-500 font-medium">{markets[0].symbol}</p>
      </div>
    </div>

    {/* Question */}
    <div className="mb-3">
      <p className="text-base font-semibold text-gray-800 leading-snug text-center">
        {markets[0].question}
      </p>
    </div>

    {/* Trading Buttons */}
    <div className="grid grid-cols-2 gap-3 mb-3">
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
      ? 'bg-green-500'
      : 'bg-red-500'
  }`}
></div>        <span className={`text-sm font-medium ${availableMarkets.includes(markets[0].name.toLowerCase()) ? 'text-green-600' : 'text-red-600'}`}>
          {availableMarkets.includes(markets[0].name.toLowerCase()) ? 'Available' : 'Soon'}
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

      {/* Desktop Two-Column Layout */}
      <section className="relative z-10 px-6 -mt-8 pb-16 hidden md:block">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left Column - Market Card */}
            <div className="flex justify-center">
              <div className={`${selectedMarket === 'Crypto' || selectedMarket.toLowerCase() === 'crypto' || markets[0].name?.toLowerCase().includes('crypto') ? '-translate-y-12' : '-translate-y-12'}`}>
                <div 
                  onClick={() => handleMarketClick(markets[0].id)}
                  className="group bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl p-4 border border-gray-700 hover:border-gray-600 hover:shadow-xl transition-all duration-200 cursor-pointer relative overflow-hidden w-[28rem] h-[480px] flex flex-col"
                >
                  {/* Background Gradient Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 "></div>
                  
                  {/* Countdown Timer - Above image */}
                  <div className="flex justify-end mb-2">
                    <div className="text-sm text-gray-300 font-medium whitespace-nowrap">
                      <span className="text-xs text-gray-400 mr-2">{getCountdownLabel()}</span>
                      <span className="text-sm font-bold text-white">
                        {isShortCountdown() ? (
                          `${timeUntilMidnight.hours.toString().padStart(2, '0')}H ${timeUntilMidnight.minutes.toString().padStart(2, '0')}M ${timeUntilMidnight.seconds.toString().padStart(2, '0')}S`
                        ) : (
                          `${timeUntilMidnight.days}D ${timeUntilMidnight.hours.toString().padStart(2, '0')}H ${timeUntilMidnight.minutes.toString().padStart(2, '0')}M`
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Header with Icon and Price */}
                  <div className="flex flex-col items-center mb-3">
                    <div className="flex items-center justify-center mb-2">
                      <div className="rounded-xl flex items-center justify-center w-96 h-40 bg-gray-50 overflow-hidden">
                        {markets[0].icon?.slice(0, 4) === 'http' ? (
                          <img 
                            src={markets[0].icon} 
                            alt={`${markets[0].name} Icon`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-lg text-gray-600">{markets[0].icon}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <h2 className="text-lg font-bold text-white">{markets[0].name}</h2>
                      <p className="text-sm text-gray-300 font-medium">{markets[0].symbol}</p>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-3 flex-1 flex items-center justify-center">
                    <p className="text-base font-semibold text-white leading-snug text-center">
                      {markets[0].question}
                    </p>
                  </div>

                  {/* Trading Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <button className="bg-green-50 hover:bg-green-100 border border-green-200 hover:border-green-400 text-green-700 py-2.5 px-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-150 hover:scale-105">
                      YES
                    </button>
                    <button className="bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-400 text-red-700 py-2.5 px-4 rounded-lg font-bold uppercase tracking-wide transition-all duration-150 hover:scale-105">
                      NO
                    </button>
                  </div>

                  {/* Stats Footer */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          availableMarkets.includes(markets[0].name.toLowerCase())
                            ? 'bg-green-500 animate-pulse'
                            : 'bg-red-500'
                        }`}
                      ></div>
                      <span className={`text-sm font-medium ${availableMarkets.includes(markets[0].name.toLowerCase()) ? 'text-green-400' : 'text-red-400'}`}>
                        {availableMarkets.includes(markets[0].name.toLowerCase()) ? 'Available' : 'Soon'}
                      </span>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{markets[0].potSize}</div>
                      <div className="text-xs text-gray-300">Volume</div>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sleek Call to Action */}
            <div className="flex flex-col justify-center items-center text-center h-full">
              <div className="space-y-3 mb-16">
                <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                  <span style={{ color: 'red' }}>Thousands</span> of players,
                </h2>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  one weekly winner
                </h3>
              </div>
              
              {/* Minimalist Entry Button */}
              <button
                onClick={() => handleMarketClick('Featured')}
                className="group relative bg-white border-2 border-gray-900 text-gray-900 px-16 py-4 rounded-none font-light text-lg tracking-[0.2em] uppercase transition-all duration-300 hover:bg-gray-900 hover:text-white overflow-hidden"
              >
                <span className="relative z-10">Enter</span>
                
                {/* Sliding fill effect */}
                <div className="absolute inset-0 bg-gray-900 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                
                {/* Subtle arrows that appear on hover */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0">
                  <span className="text-white text-sm">→</span>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-white text-sm">←</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sleek Call to Action - Mobile Only */}
      <section id="call-to-action" className="relative z-10 px-6 mt-16 mb-16 md:hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-2 tracking-tight">
            <span style={{ color: 'red' }}>Thousands</span> of players,
          </h2>
          <h3 className="text-xl font-black text-gray-900 mb-10 tracking-tight">
            one weekly winner
          </h3>
          
          {/* Minimalist Entry Button - Mobile */}
          <button
            onClick={() => handleMarketClick('Featured')}
            className="group relative bg-white border-2 border-gray-900 text-gray-900 px-12 py-4 rounded-none font-light text-base tracking-[0.2em] uppercase transition-all duration-300 hover:bg-gray-900 hover:text-white overflow-hidden mx-auto"
          >
            <span className="relative z-10">Enter</span>
            
            {/* Sliding fill effect */}
            <div className="absolute inset-0 bg-gray-900 -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
            
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

      <footer className="relative z-10 px-6 py-10 bg-white text-center text-[#666666] text-sm">
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
  );
};

export default LandingPage;