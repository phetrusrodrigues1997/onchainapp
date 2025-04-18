import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useSendTransaction, useSwitchChain, useReadContract, useBalance } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import type { Token } from '@coinbase/onchainkit/token';
import { base } from 'wagmi/chains';
import { getWalletAddress } from '../Database/actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import ChatbotInterface from './ChatbotInterface';
import SwapService from './SwapService';
import CryptoPriceService from './CryptoPriceService';
import ApiKeyService from './ApiKeyService';

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

  // New input states
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [inputRecipient, setInputRecipient] = useState<string>('');
  const [resolvedRecipient, setResolvedRecipient] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [recipientError, setRecipientError] = useState<string>('');
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [balance, setBalance] = useState<string | null>(null);

  // Resolve recipient
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
        } catch {
          setResolvedRecipient(null);
          setRecipientError('Error resolving username');
        } finally {
          setIsResolving(false);
        }
      }
    };
    resolveRecipient();
  }, [inputRecipient]);

  // Fetch balances
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

  useEffect(() => {
    if (!address || !selectedToken) {
      setBalance(null);
      return;
    }
    if (selectedToken.address === '') {
      if (ethBalanceData) setBalance(formatUnits(ethBalanceData.value, selectedToken.decimals));
    } else if (erc20BalanceData) {
      setBalance(formatUnits(erc20BalanceData as bigint, selectedToken.decimals));
    }
  }, [ethBalanceData, erc20BalanceData, selectedToken, address]);

  const { writeContract, isPending: isWritePending } = useWriteContract();
  const { sendTransaction, isPending: isSendPending } = useSendTransaction();
  const [showDropdown, setShowDropdown] = useState(false);

  // Send handler
  const handleSend = () => {
    if (!selectedToken || !resolvedRecipient || !amount || !address) {
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

  // Network switch
  useEffect(() => {
    if (switchChain && chainId && chainId !== base.id) {
      setTransactionStatus('Please switch to Base network...');
      switchChain({ chainId: base.id });
    } else if (chainId === base.id) {
      setTransactionStatus('');
    }
  }, [chainId, switchChain]);

  // Handle swap request from chatbot
  const handleSwapRequest = async (fromToken: Token, toToken: Token, amount: string): Promise<boolean> => {
    if (!address) {
      setTransactionStatus('Wallet not connected');
      return false;
    }
    
    try {
      console.log(`Executing swap: ${amount} ${fromToken.symbol} to ${toToken.symbol}`);
      
      // For a real implementation, this would call a swap contract
      // For now, we'll simulate a swap by sending a transaction
      if (fromToken.address === '') {
        // Swapping from ETH
        sendTransaction({
          to: toToken.address as `0x${string}`,
          value: parseUnits(amount, fromToken.decimals),
        });
      } else {
        // Swapping from ERC20
        writeContract({
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [toToken.address as `0x${string}`, parseUnits(amount, fromToken.decimals)],
        });
      }
      setTransactionStatus(`Swap transaction submitted: ${amount} ${fromToken.symbol} to ${toToken.symbol}`);
      return true;
    } catch (err) {
      console.error("Swap execution error:", err);
      setTransactionStatus(`Swap failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // Handle send request from chatbot
  const handleSendRequest = async (token: Token, amount: string, recipient: string): Promise<boolean> => {
    if (!address) {
      setTransactionStatus('Wallet not connected');
      return false;
    }
    
    try {
      console.log(`Executing send: ${amount} ${token.symbol} to ${recipient}`);
      
      // Check if recipient is a wallet address or needs to be resolved
      let resolvedAddress: string;
      
      if (recipient.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(recipient)) {
        // Already a valid Ethereum address
        resolvedAddress = recipient;
      } else {
        // Try to resolve as a username
        setTransactionStatus('Resolving recipient username...');
        try {
          const walletAddress = await getWalletAddress(recipient);
          if (walletAddress) {
            resolvedAddress = walletAddress;
          } else {
            setTransactionStatus(`Username not found: ${recipient}`);
            return false;
          }
        } catch (error) {
          setTransactionStatus(`Error resolving username: ${recipient}`);
          return false;
        }
      }
      
      // Execute the send transaction
      if (token.address === '') {
        // Sending ETH
        sendTransaction({
          to: resolvedAddress as `0x${string}`,
          value: parseUnits(amount, token.decimals),
        });
      } else {
        // Sending ERC20 token
        writeContract({
          address: token.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [resolvedAddress as `0x${string}`, parseUnits(amount, token.decimals)],
        });
      }
      
      setTransactionStatus(`Send transaction submitted: ${amount} ${token.symbol} to ${recipient}`);
      return true;
    } catch (err) {
      console.error("Send execution error:", err);
      setTransactionStatus(`Send failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    }
  };

  const isPending = isWritePending || isSendPending;

  return (
    <>
      <div className="relative mt-12">
        <div className="text-center">
          <FontAwesomeIcon icon={faPaperPlane} size="6x" className="text-[#d3c81a] mb-4" />
          <h2 className="text-2xl font-bold text-white">Send your money to anyone, anywhere, 24-7.</h2>
        </div>
      </div>
      <div className={` p-4 mt-6 rounded-lg max-w-sm mx-auto ${className} relative`}>
        {/* Manage Username Button
        <button className="absolute top-4 right-4 text-black font-semibold rounded-full px-2 py-1 text-sm bg-white hover:bg-[#d3c81a] transition-colors" onClick={() => setActiveSection("usernamePage")}>Manage Username</button> */}

        

        {/* Token Select */}
        <div className="relative">
  <button
    type="button"
    onClick={() => setShowDropdown(prev => !prev)}
    className="w-full flex items-center justify-between p-3 bg-[#002200] border border-gray-400 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <div className="flex items-center space-x-2">
      {selectedToken ? (
        <>
          <img src={selectedToken.image || ''} alt={selectedToken.symbol} className="w-5 h-5 rounded-full" />
          <span>{selectedToken.symbol}</span>
        </>
      ) : (
        <span>Select a token</span>
      )}
    </div>
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {showDropdown && (
    <ul className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg max-h-60 overflow-auto">
      {availableTokens.map(t => (
        <li
          key={t.symbol}
          onClick={() => {
            setSelectedToken(t);
            setShowDropdown(false);
          }}
          className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
        >
          <img src={t.image || ''} alt={t.symbol} className="w-5 h-5 rounded-full mr-2" />
          <span>{t.symbol}</span>
        </li>
      ))}
    </ul>
  )}
</div>


        {/* Amount Input */}
        <div className="mt-2">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
          <input
            id="amount"
            type="text"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full p-3 bg-[#002200] border border-gray-400 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Recipient Input */}
        <div className="mt-3">
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-400 mb-1">Recipient (address or username)</label>
          <input
            id="recipient"
            type="text"
            value={inputRecipient}
            onChange={e => setInputRecipient(e.target.value)}
            placeholder="0x... or username"
            className={`w-full p-3 bg-[#002200] border border-gray-400 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${recipientError ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
          {recipientError && <p className="text-red-400 text-xs mt-1">{recipientError}</p>}
        </div>

        {/* Status and Balance */}
        <div className="mb-4 text-[#d3c81a] text-sm">
          {isResolving && <p>Resolving username...</p>}
          {resolvedRecipient && !recipientError && <p>Sending to {resolvedRecipient}</p>}
          {balance !== null && selectedToken && <p>Available: {parseFloat(balance).toFixed(6)} {selectedToken.symbol}</p>}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isPending || !selectedToken || !amount || !resolvedRecipient || !!recipientError || !address || (!!chainId && chainId !== base.id)}
          className="w-full bg-white text-black font-bold rounded-full py-3 transition-colors hover:bg-[#00aa00] disabled:cursor-not-allowed"
        >
          {isPending ? 'Sending...' : 'Send Tokens'}
        </button>
            {/* Chatbot Integration */}
      <ChatbotInterface
        onSwapRequest={handleSwapRequest}
        onSendRequest={handleSendRequest}
        availableTokens={availableTokens}
        userAddress={address}
        apiKey={process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''}
      />
      </div>

      

      {transactionStatus && <div className="mt-2 text-gray-400 text-sm">{transactionStatus}</div>}
      {!address && <div className="mt-4 text-red-400 text-center text-sm">Please connect your wallet and ensure it is set to the Base network (chainId: 8453).</div>}
    </>
  );
};

export default SendSection;
