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
              <p className="text-gray-200 font-medium">Entry Fee: $0.01 USDC</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Pot Stats
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
          </div> */}


          {/* Status Messages */}
          {message && (
            <div className="bg-gray-50 border-l-4 border-gray-900 text-gray-800 px-6 py-4 rounded-r-lg mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                <p className="font-medium">{message}</p>
              </div>
            </div>
          )}

          {!hasEnoughUsdc && (
            <div className="bg-red-50 border-l-4 border-red-600 text-red-800 px-6 py-4 rounded-r-lg mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                <p className="font-medium">Insufficient USDC balance. You need at least $0.01 USDC to enter.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              {!hasApprovedEnough ? (
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">1</div>
                    <h3 className="text-lg font-semibold text-gray-900">Approve USDC</h3>
                  </div>
                  <button
                    onClick={handleApproveUsdc}
                    disabled={isLoading || isPending || !hasEnoughUsdc}
                    className="w-full bg-[#0000aa] hover:bg-black disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                  >
                    {isLoading && lastAction === 'approve' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Approving USDC...
                      </>
                    ) : (
                      'Approve USDC'
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">2</div>
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
                      'Enter ($0.01 USDC)'
                    )}
                  </button>
                </div>
              )}
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
                <p className="text-gray-200">Pay $0.01 USDC to enter the live prediction market</p>
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