// EarnSection.tsx
import React, { useState } from "react";
import { Earn, EarnDeposit, EarnDetails, DepositBalance, DepositAmountInput, DepositButton, EarnWithdraw, WithdrawBalance, WithdrawAmountInput, WithdrawButton } from '@coinbase/onchainkit/earn';
import Select from 'react-select';
import { tokens } from '../Token Lists/earnTokens';

// Define custom styles for react-select to match the dark theme
const customStyles = {
  control: (provided: any) => ({
    ...provided,
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    color: 'white',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#555',
    },
    minHeight: '36px', // Smaller height for mobile
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#1a1a1a',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#333' : '#1a1a1a',
    color: 'white',
    '&:hover': {
      backgroundColor: '#444',
    },
    padding: '8px 12px', // Smaller padding for mobile
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: 'white',
  }),
};

const EarnSection: React.FC = () => {
  const [earnSection, setEarnSection] = useState<"deposit" | "withdraw">("deposit");
  const [activeButton, setActiveButton] = useState<"deposit" | "withdraw">("deposit");
  const [selectedToken, setSelectedToken] = useState(tokens[0]);

  // // Use useEffect to change the text color after the component mounts
  // useEffect(() => {
  //   // Target the div with class "ock-font-family font-semibold" inside the ockEarnBalance div
  //   const balanceElement = document.querySelector('[data-testid="ockEarnBalance"] .ock-font-family.font-semibold');
  //   if (balanceElement) {
  //     (balanceElement as HTMLElement).style.color = 'white';
  //   }
  // }, []); // Empty dependency array ensures this runs once on mount

  // Reusable TokenSelect componenttest
  const TokenSelect = () => (
    <Select
      value={selectedToken}
      onChange={(option) => setSelectedToken(option || tokens[0])}
      options={tokens.filter(token => token.vaultAddress)}
      getOptionLabel={(option) => option.name}
      formatOptionLabel={(option) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={option.image}
            alt={option.name}
            style={{ width: 16, height: 16, marginRight: 8 }} // Smaller images for mobile
          />
          {option.name}
        </div>
      )}
      getOptionValue={(option) => option.vaultAddress}
      styles={customStyles}
      className="mb-4"
    />
  );

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto px-0 sm:px-0 scale-80 sm:scale-100">
      {/* Deposit / Withdraw Toggle Buttons */}
      <div className="flex w-full max-w-sm ">
        <button
          onClick={() => {
            setEarnSection("deposit");
            setActiveButton("deposit");
          }}
          className={`rounded-md flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none transition-colors font-medium border border-gray-700 ${
            activeButton === "deposit"
              ? "bg-white text-black font-semibold"
              : "bg-[#101010] text-white font-semibold"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => {
            setEarnSection("withdraw");
            setActiveButton("withdraw");
          }}
          className={`rounded-md flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none transition-colors font-medium border border-gray-700 ${
            activeButton === "withdraw"
              ? "bg-white text-black font-semibold"
              : "bg-[#101010] text-white font-semibold"
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Earn Component */}
      <Earn vaultAddress={selectedToken.vaultAddress as `0x${string}`}>
        {earnSection === "deposit" && (
          <EarnDeposit className="bg-[#101010] p-4 sm:p-6 rounded-md border border-gray-700 shadow-md w-full max-w-sm mx-auto rounded border">
            {/* <TokenSelect/> */}
            <EarnDetails className="text-gray-900 font-semibold text-lg sm:text-xl mb-4" />
            <DepositBalance className="bg-gray-800"/>
            <DepositAmountInput className="mb-4 bg-gray-800 text-gray-900 rounded-xl px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <DepositButton className=" w-full py-2 sm:py-3 text-sm sm:text-base" />
          </EarnDeposit>
        )}
        {earnSection === "withdraw" && (
          <EarnWithdraw className="bg-[#101010] p-4 sm:p-6 rounded-md border border-gray-700 shadow-md w-full max-w-sm mx-auto rounded border">
            {/* <TokenSelect /> */}
            <EarnDetails className="text-gray-900 font-semibold text-lg sm:text-xl mb-4" />
             <WithdrawBalance className="bg-gray-800"/>
            <WithdrawAmountInput className="mb-4 bg-gray-800 text-gray-900 rounded-xl px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />            <WithdrawButton className=" w-full py-2 sm:py-3 text-sm sm:text-base" />
          </EarnWithdraw>
        )}
      </Earn>
    </div>
  );
};

export default EarnSection;