import React, { useRef } from "react";

// Define the tokens
const ETHToken = {
  address: "",
  chainId: 8453,
  vaultAddress: "0xa0E430870c4604CcfC7B38Ca7845B1FF653D0ff1" as const, // Empty string, not selectable
  name: "Wrapped ETH",
  symbol: "WETH",
  image:"https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282"
};

const USDCToken = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  vaultAddress: "0xc1256Ae5FF1cf2719D4937adb3bbCCab2E00A2Ca" as const,
  name: "USDC",
  symbol: "USDC",
  image:
    "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

const CbBTCToken = {
  address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  chainId: 8453,
  vaultAddress: "0x543257eF2161176D7C8cD90BA65C2d4CaEF5a796" as const, // Empty string, not selectable
  name: "Coinbase Bitcoin",
  symbol: "cbBTC",
  image: "https://basescan.org/token/images/cbbtc_32.png",
};

const EURCToken = {
  address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  chainId: 8453,
  vaultAddress: "0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026" as const,
  name: "EURC",
  symbol: "EURC",
  image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
};

const tokens = [USDCToken,ETHToken, EURCToken,CbBTCToken];

// Define props interface
interface CurrencySliderProps {
  onSelectVaultAddress: (vaultAddress: `0x${string}`) => void;
}

const CurrencySlider: React.FC<CurrencySliderProps> = ({ onSelectVaultAddress }) => {
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
        <h2 className="text-lg text-white sm:text-xl font-bold mb-2 sm:mb-0">Featured</h2>
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
              className={`snap-start flex-shrink-0 w-48 sm:w-64 bg-white rounded-lg shadow-md p-1 sm:p-2 flex items-center ${
                token.vaultAddress ? "cursor-pointer hover:bg-gray-100" : "cursor-not-allowed opacity-50"
              }`}
              onClick={token.vaultAddress ? () => onSelectVaultAddress(token.vaultAddress as `0x${string}`) : undefined}
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