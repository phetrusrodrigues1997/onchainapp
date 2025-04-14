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
    { name: "euro", symbol: "€" },
    { name: "franc", symbol: "Fr" },
    { name: "rupee", symbol: "₹" },
    { name: "won", symbol: "₩" },
    { name: "lira", symbol: "₺" },
    { name: "krona", symbol: "kr" },
    { name: "rand", symbol: "R" },
    { name: "ruble", symbol: "₽" }
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
    const styleId = 'custom-button-style';

    const injectStyle = () => {
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }

      // Always re-set the CSS content (in case it was removed or overwritten)
      styleTag.innerHTML = `
        [data-testid="ockBuyButton_Button"],
        [data-testid="ockSwapButton_Button"] {
          background-color: white !important;
        }

        [data-testid="ockBuyButton_Button"] span,
        [data-testid="ockSwapButton_Button"] span {
          color: black !important;
        }
      `;
    };

    // Inject immediately
    injectStyle();

    // Re-apply styles after a delay in case components are rendered late
    const timeout = setTimeout(() => {
      injectStyle();
    }, 1000); // 1 second delay just to be safe

    // Optional: Observe DOM changes too
    const observer = new MutationObserver(() => {
      injectStyle();
    });

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
    const spanElement = document.querySelector('span.ock-font-family.font-semibold') as HTMLElement | null;
    if (spanElement) {
      spanElement.style.color = 'black';
      spanElement.style.fontWeight = 'bold';
    }
  }, []);

  useEffect(() => {
    const setInputStyles = () => {
      const inputField = document.querySelector('input[data-testid="ockTextInput_Input"]') as HTMLInputElement | null;
      if (inputField) {
        // Set multiple style properties to ensure text is black
        inputField.style.setProperty("color", "black", "important");
        inputField.style.caretColor = "black";
        inputField.style.backgroundColor = "white"; // Optional: ensures contrast
        // Force style recalculation
        inputField.style.display = 'none';
        inputField.offsetHeight; // Trigger reflow
        inputField.style.display = '';
      }
    };
  
    // Initial application
    const timeoutId = setTimeout(setInputStyles, 100);
    
  
    // Create an observer to watch for changes
    const observer = new MutationObserver(setInputStyles);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  
    // Cleanup
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
    <div>
      <div className="w-full max-w-sm mx-auto p-4 ">
      <p className="text-xl sm:text-xl font-bold text-white text-center mb-4 sm:mb-6">
          Buy USDC, swap it for the{' '}
          
          <span className="inline-block transition-all duration-300 ease-in-out">
            {currencies[currencyIndex].symbol} {currencies[currencyIndex].name}
          </span>
        </p>
      </div>

      <div className={`${getContainerWidth()} mx-auto p-4 bg-[#012512] rounded-lg rounded-2xl shadow-sm`}>

        {filteredTokens.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {filteredTokens.map((item) => (
              <div
                key={item.token.symbol}
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg"
              >
                <Buy toToken={item.token} />
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
