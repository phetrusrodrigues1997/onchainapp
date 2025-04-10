import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  // You can add more properties as needed
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
        // Replace "YourApiKeyToken" with your actual Etherscan API key.
        const apiUrl = `https://api.basescan.org/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=D218E1RHUH31YTCQTHD37IPB2CHBUUQHSW`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status !== "1" || !data.result || data.result.length === 0) {
          throw new Error(data.message || 'No transactions found');
        }

        setTransactions(data.result);
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
              <p>
                <strong>Hash:</strong> {tx.hash}
              </p>
              <p>
                <strong>Block Number:</strong> {tx.blockNumber}
              </p>
              <p>
                <strong>Timestamp:</strong>{' '}
                {new Date(Number(tx.timeStamp) * 1000).toLocaleString()}
              </p>
              <p>
                <strong>From:</strong> {tx.from}
              </p>
              <p>
                <strong>To:</strong> {tx.to}
              </p>
              <p>
                <strong>Value (wei):</strong> {tx.value}
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
