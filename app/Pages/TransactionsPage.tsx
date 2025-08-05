import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons'; // or use another icon if preferred


interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
}

interface MergedTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbols: string[];
  txType: 'Send' | 'Receive' | 'Swap';
  sentAsset: string | null;
  sentAmount: string | null;
  sentDecimals: string | null;
  receivedAsset: string | null;
  receivedAmount: string | null;
  receivedDecimals: string | null;
}

const Activity: React.FC = () => {
  const { address } = useAccount();
  const [mergedTxs, setMergedTxs] = useState<MergedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define the tokenList
  const tokenList = [
    "ETH",
    "WETH",
    "AERO",
    "VIRTUAL",
    "BTC",
    "AAVE",
    "MORPHO",
    "USDC",
    "EURC",
    "CADC",
    "BRZ",
    "LIRA",
    "MXP"
  ];

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

  const determineTxType = (txGroup: Transaction[], userAddress: string): 'Send' | 'Receive' | 'Swap' => {
    const user = userAddress.toLowerCase();
    let sent = false;
    let received = false;

    txGroup.forEach((tx) => {
      if (tx.from.toLowerCase() === user) sent = true;
      if (tx.to.toLowerCase() === user) received = true;
    });

    if (sent && received) return 'Swap';
    else if (sent) return 'Send';
    else if (received) return 'Receive';
    return 'Receive';
  };

  const getAssetIcon = (asset: string | null) => {
    if (!asset) return 'default_icon.png';
    return tokenImages[asset as keyof typeof tokenImages] || 'default_icon.png';
  };

  const formatAmount = (amount: string, decimals: string, displayDecimals: number = 3): string => {
    const dec = parseInt(decimals, 10);
    if (isNaN(dec)) {
      return amount;
    }
    return parseFloat(formatUnits(amount, dec)).toFixed(displayDecimals).replace(/\.?0+$/, '');
  };

  const shortenAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
  

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const baseUrl = 'https://api.basescan.org/api';
        const nativeUrl = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;
        const tokenUrl = `${baseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;

        const [nativeResp, tokenResp] = await Promise.all([fetch(nativeUrl), fetch(tokenUrl)]);
        const nativeData = await nativeResp.json();
        const tokenData = await tokenResp.json();

        let nativeTxs: Transaction[] = nativeData.status === "1" && nativeData.result ? nativeData.result : [];
        let tokenTxs: Transaction[] = tokenData.status === "1" && tokenData.result ? tokenData.result.map((tx: Record<string, unknown>) => ({
          ...tx,
          tokenSymbol: tx.tokenSymbol,
          tokenDecimal: tx.tokenDecimal
        })) : [];

        const allTxs = [...nativeTxs, ...tokenTxs];
        const grouped: { [hash: string]: Transaction[] } = {};
        allTxs.forEach((tx) => {
          if (!grouped[tx.hash]) grouped[tx.hash] = [];
          grouped[tx.hash].push(tx);
        });

        const merged: MergedTransaction[] = Object.values(grouped).map((group) => {
          const representative = group[0];
          const tokenSymbols = Array.from(new Set(group.map((tx) => tx.tokenSymbol).filter(Boolean))) as string[];
          const txType = determineTxType(group, address);

          let sentAsset: string | null = null;
          let sentAmount: string | null = null;
          let sentDecimals: string | null = null;
          let receivedAsset: string | null = null;
          let receivedAmount: string | null = null;
          let receivedDecimals: string | null = null;

          group.forEach((tx) => {
            if (tx.from.toLowerCase() === address.toLowerCase()) {
              if (tx.tokenSymbol) {
                sentAsset = tx.tokenSymbol;
                sentAmount = tx.value;
                sentDecimals = tx.tokenDecimal || '0';
              } else if (Number(tx.value) > 0) {
                sentAsset = 'ETH';
                sentAmount = tx.value;
                sentDecimals = '18';
              }
            }
            if (tx.to.toLowerCase() === address.toLowerCase()) {
              if (tx.tokenSymbol) {
                receivedAsset = tx.tokenSymbol;
                receivedAmount = tx.value;
                receivedDecimals = tx.tokenDecimal || '0';
              } else if (Number(tx.value) > 0) {
                receivedAsset = 'ETH';
                receivedAmount = tx.value;
                receivedDecimals = '18';
              }
            }
          });

          return {
            hash: representative.hash,
            blockNumber: representative.blockNumber,
            timeStamp: representative.timeStamp,
            from: representative.from,
            to: representative.to,
            value: representative.value,
            tokenSymbols,
            txType,
            sentAsset,
            sentAmount,
            sentDecimals,
            receivedAsset,
            receivedAmount,
            receivedDecimals,
          };
        });

        // Filter transactions based on tokenList
        const filteredTxs = merged.filter((tx) => {
          if (tx.txType === 'Send') {
            return tx.sentAsset && tokenList.includes(tx.sentAsset);
          } else if (tx.txType === 'Receive') {
            return tx.receivedAsset && tokenList.includes(tx.receivedAsset);
          } else if (tx.txType === 'Swap') {
            return tx.sentAsset && tx.receivedAsset && 
                   tokenList.includes(tx.sentAsset) && tokenList.includes(tx.receivedAsset);
          }
          return false;
        });

        // Sort filtered transactions by timestamp (descending)
        filteredTxs.sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp));
        setMergedTxs(filteredTxs);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address, tokenList]);

  return (
    <div
      style={{
        color: 'white',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        marginBottom: '80px'
      }}
    >
      {/* <h1>Recent Transactions</h1> */}
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && mergedTxs.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
  <FontAwesomeIcon icon={faClockRotateLeft} style={{ fontSize: '24px', marginRight: '10px', color: '#d3c81a' }} />
  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
    Recent Transactions
  </h2>
</div>

          {mergedTxs.map((tx, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#001800',
                padding: '15px 20px',
                borderRadius: '10px',
                border: '1px solid #4B5563',
                marginBottom: '15px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            >
              {/* Left section */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {/* Send */}
                {tx.txType === 'Send' && tx.sentAsset && tx.sentAmount && tx.sentDecimals && (
                  <>
                    <img
                      src={getAssetIcon(tx.sentAsset)}
                      alt={tx.sentAsset || 'unknown asset'}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', marginBottom: '4px' }}
                    />
                    <span style={{ fontSize: '16px' }}>
                    <span style={{ color: 'red' }}>Sent</span> {formatAmount(tx.sentAmount, tx.sentDecimals)} {tx.sentAsset}
                      <br />To: {shortenAddress(tx.to)}
                    </span>
                  </>
                )}

                {/* Receive */}
                {tx.txType === 'Receive' && tx.receivedAsset && tx.receivedAmount && tx.receivedDecimals && (
                  <>
                    <img
                      src={getAssetIcon(tx.receivedAsset)}
                      alt={tx.receivedAsset}
                      style={{ width: '24px', height: '24px', borderRadius: '50%', marginBottom: '4px' }}
                    />
                    {/* <span style={{ fontSize: '16px' }}>
  Received {formatAmount(tx.receivedAmount, tx.receivedDecimals)} {tx.receivedAsset}
  <br />
  <span style={{ paddingLeft: '20px' }}>from</span>
  <br />
  {shortenAddress(tx.from)}
</span> */}
<span style={{ fontSize: '16px' }}>
<span style={{ color: 'green' }}>Received</span> {formatAmount(tx.receivedAmount, tx.receivedDecimals)} {tx.receivedAsset}
  <br />From: {shortenAddress(tx.from)}
</span>


                  </>
                )}

                {/* Swap */}
                {tx.txType === 'Swap' &&
                  tx.sentAsset &&
                  tx.receivedAsset &&
                  tx.sentAmount &&
                  tx.receivedAmount &&
                  tx.sentDecimals &&
                  tx.receivedDecimals && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                        <img
                          src={getAssetIcon(tx.sentAsset)}
                          alt={tx.sentAsset}
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                        <span style={{ margin: '0 6px' }}>→</span>
                        <img
                          src={getAssetIcon(tx.receivedAsset)}
                          alt={tx.receivedAsset}
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                      </div>
                      <span style={{ fontSize: '16px' }}>
                      <span style={{ color: 'blue' }}>Swap:</span> {formatAmount(tx.sentAmount, tx.sentDecimals)} {tx.sentAsset} for{' '}
                        {formatAmount(tx.receivedAmount, tx.receivedDecimals)} {tx.receivedAsset}
                      </span>
                    </>
                  )}
              </div>

              {/* Right-aligned date */}
              <div style={{ textAlign: 'right', fontSize: '14px', color: '#ccc' }}>
                {new Date(Number(tx.timeStamp) * 1000).toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'short',
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && mergedTxs.length === 0 && <p>No transactions found.</p>}
    </div>
  );
};

export default Activity;