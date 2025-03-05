import React, { useRef } from "react";

// Define the tokens
const ETHToken = {
  address: "",
  chainId: 8453,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  image:
    "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
};

const USDCToken = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
  name: "USDC",
  symbol: "USDC",
  image:
    "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

const CbBTCToken = {
  address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  chainId: 8453,
  decimals: 8,
  name: "Coinbase Bitcoin",
  symbol: "cbBTC",
  image: "https://basescan.org/token/images/cbbtc_32.png",
};

const EURCToken = {
  address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  chainId: 8453,
  decimals: 6,
  name: "EURC",
  symbol: "EURC",
  image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
};

// Array of tokens to display in the slider
const tokens = [ETHToken, USDCToken, CbBTCToken, EURCToken];

const CurrencySlider: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 relative">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-0">Featured</h2>
        <div className="flex space-x-1 sm:space-x-2 self-end sm:self-auto">
          <button
            onClick={scrollLeft}
            className="bg-gray-200 rounded-full p-1 sm:p-2 hover:bg-gray-300 transition-colors"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={scrollRight}
            className="bg-gray-200 rounded-full p-1 sm:p-2 hover:bg-gray-300 transition-colors"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={sliderRef}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory space-x-2 sm:space-x-4 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {tokens.map((token, index) => (
            <div
              key={index}
              className="snap-start flex-shrink-0 w-48 sm:w-64 bg-white rounded-lg shadow-md p-1 sm:p-2 flex items-center"
            >
              <img
                src={token.image}
                alt={token.name}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full mr-2 sm:mr-3"
              />
              <div className="flex flex-col">
                <h3 className="text-xs sm:text-sm text-black font-semibold">{token.name}</h3>
                <p className="text-[10px] sm:text-xs text-gray-500">Chain: Base</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>
        {`
          /* Hide scrollbar for Chrome, Safari, and Edge */
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export default CurrencySlider;