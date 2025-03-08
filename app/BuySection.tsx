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

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
    <div className={`${getContainerWidth()} mx-auto p-4 bg-[#1E1E1E] rounded-lg shadow-md border border-gray-700`}>
      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-4 text-center">Buy Crypto</h2>
      <p className="text-sm sm:text-base text-gray-400 text-center mb-4 sm:mb-6">
        We accept visa and mastercard.
      </p>


      {filteredTokens.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredTokens.map((item) => (
            <div
              key={item.token.symbol}
              className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-md border border-gray-300"
            >
              <Buy toToken={item.token} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400">No tokens found.</p>
      )}
    </div>
  );
};

export default BuySection;