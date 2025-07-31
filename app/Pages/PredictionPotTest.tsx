import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
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

export default function PredictionPotTest() {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  // Contract addresses (you'll need to update these with your deployed addresses)
  const [contractAddress, setContractAddress] = useState<string>('0x390896082E635c9F9f07C0609d73140e4F166471');
  const [usdcAddress, setUsdcAddress] = useState<string>('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); 
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [winnerAddresses, setWinnerAddresses] = useState<string>('');

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
    setTimeout(() => setMessage(''), 5000);
  };

  const handleApprove = async () => {
    if (!contractAddress || !entryAmount) return;
    
    setIsLoading(true);
    try {
      await writeContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contractAddress, entryAmount],
      });
      showMessage('USDC approval transaction submitted!');
    } catch (error) {
      console.error('Approval failed:', error);
      showMessage('Approval failed. Check console for details.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterPot = async () => {
    if (!contractAddress) return;
    
    setIsLoading(true);
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
      });
      showMessage('Enter pot transaction submitted!');
    } catch (error) {
      console.error('Enter pot failed:', error);
      showMessage('Enter pot failed. Check console for details.', true);
    } finally {
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
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'distributePot',
        args: [winners],
      });
      showMessage('Distribute pot transaction submitted!');
    } catch (error) {
      console.error('Distribute pot failed:', error);
      showMessage('Distribute pot failed. Check console for details.', true);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-r from-green-900 to-yellow-800 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg border border-[#d3c81a] p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#d3c81a] mb-6 text-center">
            PredictionPot Contract Testing
          </h1>
          
          {!isConnected && (
            <div className="text-center text-white mb-6">
              Please connect your wallet to interact with the contract.
            </div>
          )}

          {/* Contract Setup */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Contract Setup</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  PredictionPot Contract Address
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-black/50 border border-[#d3c81a] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3c81a]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  USDC Contract Address
                </label>
                <input
                  type="text"
                  value={usdcAddress}
                  onChange={(e) => setUsdcAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-black/50 border border-[#d3c81a] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3c81a]"
                />
              </div>
            </div>
          </div>

          {/* Contract Info */}
          {contractAddress && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Contract Information</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Entry Amount</div>
                  <div className="text-[#d3c81a] font-semibold">
                    {formatBigIntValue(entryAmount)} USDC
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Pot Balance</div>
                  <div className="text-[#d3c81a] font-semibold">
                    {formatBigIntValue(potBalance)} USDC
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Participants</div>
                  <div className="text-[#d3c81a] font-semibold">
                    {getParticipantCount()}
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <div className="text-sm text-gray-300">Your USDC Balance</div>
                  <div className="text-[#d3c81a] font-semibold">
                    {formatBigIntValue(userUsdcBalance)} USDC
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Actions */}
          {isConnected && contractAddress && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">User Actions</h2>
              <div className="space-y-4">
                
                {/* Approve USDC */}
                <div className="bg-black/30 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-2">1. Approve USDC Spending</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Allow the contract to spend your USDC. Current allowance: {formatBigIntValue(allowance)} USDC
                  </p>
                  <button
                    onClick={handleApprove}
                    disabled={isLoading || hasEnoughAllowance}
                    className="bg-[#d3c81a] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hasEnoughAllowance ? 'Already Approved' : 'Approve USDC'}
                  </button>
                </div>

                {/* Enter Pot */}
                <div className="bg-black/30 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-2">2. Enter Prediction Pot</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Pay 10 USDC to enter the pot. Make sure you have approved USDC spending first.
                  </p>
                  <button
                    onClick={handleEnterPot}
                    disabled={isLoading || !hasEnoughAllowance || !hasEnoughBalance}
                    className="bg-[#d3c81a] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Enter Pot (10 USDC)
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
              <h2 className="text-xl font-semibold text-white mb-4">Owner Actions</h2>
              <div className="bg-black/30 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2">Distribute Pot to Winners</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Enter winner addresses separated by commas. The pot will be divided equally among all winners.
                </p>
                <textarea
                  value={winnerAddresses}
                  onChange={(e) => setWinnerAddresses(e.target.value)}
                  placeholder="0x123..., 0x456..., 0x789..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/50 border border-[#d3c81a] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3c81a] mb-3"
                />
                <button
                  onClick={handleDistributePot}
                  disabled={isLoading || !winnerAddresses.trim()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Distribute Pot
                </button>
              </div>
            </div>
          )}

          {/* Participants List */}
          {participants && Array.isArray(participants) && participants.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Current Participants</h2>
              <div className="bg-black/30 p-4 rounded-lg">
                <div className="space-y-2">
                  {participants.map((participant: string, index: number) => (
                    <div key={index} className="text-[#d3c81a] font-mono text-sm">
                      {index + 1}. {participant}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('failed') ? 'bg-red-900/50 border border-red-500' : 'bg-green-900/50 border border-green-500'}`}>
              <p className="text-white">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}