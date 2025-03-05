import React, { useEffect, useState } from "react";
import { Buy } from '@coinbase/onchainkit/buy'; 
import type { Token } from '@coinbase/onchainkit/token';


const EURCToken: Token = {
  address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  chainId: 8453,
  decimals: 6,
  name: "EURC",
  symbol: "EURC",
  image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
};

const ETHToken: Token = {
  address: "",
  chainId: 8453,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  image: "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
};

const USDCToken: Token = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
  name: "USDC",
  symbol: "USDC",
  image: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

const CbBTCToken: Token = {
  address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  chainId: 8453,
  decimals: 8,
  name: "Coinbase Bitcoin",
  symbol: "cbBTC",
  image: "https://basescan.org/token/images/cbbtc_32.png",
};

const tokens = [
  { name: "USDC", token: USDCToken },
  { name: "EURC", token: EURCToken },
  { name: "ETH", token: ETHToken },
  { name: "cbBTC", token: CbBTCToken }
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
    <div className={`${getContainerWidth()} mx-auto p-4 sm:p-6 bg-[#Fafafa] rounded-xl shadow-lg border border-gray-200`}>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-4 text-center">Buy Crypto</h2>
      <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
        We accept visa and mastercard.
      </p>

      <label htmlFor="token-search" className="sr-only">Search tokens</label>
      <input
  id="token-search"
  type="text"
  placeholder="Search tokens..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full p-2 mb-4 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
/>

      {filteredTokens.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredTokens.map((item) => (
            <div
              key={item.token.symbol}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 rounded-lg shadow-md border border-gray-300"
            >
              <Buy toToken={item.token} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No tokens found.</p>
      )}
    </div>
  );
};

export default BuySection;