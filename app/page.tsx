// App.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount,useSendTransaction } from 'wagmi';
import { parseUnits } from 'viem';
import PredictionPotTest from './Pages/PredictionPotTest';
import { cryptoTokens, stablecoinTokens, ETHToken, USDCToken, CbBTCToken, BRZToken, CADCToken, EURCToken } from './Token Lists/coins';
import { recordSwapPoints, getUserPoints } from './Database/actions';
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
import HomePage from './Pages/WalletPage';
import UsernameSetup from './Pages/UsernameSetup';
import CreateMessage from './Pages/MessagesPage';





export default function App() {
  const [activeSection, setActiveSection] = useState('predictionPot'); // Default section
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [swappableTokensList, setSwappableTokensList] = useState<Token[]>(stablecoinTokens); // Default to Stablecoins
  const [isMounted, setIsMounted] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [showSwapButton, setShowSwapButton] = useState(true);
  const [selectedOption, setSelectedOption] = useState<"Stablecoins" | "Crypto">("Stablecoins");
  const { address } = useAccount();
  const { sendTransaction } = useSendTransaction();
  const feeRecipient = '0x1Ac08E56c4d95bD1B8a937C6EB626cFEd9967D67';

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    if (activeSection === "swap") {
      setSelectedOption("Stablecoins");
      setSwappableTokensList(stablecoinTokens);
    }
  }, [activeSection]);

  // Update user points when wallet address changes
  useEffect(() => {
    if (address) {
      getUserPoints(address)
        .then(setPoints)
        .catch((err) => console.error(err));
    }
  }, [address]);

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

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      [data-testid="ockSwapButton_Button"] {
      background-color: #d3c81a !important;
        color: white !important;
      }
      [data-testid="ockSwapButton_Button"] span {
        color: white !important;
      }
    `;
    document.head.appendChild(style);
  
    // Cleanup on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);



if (!isMounted) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-green-900 to-yellow-800 text-white">
      <div className="p-8 bg-gradient-to-r from-green-900 to-yellow-800 rounded-lg shadow-2xl border border-[#d3c81a] max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium mb-2">Loading Application</h2>
          <p className="text-[#d3c81a]">Please wait while we initialize the interface</p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d3c81a]"></div>
        </div>
      </div>
    </div>
  );
}

  return (
    
    <div className="flex flex-col min-h-screen font-sans text-white dark:text-white">
      {/* Dark green header */}
      <header className="top-0 z-50 bg-gradient-to-r from-[#3f3f3f] to-[#444444] border-b border-white/20 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
            {/* Logo */}
            <div className="relative">
              <div className="absolute -inset-1 rounded-full blur-md"></div>
              <ResponsiveLogo />
            </div>
            
            {/* Navigation Menu */}
            <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
          
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

      <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-[#3f3f3f] to-[#444444] ">
        
          
          
          {activeSection === "usernamePage" && <UsernameSetup />}
          {activeSection === "buy" && <BuySection />}
          {activeSection === "market" && <CurrencyDisplay/>}
          {activeSection === "discord" && <DiscordXSection />}
          {activeSection === "home" && <HomePage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "activity" && <Activity />}
          {activeSection === "notifications" && <CreateMessage />}
          {activeSection === "predictionPot" && <PredictionPotTest />}
          

        
      </main>
      {/* Footer */}
      {/* from-green-900 to-yellow-800*/}
      <footer className="bg-gradient-to-r from-[#3f3f3f] to-[#444444] border-t border-white/20  py-4 px-4">
  <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
    <div className="text-sm text-[#d3c81a] mb-2 md:mb-0">
      © 2025 GoldenEagle Finance. All rights reserved.
    </div>
    <div className="flex space-x-6">
      <a href="#" className="text-sm text-white hover:text-shadow-[0_0_5px_#00ff00] transition-all">Terms</a>
      <a href="#" className="text-sm text-white hover:text-shadow-[0_0_5px_#00ff00] transition-all">Privacy</a>
      <a href="#" className="text-sm text-white hover:text-shadow-[0_0_5px_#00ff00] transition-all">Support</a>
    </div>
  </div>
</footer>
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