// App.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
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
import LiveCryptoPrices from './Sections/LiveCryptoPrices';
import HomePage from './Pages/WalletPage';
import UsernameSetup from './Pages/UsernameSetup';
import CreateMessage from './Pages/MessagesPage';

export default function App() {
  const [activeSection, setActiveSection] = useState('swap');
  const [swappableTokensList, setSwappableTokensList] = useState<Token[]>(stablecoinTokens); // Default to Stablecoins
  const [isMounted, setIsMounted] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<"Stablecoins" | "Crypto">("Stablecoins");
  const { address } = useAccount();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
        background-color: white !important;
        color: white !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 4px 12px rgba(0, 170, 0, 0.3) !important;
        height: 52px !important;
        letter-spacing: 0.5px !important;
      }
  
      [data-testid="ockSwapButton_Button"]:hover {
        background-color: #00cc00 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 16px rgba(0, 170, 0, 0.4) !important;
      }
  
      [data-testid="ockSwapButton_Button"] span {
        color: black !important;
        font-family: 'Inter', sans-serif !important;
        font-size: 16px !important;
      }

      [data-testid="ockTokenSelectButton"] {
        border-radius: 6px !important;
        background: #003300 !important;
        border: 1px solid #004400 !important;
        transition: all 0.2s ease !important;
      }

      [data-testid="ockTokenSelectButton"]:hover {
        border: 1px solid #00aa00 !important;
        background: #004400 !important;
      }

      [data-testid="ockSwapToggleButton"] {
        background: #003300 !important;
        border-radius: 50% !important;
        width: 36px !important;
        height: 36px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.2s ease !important;
        border: 1px solid #004400 !important;
      }

      [data-testid="ockSwapToggleButton"]:hover {
        background: #004400 !important;
        border-color: #00aa00 !important;
      }

      [data-testid="ockSwapToggleButton"] svg {
        color: #00aa00 !important;
      }
      
      .ock-swap-amount-input {
        background-color: #003300 !important;
        border-color: #004400 !important;
        color: white !important;
      }
      
      .ock-swap-amount-input:focus-within {
        border-color: #00aa00 !important;
        box-shadow: 0 0 0 2px rgba(0, 170, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(style);
  
    // Cleanup on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#002200] text-white">
        <div className="p-8 bg-[#003300] rounded-lg shadow-2xl border border-[#004400] max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium mb-2">Loading Application</h2>
            <p className="text-green-300">Please wait while we initialize the interface</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00aa00]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-100 bg-[#002200]">
      {/* Dark green header */}
      <header className="sticky top-0 z-50 bg-[#003300] border-b border-[#004400] px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="relative">
              <div className="absolute -inset-1 bg-[#00aa00]/20 rounded-full blur-md"></div>
              <ResponsiveLogo />
            </div>
            
            {/* Navigation Menu */}
            <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
          </div>
          
          {/* Wallet Connection */}
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet className="bg-[#00aa00] text-white font-medium py-2 px-4 rounded-md hover:bg-[#00cc00] shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2">
                <Avatar className="h-5 w-5 rounded-full border border-white/30" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2 bg-[#003300] border-b border-[#004400]" hasCopyAddressOnClick>
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10 rounded-full border border-[#004400]" />
                    <div>
                      <Name className="font-medium text-white" />
                      <Address className="text-sm text-green-300" />
                    </div>
                  </div>
                  <div className="mt-2 py-2 px-3 bg-[#002200] rounded-md">
                    <EthBalance className="font-medium text-white" />
                  </div>
                </Identity>
                <div className="bg-[#003300]">
                  <WalletDropdownLink
                    icon="wallet"
                    href="https://keys.coinbase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 hover:bg-[#004400] transition-colors duration-200 text-green-200"
                  >
                    Wallet
                  </WalletDropdownLink>
                  <WalletDropdownDisconnect className="px-4 py-3 text-red-400 hover:bg-red-900/30 transition-colors duration-200" />
                </div>
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-start py-4 px-2 sm:py-8 sm:px-4">
        <div className={`w-full ${activeSection === "earn" ? "max-w-5xl" : "max-w-md"}`}>
          
        {activeSection === "swap" && (
  <div className="animate-fadeIn">
    {/* Heading and other elements remain unchanged */}
    <div className="mb-6">
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
    </div>
    <div className="mb-8">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00aa00] to-[#008800] rounded-lg blur-sm opacity-30"></div>
        <div className="relative bg-[#003300] rounded-lg border border-[#004400] shadow-xl p-4 sm:p-6">
          <div className="max-h-[80vh] overflow-auto">
            <Swap
              experimental={{ useAggregator: true }}
              className="max-w-sm mx-auto bg-[#002200] rounded-lg border border-[#004400] shadow-xl p-6"
              onSuccess={async () => {
                if (address) {
                  await recordSwapPoints(address);
                  const updatedPoints = await getUserPoints(address);
                  setPoints(updatedPoints);
                  displayToast('Swap completed successfully!');
                }
              }}
            >
              <SwapSettings className="mb-4">
                <SwapSettingsSlippageTitle className="text-green-200">Slippage</SwapSettingsSlippageTitle>
                <SwapSettingsSlippageInput className="bg-[#002200] text-white border border-[#004400] rounded-md" />
                <SwapSettingsSlippageDescription className="text-sm text-green-300">Adjust slippage tolerance</SwapSettingsSlippageDescription>
              </SwapSettings>
              <div className="mb-1 text-sm font-medium text-green-200">You send</div>
              <SwapAmountInput
                key={`sell-${activeSection}-${selectedOption}`}
                label="Sell"
                swappableTokens={swappableTokensList}
                token={activeSection === "swap" ? (selectedOption === "Crypto" ? ETHToken : USDCToken) : undefined}
                type="from"
                className="mb-3 bg-[#002200] rounded-md shadow-md border border-[#004400] hover:border-[#00aa00] transition-all duration-200"
              />
              <div className="flex justify-center my-2">
                <SwapToggleButton className="mb-2" />
              </div>
              <div className="mb-1 text-sm font-medium text-green-200">You receive</div>
              <SwapAmountInput
                key={`buy-${activeSection}-${selectedOption}`}
                label="Buy"
                swappableTokens={swappableTokensList}
                token={activeSection === "swap" ? (selectedOption === "Crypto" ? CbBTCToken : EURCToken) : undefined}
                type="to"
                className="mb-4 bg-[#002200] rounded-md shadow-md border border-[#004400] hover:border-[#00aa00] transition-all duration-200"
              />
              <SwapButton className="w-full font-bold rounded-md text-black py-3 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-85" />
              <SwapMessage className="mt-3 text-green-300 text-sm" />
              <SwapToast />
            </Swap>
          </div>
        </div>
      </div>
    </div>
    {/* Other elements like Points Display and Trust Indicators remain unchanged */}
  </div>
)}
          
          {/* Other sections */}
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
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#003300] border-t border-[#004400] py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-green-300 mb-2 md:mb-0">
            © 2025 Your Company. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-green-300 hover:text-[#00cc00] transition-colors">Terms</a>
            <a href="#" className="text-sm text-green-300 hover:text-[#00cc00] transition-colors">Privacy</a>
            <a href="#" className="text-sm text-green-300 hover:text-[#00cc00] transition-colors">Support</a>
          </div>
        </div>
      </footer>
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#003300] text-white px-4 py-2 rounded-md shadow-lg border border-[#004400] transition-all duration-200 flex items-center z-50">
          <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {toastMessage}
        </div>
      )}
      
      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
