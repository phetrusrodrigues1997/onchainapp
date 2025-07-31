import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Contract ABI for PredictionPot
const PREDICTION_POT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdc", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "enterPot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address[]", "name": "winners", "type": "address[]"}],
    "name": "distributePot",
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
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "entryAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// USDC Contract ABI (minimal)
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

interface PredictionPotProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const PredictionPotTest =  ({ activeSection, setActiveSection }: PredictionPotProps) => {
  const { address, isConnected } = useAccount();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  // Contract addresses (you'll need to update these with your deployed addresses)
  const [contractAddress, setContractAddress] = useState<string>('0x390896082E635c9F9f07C0609d73140e4F166471');
  const [usdcAddress, setUsdcAddress] = useState<string>('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); 
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [winnerAddresses, setWinnerAddresses] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Handle transaction confirmation and errors
  useEffect(() => {
    if (isConfirmed) {
      setIsLoading(false);
      if (lastAction === 'approve') {
        showMessage('USDC approval confirmed! You can now enter the pot.');
        // Refresh the page data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (lastAction === 'enterPot') {
        showMessage('Successfully entered the pot! Redirecting to betting page...');
        // Navigate to betting page after a short delay
        
      } else if (lastAction === 'distributePot') {
        showMessage('Pot distributed successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      setLastAction('');
    }
  }, [isConfirmed, lastAction]);

  // Reset loading state if transaction fails
  useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed && lastAction) {
      // Transaction might have failed, reset loading state
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setLastAction('');
        }
      }, 3000);
    }
  }, [isPending, isConfirming, isConfirmed, lastAction, isLoading]);

  // Read contract data with proper typing
  const { data: participants } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: !!contractAddress }
  }) as { data: string[] | undefined };

  const { data: potBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getBalance',
    query: { enabled: !!contractAddress }
  }) as { data: bigint | undefined };

  const { data: owner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'owner',
    query: { enabled: !!contractAddress }
  }) as { data: string | undefined };

  const { data: entryAmount } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'entryAmount',
    query: { enabled: !!contractAddress }
  }) as { data: bigint | undefined };

  const { data: userUsdcBalance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address && !!usdcAddress }
  }) as { data: bigint | undefined };

  const { data: allowance } = useReadContract({
    address: usdcAddress as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address, contractAddress],
    query: { enabled: !!address && !!contractAddress && !!usdcAddress }
  }) as { data: bigint | undefined };

  // Check if the user is a participant
  const isParticipant = address && participants && Array.isArray(participants) 
    ? participants.some(participant => participant.toLowerCase() === address.toLowerCase())
    : false;

  // Type-safe helpers
  const formatBigIntValue = (value: bigint | undefined, decimals: number = 6): string => {
    if (!value) return '0';
    try {
      return formatUnits(value, decimals);
    } catch {
      return '0';
    }
  };

  const getParticipantCount = (): number => {
    if (!participants || !Array.isArray(participants)) return 0;
    return participants.length;
  };

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    if (!isError) {
      setTimeout(() => setMessage(''), 8000); // Longer timeout for success messages
    } else {
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleApprove = async () => {
    if (!contractAddress || !entryAmount) return;
    
    setIsLoading(true);
    setLastAction('approve');
    try {
      await writeContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contractAddress, entryAmount],
      });
      showMessage('USDC approval transaction submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Approval failed:', error);
      showMessage('Approval failed. Check console for details.', true);
      setLastAction('');
      setIsLoading(false);
    }
  };

  const handleEnterPot = async () => {
    if (!contractAddress) return;
    
    setIsLoading(true);
    setLastAction('enterPot');
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
      });
      showMessage('Enter pot transaction submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Enter pot failed:', error);
      showMessage('Enter pot failed. Check console for details.', true);
      setLastAction('');
      setIsLoading(false);
    }
  };

  const handleDistributePot = async () => {
    if (!contractAddress || !winnerAddresses.trim()) return;

    const winners = winnerAddresses
      .split(',')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
    
    if (winners.length === 0) {
      showMessage('Please enter at least one winner address.', true);
      return;
    }

    setIsLoading(true);
    setLastAction('distributePot');
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'distributePot',
        args: [winners],
      });
      showMessage('Distribute pot transaction submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Distribute pot failed:', error);
      showMessage('Distribute pot failed. Check console for details.', true);
      setLastAction('');
      setIsLoading(false);
    }
  };

  const isActuallyLoading = isLoading || isPending || isConfirming;
  
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();
  
  const hasEnoughAllowance = (() => {
    if (!allowance || !entryAmount) return false;
    try {
      return allowance >= entryAmount;
    } catch {
      return false;
    }
  })();
  
  const hasEnoughBalance = (() => {
    if (!userUsdcBalance || !entryAmount) return false;
    try {
      return userUsdcBalance >= entryAmount;
    } catch {
      return false;
    }
  })();

  return (
    <div className="min-h-screen bg-invisible p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-invisible backdrop-blur-sm border border-white/20 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#ffffff] mb-6 text-center">
            The <span style={{ color: '#F7931A' }}>₿</span>itcoin Pot
          </h1>

          {!isConnected && (
            <div className="text-center text-[#F5F5F5] mb-6">
              Please connect your wallet to interact with the contract.
            </div>
          )}

          {/* Contract Info */}
          {contractAddress && (
            <div className="mb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <div className="text-sm text-[#A0A0B0]">Entry Amount</div>
                  <div className="text-[#F5F5F5] font-semibold">
                    {formatBigIntValue(entryAmount)} USDC
                  </div>
                </div>
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <div className="text-sm text-[#A0A0B0]">Pot Balance</div>
                  <div className="text-[#F5F5F5] font-semibold">
                    {formatBigIntValue(potBalance)} USDC
                  </div>
                </div>
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <div className="text-sm text-[#A0A0B0]">Participants</div>
                  <div className="text-[#F5F5F5] font-semibold">
                    {getParticipantCount()}
                  </div>
                </div>
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <div className="text-sm text-[#A0A0B0]">Your USDC Balance</div>
                  <div className="text-[#F5F5F5] font-semibold">
                    {formatBigIntValue(userUsdcBalance)} USDC
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {(isPending || isConfirming) && (
            <div className="mb-6">
              <div className="bg-[#2C2C47] p-4 rounded-lg border border-[#d3c81a]">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#d3c81a]"></div>
                  <div className="text-[#F5F5F5]">
                    {isPending && 'Waiting for wallet confirmation...'}
                    {isConfirming && 'Transaction confirming on blockchain...'}
                  </div>
                </div>
                {txHash && (
                  <div className="text-center mt-2">
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d3c81a] text-sm hover:underline"
                    >
                      View on BaseScan →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Actions - Show different content if already a participant */}
          {isConnected && contractAddress && isParticipant && (
            <div className="mb-6">
              <div className="bg-[#2C2C47] p-6 rounded-lg text-center">
                <div className="text-[#d3c81a] text-xl font-semibold mb-3">
                  🎉 You're in the Pot!
                </div>
                <div className="text-[#F5F5F5] mb-4">
                  You've successfully entered the Bitcoin Pot. You can now place your daily Bitcoin price predictions!
                </div>
                <button
                  onClick={() => setActiveSection('bitcoinBetting')}
                  className="bg-[#6A5ACD] text-black px-6 py-3 rounded-md font-medium hover:bg-[#c4b517] transition-colors"
                >
                  Go to Betting Page
                </button>
              </div>
            </div>
          )}

          {/* User Actions - Only show if not yet a participant */}
          {isConnected && contractAddress && !isParticipant && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#F5F5F5] mb-4">User Actions</h2>
              <div className="space-y-4">
                
                {/* Approve USDC */}
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <h3 className="text-[#F5F5F5] font-medium mb-2">1. Approve USDC Spending</h3>
                  <p className="text-[#A0A0B0] text-sm mb-3">
                    Allow the contract to spend your USDC. Current allowance: {formatBigIntValue(allowance)} USDC
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isActuallyLoading || hasEnoughAllowance}
                    className="bg-[#6A5ACD] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActuallyLoading && lastAction === 'approve' ? 'Processing...' : hasEnoughAllowance ? 'Already Approved' : 'Approve USDC'}
                  </button>
                </div>

                {/* Enter Pot */}
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <h3 className="text-[#F5F5F5] font-medium mb-2">2. Enter Prediction Pot</h3>
                  <p className="text-[#A0A0B0] text-sm mb-3">
                    Pay 10 USDC to enter the pot. Make sure you have approved USDC spending first.
                  </p>
                  <button
                    onClick={handleEnterPot}
                    disabled={isActuallyLoading || !hasEnoughAllowance || !hasEnoughBalance}
                    className="bg-[#6A5ACD] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActuallyLoading && lastAction === 'enterPot' ? 'Processing...' : 'Enter Pot (10 USDC)'}
                  </button>
                  {!hasEnoughBalance && (
                    <p className="text-red-400 text-sm mt-2">Insufficient USDC balance</p>
                  )}
                  {!hasEnoughAllowance && hasEnoughBalance && (
                    <p className="text-yellow-400 text-sm mt-2">Please approve USDC spending first</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Owner Actions */}
          {isOwner && contractAddress && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#F5F5F5] mb-4">Owner Actions</h2>
              <div className="bg-[#2C2C47] p-4 rounded-lg">
                <h3 className="text-[#F5F5F5] font-medium mb-2">Distribute Pot to Winners</h3>
                <p className="text-[#A0A0B0] text-sm mb-3">
                  Enter winner addresses separated by commas. The pot will be divided equally among all winners.
                </p>
                <textarea
                  value={winnerAddresses}
                  onChange={(e) => setWinnerAddresses(e.target.value)}
                  placeholder="0x123..., 0x456..., 0x789..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/50 border border-[#d3c81a] rounded-md text-[#F5F5F5] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3c81a] mb-3"
                />
                <button
                  onClick={handleDistributePot}
                  disabled={isActuallyLoading || !winnerAddresses.trim()}
                  className="bg-red-600 text-[#F5F5F5] px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActuallyLoading && lastAction === 'distributePot' ? 'Processing...' : 'Distribute Pot'}
                </button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('failed') ? 'bg-red-900/50 border border-red-500' : 'bg-green-900/50 border border-green-500'}`}>
              <p className="text-[#F5F5F5]">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPotTest;