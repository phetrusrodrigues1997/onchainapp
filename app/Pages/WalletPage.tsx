import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Token } from '@coinbase/onchainkit/token';
import { cryptoTokens, stablecoinTokens } from '../Constants/coins';
import { getUsername } from '../Database/actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faArrowRight, faPaperPlane, faExchangeAlt, faQrcode, faChartLine } from '@fortawesome/free-solid-svg-icons';

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
  MXNe: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
};

interface WalletPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const WalletPage: React.FC<WalletPageProps> = ({ activeSection, setActiveSection }) => {
  const { address } = useAccount();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [selectedTab, setSelectedTab] = useState('stablecoins'); // State for selected tab
  

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
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#121212] to-[#1e1e1e] text-white">
        <div className="p-8 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-800 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
            <p className="text-gray-400">Please connect your wallet to access your balance and transactions</p>
          </div>
          <div className="animate-pulse opacity-50 flex justify-center">
            <svg className="w-24 h-24 text-[#6A5ACD]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-[#121212] to-[#1e1e1e] text-white">
        <div className="p-8 bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-800 max-w-md w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Loading Assets</h2>
            <p className="text-gray-400">Fetching your latest balances and market data</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#6A5ACD]"></div>
          </div>
        </div>
      </div>
    );
  }

  const stablecoinSymbols = new Set(['USDC', 'EURC', 'CADC', 'BRZ', 'TRYB', 'MXNe']);

  // Calculate overall total USD (sum of all assets)
  let overallTotalUSD = 0;
  let selectedTabTotalUSD = 0;

  // Native token contribution
  if (nativeToken && nativeBalance.data && parseFloat(nativeBalance.data.formatted) > 0) {
    const nativeId = tokenToCoingeckoId[nativeToken.symbol as keyof typeof tokenToCoingeckoId];
    const nativePrice = prices[nativeId] || 0;
    const nativeValue = parseFloat(nativeBalance.data.formatted) * nativePrice;
    overallTotalUSD += nativeValue;
    if (selectedTab === 'crypto') {
      selectedTabTotalUSD += nativeValue;
    }
  }

  // ERC20 tokens contribution
  tokenBalances.forEach((balance, index) => {
    const token = erc20Tokens[index];
    const isStablecoin = stablecoinSymbols.has(token.symbol);
    if (balance.data && parseFloat(balance.data.formatted) > 0) {
      const id = tokenToCoingeckoId[token.symbol as keyof typeof tokenToCoingeckoId];
      const price = prices[id] || 0;
      const value = parseFloat(balance.data.formatted) * price;
      overallTotalUSD += value; // Add to overall total regardless of tab
      if (
        (selectedTab === 'crypto' && !isStablecoin) ||
        (selectedTab === 'stablecoins' && isStablecoin)
      ) {
        selectedTabTotalUSD += value; // Add to tab-specific total based on category
      }
    }
  });

  return (
    <div className="relative text-center mb-72 lg:transform lg:translate-y-16 px-4 max-w-lg mx-auto">
      {/* Glass-like header with blur effect */}
      <div className="top-0 z-10 bg-transparent rounded-b-2xl pb-4 shadow-lg">
        {/* Header Icons for Notifications and Settings */}
        <div className="flex justify-between items-center py-4">
          {/* Left side: Username or Set Username button */}
          <div 
            className="flex items-center cursor-pointer transition-transform hover:scale-105" 
            onClick={() => setActiveSection('usernamePage')}
          >
            {username === undefined ? (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse mr-2"></div>
                <span className="text-gray-400">Loading...</span>
              </div>
            ) : username ? (
              <div className="flex items-center bg-black/40 px-3 py-1.5 rounded-full">
                <div className="w-7 h-7 rounded-full bg-[#6A5ACD] flex items-center justify-center mr-2">
                  <FontAwesomeIcon icon={faUser} className="text-black text-sm" />
                </div>
                <span className="text-white font-medium" style={{
                  fontFamily: "'Montserrat', sans-serif",
                }}>
                  {username}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setActiveSection('usernamePage')}
                className="
                  flex items-center justify-center gap-2
                  px-4 py-2
                  rounded-full
                  bg-black/40 border border-gray-700
                  text-white
                  text-xs
                  font-medium
                  shadow-md
                  transition-all
                  duration-300
                  hover:bg-[#6A5ACD]/20
                  hover:border-[#6A5ACD]/50
                  hover:text-[#6A5ACD]
                "
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                }}
              >
                <span>Set Username</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              </button>
            )}
          </div>

          {/* Right side: Notification and Settings buttons */}
          <div className="flex justify-end space-x-4">
            {/* Notification button */}
            <button 
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:text-[#6A5ACD] hover:bg-black/60 transition-all duration-300" 
              onClick={() => setActiveSection('notifications')}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.78 9.78 0 01-4.39-1.02L3 21l1.52-3.67A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {/* Notification indicator dot */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#6A5ACD] rounded-full"></span>
            </button>

            {/* Settings button */}
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:text-[#6A5ACD] hover:bg-black/60 transition-all duration-300" 
              onClick={() => setActiveSection('usernamePage')}
            >
              <svg
                className="w-5 h-5"
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

        {/* Balance Display with Animated Gradient Border */}
        <div className="relative mx-auto mb-6 p-6 rounded-2xl bg-[#1b1b1b] overflow-hidden">
          <div className="absolute inset-0 rounded-2xl bg-[#1b1b1b] opacity-50 animate-gradient-x"></div>
          <div className="relative z-10">
            <h1 className="text-lg font-medium text-gray-400 mb-1">Total Balance</h1>
            <h2 className="text-5xl font-bold mb-1 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              ${overallTotalUSD.toFixed(2)}
            </h2>
            <div className="flex items-center justify-center mt-1">
              <span className="text-xs text-green-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                0.0% today
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => setActiveSection("send")}
            className="flex-1 bg-gradient-to-r from-[#d3c81a] to-[#c4b918] text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
            Send
          </button>
          <div className="relative flex-1">
            <button
              onClick={copyAddressToClipboard}
              className="w-full bg-gradient-to-r from-[#d3c81a] to-[#c4b918] text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faQrcode} className="mr-2" />
              Receive
            </button>
            {showToast && (
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-12 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center">
                <svg className="w-4 h-4 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Address copied!
              </div>
            )}
          </div>
          <button
            onClick={() => setActiveSection("swap")}
            className="flex-1 bg-gradient-to-r from-[#d3c81a] to-[#c4b918] text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faExchangeAlt} className="mr-2" />
            Swap
          </button>
        </div>

        {/* Asset Type Tabs */}
        <div className="flex justify-center space-x-6 mt-2">
          <button
            onClick={() => setSelectedTab('stablecoins')}
            className={`px-4 py-2 font-medium text-sm transition-all duration-300 ${
              selectedTab === 'stablecoins'
                ? 'text-[#6A5ACD] border-b-2 border-[#6A5ACD]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stablecoins
          </button>
          <button
            onClick={() => setSelectedTab('crypto')}
            className={`px-4 py-2 font-medium text-sm transition-all duration-300 ${
              selectedTab === 'crypto'
                ? 'text-[#6A5ACD] border-b-2 border-[#6A5ACD]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Crypto
          </button>
          <button
            onClick={() => setSelectedTab('stocks')}
            className={`px-4 py-2 font-medium text-sm transition-all duration-300 ${
              selectedTab === 'stocks'
                ? 'text-[#6A5ACD] border-b-2 border-[#6A5ACD]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Stocks
          </button>
        </div>
      </div>

      {/* Asset List Section */}
      <div className="mt-4 pb-20">
        {/* Transactions Button and Tab Total */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="text-left">
            <span className="text-sm text-gray-400">
              {selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Total
            </span>
            <h3 className="text-xl font-bold">${selectedTabTotalUSD.toFixed(2)}</h3>
          </div>
          
          <button
            className="flex items-center space-x-2 bg-black/40 text-white hover:bg-[#6A5ACD]/20 hover:text-[#6A5ACD] px-3 py-1.5 rounded-full transition-all duration-300 text-sm border border-gray-800"
            onClick={() => setActiveSection('activity')}
          >
            <FontAwesomeIcon icon={faChartLine} className="text-xs" />
            <span>Transactions</span>
          </button>
        </div>

        {selectedTabTotalUSD === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-black/20 rounded-xl border border-gray-800">
            <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">No {selectedTab} found</h3>
            <p className="text-gray-500 text-sm max-w-xs text-center">
              Add some {selectedTab} to your wallet to see them displayed here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Native Token Card */}
            {selectedTab === 'crypto' && nativeBalance.data && parseFloat(nativeBalance.data.formatted) > 0 && (
              <div className="bg-[#1b1b1b] p-4 rounded-xl shadow-lg border border-gray-800/50 hover:border-gray-700/70 transition-all duration-300 flex items-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#d3c81a]/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <img
                    src={nativeToken && tokenImages[nativeToken.symbol as keyof typeof tokenImages] || ''}
                    alt={nativeToken?.symbol || 'unknown'}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-[#6A5ACD]/30 transition-all duration-300"
                  />
                </div>
                <div className="flex-1 ml-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-300">{nativeToken?.name}</span>
                    <span className="text-white font-bold">
                      ${(nativeToken?.symbol && prices[tokenToCoingeckoId[nativeToken.symbol as keyof typeof tokenToCoingeckoId]]
                        ? (parseFloat(nativeBalance.data.formatted) * prices[tokenToCoingeckoId[nativeToken.symbol as keyof typeof tokenToCoingeckoId]]).toFixed(2)
                        : '0.00')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-500">{nativeToken?.symbol}</span>
                    <span className="text-sm text-gray-400">{parseFloat(nativeBalance.data.formatted).toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ERC20 Token Cards */}
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
                    className="bg-[#1b1b1b] p-4 rounded-xl shadow-lg border border-gray-800/50 hover:border-gray-700/70 transition-all duration-300 flex items-center group"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#d3c81a]/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <img
                        src={tokenImages[token.symbol as keyof typeof tokenImages] || ''}
                        alt={token.symbol}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-[#6A5ACD]/30 transition-all duration-300"
                      />
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-300">
                          {token.name === 'USDC'
                            ? 'US Dollar Coin'
                            : token.name === 'EURC'
                            ? 'Euro Coin'
                            : token.name}
                        </span>
                        <span className="text-white font-bold">${value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-500">{token.symbol}</span>
                        <span className="text-sm text-gray-400">{parseFloat(balance.data.formatted).toFixed(isStablecoin ? 2 : 4)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      

      {/* Add custom styles for animations */}
      <style jsx global>{`
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default WalletPage;
