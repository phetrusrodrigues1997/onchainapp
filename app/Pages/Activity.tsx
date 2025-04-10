import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  // For token transfers, these fields might be populated
  contractAddress?: string;
  tokenSymbol?: string;
}

interface MergedTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string; // native value from a native tx, if applicable
  tokenSymbols: string[]; // all tokens transferred in this tx
  txType: 'Send' | 'Receive' | 'Swap';
}

const Activity: React.FC = () => {
  const { address } = useAccount();
  const [mergedTxs, setMergedTxs] = useState<MergedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function: determine transaction type for a group of tx events.
  const determineTxType = (txGroup: Transaction[], userAddress: string): 'Send' | 'Receive' | 'Swap' => {
    // Normalize address for comparison
    const user = userAddress.toLowerCase();
    let sent = false;
    let received = false;

    txGroup.forEach((tx) => {
      if (tx.from.toLowerCase() === user) {
        sent = true;
      }
      if (tx.to.toLowerCase() === user) {
        received = true;
      }
    });

    if (sent && received) {
      return 'Swap';
    } else if (sent) {
      return 'Send';
    } else if (received) {
      return 'Receive';
    }
    // fallback
    return 'Receive';
  };

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        const apiKey = 'YOUR_BASESCAN_API_KEY'; // Replace with your BaseScan API key
        const baseUrl = 'https://api.basescan.org/api';
        // Native transactions (ETH transfers)
        const nativeUrl = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;
        // Token transfers (token transactions like USDC, etc.)
        const tokenUrl = `${baseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;

        const [nativeResp, tokenResp] = await Promise.all([
          fetch(nativeUrl),
          fetch(tokenUrl)
        ]);

        const nativeData = await nativeResp.json();
        const tokenData = await tokenResp.json();

        let nativeTxs: Transaction[] = [];
        let tokenTxs: Transaction[] = [];

        if (nativeData.status === "1" && nativeData.result && nativeData.result.length > 0) {
          nativeTxs = nativeData.result;
        }

        if (tokenData.status === "1" && tokenData.result && tokenData.result.length > 0) {
          tokenTxs = tokenData.result.map((tx: any) => ({
            ...tx,
            tokenSymbol: tx.tokenSymbol // e.g. USDC
          }));
        }

        // Combine all transactions
        const allTxs = [...nativeTxs, ...tokenTxs];

        // Group by transaction hash
        const grouped: { [hash: string]: Transaction[] } = {};
        allTxs.forEach((tx) => {
          if (!grouped[tx.hash]) {
            grouped[tx.hash] = [];
          }
          grouped[tx.hash].push(tx);
        });

        // Process groups into merged transactions
        const merged: MergedTransaction[] = Object.values(grouped).map((group) => {
          // In a group, the native transaction fields (blockNumber, timeStamp, from, to) should be the same.
          const representative = group[0];
          // Get all token symbols encountered in the group (if any)
          const tokenSymbols = Array.from(
            new Set(group.map((tx) => tx.tokenSymbol).filter(Boolean))
          ) as string[];

          return {
            hash: representative.hash,
            blockNumber: representative.blockNumber,
            timeStamp: representative.timeStamp,
            from: representative.from,
            to: representative.to,
            value: representative.value,
            tokenSymbols,
            txType: determineTxType(group, address)
          };
        });

        // Sort merged transactions by timestamp descending
        merged.sort((a, b) => Number(b.timeStamp) - Number(a.timeStamp));

        setMergedTxs(merged);
      } catch (err: any) {
        setError(err.message || 'Error fetching transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [address]);

  return (
    <div
      style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Recent Transactions</h1>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && mergedTxs.length > 0 && (
        <div>
          {mergedTxs.map((tx, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #555',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              {/* <p><strong>Hash:</strong> {tx.hash}</p> */}
              {/* <p><strong>Block Number:</strong> {tx.blockNumber}</p> */}
              <p>
                <strong>Timestamp:</strong>{' '}
                {new Date(Number(tx.timeStamp) * 1000).toLocaleString()}
              </p>
              <p><strong>From:</strong> {tx.from}</p>
              <p><strong>To:</strong> {tx.to}</p>
              <p><strong>Value:</strong> {tx.value}</p>
              <p>
                <strong>Asset:</strong>{' '}
                {tx.tokenSymbols.length > 0
                  ? tx.tokenSymbols.join(', ')
                  : 'ETH (native)'}
              </p>
              <p>
                <strong>Type:</strong> {tx.txType}
              </p>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && mergedTxs.length === 0 && (
        <p>No transactions found.</p>
      )}
    </div>
  );
};

export default Activity;
