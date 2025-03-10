'use client';

import { useState, useEffect } from 'react';
import React from "react";
import BuySection from "./BuySection";
import CurrencyDisplay from './LiveCurrencies';
import NavigationMenu from "./NavigationMenu";
import ResponsiveLogo from './ResponsiveLogo';
import CurrencySelection from './Liquidity';
import EarnSection from "./EarnSection";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import type { Token } from '@coinbase/onchainkit/token';
import { Swap, SwapAmountInput, SwapToggleButton, SwapButton, SwapMessage, SwapToast,SwapSettings,
  SwapSettingsSlippageDescription,
  SwapSettingsSlippageInput,
  SwapSettingsSlippageTitle } from '@coinbase/onchainkit/swap';
import Send from './SendSection';

 
// const { address } = useAccount();
 
  const ETHToken: Token = {
    address: "",
    chainId: 8453,
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
    image: "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
  };

  const WETHToken: Token = {
    address: "0x4200000000000000000000000000000000000006",
    chainId: 8453,
    decimals: 18,
    name: "Wrapped Eth",
    symbol: "WETH",
    image:"https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282"
  };
 
  const USDCToken: Token = {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    chainId: 8453,
    decimals: 6,
    name: "USDC",
    symbol: "USDC",
    image: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
  };

  

  const CbBTCToken: Token = {
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    chainId: 8453,
    decimals: 8,
    name: "Coinbase BTC",
    symbol: "cbBTC",
    image: "https://basescan.org/token/images/cbbtc_32.png",
  };

  const EURCToken: Token = {
    address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
    chainId: 8453,
    decimals: 6,
    name: "EURC",
    symbol: "EURC",
    image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
  };
 
  const CADCToken: Token = {
    address: "0x043eB4B75d0805c43D7C834902E335621983Cf03",
    chainId: 8453,
    decimals: 18,
    name: "Canadian Dollar",
    symbol: "CADC",
    image: "https://www.svgrepo.com/show/405442/flag-for-flag-canada.svg",
  };

  const BRZToken: Token = {
    address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4",
    chainId: 8453,
    decimals: 18,
    name: "Brazilian Real",
    symbol: "BRZ",
    image: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
  };

  const LiraToken: Token = {
    address: "0x1A9Be8a692De04bCB7cE5cDDD03afCA97D732c62",
    chainId: 8453,
    decimals: 8,
    name: "Turkish Lira",
    symbol: "TRYB",
    image: "https://www.svgrepo.com/show/242355/turkey.svg",
  };

  const MEXPeso: Token = {
    address: "0x269caE7Dc59803e5C596c95756faEeBb6030E0aF",
    chainId: 8453,
    decimals: 6,
    name: "Mexican Peso",
    symbol: "MXNe",
    image: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
  };
  // add other tokens here to display them as options in the swap
  const swappableTokens: Token[] = [ USDCToken, EURCToken,CADCToken,BRZToken,ETHToken, CbBTCToken,MEXPeso,LiraToken,
     WETHToken];



  export default function App() {
    const [activeSection, setActiveSection] = useState('swap'); // Include setActiveSection
    const [isMounted, setIsMounted] = useState(false);
  
    
    useEffect(() => {
      setIsMounted(true);
  
      // Function to set black color on all matching elements
  const setBlackColor = () => {
    // Combined selector for data-testid and span elements with specific classes
    const selector = '[data-testid="ockTokenSelectButton_Symbol"], span.ock-font-family.font-semibold.overflow-hidden.text-ellipsis.whitespace-nowrap.text-left';
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.color = 'black'; // Set the color to black
        element.style.setProperty('color', 'black', 'important'); // Override conflicting styles
      }
    });
  };

  // Run it once when the component mounts
  setBlackColor();

  // Set up a MutationObserver to watch for new elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        setBlackColor(); // Reapply styles when new nodes are added
      }
    });
  });

  // Observe changes in the entire document
  observer.observe(document.body, { childList: true, subtree: true });

  // Clean up the observer when the component unmounts
  return () => {
    observer.disconnect();
  };
}, []); // Empty dependency array: runs once on mount
  
    if (!isMounted) {
      return <div>Loading...</div>;
    }
  
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background dark:bg-background text-white dark:text-white">
        <header className="pt-0.1 pr-4 pl-4 relative w-screen">
          
  {/* Top horizontal line - moved down using translateY */}
  {/* <div className="bg-[#fafafa] absolute left-0 right-0 w-screen max-md:block hidden transform translate-y-1"> */}

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

  {/* Bottom horizontal line */}
  {/* <div className="border-b border-gray-300 absolute bottom-0 left-0 right-0 w-screen max-md:block hidden"></div> */}
  
</header>


  
        <main className="flex-grow flex items-center justify-center mt-2">
  <div
    className={`w-full p-1 ${
      activeSection === "earn" ? "max-w-5xl" : "max-w-sm"
    }`}
  >
    {activeSection === "swap" && (
      <div>
        <Swap experimental={{ useAggregator: true }} className="bg-[#080330] p-1 max-w-sm mx-auto">
          <SwapSettings>
            <SwapSettingsSlippageTitle className="text-[#EA580C]">
              Max. slippage
            </SwapSettingsSlippageTitle>
            <SwapSettingsSlippageDescription className="text-[#EA580C]">
              Your swap will revert if the prices change by more than the
              selected percentage.
            </SwapSettingsSlippageDescription>
            <SwapSettingsSlippageInput />
          </SwapSettings>
          <SwapAmountInput
            label="Sell"
            swappableTokens={swappableTokens}
            token={USDCToken}
            type="from"
            className="mb-1 bg-gray-800  text-white rounded-2xl shadow-sm border border-gray-900"
          />
          <SwapToggleButton className="mb-2" />
          <SwapAmountInput
            label="Buy"
            swappableTokens={swappableTokens}
            token={BRZToken}
            type="to"
            className="mb-1 bg-gray-900 text-white rounded-2xl shadow-sm border border-gray-900"
          />
          <SwapButton className="w-full bg-[#0000aa] rounded-full py-2 transition-colors" />
          <SwapMessage className="mt-2 text-gray-800 text-sm" />
          <SwapToast />
        </Swap>
        <div className="mt-2 text-red-500 text-center">
          Please ensure your wallet is connected and set to the Base network
          (chainId: 8453).
        </div>
      </div>
    )}

    {activeSection === "earn" && (
      <div>
      
        <EarnSection />
      </div>
    )}

{activeSection === "send" && (
      <Send/>
    )}

{activeSection === "liquidity" && (
      <CurrencySelection/>
    )}

    {activeSection === "buy" && <BuySection />}
    {activeSection === "market" && <CurrencyDisplay />}
  </div>
</main>
  
        {/* <Footer /> */}
      </div>
    );
  }
