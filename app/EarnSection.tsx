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
    <div className="flex flex-col items-center p-3 gap-2 max-w-sm mx-auto">
      {/* Deposit / Withdraw Toggle Buttons */}
      <div className="flex justify-center w-full mb-2">
        <button
          onClick={() => {
            setEarnSection("deposit");
            setActiveButton("deposit");
          }}
          className={`${activeButton === "deposit" ? "bg-[#000000] text-white" : "bg-[#0e3993]"} text-white px-4 py-2 rounded-full focus:outline-none transition-colors`}
        >
          Lend
        </button>
        <button
          onClick={() => {
            setEarnSection("withdraw");
            setActiveButton("withdraw");
          }}
          className={`${activeButton === "withdraw" ? "bg-[#000000] text-white" : "bg-[#0e3993]"} text-white px-4 py-2 rounded-full focus:outline-none transition-colors`}
        >
          Withdraw
        </button>
      </div>

      {/* Earn Section */}
      <Earn vaultAddress={selectedVaultAddress}>
        {earnSection === "deposit" && (
          <EarnDeposit className="bg-[#1E2B50] dark:bg-[#1E2B50] p-6 rounded-2xl border border-white shadow-md max-w-sm mx-auto">
            <EarnDetails className="text-gray-900 font-semibold text-xl mb-4" />
            <DepositBalance className="mb-3 bg-[#f1f2f5] text-gray-700 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium" />
            <DepositAmountInput className="mb-4 bg-[#f1f2f5] text-gray-900 rounded-xl border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <DepositButton className="dark:bg-[#d3c81a]" />
          </EarnDeposit>
        )}
        {earnSection === "withdraw" && (
          <EarnWithdraw className="bg-[#1E2B50] dark:bg-[#1E2B50] p-6 rounded-2xl border border-white shadow-md max-w-sm mx-auto">
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


