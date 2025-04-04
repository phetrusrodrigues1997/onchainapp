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
  'BTC': 'bitcoin', // For CbBTCToken
  'AAVE': 'aave',
  'MORPHO': 'morpho',
  'USDC': 'usd-coin',
  'EURC': 'euro-coin',
  'CADC': 'cad-coin',
  'BRZ': 'brz',
  'TRYB': 'tryb', // Correct CoinGecko ID for Turkish Lira token
  'MXNe': 'mexican-peso', // Assuming this is correct; verify if listed
};

const HomePage = () => {
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
    chainId: 8453, // Base network
  });

  // Fetch ERC20 token balances on Base network
  const tokenBalances = erc20Tokens.map(token =>
    useBalance({
      address,
      token: token.address as `0x${string}`, // Type assertion for wagmi
      chainId: 8453, // Base network
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

  // Early returns for rendering
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
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Your Balances</h2>
      <ul className="list-disc list-inside">
        {/* Display native ETH balance if > 0 */}
        {nativeBalance.data && parseFloat(nativeBalance.data.formatted) > 0 && (
          <li>
            {nativeToken && nativeToken.name} ({nativeToken && nativeToken.symbol}): {nativeBalance.data.formatted} {nativeToken && nativeToken.symbol} ($
            {nativeToken && (parseFloat(nativeBalance.data.formatted) * (prices[tokenToCoingeckoId[nativeToken.symbol]] || 0)).toFixed(2)})
          </li>
        )}
        {/* Display ERC20 token balances if > 0 */}
        {tokenBalances.map((balance, index) => {
          const token = erc20Tokens[index];
          if (balance.data && parseFloat(balance.data.formatted) > 0) {
            const price = prices[tokenToCoingeckoId[token.symbol]] || 0;
            const value = parseFloat(balance.data.formatted) * price;
            return (
              <li key={token.address}>
                {token.name} ({token.symbol}): {balance.data.formatted} {token.symbol} (${value.toFixed(2)})
              </li>
            );
          }
          return null;
        })}
      </ul>
      <p className="mt-4">Total Balance: ${totalUSD.toFixed(2)}</p>
    </div>
  );
};

export default HomePage;