import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseEther } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { getPrice } from '../Constants/getPrice';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Settings, Share2, ArrowLeft, CheckCircle2, Clock, Vote, Target, Info } from 'lucide-react';
import { CustomAlert, useCustomAlert } from '../Components/CustomAlert';
import LoadingScreen from '../Components/LoadingScreen';

// Import new private pot database functions
import { 
  getPotDetails,
  makePrediction,
  getUserPrediction,
  addParticipant,
  isParticipant,
  getParticipants,
  getParticipantsWithDetails,
  getPredictionsForDate,
  cleanupPotTables,
  castOutcomeVote,
  getOutcomeVotingStatus,
  hasUserVotedOutcome
} from '../Database/actions2';

import {
  getPotStats,
  clearWrongPredictionsForUser,
  getWrongPredictors,
  updatePotEntryAmount,
  updatePotDetails
} from '../Database/ownerActions2';

// Contract ABI for individual pot contracts (clones) - Updated for ETH-based contract
const PRIVATE_POT_ABI = [
  {
    "inputs": [],
    "name": "enterPot",
    "outputs": [],
    "stateMutability": "payable",
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
    "name": "markDistributionComplete",
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
    "name": "distributionCompleted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isAcceptingEntries",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStatus",
    "outputs": [
      {"internalType": "bool", "name": "_distributionCompleted", "type": "bool"},
      {"internalType": "uint256", "name": "_balance", "type": "uint256"},
      {"internalType": "uint256", "name": "_participantCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Removed USDC ABI and constants - not needed for ETH-based contract

interface PrivatePotInterfaceProps {
  contractAddress: string;
  onBack: () => void;
  activeSection?: string;
}

const PrivatePotInterface: React.FC<PrivatePotInterfaceProps> = ({ 
  contractAddress, 
  onBack,
  activeSection = 'PrivatePot' 
}) => {
  const [newEntryAmount, setNewEntryAmount] = useState(''); // For creator to set new entry amount in USD
  const [prediction, setPrediction] = useState<'positive' | 'negative' | null>(null);
  const [potDetails, setPotDetails] = useState<any>(null);
  const [userParticipant, setUserParticipant] = useState(false);
  const [userPrediction, setUserPrediction] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [potStats, setPotStats] = useState<any>(null);
  const [showCreatorPanel, setShowCreatorPanel] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  const [predictionDate, setPredictionDate] = useState('');
  const [distributionStep, setDistributionStep] = useState<'ready' | 'confirmed'>('ready'); // Track distribution flow
  const [pendingTransactionType, setPendingTransactionType] = useState<'potEntry' | null>(null); // Track what transaction is pending
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Loading screen state
  const [isLoading, setIsLoading] = useState(false); // Transaction loading state
  const [isPotLoading, setIsPotLoading] = useState(true); // Pot details loading state
  const [lastAction, setLastAction] = useState(''); // Track transaction types
  const [shareUrlCopied, setShareUrlCopied] = useState(false); // Track if share URL was copied
  const [isEditingDetails, setIsEditingDetails] = useState(false); // Edit mode for pot details
  const [editingPotName, setEditingPotName] = useState(''); // Editing pot name
  const [editingDescription, setEditingDescription] = useState(''); // Editing description
  const [showParticipantsModal, setShowParticipantsModal] = useState(false); // Participants modal state
  const [participantsData, setParticipantsData] = useState<any[]>([]); // Participants with details
  const [loadingParticipants, setLoadingParticipants] = useState(false); // Loading state for participants
  const [outcomeVotingStatus, setOutcomeVotingStatus] = useState<any>(null); // Outcome voting status
  const [hasVotedOutcome, setHasVotedOutcome] = useState<any>(null); // Track user's outcome vote
  const [isVotingOutcome, setIsVotingOutcome] = useState(false); // Loading state for outcome voting
  const { alertState, showAlert, closeAlert } = useCustomAlert();
  
  const { address, isConnected } = useAccount();
  
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

  const { data: distributionCompleted } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'distributionCompleted',
  });

  const { data: isAcceptingEntries } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: PRIVATE_POT_ABI,
    functionName: 'isAcceptingEntries',
  });


  // ETH balance is handled by the wallet, no need for separate contract reads

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

        // Load outcome voting status
        const outcomeVotingData = await getOutcomeVotingStatus(contractAddress);
        setOutcomeVotingStatus(outcomeVotingData);

        const userOutcomeVote = await hasUserVotedOutcome(contractAddress, address);
        setHasVotedOutcome(userOutcomeVote);
      } else if (!details) {
        console.error('Pot not found in database for address:', contractAddress);
      }
    };

    loadData();
  }, [address, contractAddress, isConfirmed]);


  // ETH doesn't need approval - functions removed

  // Track when transactions are confirmed and handle database updates
  useEffect(() => {
    if (isConfirmed && hash && pendingTransactionType) {
      // Handle database update for pot entry BEFORE resetting pendingTransactionType
      if (pendingTransactionType === 'potEntry' && address && potDetails?.entryAmount) {
        const addToDatabase = async () => {
          await addParticipant(contractAddress, address, potDetails.entryAmount, hash);
          
          // Refresh pot balance and participants after 4 seconds to allow blockchain to settle
          setTimeout(() => {
            refetchPotBalance();
            refetchPotParticipants();
          }, 4000);
        };
        addToDatabase();
      }
      
      // Handle ETH transaction confirmation - refresh contract data so UI updates
      // Note: ETH doesn't need approval, so no approval handling needed
      
      // Reset pending transaction type after handling
      setPendingTransactionType(null);
    }
  }, [isConfirmed, hash, pendingTransactionType, address, potDetails?.entryAmount, contractAddress, refetchPotBalance, refetchPotParticipants, queryClient]);


  // Simplified pot entry
  const handleEnterPot = async () => {
    if (!potDetails?.entryAmount || !address) return;

    // Simple check - just check database state (more reliable than on-chain)
    if (userParticipant) {
      showAlert('You have already entered this pot.', 'warning', 'Already Entered');
      return;
    }

    // Try the transaction - let the contract handle validation
    setPendingTransactionType('potEntry');
    
    // Convert USD entry amount to ETH (returns bigint)
    // const ethAmount = usdToEth(potDetails.entryAmount);

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: PRIVATE_POT_ABI,
      functionName: 'enterPot',
      args: [], // No args for ETH-based contract
      value: potDetails.entryAmount, // Send ETH as value (bigint)
    });
  };


  // Handle transaction confirmations (simplified for single-step distribution)
  useEffect(() => {
    const handleConfirmation = async () => {
      if (isConfirmed && lastAction === 'distributePot') {
        setIsLoading(false);
        showAlert('🎉 Rewards distributed successfully!', 'success', 'Success!');
        
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
        }, 2000);
        
        setLastAction('');
        // Reset distribution step after successful distribution
        setDistributionStep('ready');
      }
    };
    
    handleConfirmation();
  }, [isConfirmed, lastAction, queryClient, contractAddress]);

  // Reset loading state if transaction fails
  useEffect(() => {
    if (!isPending && !isConfirming && !isConfirmed) {
      // Reset distribution action if it failed
      if (lastAction) {
        setTimeout(() => {
          if (isLoading) {
            setIsLoading(false);
            setLastAction('');
            setDistributionStep('ready'); // Reset distribution step on failure
          }
        }, 3000);
      }
      
      // Reset pending transaction type if it failed
      if (pendingTransactionType) {
        setTimeout(() => {
          setPendingTransactionType(null);
        }, 3000);
      }
    }
  }, [isPending, isConfirming, isConfirmed, lastAction, isLoading, pendingTransactionType]);

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
      showAlert('Failed to save prediction', 'error', 'Prediction Failed');
    }
  };


  // Handle updating entry amount (creator only)
  const handleUpdateEntryAmount = async () => {
    if (!address || !isCreator || !newEntryAmount) return;

    try {
      const amount = parseFloat(newEntryAmount); // Direct USD amount for database
      const result = await updatePotEntryAmount(contractAddress, address, amount);
      
      if (result.success) {
        showAlert('Entry amount updated successfully!', 'success', 'Updated!');
        // Refresh pot details
        const details = await getPotDetails(contractAddress);
        setPotDetails(details);
        setNewEntryAmount('');
      } else {
        showAlert(result.error || 'Operation failed', 'error', 'Error');
      }
    } catch (error) {
      console.error('Error updating entry amount:', error);
      showAlert('Failed to update entry amount', 'error', 'Update Failed');
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
        showAlert('Pot details updated successfully!', 'success', 'Updated!');
        // Refresh pot details
        const details = await getPotDetails(contractAddress);
        setPotDetails(details);
        setIsEditingDetails(false);
        setEditingPotName('');
        setEditingDescription('');
      } else {
        showAlert(result.error || 'Operation failed', 'error', 'Error');
      }
    } catch (error) {
      console.error('Error updating pot details:', error);
      showAlert('Failed to update pot details', 'error', 'Update Failed');
    }
  };


  // Handle outcome voting
  const handleOutcomeVote = async (outcome: 'positive' | 'negative') => {
    if (!address || !userParticipant) return;

    setIsVotingOutcome(true);
    try {
      const result = await castOutcomeVote(contractAddress, address, outcome);
      
      if (result.success) {
        showAlert(`Vote for ${outcome.toUpperCase()} recorded!`, 'success', 'Outcome Vote Recorded');
        
        // Refresh outcome voting status
        const outcomeVotingData = await getOutcomeVotingStatus(contractAddress);
        setOutcomeVotingStatus(outcomeVotingData);
        
        const userOutcomeVote = await hasUserVotedOutcome(contractAddress, address);
        setHasVotedOutcome(userOutcomeVote);
      } else {
        showAlert(result.error || 'Failed to cast outcome vote', 'error', 'Vote Failed');
      }
    } catch (error) {
      console.error('Error casting outcome vote:', error);
      showAlert('Failed to cast outcome vote', 'error', 'Vote Failed');
    }
    setIsVotingOutcome(false);
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

  

  // Handle the two-step distribution process
  const handleDistributePot = async () => {
    if (!address || !isCreator) return;

    // Check if majority outcome vote is achieved before allowing distribution
    if (!outcomeVotingStatus?.majorityAchieved) {
      showAlert(`Cannot distribute yet. Need majority outcome vote. Currently have ${outcomeVotingStatus?.totalOutcomeVotes || 0} votes, need ${outcomeVotingStatus?.requiredVotes || 0} for majority.`, 'warning', 'Outcome Vote Required');
      return;
    }

    if (distributionStep === 'ready') {
      // Step 1: Confirm distribution parameters
      try {
        // Use the majority-voted outcome (more reliable than UI state)
        const outcome = outcomeVotingStatus.majorityOutcome;

        // Get all predictions for today
        const predictions = await getPredictionsForDate(contractAddress, predictionDate);
        
        if (!predictions || predictions.length === 0) {
          showAlert('No predictions found for today. Cannot distribute rewards.', 'warning', 'No Predictions');
          return;
        }

        // Filter winners based on the selected outcome
        const winners = predictions
          .filter((p: any) => p.prediction === outcome)
          .map((p: any) => p.wallet_address as `0x${string}`);

        if (winners.length === 0) {
          showAlert(`No winners found. All participants predicted ${outcome === 'positive' ? 'negative' : 'positive'}.`, 'info', 'No Winners');
          return;
        }

        // Show confirmation and move to step 2
        showAlert(`Ready to distribute to ${winners.length} ${outcome.toUpperCase()} predictors. Click "Distribute" to execute.`, 'success', 'Distribution Ready');
        setDistributionStep('confirmed');

      } catch (error) {
        console.error('Error preparing distribution:', error);
        showAlert('Failed to prepare distribution. Check console for details.', 'error', 'Distribution Failed');
      }
    } else {
      // Step 2: Execute the actual distribution
      try {
        const outcome = outcomeVotingStatus.majorityOutcome;
        const predictions = await getPredictionsForDate(contractAddress, predictionDate);
        
        const winners = predictions
          .filter((p: any) => p.prediction === outcome)
          .map((p: any) => p.wallet_address as `0x${string}`);

        // Set loading states
        setIsLoading(true);
        setLastAction('distributePot');
        
        // Execute distribution
        await writeContract({
          address: contractAddress as `0x${string}`,
          abi: PRIVATE_POT_ABI,
          functionName: 'distributePot',
          args: [winners],
        });

      } catch (error) {
        console.error('Error distributing pot:', error);
        showAlert('Failed to distribute pot. Check console for details.', 'error', 'Distribution Failed');
        // Reset states on error
        setLastAction('');
        setIsLoading(false);
        setDistributionStep('ready');
      }
    }
  };

  // Load participants with their prediction status and emails
  const loadParticipantsData = async () => {
    setLoadingParticipants(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const participants = await getParticipantsWithDetails(contractAddress, today);
      
      // Format participants without email functionality
      const participantsWithEmails = participants.map((participant: any) => {
        return {
          ...participant,
          displayName: `${participant.wallet_address.slice(0, 6)}...${participant.wallet_address.slice(-4)}`,
          predictionStatus: participant.prediction ? participant.prediction : 'Pending'
        };
      });
      
      setParticipantsData(participantsWithEmails);
    } catch (error) {
      console.error('Error loading participants data:', error);
      showAlert('Failed to load participants data', 'error', 'Error');
    }
    setLoadingParticipants(false);
  };

  // Handle clicking on participants count
  const handleParticipantsClick = () => {
    setShowParticipantsModal(true);
    loadParticipantsData();
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

  // Helper functions for ETH and USD conversion
  const formatETH = (amount: bigint | undefined) => {
    if (!amount) return '0.0000';
    return formatUnits(amount, 18);
  };

  const usdToEth = (usdAmount: number): bigint => {
    const fallbackEthPrice = 4700; // Fallback price if ETH price not loaded
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethAmount = usdAmount / currentEthPrice;
    return parseEther(ethAmount.toString());
  };

  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

  const formatUSDC = (amount: bigint | undefined) => {
    if (!amount) return '0.00';
    // If this is ETH amount, convert to USD
    const usdValue = ethToUsd(amount);
    return usdValue.toFixed(2);
  };

  // Show loading screen for first 2 seconds
  if (isInitialLoading) {
    return <LoadingScreen title="Prediwin" subtitle="Preparing your prediction pot..." />;
  }

  // Show loading while pot details are being fetched
  if (isPotLoading && !isInitialLoading) {
    return <LoadingScreen title="Prediwin" subtitle="Loading pot details..." />;
  }

  // Show error if pot doesn't exist after loading attempt
  if (!potDetails && !isPotLoading && !isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pot Not Found</h2>
          <p className="text-gray-600 mb-6">
            This prediction pot doesn't exist or hasn't been registered in our system yet.
          </p>
          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-500">Contract Address:</p>
            <code className="block text-xs bg-gray-100 p-3 rounded-lg break-all font-mono">{contractAddress}</code>
          </div>
          <button
            onClick={onBack}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-black mb-6 flex items-center gap-2 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pots
          </button>
          
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{potDetails.potName}</h1>
              {potDetails?.description && (
                <p className="text-lg text-gray-600 max-w-2xl">{potDetails.description}</p>
              )}
            </div>
            
            {/* Action Buttons */}
            {(userParticipant || isCreator) && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={copyShareUrl}
                  className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  {shareUrlCopied ? 'Copied!' : 'Share'}
                </button>
                {isCreator && (
                  <button
                    onClick={() => setShowCreatorPanel(!showCreatorPanel)}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {showCreatorPanel ? 'Hide' : 'Manage'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Market Stats */}
        {(userParticipant || isCreator) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Prize Pool</p>
                  <p className="text-2xl font-bold text-gray-900">${formatUSDC(potBalance)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{potParticipants?.length || 0}</p>
                </div>
              </div>
              <button
                onClick={handleParticipantsClick}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Details →
              </button>
            </div>
          </div>
        )}

        {/* Creator Panel */}
        {isCreator && showCreatorPanel && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Creator Panel</h2>
            
            {/* Market Details Section */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Pot Details</h3>
                {!isEditingDetails && (
                  <button
                    onClick={startEditingDetails}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Details
                  </button>
                )}
              </div>

              {isEditingDetails ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pot Name</label>
                    <input
                      type="text"
                      value={editingPotName}
                      onChange={(e) => setEditingPotName(e.target.value)}
                      className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter pot name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={editingDescription}
                      onChange={(e) => setEditingDescription(e.target.value)}
                      className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                      rows={3}
                      placeholder="Enter pot description"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdatePotDetails}
                      disabled={!editingPotName.trim() && !editingDescription.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={cancelEditingDetails}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-3">
                    <div className="text-sm text-gray-600 mb-1">Pot Name:</div>
                    <div className="font-medium text-gray-900">{potDetails?.potName || 'Unnamed Pot'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Description:</div>
                    <div className="text-gray-900">{potDetails?.description || 'No description provided'}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Entry Amount Update */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Entry Fee (USD)</label>
                <input
                  type="text"
                  placeholder="Enter new $ amount"
                  value={newEntryAmount}
                  onChange={(e) => setNewEntryAmount(e.target.value)}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button
                  onClick={handleUpdateEntryAmount}
                  disabled={!newEntryAmount}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 font-medium transition-colors"
                >
                  Update Entry Amount
                </button>
              </div>

              {/* Participant Outcome Voting Results - Read Only */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Participant Outcome Voting</label>
                  {outcomeVotingStatus?.majorityAchieved && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Decided: {outcomeVotingStatus.majorityOutcome?.toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Show outcome voting results */}
                {outcomeVotingStatus && outcomeVotingStatus.totalOutcomeVotes > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-3">Current Votes:</div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${outcomeVotingStatus.positiveVotes > outcomeVotingStatus.negativeVotes ? 'text-green-700' : 'text-gray-600'}`}>
                          {outcomeVotingStatus.positiveVotes}
                        </div>
                        <div className="text-xs text-gray-600">YES Votes</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${outcomeVotingStatus.negativeVotes > outcomeVotingStatus.positiveVotes ? 'text-purple-700' : 'text-gray-600'}`}>
                          {outcomeVotingStatus.negativeVotes}
                        </div>
                        <div className="text-xs text-gray-600">NO Votes</div>
                      </div>
                    </div>
                    
                    {outcomeVotingStatus.majorityAchieved ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div className="text-green-800 font-bold text-sm">
                          ✓ Majority Achieved: {outcomeVotingStatus.majorityOutcome?.toUpperCase()}
                        </div>
                        <div className="text-green-700 text-xs mt-1">
                          Ready for distribution
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <div className="text-amber-800 font-bold text-sm">
                          Waiting for Majority Vote
                        </div>
                        <div className="text-amber-700 text-xs mt-1">
                          Need {outcomeVotingStatus.requiredVotes} votes (currently {outcomeVotingStatus.totalOutcomeVotes})
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-gray-600 font-medium text-sm">
                      No outcome votes yet
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Participants will vote on the outcome when ready
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-blue-800 text-xs font-medium">
                    ℹ️ Outcome decided by participant majority vote
                  </div>
                  <div className="text-blue-700 text-xs mt-1">
                    As the pot owner, you can distribute funds once participants reach consensus
                  </div>
                </div>
              </div>
            </div>

            {/* Distribution */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Distribution</h3>
                {outcomeVotingStatus && !outcomeVotingStatus.majorityAchieved && (
                  <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    Need {outcomeVotingStatus.requiredVotes - outcomeVotingStatus.totalOutcomeVotes} more outcome votes
                  </span>
                )}
              </div>
              <button
                onClick={handleDistributePot}
                disabled={isLoading || isPending || isConfirming || !outcomeVotingStatus?.majorityAchieved}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  !outcomeVotingStatus?.majorityAchieved
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : distributionStep === 'ready' 
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {(isLoading && lastAction === 'distributePot') || isPending || isConfirming 
                  ? 'Processing Distribution...' 
                  : !outcomeVotingStatus?.majorityAchieved
                    ? 'Waiting for Outcome Votes'
                    : distributionStep === 'ready'
                      ? 'Begin Distribution'
                      : 'Distribute'}
              </button>
            </div>

            {/* Status Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pot Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Accepting Entries:</span>
                  <span className={isAcceptingEntries ? 'text-green-600' : 'text-purple-700'}>
                    {isAcceptingEntries ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distribution Complete:</span>
                  <span className={distributionCompleted ? 'text-green-600' : 'text-amber-600'}>
                    {distributionCompleted ? 'Yes' : 'No'}
                  </span>
                </div>
                {outcomeVotingStatus && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outcome Votes:</span>
                      <span className="text-gray-900">{outcomeVotingStatus.totalOutcomeVotes} / {outcomeVotingStatus.requiredVotes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Majority Achieved:</span>
                      <span className={outcomeVotingStatus.majorityAchieved ? 'text-green-600' : 'text-amber-600'}>
                        {outcomeVotingStatus.majorityAchieved ? `Yes (${outcomeVotingStatus.majorityOutcome?.toUpperCase()})` : 'No'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Enter Market */}
          {!userParticipant && isAcceptingEntries && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Enter Pot</h2>
              
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">Entry Amount:</span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900 break-all">
                    ${Number(ethToUsd(potDetails?.entryAmount)).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">Payment Method:</span>
                  <span className="text-sm sm:text-base font-medium text-gray-900">ETH (wallet balance)</span>
                </div>
                
                {/* ETH Amount Display */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 pt-2 border-t border-gray-200">
                  <span className="text-xs sm:text-sm text-gray-500">ETH Amount:</span>
                  <span className="text-xs sm:text-sm text-gray-700 font-mono break-all">
                    {formatETH(potDetails?.entryAmount)} ETH
                  </span>
                </div>
              </div>

              <div>
                  <button
                    onClick={handleEnterPot}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming || userParticipant}
                    className="w-full bg-black text-white py-3 sm:py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium text-sm sm:text-base"
                  >
                    {userParticipant ? (
                      'Already Entered'
                    ) : isPending || isConfirming ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm sm:text-base">Entering Pot...</span>
                      </div>
                    ) : (
                      'Enter Pot'
                    )}
                  </button>
                </div>
            </div>
          )}

          {/* Make Prediction - Full Width */}
          {userParticipant && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 lg:col-span-2">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Make Your Prediction</h2>
                <p className="text-gray-600 text-sm sm:text-base">What do you think will happen?</p>
              </div>

              {userPrediction ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 sm:p-8 text-center max-w-md mx-auto">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600 mx-auto mb-3" />
                  <h3 className="text-lg sm:text-xl font-semibold text-green-800 mb-2">Prediction Submitted</h3>
                  <p className="text-green-700 text-sm sm:text-base">You predicted: <span className="font-bold">{userPrediction.prediction === 'positive' ? 'YES' : 'NO'}</span></p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <button
                      onClick={() => handleMakePrediction('positive')}
                      className="group bg-green-50 border-2 border-green-200 hover:border-green-400 hover:bg-green-100 rounded-xl p-6 sm:p-8 transition-all duration-200 text-center transform hover:scale-105 hover:-translate-y-1 shadow-sm hover:shadow-lg"
                    >
                      <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xl sm:text-2xl font-bold text-green-800">YES</span>
                      <p className="text-xs sm:text-sm text-green-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Predict positive outcome
                      </p>
                    </button>
                    
                    <button
                      onClick={() => handleMakePrediction('negative')}
                      className="group bg-purple-100 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-100 rounded-xl p-6 sm:p-8 transition-all duration-200 text-center transform hover:scale-105 hover:-translate-y-1 shadow-sm hover:shadow-lg"
                    >
                      <TrendingDown className="w-10 h-10 sm:w-12 sm:h-12 text-purple-700 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xl sm:text-2xl font-bold text-purple-800">NO</span>
                      <p className="text-xs sm:text-sm text-purple-700 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Predict negative outcome
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outcome Voting Section - Full Width */}
          {userParticipant && outcomeVotingStatus && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 lg:col-span-2">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Vote on Outcome</h2>
                <p className="text-gray-600 text-sm sm:text-base">What outcome do you think this pot should have?</p>
              </div>

              {/* Outcome Voting Progress */}
              <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-800">{outcomeVotingStatus.positiveVotes}</div>
                    <div className="text-sm text-green-600">YES Votes</div>
                  </div>
                  <div className="bg-purple-100 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-800">{outcomeVotingStatus.negativeVotes}</div>
                    <div className="text-sm text-purple-700">NO Votes</div>
                  </div>
                </div>
                
                <div className="text-center text-sm text-gray-600 mb-4">
                  {outcomeVotingStatus.majorityAchieved ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                      ✓ Majority achieved: {outcomeVotingStatus.majorityOutcome?.toUpperCase()}
                    </span>
                  ) : (
                    <span>
                      {outcomeVotingStatus.totalOutcomeVotes} / {outcomeVotingStatus.requiredVotes} votes for majority
                    </span>
                  )}
                </div>
              </div>

              {/* Outcome Vote Buttons */}
              <div className="text-center">
                {hasVotedOutcome ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 sm:p-8 max-w-md mx-auto">
                    <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mx-auto mb-3" />
                    <h3 className="text-lg sm:text-xl font-semibold text-blue-800 mb-2">Outcome Vote Cast</h3>
                    <p className="text-blue-700 text-sm sm:text-base">
                      You voted: <span className="font-bold">{hasVotedOutcome.outcome_vote === 'positive' ? 'YES' : 'NO'}</span>
                    </p>
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => handleOutcomeVote('positive')}
                        disabled={isVotingOutcome}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition-colors"
                      >
                        {isVotingOutcome ? 'Updating...' : 'Change to YES'}
                      </button>
                      <button
                        onClick={() => handleOutcomeVote('negative')}
                        disabled={isVotingOutcome}
                        className="w-full bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 font-medium transition-colors"
                      >
                        {isVotingOutcome ? 'Updating...' : 'Change to NO'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                      <button
                        onClick={() => handleOutcomeVote('positive')}
                        disabled={isVotingOutcome}
                        className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 disabled:hover:scale-100"
                      >
                        {isVotingOutcome ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <TrendingUp className="w-5 h-5" />
                            <span>Vote YES</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleOutcomeVote('negative')}
                        disabled={isVotingOutcome}
                        className="bg-purple-700 text-white px-6 py-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 font-medium transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 disabled:hover:scale-100"
                      >
                        {isVotingOutcome ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <TrendingDown className="w-5 h-5" />
                            <span>Vote NO</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                      Your vote helps determine the final outcome of this pot
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        autoClose={alertState.autoClose}
      />

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Pot Participants</h2>
                <p className="text-sm text-gray-500 mt-1">{participantsData.length} participants</p>
              </div>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingParticipants ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading participants...</p>
                </div>
              ) : participantsData.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h3>
                  <p className="text-gray-500">This pot doesn't have any participants yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participantsData.map((participant, index) => (
                    <div key={participant.wallet_address} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {`${participant.wallet_address.slice(0, 8)}...${participant.wallet_address.slice(-6)}`}
                            </div>
                            
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {participant.predictionStatus === 'Pending' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </span>
                          ) : participant.predictionStatus === 'positive' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              YES
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              NO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">{participantsData.filter(p => p.predictionStatus !== 'Pending').length}</span> 
                  {' '}of {participantsData.length} have made predictions
                </div>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivatePotInterface;