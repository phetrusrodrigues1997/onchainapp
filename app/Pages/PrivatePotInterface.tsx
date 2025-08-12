import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';

// Import new private pot database functions
import { 
  getPotDetails,
  makePrediction,
  getUserPrediction,
  addParticipant,
  isParticipant,
  getParticipants,
  getPredictionsForDate,
  cleanupPotTables
} from '../Database/actions2';

import {
  setPotOutcome,
  closePotEntries,
  getPotStats,
  clearWrongPredictionsForUser,
  getWrongPredictors,
  updatePotEntryAmount,
  updatePotDetails
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
  const [pendingTransactionType, setPendingTransactionType] = useState<'approval' | 'potEntry' | null>(null); // Track what transaction is pending
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Loading screen state
  const [isLoading, setIsLoading] = useState(false); // Transaction loading state
  const [isPotLoading, setIsPotLoading] = useState(true); // Pot details loading state
  const [lastAction, setLastAction] = useState(''); // Track transaction types
  const [shareUrlCopied, setShareUrlCopied] = useState(false); // Track if share URL was copied
  const [isEditingDetails, setIsEditingDetails] = useState(false); // Edit mode for pot details
  const [editingPotName, setEditingPotName] = useState(''); // Editing pot name
  const [editingDescription, setEditingDescription] = useState(''); // Editing description

  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Contract read hooks
  const { data: potBalance, refetch: refetchPotBalance } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'getBalance',
  });

  const { data: potParticipants, refetch: refetchPotParticipants } = useReadContract({
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

  // Initial loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000); // 2 seconds loading screen

    return () => clearTimeout(timer);
  }, []);

  // Load pot details and user data
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading pot details for address:', contractAddress);
      setIsPotLoading(true);

      // Get pot details from database (this works without wallet connection)
      const details = await getPotDetails(contractAddress);
      console.log('Pot details result:', details);
      setPotDetails(details);
      setIsPotLoading(false);

      // Only load user-specific data if wallet is connected
      if (details && address) {
        // Check if user is the creator
        setIsCreator(details.creatorAddress.toLowerCase() === address.toLowerCase());
        
        // If creator, load stats
        if (details.creatorAddress.toLowerCase() === address.toLowerCase()) {
          const stats = await getPotStats(contractAddress, address);
          if (stats.success) {
            setPotStats(stats.stats);
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
      } else if (!details) {
        console.error('Pot not found in database for address:', contractAddress);
      }
    };

    loadData();
  }, [address, contractAddress, isConfirmed]);

  // Handle USDC approval - approve a large amount to avoid repeated approvals
  const handleApprove = () => {
    if (!potDetails?.entryAmount || !address) return;

    // Approve a large amount (1000 USDC) so users don't need to approve every time
    const largeApprovalAmount = BigInt(1000 * 1_000_000); // 1000 USDC in micros
    
    setPendingTransactionType('approval'); // Mark that we're doing an approval
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [contractAddress as `0x${string}`, largeApprovalAmount],
    });
  };

  // Track when transactions are confirmed
  useEffect(() => {
    if (isConfirmed && hash && pendingTransactionType) {
      if (pendingTransactionType === 'approval') {
        setUsdcApproved(true);
      }
      // Reset pending transaction type after confirmation
      setPendingTransactionType(null);
    }
  }, [isConfirmed, hash, pendingTransactionType]);

  // Handle pot entry
  const handleEnterPot = async () => {
    if (!potDetails?.entryAmount || !address) return;

    try {
      setPendingTransactionType('potEntry'); // Mark that we're doing a pot entry
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

  // Add participant to database when POT ENTRY transaction is confirmed
  useEffect(() => {
    const addToDatabase = async () => {
      // Only add to database if this is a pot entry transaction (not approval)
      if (isConfirmed && hash && address && potDetails?.entryAmount && pendingTransactionType === 'potEntry') {
        await addParticipant(contractAddress, address, potDetails.entryAmount, hash);
        
        // Refresh pot balance and participants after 3 seconds to allow blockchain to settle
        setTimeout(() => {
          refetchPotBalance();
          refetchPotParticipants();
        }, 3000);
      }
    };
    addToDatabase();
  }, [isConfirmed, hash, address, potDetails?.entryAmount, contractAddress, pendingTransactionType, refetchPotBalance, refetchPotParticipants]);

  // Handle transaction confirmations (like PredictionPotTest)
  useEffect(() => {
    const handleConfirmation = async () => {
      if (isConfirmed && lastAction) {
        if (lastAction === 'distributePot') {
          // Check if we have pending winners to distribute to
          const pendingWinners = (window as any).pendingWinners;
          
          if (pendingWinners && pendingWinners.length > 0) {
            try {
              // Step 2: Now distribute the pot (no alert)
              await writeContract({
                address: contractAddress as `0x${string}`,
                abi: PRIVATE_POT_ABI,
                functionName: 'distributePot',
                args: [pendingWinners],
              });
              
              // Clear pending winners
              delete (window as any).pendingWinners;
              
              // Keep loading state - will be cleared when distribution confirms
              setLastAction('distributePotFinal');
              return; // Don't clear loading state yet
              
            } catch (error) {
              console.error('Distribution failed:', error);
              alert('Distribution failed. Please try again.');
              setIsLoading(false);
              setLastAction('');
              delete (window as any).pendingWinners;
              return;
            }
          }
        } else if (lastAction === 'distributePotFinal') {
          setIsLoading(false);
          alert('🎉 Rewards distributed successfully!');
          
          // Clean up all database tables for this completed pot
          const cleanup = async () => {
            try {
              const result = await cleanupPotTables(contractAddress);
              if (result.success) {
                console.log('Pot tables cleaned up successfully');
              } else {
                console.warn('Failed to clean up pot tables:', result.error);
              }
            } catch (error) {
              console.warn('Error during pot cleanup:', error);
            }
          };
          
          setTimeout(() => {
            // Force refetch of all contract data
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
            // Clean up database tables
            cleanup();
          }, 1000);
        }
        setLastAction('');
      }
    };
    
    handleConfirmation();
  }, [isConfirmed, lastAction, queryClient, writeContract, contractAddress]);

  // Reset loading state if transaction fails
  useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed && lastAction) {
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          setLastAction('');
        }
      }, 3000);
    }
  }, [isPending, isConfirming, isConfirmed, lastAction, isLoading]);

  // Handle making prediction directly
  const handleMakePrediction = async (predictionType: 'positive' | 'negative') => {
    if (!address) return;

    try {
      await makePrediction(contractAddress, address, predictionType, predictionDate);
      
      // Refresh user prediction
      const userPred = await getUserPrediction(contractAddress, address, predictionDate);
      setUserPrediction(userPred);
      
      // alert('Prediction saved successfully!');
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

  // Handle updating pot details (creator only)
  const handleUpdatePotDetails = async () => {
    if (!address || !isCreator || (!editingPotName.trim() && !editingDescription.trim())) return;

    try {
      const updates: { potName?: string; description?: string } = {};
      if (editingPotName.trim()) updates.potName = editingPotName.trim();
      if (editingDescription.trim()) updates.description = editingDescription.trim();

      const result = await updatePotDetails(contractAddress, address, updates);
      
      if (result.success) {
        alert('Market details updated successfully!');
        // Refresh pot details
        const details = await getPotDetails(contractAddress);
        setPotDetails(details);
        setIsEditingDetails(false);
        setEditingPotName('');
        setEditingDescription('');
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error updating pot details:', error);
      alert('Failed to update market details');
    }
  };

  // Start editing mode
  const startEditingDetails = () => {
    setEditingPotName(potDetails?.potName || '');
    setEditingDescription(potDetails?.description || '');
    setIsEditingDetails(true);
  };

  // Cancel editing mode
  const cancelEditingDetails = () => {
    setIsEditingDetails(false);
    setEditingPotName('');
    setEditingDescription('');
  };

  

  // Handle distributing pot to winners (matching PredictionPotTest pattern)
  const handleDistributePot = async () => {
    if (!address || !isCreator) return;

    try {
      // First, ask creator to confirm the winning outcome
      const outcome = window.confirm(
        `Click OK if POSITIVE predictions won, or CANCEL if NEGATIVE predictions won.`
      ) ? 'positive' : 'negative';

      // Get all predictions for today
      const predictions = await getPredictionsForDate(contractAddress, predictionDate);
      
      if (!predictions || predictions.length === 0) {
        alert('No predictions found for today. Cannot distribute rewards.');
        return;
      }

      // Filter winners based on the confirmed outcome
      const winners = predictions
        .filter((p: any) => p.prediction === outcome)
        .map((p: any) => p.wallet_address as `0x${string}`);

      if (winners.length === 0) {
        alert(`No winners found. All participants predicted ${outcome === 'positive' ? 'negative' : 'positive'}.`);
        return;
      }

      // Single confirmation with all details
      const confirmed = window.confirm(
        `Distribute rewards?\n\n` +
        `• Outcome: ${outcome.toUpperCase()} predictions won\n` +
        `• Winners: ${winners.length} participants\n` +
        `• Reward per winner: ${(Number(potBalance) / 1_000_000 / winners.length).toFixed(4)} USDC\n\n` +
        `This will close the market and distribute rewards automatically.`
      );

      if (!confirmed) return;

      // Set loading states
      setIsLoading(true);
      setLastAction('distributePot');
      
      // Step 1: Close the pot first (required by contract)
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PRIVATE_POT_ABI,
        functionName: 'closePot',
        args: [],
      });

      // Store winners for the next step
      (window as any).pendingWinners = winners;
    } catch (error) {
      console.error('Error distributing pot:', error);
      alert('Failed to distribute market. Check console for details.');
      // Reset loading states on error (EXACTLY like PredictionPotTest)
      setLastAction('');
      setIsLoading(false);
    }
  };

  // Generate shareable URL for this pot
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?market=${contractAddress}`;
  };

  // Copy share URL to clipboard
  const copyShareUrl = async () => {
    try {
      const shareUrl = generateShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    }
  };

  const formatUSDC = (amount: bigint | undefined) => {
    if (!amount) return '0.00';
    return (Number(amount) / 1_000_000).toFixed(2);
  };

  // const isApprovalNeeded = () => {
  //   if (!entryAmount || !usdcAllowance) return false;
  //   const amount = Math.floor(parseFloat(entryAmount) * 1_000_000);
  //   return Number(usdcAllowance) < amount;
  // };

  const potStateNames = ['Active', 'Closed', 'Distributed'];

  // Show loading screen for first 2 seconds
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-invisible p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/10 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 animate-pulse"></div>
            </div>
            
            <div className="relative z-10">
              {/* Spinning icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-900/25 animate-spin">
                <span className="text-3xl font-black text-white drop-shadow-lg">🎯</span>
              </div>
              
              <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                Loading Private Market
              </h1>
              
              {/* Loading dots animation */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce delay-200"></div>
              </div>
              
              <p className="text-gray-600 text-sm">
                Preparing your prediction market...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while pot details are being fetched
  if (isPotLoading && !isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading market details...</p>
        </div>
      </div>
    );
  }

  // Show error if pot doesn't exist after loading attempt
  if (!potDetails && !isPotLoading && !isInitialLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-black mb-4">Market Not Found</h2>
          <p className="text-gray-600 mb-6">
            This prediction market doesn't exist or hasn't been registered in our system yet.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Contract Address:</p>
            <code className="block text-xs bg-gray-100 p-2 rounded break-all">{contractAddress}</code>
          </div>
          <button
            onClick={onBack}
            className="mt-6 bg-black text-white px-6 py-3 rounded hover:bg-gray-900 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-black mb-4 sm:mb-6 flex items-center gap-2 font-light transition-colors"
          >
            ← Back to Private Markets
          </button>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="max-w-3xl flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-light text-black mb-3 sm:mb-4">{potDetails.potName}</h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4 sm:mb-6 leading-relaxed">{potDetails.description}</p>
              <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
                <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-light text-black">{potStateNames[Number(potState) || 0]}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Status</div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-light text-black">{formatUSDC(potBalance)}</div>
                  <div className="text-xs sm:text-sm text-gray-500">USDC Balance</div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-light text-black">{potParticipants?.length || 0}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Participants</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-3 w-full lg:w-auto">
              <button
                onClick={copyShareUrl}
                className="bg-gray-100 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-none hover:bg-gray-200 font-light transition-colors text-sm sm:text-base w-full lg:w-auto flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                {shareUrlCopied ? 'Copied!' : 'Share'}
              </button>
              {isCreator && (
                <button
                  onClick={() => setShowCreatorPanel(!showCreatorPanel)}
                  className="bg-black text-white px-4 sm:px-6 py-2 sm:py-3 rounded-none hover:bg-gray-900 font-light transition-colors text-sm sm:text-base w-full lg:w-auto"
                >
                  {showCreatorPanel ? 'Hide' : 'Settings ⚙'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Creator Panel */}
        {isCreator && showCreatorPanel && (
          <div className="bg-white border border-gray-200 rounded-none p-4 sm:p-8 mb-6">
            <h2 className="text-xl sm:text-2xl font-light text-black mb-4 sm:mb-6">Creator Panel</h2>
            
            {/* Edit Pot Details Section */}
            <div className="bg-gray-50 border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-medium text-black">Market Details</h3>
                {!isEditingDetails ? (
                  <button
                    onClick={startEditingDetails}
                    className="text-black hover:text-gray-700 transition-colors font-light text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEditingDetails}
                      className="text-gray-600 hover:text-black transition-colors font-light text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdatePotDetails}
                      className="bg-black text-white px-3 py-1 rounded-none hover:bg-gray-900 transition-colors font-light text-sm"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
              
              {!isEditingDetails ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Market Name</label>
                    <p className="text-sm text-black">{potDetails?.potName}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <p className="text-sm text-black">{potDetails?.description}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Market Name</label>
                    <input
                      type="text"
                      value={editingPotName}
                      onChange={(e) => setEditingPotName(e.target.value)}
                      placeholder="Enter market name"
                      className="w-full p-2 border border-gray-200 rounded-none focus:border-black focus:outline-none text-sm"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Description</label>
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      placeholder="Enter market description"
                      rows={3}
                      className="w-full p-2 border border-gray-200 rounded-none focus:border-black focus:outline-none text-sm resize-none"
                      style={{ color: '#000000', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
              )}
            </div>


            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2 sm:mb-3">Entry Amount (USDC)</label>
                {/* <div className="mb-2 p-2 bg-transparent text-sm text-gray-600">
                  Current: ${(potDetails?.entryAmount / 1_000_000).toFixed(2)}
                </div> */}
                <input
                  type="text"
                  placeholder="0.01"
                  value={newEntryAmount}
                  onChange={(e) => setNewEntryAmount(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-none focus:border-black focus:outline-none mb-2 sm:mb-3 text-sm sm:text-base"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
                <button
                  onClick={handleUpdateEntryAmount}
                  disabled={!newEntryAmount}
                  className="w-full bg-blue-600 text-white py-2 sm:py-3 rounded-none hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-light text-sm sm:text-base"
                >
                  Update Entry Amount
                </button>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-black mb-2 sm:mb-3">Set Outcome</label>
                <select
                  value={outcomeToSet}
                  onChange={(e) => setOutcomeToSet(e.target.value as 'positive' | 'negative')}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-none focus:border-black focus:outline-none text-sm sm:text-base"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                </select>
                <button
                  onClick={handleSetOutcome}
                  className="w-full mt-2 sm:mt-3 bg-black text-white py-2 sm:py-3 rounded-none hover:bg-gray-900 transition-colors font-light text-sm sm:text-base"
                >
                  Set Outcome
                </button>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-black mb-2 sm:mb-3">Market Management</label>
                <div className="space-y-2 sm:space-y-3">
                  
                  
                  <button
                    onClick={handleDistributePot}
                    disabled={isLoading || isPending || isConfirming}
                    className="w-full bg-green-600 text-white py-2 sm:py-3 rounded-none hover:bg-green-700 disabled:bg-gray-400 transition-colors font-light text-sm sm:text-base"
                  >
                    {(isLoading && lastAction === 'distributePot') || isPending || isConfirming 
                      ? 'Processing Distribution...' 
                      : 'Distribute Rewards to Winners'}
                  </button>
                </div>
              </div>
            </div>

            
          </div>
        )}

        {/* User Interface */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Enter Market */}
          {!userParticipant && potState === 0 && (
            <div className="bg-white border border-gray-200 rounded-none p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-light text-black mb-4 sm:mb-6">Enter Market</h2>
              
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border border-gray-200">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <span className="font-medium text-black text-sm sm:text-base">Entry Amount:</span>
                  <span className="text-lg sm:text-xl lg:text-2xl font-light text-black">${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base">Your USDC Balance:</span>
                  <span className="font-medium text-black text-sm sm:text-base">{formatUSDC(usdcBalance)} USDC</span>
                </div>
              </div>

              {!usdcApproved ? (
                // STEP 1: FORCE USDC APPROVAL FIRST
                <div>
                  {/* <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-orange-50 border border-orange-200">
                    <h3 className="text-xs sm:text-sm font-medium text-black mb-2">⚠️ Step 1: Approve USDC</h3>
                    <p className="text-xs text-orange-700">You must approve USDC spending before entering any pot.</p>
                  </div> */}

                  <button
                    onClick={handleApprove}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming}
                    className="w-full bg-black text-white py-3 sm:py-4 rounded-none hover:bg-orange-700 disabled:bg-gray-400 transition-colors font-light text-base sm:text-lg"
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
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border border-green-200">
                    <h3 className="text-xs sm:text-sm font-medium text-black mb-2">✅ Step 2: Enter Market</h3>
                    <p className="text-xs text-green-700">USDC approved! Now you can enter the market.</p>
                  </div>

                  <button
                    onClick={handleEnterPot}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming}
                    className="w-full bg-black text-white py-3 sm:py-4 rounded-none hover:bg-gray-900 disabled:bg-gray-400 transition-colors font-light text-base sm:text-lg"
                  >
                    {isPending || isConfirming ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entering Market...
                      </div>
                    ) : (
                      `Pay ${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC to Enter`
                    )}
                  </button>

                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 text-xs text-gray-600 text-center">
                    This will transfer ${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC to the market
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Make Prediction */}
          {userParticipant && (
            <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-gray-900/10 relative overflow-hidden">
              {/* Subtle animated background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 animate-pulse"></div>
              </div>
              
              <div className="relative z-10">
                <div className="text-center mb-6 sm:mb-10">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 tracking-tight">Your Call?</h2>
                  {/* <p className="text-gray-600 text-lg mb-4">
                    {new Date(predictionDate).toLocaleDateString()}
                  </p> */}
                  <div className="w-20 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div>
                </div>

                {userPrediction ? (
                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-2xl text-center">
                    <h3 className="text-base sm:text-lg font-bold text-green-800 mb-2">✅ Prediction Submitted</h3>
                    <p className="text-sm sm:text-base text-green-700">You predicted: <span className="font-black">{userPrediction.prediction === 'positive' ? 'YES' : 'NO'}</span></p>
                    <p className="text-xs sm:text-sm text-green-600 mt-1">Your prediction has been recorded.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Premium Positive Button */}
                    <button
                      onClick={() => handleMakePrediction('positive')}
                      className="group relative bg-gradient-to-br from-gray-900 via-gray-800 to-black hover:from-gray-800 hover:via-gray-700 hover:to-gray-900 text-white p-4 sm:p-6 lg:p-10 rounded-3xl font-black text-lg sm:text-xl lg:text-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-3xl shadow-gray-900/25 overflow-hidden"
                    >
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="p-2 sm:p-3 bg-white/10 rounded-2xl mb-3 sm:mb-4 lg:mb-6 backdrop-blur-sm flex items-center justify-center">
                          <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="tracking-wide">YES</div>
                      </div>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-gray-900 to-black opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
                    </button>

                    {/* Premium Negative Button */}
                    <button
                      onClick={() => handleMakePrediction('negative')}
                      className="group relative bg-gradient-to-br from-white via-gray-50 to-gray-100 hover:from-gray-50 hover:via-gray-100 hover:to-gray-200 border-2 border-gray-200 hover:border-gray-300 text-gray-900 p-4 sm:p-6 lg:p-10 rounded-3xl font-black text-lg sm:text-xl lg:text-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-3xl shadow-gray-900/10 overflow-hidden"
                    >
                      {/* Subtle pattern overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="p-2 sm:p-3 bg-gray-900/10 rounded-2xl mb-3 sm:mb-4 lg:mb-6 backdrop-blur-sm flex items-center justify-center">
                          <TrendingDown className="w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="tracking-wide">NO</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status */}
          {userParticipant && (
            <div className="bg-white border border-gray-200 rounded-none p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-light text-black mb-3 sm:mb-4">You're In!</h2>
              <p className="text-sm sm:text-base text-gray-600">You've successfully joined this prediction market.</p>
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-xs sm:text-sm text-gray-500">You can now make predictions and compete with other participants.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivatePotInterface;