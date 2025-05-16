import React, { useRef } from 'react';

// Define the Token type
interface Token {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  image: string;
}

// Define the token constants
const BRZToken: Token = {
  address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4",
  chainId: 8453,
  decimals: 18,
  name: "Brazilian Real",
  symbol: "BRZ",
  image: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
};

const LiraToken: Token = {
  address: "0x1A9Be8a692De04bCB7cE5cDDD03afCA97D732c62",
  chainId: 8453,
  decimals: 8,
  name: "Turkish Lira",
  symbol: "TRYB",
  image: "https://www.svgrepo.com/show/242355/turkey.svg",
};

const MEXPeso: Token = {
  address: "0x269caE7Dc59803e5C596c95756faEeBb6030E0aF",
  chainId: 8453,
  decimals: 6,
  name: "Mexican Peso",
  symbol: "MXNe",
  image: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
};

// Array of currencies to display
const currencies: Token[] = [BRZToken, LiraToken, MEXPeso];

// Define the props interface
interface CurrencySelectionProps {
  className?: string;
}

const CurrencySelection: React.FC<CurrencySelectionProps> = ({ className = '' }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Function to handle currency click and redirect
  const handleCurrencyClick = (symbol: string) => {
    const redirectUrls: { [key: string]: string } = {
      CADC: '/currency/cadc',
      BRZ: 'https://aerodrome.finance/pools?token0=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&token1=0xE9185Ee218cae427aF7B9764A011bb89FeA761B4&type=10&factory=0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A&chain=8453',
      TRYB: 'https://aerodrome.finance/pools?token0=0x1A9Be8a692De04bCB7cE5cDDD03afCA97D732c62&token1=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&type=-1&factory=0x420DD381b31aEf6683db6B902084cB0FFECe40Da&chain=8453',
      MXNe: 'https://aerodrome.finance/pools?token0=0x269caE7Dc59803e5C596c95756faEeBb6030E0aF&token1=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&type=10&factory=0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A&chain=8453'
    };
    const url = redirectUrls[symbol] || '/';
    window.location.href = url; // Redirect using window.location
  };

  const scrollLeft = () => {
    if (sliderRef.current) {
      // Scroll by card width (256px on mobile, 288px on desktop)
      const scrollAmount = window.innerWidth < 640 ? 256 : 288;
      sliderRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      // Scroll by card width (256px on mobile, 288px on desktop)
      const scrollAmount = window.innerWidth < 640 ? 256 : 288;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={`min-h-screen bg-transparent py-8 px-4 flex items-center justify-center ${className}`}>
      <div className="max-w-4xl w-full bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-center sm:text-left mb-4 sm:mb-0">
            Provide Liquidity on Aerodrome
          </h2>
          <div className="flex space-x-2 self-center sm:self-auto">
            <button
              onClick={scrollLeft}
              className="bg-[#d3c81a] rounded-full p-2 hover:bg-[#2563EB] transition-colors"
            >
              <svg
                className="w-4 h-4 text-black"
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
              className="bg-[#d3c81a] rounded-full p-2 hover:bg-[#2563EB] transition-colors"
            >
              <svg
                className="w-4 h-4 text-black"
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
            className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory space-x-4 pb-4"
            style={{ scrollbarWidth: "none" }}
          >
            {currencies.map((currency) => (
              <div
                key={currency.symbol}
                onClick={() => handleCurrencyClick(currency.symbol)}
                className="snap-start flex-shrink-0 w-64 sm:w-72 h-80 bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-lg transition-shadow duration-300 border border-gray-300"
              >
                <img
                  src={currency.image}
                  alt={`${currency.name} flag`}
                  className="w-20 h-20 sm:w-24 sm:h-24 mb-8 object-contain"
                />
                <h3 className="text-lg sm:text-xl font-semibold text-black text-center line-clamp-2">{currency.name}</h3>
                <p className="text-base sm:text-lg text-gray-600 text-center mt-3">{currency.symbol}</p>
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
    </div>
  );
};

export default CurrencySelection;