import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { Buy } from '@coinbase/onchainkit/buy'; 
import { ETHToken } from '../Constants/coins';
import { ArrowDown, CreditCard, Wallet, Download } from 'lucide-react';

interface BuySectionProps {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

const tokens = [
  { name: "ETH", token: ETHToken, description: "For everything", usage: "Pot entries & gas fees" },
];

const BuySection: React.FC<BuySectionProps> = ({ activeSection, setActiveSection }) => {
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
  const selectedToken = tokens[selectedTokenIndex];

  useEffect(() => {
    const styleId = 'custom-button-style';

    const injectStyle = () => {
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = `
        [data-testid="ockBuyButton_Button"],
        [data-testid="ockSwapButton_Button"] {
          background-color: #ee0000 !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 12px !important;
          transition: all 0.2s ease !important;
        }

        [data-testid="ockBuyButton_Button"]:hover,
        [data-testid="ockSwapButton_Button"]:hover {
          background-color: #1f2937 !important;
          border-color: #9ca3af !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        [data-testid="ockBuyButton_Button"] span,
        [data-testid="ockSwapButton_Button"] span {
          color: white !important;
          font-weight: 600 !important;
          font-size: 16px !important;
        }

        .ock-bg-default {
          background-color: white !important;
          border: 2px solid #e5e7eb !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }

        .ock-text-foreground {
          color: #111827 !important;
        }

        input[data-testid="ockTextInput_Input"] {
          color: #111827 !important;
          background-color: transparent !important;
          border: none !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          box-shadow: none !important;
        }

        input[data-testid="ockTextInput_Input"]:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        /* Fix dropdown overflow issues */
        .ock-dropdown,
        [role="listbox"],
        [role="menu"],
        [data-testid*="dropdown"],
        [data-testid*="select"],
        .ock-select-dropdown,
        .ock-buy-dropdown {
          max-height: 300px !important;
          overflow-y: auto !important;
          z-index: 9999 !important;
          position: absolute !important;
        }

        /* Custom scrollbar for dropdown */
        .ock-dropdown::-webkit-scrollbar,
        [role="listbox"]::-webkit-scrollbar,
        [data-testid*="dropdown"]::-webkit-scrollbar,
        [data-testid*="select"]::-webkit-scrollbar {
          width: 6px !important;
        }

        .ock-dropdown::-webkit-scrollbar-track,
        [role="listbox"]::-webkit-scrollbar-track,
        [data-testid*="dropdown"]::-webkit-scrollbar-track,
        [data-testid*="select"]::-webkit-scrollbar-track {
          background: #f1f5f9 !important;
          border-radius: 3px !important;
        }

        .ock-dropdown::-webkit-scrollbar-thumb,
        [role="listbox"]::-webkit-scrollbar-thumb,
        [data-testid*="dropdown"]::-webkit-scrollbar-thumb,
        [data-testid*="select"]::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 3px !important;
        }

        .ock-dropdown::-webkit-scrollbar-thumb:hover,
        [role="listbox"]::-webkit-scrollbar-thumb:hover,
        [data-testid*="dropdown"]::-webkit-scrollbar-thumb:hover,
        [data-testid*="select"]::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
      `;
    };

    injectStyle();
    const timeout = setTimeout(injectStyle, 1000);
    
    const observer = new MutationObserver(injectStyle);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const setInputStyles = () => {
      const inputField = document.querySelector('input[data-testid="ockTextInput_Input"]') as HTMLInputElement | null;
      if (inputField) {
        inputField.style.setProperty("color", "#111827", "important");
        inputField.style.caretColor = "#111827";
        inputField.style.backgroundColor = "transparent";
        inputField.style.display = 'none';
        void inputField.offsetHeight; // Force reflow
        inputField.style.display = '';
      }
    };
  
    const timeoutId = setTimeout(setInputStyles, 100);
    const observer = new MutationObserver(setInputStyles);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ minHeight: 'calc(100vh + 400px)' }}>
      <div className="pt-12 pb-24">
        
        {/* Header Section */}
        <div className="max-w-2xl mx-auto px-4 mb-12 text-center">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CreditCard className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Buy ETH</h1>
          <p className="text-gray-600 font-light text-lg">
            Get ETH to participate in prediction markets and pay for gas fees
          </p>
        </div>


        

        {/* Buy Component */}
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-gray-300 transition-all duration-300 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Purchase ETH</h2>
            </div>
            <Buy toToken={ETHToken} />
          </div>
        </div>

        {/* Or Divider */}
        <div className="max-w-lg mx-auto px-4 my-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
        </div>

        {/* Receive Tokens Button */}
        <div className="max-w-lg mx-auto px-4">
          <button
            onClick={() => setActiveSection && setActiveSection('wallet')}
            className="w-full bg-red-600 text-white rounded-xl p-6 hover:bg-gray-800 transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
          >
            <Download className="w-6 h-6" />
            <div className="text-left">
              <div className="text-lg font-bold">Receive Tokens</div>
              <div className="text-sm text-gray-300">Get tokens sent to your wallet</div>
            </div>
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default BuySection;