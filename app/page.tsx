'use client';

import { useState, useEffect } from 'react';
import React from "react";
import BuySection from "./BuySection";
import NavigationMenu from "./NavigationMenu";
import ResponsiveLogo from './ResponsiveLogo';
import EarnSection from "./EarnSection";
import CurrencySlider from "./CurrencySlider";
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownLink, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import type { Token } from '@coinbase/onchainkit/token';
import { Swap, SwapAmountInput, SwapToggleButton, SwapButton, SwapMessage, SwapToast,SwapSettings,
  SwapSettingsSlippageDescription,
  SwapSettingsSlippageInput,
  SwapSettingsSlippageTitle } from '@coinbase/onchainkit/swap';

 
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
    name: "Coinbase Bitcoin",
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
 
  // const CADCToken: Token = {
  //   address: "0x043eB4B75d0805c43D7C834902E335621983Cf03",
  //   chainId: 8453,
  //   decimals: 18,
  //   name: "CADC",
  //   symbol: "CADC",
  //   image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
  // };
  // add other tokens here to display them as options in the swap
  const swappableTokens: Token[] = [ USDCToken, EURCToken,ETHToken, CbBTCToken, WETHToken];


  export default function App() {
    const [activeSection, setActiveSection] = useState('swap'); // Include setActiveSection
    const [selectedVaultAddress, setSelectedVaultAddress] = useState<`0x${string}`>("0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca"); // Default to USDC’s vault address
    const [isMounted, setIsMounted] = useState(false);
  
    
    useEffect(() => {
      setIsMounted(true);
    }, []);
  
    if (!isMounted) {
      return <div>Loading...</div>;
    }
  
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background dark:bg-background text-white dark:text-white">
        <header className="pt-4 pr-4 pl-4 relative w-screen">
  {/* Top horizontal line - moved down using translateY */}
  <div className="border-t border-gray-300 absolute left-0 right-0 w-screen max-md:block hidden transform translate-y-0.8"></div>

  <div className="flex justify-between items-center py-2">
    <div className="flex md:gap-10 gap-2 items-center w-full">
      <ResponsiveLogo />
      <NavigationMenu activeSection={activeSection} setActiveSection={setActiveSection} />
    </div>
    <div className="wallet-container">
      <Wallet>
        <ConnectWallet className="bg-[#FFFFFF] dark:bg-[#F9F9F9] rounded-full">
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
  <div className="border-b border-gray-300 absolute bottom-0 left-0 right-0 w-screen max-md:block hidden"></div>
</header>





  
        <main className="flex-grow flex items-center justify-center mt-3">
  <div
    className={`w-full p-1 ${
      activeSection === "earn" ? "max-w-5xl" : "max-w-sm"
    }`}
  >
    {activeSection === "swap" && (
      <div>
        <Swap experimental={{ useAggregator: true }} className="bg-gradient-to-r from-white via-white to-white p-1 max-w-sm mx-auto">
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
            token={EURCToken}
            type="from"
            className="mb-1 bg-[#fdfdfd] text-white rounded-2xl shadow-sm border border-gray-100"
          />
          <SwapToggleButton className="mb-2" />
          <SwapAmountInput
            label="Buy"
            swappableTokens={swappableTokens}
            token={USDCToken}
            type="to"
            className="mb-1 bg-[#f2f2f2] text-white rounded-2xl shadow-sm"
          />
          <SwapButton className="w-full bg-[#d3c81a] text-white rounded-full py-2 transition-colors" />
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
        <CurrencySlider onSelectVaultAddress={setSelectedVaultAddress} />
        <EarnSection selectedVaultAddress={selectedVaultAddress} />
      </div>
    )}

    {activeSection === "buy" && <BuySection />}
  </div>
</main>
  
        {/* <Footer /> */}
      </div>
    );
  }
