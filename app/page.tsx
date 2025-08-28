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
import WalletPage from './Pages/ReceivePage';
import CreatePotPage from './Pages/CreatePotPage';
import PrivatePotInterface from './Pages/PrivatePotInterface';
import FifteenMinuteQuestions from './Sections/FifteenMinuteQuestions';
import LiveMarketPotEntry from './Pages/LiveMarketPotEntry';
import MessagingPage from './Pages/MessagingPage';
import IdeasPage from './Pages/IdeasPage';
import { getMarkets } from './Constants/markets';
import { Language, getTranslation, supportedLanguages } from './Languages/languages';






// Contract now uses ETH directly - no USDC needed
const LIVE_POT_ADDRESS = '0x3dfdEdC82B14B1dd5f45Ae0F2A5F3738A487096e';

export default function App() {
  const { address, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState('home'); // Default section
  const [privatePotAddress, setPrivatePotAddress] = useState<string>(''); // For routing to private pots
  const [hasEnteredLivePot, setHasEnteredLivePot] = useState(false); // Track live pot entry
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false); // Track mobile search state
  const [searchQuery, setSearchQuery] = useState(''); // Search functionality
  
  // Carousel state
  const [selectedMarket, setSelectedMarket] = useState('Featured');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const carouselRef = useRef<HTMLDivElement>(null);

  // Get market options for carousels
  const t = getTranslation(currentLanguage);
  const marketOptions = getMarkets(t, 'options');

  // Personalized labels for the second carousel
  const personalizedLabels = {
    '★ Featured': 'For you',
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

  // Function to handle mobile search toggle
  const handleMobileSearchToggle = () => {
    setActiveSection('home');
    setIsMobileSearchActive(!isMobileSearchActive);
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
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

  return (
    <div className="min-h-screen bg-white text-white">
      
      
      <header className="z-50 bg-[#fdfdfd] px-4 pt-3 pb-1 md:py-2 sticky top-0 border-b border-gray-200">
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
                className="hidden md:inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors translate-x-8"
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
                className="hidden bg-gray-100 md:block text-gray-700 hover:text-black font-medium text-sm md:text-base transition-colors duration-200 z-10 relative px-3 py-1 rounded-md hover:bg-red-100 translate-x-12"
              >
                Ideas 
              </button>
              
              <div className={`wallet-container ${isMobile ? '-ml-2' : 'ml-4'}`}>
                <Wallet>
                  <ConnectWallet 
                    text={isMobile ? "Sign In" : "Connect Wallet"}
                    className={`${isConnected ? '!bg-transparent !border-none !shadow-none !p-0' : ''} ${isMobile ? 'bg-black hover:bg-red-600 !px-4 !py-2 !min-w-0' : 'bg-black hover:bg-red-600 !px-8 !py-3'}`}
                  >
                    {isConnected && (
                      <>
                        <Avatar className="h-10 w-10 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200" />
                        <div className="h-8 w-8 rounded-full border-2 border-gray-200 hover:border-gray-300 bg-black flex items-center justify-center transition-all duration-200">
                          <User className="h-5 w-5 text-[#fafafa]" />
                        </div>
                      </>
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
            <div className="relative mt-3 md:mt-1">
              {/* Left Arrow - Hidden on mobile */}
              {showLeftArrow && (
                <button
                  onClick={scrollLeft}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              )}

              {/* Right Arrow - Hidden on mobile */}
              {showRightArrow && (
                <button
                  onClick={scrollRight}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white shadow-lg rounded-full items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              )}

              {/* Scrollable Markets Container */}
              <div
                ref={carouselRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
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
                    className={`group flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 font-medium ${selectedMarket === market.id
                        ? 'text-black font-bold'
                        : 'text-[#6B7280] hover:text-black hover:font-bold'
                      }`}
                    style={{
                      minWidth: 'fit-content',
                      height: '32px',
                    }}
                  >
                    <span className="text-sm whitespace-nowrap">
                      {market.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Search Bar - Below Header */}
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:bg-gray-200 transition-colors duration-200"
          />
        </div>
        
        {/* Filter Symbol */}
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        
        {/* Bookmark/Save Symbol */}
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
      </div>

      {/* Second Carousel - Personalized Labels (Below mobile search bar) */}
      {activeSection === 'home' && (
        <section className="relative z-10 px-4 py-3 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {marketOptions.map((market) => (
                <button
                  key={`personalized-${market.id}`}
                  onClick={() => setSelectedMarket(market.id)}
                  className={`group flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 font-medium ${
                    selectedMarket === market.id
                      ? 'text-red-600 font-bold bg-red-100'
                      : 'text-[#6B7280] hover:text-black hover:font-bold hover:bg-gray-50'
                    }`}
                  style={{
                    minWidth: 'fit-content',
                    height: '32px',
                  }}
                >
                  <span className="text-sm whitespace-nowrap">
                    {personalizedLabels[market.name as keyof typeof personalizedLabels] || market.name}
                  </span>
                </button>
              ))}
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
          {activeSection === "wallet" && <WalletPage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "activity" && <Activity />}
          {/* {activeSection === "notifications" && <CreateMessage />} */}
          {activeSection === "dashboard" && <TutorialBridge activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "bitcoinPot" && <PredictionPotTest activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "referralProgram" && <ReferralProgram activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "home" && <LandingPage activeSection={activeSection} setActiveSection={setActiveSection} isMobileSearchActive={isMobileSearchActive} searchQuery={searchQuery} selectedMarket={selectedMarket} setSelectedMarket={setSelectedMarket} />}
          {activeSection === "makePrediction" && <MakePredicitions activeSection={activeSection} setActiveSection={setActiveSection} /> }
          {activeSection === "AI" && <GamesHub activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "createPot" && <CreatePotPage navigateToPrivatePot={navigateToPrivatePot} />}
          {activeSection === "ideas" && <IdeasPage activeSection={activeSection} setActiveSection={setActiveSection} />}
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
              <FifteenMinuteQuestions className="mt-20" />
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
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 z-40">
        <div className="flex items-center justify-around py-1">
          <button
            onClick={() => {
              setActiveSection('home');
              setIsMobileSearchActive(false);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${
              activeSection === 'home' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${
              activeSection === 'home' ? 'bg-red-100' : ''
            }`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13z"/>
              </svg>
            </div>
            <span className="text-[10px] font-medium">Home</span>
          </button>

            <button
            onClick={handleMobileSearchToggle}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${
              isMobileSearchActive ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${
              isMobileSearchActive ? 'bg-red-100' : ''
            }`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <span className="text-[10px] font-medium">Search</span>
          </button>

          <button
            onClick={() => setActiveSection('discord')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${
              activeSection === 'discord' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${
              activeSection === 'discord' ? 'bg-red-100' : ''
            }`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1V3H9V1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21ZM17 20H7V9H17V20Z"/>
              </svg>
            </div>
            <span className="text-[10px] font-medium">How it works</span>
          </button>

          <button
            onClick={() => setActiveSection('ideas')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all duration-200 ${
              activeSection === 'ideas' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mb-0.5 transition-all duration-200 ${
              activeSection === 'ideas' ? 'bg-red-100' : ''
            }`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
              </svg>
            </div>
            <span className="text-[10px] font-medium">Ideas</span>
          </button>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
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