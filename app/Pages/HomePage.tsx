import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Token } from '@coinbase/onchainkit/token';
import { cryptoTokens, stablecoinTokens } from '../Token Lists/coins';
import { getUsername } from '../Database/actions';

// Mapping of token symbols to CoinGecko IDs for price fetching
const tokenToCoingeckoId = {
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

const HomePage: React.FC<HomePageProps> = ({ activeSection, setActiveSection }) => {
  const { address } = useAccount();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [selectedTab, setSelectedTab] = useState('stablecoins'); // State for selected tab
  const [showTransactions, setShowTransactions] = useState(false); // State for transaction history
  const [notifications, setNotifications] = useState<string[]>([]); // State for notifications

  const allTokens = [...cryptoTokens, ...stablecoinTokens].reduce((acc: Token[], token) => {
    const key = token.address || 'native';
    if (!acc.some(t => t.address === token.address)) {
      acc.push(token);
    }
    return acc;
  }, [] as Token[]);

  const nativeToken = allTokens.find(token => !token.address);
  const erc20Tokens = allTokens.filter(token => token.address);

  const nativeBalance = useBalance({ address, chainId: 8453 });
  const tokenBalances = erc20Tokens.map(token =>
    useBalance({ address, token: token.address || undefined, chainId: 8453 })
  );

  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      const ids = allTokens
        .map(token => tokenToCoingeckoId[token.symbol as keyof typeof tokenToCoingeckoId])
        .filter(Boolean);
      if (ids.length > 0) {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
          );
          const data = await response.json();
          const priceMap: Record<string, number> = {};
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

    // Mock notifications for demonstration
    // setNotifications(['USDC price increased by 1%', 'Transaction confirmed']);
  }, []);

  const [username, setUsername] = useState<string | null | undefined>(undefined);

  // Fetch username when address is available or changes
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const result = address ? await getUsername(address) : null;
        setUsername(result);
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername(null);
      }
    };
    if (address) {
      fetchUsername();
    }
  }, [address]);

  if (!address) {
    return <div className="text-center">Please connect your wallet to see your balance.</div>;
  }

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  const stablecoinSymbols = new Set(['USDC', 'EURC', 'CADC', 'BRZ', 'TRYB', 'MXNe']);

  // Calculate total USD based on selected tab
  let totalUSD = 0;
  if (selectedTab === 'crypto' && nativeToken && nativeBalance.data && parseFloat(nativeBalance.data.formatted) > 0) {
    const nativeId = tokenToCoingeckoId[nativeToken.symbol as keyof typeof tokenToCoingeckoId];
    const nativePrice = prices[nativeId] || 0;
    const nativeValue = parseFloat(nativeBalance.data.formatted) * nativePrice;
    totalUSD += nativeValue;
  }
  tokenBalances.forEach((balance, index) => {
    const token = erc20Tokens[index];
    const isStablecoin = stablecoinSymbols.has(token.symbol);
    if (
      balance.data &&
      parseFloat(balance.data.formatted) > 0 &&
      ((selectedTab === 'crypto' && !isStablecoin) || (selectedTab === 'stablecoins' && isStablecoin))
    ) {
      const id = tokenToCoingeckoId[token.symbol as keyof typeof tokenToCoingeckoId];
      const price = prices[id] || 0;
      const value = parseFloat(balance.data.formatted) * price;
      totalUSD += value;
    }
  });

  

  return (
    <div className=" text-center mb-72 lg:transform lg:translate-y-24 ">
      {/* Header Icons for Notifications and Settings */}
      <div className="flex justify-between items-center transform -translate-y-1 ">
  {/* Left side: The username will go here in place of this button */}
  
        <div className="flex items-center">
          {username === undefined ? (
            <span className="text-white">Loading...</span>
          ) : username ? (
            <span className="text-white font-bold" style={{
              fontFamily: "'Montserrat', sans-serif",
              color: "#ffffff",
              textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
            }}>{username}</span>
          ) : (
            <button 
  className="text-white hover:text-[#d3c81a] font-bold"
  onClick={() => setActiveSection('usernamePage')}
  style={{
    fontFamily: "'Montserrat', sans-serif",
    color: "#ffffff",
    textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)",
  }}
>
  Set Username <span className="text-[#d3c81a]">&gt;</span>
</button>

          )}
        </div>

  {/* Right side: Existing buttons */}
  <div className="flex justify-end space-x-4">
   
  {/* Notification button */}
    <button className="text-white hover:text-[#d3c81a]">
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 
             14.158V11a6 6 0 00-12 0v3.159c0 .538-.214 
             1.055-.595 1.436L4 17h5m6 0v1a3 3 0 
             01-6 0v-1m6 0H9"
        />
      </svg>
    </button>
          {/* Settings button */}
    <button className="text-white hover:text-[#d3c81a]">
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 
             3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 
             3.31.826 2.37 2.37a1.724 1.724 0 001.065 
             2.572c1.756.426 1.756 2.924 0 3.35a1.724 
             1.724 0 00-1.066 2.573c.94 1.543-.826 
             3.31-2.37 2.37a1.724 1.724 0 00-2.572 
             1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 
             1.724 0 00-2.573-1.066c-1.543.94-3.31-.826 
             -2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756
             -.426-1.756-2.924 0-3.35a1.724 1.724 0 
             001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996
             .608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </button>
  </div>
</div>


      <h1 className="text-3xl font-bold mb-4 mt-6">Wallet Balance</h1>
      <h2 className="text-4xl font-bold mb-4">${totalUSD.toFixed(2)}</h2>
      <div className="flex space-x-4 mt-6">
        <button
          onClick={() => setActiveSection("send")}
          className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-[#d3c81a]"
        >
          Send
        </button>
        <div className="relative">
          <button
            onClick={copyAddressToClipboard}
            className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-[#d3c81a]"
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
          className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full hover:bg-[#d3c81a]"
        >
          Swap
        </button>
      </div>

      

      <div className="flex justify-start space-x-10 mt-6">
        <button
          onClick={() => setSelectedTab('stablecoins')}
          className={`px-4 py-2 font-bold border-b-2 ${
            selectedTab === 'stablecoins'
              ? 'border-[#d3c81a] text-[#d3c81a]'
              : 'border-transparent text-white font-bold hover:text-[#d3c81a]'
          }`}
        >
          Stablecoins
        </button>
        <button
          onClick={() => setSelectedTab('crypto')}
          className={`px-4 py-2 font-bold border-b-2 ${
            selectedTab === 'crypto'
              ? 'border-[#d3c81a] text-[#d3c81a]'
              : 'border-transparent text-white font-bold hover:text-[#d3c81a]'
          }`}
        >
          Crypto
        </button>
        <button
          onClick={() => setSelectedTab('stocks')}
          className={`px-4 py-2 font-bold border-b-2 ${
            selectedTab === 'stocks'
              ? 'border-[#d3c81a] text-[#d3c81a]'
              : 'border-transparent text-white font-bold hover:text-[#d3c81a]'
          }`}
        >
          Stocks
        </button>
      </div>

      {totalUSD === 0 ? (
        <div>
          
        </div>
      ) : (
        
        <div className="space-y-4 transform translate-y-14">
  {/* Activity button placed above all balances */}
  <div className="relative -translate-y-11">
  <button
  className="text-black font-bold bg-white rounded-full py-1 px-3 hover:bg-[#d3c81a] absolute top-0 right-0 flex items-center space-x-1"
  onClick={() => setActiveSection('activity')}
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
    />
  </svg>
  <span className="text-sm">Transactions</span>
</button>

  </div>

  {/* Coin Balances */}
  {selectedTab === 'crypto' && nativeBalance.data && parseFloat(nativeBalance.data.formatted) > 0 && (
    <div className="p-2 rounded-2xl shadow-sm flex items-center border border-[#bfbfbf]">
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
        ${(nativeToken?.symbol && prices[tokenToCoingeckoId[nativeToken.symbol as keyof typeof tokenToCoingeckoId]] 
          ? (parseFloat(nativeBalance.data.formatted) * prices[tokenToCoingeckoId[nativeToken.symbol as keyof typeof tokenToCoingeckoId]]).toFixed(2) 
          : '0.00')}
      </span>
    </div>
  )}
  {tokenBalances.map((balance, index) => {
    const token = erc20Tokens[index];
    const isStablecoin = stablecoinSymbols.has(token.symbol);
    if (
      balance.data &&
      parseFloat(balance.data.formatted) > 0 &&
      ((selectedTab === 'crypto' && !isStablecoin) || (selectedTab === 'stablecoins' && isStablecoin))
    ) {
      const coingeckoId = tokenToCoingeckoId[token.symbol as keyof typeof tokenToCoingeckoId];
      const price = coingeckoId ? prices[coingeckoId] || 0 : 0;
      const value = parseFloat(balance.data.formatted) * price;
      return (
        <div
          key={token.address}
          className="p-2 rounded-2xl shadow-sm flex items-center border border-[#bfbfbf]"
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