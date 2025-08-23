'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatUnits, parseEther } from 'viem';
import { getPrice } from '../Constants/getPrice';

// Contract ABIs for ETH-based SimplePredictionPot
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "name": "enterPot",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Removed USDC ABI - not needed for ETH-based contract

interface LiveMarketPotEntryProps {
  onPotEntered: () => void;
  contractAddress: string;
}

const ENTRY_FEE_USD = 0.01; // $0.01 USD entry fee

export default function LiveMarketPotEntry({ onPotEntered, contractAddress }: LiveMarketPotEntryProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const queryClient = useQueryClient();
  
  const [lastAction, setLastAction] = useState<'enter' | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getPrice('ETH');
        setEthPrice(price);
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(3000); // Fallback price
        setIsLoadingPrice(false);
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to convert USD to ETH
  const usdToEth = (usdAmount: number): bigint => {
    const fallbackEthPrice = 3000; // Fallback price if ETH price not loaded
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethAmount = usdAmount / currentEthPrice;
    return parseEther(ethAmount.toString());
  };

  // Get current entry fee in ETH
  const entryFeeEth = usdToEth(ENTRY_FEE_USD);

  // Read pot participants to check if user is already in
  const { data: participants } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: !!contractAddress && isConnected }
  }) as { data: string[] | undefined };

  // Read pot balance
  const { data: potBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getBalance',
    query: { enabled: !!contractAddress && isConnected }
  }) as { data: bigint | undefined };

  // Wait for transaction receipt
  const { data: receipt, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Check if user is already in the pot
  const isUserInPot = participants?.some(participant => 
    participant.toLowerCase() === address?.toLowerCase()
  );

  // For ETH, balance validation is handled by the wallet during transaction

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && receipt) {
      if (lastAction === 'enter') {
        setMessage('Successfully entered the pot!');
        // Force refetch of all contract data after entering pot
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['readContract'] });
          onPotEntered();
        }, 2000);
      }
      setIsLoading(false);
      setLastAction(null);
    }
  }, [isConfirmed, receipt, lastAction, onPotEntered, queryClient]);

  const handleEnterPot = () => {
    if (!address || !contractAddress) return;
    
    setIsLoading(true);
    setLastAction('enter');
    setMessage('Entering pot...');
    
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: PREDICTION_POT_ABI,
      functionName: 'enterPot',
      args: [], // No args for ETH-based contract
      value: entryFeeEth, // Send ETH as value
    });
  };

  const formatEthBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.0000';
    try {
      const formatted = formatUnits(balance, 18);
      return parseFloat(formatted).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  // Helper to display entry fee
  const getEntryFeeDisplay = (): string => {
    if (!ethPrice) return `~${formatEthBalance(entryFeeEth)} ETH`;
    return `$${ENTRY_FEE_USD.toFixed(2)} (~${formatEthBalance(entryFeeEth)} ETH)`;
  };

  // If user is already in the pot, proceed to questions
  useEffect(() => {
    if (isUserInPot && !isLoading) {
      onPotEntered();
    }
  }, [isUserInPot, isLoading, onPotEntered]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 text-center">
        <div className="bg-white border-2 border-gray-900 rounded-xl p-8 shadow-lg">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-2 border-white rounded-full"></div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Wallet Connection Required</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to access live prediction markets and start earning rewards.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-20 p-4">
      <div className="bg-white border-2 border-gray-900 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-8 py-8">
          <div className="text-center">
            
            <h1 className="text-3xl font-bold text-white mb-3">Live Market Entry</h1>
            <div className="bg-white/10 rounded-lg px-4 py-2 inline-block">
              <p className="text-gray-200 font-medium">Entry Fee: {getEntryFeeDisplay()}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Pot Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Pot Balance</div>
              <div className="text-xl font-bold text-green-600">
                {formatEthBalance(potBalance)} ETH
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Participants</div>
              <div className="text-xl font-bold text-blue-600">
                {participants?.length || 0}
              </div>
            </div>
          </div>


          {/* Status Messages */}
          {message && (
            <div className="bg-gray-50 border-l-4 border-gray-900 text-gray-800 px-6 py-4 rounded-r-lg mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                <p className="font-medium">{message}</p>
              </div>
            </div>
          )}

          {/* ETH balance validation handled by wallet */}

          {/* Action Buttons */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                  <h3 className="text-lg font-semibold text-gray-900">Enter Market</h3>
                </div>
                <button
                  onClick={handleEnterPot}
                  disabled={isLoading || isPending}
                  className="w-full bg-[#00aa00] hover:bg-black disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                >
                  {isLoading && lastAction === 'enter' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Entering Market...
                    </>
                  ) : (
                    `Enter (${getEntryFeeDisplay()})`
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-900 text-white rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-3">
                <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
              </div>
              How it works
            </h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
                <p className="text-gray-200">Pay $0.01 (in ETH) to enter the live prediction market</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
                <p className="text-gray-200">Make predictions on hourly questions</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
                <p className="text-gray-200">Winners share the pot equally at round end</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}