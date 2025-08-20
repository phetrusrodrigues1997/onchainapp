import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, Settings, Share2, ArrowLeft, CheckCircle2, Clock, Vote, Target, Info } from 'lucide-react';
import { CustomAlert, useCustomAlert } from '../Components/CustomAlert';
import { EmailCollectionModal, useEmailCollection } from '../Components/EmailCollectionModal';
import { checkEmailExists, saveUserEmail, getUserEmail } from '../Database/emailActions';

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
  setPotOutcome,
  getPotStats,
  clearWrongPredictionsForUser,
  getWrongPredictors,
  updatePotEntryAmount,
  updatePotDetails
} from '../Database/ownerActions2';

// Contract ABI for individual pot contracts (clones) - Updated for simplified contract
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
  activeSection?: string;
}

const PrivatePotInterface: React.FC<PrivatePotInterfaceProps> = ({ 
  contractAddress, 
  onBack,
  activeSection = 'PrivatePot' 
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
  const [distributionStep, setDistributionStep] = useState<'ready' | 'confirmed'>('ready'); // Track distribution flow
  const [pendingTransactionType, setPendingTransactionType] = useState<'approval' | 'potEntry' | null>(null); // Track what transaction is pending
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
  
  // Email collection modal
  const emailModalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    showModal: showEmailModal,
    showEmailModal: triggerEmailModal,
    hideEmailModal,
    markEmailCollected,
    setIsEmailCollected,
    isDismissed,
    isEmailCollected: hookEmailCollected
  } = useEmailCollection(address);
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


  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: !!address }, // Only query when address is available
  });

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [address!, contractAddress as `0x${string}`],
    query: { enabled: !!address }, // Only query when address is available
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

  // Email collection logic - trigger 2 seconds after wallet connects
  useEffect(() => {
    const handleEmailCollection = async () => {
      console.log('🔍 PrivatePot Email Debug:', {
        isConnected,
        address,
        activeSection,
        condition: isConnected && address && activeSection === 'privatePot'
      });

      if (isConnected && address && activeSection === 'privatePot') {
        
        
        // First check the hook's state - it's the single source of truth
        if (hookEmailCollected) {
          return;
        }

        if (isDismissed) {
          return;
        }
        
        // Only check database if hook doesn't have email collected info yet
        try {
          const emailExists = await checkEmailExists(address);
          
          if (emailExists) {
            console.log('📧 Database says email exists, updating hook state');
            setIsEmailCollected(true);
            return;
          }
          
          // Clear any existing timer
          if (emailModalRef.current) {
            clearTimeout(emailModalRef.current);
          }
          
          console.log('⏰ Setting 2-second timer for email modal...');
          // Show modal after 2 seconds
          emailModalRef.current = setTimeout(() => {
            console.log('🎯 Timer triggered! Showing email modal...');
            triggerEmailModal();
          }, 2000);
        } catch (error) {
          console.error('❌ Error checking email status:', error);
        }
      } else {
        console.log('❌ Conditions not met for email modal');
        // Clear timer if wallet disconnects or user leaves page
        if (emailModalRef.current) {
          clearTimeout(emailModalRef.current);
          emailModalRef.current = null;
        }
      }
    };

    handleEmailCollection();
    
    return () => {
      if (emailModalRef.current) {
        clearTimeout(emailModalRef.current);
      }
    };
  }, [isConnected, address, activeSection, triggerEmailModal, setIsEmailCollected, isDismissed, hookEmailCollected]);

  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    if (!address) return;
    
    try {
      const result = await saveUserEmail(address, email, 'PrivatePot');
      if (result.success) {
        console.log('📧 Email saved successfully, marking as collected in hook...');
        markEmailCollected(); // This should be the single source of truth
        console.log('📧 Hook state updated with markEmailCollected()');
      } else {
        throw new Error(result.error || 'Failed to save email');
      }
    } catch (error) {
      console.error('Email submission error:', error);
      throw error;
    }
  };

  // Simplified approval check
  const isApprovalNeeded = () => {
    if (!potDetails?.entryAmount) return true;
    if (!usdcAllowance) return true;
    // Simple comparison - if allowance is less than needed, approve
    return Number(usdcAllowance) < potDetails.entryAmount;
  };

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
      
      // Handle USDC approval confirmation - refresh contract data so UI updates
      if (pendingTransactionType === 'approval') {
        setTimeout(() => {
          // Force refetch of all contract data (especially USDC allowance)
          queryClient.invalidateQueries({ queryKey: ['readContract'] });
        }, 2000);
      }
      
      // Reset pending transaction type after handling
      setPendingTransactionType(null);
    }
  }, [isConfirmed, hash, pendingTransactionType, address, potDetails?.entryAmount, contractAddress, refetchPotBalance, refetchPotParticipants, queryClient]);

  // Auto-set outcome to majority vote if achieved
  useEffect(() => {
    if (outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome) {
      setOutcomeToSet(outcomeVotingStatus.majorityOutcome);
    }
  }, [outcomeVotingStatus]);

  // Simplified pot entry
  const handleEnterPot = async () => {
    if (!potDetails?.entryAmount || !address) return;

    // Simple check - just check database state (more reliable than on-chain)
    if (userParticipant) {
      showAlert('You have already entered this market.', 'warning', 'Already Entered');
      return;
    }

    // Try the transaction - let the contract handle validation
    setPendingTransactionType('potEntry');
    writeContract({
      address: contractAddress as `0x${string}`,
      abi: PRIVATE_POT_ABI,
      functionName: 'enterPot',
      args: [BigInt(potDetails.entryAmount)],
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

  // Handle setting outcome (creator only)
  const handleSetOutcome = async () => {
    if (!address || !isCreator) return;

    try {
      const result = await setPotOutcome(contractAddress, address, predictionDate, outcomeVotingStatus?.majorityOutcome || outcomeToSet);
      
      if (result.success) {
        showAlert(`Outcome set! ${result.totalWinners} winners, ${result.totalLosers} losers`, 'success', 'Outcome Set');
        // Refresh stats
        const stats = await getPotStats(contractAddress, address);
        if (stats.success) {
          setPotStats(stats.stats);
        }
      } else {
        showAlert(result.error || 'Failed to set outcome', 'error', 'Error');
      }
    } catch (error) {
      console.error('Error setting outcome:', error);
      showAlert('Failed to set outcome', 'error', 'Operation Failed');
    }
  };

  // Handle updating entry amount (creator only)
  const handleUpdateEntryAmount = async () => {
    if (!address || !isCreator || !newEntryAmount) return;

    try {
      const amount = Math.floor(parseFloat(newEntryAmount) * 1_000_000); // Convert to USDC micros
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
        showAlert('Market details updated successfully!', 'success', 'Updated!');
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
      showAlert('Failed to update market details', 'error', 'Update Failed');
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
        showAlert('Failed to distribute market. Check console for details.', 'error', 'Distribution Failed');
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
      
      // Fetch emails for participants who have them
      const participantsWithEmails = await Promise.all(
        participants.map(async (participant: any) => {
          const email = await getUserEmail(participant.wallet_address);
          return {
            ...participant,
            email,
            displayName: email || `${participant.wallet_address.slice(0, 6)}...${participant.wallet_address.slice(-4)}`,
            predictionStatus: participant.prediction ? participant.prediction : 'Pending'
          };
        })
      );
      
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

  const formatUSDC = (amount: bigint | undefined) => {
    if (!amount) return '0.00';
    return (Number(amount) / 1_000_000).toFixed(2);
  };

  // Show loading screen for first 2 seconds
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 mx-auto animate-pulse">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Loading Market</h1>
          <div className="flex justify-center space-x-1 mb-4">
            <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-black rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-gray-600">Preparing your prediction market...</p>
        </div>
      </div>
    );
  }

  // Show loading while pot details are being fetched
  if (isPotLoading && !isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Market Not Found</h2>
          <p className="text-gray-600 mb-6">
            This prediction market doesn't exist or hasn't been registered in our system yet.
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
            Back to Markets
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
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Entry Amount Update */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Entry Fee (USDC)</label>
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

              {/* Outcome Setting */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">Set Outcome</label>
                  {outcomeVotingStatus?.majorityAchieved && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Majority: {outcomeVotingStatus.majorityOutcome?.toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Show outcome voting results */}
                {outcomeVotingStatus && outcomeVotingStatus.totalOutcomeVotes > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="text-sm text-gray-600 mb-2">Participant Votes:</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-700">
                        YES: {outcomeVotingStatus.positiveVotes} votes
                      </span>
                      <span className="text-red-700">
                        NO: {outcomeVotingStatus.negativeVotes} votes
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Required for majority: {outcomeVotingStatus.requiredVotes} votes
                    </div>
                  </div>
                )}
                
                <select
                  value={outcomeToSet}
                  onChange={(e) => setOutcomeToSet(e.target.value as 'positive' | 'negative')}
                  className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  disabled={outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome !== outcomeToSet}
                >
                  <option value="positive" disabled={outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome !== 'positive'}>
                    Positive {outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome === 'positive' ? '(Majority Vote)' : ''}
                  </option>
                  <option value="negative" disabled={outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome !== 'negative'}>
                    Negative {outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome === 'negative' ? '(Majority Vote)' : ''}
                  </option>
                </select>
                
                {outcomeVotingStatus?.majorityAchieved && outcomeVotingStatus.majorityOutcome !== outcomeToSet && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    You can only set the outcome that achieved majority vote from participants.
                  </p>
                )}
                
                {/* Auto-set outcome to majority if achieved */}
                {outcomeVotingStatus?.majorityAchieved && (
                  <div className="text-xs text-green-600">
                    ✓ Participants voted for {outcomeVotingStatus.majorityOutcome?.toUpperCase()} outcome
                  </div>
                )}
                <button
                  onClick={handleSetOutcome}
                  className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 font-medium transition-colors"
                >
                  Set Outcome
                </button>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Market Status</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Accepting Entries:</span>
                  <span className={isAcceptingEntries ? 'text-green-600' : 'text-red-600'}>
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Enter Market</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Entry Amount:</span>
                  <span className="text-xl font-bold text-gray-900">${(potDetails?.entryAmount / 1_000_000).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-medium text-gray-900">{formatUSDC(usdcBalance)} USDC</span>
                </div>
              </div>

              {isApprovalNeeded() ? (
                <div>
                  <button
                    onClick={handleApprove}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium"
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
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    One-time approval to allow the contract to spend your USDC
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">USDC approved! Ready to enter market.</span>
                    </div>
                  </div>
                  <button
                    onClick={handleEnterPot}
                    disabled={!potDetails?.entryAmount || isPending || isConfirming || userParticipant}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    {userParticipant ? (
                      'Already Entered'
                    ) : isPending || isConfirming ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entering Market...
                      </div>
                    ) : (
                      'Enter Market'
                    )}
                  </button>
                </div>
              )}
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
                      className="group bg-red-50 border-2 border-red-200 hover:border-red-400 hover:bg-red-100 rounded-xl p-6 sm:p-8 transition-all duration-200 text-center transform hover:scale-105 hover:-translate-y-1 shadow-sm hover:shadow-lg"
                    >
                      <TrendingDown className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                      <span className="text-xl sm:text-2xl font-bold text-red-800">NO</span>
                      <p className="text-xs sm:text-sm text-red-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <p className="text-gray-600 text-sm sm:text-base">What outcome do you think this market should have?</p>
              </div>

              {/* Outcome Voting Progress */}
              <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-800">{outcomeVotingStatus.positiveVotes}</div>
                    <div className="text-sm text-green-600">YES Votes</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-800">{outcomeVotingStatus.negativeVotes}</div>
                    <div className="text-sm text-red-600">NO Votes</div>
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
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium transition-colors"
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
                        className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105 disabled:hover:scale-100"
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
                      Your vote helps determine the final outcome of this market
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
      
      {/* Email Collection Modal */}
      <EmailCollectionModal
        isOpen={showEmailModal}
        onClose={hideEmailModal}
        onSubmit={handleEmailSubmit}
        sourcePage="PrivatePot"
      />

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Market Participants</h2>
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
                  <p className="text-gray-500">This market doesn't have any participants yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participantsData.map((participant, index) => (
                    <div key={participant.wallet_address} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-medium">
                            {participant.email ? participant.email.charAt(0).toUpperCase() : (index + 1)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {participant.email || `${participant.wallet_address.slice(0, 8)}...${participant.wallet_address.slice(-6)}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              ${(participant.entry_amount / 1_000_000).toFixed(2)} USDC • {new Date(participant.joined_at).toLocaleDateString()}
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
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 text-red-800">
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