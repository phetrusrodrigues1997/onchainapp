
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import Cookies from 'js-cookie';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { setDailyOutcome, setProvisionalOutcome, getProvisionalOutcome, determineWinners, clearWrongPredictions } from '../Database/OwnerActions'; // Adjust path as needed
import { useQueryClient } from '@tanstack/react-query';
import { 
  recordReferral, 
  confirmReferralPotEntry, 
  getAvailableFreeEntries, 
  consumeFreeEntry, 
  getReEntryFee,
  processReEntry,
  debugWrongPredictions,
  clearWrongPredictionsForWallet
} from '../Database/actions';
import { updateWinnerStats } from '../Database/OwnerActions';
import { EmailCollectionModal, useEmailCollection } from '../Components/EmailCollectionModal';
import { checkEmailExists, saveUserEmail } from '../Database/emailActions';


// Define table identifiers instead of passing table objects
const tableMapping = {
  "0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794": "featured",
  "0xD4B6F1CF1d063b760628952DDf32a44974129697": "crypto",
} as const;

type TableType = typeof tableMapping[keyof typeof tableMapping];
// Updated Contract ABI for PredictionPot (reflecting modified contract)
const PREDICTION_POT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdc", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
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
  
  const [outcomeInput, setOutcomeInput] = useState<string>('');
  const [provisionalOutcomeInput, setProvisionalOutcomeInput] = useState<string>('');
  // Contract addresses
  const [contractAddress, setContractAddress] = useState<string>('');
  const [usdcAddress, setUsdcAddress] = useState<string>('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); 
  

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [winnerAddresses, setWinnerAddresses] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  const [selectedTableType, setSelectedTableType] = useState<TableType>('featured');
  
  // Referral system state (simplified for navigation button)
  const [inputReferralCode, setInputReferralCode] = useState<string>('');
  const [freeEntriesAvailable, setFreeEntriesAvailable] = useState<number>(0);
  const [reEntryFee, setReEntryFee] = useState<number | null>(null);
  const [allReEntryFees, setAllReEntryFees] = useState<{market: string, fee: number}[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  
  // Email collection hook
  const { showModal: showEmailModal, isEmailCollected, showEmailModal: triggerEmailModal, hideEmailModal, markEmailCollected, setIsEmailCollected, isDismissed } = useEmailCollection(address);
  
  // Countdown state for when pot reopens (Sunday)
  const [timeUntilReopening, setTimeUntilReopening] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Pot entry deadline countdown state
  const [timeUntilDeadline, setTimeUntilDeadline] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Track successful pot entry for enhanced UI feedback
  const [justEnteredPot, setJustEnteredPot] = useState(false);
  const [postEntryLoading, setPostEntryLoading] = useState(false);
  const [usedDiscountedEntry, setUsedDiscountedEntry] = useState(false);

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const savedLang = Cookies.get('language');
    if (savedLang && supportedLanguages.some(lang => lang.code === savedLang)) {
      return savedLang as Language;
    }
    return 'en';
  });
  
  // Update cookie when language changes
  useEffect(() => {
    Cookies.set('language', currentLanguage, { sameSite: 'lax' });
  }, [currentLanguage]);
  
  const t = getTranslation(currentLanguage);

 // Add useEffect to handle cookie retrieval
  useEffect(() => {
    const savedContract = Cookies.get('selectedMarket');
    
    // Validate contract address is in our allowed list
    if (savedContract && tableMapping[savedContract as keyof typeof tableMapping]) {
      setContractAddress(savedContract);
      const tableType = tableMapping[savedContract as keyof typeof tableMapping];
      setSelectedTableType(tableType);

    } else {
      // Fallback to default contract if no valid cookie is found
      setContractAddress('0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794');
      setSelectedTableType('featured');
      console.log('No valid contract cookie found, using default');
    }
  }, []);

  // Load referral data when wallet connects or market changes
  useEffect(() => {
    if (address && selectedTableType) {
      loadReferralData();
    }
  }, [address, selectedTableType]);

  // Initial loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000); // 2 seconds loading screen

    return () => clearTimeout(timer);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (isPotEntryBlocked()) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  // Pot entry deadline countdown effect
  useEffect(() => {
    if (!isPotEntryBlocked()) {
      // On Sunday through Friday - show deadline countdown
      updateDeadlineCountdown();
      const interval = setInterval(updateDeadlineCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const loadReferralData = async () => {
    if (!address) return;
    
    try {
      
      
      // Debug wrong predictions tables
      await debugWrongPredictions(address);
      
      // Load available free entries
      const freeEntries = await getAvailableFreeEntries(address);
      setFreeEntriesAvailable(freeEntries);
      
      // Check if user needs to pay re-entry fee for current market
      const reEntryAmount = await getReEntryFee(address, selectedTableType);
      setReEntryFee(reEntryAmount);
      
      // Note: getAllReEntryFees was removed since we now use dynamic pricing
      setAllReEntryFees([]);
      
      
    } catch (error) {
      console.error("Error loading referral data:", error);
    }
  };

  

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

  // Email collection effect - check if user's email exists when wallet connects
  useEffect(() => {
    const checkUserEmail = async () => {
      if (address && !isEmailCollected) {
        try {
          const emailExists = await checkEmailExists(address);
          if (emailExists) {
            markEmailCollected();
          } else {
            // Show email modal after a short delay on first interaction
            setTimeout(() => {
              triggerEmailModal();
            }, 2000);
          }
        } catch (error) {
          console.error('Error checking email:', error);
        }
      }
    };
    
    checkUserEmail();
  }, [address, isEmailCollected, markEmailCollected, triggerEmailModal]);

  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    if (!address) return;
    
    try {
      const result = await saveUserEmail(address, email, 'PredictionPot');
      if (result.success) {
        markEmailCollected();
      } else {
        throw new Error(result.error || 'Failed to save email');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      throw error; // Re-throw so modal can show error
    }
  };

  // Read contract data
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

  // Get current day name
  const getCurrentDayName = (): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };
  
  // Get dynamic entry amount based on day of week
  const getDynamicEntryAmount = (): bigint => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    
    // Dynamic pricing: Sunday 0.01 to Friday 0.06 USDC
    const basePrices = {
      0: 10000, // Sunday: 0.01 USDC
      1: 20000, // Monday: 0.02 USDC  
      2: 30000, // Tuesday: 0.03 USDC
      3: 40000, // Wednesday: 0.04 USDC
      4: 50000, // Thursday: 0.05 USDC
      5: 60000, // Friday: 0.06 USDC
      6: 10000, // Saturday: Closed (fallback to Sunday price)
    };
    
    return BigInt(basePrices[day as keyof typeof basePrices]);
  };
  
  // Current entry amount based on day and free entries
  const baseEntryAmount = getDynamicEntryAmount();
  const entryAmount = freeEntriesAvailable > 0 ? BigInt(20000) : baseEntryAmount; // Fixed 0.02 USDC if using free entry, otherwise daily price

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

  // Debug logging for participant status
  useEffect(() => {
    if (address && participants) {
      console.log('🔍 Participant Status Debug:', {
        address,
        participants,
        isParticipant,
        participantCount: Array.isArray(participants) ? participants.length : 0,
        justEnteredPot,
        reEntryFee
      });
    }
  }, [address, participants, isParticipant, justEnteredPot, reEntryFee]);

  // Type-safe helpers
  const formatBigIntValue = (value: bigint | undefined, decimals: number = 6): string => {
    if (!value) return '0';
    try {
      return formatUnits(value, decimals);
    } catch {
      return '0';
    }
  };


  // const getParticipantCount = (): number => {
  //   if (!participants || !Array.isArray(participants)) return 0;
  //   return participants.length;
  // };

  // Utility functions for countdown
  const isPotEntryBlocked = (): boolean => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    return day === 6; // Saturday only - pot entry blocked (winner determination day)
  };

  const getNextSundayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilSunday;
    
    if (currentDay === 6) {
      // Saturday - next Sunday is tomorrow
      daysUntilSunday = 1;
    } else {
      // Sunday (0) to Friday (5) - next Sunday
      daysUntilSunday = 7 - currentDay;
    }
    
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setUTCHours(0, 0, 0, 0); // Midnight UTC
    return nextSunday;
  };

  const getNextSaturdayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilSaturday;
    
    if (currentDay === 6) {
      // Saturday - next Saturday (next week)
      daysUntilSaturday = 7;
    } else {
      // Sunday (0) to Friday (5) - this Saturday
      daysUntilSaturday = 6 - currentDay;
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setUTCHours(0, 0, 0, 0); // Midnight UTC
    return nextSaturday;
  };

  const updateCountdown = () => {
    const now = new Date();
    const target = getNextSundayMidnight();
    const difference = target.getTime() - now.getTime();

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeUntilReopening({ days, hours, minutes, seconds });
    } else {
      setTimeUntilReopening({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  const updateDeadlineCountdown = () => {
    const now = new Date();
    const target = getNextSaturdayMidnight();
    const difference = target.getTime() - now.getTime();

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeUntilDeadline({ days, hours, minutes, seconds });
    } else {
      setTimeUntilDeadline({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  const showMessage = (msg: string, isError = false) => {
    setMessage(msg);
    if (!isError) {
      setTimeout(() => setMessage(''), 8000);
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

  const handleEnterPot = async (useDiscounted: boolean = false) => {
    if (!contractAddress) return;
    
    setIsLoading(true);
    setLastAction('enterPot');
    setUsedDiscountedEntry(useDiscounted); // Track if discounted entry was attempted
    
    try {
      // Don't consume free entry yet - wait for transaction confirmation
      if (useDiscounted && freeEntriesAvailable === 0) {
        showMessage('No discounted entries available', true);
        setIsLoading(false);
        setLastAction('');
        return;
      }
      
      // Handle referral code if provided for paid entries (run in background)
      if (inputReferralCode.trim()) {
        // Don't await this - run in background to avoid blocking pot entry
        recordReferral(inputReferralCode.trim().toUpperCase(), address!)
          .then(() => {
          })
          .catch((error) => {
            console.log('Referral recording failed:', error);
            // Silently fail - don't let referral issues affect main app flow
          });
      }
      
      // Always use the regular enterPot function with dynamic amount
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
        args: [entryAmount], // Pass the dynamic entryAmount (0.02 if discounted, 0.01 if regular)
      });
      
      const message = useDiscounted 
        ? 'Discounted entry submitted! Waiting for confirmation...'
        : 'Enter pot transaction submitted! Waiting for confirmation...';
      showMessage(message);
    } catch (error) {
      console.error('Enter pot failed:', error);
      showMessage('Enter pot failed. Check console for details.', true);
      setLastAction('');
      setIsLoading(false);
      setUsedDiscountedEntry(false); // Reset flag on error
    }
  };

  const handleReEntryApprove = async () => {
    if (!contractAddress || !reEntryFee) return;
    
    setIsLoading(true);
    setLastAction('approveReEntry');
    try {
      await writeContract({
        address: usdcAddress as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contractAddress, entryAmount],
      });
      showMessage('USDC approval for re-entry submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Re-entry approval failed:', error);
      showMessage('Re-entry approval failed. Check console for details.', true);
      setLastAction('');
      setIsLoading(false);
    }
  };

  const handleReEntry = async () => {
    if (!contractAddress || !reEntryFee) return;
    
    setIsLoading(true);
    setLastAction('reEntry');
    
    try {
      // Process re-entry payment using the smart contract with re-entry fee amount
      // Convert to BigInt the same way as normal pot entry
      
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
        args: [entryAmount],
      });
      
      showMessage('Re-entry payment submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Re-entry payment failed:', error);
      showMessage('Re-entry payment failed. Check console for details.', true);
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

  // Re-entry allowance and balance checks (use same entryAmount as normal entry)
  const hasEnoughReEntryAllowance = (() => {
    if (!allowance || !reEntryFee) return false;
    try {
      return allowance >= entryAmount;
    } catch {
      return false;
    }
  })();
  
  const hasEnoughReEntryBalance = (() => {
    if (!userUsdcBalance || !reEntryFee) return false;
    try {
      return userUsdcBalance >= entryAmount;
    } catch {
      return false;
    }
  })();

  const queryClient = useQueryClient();
useEffect(() => {
  console.log("🔍 🔄 Transaction confirmation useEffect triggered with:", { 
    isConfirmed, 
    lastAction, 
    txHash,
    winnerAddresses: winnerAddresses ? (winnerAddresses.length > 50 ? winnerAddresses.substring(0, 50) + '...' : winnerAddresses) : 'empty'
  });
  
  if (isConfirmed) {
    console.log("🔍 ✅ Transaction IS CONFIRMED! Processing lastAction:", lastAction);
    console.log("🔍 Available lastAction options: approve, enterPot, approveReEntry, reEntry, distributePot, processWinners");
    
    if (lastAction === 'processWinners') {
      console.log("🔍 🎯 MATCH! lastAction is processWinners - proceeding to handler");
    } else {
      console.log("🔍 ⚠️ lastAction is NOT processWinners, it is:", lastAction);
    }
    
    if (lastAction === 'approve') {
      setIsLoading(false);
      showMessage('USDC approval confirmed! You can now enter the pot.');
      setTimeout(() => {
  // Force refetch of all contract data
  queryClient.invalidateQueries({ queryKey: ['readContract'] });
}, 1000);
    } else if (lastAction === 'enterPot') {
      // Keep loading state active while background processes complete
      setIsLoading(false); // Clear transaction loading
      setPostEntryLoading(true); // Start post-entry loading
      setJustEnteredPot(true);
      
      // Now consume the free entry after successful transaction
      if (usedDiscountedEntry && address) {
        consumeFreeEntry(address).then((success) => {
          if (success) {
          } else {
            console.error('Failed to consume free entry after transaction confirmation');
          }
        });
      }
      
      showMessage('Successfully entered the pot! Welcome to the prediction game!');
      
      // Aggressive refresh strategy for both free entries and normal entries
      // Immediate refresh - clear all contract queries
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      queryClient.removeQueries({ queryKey: ['readContract'] }); // Force complete refetch
      
      // Multiple staged refreshes to ensure participant list updates properly
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
        queryClient.removeQueries({ queryKey: ['readContract'] });
      }, 500);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
        queryClient.removeQueries({ queryKey: ['readContract'] });
      }, 1500);
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
        queryClient.removeQueries({ queryKey: ['readContract'] });
      }, 3000);
      
      // Extra refresh specifically for free entries after 5 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
        queryClient.removeQueries({ queryKey: ['readContract'] });
        // Clear post-entry loading state after background processes complete
        setPostEntryLoading(false);
      }, 5000);
      
      // Clear the "just entered" state after showing success for a while
      setTimeout(() => {
        setJustEnteredPot(false);
        setUsedDiscountedEntry(false); // Reset discounted entry flag
      }, 8000); // Extended to 8 seconds for better visibility
      
      // Reload free entries count to reflect the used entry
      if (address) {
        setTimeout(async () => {
          try {
            const updatedFreeEntries = await getAvailableFreeEntries(address);
            setFreeEntriesAvailable(updatedFreeEntries);
            // Additional refresh after updating free entries
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
          } catch (error) {
            console.error('Error reloading free entries:', error);
          }
        }, 2000);
      }
      
      // Handle referral confirmation in background (completely isolated)
      if (address) {
        const handleReferralConfirmation = async () => {
          try {
            await confirmReferralPotEntry(address);
            // Reload referral data to update stats
            loadReferralData();
          } catch (error) {
            console.error('Error confirming referral:', error);
            // Silently fail - don't let referral issues affect main app flow
          }
        };
        
        // Use a separate timeout to ensure it doesn't interfere with contract refresh
        setTimeout(() => {
          handleReferralConfirmation();
        }, 4000); // Run after initial contract refreshes complete
      }
    } else if (lastAction === 'approveReEntry') {
      setIsLoading(false);
      showMessage('USDC approval for re-entry confirmed! You can now pay the re-entry fee.');
      setTimeout(() => {
        // Force refetch of all contract data to update allowance
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
      }, 1000);
    } else if (lastAction === 'reEntry') {
      // Handle re-entry confirmation
      const completeReEntry = async () => {
        try {
          // Remove user from wrong predictions table
          const success = await processReEntry(address!, selectedTableType);
          if (success) {
            setIsLoading(false);
            showMessage('Re-entry successful! You can now predict again.');
            setReEntryFee(null); // Clear re-entry fee
            // Refresh contract data and referral data
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['readContract'] });
              loadReferralData();
            }, 1000);
          } else {
            setIsLoading(false);
            showMessage('Re-entry payment processed but database update failed. Please contact support.', true);
          }
        } catch (error) {
          setIsLoading(false);
          showMessage('Re-entry payment processed but database update failed. Please contact support.', true);
        }
      };
      
      completeReEntry();
      setLastAction('');
      return; // Don't execute common cleanup below
    } else if (lastAction === 'distributePot' || (winnerAddresses.trim() && txHash)) {
      console.log("🔍 ✅ ENTERED distributePot transaction confirmation handler!");
      console.log("🔍 Triggered by:", { 
        lastActionMatch: lastAction === 'distributePot',
        winnerAddressesExist: !!winnerAddresses.trim(),
        txHashExists: !!txHash
      });
      console.log("🔍 distributePot state:", {
        winnerAddresses,
        potBalance: potBalance?.toString(),
        selectedTableType
      });
      
      // Handle pot distribution completion - update winner stats and clear wrong predictions
      const finishDistribution = async () => {
        console.log("🔍 🚀 Starting finishDistribution function");
        
        try {
          // Step 1: Update winner statistics
          console.log("🔍 Debug - Checking winner stats conditions:");
          console.log("- winnerAddresses:", winnerAddresses);
          console.log("- winnerAddresses.trim():", winnerAddresses.trim());
          console.log("- potBalance:", potBalance);
          console.log("- potBalance type:", typeof potBalance);
          console.log("- potBalance > 0:", potBalance ? potBalance > BigInt(0) : false);
          
          if (winnerAddresses.trim() && potBalance && potBalance > BigInt(0)) {
            console.log("🔍 ✅ Winner stats conditions MET - proceeding with update");
            showMessage("Step 2/3: Updating winner statistics...");
            const addresses = winnerAddresses.split(',').map(addr => addr.trim()).filter(addr => addr);
            console.log("- Parsed addresses:", addresses);
            console.log("- Number of addresses:", addresses.length);
            
            if (addresses.length > 0) {
              const totalPotMicroUSDC = Number(potBalance);
              const amountPerWinnerMicroUSDC = Math.floor(totalPotMicroUSDC / addresses.length);
              const amountPerWinnerUSDC = amountPerWinnerMicroUSDC / 1000000;
              
              console.log("🔍 Calculated amounts:");
              console.log("- totalPotMicroUSDC:", totalPotMicroUSDC);
              console.log("- amountPerWinnerMicroUSDC:", amountPerWinnerMicroUSDC);
              console.log("- amountPerWinnerUSDC:", amountPerWinnerUSDC);
              
              try {
                console.log("🚀 About to call updateWinnerStats with:", { addresses, amountPerWinnerMicroUSDC });
                const result = await updateWinnerStats(addresses, amountPerWinnerMicroUSDC);
                console.log("✅ updateWinnerStats completed successfully, result:", result);
                showMessage(`Step 2/3: Updated stats for ${addresses.length} winner(s) with $${amountPerWinnerUSDC.toFixed(6)} each`);
              } catch (statsError) {
                console.error("❌ Failed to update winner stats:", statsError);
                showMessage("Pot distributed but failed to update winner statistics. Stats can be updated manually later.");
              }
            } else {
              console.log("❌ No valid addresses found after parsing winnerAddresses");
            }
          } else {
            console.log("❌ Winner stats conditions NOT MET:");
            console.log("- winnerAddresses.trim():", winnerAddresses.trim());
            console.log("- winnerAddresses.trim() truthy:", !!winnerAddresses.trim());
            console.log("- potBalance exists:", !!potBalance);
            console.log("- potBalance > 0:", potBalance ? potBalance > BigInt(0) : false);
          }
          
          // Step 2: Clear wrong predictions
          console.log("🔍 Step 3: About to clear wrong predictions");
          showMessage("Step 3/3: Clearing wrong predictions...");
          await clearWrongPredictions(selectedTableType);
          console.log("🔍 ✅ Successfully cleared wrong predictions");
          showMessage("🎉 Pot distributed successfully! Winner stats updated and wrong predictions cleared!");
          
        } catch (error) {
          console.error("❌ Error in finishDistribution:", error);
          showMessage("Pot distributed but failed to complete cleanup tasks. Please clear wrong predictions manually.", true);
        }
      };
      
      console.log("🔍 About to call finishDistribution function");
      finishDistribution().finally(() => {
        setIsLoading(false);
      });
      
      setTimeout(() => {
        // Force refetch of all contract data
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
      }, 1000);
    } else if (lastAction === 'processWinners') {
      console.log("🔍 ✅ ENTERED processWinners transaction confirmation handler!");
      console.log("🔍 Current state:", {
        winnerAddresses,
        potBalance: potBalance?.toString(),
        selectedTableType,
        lastAction
      });
      
      // This handles the combined action - pot distribution is confirmed, now update stats and clear wrong predictions
      const finishProcessing = async () => {
        console.log("🔍 🚀 Starting finishProcessing function");
        
        try {
          // Step 3a: Update winner statistics
          console.log("🔍 Debug - Checking winner stats conditions:");
          console.log("- winnerAddresses:", winnerAddresses);
          console.log("- winnerAddresses.trim():", winnerAddresses.trim());
          console.log("- potBalance:", potBalance);
          console.log("- potBalance type:", typeof potBalance);
          console.log("- potBalance > 0:", potBalance ? potBalance > BigInt(0) : false);
          
          if (winnerAddresses.trim() && potBalance && potBalance > BigInt(0)) {
            console.log("🔍 ✅ Winner stats conditions MET - proceeding with update");
            showMessage("Step 3/4: Updating winner statistics...");
            const addresses = winnerAddresses.split(',').map(addr => addr.trim()).filter(addr => addr);
            console.log("- Parsed addresses:", addresses);
            console.log("- Number of addresses:", addresses.length);
            
            if (addresses.length > 0) {
              const totalPotMicroUSDC = Number(potBalance);
              const amountPerWinnerMicroUSDC = Math.floor(totalPotMicroUSDC / addresses.length);
              const amountPerWinnerUSDC = amountPerWinnerMicroUSDC / 1000000;
              
              console.log("🔍 Calculated amounts:");
              console.log("- totalPotMicroUSDC:", totalPotMicroUSDC);
              console.log("- amountPerWinnerMicroUSDC:", amountPerWinnerMicroUSDC);
              console.log("- amountPerWinnerUSDC:", amountPerWinnerUSDC);
              
              try {
                console.log("🚀 About to call updateWinnerStats with:", { addresses, amountPerWinnerMicroUSDC });
                const result = await updateWinnerStats(addresses, amountPerWinnerMicroUSDC);
                console.log("✅ updateWinnerStats completed successfully, result:", result);
                showMessage(`Step 3/4: Updated stats for ${addresses.length} winner(s) with $${amountPerWinnerUSDC.toFixed(6)} each`);
              } catch (statsError) {
                console.error("❌ Failed to update winner stats:", statsError);
                showMessage("Pot distributed but failed to update winner statistics. Stats can be updated manually later.");
              }
            } else {
              console.log("❌ No valid addresses found after parsing winnerAddresses");
            }
          } else {
            console.log("❌ Winner stats conditions NOT MET:");
            console.log("- winnerAddresses.trim():", winnerAddresses.trim());
            console.log("- winnerAddresses.trim() truthy:", !!winnerAddresses.trim());
            console.log("- potBalance exists:", !!potBalance);
            console.log("- potBalance > 0:", potBalance ? potBalance > BigInt(0) : false);
          }
          
          // Step 4: Clear wrong predictions
          console.log("🔍 Step 4: About to clear wrong predictions");
          showMessage("Step 4/4: Clearing wrong predictions...");
          await clearWrongPredictions(selectedTableType);
          console.log("🔍 ✅ Successfully cleared wrong predictions");
          showMessage("🎉 Winners processed successfully! Pot distributed, stats updated, and wrong predictions cleared!");
          setTimeout(() => {
  // Force refetch of all contract data
  queryClient.invalidateQueries({ queryKey: ['readContract'] });
}, 2000);
        } catch (error) {
          console.error("❌ Error in finishProcessing:", error);
          showMessage("Pot distributed but failed to clear wrong predictions. Please clear manually.", true);
        } finally {
          console.log("🔍 finishProcessing cleanup - setting loading false and clearing lastAction");
          setIsLoading(false);
          setLastAction('');
        }
      };
      
      console.log("🔍 About to call finishProcessing function");
      finishProcessing();
      return; // Don't execute the common cleanup below
    }
    
    setLastAction('');
  }
}, [isConfirmed, lastAction]);

  // Show loading screen for first 2 seconds or during post-entry processing
  if (isInitialLoading || postEntryLoading) {
    return (
      <div className="min-h-screen bg-invisible p-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-12 shadow-2xl shadow-gray-900/10 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gray-900 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gray-700 rounded-full blur-2xl animate-pulse delay-500"></div>
            </div>
            
            <div className="relative z-10">
              {/* Bitcoin icon with rotation animation */}
              <div className="w-20 h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-900/25 animate-spin">
                <span className="text-3xl font-black text-white drop-shadow-lg">₿</span>
              </div>
              
              <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                Loading Prediction Pot
              </h1>
              
              {/* Loading dots animation */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full animate-bounce delay-200"></div>
              </div>
              
              <p className="text-gray-600 text-sm">
                Preparing your markets...
              </p>
            </div>
            
            {/* Subtle pulse indicator */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-ping"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-invisible p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-invisible rounded-lg p-6 mb-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
              {t.bitcoinPotTitle || 'The ₿itcoin Pot'}
            </h1>
            {/* <div className="w-60 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div> */}
          </div>

          {!isConnected && (
            <div className="text-center text-bold text-[#111111] mb-6">
              {t.connectWalletPrompt || 'Please connect your wallet to interact with the contract.'}
            </div>
          )}

          {/* Contract Info */}
          {contractAddress && (
            <div className="mb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="relative">
                  {/* Referral link - visible on mobile only - above the box */}
                  {isConnected && address && (
                    <button
                      onClick={() => setActiveSection('referralProgram')}
                      className="absolute -top-6 right-0 text-xs text-gray-600 hover:text-gray-800 md:hidden z-10"
                    >
                      Referrals →
                    </button>
                  )}
                  <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                    <div className="text-sm font-semibold text-[#111111]">Today's Entry Price</div>
                    <div className="text-[#666666] font-semibold text-lg">
                      {formatBigIntValue(baseEntryAmount)} USDC
                    </div>
                    <div className="text-xs text-[#888888] mt-1">
                      {getCurrentDayName()} • Lowest on Sundays
                    </div>
                  </div>
                </div>
                <div className="relative">
                  {/* Referral link - visible on desktop only - above the box */}
                  {isConnected && address && (
                    <button
                      onClick={() => setActiveSection('referralProgram')}
                      className="absolute -top-6 right-0 text-xs text-gray-600 hover:text-gray-800 hidden md:block z-10"
                    >
                      Referrals →
                    </button>
                  )}
                  <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                    <div className="text-sm text-[#111111] font-semibold">{t.amountBalance || 'Pot Balance'}</div>
                    <div className="text-[#666666] font-semibold text-lg">
                      {formatBigIntValue(potBalance)} USDC
                    </div>
                    <div className="text-xs text-[#888888] mt-1">
                      Total pool amount
                    </div>
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


          {/* Re-entry Payment Section - Show if user has re-entry fee */}
          {isConnected && contractAddress && reEntryFee && (
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-gray-300 transition-all duration-300 text-center">
                <div className="text-2xl font-light text-gray-900 mb-3">
                  ⚠️ Re-entry Required
                </div>
                <div className="text-gray-600 font-light mb-4 leading-relaxed">
                  You made a wrong prediction in <span className="font-medium">{selectedTableType === 'featured' ? 'Featured Market' : 'Crypto Market'}</span> and need to pay <span className="font-medium">today's entry fee</span> to re-enter this specific market.
                </div>
                
                
                
                <div className="text-gray-500 text-sm mb-6 font-light">
                  {hasEnoughReEntryAllowance ? 'Pay the re-entry fee to resume predicting in this market' : 'Approve USDC spending first, then pay re-entry fee'}
                </div>
                
                {!hasEnoughReEntryAllowance ? (
                  <button
                    onClick={handleReEntryApprove}
                    disabled={isActuallyLoading || !hasEnoughReEntryBalance}
                    className="px-8 py-3 bg-gray-900 text-white font-light rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActuallyLoading && lastAction === 'approveReEntry'
                      ? 'Approving...'
                      : `Approve ${(Number(entryAmount) / 1000000).toFixed(2)} USDC`}
                  </button>
                ) : (
                  <button
                    onClick={handleReEntry}
                    disabled={isActuallyLoading || !hasEnoughReEntryBalance}
                    className="px-8 py-3 bg-gray-900 text-white font-light rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActuallyLoading && lastAction === 'reEntry'
                      ? 'Processing Re-entry...'
                      : `Pay ${(Number(entryAmount) / 1000000).toFixed(2)} USDC to Re-enter`}
                  </button>
                )}
                
                {!hasEnoughReEntryBalance && (
                  <p className="text-gray-400 text-sm mt-3 font-light">Insufficient USDC balance for re-entry</p>
                )}
                
              </div>
            </div>
          )}

          {/* User Actions - Show different content if already a participant */}
          {isConnected && contractAddress && isParticipant && !reEntryFee && !postEntryLoading && (
            <div className="mb-6">
              <div className={`rounded-xl border p-8 text-center transition-all duration-500 ${
                justEnteredPot 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 shadow-lg scale-105' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}>
                <div className={`text-2xl font-light mb-3 transition-colors duration-500 ${
                  justEnteredPot ? 'text-green-800' : 'text-gray-900'
                }`}>
                  {justEnteredPot ? "🎉 Welcome! You're in the Pot!" : (t.alreadyInPot || "✓ You're in the Pot")}
                </div>
                <div className={`font-light mb-6 leading-relaxed transition-colors duration-500 ${
                  justEnteredPot ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {justEnteredPot 
                    ? "🎊 Congratulations! You're now part of this prediction market. Start making your daily predictions to compete for the pot!" 
                    : (t.enteredPotMessage || "You've successfully entered this prediction market. You can now place your daily predictions!")
                  }
                </div>
                <button
                  onClick={() => setActiveSection('makePrediction')}
                  className="px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                >
                  {t.goToBetting || 'Start Betting'}
                </button>
              </div>
            </div>
          )}


          {/* User Actions - Show countdown or pot entry based on day */}
          {isConnected && contractAddress && !isParticipant && !reEntryFee && (
            <div className="mb-6">
              {isPotEntryBlocked() ? (
                /* Saturday Countdown */
                <div className="bg-white rounded-xl border-2 border-gray-900 p-12 text-center">
                  <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-4">
                      Results Day
                    </h2>
                    <p className="text-gray-600 text-lg font-medium">
                      Pot entries reopen every Sunday at midnight UTC
                    </p>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <div className="grid grid-cols-4 gap-2 sm:gap-6">
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2">
                          {timeUntilReopening.days.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wide">
                          D
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2">
                          {timeUntilReopening.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wide">
                          H
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2">
                          {timeUntilReopening.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wide">
                          M
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2">
                          {timeUntilReopening.seconds.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wide">
                          S
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-600">
                    <p className="font-medium mb-2">
                      🏆 Winners being determined today
                    </p>
                    <p className="text-sm">
                      Pot entries reopen tomorrow (Sunday)
                    </p>
                  </div>
                </div>
              ) : (
                /* Regular pot entry - Sunday through Friday */
                <div className="space-y-4">
                  
                  
                  
                  {/* Free Entry Option */}
                  {freeEntriesAvailable > 0 && (
                    <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      {/* Decorative background elements */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/50 rounded-full blur-xl"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-green-100/50 rounded-full blur-lg"></div>
                      
                      <div className="relative z-10">
                        {/* Header with icon */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg font-bold">✨</span>
                          </div>
                          <div>
                            <h3 className="text-emerald-900 text-lg font-bold leading-tight">Special Discount Available</h3>
                            <p className="text-emerald-700/80 text-sm">Congratulations!!!</p>
                          </div>
                        </div>
                        
                        {/* Pricing comparison */}
                        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl mb-4 border border-emerald-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-gray-500 text-sm line-through">Regular: {formatBigIntValue(baseEntryAmount)} USDC</span>
                              <div className="text-emerald-800 text-xl font-bold">
                                Your Price: {formatBigIntValue(entryAmount)} USDC
                              </div>
                            </div>
                            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              SAVE {((Number(baseEntryAmount) - Number(entryAmount)) / 1000000).toFixed(2)} USDC
                            </div>
                          </div>
                        </div>
                        
                       
                        
                        {/* Action buttons */}
                        <div className="space-y-3">
                          {!hasEnoughAllowance ? (
                            <button
                              onClick={handleApprove}
                              disabled={isActuallyLoading}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                            >
                              {isActuallyLoading && lastAction === 'approve'
                                ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Approving...
                                  </div>
                                )
                                : `Approve ${formatBigIntValue(entryAmount)} USDC`}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEnterPot(true)}
                              disabled={isActuallyLoading || !hasEnoughBalance}
                              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                            >
                              {isActuallyLoading && lastAction === 'enterPot'
                                ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Using Discount...
                                  </div>
                                )
                                : `Pay ${formatBigIntValue(entryAmount)} USDC to Enter`}
                            </button>
                          )}
                          
                          {!hasEnoughBalance && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <span className="text-red-500 text-sm">⚠️</span>
                                <p className="text-red-700 text-sm font-medium">Insufficient USDC balance for discounted entry</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Approve USDC - Only show if no free entries available */}
                  {freeEntriesAvailable === 0 && (
                    <div className="bg-[#2C2C47] p-4 rounded-lg">
                      <h3 className="text-[#F5F5F5] font-medium mb-2">{t.approveSpending || '1. Approve USDC Spending'}</h3>
                      <p className="text-[#A0A0B0] text-sm mb-3">
                        {t.allowContracts || 'Allow the contract to spend your USDC. Current allowance:'} {formatBigIntValue(allowance)} USDC
                      </p>
                      <button
                        onClick={handleApprove}
                        disabled={isActuallyLoading || hasEnoughAllowance}
                        className="bg-[#6A5ACD] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActuallyLoading && lastAction === 'approve'
                          ? t.approveProcessing
                          : hasEnoughAllowance
                          ? t.alreadyApproved
                          : t.approveUSDC}
                      </button>
                    </div>
                  )}

                  {/* Enter Pot - Only show if no free entries available */}
                  {freeEntriesAvailable === 0 && (
                    <div className="bg-[#2C2C47] p-4 rounded-lg">
                      <h3 className="text-[#F5F5F5] font-medium mb-2">{t.enterPot || '2. Enter Prediction Pot'}</h3>
                      <p className="text-[#A0A0B0] text-sm mb-3">
                      Approve USDC spending first.
                      </p>
                      
                      {/* Referral Code Input */}
                      <div className="mb-3">
                        <label className="text-[#F5F5F5] text-sm mb-1 block">Referral Code (Optional)</label>
                        <input
                          type="text"
                          placeholder="Earn free entries."
                          value={inputReferralCode}
                          onChange={(e) => setInputReferralCode(e.target.value.toUpperCase())}
                          className=" px-3 py-2 bg-black/50 border border-[#efefef] rounded-md text-[#F5F5F5] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ffffff]"
                          maxLength={8}
                        />
                        
                      </div>
                      
                      <button
                        onClick={() => handleEnterPot(false)}
                        disabled={isActuallyLoading || !hasEnoughAllowance || !hasEnoughBalance}
                        className="bg-[#6A5ACD] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isActuallyLoading && lastAction === 'enterPot'
                          ? t.enterPotProcessing
                          : `Pay ${formatBigIntValue(entryAmount)} USDC to Enter`}
                      </button>
                      {!hasEnoughBalance && (
                        <p className="text-red-400 text-sm mt-2">{t.insufficientUSDC || 'Insufficient USDC balance'}</p>
                      )}
                      {!hasEnoughAllowance && hasEnoughBalance && (
                        <p className="text-yellow-400 text-sm mt-2">{t.pleaseApproveFirst || 'Please approve USDC spending first'}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Owner Actions */}
          {/* Replace your entire Owner Actions section with this combined version */}

{isOwner && contractAddress && (
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-[#F5F5F5] mb-4">Owner Actions</h2>
    
    {/* Set Provisional Outcome (NEW) */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4 border-2 border-orange-500">
      <h3 className="text-[#F5F5F5] font-medium mb-2">🟡 Set Provisional Outcome</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        Set the provisional outcome - starts 1-hour evidence window where users can dispute.
      </p>
      <input
        type="text"
        placeholder="positive or negative"
        value={provisionalOutcomeInput}
        onChange={(e) => setProvisionalOutcomeInput(e.target.value.toLowerCase())}
        className="w-full px-3 py-2 bg-black/50 border border-orange-500 rounded-md text-[#F5F5F5] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 mb-3"
      />
      <button
        onClick={async () => {
          if (provisionalOutcomeInput !== "positive" && provisionalOutcomeInput !== "negative") {
            showMessage("Please enter 'positive' or 'negative'", true);
            return;
          }
          setIsLoading(true);
          try {
            await setProvisionalOutcome(provisionalOutcomeInput as "positive" | "negative", selectedTableType);
            showMessage("Provisional outcome set! Evidence window started (1 hour)");
            setProvisionalOutcomeInput("");
          } catch (error) {
            showMessage("Failed to set provisional outcome", true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isActuallyLoading}
        className="bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isActuallyLoading ? "Processing..." : "Set Provisional Outcome (1hr Evidence Window)"}
      </button>
    </div>

    {/* Set Final Outcome (EXISTING - UPDATED) */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4">
      <h3 className="text-[#F5F5F5] font-medium mb-2">🔴 Set Final Outcome</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        Set the final outcome - processes winners and distributes pot (no evidence window).
      </p>
      <input
        type="text"
        placeholder="positive or negative"
        value={outcomeInput}
        onChange={(e) => setOutcomeInput(e.target.value.toLowerCase())}
        className="w-full px-3 py-2 bg-black/50 border border-[#d3c81a] rounded-md text-[#F5F5F5] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3c81a] mb-3"
      />
      <button
        onClick={async () => {
          if (outcomeInput !== "positive" && outcomeInput !== "negative") {
            showMessage("Please enter 'positive' or 'negative'", true);
            return;
          }
          setIsLoading(true);
          try {
            await setDailyOutcome(outcomeInput as "positive" | "negative", selectedTableType, participants || []);
            showMessage("Final outcome set and pot distributed!");
            setOutcomeInput("");
          } catch (error) {
            showMessage("Failed to set final outcome", true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isActuallyLoading}
        className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isActuallyLoading ? "Processing..." : "Set Final Outcome & Distribute Pot"}
      </button>
    </div>

    {/* Combined Winner Processing & Pot Distribution */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4">
      <h3 className="text-[#F5F5F5] font-medium mb-2">Process Winners & Distribute Pot</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        This will automatically determine winners, distribute the pot equally among them, eliminate non-predictors, and clear wrong predictions for the next round.
      </p>
      <button
        onClick={async () => {
          setIsLoading(true);
          setLastAction("distributePot");
          
          try {
            // Step 1: Determine winners
            const participantCount = participants?.length || 0;
            console.log("🔍 Step 1: Starting winner determination process");
            showMessage(`Step 1/3: Determining winners among ${participantCount} pot participants...`);
            const winnersString = await determineWinners(selectedTableType, participants || []);
            console.log("🔍 determineWinners result:", winnersString);
            
            if (!winnersString || winnersString.trim() === "") {
              showMessage(`No winners found for this round (${participantCount} participants checked)`, true);
              setIsLoading(false);
              setLastAction("");
              return;
            }
            
            // Parse winner addresses
            const addresses = winnersString.split(',').map(addr => addr.trim()).filter(addr => addr);
            console.log("🔍 Parsed winner addresses:", addresses);
            
            if (addresses.length === 0) {
              showMessage("No valid winner addresses found", true);
              setIsLoading(false);
              setLastAction("");
              return;
            }
            
            // CRITICAL FIX: Set the winnerAddresses state so the transaction confirmation handler can access it
            setWinnerAddresses(winnersString);
            console.log("🔍 Set winnerAddresses state to:", winnersString);
            
            showMessage(`Found ${addresses.length} winner(s) out of ${participantCount} participants. Step 2/3: Distributing pot...`);
            
            // Step 2: Distribute pot using the blockchain contract
            console.log("🔍 Step 2: Submitting distributePot transaction");
            await writeContract({
              address: contractAddress as `0x${string}`,
              abi: PREDICTION_POT_ABI,
              functionName: 'distributePot',
              args: [addresses],
            });
            
            // Note: The transaction confirmation will be handled by the existing useEffect
            // We'll show the final message there, but for now show the interim message
            console.log("🔍 Transaction submitted, waiting for confirmation...");
            showMessage("Pot distribution transaction submitted! Step 3/4 will happen after confirmation...");
          } catch (error) {
            console.error("Error in combined winner processing:", error);
            showMessage("Failed to process winners and distribute pot", true);
            setIsLoading(false);
            setLastAction("");
          }
          // Note: Don't set setIsLoading(false) here because the transaction is still pending
        }}
        disabled={isActuallyLoading}
        className="bg-green-600 text-[#F5F5F5] px-6 py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {isActuallyLoading && lastAction === "distributePot" ? "Processing Winners..." : "🏆 Process Winners & Distribute Pot"}
      </button>
    </div>

    
    {/* DEBUG SECTION - Clear Specific Wallet */}
    <div className="bg-red-900/20 border border-red-500 p-4 rounded-lg mb-4">
      <h3 className="text-red-400 font-medium mb-2">🚨 DEBUG: Clear Wrong Predictions for Wallet</h3>
      <p className="text-red-300 text-sm mb-3">
        Clear all wrong predictions for a specific wallet (useful if data got corrupted by old logic)
      </p>
      <input
        type="text"
        placeholder="Enter wallet address"
        value={winnerAddresses}
        onChange={(e) => setWinnerAddresses(e.target.value)}
        className="w-full px-3 py-2 bg-black/50 border border-red-500 rounded-md text-red-300 placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
      />
      <button
        onClick={async () => {
          if (!winnerAddresses.trim()) {
            showMessage("Please enter a wallet address", true);
            return;
          }
          setIsLoading(true);
          try {
            await clearWrongPredictionsForWallet(winnerAddresses.trim());
            showMessage("Wrong predictions cleared for wallet!");
            setWinnerAddresses("");
            loadReferralData(); // Refresh data
          } catch (error) {
            showMessage("Failed to clear wrong predictions", true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isActuallyLoading}
        className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isActuallyLoading ? "Clearing..." : "Clear Wrong Predictions"}
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
      
      {/* Email Collection Modal */}
      <EmailCollectionModal
        isOpen={showEmailModal}
        onClose={hideEmailModal}
        onSubmit={handleEmailSubmit}
        sourcePage="PredictionPot"
      />
    </div>
  );
};

export default PredictionPotTest;
