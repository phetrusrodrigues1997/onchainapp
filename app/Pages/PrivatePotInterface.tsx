import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';

// Import new private pot database functions
import { 
  getPotDetails,
  makePrediction,
  getUserPrediction,
  addParticipant,
  isParticipant,
  getParticipants,
  getPredictionsForDate
} from '../Database/actions2';

import {
  setPotOutcome,
  closePotEntries,
  getPotStats,
  clearWrongPredictionsForUser,
  getWrongPredictors,
  updatePotEntryAmount
} from '../Database/ownerActions2';

// Contract ABI for individual pot contracts (clones)
const PRIVATE_POT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "enterPot",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "participant", "type": "address"}],
    "name": "enterPotFree",
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
    "name": "closePot",
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
    "name": "creator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "potName",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "description",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "state",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

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
] as const;

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

interface PrivatePotInterfaceProps {
  contractAddress: string;
  onBack: () => void;
}

const PrivatePotInterface: React.FC<PrivatePotInterfaceProps> = ({ 
  contractAddress, 
  onBack 
}) => {
  const [newEntryAmount, setNewEntryAmount] = useState(''); // For creator to set new entry amount
  const [prediction, setPrediction] = useState<'positive' | 'negative' | null>(null);
  const [potDetails, setPotDetails] = useState<any>(null);
  const [userParticipant, setUserParticipant] = useState(false);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [potStats, setPotStats] = useState<any>(null);
  const [showCreatorPanel, setShowCreatorPanel] = useState(false);
  const [outcomeToSet, setOutcomeToSet] = useState<'positive' | 'negative'>('positive');
  const [predictionDate, setPredictionDate] = useState('');
  const [usdcApproved, setUsdcApproved] = useState(false); // Simple approval tracking

  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Contract read hooks
  const { data: potBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'getBalance',
  });

  const { data: potParticipants } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'getParticipants',
  });

  const { data: potOwner } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'owner',
  });

  const { data: potState } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'state',
  });

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address!],
  });

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address!, contractAddress as `0x${string}`],
  });

  // Transaction hooks
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Load pot details and user data
  useEffect(() => {
    const loadData = async () => {
      if (!address) return;

      // Get pot details from database
      const details = await getPotDetails(contractAddress);
      setPotDetails(details);

      if (details) {
        // Check if user is the creator
        setIsCreator(details.creatorAddress.toLowerCase() === address.toLowerCase());
        
        // If creator, load stats
        if (details.creatorAddress.toLowerCase() === address.toLowerCase()) {
          const stats = await getPotStats(contractAddress, address);
          if (stats.success) {
            setPotStats(stats.stats);
          }
        }
      }

      // Check if user is participant
      const participant = await isParticipant(contractAddress, address);
      setUserParticipant(participant);

      // Get user's prediction for today
      const today = new Date().toISOString().split('T')[0];
      const userPred = await getUserPrediction(contractAddress, address, today);
      setUserPrediction(userPred);
      setPredictionDate(today);
    };

    loadData();
  }, [address, contractAddress, isConfirmed]);

  // Handle USDC approval - approve a large amount to avoid repeated approvals
  const handleApprove = () => {
    if (!potDetails?.entryAmount || !address) return;

    // Approve a large amount (1000 USDC) so users don't need to approve every time
    const largeApprovalAmount = BigInt(1000 * 1_000_000); // 1000 USDC in micros
    
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [contractAddress as `0x${string}`, largeApprovalAmount],
    });
  };

  // Track when approval is confirmed
  useEffect(() => {
    if (isConfirmed && hash && !usdcApproved) {
      setUsdcApproved(true);
    }
  }, [isConfirmed, hash, usdcApproved]);

  // Handle pot entry
  const handleEnterPot = async () => {
    if (!potDetails?.entryAmount || !address) return;

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: PRIVATE_POT_ABI,
        functionName: 'enterPot',
        args: [BigInt(potDetails.entryAmount)],
      });
    } catch (error) {
      console.error('Error entering pot:', error);
    }
  };

  // Add participant to database when transaction is confirmed
  useEffect(() => {
    const addToDatabase = async () => {
      if (isConfirmed && hash && address && potDetails?.entryAmount) {
        await addParticipant(contractAddress, address, potDetails.entryAmount, hash);
      }
    };
    addToDatabase();
  }, [isConfirmed, hash, address, potDetails?.entryAmount, contractAddress]);

  // Handle making prediction
  const handleMakePrediction = async () => {
    if (!prediction || !address) return;

    try {
      await makePrediction(contractAddress, address, prediction, predictionDate);
      
      // Refresh user prediction
      const userPred = await getUserPrediction(contractAddress, address, predictionDate);
      setUserPrediction(userPred);
      
      alert('Prediction saved successfully!');
    } catch (error) {
      console.error('Error making prediction:', error);
      alert('Failed to save prediction');
    }
  };

  // Handle setting outcome (creator only)
  const handleSetOutcome = async () => {
    if (!address || !isCreator) return;

    try {
      const result = await setPotOutcome(contractAddress, address, predictionDate, outcomeToSet);
      
      if (result.success) {
        alert(`Outcome set! ${result.totalWinners} winners, ${result.totalLosers} losers`);
        // Refresh stats
        const stats = await getPotStats(contractAddress, address);
        if (stats.success) {
          setPotStats(stats.stats);
        }
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error setting outcome:', error);
      alert('Failed to set outcome');
    }
  };

  // Handle updating entry amount (creator only)
  const handleUpdateEntryAmount = async () => {
    if (!address || !isCreator || !newEntryAmount) return;

    try {
      const amount = Math.floor(parseFloat(newEntryAmount) * 1_000_000); // Convert to USDC micros
      const result = await updatePotEntryAmount(contractAddress, address, amount);
      
      if (result.success) {
        alert('Entry amount updated successfully!');
        // Refresh pot details
        const details = await getPotDetails(contractAddress);
        setPotDetails(details);
        setNewEntryAmount('');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating entry amount:', error);
      alert('Failed to update entry amount');
    }
  };

  // Handle closing pot entries
  const handleClosePot = async () => {
    if (!address || !isCreator) return;

    try {
      writeContract({
        address: contractAddress as `0x${string}`,
        abi: PRIVATE_POT_ABI,
        functionName: 'closePot',
        args: [],
      });
    } catch (error) {
      console.error('Error closing pot:', error);
    }
  };

  const formatUSDC = (amount: bigint | undefined) => {
    if (!amount) return '0.00';
    return (Number(amount) / 1_000_000).toFixed(2);
  };

  const isApprovalNeeded = () => {
    if (!entryAmount || !usdcAllowance) return false;
    const amount = Math.floor(parseFloat(entryAmount) * 1_000_000);
    return Number(usdcAllowance) < amount;
  };

  const potStateNames = ['Active', 'Closed', 'Distributed'];

  if (!potDetails) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading pot details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 font-light transition-colors"
          >
            ← Back to Create Pot
          </button>
          
          <div className="flex justify-between items-start">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-light text-black mb-4">{potDetails.potName}</h1>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">{potDetails.description}</p>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-gray-50 border border-gray-200">
                  <div className="text-2xl font-light text-black">{potStateNames[Number(potState) || 0]}</div>
                  <div className="text-sm text-gray-500">Status</div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200">
                  <div className="text-2xl font-light text-black">{formatUSDC(potBalance)}</div>
                  <div className="text-sm text-gray-500">USDC Balance</div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200">
                  <div className="text-2xl font-light text-black">{potParticipants?.length || 0}</div>
                  <div className="text-sm text-gray-500">Participants</div>
                </div>
              </div>
            </div>
            
            {isCreator && (
              <button
                onClick={() => setShowCreatorPanel(!showCreatorPanel)}
                className="bg-black text-white px-6 py-3 rounded-none hover:bg-gray-900 font-light transition-colors"
              >
                {showCreatorPanel ? 'Hide' : 'Show'} Creator Panel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {/* Creator Panel */}
        {isCreator && showCreatorPanel && (
          <div className="bg-white border border-gray-200 rounded-none p-8 mb-6">
            <h2 className="text-2xl font-light text-black mb-6">Creator Panel</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-black mb-3">Entry Amount (USDC)</label>
                <div className="mb-2 p-2 bg-gray-50 border border-gray-200 text-sm text-gray-600">
                  Current: ${(potDetails?.entryAmount / 1_000_000).toFixed(2)}
                </div>
                <input
                  type="text"
                  placeholder="0.01"
                  value={newEntryAmount}
                  onChange={(e) => setNewEntryAmount(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-none focus:border-black focus:outline-none mb-3"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
                <button
                  onClick={handleUpdateEntryAmount}
                  disabled={!newEntryAmount}
                  className="w-full bg-blue-600 text-white py-3 rounded-none hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-light"
                >
                  Update Entry Amount
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-3">Set Outcome for {predictionDate}</label>
                <select
                  value={outcomeToSet}
                  onChange={(e) => setOutcomeToSet(e.target.value as 'positive' | 'negative')}
                  className="w-full p-3 border border-gray-200 rounded-none focus:border-black focus:outline-none"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>
                <button
                  onClick={handleSetOutcome}
                  className="w-full mt-3 bg-black text-white py-3 rounded-none hover:bg-gray-900 transition-colors font-light"
                >
                  Set Outcome
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-3">Pot Management</label>
                <button
                  onClick={handleClosePot}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gray-800 text-white py-3 rounded-none hover:bg-black disabled:bg-gray-400 transition-colors font-light"
                >
                  {isPending || isConfirming ? 'Processing...' : 'Close Pot Entries'}
                </button>
              </div>
            </div>

            {potStats && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-light text-black mb-4">Statistics</h3>
                <div className="grid grid-cols-2 gap-6 text-sm text-gray-600">
                  <div className="text-center p-4 border border-gray-200">
                    <div className="text-2xl font-light text-black">{potStats.totalParticipants}</div>
                    <div>Participants</div>
                  </div>
                  <div className="text-center p-4 border border-gray-200">
                    <div className="text-2xl font-light text-black">{(potStats.totalPotValue / 1_000_000).toFixed(2)}</div>
                    <div>USDC Total</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Interface */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Enter Pot */}
          {!userParticipant && potState === 0 && (
            <div className="bg-white border border-gray-200 rounded-none p-8">
              <h2 className="text-2xl font-light text-black mb-6">Enter Pot</h2>
              
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-black">Entry Amount:</span>
                  <span className="text-2xl font-light text-black">${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Your USDC Balance:</span>
                  <span className="font-medium text-black">{formatUSDC(usdcBalance)} USDC</span>
                </div>
              </div>

              {!usdcApproved ? (
                // STEP 1: FORCE USDC APPROVAL FIRST
                <div>
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200">
                    <h3 className="text-sm font-medium text-black mb-2">⚠️ Step 1: Approve USDC</h3>
                    <p className="text-xs text-orange-700">You must approve USDC spending before entering any pot.</p>
                  </div>

                  <button
                    onClick={handleApprove}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming}
                    className="w-full bg-orange-600 text-white py-4 rounded-none hover:bg-orange-700 disabled:bg-gray-400 transition-colors font-light text-lg"
                  >
                    {isPending || isConfirming ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Approving USDC...
                      </div>
                    ) : (
                      'Approve USDC Spending'
                    )}
                  </button>

                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-xs text-gray-600 text-center">
                    This is a one-time approval that allows the contract to spend your USDC
                  </div>
                </div>
              ) : (
                // STEP 2: ENTER POT (ONLY AFTER APPROVAL)
                <div>
                  <div className="mb-6 p-4 bg-green-50 border border-green-200">
                    <h3 className="text-sm font-medium text-black mb-2">✅ Step 2: Enter Pot</h3>
                    <p className="text-xs text-green-700">USDC approved! Now you can enter the pot.</p>
                  </div>

                  <button
                    onClick={handleEnterPot}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming}
                    className="w-full bg-black text-white py-4 rounded-none hover:bg-gray-900 disabled:bg-gray-400 transition-colors font-light text-lg"
                  >
                    {isPending || isConfirming ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entering Pot...
                      </div>
                    ) : (
                      `Pay ${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC to Enter`
                    )}
                  </button>

                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-xs text-gray-600 text-center">
                    This will transfer ${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC to the pot
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Make Prediction */}
          {userParticipant && (
            <div className="bg-white border border-gray-200 rounded-none p-8">
              <h2 className="text-2xl font-light text-black mb-6">Make Prediction</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-3">Prediction Date</label>
                <input
                  type="date"
                  value={predictionDate}
                  onChange={(e) => setPredictionDate(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-none focus:border-black focus:outline-none text-lg"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>

              {userPrediction && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-600">Current prediction: <span className="font-medium text-black">{userPrediction.prediction}</span></p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setPrediction('positive')}
                  className={`py-4 rounded-none transition-colors font-light text-lg ${
                    prediction === 'positive' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black border border-gray-200 hover:border-black'
                  }`}
                >
                  Positive
                </button>
                <button
                  onClick={() => setPrediction('negative')}
                  className={`py-4 rounded-none transition-colors font-light text-lg ${
                    prediction === 'negative' 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black border border-gray-200 hover:border-black'
                  }`}
                >
                  Negative
                </button>
              </div>

              <button
                onClick={handleMakePrediction}
                disabled={!prediction}
                className="w-full bg-black text-white py-4 rounded-none hover:bg-gray-900 disabled:bg-gray-400 transition-colors font-light text-lg"
              >
                {userPrediction ? 'Update Prediction' : 'Make Prediction'}
              </button>
            </div>
          )}

          {/* Status */}
          {userParticipant && (
            <div className="bg-white border border-gray-200 rounded-none p-8">
              <h2 className="text-2xl font-light text-black mb-4">You're In!</h2>
              <p className="text-gray-600">You've successfully joined this prediction pot.</p>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">You can now make predictions and compete with other participants.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivatePotInterface;