import React, { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import type { Token } from '@coinbase/onchainkit/token';

// Define the Token type and constants
const USDCToken: Token = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  chainId: 8453,
  decimals: 6,
  name: 'USDC',
  symbol: 'USDC',
  image: 'https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png',
};

const EURCToken: Token = {
  address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  chainId: 8453,
  decimals: 6,
  name: 'EURC',
  symbol: 'EURC',
  image: 'https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125',
};

const availableTokens: Token[] = [USDCToken, EURCToken];

// ERC20 ABI for transfer
const ERC20_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Define the props interface
interface SendProps {
  className?: string;
}

const SendSection: React.FC<SendProps> = ({ className = '' }) => {
  const { address } = useAccount();

  const [selectedToken, setSelectedToken] = useState<Token>(USDCToken);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
  const [transactionStatus, setTransactionStatus] = useState<string>('');

  // Function to validate Ethereum addresses
  const validateAddress = (address: string): boolean => {
    return address === '' || /^0x[a-fA-F0-9]{40}$/.test(address); // Simple regex for Ethereum address
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipientAddress(address);
    setIsValidAddress(address === '' || validateAddress(address));
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const token = availableTokens.find((t) => t.address === e.target.value);
    if (token) setSelectedToken(token);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const { writeContract, isPending, error } = useWriteContract();

  const handleSend = () => {
    if (!isValidAddress || !recipientAddress || !amount || !address) {
      setTransactionStatus('Please enter valid information and connect your wallet');
      return;
    }

    try {
      writeContract({
        address: selectedToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipientAddress, parseUnits(amount, selectedToken.decimals)],
      });
      setTransactionStatus('Transaction submitted. Awaiting confirmation...');
    } catch (err) {
      setTransactionStatus(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle transaction status updates (e.g., success or error)
  React.useEffect(() => {
    if (error) {
      setTransactionStatus(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  }, [error]);

  return (
    <div className={`bg-gradient-to-r from-white via-white to-white p-4 rounded-xl max-w-sm mx-auto ${className}`}>
      <h2 className="text-black text-xl font-bold mb-4">Send Tokens</h2>

      {/* Token Selection */}
      <div className="mb-4">
        <label htmlFor="token-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Token
        </label>
        <select
          id="token-select"
          value={selectedToken.address}
          onChange={handleTokenChange}
          className="w-full p-3 border border-gray-300 rounded-xl bg-[#f2f2f2] text-black"
        >
          {availableTokens.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Address Input */}
      <div className="mb-4">
        <label htmlFor="recipient-address" className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Address
        </label>
        <input
          id="recipient-address"
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={handleAddressChange}
          className={`w-full p-3 border ${isValidAddress ? 'border-gray-300' : 'border-red-500'} rounded-xl bg-[#f2f2f2] text-black`}
        />
        {!isValidAddress && (
          <p className="mt-1 text-sm text-red-600">Please enter a valid Ethereum address</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={handleAmountChange}
          min="0"
          step="0.000001"
          className="w-full p-3 border border-gray-300 rounded-xl bg-[#f2f2f2] text-black"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isPending || !isValidAddress || !recipientAddress || !amount || !address}
        className="w-full bg-black text-white rounded-full py-3 transition-colors disabled:bg-gray-400"
      >
        {isPending ? 'Sending...' : 'Send Tokens'}
      </button>

      {/* Transaction Status Message */}
      {transactionStatus && <div className="mt-2 text-gray-800 text-sm">{transactionStatus}</div>}

      {!address && (
        <div className="mt-4 text-red-500 text-center text-sm">
          Please connect your wallet and ensure it is set to the Base network (chainId: 8453).
        </div>
      )}
    </div>
  );
};

export default SendSection;