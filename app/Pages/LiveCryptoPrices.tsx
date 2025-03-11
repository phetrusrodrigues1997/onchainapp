import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { AEROToken, VIRTUALToken, AAVEToken } from '../Token Lists/coins';





export default function LiveCryptoPrices() {
  const { address } = useAccount();
  const { data: balance, isLoading, isError } = useBalance({
    address,
  });
  const [prices, setPrices] = useState<{ [key: string]: number | null }>({
    bitcoin: null,
    ethereum: null,
    'aerodrome-finance': null,
    'virtual-protocol': null,
    aave: null,
  });
  const [priceError, setPriceError] = useState(false);

  // Fetch prices for all tokens from CoinGecko
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,aerodrome-finance,virtual-protocol,aave&vs_currencies=usd'
        );
        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }
        const data = await response.json();
        setPrices({
          bitcoin: data.bitcoin?.usd || null,
          ethereum: data.ethereum?.usd || null,
          'aerodrome-finance': data['aerodrome-finance']?.usd || null,
          'virtual-protocol': data['virtual-protocol']?.usd || null,
          aave: data.aave?.usd || null,
        });
      } catch (error) {
        console.error(error);
        setPriceError(true);
      }
    };
    fetchPrices();
  }, []);

  // // Handle wallet connection states
  // if (!address) {
  //   return <div className="text-white">Please connect your wallet to see your balance.</div>;
  // }
  // if (isLoading) {
  //   return <div className="text-white">Loading balance...</div>;
  // }
  // if (isError) {
  //   return <div className="text-white">Error fetching balance.</div>;
  // }

  // Calculate the balance to display
  // let displayBalance;
  // if (prices.ethereum) {
  //   const ethBalance = parseFloat(balance?.formatted || '0');
  //   const usdBalance = ethBalance * prices.ethereum;
  //   displayBalance = `$${usdBalance.toFixed(2)}`;
  // } else if (priceError) {
  //   displayBalance = `${balance?.formatted} ${balance?.symbol} (Unable to fetch USD price)`;
  // } else {
  //   displayBalance = 'Fetching USD price...';
  // }

  // Define the tokens to display
  const tokenList = [
    { symbol: 'BTC', name: 'Bitcoin', price: prices.bitcoin, image: 'https://basescan.org/token/images/cbbtc_32.png' },
    { symbol: 'ETH', name: 'Ethereum', price: prices.ethereum, image: 'https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png' },
    { ...AEROToken, price: prices['aerodrome-finance'] },
    { ...VIRTUALToken, price: prices['virtual-protocol'] },
    { ...AAVEToken, price: prices.aave },
  ];

  return (
    <div>
    
      
      <div className='max-w-sm mx-auto'>
        <div className="flex items-center justify-between space-y-4">
          
          <div className="flex flex-wrap">
            {tokenList.map((token) => (
              <div
                key={token.symbol}
                className=" p-2 rounded-lg flex items-center space-x-2 space-y-4 w-28"
                style={{ backgroundColor: '#080330' }} // Matches the dark gray from the image
              >
                <img
                  src={token.image || 'https://via.placeholder.com/32'}
                  alt={token.name}
                  className="w-6 h-6"
                  onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/32')}
                />
                <div>
                  <p className="font-semibold text-white text-sm">{token.symbol}</p>
                  <p className="text-gray-300 text-xs">
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