'use client';

import { useState } from 'react';
import { Earn,
  EarnDeposit,
  EarnDetails,
  DepositBalance,
  DepositAmountInput,
  DepositButton, 
  EarnWithdraw,
  WithdrawBalance,
  WithdrawAmountInput,
  WithdrawButton} from '@coinbase/onchainkit/earn';

  import React from "react";
import BuySection from "./BuySection";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

import type { Token } from '@coinbase/onchainkit/token';

import { 
  Swap, 
  SwapAmountInput, 
  SwapToggleButton, 
  SwapButton, 
  SwapMessage, 
  SwapToast, 
} from '@coinbase/onchainkit/swap'; 

 
// const { address } = useAccount();
 
  const ETHToken: Token = {
    address: "",
    chainId: 8453,
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
    image: "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
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
 
  // add other tokens here to display them as options in the swap
  const swappableTokens: Token[] = [ USDCToken, EURCToken,ETHToken, CbBTCToken];


  export default function App() {
    const [activeSection, setActiveSection] = useState('swap');
    const [earnSection, setEarnSection] = useState('deposit');
    const [activeButton, setActiveButton] = useState('deposit');
  
    return (
      <div className="flex flex-col min-h-screen font-sans bg-background text-foreground">
        <header className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="logo-container mb-4 sm:mb-0">
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-[#c2b709]">
                Airborne<span className="text-black">Eagle🦅</span>
              </span>
            </div>
  
            <nav className="flex flex-wrap justify-center gap-4">
              <div className="bg-white rounded-full px-4 py-2 flex flex-wrap gap-4">
                {['swap', 'earn', 'buy', 'market', 'send', 'card', 'help'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section)}
                    className={`font-medium text-sm sm:text-base ${
                      activeSection === section ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>
            </nav>
  
            <div className="wallet-container mt-4 sm:mt-0">
              <Wallet>
                <ConnectWallet className="bg-white">
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
                  <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com" target="_blank" rel="noopener noreferrer">
                    Wallet
                  </WalletDropdownLink>
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
        </header>
  
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            {activeSection === 'swap' && (
              <Swap className="p-4 rounded-lg bg-white shadow-md">
                <SwapAmountInput label="Sell" swappableTokens={swappableTokens} token={EURCToken} type="from" className="mb-2" />
                <SwapToggleButton className="mb-2" />
                <SwapAmountInput label="Buy" swappableTokens={swappableTokens} token={USDCToken} type="to" className="mb-2" />
                <SwapButton className="w-full" />
                <SwapMessage className="mt-2 text-gray-800 text-sm" />
                <SwapToast />
              </Swap>
            )}
  
            {activeSection === 'earn' && (
              <div className="flex flex-col items-center p-4">
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <button
                    onClick={() => {
                      setEarnSection('deposit');
                      setActiveButton('deposit');
                    }}
                    className={`px-4 py-2 rounded-full text-sm sm:text-base ${
                      activeButton === 'deposit' ? 'bg-gray-200' : 'bg-white'
                    }`}
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => {
                      setEarnSection('withdraw');
                      setActiveButton('withdraw');
                    }}
                    className={`px-4 py-2 rounded-full text-sm sm:text-base ${
                      activeButton === 'withdraw' ? 'bg-gray-200' : 'bg-white'
                    }`}
                  >
                    Withdraw
                  </button>
                </div>
  
                <Earn vaultAddress="0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca" className="w-full max-w-md">
                  {earnSection === 'deposit' && (
                    <EarnDeposit className="p-4 rounded-md bg-white shadow-md">
                      <EarnDetails className="font-medium text-lg mb-2" />
                      <DepositBalance className="mb-2" />
                      <DepositAmountInput className="mb-2" />
                      <DepositButton />
                    </EarnDeposit>
                  )}
                  {earnSection === 'withdraw' && (
                    <EarnWithdraw className="p-4 rounded-md bg-white shadow-md">
                      <EarnDetails className="font-medium text-lg mb-2" />
                      <WithdrawBalance className="mb-2" />
                      <WithdrawAmountInput className="mb-2" />
                      <WithdrawButton />
                    </EarnWithdraw>
                  )}
                </Earn>
              </div>
            )}
  
            {activeSection === 'buy' && <BuySection />}
          </div>
        </main>
  
        <footer className="p-4 text-sm text-gray-800 bg-white flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-2 sm:mb-0">
            <span>2025 © AirborneEagle Solutions, </span>
            <span className="font-bold">v1.0.0</span>
          </div>
          <div className="flex items-center">
            <span>A public good for</span>
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mx-1"></div>
            <span className="font-bold">Base</span>
          </div>
        </footer>
      </div>
    );
  }
