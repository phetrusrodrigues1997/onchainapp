import React, { useEffect, useState } from "react";
import { Buy } from '@coinbase/onchainkit/buy'; 
import type { Token } from '@coinbase/onchainkit/token';
import { CreditCard, Wallet, ArrowRight } from 'lucide-react';

const USDCToken: Token = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
  name: "USDC",
  symbol: "USDC",
  image: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

const tokens = [
  { name: "USDC", token: USDCToken },
];

const BuySection: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currencyIndex, setCurrencyIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        inputField.offsetHeight;
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

  const getContainerWidth = () => {
    if (windowWidth < 640) return 'w-full max-w-sm';
    if (windowWidth < 768) return 'w-full max-w-md';
    if (windowWidth < 1024) return 'w-full max-w-lg';
    return 'w-full max-w-xl';
  };

  const filteredTokens = tokens.filter(item => {
    const query = searchQuery.trim().toLowerCase();
    const symbol = item.token.symbol.toLowerCase();
    const name = item.token.name.toLowerCase();
    return symbol.includes(query) || name.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#fefefe]">
      <div className="pt-20 pb-12">
        

        {/* Main Buy Section */}
        <div className={`${getContainerWidth()} mx-auto px-4`}>
          {filteredTokens.length > 0 ? (
            <div className="space-y-6">
              {filteredTokens.map((item) => (
                <div
                  key={item.token.symbol}
                  className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-gray-300"
                >
                  {/* Token Info Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <img 
                          src={item.token.image ?? ""} 
                          alt={item.token.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{item.token.symbol}</h3>
                        <p className="text-gray-500 text-sm">{item.token.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Wallet className="w-4 h-4" />
                      <ArrowRight className="w-4 h-4" />
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Buy Component */}
                  <div className="buy-component-wrapper">
                    <Buy toToken={item.token} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No tokens found</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="max-w-2xl mx-auto mt-16 px-4">
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Secure & Fast</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Secure</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Instant processing</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Low fees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuySection;