import React, { useState } from "react";
import { Earn, EarnDeposit, EarnDetails, DepositBalance, DepositAmountInput, DepositButton, EarnWithdraw, WithdrawBalance, WithdrawAmountInput, WithdrawButton } from '@coinbase/onchainkit/earn';


const EarnSection: React.FC = () => {
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
          className={`${
            activeButton === "deposit" ? "bg-[#000000] text-white" : "bg-[#ffffff]"
          } text-black px-4 py-2 rounded-full focus:outline-none transition-colors`}
        >
          Deposit
        </button>
        <button
          onClick={() => {
            setEarnSection("withdraw");
            setActiveButton("withdraw");
          }}
          className={`${
            activeButton === "withdraw" ? "bg-[#000000] text-white" : "bg-[#ffffff]"
          } text-black px-4 py-2 rounded-full focus:outline-none transition-colors`}
        >
          Withdraw
        </button>
      </div>

      {/* Earn Section */}
      <Earn vaultAddress="0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca">
        {earnSection === "deposit" && (
            <EarnDeposit className="bg-[#fdfdfd] dark:bg-[#fdfdfd] p-6 rounded-2xl shadow-md max-w-sm mx-auto border border-gray-100 dark:border-gray-100">
            <EarnDetails className="text-gray-900 font-semibold text-xl mb-4" />
            <DepositBalance className="mb-3 bg-[#f2f2f2] text-gray-700 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium" />
            <DepositAmountInput className="mb-4 bg-[#f2f2f2] text-gray-900 rounded-xl border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <DepositButton />
          </EarnDeposit>
        )}
        {earnSection === "withdraw" && (
          <EarnWithdraw className="bg-[#fdfdfd] dark:bg-[#fdfdfd] p-6 rounded-2xl shadow-md max-w-sm mx-auto border border-gray-100 dark:border-gray-100">
            <EarnDetails className="text-gray-900 font-semibold text-xl mb-4" />
            <WithdrawBalance className="mb-3 bg-[#f2f2f2] text-gray-700 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium" />
            <WithdrawAmountInput className="mb-4 bg-[#f2f2f2] text-gray-900 rounded-xl border border-gray-200 px-4 py-3 text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200" />
            <WithdrawButton />
          </EarnWithdraw>
        )}
      </Earn>
    </div>
  );
};

export default EarnSection;
