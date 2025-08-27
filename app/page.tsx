// App.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { User } from 'lucide-react';
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






// Contract now uses ETH directly - no USDC needed
const LIVE_POT_ADDRESS = '0x3dfdEdC82B14B1dd5f45Ae0F2A5F3738A487096e';

export default function App() {
  const { address, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState('home'); // Default section
  const [privatePotAddress, setPrivatePotAddress] = useState<string>(''); // For routing to private pots
  const [hasEnteredLivePot, setHasEnteredLivePot] = useState(false); // Track live pot entry
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false); // Track mobile search state

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
    <div className="min-h-screen bg-[#fefefe] text-white overflow-hidden">
      
      
      <header className="z-50 bg-[#fdfdfd] px-4 py-3 md:py-4 shadow-md sticky top-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center flex-1">
              {/* Mobile hamburger only - shows to left of logo on mobile */}
              <div className="md:hidden">
                <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
              </div>
              
              {/* Logo */}
              <div className="relative -ml-2">
                <div className="absolute -inset-1 rounded-full blur-md"></div>
                <ResponsiveLogo />
              </div>
            </div>
            
            {/* Desktop menu - slightly left of center */}
            <div className="hidden md:flex flex-1 justify-center ml-12">
              <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
            </div>
            
            <div className="flex items-center justify-end flex-1">
            {/* Balance display removed - ETH balance handled by wallet */}
            
            {/* Spacer to push Ideas button to the right */}
            <div className="hidden md:flex flex-1"></div>
            
            {/* Ideas link */}
            <button
              onClick={() => setActiveSection('ideas')}
              className="hidden md:block text-red-600 hover:text-red-700 font-semibold text-sm md:text-base translate-x-12 transition-colors duration-200 z-10 relative"
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
        </div>

      </header>

      <main className="flex-grow bg-[#fefefe] pb-16 md:pb-0">
        
          
          
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
          {activeSection === "home" && <LandingPage activeSection={activeSection} setActiveSection={setActiveSection} isMobileSearchActive={isMobileSearchActive} />}
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
        <div className="flex items-center justify-around py-0.5">
          <button
            onClick={() => {
              setActiveSection('home');
              setIsMobileSearchActive(false);
            }}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${
              activeSection === 'home' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
              activeSection === 'home' ? 'bg-red-100' : ''
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h1v7c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-7h1a1 1 0 0 0 .707-1.707l-9-9a.999.999 0 0 0-1.414 0l-9 9A1 1 0 0 0 3 13z"/>
              </svg>
            </div>
            <span className="text-xs font-medium">Home</span>
          </button>

            <button
            onClick={handleMobileSearchToggle}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${
              isMobileSearchActive ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
              isMobileSearchActive ? 'bg-red-100' : ''
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <span className="text-xs font-medium">Search</span>
          </button>

          <button
            onClick={() => setActiveSection('profile')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${
              activeSection === 'profile' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
              activeSection === 'profile' ? 'bg-red-100' : ''
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1V3H9V1L3 7V9H5V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H21ZM17 20H7V9H17V20Z"/>
              </svg>
            </div>
            <span className="text-xs font-medium">Stats</span>
          </button>

          

          <button
            onClick={() => setActiveSection('ideas')}
            className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${
              activeSection === 'ideas' ? 'text-red-600' : 'text-gray-500'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-200 ${
              activeSection === 'ideas' ? 'bg-red-100' : ''
            }`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
              </svg>
            </div>
            <span className="text-xs font-medium">Ideas</span>
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