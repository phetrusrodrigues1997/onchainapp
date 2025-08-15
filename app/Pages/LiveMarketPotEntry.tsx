'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatUnits, parseUnits } from 'viem';

// Contract ABIs
const PREDICTION_POT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "enterPot",
    "outputs": [],
    "stateMutability": "nonpayable",
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

const USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "address", "name": "spender", "type": "address"}],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

interface LiveMarketPotEntryProps {
  onPotEntered: () => void;
  contractAddress: string;
}

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const ENTRY_FEE_USDC = parseUnits('0.01', 6); // 0.01 USDC

export default function LiveMarketPotEntry({ onPotEntered, contractAddress }: LiveMarketPotEntryProps) {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const queryClient = useQueryClient();
  
  const [lastAction, setLastAction] = useState<'approve' | 'enter' | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Read user's USDC balance
  const { data: userUsdcBalance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && isConnected }
  }) as { data: bigint | undefined };

  // Read current allowance
  const { data: currentAllowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address, contractAddress],
    query: { enabled: !!address && !!contractAddress && isConnected }
  }) as { data: bigint | undefined };

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

  // Check if user has enough USDC
  const hasEnoughUsdc = userUsdcBalance && userUsdcBalance >= ENTRY_FEE_USDC;

  // Check if user has approved enough USDC
  const hasApprovedEnough = currentAllowance && currentAllowance >= ENTRY_FEE_USDC;

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && receipt) {
      if (lastAction === 'approve') {
        setMessage('USDC approved successfully! Now entering pot...');
        // Force refetch of all contract data after approval
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['readContract'] });
        }, 1000);
      } else if (lastAction === 'enter') {
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

  const handleApproveUsdc = () => {
    if (!address || !contractAddress) return;
    
    setIsLoading(true);
    setLastAction('approve');
    setMessage('Approving USDC...');
    
    writeContract({
      address: USDC_ADDRESS as `0x${string}`,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [contractAddress, ENTRY_FEE_USDC],
    });
  };

  const handleEnterPot = () => {
    if (!address || !contractAddress) return;
    
    setIsLoading(true);
    setLastAction('enter');
    setMessage('Entering pot...');
    
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: PREDICTION_POT_ABI,
      functionName: 'enterPot',
      args: [ENTRY_FEE_USDC],
    });
  };

  const formatUsdcBalance = (balance: bigint | undefined): string => {
    if (!balance) return '0.00';
    try {
      const formatted = formatUnits(balance, 6);
      return parseFloat(formatted).toFixed(2);
    } catch {
      return '0.00';
    }
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
        <div className="bg-white border-2 border-black rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Wallet Required</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to access live prediction markets.</p>
          <div className="text-4xl mb-4">🔗</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-20 p-4">
      <div className="bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wider">Live Predictions</h1>
              <p className="text-gray-300 mt-1">Entry required to participate</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Entry Fee</div>
              <div className="text-xl font-bold text-green-400">$0.01 USDC</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Pot Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-500 mb-1">Pot Balance</div>
              <div className="text-xl font-bold text-green-600">
                ${formatUsdcBalance(potBalance)}
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
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6">
              {message}
            </div>
          )}

          {!hasEnoughUsdc && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
              Insufficient USDC balance. You need at least $0.01 USDC to enter.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {!hasApprovedEnough ? (
              <button
                onClick={handleApproveUsdc}
                disabled={isLoading || isPending || !hasEnoughUsdc}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading && lastAction === 'approve' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Approving USDC...
                  </>
                ) : (
                  '1. Approve USDC'
                )}
              </button>
            ) : (
              <button
                onClick={handleEnterPot}
                disabled={isLoading || isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading && lastAction === 'enter' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Entering Pot...
                  </>
                ) : (
                  '2. Enter Pot ($0.01)'
                )}
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Pay $0.01 USDC to enter the live prediction pot</li>
              <li>• Make predictions on live questions every 15 minutes</li>
              <li>• Winners share the pot equally at the end of each round</li>
              <li>• New questions and opportunities every 15 minutes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}