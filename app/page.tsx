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






// USDC Contract ABI (minimal)
const USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export default function App() {
  const { address, isConnected } = useAccount();
  const [activeSection, setActiveSection] = useState('home'); // Default section
  const [privatePotAddress, setPrivatePotAddress] = useState<string>(''); // For routing to private pots

  // Function to navigate to a private pot
  const navigateToPrivatePot = (contractAddress: string) => {
    setPrivatePotAddress(contractAddress);
    setActiveSection('privatePot');
  };

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

  // Get USDC balance
  const { data: userUsdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && isConnected }
  }) as { data: bigint | undefined };

  // Format USDC balance
  const formatUsdcBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.00';
    try {
      const formatted = formatUnits(balance, 6);
      return parseFloat(formatted).toFixed(2);
    } catch {
      return '0.00';
    }
  };

  


  

  




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
      
      {/* Dark green header */}
      <header className="z-50 bg-[#fdfdfd] px-4 py-3 shadow-md sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            {/* Mobile hamburger only - shows to left of logo on mobile */}
            <div className="md:hidden ml-2">
              <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
            </div>
            
            {/* Logo */}
            <div className="relative -ml-2">
              <div className="absolute -inset-1 rounded-full blur-md"></div>
              <ResponsiveLogo />
            </div>
          </div>
          
          {/* Desktop menu - centered in header */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
          </div>
          <div className="flex items-center ml-8">
            {/* USDC Balance Display - Desktop Only */}
            {isConnected && address && (
              <div 
                onClick={() => setActiveSection('buy')}
                className="hidden md:flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity duration-200"
              >
                <div className="text-xs text-gray-500 font-medium">Balance</div>
                <div className="text-sm text-[#00aa00] font-bold">${formatUsdcBalance(userUsdcBalance)}</div>
              </div>
            )}
            
            <div className={`wallet-container ${isMobile ? '-ml-2' : 'ml-4'}`}>
              <Wallet>
<ConnectWallet 
                  text={isMobile ? "Log In" : "Connect Wallet"}
                  className={`${isConnected ? '!bg-transparent !border-none !shadow-none !p-0' : ''} ${isMobile ? '!px-4 !py-2 !min-w-0' : ''}`}
                >
                {isConnected && (
                  <>
                    <Avatar className="h-8 w-8 rounded-full border-2 border-gray-200 hover:border-gray-300 transition-all duration-200" />
                    <div className="h-8 w-8 rounded-full border-2 border-gray-200 hover:border-gray-300 bg-gray-100 flex items-center justify-center transition-all duration-200">
                      <User className="h-4 w-4 text-gray-600" />
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

      </header>

      <main className="flex-grow bg-[#fefefe]">
        
          
          
          {/* {activeSection === "usernamePage" && <UsernameSetup />} */}
          {activeSection === "buy" && <BuySection activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "profile" && <ProfilePage/>}
          {activeSection === "discord" && <HowItWorksSection />}
          {activeSection === "wallet" && <WalletPage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "activity" && <Activity />}
          {/* {activeSection === "notifications" && <CreateMessage />} */}
          {activeSection === "tutorial" && <TutorialBridge activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "bitcoinPot" && <PredictionPotTest activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "referralProgram" && <ReferralProgram activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "home" && <LandingPage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "makePrediction" && <MakePredicitions /> }
          {activeSection === "AI" && <GamesHub activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "createPot" && <CreatePotPage activeSection={activeSection} setActiveSection={setActiveSection} navigateToPrivatePot={navigateToPrivatePot} />}
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
          {/* Add more sections as needed */}
        
      </main>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-md shadow-lg border border-[#004400] transition-all duration-200 flex items-center z-50">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {toastMessage}
        </div>
      )}
    </div>
    
  );
  
}