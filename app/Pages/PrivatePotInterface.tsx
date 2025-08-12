import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
  const [showParticipantsModal, setShowParticipantsModal] = useState(false); // Participants modal state
  const [participantsData, setParticipantsData] = useState<any[]>([]); // Participants with details
  const [loadingParticipants, setLoadingParticipants] = useState(false); // Loading state for participants
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
        console.log('✅ Wallet connected on Private Pot page, checking email...');
        console.log('📧 Hook email collected state:', hookEmailCollected);
        console.log('📧 Dismissal state:', isDismissed);
        
        // First check the hook's state - it's the single source of truth
        if (hookEmailCollected) {
          console.log('📧 Hook says email already collected, not showing modal');
          return;
        }

        if (isDismissed) {
          console.log('📧 Modal was dismissed, not showing modal');
          return;
        }
        
        // Only check database if hook doesn't have email collected info yet
        try {
          const emailExists = await checkEmailExists(address);
          console.log('📧 Database email check result:', emailExists);
          
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
              showAlert('Distribution failed. Please try again.', 'error', 'Distribution Failed');
              setIsLoading(false);
              setLastAction('');
              delete (window as any).pendingWinners;
              return;
            }
          }
        } else if (lastAction === 'distributePotFinal') {
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
      showAlert('Failed to save prediction', 'error', 'Prediction Failed');
    }
  };

  // Handle setting outcome (creator only)
  const handleSetOutcome = async () => {
    if (!address || !isCreator) return;

    try {
      const result = await setPotOutcome(contractAddress, address, predictionDate, outcomeToSet);
      
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
        showAlert('No predictions found for today. Cannot distribute rewards.', 'warning', 'No Predictions');
        return;
      }

      // Filter winners based on the confirmed outcome
      const winners = predictions
        .filter((p: any) => p.prediction === outcome)
        .map((p: any) => p.wallet_address as `0x${string}`);

      if (winners.length === 0) {
        showAlert(`No winners found. All participants predicted ${outcome === 'positive' ? 'negative' : 'positive'}.`, 'info', 'No Winners');
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
      showAlert('Failed to distribute market. Check console for details.', 'error', 'Distribution Failed');
      // Reset loading states on error (EXACTLY like PredictionPotTest)
      setLastAction('');
      setIsLoading(false);
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
                <button
                  onClick={handleParticipantsClick}
                  className="p-3 sm:p-4 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-black transition-colors w-full"
                >
                  <div className="text-lg sm:text-xl lg:text-2xl font-light text-black">{potParticipants?.length || 0}</div>
                  <div className="text-xs sm:text-sm text-gray-500">Participants</div>
                  <div className="text-xs text-blue-600 mt-1">Click to view</div>
                </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-light text-black">Market Participants</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{participantsData.length} participants in this market</p>
              </div>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="text-gray-400 hover:text-black transition-colors p-1 sm:p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              {loadingParticipants ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading participants...</p>
                </div>
              ) : participantsData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-black mb-2">No Participants Yet</h3>
                  <p className="text-gray-500">This market doesn't have any participants yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Desktop Table Header - Hidden on Mobile */}
                  <div className="hidden md:grid md:grid-cols-4 gap-4 pb-3 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wide">
                    <div>Participant</div>
                    <div>Entry Amount</div>
                    <div>Prediction</div>
                    <div>Joined</div>
                  </div>

                  {/* Participants List */}
                  {participantsData.map((participant, index) => (
                    <React.Fragment key={participant.wallet_address}>
                      {/* Mobile Card Layout */}
                      <div className="block md:hidden bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors mb-3">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {participant.email ? participant.email.charAt(0).toUpperCase() : (index + 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-black text-sm mb-1 truncate">
                              {participant.email || `${participant.wallet_address.slice(0, 8)}...${participant.wallet_address.slice(-6)}`}
                            </div>
                            {participant.email && (
                              <div className="text-xs text-gray-500 break-all">
                                {participant.wallet_address.slice(0, 12)}...{participant.wallet_address.slice(-8)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Entry</div>
                            <div className="font-medium text-black">
                              ${(participant.entry_amount / 1_000_000).toFixed(2)}
                              <span className="text-gray-500 text-xs ml-1">USDC</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Prediction</div>
                            {participant.predictionStatus === 'Pending' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pending
                              </span>
                            ) : participant.predictionStatus === 'positive' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                YES
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 font-medium">
                                <TrendingDown className="w-3 h-3 mr-1" />
                                NO
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Joined</div>
                            <div className="text-xs text-gray-600">
                              {new Date(participant.joined_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Table Row */}
                      <div className="hidden md:grid md:grid-cols-4 gap-4 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg">
                        {/* Participant Name/Address */}
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                            {participant.email ? participant.email.charAt(0).toUpperCase() : (index + 1)}
                          </div>
                          <div>
                            <div className="font-medium text-black">
                              {participant.email || `${participant.wallet_address.slice(0, 8)}...${participant.wallet_address.slice(-6)}`}
                            </div>
                            {participant.email && (
                              <div className="text-xs text-gray-500 break-all">
                                {participant.wallet_address.slice(0, 12)}...{participant.wallet_address.slice(-8)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Entry Amount */}
                        <div className="flex items-center">
                          <span className="text-gray-900 font-medium">
                            ${(participant.entry_amount / 1_000_000).toFixed(2)}
                          </span>
                          <span className="text-gray-500 text-sm ml-1">USDC</span>
                        </div>

                        {/* Prediction Status */}
                        <div className="flex items-center">
                          {participant.predictionStatus === 'Pending' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pending
                            </span>
                          ) : participant.predictionStatus === 'positive' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 font-medium">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              YES
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 font-medium">
                              <TrendingDown className="w-3 h-3 mr-1" />
                              NO
                            </span>
                          )}
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center">
                          <span className="text-gray-600 text-sm">
                            {new Date(participant.joined_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  <span className="font-medium text-black">{participantsData.filter(p => p.predictionStatus !== 'Pending').length}</span> 
                  {' '}of {participantsData.length} participants have made predictions
                </div>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="w-full sm:w-auto bg-black text-white px-6 py-2 rounded hover:bg-gray-900 transition-colors text-sm sm:text-base"
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