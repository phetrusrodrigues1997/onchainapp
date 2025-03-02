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
    <div className="flex flex-col min-h-screen font-sans bg-background dark:bg-background text-white dark:text-white">
      
      <header className="pt-4 pr-4 pl-4">
  <div className="flex justify-between items-center">
    {/* Logo */}
    <div className="logo-container">
      <span className="relative inline-block font-sans">
      {/* bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 */}
      <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-[#c2b709]">

          Airborne<span className="text-black">Eagle🦅</span>
        </span>
      </span>
    </div>

    {/* Navigation Menu */}
    <nav className="flex space-x-10"> {/* Increased space-x to 8 */}
  <div className="bg-white-400 rounded-full px-6 py-2 flex space-x-10"> {/* Added space-x-6 for button spacing */}
    <button 
      onClick={() => setActiveSection('swap')} 
      className={`font-medium ${activeSection === 'swap' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Swap
    </button>
    <button 
      onClick={() => setActiveSection('earn')} 
      className={`font-medium ${activeSection === 'earn' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Earn
    </button>

    <button 
      onClick={() => setActiveSection('buy')} 
      className={`font-medium ${activeSection === 'buy' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Buy
    </button>

    <button 
      onClick={() => setActiveSection('market')} 
      className={`font-medium ${activeSection === 'market' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Market
    </button>
    <button 
      onClick={() => setActiveSection('send')} 
      className={`font-medium ${activeSection === 'send' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Send
    </button>

    <button 
      onClick={() => setActiveSection('card')} 
      className={`font-medium ${activeSection === 'card' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Debit Card
    </button>
    <button 
      onClick={() => setActiveSection('help')} 
      className={`font-medium ${activeSection === 'help' ? 'text-[#c2b709]' : 'text-[#2E2E2E] hover:text-black'}`}

    >
      Help
    </button>

    
  </div>
</nav>


    {/* Wallet Container */}
    <div className="wallet-container">
      <Wallet>
        <ConnectWallet className='bg-[#FFFFFF]'>
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



<main className="flex-grow flex items-center justify-center mt-14">
        <div className="max-w-3xl w-full p-1">
  {activeSection === 'swap' && (
    <Swap className="bg-gradient-to-r from-white via-white to-white p-1 max-w-md mx-auto">
      <SwapAmountInput
        label="Sell"
        swappableTokens={swappableTokens}
        token={EURCToken}
        type="from"
        className="mb-1 bg-[#ffffff] text-white rounded-2xl border border-gray-600 shadow-sm"

      />
      <SwapToggleButton className="mb-2" />
      <SwapAmountInput
        label="Buy"
        swappableTokens={swappableTokens}
        token={USDCToken}
        type="to"
        className="mb-1 bg-[#fbfbfb] text-white rounded-2xl border border-gray-600 shadow-sm"

      />
      <SwapButton className="w-full bg-[#c2b709] text-white rounded-md py-2 hover:bg-green-600 transition-colors" />
      <SwapMessage className="mt-2 text-gray-800 text-sm" />
      <SwapToast />
    </Swap>
  )}

  {activeSection === 'earn' && (
    
    <div className="flex flex-col items-center p-3 gap-2">
  {/* Button section aligned to the left */}
  <div className="flex justify-start w-full mb-2 ml-60">
  <button 
        onClick={() => {
          setEarnSection('deposit');
          setActiveButton('deposit'); // Set the active button
        }} 
        className={`${
          activeButton === 'deposit' ? 'bg-gray-200' : 'bg-[#ffffff]'
        } text-gray-800 px-4 py-2 rounded-full focus:outline-none transition-colors`}
      >
        Deposit
      </button>

      <button 
        onClick={() => {
          setEarnSection('withdraw');
          setActiveButton('withdraw'); // Set the active button
        }} 
        className={`${
          activeButton === 'withdraw' ? 'bg-gray-200' : 'bg-[#ffffff]'
        } text-gray-800 px-4 py-2 rounded-full focus:outline-none transition-colors`}
      >
        Withdraw
      </button>
  </div>

  {/* Main content section that stays centered */}
  <Earn vaultAddress="0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca">
    {/* EarnDeposit Component */}
    {earnSection === 'deposit' && (
      <EarnDeposit className="bg-[#fefefe] rounded-md p-4 border border-gray-200 shadow-sm">
        <EarnDetails className="text-white font-medium text-lg mb-2" />
        <DepositBalance className="mb-1 bg-[#fafafa] text-white rounded-2xl border border-gray-600 shadow-sm" />
        <DepositAmountInput className="mb-1 bg-[#fafafa] text-white rounded-2xl border border-gray-600 shadow-sm" />
        <DepositButton />
      </EarnDeposit>
    )}

    {earnSection === 'withdraw' && (
      <EarnWithdraw className="bg-[#fafafa] rounded-md p-4 border border-gray-200 shadow-sm">
        <EarnDetails className="text-white font-medium text-lg mb-2" />
        <WithdrawBalance className="mb-1 bg-[#fafafa] text-white rounded-2xl border border-gray-600 shadow-sm" />
        <WithdrawAmountInput className="mb-1 bg-[#fafafa] text-white rounded-2xl border border-gray-600 shadow-sm" />
        <WithdrawButton />
      </EarnWithdraw>
    )}
  </Earn>
</div>



  )}

{activeSection === 'buy' && (
      <BuySection/>
    )}
</div>

      </main>

      <footer className="flex justify-between items-center p-4 text-sm text-gray-800 bg-white-100">
  <div>
    <span>2025 © AirborneEagle Solutions, </span>
    <span className="font-bold">v1.0.0</span>
    <span> · </span>
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
