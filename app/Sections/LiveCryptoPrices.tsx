import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CADCToken, BRZToken, EURCToken } from '../Constants/coins';


// Define MXNT locally since it’s not in your original token list
const MXNTToken = {
  address: "0xed03ed872159e199065401b6d0d487d78d9464aa", // Actual Ethereum address; update if on Base
  chainId: 8453, // Assuming Base chain; adjust if necessary
  decimals: 6,
  name: "Mexican Peso Tether",
  symbol: "MXNT",
  image: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg", // Placeholder image
};

export default function LiveCryptoPrices() {
  const [prices, setPrices] = useState<{ [key: string]: number | null }>({
    bitcoin: null,
    ethereum: null,
    cadc: null,
    brz: null,
    mxnt: null, // Replaced mmxn with mxnt
    eurc: null,
  });
  const [priceError, setPriceError] = useState(false);

  // Fetch prices from CoinGecko
  const fetchPrices = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cad-coin,brz,mexican-peso-tether,euro-coin&vs_currencies=usd'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      const data = await response.json();
      setPrices({
        bitcoin: data.bitcoin?.usd || null,
        ethereum: data.ethereum?.usd || null,
        cadc: data['cad-coin']?.usd || null,
        brz: data.brz?.usd || null,
        mxnt: data['mexican-peso-tether']?.usd || null, // Map mexican-peso-tether to mxnt
        eurc: data['euro-coin']?.usd || null,
      });
    } catch (error) {
      console.error(error);
      setPriceError(true);
    }
  };

  // Fetch prices on mount and every minute
  useEffect(() => {
    fetchPrices(); // Initial fetch
    const intervalId = setInterval(fetchPrices, 60000); // Fetch every 60 seconds
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Token list for display
  const tokenList = [
    { symbol: 'BTC', name: 'Bitcoin', price: prices.bitcoin, image: 'https://basescan.org/token/images/cbbtc_32.png' },
    { symbol: 'ETH', name: 'Ethereum', price: prices.ethereum, image: 'https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png' },
    { ...CADCToken, price: prices.cadc, symbol: 'CAD' },
    { ...BRZToken, price: prices.brz, symbol: 'BRL' },
    { ...MXNTToken, price: prices.mxnt, symbol:'MXN' }, // Use MXNTToken instead of MMXNToken
    { ...EURCToken, price: prices.eurc, symbol: 'EUR' },
  ];

  return (
    <div>
      <div className="max-w-md mx-auto bg-transparent rounded-xl border border-[#bfbfbf] shadow-md overflow-hidden p-4 mt-12">
        <div className="flex items-center justify-between space-y-4">
          <div className="flex flex-wrap">
            {tokenList.map((token) => (
              <div
                key={token.symbol}
                className="p-2 rounded-lg flex items-center space-x-2 space-y-4 w-28"
                
              >
                <Image
                  src={token.image || 'https://via.placeholder.com/32'}
                  alt={token.name}
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <div>
                  <p className="font-semibold text-white text-sm">{token.symbol}</p>
                  <p className="text-gray-200 text-xs">
                    {token.price ? `$${token.price >= 1 ? token.price.toFixed(2) : token.price.toFixed(4)}` : 'Fetching...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}