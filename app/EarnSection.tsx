import React, { useState } from "react";
import { Earn, EarnDeposit, EarnDetails, DepositBalance, DepositAmountInput, DepositButton, EarnWithdraw, WithdrawBalance, WithdrawAmountInput, WithdrawButton } from '@coinbase/onchainkit/earn';

// Define props interface with the correct type for selectedVaultAddress
interface EarnSectionProps {
  selectedVaultAddress: `0x${string}`; // Use the exact type expected by Earn
}

const EarnSection: React.FC<EarnSectionProps> = ({ selectedVaultAddress }) => {
  const [earnSection, setEarnSection] = useState<"deposit" | "withdraw">("deposit");
  const [activeButton, setActiveButton] = useState<"deposit" | "withdraw">("deposit");

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      {/* Deposit / Withdraw Toggle Buttons */}
      <div className="flex w-full max-w-sm">
        <button
          onClick={() => {
            setEarnSection("deposit");
            setActiveButton("deposit");
          }}
          className={`flex-1 py-3 focus:outline-none transition-colors font-medium ${
            activeButton === "deposit" 
              ? "bg-gray-900 text-white border-b-2 border-blue-400" 
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
          className={`flex-1 py-3 focus:outline-none transition-colors font-medium ${
            activeButton === "withdraw" 
              ? "bg-gray-900 text-white border-b-2 border-blue-400" 
              : "bg-gray-900 text-gray-400"
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Earn Section */}
      <Earn vaultAddress={selectedVaultAddress}>
        {earnSection === "deposit" && (
          <EarnDeposit className="bg-gray-900 p-6 rounded border border-gray-800 shadow-md w-full max-w-sm mx-auto">
            <EarnDetails className="text-gray-900 font-semibold text-xl mb-4" />
            <DepositBalance className="mb-3 bg-[#f1f2f5] text-gray-700 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium" />
            <DepositAmountInput className="mb-4 bg-[#f1f2f5] text-gray-900 rounded-xl border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <DepositButton className="dark:bg-[#d3c81a]" />
          </EarnDeposit>
        )}
        {earnSection === "withdraw" && (
          <EarnWithdraw className="bg-gray-900 p-6 rounded border border-gray-800 shadow-md w-full max-w-sm mx-auto">
            <EarnDetails className="text-gray-900 font-semibold text-xl mb-4" />
            <WithdrawBalance className="mb-3 bg-[#f1f2f5] text-gray-700 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium" />
            <WithdrawAmountInput className="mb-4 bg-[#f1f2f5] text-gray-900 rounded-xl border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <WithdrawButton className="dark:bg-[#d3c81a]"/>
          </EarnWithdraw>
        )}
      </Earn>
    </div>
  );
};

export default EarnSection;