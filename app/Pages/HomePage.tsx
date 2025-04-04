// HomePage.tsx
import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Token } from '@coinbase/onchainkit/token';
import { cryptoTokens, stablecoinTokens } from '../Token Lists/coins';

// Mapping of token symbols to CoinGecko IDs for price fetching
const tokenToCoingeckoId: { [symbol: string]: string } = {
  'ETH': 'ethereum',
  'WETH': 'ethereum',
  'AERO': 'aerodrome-finance',
  'VIRTUAL': 'virtual-protocol',
  'BTC': 'bitcoin',
  'AAVE': 'aave',
  'MORPHO': 'morpho',
  'USDC': 'usd-coin',
  'EURC': 'euro-coin',
  'CADC': 'cad-coin',
  'BRZ': 'brz',
  'TRYB': 'bilira',
  'MXNe': 'mexican-peso-tether',
};

const tokenImages = {
  ETH: "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
  WETH: "https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282",
  AERO: "https://basescan.org/token/images/aerodrome_32.png",
  VIRTUAL: "https://basescan.org/token/images/virtualprotocol_32.png",
  BTC: "https://basescan.org/token/images/cbbtc_32.png",
  AAVE: "https://basescan.org/token/images/aave_32.svg",
  MORPHO: "https://basescan.org/token/images/morphoorg_new_32.png",
  USDC: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
  EURC: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
  CADC: "https://www.svgrepo.com/show/405442/flag-for-flag-canada.svg",
  BRZ: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
  LIRA: "https://www.svgrepo.com/show/242355/turkey.svg",
  MXP: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
};

interface HomePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const HomePage = ({ activeSection, setActiveSection }: HomePageProps) => {
  const { address } = useAccount();
  const [prices, setPrices] = useState<{ [id: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Combine token lists, removing duplicates based on address
  const allTokens = [...cryptoTokens, ...stablecoinTokens].reduce((acc, token) => {
    const key = token.address || 'native';
    if (!acc.some(t => t.address === token.address)) {
      acc.push(token);
    }
    return acc;
  }, [] as Token[]);

  const nativeToken = allTokens.find(token => !token.address); // ETH
  const erc20Tokens = allTokens.filter(token => token.address);

  // Fetch native balance (ETH) on Base network
  const nativeBalance = useBalance({
    address,
    chainId: 8453,
  });

 // Add state for the toast notification
const [showToast, setShowToast] = useState(false);

const copyAddressToClipboard = () => {
  if (address) {
    navigator.clipboard.writeText(address);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // Hide after 3 seconds
  }
};

  // Fetch ERC20 token balances on Base network
  const tokenBalances = erc20Tokens.map(token =>
    useBalance({
      address,
      token: token.address as `0x${string}`,
      chainId: 8453,
    })
  );

  // Fetch prices from CoinGecko
  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      const ids = allTokens
        .map(token => tokenToCoingeckoId[token.symbol])
        .filter(Boolean);
      if (ids.length > 0) {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
          );
          const data = await response.json();
          const priceMap: { [id: string]: number } = {};
          ids.forEach(id => {
            priceMap[id] = data[id]?.usd || 0;
          });
          setPrices(priceMap);
        } catch (error) {
          console.error('Error fetching prices:', error);
        }
      }
      setIsLoading(false);
    };
    fetchPrices();
  }, []);

  if (!address) {
    return (
      <div className="text-center">
        Please connect your wallet to see your balance.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  // Calculate total balance in USD
  let totalUSD = 0;

  if (nativeToken && nativeBalance.data) {
    const nativeId = tokenToCoingeckoId[nativeToken.symbol];
    const nativePrice = prices[nativeId] || 0;
    const nativeValue = parseFloat(nativeBalance.data.formatted) * nativePrice;
    totalUSD += nativeValue;
  }

  tokenBalances.forEach((balance, index) => {
    if (balance.data) {
      const token = erc20Tokens[index];
      const id = tokenToCoingeckoId[token.symbol];
      const price = prices[id] || 0;
      const value = parseFloat(balance.data.formatted) * price;
      totalUSD += value;
    }
  });

  return (
    <div className="text-center mb-72 lg:transform lg:translate-y-20">
      <h2 className="text-5xl font-bold mb-4">${totalUSD.toFixed(2)}</h2>
      <div className="flex space-x-4 mt-6 ">
        <button
          onClick={() => setActiveSection("send")}
          className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full"
        >
          Send
        </button>
        <div className="relative">
  <button 
    onClick={copyAddressToClipboard}
    className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full"
  >
    Receive
  </button>
  
  {showToast && (
    <div className="absolute left-1/2 transform translate-x-1/2 -bottom-12 bg-[#d3c81a] text-black px-4 py-2 rounded-lg shadow-md transition-opacity duration-300">
      Address copied! ✓
    </div>
  )}
</div>
        <button
          onClick={() => setActiveSection("swap")}
          className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full"
        >
          Swap
        </button>
      </div>

      {/* If the total balance is zero, show a fun message */}
      {totalUSD === 0 ? (
        <div className="mt-8 text-lg font-semibold text-gray-300 flex flex-col items-center justify-center">
        <span className="animate-bounce text-5xl mt-16">👻</span>
        <span>Uh oh... Looks like you don't have any money in your wallet, you can purchase USDC or deposit.</span>
      </div>
      
      
      ) : (
        <div className="space-y-4 transform translate-y-12">
          {/* Display native ETH balance if > 0 */}
          {nativeBalance.data && parseFloat(nativeBalance.data.formatted) > 0 && (
            <div className="bg-[#012110] p-2 rounded-2xl shadow-sm flex items-center border border-[#bfbfbf]">
              <img
                src={nativeToken && tokenImages[nativeToken.symbol as keyof typeof tokenImages] || ''}
                alt={nativeToken?.symbol || 'unknown'}
                className="w-10 h-10 mr-2"
              />
              <div className="flex-1 flex justify-center items-center">
                <div className="text-center">
                  <span>{nativeToken?.name}</span>
                  <span className="font-bold block">{parseFloat(nativeBalance.data.formatted).toFixed(2)}</span>
                </div>
              </div>
              <span className="ml-auto">
                ${(parseFloat(nativeBalance.data.formatted) * (prices[tokenToCoingeckoId[nativeToken?.symbol ?? '']] || 0)).toFixed(2)}
              </span>
            </div>
          )}
          {/* Display ERC20 token balances if > 0 */}
          {tokenBalances.map((balance, index) => {
            const token = erc20Tokens[index];
            if (balance.data && parseFloat(balance.data.formatted) > 0) {
              const price = prices[tokenToCoingeckoId[token.symbol]] || 0;
              const value = parseFloat(balance.data.formatted) * price;
              return (
                <div
                  key={token.address}
                  className="bg-[#012110] p-2 rounded-2xl shadow-sm flex items-center border border-[#bfbfbf]"
                >
                  <img
                    src={tokenImages[token.symbol as keyof typeof tokenImages] || ''}
                    alt={token.symbol}
                    className="w-9 h-9 mr-2"
                  />
                  <div className="flex-1 flex justify-center items-center">
                    <div className="text-center">
                      <span>{token.name}</span>
                      <span className="font-bold block">{parseFloat(balance.data.formatted).toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="ml-auto">${value.toFixed(2)}</span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default HomePage;
