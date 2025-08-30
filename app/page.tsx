// App.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import PredictionPotTest from './Pages/PredictionPotTest';
import LandingPage from './Pages/LandingPage';
import MakePredicitions from './Pages/MakePredictionsPage';
import ProfilePage from './Pages/ProfilePage';
import TutorialBridge from './Pages/TutorialBridge';
import ReferralProgram from './Pages/ReferralProgram';
// import { cryptoTokens, stablecoinTokens, ETHToken, USDCToken, CbBTCToken, BRZToken, CADCToken, EURCToken } from './Token Lists/coins';
import BuySection from "./Pages/BuyPage";
// import CurrencyDisplay from './Pages/Charts';
import Activity from './Pages/TransactionsPage';
import NavigationMenu from "./Sections/NavigationMenu";
import ResponsiveLogo from './Sections/ResponsiveLogo';
import HowItWorksSection from './Pages/Discord';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import GamesHub from './Pages/AIPage';
import CreatePotPage from './Pages/CreatePotPage';
import PrivatePotInterface from './Pages/PrivatePotInterface';
import BookmarksPage from './Pages/BookmarksPage';
import FifteenMinuteQuestions from './Sections/FifteenMinuteQuestions';
import LiveMarketPotEntry from './Pages/LiveMarketPotEntry';
import MessagingPage from './Pages/MessagingPage';
import IdeasPage from './Pages/IdeasPage';
import AdminEvidenceReviewPage from './Pages/AdminEvidenceReviewPage';
import { getMarkets } from './Constants/markets';
import { Language, getTranslation, supportedLanguages } from './Languages/languages';






// Contract now uses ETH directly - no USDC needed
const LIVE_POT_ADDRESS = '0xC495Ca91D255dfCd62e97B57660658D48B464b6D';

export default function App() {
  const { address, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState('home'); // Default section
  const [privatePotAddress, setPrivatePotAddress] = useState<string>(''); // For routing to private pots
  const [hasEnteredLivePot, setHasEnteredLivePot] = useState(false); // Track live pot entry
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false); // Track mobile search state
  const [searchQuery, setSearchQuery] = useState(''); // Search functionality
  const [isLandingPageLoading, setIsLandingPageLoading] = useState(activeSection === 'home'); // Track LandingPage loading state

  // Carousel state
  const [selectedMarket, setSelectedMarket] = useState('Trending');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showLeftArrow2, setShowLeftArrow2] = useState(false);
  const [showRightArrow2, setShowRightArrow2] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const carouselRef = useRef<HTMLDivElement>(null);
  const carousel2Ref = useRef<HTMLDivElement>(null);

  // Get market options for carousels
  const t = getTranslation(currentLanguage);
  const marketOptions = getMarkets(t, 'options');

  // State for shuffled markets to avoid hydration mismatch
  const [shuffledMarkets, setShuffledMarkets] = useState(marketOptions);

  // Shuffle function
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle markets on client side only, keeping Trending first
  useEffect(() => {
    const trendingMarket = marketOptions.find(market => market.name === 'Trending');
    const otherMarkets = marketOptions.filter(market => market.name !== 'Trending');
    const shuffledOthers = shuffleArray(otherMarkets);

    if (trendingMarket) {
      setShuffledMarkets([trendingMarket, ...shuffledOthers]);
    } else {
      setShuffledMarkets(shuffleArray(marketOptions));
    }
  }, []);

  // Personalized labels for the second carousel
  const personalizedLabels = {
    'Trending': 'For you',
    'Crypto': 'Bitcoin',
    'Stocks': 'Tesla',
    'Music Charts': 'Sabrina Carpenter',
    'X Trending Topics': 'Popular Hashtags',
    'Weather': 'Climate',
    'Sports': 'Football',
    'Politics': 'Trump',
    'Elections': 'US 2024',
    'TV Shows': 'Netflix',
    'Pop Culture': 'Celebrities',
    'Tech News': 'OpenAI',
    'Boxing': 'UFC'
  } as const;

  // Function to navigate to a private pot
  const navigateToPrivatePot = (contractAddress: string) => {
    setPrivatePotAddress(contractAddress);
    setActiveSection('privatePot');
  };

  // Function to handle successful live pot entry
  const handleLivePotEntry = () => {
    setHasEnteredLivePot(true);
  };


  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveSection('home'); // Navigate to home when searching
  };

  // Carousel functions
  const updateArrowVisibility = () => {
    const container = carouselRef.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const updateArrowVisibility2 = () => {
    const container = carousel2Ref.current;
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow2(scrollLeft > 0);
      setShowRightArrow2(scrollLeft < scrollWidth - clientWidth - 1);
    }
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

  const scrollLeft2 = () => {
    const container = carousel2Ref.current;
    if (container) {
      container.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight2 = () => {
    const container = carousel2Ref.current;
    if (container) {
      container.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const handleScroll2 = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow2(scrollLeft > 0);
    setShowRightArrow2(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Reset live pot entry state when switching sections
  useEffect(() => {
    if (activeSection !== 'liveMarkets') {
      setHasEnteredLivePot(false);
    }
  }, [activeSection]);

  // Reset mobile search state when switching away from home
  useEffect(() => {
    if (activeSection !== 'home') {
      setIsMobileSearchActive(false);
    }
  }, [activeSection]);



  // Check for market parameter in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const potAddress = urlParams.get('market');

    if (potAddress && potAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      navigateToPrivatePot(potAddress);

      // Clean up URL without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  const [toastMessage] = useState('');
  const [showToast] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Removed unused state variables for cleaner code

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Carousel effects
  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility();
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedMarket]);

  // Force arrow visibility check when marketOptions change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility();
      updateArrowVisibility2();
    }, 300);
    return () => clearTimeout(timer);
  }, [marketOptions]);

  // Second carousel effects
  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility2();
    }, 200);
    return () => clearTimeout(timer);
  }, [shuffledMarkets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateArrowVisibility2();
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedMarket]);


  // Removed USDC balance reading - now using ETH directly

  // Removed USDC balance formatting - now using ETH directly











  // if (!isMounted) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen bg-invisible text-white">
  //       <div className="p-8 bg-invisible rounded-lg shadow-2xl border border-[#fefefe] max-w-md w-full">
  //         <div className="text-center mb-6">
  //           <h2 className="text-xl font-medium mb-2">Loading Application</h2>
  //           <p className="text-[#d3c81a]">Please wait while we initialize the interface</p>
  //         </div>
  //         <div className="flex justify-center">
  //           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fefefe]"></div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // Handle loading change from LandingPage
  const handleLoadingChange = (isLoading: boolean) => {
    setIsLandingPageLoading(isLoading);
  };

  // Set loading state when navigating to home section
  useEffect(() => {
    if (activeSection === 'home') {
      setIsLandingPageLoading(true);
    } else {
      setIsLandingPageLoading(false);
    }
  }, [activeSection]);


  return (
    <div className="min-h-screen bg-white text-white">


      {/* Hide header and all content when LandingPage is loading */}
      {!isLandingPageLoading && (
        <header className="z-50 bg-white px-4 md:py-2 sticky top-0 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col">
          {/* Top row with main header elements */}
          <div className="flex justify-between items-center">
            <div className="flex items-center flex-1">
              {/* Hamburger menu - shows on both desktop and mobile at left edge */}
              <div>
                <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
              </div>

              {/* Logo */}
              <div className="relative -ml-2">
                <div className="absolute -inset-1 rounded-full blur-md"></div>
                <ResponsiveLogo />
              </div>

              {/* Search Bar - Desktop only, right of logo */}
              <div className="hidden md:flex relative ml-6">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-8 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-[500px] pl-10 pr-10 py-2 bg-gray-100 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:bg-gray-200 transition-colors duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-gray-400 text-sm font-mono">/</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end flex-1">
              {/* Balance display removed - ETH balance handled by wallet */}

              {/* Spacer to push buttons to the right */}
              <div className="hidden md:flex flex-1"></div>

              {/* How it works button - Desktop */}
              <button
                onClick={() => setActiveSection('discord')}
                className="hidden md:inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors mr-2"
              >
                {/* Smaller red circle with i */}
                <span className="flex items-center justify-center w-3 h-3 rounded-full bg-red-600 text-white text-[9px] font-bold">
                  i
                </span>

                {/* Text */}
                <span className="text-red-600">How it works</span>
              </button>

              {/* Ideas link */}
              <button
                onClick={() => setActiveSection('ideas')}
                className={`hidden md:inline-flex bg-gray-100 text-gray-700 hover:text-black font-medium text-sm md:text-base transition-colors duration-200 z-10 relative px-3 py-1 rounded-md hover:bg-red-100 ${isConnected ? ' md:-mr-4 ' : 'mr-4'}`}
              >
                Ideas
              </button>

              <div className={`wallet-container ${isMobile ? 'ml-8' : '-ml-8'}`}>
                <Wallet>
                  <ConnectWallet
                    text={isMobile ? "Sign In" : "Sign In"}
                    className={`${isConnected ? '!bg-transparent !border-none !shadow-none !p-0' : ''} ${isMobile ? 'bg-red-600 hover:bg-black !px-4 !py-2 !min-w-0' : 'bg-red-600 hover:bg-black !px-4 !py-2 !min-w-0 !w-24 !whitespace-nowrap ml-8'}`}
                  >
                    {isConnected && (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 hover:from-purple-500 hover:via-pink-600 hover:to-red-600 transition-all duration-200 hover:shadow-xl hover:scale-105"></div>
                    )}
                  </ConnectWallet>
                  <WalletDropdown>
                    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                      <Avatar />
                      <Name />
                      <Address />
                      <EthBalance />
                    </Identity>
                    <WalletDropdownLink
                      icon="wallet"
                      href="https://keys.coinbase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Wallet
                    </WalletDropdownLink>
                    <WalletDropdownDisconnect />
                  </WalletDropdown>
                </Wallet>
              </div>
            </div>
          </div>

          {/* Market Carousel - only show on home section, on its own line */}
          {activeSection === 'home' && (
            <div className="mt-3 md:translate-y-2 pt-2 md:pt-0 border-b md:border-b-0 border-gray-200">
              {/* Markets Container - Show first 13 on desktop, all on mobile */}
              <div className="flex gap-2 overflow-x-auto md:overflow-visible scrollbar-hide pb-1"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {/* Show first 13 items on desktop, all on mobile */}
                {(isMobile ? marketOptions : marketOptions.slice(0, 13)).map((market) => (
                  <button
                    key={market.id}
                    onClick={() => setSelectedMarket(market.id)}
                    className={`group flex-shrink-0 text-xl flex items-center gap-2 px-2 py-2 transition-all duration-300 ${selectedMarket === market.id
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    style={{
                      fontWeight: selectedMarket === market.id ? '600' : '500',
                      minWidth: 'fit-content',
                      height: 'auto',
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                    }}
                  >
                    <span className="whitespace-nowrap tracking-tight" style={{fontSize: '15px'}}>
                      {market.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        </header>
      )}

      {/* Mobile Search Bar - Below Header - Only show on home page */}
      {!isLandingPageLoading && activeSection === 'home' && (
      <div className="md:hidden bg-white px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1">
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
            className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors duration-200"
          />
        </div>

        {/* Filter Symbol */}
        <div className="flex items-center justify-center w-10 h-10 bg-transparent border border-gray-300 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>

        {/* Bookmark/Save Symbol */}
        <button 
          className="flex items-center justify-center w-10 h-10 bg-transparent border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile search bar bookmark button clicked');
            setActiveSection('bookmarks');
          }}
          type="button"
        >
          <svg className="w-5 h-5 text-gray-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
      )}

      {/* Second Carousel - Personalized Labels (Below mobile search bar) */}
      {!isLandingPageLoading && activeSection === 'home' && (
        <section className="relative z-10 px-4 py-1 md:py-3 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 w-full max-w-full">
              {/* Desktop Search Bar - Left side */}
              <div className="hidden md:flex items-center gap-3">
                <div className="relative w-56">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:bg-gray-200 transition-colors duration-200"
                  />
                </div>

                {/* Filter Symbol */}
                <div className="flex items-center justify-center w-9 h-9 bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>

                {/* Bookmark/Save Symbol */}
                <button
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors z-20 relative"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Bookmark button clicked - should navigate to bookmarks');
                    setActiveSection('bookmarks');
                  }}
                  type="button"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>

              </div>

              {/* Carousel - Right side on desktop, full width on mobile */}
              <div className="relative flex-1 min-w-0 overflow-hidden">
                {/* Left Arrow for second carousel - Hidden on mobile */}
                <button
                  onClick={scrollLeft2}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                  style={{ display: showLeftArrow2 ? 'flex' : 'none' }}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>

                {/* Right Arrow for second carousel - Hidden on mobile */}
                {showRightArrow2 && (
                  <button
                    onClick={scrollRight2}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                )}

                <div 
                  ref={carousel2Ref}
                  className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 max-w-full"
                  onScroll={handleScroll2}
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    maxWidth: '100%'
                  }}
                >
                {shuffledMarkets.map((market) => (
                  <button
                    key={`personalized-${market.id}`}
                    onClick={() => setSelectedMarket(market.id)}
                    className={`group flex-shrink-0 flex items-center gap-1 px-4 py-2 transition-all duration-300 ${selectedMarket === market.id
                        ? 'text-red-600 bg-red-100 border border-red-200 rounded-full'
                        : 'text-black border border-gray-300 rounded-full hover:text-gray-600'
                      }`}
                    style={{
                      fontWeight: selectedMarket === market.id ? '500' : '500',
                      minWidth: 'fit-content',
                      height: 'auto',
                      // fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                    }}
                  >
                    <span className="text-sm whitespace-nowrap tracking-tight">
                      {personalizedLabels[market.name as keyof typeof personalizedLabels] || market.name}
                    </span>
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="flex-grow bg-white pb-16 md:pb-0">



        {/* {activeSection === "usernamePage" && <UsernameSetup />} */}
        {activeSection === "buy" && <BuySection activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "profile" && <ProfilePage activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "messagesPage" && <MessagingPage activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "discord" && <HowItWorksSection />}
        {activeSection === "activity" && <Activity />}
        {/* {activeSection === "notifications" && <CreateMessage />} */}
        {activeSection === "dashboard" && <TutorialBridge activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "bitcoinPot" && <PredictionPotTest activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "referralProgram" && <ReferralProgram activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "home" && <LandingPage activeSection={activeSection} setActiveSection={setActiveSection} isMobileSearchActive={isMobileSearchActive} searchQuery={searchQuery} selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} onLoadingChange={handleLoadingChange} />}
        {activeSection === "makePrediction" && <MakePredicitions activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "AI" && <GamesHub activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "createPot" && <CreatePotPage navigateToPrivatePot={navigateToPrivatePot} />}
        {activeSection === "ideas" && <IdeasPage activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "bookmarks" && <BookmarksPage activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "adminEvidenceReview" && <AdminEvidenceReviewPage activeSection={activeSection} setActiveSection={setActiveSection} />}
        {activeSection === "privatePot" && privatePotAddress && (
          <PrivatePotInterface
            contractAddress={privatePotAddress}
            activeSection={activeSection}
            onBack={() => {
              setActiveSection('home');
              setPrivatePotAddress('');
            }}
          />
        )}
        {activeSection === "liveMarkets" && (
          hasEnteredLivePot ? (
            <FifteenMinuteQuestions className="mt-20" setActiveSection={setActiveSection} />
          ) : (
            <LiveMarketPotEntry
              contractAddress={LIVE_POT_ADDRESS}
              onPotEntered={handleLivePotEntry}
            />
          )
        )}
        {/* Add more sections as needed */}

      </main>

      {/* Mobile Bottom Navigation */}
      {!isLandingPageLoading && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white z-40">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={(e) => {
              console.log('Mobile HOME button clicked');
              setActiveSection('home');
              setIsMobileSearchActive(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${activeSection === 'home' ? 'text-black' : 'text-gray-500'
              }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${activeSection === 'home' ? 'bg-transparent' : ''
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9,22 9,12 15,12 15,22"></polyline>
              </svg>
            </div>
            <span className="text-[13px] font-medium">Home</span>
          </button>

          <button
            onClick={(e) => {
              console.log('Mobile CREATE button clicked');
              setActiveSection('createPot');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${activeSection === 'createPot' ? 'text-black' : 'text-gray-500'
              }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${activeSection === 'createPot' ? 'bg-transparent' : ''
              }`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14m-7-7h14"></path>
              </svg>
            </div>
            <span className="text-[13px] font-medium">Create</span>
          </button>

          <button
            onClick={() => setActiveSection('discord')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${activeSection === 'discord' ? 'text-black' : 'text-gray-500'
              }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${activeSection === 'discord' ? 'bg-transparent' : ''
              }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1V3H9V1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21ZM17 20H7V9H17V20Z" />
              </svg>
            </div>
            <span className="text-[13px] font-medium">How it works</span>
          </button>

          
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Mobile my markets button clicked - should navigate to bookmarks');
              setActiveSection('bookmarks');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${activeSection === 'bookmarks' ? 'text-black' : 'text-gray-500'
              }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${activeSection === 'bookmarks' ? 'bg-transparent' : ''
              }`}>
              <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span className="text-[13px] font-medium">My Markets</span>
          </button>
        </div>
        </div>
      )}

      {/* Toast Notification */}
      {!isLandingPageLoading && showToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 md:bottom-6 bg-black/80 text-white px-4 py-2 rounded-md shadow-lg border border-[#004400] transition-all duration-200 flex items-center z-50">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {toastMessage}
        </div>
      )}
    </div>

  );

}