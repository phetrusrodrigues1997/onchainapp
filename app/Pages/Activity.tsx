import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  // When available, token transfers will include this info:
  contractAddress?: string;
  tokenSymbol?: string;
}

const Activity: React.FC = () => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        
        const baseUrl = 'https://api.basescan.org/api';
        // Fetch native ETH transactions
        const nativeUrl = `${baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;
        // Fetch token transfers (for assets like USDC, etc.)
        const tokenUrl = `${baseUrl}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;

        const [nativeResponse, tokenResponse] = await Promise.all([
          fetch(nativeUrl),
          fetch(tokenUrl)
        ]);

        const nativeData = await nativeResponse.json();
        const tokenData = await tokenResponse.json();

        let nativeTxs: Transaction[] = [];
        let tokenTxs: Transaction[] = [];

        if (nativeData.status === "1" && nativeData.result && nativeData.result.length > 0) {
          nativeTxs = nativeData.result;
        }

        if (tokenData.status === "1" && tokenData.result && tokenData.result.length > 0) {
          // Each token transaction already carries a tokenSymbol (e.g., USDC) and a contractAddress.
          tokenTxs = tokenData.result.map((tx: any) => ({
            ...tx,
            tokenSymbol: tx.tokenSymbol,
          }));
        }

        // Combine both lists and sort by timestamp in descending order.
        const combinedTxs = [...nativeTxs, ...tokenTxs].sort(
          (a, b) => Number(b.timeStamp) - Number(a.timeStamp)
        );

        setTransactions(combinedTxs);
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
      {!loading && !error && transactions.length > 0 && (
        <div>
          {transactions.map((tx, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #555',
                padding: '10px',
                borderRadius: '4px',
                marginBottom: '10px',
              }}
            >
              <p><strong>Hash:</strong> {tx.hash}</p>
              <p><strong>Block Number:</strong> {tx.blockNumber}</p>
              <p>
                <strong>Timestamp:</strong>{' '}
                {new Date(Number(tx.timeStamp) * 1000).toLocaleString()}
              </p>
              <p><strong>From:</strong> {tx.from}</p>
              <p><strong>To:</strong> {tx.to}</p>
              <p><strong>Value:</strong> {tx.value}</p>
              <p>
                <strong>Asset:</strong>{' '}
                {tx.tokenSymbol
                  ? tx.tokenSymbol
                  : (tx.contractAddress && tx.contractAddress !== "0x0000000000000000000000000000000000000000"
                    ? tx.contractAddress
                    : 'ETH (native)')}
              </p>
            </div>
          ))}
        </div>
      )}
      {!loading && !error && transactions.length === 0 && (
        <p>No transactions found.</p>
      )}
    </div>
  );
};

export default Activity;
