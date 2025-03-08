import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useSwitchChain, useReadContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import type { Token } from '@coinbase/onchainkit/token';
import { base } from 'wagmi/chains'; // Import Base chain

const ETHToken: Token = {
  address: "",
  chainId: 8453,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  image: "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
};

const WETHToken: Token = {
  address: "0x4200000000000000000000000000000000000006",
  chainId: 8453,
  decimals: 18,
  name: "Wrapped Eth",
  symbol: "WETH",
  image: "https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282"
};

const USDCToken: Token = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  chainId: 8453,
  decimals: 6,
  name: "USDC",
  symbol: "USDC",
  image: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

const CbBTCToken: Token = {
  address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
  chainId: 8453,
  decimals: 8,
  name: "Coinbase BTC",
  symbol: "cbBTC",
  image: "https://basescan.org/token/images/cbbtc_32.png",
};

const EURCToken: Token = {
  address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  chainId: 8453,
  decimals: 6,
  name: "EURC",
  symbol: "EURC",
  image: "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
};

const CADCToken: Token = {
  address: "0x043eB4B75d0805c43D7C834902E335621983Cf03",
  chainId: 8453,
  decimals: 18,
  name: "Canadian Dollar",
  symbol: "CADC",
  image: "https://www.svgrepo.com/show/405442/flag-for-flag-canada.svg",
};

const BRZToken: Token = {
  address: "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4",
  chainId: 8453,
  decimals: 18,
  name: "Brazilian Real",
  symbol: "BRZ",
  image: "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
};

const LiraToken: Token = {
  address: "0x1A9Be8a692De04bCB7cE5cDDD03afCA97D732c62",
  chainId: 8453,
  decimals: 8,
  name: "Turkish Lira",
  symbol: "TRYB",
  image: "https://www.svgrepo.com/show/242355/turkey.svg",
};

const MEXPeso: Token = {
  address: "0x269caE7Dc59803e5C596c95756faEeBb6030E0aF",
  chainId: 8453,
  decimals: 6,
  name: "Mexican Peso",
  symbol: "MXNe",
  image: "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
};

const availableTokens: Token[] = [USDCToken, EURCToken, CADCToken, BRZToken, LiraToken, MEXPeso, CbBTCToken, ETHToken, WETHToken];

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
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Define the props interface
interface SendProps {
  className?: string;
}

const SendSection: React.FC<SendProps> = ({ className = '' }) => {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [selectedToken, setSelectedToken] = useState<Token>(USDCToken);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [isValidAddress, setIsValidAddress] = useState<boolean>(true);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // State to manage dropdown visibility

  // Fetch ERC-20 balance using useReadContract (for non-ETH tokens)
  const { data: erc20BalanceData } = useReadContract({
    address: selectedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && !!selectedToken.address, // Only fetch if address and token are available
    },
  });

  // Fetch ETH balance using useBalance (for ETH token)
  const { data: ethBalanceData } = useBalance({
    address: address as `0x${string}`,
    query: {
      enabled: !!address && !selectedToken.address, // Only fetch for ETH (address === '')
    },
  });

  // State to store formatted balance
  const [balance, setBalance] = useState<string | null>(null);

  // Update balance based on selected token
  useEffect(() => {
    if (!address) {
      setBalance(null);
      return;
    }

    if (selectedToken.address === '') {
      // Handle ETH balance
      if (ethBalanceData) {
        setBalance(formatUnits(ethBalanceData.value, selectedToken.decimals));
      }
    } else {
      // Handle ERC-20 balance
      if (erc20BalanceData) {
        setBalance(formatUnits(erc20BalanceData as bigint, selectedToken.decimals));
      }
    }
  }, [ethBalanceData, erc20BalanceData, selectedToken, address]);

  // Function to validate Ethereum addresses
  const validateAddress = (address: string): boolean => {
    return address === '' || /^0x[a-fA-F0-9]{40}$/.test(address); // Simple regex for Ethereum address
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setRecipientAddress(address);
    setIsValidAddress(address === '' || validateAddress(address));
  };

  const handleTokenChange = (token: Token) => {
    setSelectedToken(token);
    setIsDropdownOpen(false); // Close dropdown after selection
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
      setTransactionStatus('Transaction submitted.');
    } catch (err) {
      setTransactionStatus(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle network switch
  useEffect(() => {
    if (switchChain && chainId && chainId !== base.id) {
      setTransactionStatus('Please switch to the Base network...');
      switchChain({ chainId: base.id }); // Use switchChain with chainId
    } else if (chainId === base.id) {
      setTransactionStatus(''); // Clear message if on correct network
    }
  }, [chainId, switchChain]);

  // Handle transaction status updates (e.g., success or error)
  useEffect(() => {
    if (error) {
      setTransactionStatus(`Transaction failed: ${error.message || 'Unknown error'}`);
    }
  }, [error]);

  return (
    <div className={`bg-gray-900 p-4 rounded-lg max-w-sm mx-auto ${className} border border-gray-700`}>
      <h2 className="text-white text-xl font-bold mb-4">Send Tokens</h2>

      {/* Token Selection with Custom Dropdown */}
      <div className="mb-4">
        <label htmlFor="token-select" className="block text-sm font-medium text-gray-400 mb-1">
          Select Token
        </label>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} // Toggle dropdown visibility
            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <span className="flex items-center">
              <img src={selectedToken.image ?? ''} alt={selectedToken.symbol} className="w-6 h-6 mr-2" />
              {selectedToken.symbol}
            </span>
            <span>▼</span>
          </button>
          <div className={`absolute z-10 text-black w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg ${isDropdownOpen ? '' : 'hidden'}`} id="token-dropdown">
            {availableTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleTokenChange(token)}
                className="w-full text-left p-2 hover:bg-gray-100 flex items-center"
              >
                <img src={token.image ?? undefined} alt={token.symbol} className="w-6 h-6 mr-2" />
                {token.symbol}
              </button>
            ))}
          </div>
        </div>
        {balance !== null && address && (
          <p className="mt-1 text-sm text-gray-400">
            Available: {parseFloat(balance).toFixed(6)} {selectedToken.symbol}
          </p>
        )}
      </div>

      {/* Recipient Address Input */}
      <div className="mb-4">
        <label htmlFor="recipient-address" className="block text-sm font-medium text-gray-400 mb-1">
          Recipient Address
        </label>
        <input
          id="recipient-address"
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={handleAddressChange}
          className={`w-full p-3 bg-white border ${isValidAddress ? 'border-gray-300' : 'border-red-400'} rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#3B82F6]`}
        />
        {!isValidAddress && (
          <p className="mt-1 text-sm text-red-400">Please enter a valid Ethereum address</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">
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
          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
        />
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={!!(isPending || !isValidAddress || !Boolean(recipientAddress) || !Boolean(amount) || !address || (chainId && chainId !== base.id))}
        className="w-full bg-[#000077] text-white rounded-full py-3 transition-colors hover:bg-[#2563EB] disabled:bg-[#000077]"
      >
        {isPending ? 'Sending...' : 'Send Tokens'}
      </button>

      {/* Transaction Status Message */}
      {transactionStatus && <div className="mt-2 text-gray-400 text-sm">{transactionStatus}</div>}

      {!address && (
        <div className="mt-4 text-red-400 text-center text-sm">
          Please connect your wallet and ensure it is set to the Base network (chainId: 8453).
        </div>
      )}
    </div>
  );
};

export default SendSection;