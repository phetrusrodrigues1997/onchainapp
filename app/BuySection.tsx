import React, { useEffect, useState } from "react";
import { Buy } from '@coinbase/onchainkit/buy'; 
import type { Token } from '@coinbase/onchainkit/token';

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

  const currencies = [
    { name: "pound", symbol: "£" },
    { name: "yen", symbol: "¥" },
    { name: "real", symbol: "R$" },
    { name: "peso", symbol: "$" },
  ];

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrencyIndex((prev) => (prev + 1) % currencies.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const inputField = document.querySelector('input[data-testid="ockTextInput_Input"]') as HTMLInputElement | null;
      if (inputField) {
        inputField.style.setProperty("color", "black", "important"); // Ensure color is applied
        inputField.style.caretColor = "black"; // Change caret color
      }
    }, 100);
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
    <div>
      <div className="w-full max-w-sm mx-auto p-4">
        <p className="text-xs sm:text-3xl font-bold text-white text-center mb-4 sm:mb-6">
          Buy USDC, swap it for the{' '}
          <span className="inline-block transition-all duration-300 ease-in-out">
            {currencies[currencyIndex].symbol} {currencies[currencyIndex].name}
          </span>
        </p>
      </div>

      <div className={`${getContainerWidth()} mx-auto p-4 bg-gray-900 rounded-lg shadow-md border border-gray-700`}>
        <p className="text-sm sm:text-base text-gray-400 text-center mb-4 sm:mb-6">
          We accept visa and mastercard.
        </p>

        {filteredTokens.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredTokens.map((item) => (
              <div
                key={item.token.symbol}
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg shadow-md border border-gray-300"
              >
                <Buy className="text-black" toToken={item.token} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No tokens found.</p>
        )}
      </div>
    </div>
  );
};

export default BuySection;
