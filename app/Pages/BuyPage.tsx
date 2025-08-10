import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { Buy } from '@coinbase/onchainkit/buy'; 
import { ETHToken, USDCToken } from '../Constants/coins';

const tokens = [
  { name: "USDC", token: USDCToken, description: "For pot entries", usage: "For your predictions" },
  { name: "ETH", token: ETHToken, description: "For gas fees", usage: "For gas fees (~$0.01-0.05)" },
];

const BuySection: React.FC = () => {
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
          background-color: #000000 !important;
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
      <div className="pt-20 pb-24">
        

        {/* Token Toggle */}
        <div className="max-w-lg mx-auto px-4 mb-8">
          <div className="flex bg-gray-50 rounded-lg p-1">
            {tokens.map((token, index) => (
              <button
                key={token.name}
                onClick={() => setSelectedTokenIndex(index)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md font-light transition-all duration-200 ${
                  selectedTokenIndex === index
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Image 
                  src={token.token.image ?? "/placeholder-token.png"} 
                  alt={token.token.symbol}
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                {token.token.symbol}
              </button>
            ))}
          </div>
        </div>

        

        {/* Buy Component */}
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-all duration-300">
            <Buy toToken={selectedToken.token} />
          </div>
        </div>
        {/* Selected Token Info */}
        <div className="max-w-lg mx-auto px-4 mb-8 text-center">
          
          <p className="text-invisible font-light text-sm mb-1">{selectedToken.description}</p>
          <p className="text-gray-400 font-light text-xs">{selectedToken.usage}</p>
        </div>
        {/* Header */}
        <div className="max-w-2xl mx-auto px-4 mb-12 text-center">
          
          <p className="text-gray-600 font-light mt-20">
            Buy the tokens you need to participate in prediction markets
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuySection;