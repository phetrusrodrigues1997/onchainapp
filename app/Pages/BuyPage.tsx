import React, { useEffect, useState } from "react";
import Image from 'next/image';
import { Buy } from '@coinbase/onchainkit/buy'; 
import { ETHToken } from '../Constants/coins';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { ArrowDown, CreditCard, Wallet, Download, Copy, Check, QrCode } from 'lucide-react';
import { getPrice } from '../Constants/getPrice';

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
  const [activeTab, setActiveTab] = useState<'buy' | 'receive'>('buy');
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);

  // Get ETH balance
  const ethBalance = useBalance({
    address,
    chainId: 8453
  });

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getPrice('ETH');
        setEthPrice(price);
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(4700); // Fallback price
        setIsLoadingPrice(false);
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to convert ETH to USD
  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

  const copyAddressToClipboard = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

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
      

        {/* Tab Navigation */}
        <div className="max-w-lg mx-auto px-4 mb-8">
          <div className="flex bg-gray-100 rounded-2xl p-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'buy'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                Buy ETH
              </div>
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'receive'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Receive ETH
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'buy' ? (
          // Buy Tab Content
          <div className="max-w-lg mx-auto px-4">
            {/* Balance Display */}
            {isConnected && address && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <img 
                      src={ETHToken.image || ''} 
                      alt="ETH"
                      className="w-6 h-6 object-cover"
                    />
                    <h2 className="text-lg font-bold text-gray-900">
                      {ethBalance.data ? `$${ethToUsd(ethBalance.data.value).toFixed(2)}` : '$0.00'}
                    </h2>
                  </div>
                  <p className="text-gray-600 font-medium">ETH Balance</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-gray-300 transition-all duration-300 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Purchase ETH</h2>
              </div>
              <Buy toToken={ETHToken} />
            </div>
          </div>
        ) : (
          // Receive Tab Content
          <div className="max-w-lg mx-auto px-4">
            {!isConnected || !address ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Wallet</h3>
                <p className="text-gray-600">Connect your wallet to view your receive address</p>
              </div>
            ) : (
              <>
                {/* Balance Display */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <img 
                        src={ETHToken.image || ''} 
                        alt="ETH"
                        className="w-6 h-6 object-cover"
                      />
                      <h2 className="text-lg font-bold text-gray-900">
                        {ethBalance.data ? `$${ethToUsd(ethBalance.data.value).toFixed(2)}` : '$0.00'}
                      </h2>
                    </div>
                    <p className="text-gray-600 font-medium">ETH Balance</p>
                  </div>
                </div>

                {/* Address Card */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6 shadow-lg">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Your Wallet Address</h3>
                    <p className="text-gray-600 text-sm">Share this address to receive ETH on Base network</p>
                  </div>

                  {/* Address Display */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="font-mono text-sm text-gray-900 break-all text-center leading-relaxed">
                      {address}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={copyAddressToClipboard}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowQR(!showQR)}
                      className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </button>
                  </div>
                </div>

                {/* QR Code Section */}
                {showQR && (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg mb-6">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-6">QR Code</h3>
                      
                      {/* QR Code Display */}
                      <div className="bg-white rounded-2xl p-6 mb-6 inline-block shadow-inner">
                        <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                          {/* Placeholder QR pattern */}
                          <div className="grid grid-cols-8 gap-1">
                            {Array.from({ length: 64 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 ${
                                  Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        Scan this QR code to get the wallet address
                      </p>

                      <button
                        onClick={() => setShowQR(false)}
                        className="text-gray-500 hover:text-gray-700 font-medium"
                      >
                        Hide QR Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Network Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-700 text-sm font-semibold mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Base Network</span>
                  </div>
                  <p className="text-blue-600 text-xs">
                    Only send ETH on Base network to this address
                  </p>
                </div>
                
          
        
              </>
            )}
          </div>
        )}
        
      </div>
    </div>
  );
};

export default BuySection;