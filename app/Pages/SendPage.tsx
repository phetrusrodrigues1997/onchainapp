import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useSendTransaction, useSwitchChain, useReadContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import type { Token } from '@coinbase/onchainkit/token';
import { base } from 'wagmi/chains';
import { getWalletAddress } from '../Database/actions';

// Token definitions (unchanged from the original)
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

// ERC20 ABI (unchanged from the original)
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

interface SendPageProps {
  setActiveSection: (section: string) => void;
  className?: string;
}

const SendSection = ({ setActiveSection, className = '' }: SendPageProps) => {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [sentence, setSentence] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [inputRecipient, setInputRecipient] = useState<string>('');
  const [resolvedRecipient, setResolvedRecipient] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [isSentenceValid, setIsSentenceValid] = useState<boolean>(false);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [recipientError, setRecipientError] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [balance, setBalance] = useState<string | null>(null);

  // Parse sentence and validate token
  useEffect(() => {
    const regex = /^\s*send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+to\s+(.+)\s*$/i;
    const match = sentence.match(regex);
    if (match) {
      const [, amountStr, tokenSymbol, recipient] = match;
      const token = availableTokens.find(t => t.symbol.toLowerCase() === tokenSymbol.toLowerCase());
      if (token) {
        setAmount(amountStr);
        setSelectedToken(token);
        setInputRecipient(recipient.trim());
        setIsSentenceValid(true);
        setTokenError('');
      } else {
        setIsSentenceValid(false);
        setSelectedToken(null);
        setInputRecipient('');
        setAmount('');
        setTokenError(`Invalid token symbol: ${tokenSymbol}`);
      }
    } else {
      setIsSentenceValid(false);
      setSelectedToken(null);
      setInputRecipient('');
      setAmount('');
      setTokenError('');
    }
  }, [sentence]);

  // Resolve recipient (wallet address or username)
  useEffect(() => {
    const resolveRecipient = async () => {
      if (!inputRecipient) {
        setResolvedRecipient(null);
        setRecipientError('');
        return;
      }
      if (inputRecipient.startsWith('0x')) {
        if (/^0x[a-fA-F0-9]{40}$/.test(inputRecipient)) {
          setResolvedRecipient(inputRecipient);
          setRecipientError('');
        } else {
          setResolvedRecipient(null);
          setRecipientError('Invalid wallet address');
        }
      } else {
        setIsResolving(true);
        try {
          const walletAddress = await getWalletAddress(inputRecipient);
          if (walletAddress) {
            setResolvedRecipient(walletAddress);
            setRecipientError('');
          } else {
            setResolvedRecipient(null);
            setRecipientError('Username not found');
          }
        } catch (err) {
          setResolvedRecipient(null);
          setRecipientError('Error resolving username');
        } finally {
          setIsResolving(false);
        }
      }
    };
    resolveRecipient();
  }, [inputRecipient]);

  // Fetch balances (unchanged from the original)
  const { data: erc20BalanceData } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: { enabled: !!address && !!selectedToken?.address },
  });

  const { data: ethBalanceData } = useBalance({
    address: address as `0x${string}`,
    query: { enabled: !!address && selectedToken?.address === '' },
  });

  // Update balance state (unchanged from the original)
  useEffect(() => {
    if (!address || !selectedToken) {
      setBalance(null);
      return;
    }
    if (selectedToken.address === '') {
      if (ethBalanceData) {
        setBalance(formatUnits(ethBalanceData.value, selectedToken.decimals));
      }
    } else if (erc20BalanceData) {
      setBalance(formatUnits(erc20BalanceData as bigint, selectedToken.decimals));
    }
  }, [ethBalanceData, erc20BalanceData, selectedToken, address]);

  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { sendTransaction, isPending: isSendPending } = useSendTransaction();

  const handleSend = () => {
    if (!isSentenceValid || !selectedToken || !resolvedRecipient || !amount || !address) {
      setTransactionStatus('Invalid input or wallet not connected');
      return;
    }
    try {
      if (selectedToken.address === '') {
        sendTransaction({
          to: resolvedRecipient as `0x${string}`,
          value: parseUnits(amount, selectedToken.decimals),
        });
      } else {
        writeContract({
          address: selectedToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [resolvedRecipient, parseUnits(amount, selectedToken.decimals)],
        });
      }
      setTransactionStatus('Transaction submitted.');
    } catch (err) {
      setTransactionStatus(`Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Network switch (unchanged from the original)
  useEffect(() => {
    if (switchChain && chainId && chainId !== base.id) {
      setTransactionStatus('Please switch to Base network...');
      switchChain({ chainId: base.id });
    } else if (chainId === base.id) {
      setTransactionStatus('');
    }
  }, [chainId, switchChain]);

  const isPending = isWritePending || isSendPending;

  return (
    <div className={`bg-[#101010] p-4 rounded-lg max-w-sm mx-auto ${className} border border-gray-700 relative`}>
      {/* Manage Username Button */}
      <button
        className="absolute top-4 right-4 text-black font-semibold rounded-full px-2 py-1 text-sm bg-white hover:bg-[#d3c81a] transition-colors"
        onClick={() => setActiveSection("usernamePage")}
        aria-label="Manage your username"
      >
        Manage Username
      </button>

      <h2 className="text-white text-xl font-bold mb-4">Send Tokens</h2>

      {/* Input with error display */}
      <div className="mb-4">
        <label htmlFor="sentence" className="block text-sm font-medium text-gray-400 mb-1">
          Enter Command
        </label>
        <input
          id="sentence"
          type="text"
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder="Send 10 USDC to 0x1234abc... or username"
          className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ease-in-out ${
            recipientError || tokenError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-[#3B82F6]'
          }`}
        />
        {tokenError && (
          <p className="text-red-400 text-xs mt-1">{tokenError}</p>
        )}
      </div>

      {/* Display Recipient Status and Balance */}
      <div className="mb-4 text-[#d3c81a] text-sm">
        {isResolving && <p>Resolving username...</p>}
        {resolvedRecipient && !recipientError && (
          <p>Sending to {resolvedRecipient} {inputRecipient !== resolvedRecipient ? `` : ''}</p>
        )}
        {recipientError && <p className="text-red-400">{recipientError}</p>}
        {balance !== null && selectedToken && (
          <p>Available: {parseFloat(balance).toFixed(6)} {selectedToken.symbol}</p>
        )}
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isPending || !isSentenceValid || !resolvedRecipient || !!recipientError || !address || (!!chainId && chainId !== base.id)}
        className="w-full bg-white text-black font-bold rounded-full py-3 transition-colors hover:bg-[#d3c81a] cursor-pointer"
      >
        {isPending ? 'Sending...' : 'Send Tokens'}
      </button>

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