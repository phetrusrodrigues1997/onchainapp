// App.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SwapDropdown from './Sections/TokenTypeDropdown'; // Adjust the path if needed
import { cryptoTokens, stablecoinTokens, ETHToken, USDCToken, CbBTCToken, BRZToken, CADCToken } from './Token Lists/coins';
import { recordSwapPoints, getUserPoints } from './Database/actions';
import BuySection from "./Pages/BuyPage";
import CurrencyDisplay from './Pages/LiveCurrencies';

import NavigationMenu from "./Sections/NavigationMenu";
import ResponsiveLogo from './Sections/ResponsiveLogo';
import CurrencySelection from './Pages/LiquidityPage';
import DiscordXSection from './Pages/Discord';
import EarnSection from "./Pages/EarnPage";
import Send from './Pages/SendPage';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import type { Token } from '@coinbase/onchainkit/token';
import { Swap, SwapAmountInput, SwapToggleButton, SwapButton, SwapMessage, SwapToast, SwapSettings, SwapSettingsSlippageDescription, SwapSettingsSlippageInput, SwapSettingsSlippageTitle } from '@coinbase/onchainkit/swap';
import LiveCryptoPrices from './Pages/LiveCryptoPrices';
import HomePage from './Pages/HomePage';




export default function App() {
  const [activeSection, setActiveSection] = useState('swap');
  const [swappableTokensList, setSwappableTokensList] = useState<Token[]>(stablecoinTokens); // Default to Stablecoins
  const [isMounted, setIsMounted] = useState(false);
  const [points, setPoints] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<"Stablecoins" | "Crypto">("Stablecoins");
  const { address } = useAccount();

  

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

//   useEffect(() => {
//   if (activeSection === "swap") {
//     const titleElement = document.querySelector('[data-testid="ockSwap_Title"]');
//     if (titleElement) {
//       titleElement.textContent = selectedOption || "Stablecoins"; // Default to "Stablecoins" if selectedOption is falsy
//     }
//   }
// }, [selectedOption, activeSection]);

  if (!isMounted) return <div>Loading...</div>;

  return (
    
    <div className="flex flex-col min-h-screen font-sans bg-background dark:bg-background text-white dark:text-white">
      <header className="pt-0.1 pr-4 pl-4 relative w-screen">
      {activeSection !== "home" && 
        <div className="flex justify-between items-center py-2">
          <div className="flex md:gap-10 gap-2 items-center w-full">
          
            <ResponsiveLogo />
            <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
          </div>
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet className="bg-[#d3c81a] dark:bg-[#d3c81a] rounded-full">
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
}
      </header>

      <main className="flex-grow flex items-center justify-center mt-2">
        <div className={`w-full p-1 ${activeSection === "earn" ? "max-w-5xl" : "max-w-sm"}`}>
          
          {activeSection === "swap" && (
            
            <div>
              {/* Pass the selection change callback */}
          <SwapDropdown
  onSelectionChange={(option) => {
    setSelectedOption(option);
    if (option === "Crypto") {
      setSwappableTokensList(cryptoTokens);
    } else {
      setSwappableTokensList(stablecoinTokens);
    }
  }}
/>
              <Swap
                experimental={{ useAggregator: true }}
                className="bg-[#100420] p-1 max-w-sm mx-auto"
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
  label="Sell"
  swappableTokens={swappableTokensList}
  token={selectedOption === "Crypto" ? ETHToken : USDCToken}
  type="from"
  className="mb-1 bg-[#100420] text-white rounded-2xl shadow-sm border border-gray-500"
/>
<SwapToggleButton className="mb-2" />
<SwapAmountInput
  label="Buy"
  swappableTokens={swappableTokensList}
  token={selectedOption === "Crypto" ? CbBTCToken : CADCToken}
  type="to"
  className="mb-1 bg-[#100420] text-white rounded-2xl shadow-sm border border-gray-400"
/>
                <SwapButton className="w-full bg-[#d3c81a] rounded-full py-2 transition-colors" />
                <SwapMessage className="mt-2 text-gray-800 text-sm" />
                <SwapToast />
              </Swap>
              <LiveCryptoPrices/>
              {address && points !== null && (
                <div className="mt-6 text-black text-center font-serif tracking-wide">
                <span className="bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-2 rounded-full shadow-md inline-block">
                  Swap points: <span className="font-semibold">{points}</span>
                </span>
              </div>
              )}
              <div className="mt-2 text-red-500 text-center">
                Please ensure your wallet is connected and set to the Base network (chainId: 8453).
              </div>
            </div>
          )}
          {activeSection === "earn" && <EarnSection />}
          {activeSection === "send" && <Send />}
          {activeSection === "liquidity" && <CurrencySelection />}
          {activeSection === "buy" && <BuySection />}
          {activeSection === "market" && <CurrencyDisplay />}
          {activeSection === "discord" && <DiscordXSection />}
          {/* {activeSection === "home" && <HomePage activeSection={activeSection} setActiveSection={setActiveSection} />} */}
          
        </div>
      </main>
    </div>
  );
}
