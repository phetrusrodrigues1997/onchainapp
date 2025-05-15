// App.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount,useSendTransaction } from 'wagmi';
import { parseUnits } from 'viem';
import SwapDropdown from './Sections/TokenTypeDropdown'; // Adjust the path if needed
import { cryptoTokens, stablecoinTokens, ETHToken, USDCToken, CbBTCToken, BRZToken, CADCToken, EURCToken } from './Token Lists/coins';
import { recordSwapPoints, getUserPoints } from './Database/actions';
import BuySection from "./Pages/BuyPage";
import CurrencyDisplay from './Pages/Charts';
import Activity from './Pages/TransactionsPage';
import NavigationMenu from "./Sections/NavigationMenu";
import ResponsiveLogo from './Sections/ResponsiveLogo';
import CurrencySelection from './Pages/LiquidityPage';
import DiscordXSection from './Pages/Discord';
import EarnSection from "./Pages/EarnPage";
import Send from './Chatbot/SendPage';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import type { Token } from '@coinbase/onchainkit/token';
import { Swap, SwapAmountInput, SwapToggleButton, SwapButton, SwapMessage, SwapToast, SwapSettings, SwapSettingsSlippageDescription, SwapSettingsSlippageInput, SwapSettingsSlippageTitle } from '@coinbase/onchainkit/swap';
import HomePage from './Pages/WalletPage';
import UsernameSetup from './Pages/UsernameSetup';
import CreateMessage from './Pages/MessagesPage';
import LendingPool from './Pages/LendingBorrowingTest';





export default function App() {
  const [activeSection, setActiveSection] = useState('swap');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [swappableTokensList, setSwappableTokensList] = useState<Token[]>(stablecoinTokens); // Default to Stablecoins
  const [isMounted, setIsMounted] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [showSwapButton, setShowSwapButton] = useState(false);
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
      background-color: #0000aa !important;
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
      <header className="top-0 z-50 bg-gradient-to-r from-green-900 to-yellow-800 border-b border-white/20 px-4 py-3 shadow-md">
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

      <main className="flex-grow flex items-center justify-center bg-gradient-to-r from-green-900 to-yellow-800 ">
        <div className={`w-full p-1 ${activeSection === "earn" ? "max-w-5xl" : "max-w-sm"}`}>
          
          {activeSection === "swap" && (
            <div className="animate-fadeIn">
            
            <div>
              <h1
      className="text-3xl md:text-3xl font-bold text-center mt-10 leading-tight"
      style={{
        fontFamily: "'Montserrat', sans-serif",
        color: "#ffffff",
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.6), 0 0 6px rgba(0, 0, 0, 0.3)',
      }}
    >
      FX trading & remittances <br />redefined.
    </h1>
                  {/* <p
  className="mt-4 text-lg md:text-xl text-center text-green-300"
  style={{
    fontFamily: "'Montserrat', sans-serif",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
  }}
>
  Fast. Transparent. Borderless. <span className="currency-animation ml-1">💸</span>
</p> */}
              {/* Pass the selection change callback */}
          <SwapDropdown
  onSelectionChange={(option) => {
    setSelectedOption(option);
    if (option === "Crypto") {
      setSwappableTokensList(cryptoTokens);
      displayToast('Switched to Crypto tokens');
    } else {
      setSwappableTokensList(stablecoinTokens);
      displayToast('Switched to Stablecoin tokens');
    }
  }}
/>
<Swap
  experimental={{ useAggregator: true }}
  className="bg-transparent p-1 max-w-sm mx-auto mt-8"
  onSuccess={async () => {
    if (address) {
      await recordSwapPoints(address);
      const updatedPoints = await getUserPoints(address);
      setPoints(updatedPoints);
    }
  }}
>
  <SwapSettings>
    <SwapSettingsSlippageTitle className="text-[#EA580C]">
      Max. slippage
    </SwapSettingsSlippageTitle>
    <SwapSettingsSlippageDescription className="text-[#EA580C]">
      Your swap will revert if the prices change by more than the selected percentage.
    </SwapSettingsSlippageDescription>
    <SwapSettingsSlippageInput />
  </SwapSettings>

  <SwapAmountInput
    key={`sell-${activeSection}-${selectedOption}`}
    label="Sell"
    swappableTokens={swappableTokensList}
    token={
      activeSection === "swap"
        ? selectedOption === "Crypto"
          ? ETHToken
          : USDCToken
        : undefined
    }
    type="from"
    className="mb-1 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg text-white rounded-2xl hover:border-[#d3c81a] hover:shadow-[#d3c81a]/50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus-within:ring-2 focus-within:ring-[#d3c81a]/70"
  />
  <SwapToggleButton
  className="
    mb-2
    relative           /* position context so z-index applies */
    z-10               /* high stacking priority */
    bg-[#28282B]        /* dark card color */
    hover:bg-gray-700  /* hover feedback */
    p-2                /* comfortable padding */
    rounded-full       /* pill shape */
    shadow-lg          /* depth from page below */
    transition         /* smooth state changes */
    duration-200       /* speed up/down */
    ease-out
    border
               /* easing for hover */
  "
/>

  <SwapAmountInput
    key={`buy-${activeSection}-${selectedOption}`}
    label="Buy"
    swappableTokens={swappableTokensList}
    token={
      activeSection === "swap"
        ? selectedOption === "Crypto"
          ? CbBTCToken
          : EURCToken
        : undefined
    }
    type="to"
    className="mb-1 bg-[#343434] backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg text-white rounded-2xl hover:border-[#d3c81a] hover:shadow-[#d3c81a]/50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus-within:ring-2 focus-within:ring-[#d3c81a]/70"
  />

  {/* Only show the actual SwapButton after "Proceed to Swap" */}
  {showSwapButton && (
    <SwapButton className="w-full bg-[#0000bb] text-white font-bold rounded-full py-2 transition-colors disabled:opacity-85"

    />
  )}

  <SwapMessage className="mt-2 text-gray-800 text-sm" />
  <SwapToast />
</Swap>

{/* Render "Proceed to Swap" only if the actual SwapButton hasn't been shown yet */}
{!showSwapButton && (
  <button
  onClick={async () => {
    try {
      
      // send the 0.00001 ETH fee
      await sendTransaction({
        to: feeRecipient,
        value: parseUnits('0.000005', ETHToken.decimals)
      });
      
      // Wait for 10 seconds using setTimeout
  await new Promise(resolve => setTimeout(resolve, 9000));
      setShowSwapButton(true);
    } catch (err) {
      console.error('Fee transfer failed:', err);
      // optionally notify user of the failure
    }
  }}
  className="w-full bg-yellow-500 hover:bg-yellow-400 text-green-950 font-bold rounded-full py-2 transition-colors disabled:opacity-85"


  >
    Trade Now
  </button>
)}

              
              
              {/* Points Display */}
              {address && points !== null && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center bg-transparent px-4 py-2 rounded-md border border-white/20">
                    <div className="w-8 h-8 rounded-full bg-[#d3c81a] flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div className="text-left ">
                      <span className="text-[#d3c81a] text-sm block">Swap Points</span>
                      <span className="text-white font-bold text-lg">{points}</span>
                    </div>
                  </div>
                </div>
              )}
              
              
              
              {/* Trust indicators */}
              {/* <div className="mt-10 grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-black/40 border border-[#004400] flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-[#00aa00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-200">Secure</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-black/40 border border-[#004400] flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-[#00aa00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-200">Fast</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-black/40 border border-[#004400] flex items-center justify-center mb-2">
                    <svg className="w-6 h-6 text-[#00aa00]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-200">Low Fees</span>
                </div>
              </div> */}



            </div>
            </div>
          )}
          {activeSection === "earn" && <EarnSection />}
          {activeSection === "usernamePage" && <UsernameSetup />}
          {activeSection === "send" && <Send setActiveSection={setActiveSection} />}
          {activeSection === "liquidity" && <CurrencySelection />}
          {activeSection === "buy" && <BuySection />}
          {activeSection === "market" && <CurrencyDisplay/>}
          {activeSection === "discord" && <DiscordXSection />}
          {activeSection === "home" && <HomePage activeSection={activeSection} setActiveSection={setActiveSection} />}
          {activeSection === "activity" && <Activity />}
          {activeSection === "notifications" && <CreateMessage />}
          {activeSection === "LendingBorrowing" && <LendingPool />}
          

        </div>
      </main>
      {/* Footer */}
      <footer className="bg-gradient-to-r from-green-900 to-yellow-800 border-t border-white/20  py-4 px-4">
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