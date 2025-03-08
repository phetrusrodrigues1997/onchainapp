// EarnSection.tsx
import React, { useState } from "react";
import { Earn, EarnDeposit, EarnDetails, DepositBalance, DepositAmountInput, DepositButton, EarnWithdraw, WithdrawBalance, WithdrawAmountInput, WithdrawButton } from '@coinbase/onchainkit/earn';
import Select from 'react-select';
import { tokens } from './tokens';

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

  // Reusable TokenSelect component
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
    <div className="flex flex-col items-center max-w-sm mx-auto px-0 sm:px-0">
      {/* Deposit / Withdraw Toggle Buttons */}
      <div className="flex w-full max-w-sm ">
        <button
          onClick={() => {
            setEarnSection("deposit");
            setActiveButton("deposit");
          }}
          className={`rounded flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none transition-colors font-medium border border-gray-700 ${
            activeButton === "deposit"
              ? "bg-[#000077] text-white font-semibold"
              : "bg-gray-900 text-gray-400"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => {
            setEarnSection("withdraw");
            setActiveButton("withdraw");
          }}
          className={`rounded flex-1 py-2 sm:py-3 text-sm sm:text-base focus:outline-none transition-colors font-medium border border-gray-700 ${
            activeButton === "withdraw"
              ? "bg-[#000077] text-white font-semibold"
              : "bg-gray-900 text-gray-400"
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Earn Component */}
      <Earn vaultAddress={selectedToken.vaultAddress as `0x${string}`}>
        {earnSection === "deposit" && (
          <EarnDeposit className="bg-gray-900 p-4 sm:p-6 rounded border border-gray-700 shadow-md w-full max-w-sm mx-auto rounded border">
            <TokenSelect/>
            <EarnDetails className="text-gray-900 font-semibold text-lg sm:text-xl mb-4" />
            <DepositAmountInput className="mb-4 bg-gray-800 text-gray-900 rounded-xl px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <DepositButton className=" w-full py-2 sm:py-3 text-sm sm:text-base" />
          </EarnDeposit>
        )}
        {earnSection === "withdraw" && (
          <EarnWithdraw className="bg-gray-900 p-4 sm:p-6 rounded border border-gray-700 shadow-md w-full max-w-sm mx-auto rounded border">
            <TokenSelect />
            <EarnDetails className="text-gray-900 font-semibold text-lg sm:text-xl mb-4" />
            <WithdrawAmountInput className="mb-4 bg-gray-800 text-gray-900 rounded-xl px-3 py-1 sm:px-4 sm:py-2 text-base sm:text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />            <WithdrawButton className=" w-full py-2 sm:py-3 text-sm sm:text-base" />
          </EarnWithdraw>
        )}
      </Earn>
    </div>
  );
};

export default EarnSection;