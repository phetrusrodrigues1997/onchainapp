// App.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount,useSendTransaction } from 'wagmi';
import PredictionPotTest from './Pages/PredictionPotTest';
import LandingPage from './Pages/LandingPage';
import BitcoinBetting from './Pages/BitcoinBetting';
// import { cryptoTokens, stablecoinTokens, ETHToken, USDCToken, CbBTCToken, BRZToken, CADCToken, EURCToken } from './Token Lists/coins';
import BuySection from "./Pages/BuyPage";
import CurrencyDisplay from './Pages/Charts';
import Activity from './Pages/TransactionsPage';
import NavigationMenu from "./Sections/NavigationMenu";
import ResponsiveLogo from './Sections/ResponsiveLogo';
import DiscordXSection from './Pages/Discord';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import type { Token } from '@coinbase/onchainkit/token';
// import { Swap, SwapAmountInput, SwapToggleButton, SwapButton, SwapMessage, SwapToast, SwapSettings, SwapSettingsSlippageDescription, SwapSettingsSlippageInput, SwapSettingsSlippageTitle } from '@coinbase/onchainkit/swap';
import WalletPage from './Pages/WalletPage';
import UsernameSetup from './Pages/UsernameSetup';
import CreateMessage from './Pages/MessagesPage';





export default function App() {
  const [activeSection, setActiveSection] = useState('home'); // Default section
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  // const [swappableTokensList, setSwappableTokensList] = useState<Token[]>(stablecoinTokens); // Default to Stablecoins
  const [isMounted, setIsMounted] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [showSwapButton, setShowSwapButton] = useState(true);
  const [selectedOption, setSelectedOption] = useState<"Stablecoins" | "Crypto">("Stablecoins");
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const feeRecipient = '0x1Ac08E56c4d95bD1B8a937C6EB626cFEd9967D67';

  


  

  // Mounting and MutationObserver for styling
  useEffect(() => {
    setIsMounted(true);
    const setBlackColor = () => {
      const selector =
        '[data-testid="ockTokenSelectButton_Symbol"], span.ock-font-family.font-semibold.overflow-hidden.text-ellipsis.whitespace-nowrap.text-left';
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (element instanceof HTMLElement) {
          element.style.color = 'black';
          element.style.setProperty('color', 'black', 'important');
        }
      });
    };
    setBlackColor();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) setBlackColor();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);




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
    
     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white overflow-hidden">
      {/* Animated background elements */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-500"></div>
      </div> */}
      
      {/* Dark green header */}
      <header className="z-50 bg-white px-4 py-3 shadow-md sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full blur-md"></div>
              <ResponsiveLogo />
            </div>
            
            {/* Navigation Menu */}
            <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
          </div>
          <div className="wallet-container">
            <Wallet>
            <ConnectWallet className="bg-[#d3c81a] text-black dark:bg-[#d3c81a] rounded-full lg:mr-4">
                <Avatar className="h-6 w-6" />
                <Name />
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

      </header>

      <main className="flex-grow flex items-center justify-center bg-[#f5f5f5] -mt-32">
        
          
          
          {activeSection === "usernamePage" && <UsernameSetup />}
          {activeSection === "buy" && <BuySection />}
          {activeSection === "market" && <CurrencyDisplay/>}
          {activeSection === "discord" && <DiscordXSection />}
          {activeSection === "wallet" && <WalletPage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "activity" && <Activity />}
          {activeSection === "notifications" && <CreateMessage />}
          {activeSection === "bitcoinPot" && <PredictionPotTest activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "home" && <LandingPage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "bitcoinBetting" && <BitcoinBetting contractAddress="0x390896082E635c9F9f07C0609d73140e4F166471" /> }

        
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