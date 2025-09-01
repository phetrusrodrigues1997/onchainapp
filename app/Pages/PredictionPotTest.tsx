
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseEther } from 'viem';
import Cookies from 'js-cookie';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { getPrice } from '../Constants/getPrice';
import { setDailyOutcome, setProvisionalOutcome, getProvisionalOutcome, determineWinners, clearWrongPredictions, testDatabaseConnection, getUserStats } from '../Database/OwnerActions'; // Adjust path as needed
import { notifyMarketOutcome, notifyEliminatedUsers, notifyWinners, notifyPotDistributed, notifyMarketUpdate } from '../Database/actions';
import { useQueryClient } from '@tanstack/react-query';
import { 
  recordReferral, 
  confirmReferralPotEntry, 
  getAvailableFreeEntries, 
  consumeFreeEntry, 
  getReEntryFee,
  processReEntry,
  debugWrongPredictions,
} from '../Database/actions';
import { ENFORCE_SATURDAY_RESTRICTIONS, CONTRACT_TO_TABLE_MAPPING } from '../Database/config';
import { updateWinnerStats } from '../Database/OwnerActions';
import { clear } from 'console';
import LoadingScreen from '../Components/LoadingScreen';


// Use centralized table mapping from config
const tableMapping = CONTRACT_TO_TABLE_MAPPING;
type TableType = typeof tableMapping[keyof typeof tableMapping];
// Updated Contract ABI for SimplePredictionPot (ETH-based)
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
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

// Contract now uses ETH directly - no USDC ABI needed

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
  // Removed usdcAddress - now using ETH directly 
  

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [winnerAddresses, setWinnerAddresses] = useState<string>('empty');
  
  // Debug: Track winnerAddresses changes (only log actual changes, not initial state)
  useEffect(() => {
    if (winnerAddresses !== 'empty') {
      console.log("🔍 winnerAddresses changed:", winnerAddresses);
    }
  }, [winnerAddresses]);
  const [lastAction, setLastAction] = useState<string>('none');
  
  // Debug: Track lastAction changes (only log actual changes, not initial state)
  useEffect(() => {
    if (lastAction !== 'none') {
      console.log("🎯 lastAction changed:", lastAction);
    }
  }, [lastAction]);
  const [selectedTableType, setSelectedTableType] = useState<TableType>('featured');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);
  
  // Referral system state (simplified for navigation button)
  const [inputReferralCode, setInputReferralCode] = useState<string>('');
  const [freeEntriesAvailable, setFreeEntriesAvailable] = useState<number>(0);
  const [reEntryFee, setReEntryFee] = useState<number | null>(null);
  const [allReEntryFees, setAllReEntryFees] = useState<{market: string, fee: number}[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  
  
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
  

  // Wait for transaction receipt with error handling
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isError, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Debug transaction receipt states
  useEffect(() => {
    if (txHash) {
      console.log("🧾 Transaction receipt state changed:", {
        txHash,
        isPending,
        isConfirming,
        isConfirmed,
        isError,
        error: receiptError?.message || 'none',
        lastAction,
        timestamp: new Date().toISOString()
      });
      
      // Log transaction failure immediately
      if (isError && receiptError) {
        console.log("❌ Transaction failed:", {
          error: receiptError.message,
          txHash,
          lastAction
        });
        showMessage(`Transaction failed: ${receiptError.message}`, true);
      }
    }
  }, [txHash, isPending, isConfirming, isConfirmed, isError, receiptError, lastAction]);

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
      setContractAddress('0x4Ff2bBB26CC30EaD90251dd224b641989Fa24e22');
      setSelectedTableType('featured');
    }
  }, []);

  // Add state for voting preference
  const [votingPreference, setVotingPreference] = useState<string | null>(null);
  const [selectedMarketForVoting, setSelectedMarketForVoting] = useState<string | null>(null);
  
  // Load voting preference from cookies
  useEffect(() => {
    const preference = Cookies.get('votingPreference');
    const marketForVoting = Cookies.get('selectedMarketForVoting');
    setVotingPreference(preference || null);
    setSelectedMarketForVoting(marketForVoting || null);
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

  

  // Simple transaction reset - only if truly stuck - with better conditions
  useEffect(() => {
    // Only set timeout if we've been in loading state for a reasonable time without any transaction activity
    if (!isPending && !isConfirming && !isConfirmed && lastAction && lastAction !== 'none' && isLoading) {
      console.log("⏰ Transaction state check:", {
        isPending,
        isConfirming,
        isConfirmed,
        lastAction,
        isLoading,
        txHash: txHash || 'none',
        timestamp: new Date().toISOString()
      });
      
      // Add a delay before setting up timeout to avoid premature resets
      const delayTimeout = setTimeout(() => {
        if (!isPending && !isConfirming && !isConfirmed && lastAction && lastAction !== 'none' && isLoading) {
          console.log("⏰ Setting up transaction timeout after delay...");
          const mainTimeout = setTimeout(() => {
            // Double check conditions before resetting
            if (!isPending && !isConfirming && !isConfirmed && isLoading && !txHash) {
              console.log("🔄 Transaction timeout reset - no transaction hash detected");
              setIsLoading(false);
              setLastAction('none');
              showMessage("Transaction timeout. Please try again.", true);
            } else {
              console.log("⏰ Timeout avoided - transaction activity detected:", {
                isPending,
                isConfirming,
                isConfirmed,
                txHash: !!txHash
              });
            }
          }, 120000); // 2 minutes
          
          return () => clearTimeout(mainTimeout);
        }
      }, 5000); // 5 second delay before setting up main timeout
      
      return () => clearTimeout(delayTimeout);
    }
  }, [isPending, isConfirming, isConfirmed, lastAction, isLoading, txHash]);


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

  // Check if the user is a participant
  const isParticipant = address && participants && Array.isArray(participants) 
    ? participants.some(participant => participant.toLowerCase() === address.toLowerCase())
    : false;

  // Check if user has the special wallet address
  const SPECIAL_ADDRESS = '0xA90611B6AFcBdFa9DDFfCB2aa2014446297b6680';
  const isSpecialUser = address && address.toLowerCase() === SPECIAL_ADDRESS.toLowerCase();

  // Auto-redirect to MakePredictionsPage if user is already a participant (except special user)
  useEffect(() => {
    if (isConnected && address && isParticipant && contractAddress && !isSpecialUser) {
      console.log('User is already a participant (not special user), redirecting to makePrediction in 1 second');
      const timer = setTimeout(() => {
        setActiveSection('makePrediction');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, isParticipant, contractAddress, setActiveSection, isSpecialUser]);

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
  
  // Get dynamic entry amount based on day of week (USD equivalent in ETH)
  const getDynamicEntryAmount = (): bigint => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    
    // USD pricing that we want to maintain
    const usdPrices = {
      0: 0.01, // Sunday: $0.01
      1: 0.02, // Monday: $0.02  
      2: 0.04, // Tuesday: $0.03
      3: 0.08, // Wednesday: $0.04
      4: 0.16, // Thursday: $0.05
      5: 0.32, // Friday: $0.06
      6: 0.01, // Saturday: Closed (fallback to Sunday price)
    };
    
    const usdPrice = usdPrices[day as keyof typeof usdPrices];
    
    // If ETH price is not loaded yet, use a reasonable fallback
    if (!ethPrice) {
      // Fallback: assume $3000 ETH price
      const ethAmount = usdPrice / 4700;
      return parseEther(ethAmount.toString());
    }
    
    // Convert USD to ETH
    const ethAmount = usdPrice / ethPrice;
    return parseEther(ethAmount.toString());
  };
  
  // Helper function to convert USD to ETH
  const usdToEth = (usdAmount: number): bigint => {
    const fallbackEthPrice = 4700; // Fallback price if ETH price not loaded
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethAmount = usdAmount / currentEthPrice;
    return parseEther(ethAmount.toString());
  };

  // Current entry amount based on day and free entries
  const baseEntryAmount = getDynamicEntryAmount();
  const entryAmount = freeEntriesAvailable > 0 ? usdToEth(0.02) : baseEntryAmount; // Fixed $0.02 if using free entry, otherwise daily price

  // ETH balance is handled by the wallet - no need for contract reads


  const formatETH = (value: bigint): string => {
    try {
      const formatted = formatUnits(value, 18);
      return parseFloat(formatted).toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  // Helper to get USD equivalent of ETH amount
  const getUsdEquivalent = (ethAmount: bigint): string => {
    if (!ethPrice) return '~$?.??';
    const ethValue = Number(formatUnits(ethAmount, 18));
    const usdValue = ethValue * ethPrice;
    return `~$${usdValue.toFixed(4)}`;
  };

  // Helper to get the USD price for current day
  const getCurrentDayUsdPrice = (): string => {
    const now = new Date();
    const day = now.getDay();
    const usdPrices = { 0: 0.01, 1: 0.02, 2: 0.03, 3: 0.04, 4: 0.05, 5: 0.06, 6: 0.01 };
    const usdPrice = usdPrices[day as keyof typeof usdPrices];
    return `$${usdPrice.toFixed(2)}`;
  };



  // Utility functions for countdown
  const isPotEntryBlocked = (): boolean => {
    if (!ENFORCE_SATURDAY_RESTRICTIONS) return false;
    return new Date().getDay() === 6; // Saturday blocked for winner determination
  };

  const getNextSundayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysUntilSunday = currentDay === 6 ? 1 : 7 - currentDay;
    
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setUTCHours(0, 0, 0, 0);
    return nextSunday;
  };

  const getNextSaturdayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    const daysUntilSaturday = currentDay === 6 ? 7 : 6 - currentDay;
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setUTCHours(0, 0, 0, 0);
    return nextSaturday;
  };

  
    const ethToUsd = (ethAmount: bigint): number => {
        const fallbackEthPrice = 4700;
        const currentEthPrice = ethPrice || fallbackEthPrice;
        const ethValue = Number(formatUnits(ethAmount, 18));
        return ethValue * currentEthPrice;
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

  // Removed handleApprove - not needed for ETH transactions

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
          .catch(() => {
            // Silently fail - don't let referral issues affect main app flow
          });
      }
      
      // Always use the regular enterPot function with ETH value
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
        args: [], // No args needed - ETH sent via value
        value: entryAmount, // Send ETH as value
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

  // Removed handleReEntryApprove - not needed for ETH transactions

  const handleReEntry = async () => {
    if (!contractAddress || !reEntryFee) return;
    
    setIsLoading(true);
    setLastAction('reEntry');
    
    try {
      // Process re-entry payment using the same logic as normal pot entry
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
        args: [],
        value: entryAmount, // Use same entry amount as normal pot entry
      });
      
      showMessage('Re-entry payment submitted! Waiting for confirmation...');
    } catch (error) {
      console.error('Re-entry payment failed:', error);
      showMessage('Re-entry payment failed. Check console for details.', true);
      setLastAction('');
      setIsLoading(false);
    }
  };

  // const handleDistributePot = async () => {
  //   if (!contractAddress || !winnerAddresses.trim()) return;

  //   const winners = winnerAddresses
  //     .split(',')
  //     .map(addr => addr.trim())
  //     .filter(addr => addr.length > 0);
    
  //   if (winners.length === 0) {
  //     showMessage('Please enter at least one winner address.', true);
  //     return;
  //   }

  //   setIsLoading(true);
  //   setLastAction('distributePot');
  //   try {
  //     await writeContract({
  //       address: contractAddress as `0x${string}`,
  //       abi: PREDICTION_POT_ABI,
  //       functionName: 'distributePot',
  //       args: [winners],
  //     });
  //     showMessage('Distribute pot transaction submitted! Waiting for confirmation...');
  //   } catch (error) {
  //     console.error('Distribute pot failed:', error);
  //     showMessage('Distribute pot failed. Check console for details.', true);
  //     setLastAction('');
  //     setIsLoading(false);
  //   }
  // };

  const isActuallyLoading = isLoading || isPending || isConfirming;
  
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();
    

  const queryClient = useQueryClient();
useEffect(() => {
  console.log("🔄 Transaction confirmation useEffect triggered:", { 
    isConfirmed, 
    isConfirming, 
    isPending,
    lastAction, 
    winnerAddresses: winnerAddresses || 'empty',
    potBalance: potBalance?.toString() || 'none',
    txHash: txHash || 'no hash'
  });
  
  if (isConfirmed) {
    console.log("✅ Transaction confirmed successfully! Details:", {
      lastAction,
      txHash,
      timestamp: new Date().toISOString(),
      contractAddress,
      selectedTableType
    });
    
    if (lastAction === 'enterPot') {
      // Keep loading state active while background processes complete
      setIsLoading(false); // Clear transaction loading
      setPostEntryLoading(true); // Start post-entry loading
      setJustEnteredPot(true);
      
      // Now consume the free entry after successful transaction
      if (usedDiscountedEntry && address) {
        consumeFreeEntry(address).catch(() => {
          // Silently handle free entry consumption errors
        });
      }
      
      showMessage('Successfully entered the pot! Welcome to the prediction game!');
      
      // Refresh contract data
      queryClient.invalidateQueries({ queryKey: ['readContract'] });
      
      // Clear post-entry loading state after a reasonable delay
      setTimeout(() => {
        setPostEntryLoading(false);
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
      }, 2000);
      
      // Clear the "just entered" state after showing success for a while
      setTimeout(() => {
        setJustEnteredPot(false);
        setUsedDiscountedEntry(false); // Reset discounted entry flag
      }, 8000); // Extended to 8 seconds for better visibility
      
      // Reload free entries and handle referral confirmation in background
      if (address) {
        setTimeout(async () => {
          try {
            const updatedFreeEntries = await getAvailableFreeEntries(address);
            setFreeEntriesAvailable(updatedFreeEntries);
            
            // Handle referral confirmation
            await confirmReferralPotEntry(address);
            loadReferralData();
          } catch (error) {
            // Silently handle background task errors
          }
        }, 3000);
      }
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
    } else if (lastAction === 'distributePot') {
      console.log("🎯 =========================");
      console.log("🎯 DISTRIBUTION CONFIRMED!");
      console.log("🎯 =========================");
      console.log("📊 Transaction confirmation details:", {
        txHash,
        isConfirmed,
        lastAction,
        winnerAddresses: winnerAddresses || 'undefined',
        potBalance: potBalance?.toString() || 'null',
        contractAddress,
        selectedTableType,
        participantCount: participants?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // SAFETY CHECK: Don't proceed if winnerAddresses is empty or at initial state
      if (!winnerAddresses || winnerAddresses.trim() === '' || winnerAddresses === 'empty') {
        console.log("⚠️ =========================");
        console.log("⚠️ SAFETY CHECK FAILED");
        console.log("⚠️ =========================");
        console.log("⚠️ Distribution confirmed but winnerAddresses is empty - skipping cleanup");
        console.log("📊 Problematic state:", {
          winnerAddresses: winnerAddresses || 'undefined',
          winnerAddressesTrimmed: winnerAddresses?.trim() || 'undefined',
          lastAction,
          isConfirmed,
          potBalance: potBalance?.toString() || 'null'
        });
        showMessage("Distribution confirmed but winner data lost. Check console for details.", true);
        setIsLoading(false);
        setLastAction('none');
        return; // Don't proceed with cleanup
      }
      
      console.log("✅ SAFETY CHECK PASSED - proceeding with cleanup");
      console.log("🎯 Pot distribution confirmed! Starting post-distribution cleanup...");
      console.log("📊 Distribution confirmation state:", {
        winnerAddresses,
        potBalance: potBalance?.toString(),
        contractAddress,
        selectedTableType,
        participantCount: participants?.length || 0
      });
      
      // Handle pot distribution completion - update winner stats and clear wrong predictions
      const finishDistribution = async () => {
        console.log("🏁 =========================");
        console.log("🏁 STARTING FINISH DISTRIBUTION");
        console.log("🏁 =========================");
        try {
          console.log("🔍 Starting finishDistribution process");
          console.log("🧮 Distribution completion - checking conditions:");
          console.log("- winnerAddresses:", winnerAddresses);
          console.log("- winnerAddresses.trim():", winnerAddresses?.trim());
          console.log("- potBalance:", potBalance?.toString());
          console.log("- potBalance > BigInt(0):", potBalance ? potBalance > BigInt(0) : false);
          console.log("- selectedTableType:", selectedTableType);
          console.log("- participants:", participants);
          
          // Update winner statistics if we have pot balance - re-determine winners instead of relying on state
          if (potBalance && potBalance > BigInt(0)) {
            console.log("✅ Pot balance available, re-determining winners for stats update...");
            showMessage("Pot distributed successfully! Updating winner statistics...");
            
            // Re-determine winners to avoid state dependency issues
            const winnersString = await determineWinners(selectedTableType, participants || []);
            const addresses = winnersString.split(',').map(addr => addr.trim()).filter(addr => addr);
            console.log("📍 Re-determined addresses for stats:", addresses);
            
            if (addresses.length > 0) {
              const amountPerWinnerWei = potBalance / BigInt(addresses.length);
              const amountPerWinnerETH = Number(amountPerWinnerWei) / 1000000000000000000;
              
              try {
                await updateWinnerStats(addresses, amountPerWinnerWei);
                showMessage(`Updated stats for ${addresses.length} winner(s) with ${amountPerWinnerETH.toFixed(6)} ETH each`);
                
                // Debug: Check if the first user's stats were actually updated
                if (addresses.length > 0) {
                  console.log("🔍 Verifying winner stats update...");
                  const firstWinnerStats = await getUserStats(addresses[0]);
                  console.log("📊 First winner stats after update:", firstWinnerStats);
                }
              } catch (statsError) {
                console.error("❌ updateWinnerStats error:", statsError);
                showMessage("Pot distributed but failed to update winner statistics.", true);
              }
            }
          } else {
            console.log("❌ Conditions failed for updating winner stats");
            console.log("- potBalance is falsy:", !potBalance);
            console.log("- potBalance <= 0:", potBalance ? potBalance <= BigInt(0) : 'potBalance is null');
          }
          
          // 🔔 Send winner and pot distribution notifications
          try {
            console.log("📢 Sending winner notifications...");
            
            if (potBalance && potBalance > BigInt(0)) {
              // Re-determine winners for notifications (same as above for consistency)
              const winnersString = await determineWinners(selectedTableType, participants || []);
              const addresses = winnersString.split(',').map(addr => addr.trim()).filter(addr => addr);
              
              if (addresses.length > 0) {
                // Send winner notification
                await notifyWinners(contractAddress, addresses);
                
                // Send pot distribution notification
                const totalAmountETH = (Number(potBalance) / 1000000000000000000).toFixed(6);
                await notifyPotDistributed(contractAddress, totalAmountETH, addresses.length);
                
                console.log("✅ Winner and pot distribution notifications sent successfully");
              }
            }
          } catch (notificationError) {
            console.error("❌ Winner notification failed (distribution still succeeded):", notificationError);
            // Don't show error to user - notifications are supplementary
          }
          
          // Clear wrong predictions for next round
          console.log("🧹 Clearing wrong predictions...");
          showMessage("Clearing wrong predictions...");
          await clearWrongPredictions(selectedTableType);
          console.log("✅ Wrong predictions cleared successfully");
          showMessage("🎉 Pot distributed successfully! Participants automatically cleared by contract.");
          
        } catch (error) {
          console.log("❌ =========================");
          console.log("❌ FINISH DISTRIBUTION ERROR");
          console.log("❌ =========================");
          console.error("❌ finishDistribution error:", error);
          showMessage("Pot distributed but cleanup tasks failed.", true);
        } finally {
          console.log("🏁 =========================");
          console.log("🏁 FINISH DISTRIBUTION COMPLETE");
          console.log("🏁 =========================");
          setIsLoading(false);
          console.log("🔄 Clearing lastAction after distributePot completion");
          setLastAction('none');
          console.log("📊 Final state:", {
            isLoading: false,
            lastAction: 'none',
            winnerAddresses,
            potBalance: potBalance?.toString() || 'null'
          });
          // Refresh contract data
          setTimeout(() => {
            console.log("🔄 Invalidating contract queries for refresh");
            queryClient.invalidateQueries({ queryKey: ['readContract'] });
          }, 1000);
        }
      };
      
      finishDistribution();
      return;
    }
    
    // Only clear lastAction if transaction was actually confirmed and processed
    // Don't clear it just because useEffect ran
    console.log("🔄 End of transaction confirmation useEffect - NOT clearing lastAction automatically");
  }
}, [isConfirmed, lastAction]);

  // Show loading screen for first 2 seconds or during post-entry processing
  if (isInitialLoading || postEntryLoading) {
    return <LoadingScreen title="Prediwin" subtitle="Preparing your pots..." />;
  }

  return (
    <div className="min-h-screen bg-invisible p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-invisible rounded-lg p-6 mb-6">
          {/* <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
              {t.bitcoinPotTitle || 'The ₿itcoin Pot'}
            </h1>
             <div className="w-60 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div>
          </div> */}

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
                      className="absolute top-5 md:top-1 right-0 text-xs text-gray-600 hover:text-gray-800 md:hidden z-10"
                    >
                      Referrals →
                    </button>
                  )}
                  {/* <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                    <div className="text-sm font-semibold text-[#111111]">Today's Entry Price</div>
                    <div className="text-[#666666] font-semibold text-lg">
                      {getCurrentDayUsdPrice()}
                    </div>
                    <div className="text-xs text-[#888888] mt-1">
                      Sunday has the lowest price!
                    </div>
                  </div> */}
                </div>
                <div className="relative">
                  {/* Referral link - visible on desktop only - above the box */}
                  {isConnected && address && (
                    <button
                      onClick={() => setActiveSection('referralProgram')}
                      className="absolute top-5  md:top-1 right-0 text-xs text-gray-600 hover:text-gray-800 hidden md:block z-10"
                    >
                      Referrals →
                    </button>
                  )}
                  {/* <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                    <div className="text-sm text-[#111111] font-semibold">{t.amountBalance || 'Balance'}</div>
                    <div className="text-[#666666] font-semibold text-lg">
                      ${ethToUsd(potBalance ?? BigInt(0)).toFixed(2)} USD
                    </div>
                    <div className="text-xs text-[#888888] mt-1">
                      Total pool amount
                    </div>
                  </div> */}
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
                  You made a wrong prediction in <span className="font-medium">{selectedTableType === 'featured' ? 'Trending' : 'Crypto'}</span> and need to pay <span className="font-medium">today's entry fee</span> to re-enter this specific pot.
                </div>
                
                
                
                <div className="text-gray-500 text-sm mb-6 font-light">
                  Pay the re-entry fee to resume predicting in this pot
                </div>
                
                <button
                  onClick={handleReEntry}
                  disabled={isActuallyLoading}
                  className="px-8 py-3 bg-gray-900 text-white font-light rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActuallyLoading && lastAction === 'reEntry'
                    ? 'Processing Re-entry...'
                    : `Pay ${ethToUsd(entryAmount ?? BigInt(0)).toFixed(2)} USD to Re-enter`}
                </button>
                
                
              </div>
            </div>
          )}

          {/* User will be automatically redirected to MakePredictionsPage if already a participant */}


          {/* Voting Preference Display */}
          {isConnected && contractAddress && !isParticipant && !reEntryFee && votingPreference && selectedMarketForVoting && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-lg font-semibold text-gray-900">Your Prediction Ready</h3>
                </div>
                <p className="text-gray-700">
                  You are about to vote for: <span className="font-bold text-purple-700">
                    {votingPreference === 'positive' ? 'Yes' : 'No'}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  This will be automatically submitted when you make predictions
                </p>
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
                              <span className="text-gray-500 text-sm line-through">Regular: ${(Number(baseEntryAmount) / 1000000).toFixed(2)} ({formatETH(usdToEth(Number(baseEntryAmount) / 1000000))} ETH)</span>
                              <div className="text-emerald-800 text-xl font-bold">
                                Your Price: ${(Number(entryAmount) / 1000000).toFixed(2)} ({formatETH(usdToEth(Number(entryAmount) / 1000000))} ETH)
                              </div>
                            </div>
                            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              SAVE ${((Number(baseEntryAmount) - Number(entryAmount)) / 1000000).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                       
                        
                        {/* Action buttons */}
                        <div className="space-y-3">
                          <button
                            onClick={() => handleEnterPot(true)}
                            disabled={isActuallyLoading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            {isActuallyLoading && lastAction === 'enterPot'
                              ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Using Discount...
                                </div>
                              )
                              : `Pay ${ethToUsd(entryAmount ?? BigInt(0)).toFixed(2)} USD to Enter`}
                          </button>
                          
                        </div>
                      </div>
                    </div>
                  )}
                  

                  {/* Enter Pot - Only show if no free entries available */}
                  {freeEntriesAvailable === 0 && (
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-lg">
                      {/* Header with icon */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-700 rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg">🎯</span>
                        </div>
                        <div>
                          <h3 className="text-black font-bold text-lg">Join Predictions</h3>
                          <p className="text-black text-sm">Compete for the pot</p>
                        </div>
                      </div>
                      
                      {/* Entry price highlight */}
                      <div className="bg-black p-4 rounded-lg mb-4 border border-black">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-xl">💰</span>
                            <div>
                              <div className="text-white font-bold text-lg">
                                ${ethToUsd(entryAmount ?? BigInt(0)).toFixed(2)}
                              </div>
                              <div className="text-green-400 text-sm">
                                {getCurrentDayName()} Pricing ⚡
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                        
                      {/* Referral Code Input */}
                      <div className="mb-4">
                        <label className="text-black text-sm mb-2 block flex items-center gap-2">
                          <span>🎁</span>
                          Referral Code (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter code..."
                          value={inputReferralCode}
                          onChange={(e) => setInputReferralCode(e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 bg-white border-2 border-black rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:border-purple-700 transition-all duration-200"
                          maxLength={8}
                        />
                      </div>
                        
                      {/* Action button */}
                      <button
                        onClick={() => handleEnterPot(false)}
                        disabled={isActuallyLoading}
                        className="w-full bg-purple-700 hover:bg-black text-white px-6 py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
                      >
                        {isActuallyLoading && lastAction === 'enterPot'
                          ? (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Processing...
                            </div>
                          )
                          : (
                            <>
                              <span>🚀</span>
                              Enter (${ethToUsd(entryAmount ?? BigInt(0)).toFixed(2)})
                            </>
                          )}
                      </button>
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
    
    {/* Pot Balance Display */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4 border-2 border-blue-500">
      <h3 className="text-[#F5F5F5] font-medium mb-2">💰 Current Pot Balance</h3>
      <div className="space-y-2">
        <div className="text-2xl font-bold text-blue-400">
          {potBalance ? formatETH(potBalance) : '0.0000'} ETH
        </div>
        <div className="text-[#A0A0B0] text-sm">
          ~${potBalance ? ethToUsd(potBalance).toFixed(2) : '0.00'} USD
        </div>
        <div className="text-xs text-[#888888]">
          {participants?.length || 0} participant{(participants?.length || 0) !== 1 ? 's' : ''}
        </div>
      </div>
    </div>

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
            console.log('🟡 Setting provisional outcome:', { outcome: provisionalOutcomeInput, tableType: selectedTableType });
            await setProvisionalOutcome(provisionalOutcomeInput as "positive" | "negative", selectedTableType);
            showMessage("Provisional outcome set! Evidence window started (1 hour)");
            setProvisionalOutcomeInput("");
            console.log('✅ Provisional outcome set successfully');
          } catch (error) {
            console.error('❌ Provisional outcome setting failed:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showMessage(`Failed to set provisional outcome: ${errorMessage}`, true);
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
            
            
            // Set daily outcome (this will add new wrong predictions to the table)
            await setDailyOutcome(outcomeInput as "positive" | "negative", selectedTableType, participants || []);
            
            // 🔔 Send notifications after successful outcome setting
            try {
              console.log("📢 Sending pot outcome notifications...");
              
              // Notify market outcome
              await notifyMarketOutcome(
                contractAddress, 
                outcomeInput as "positive" | "negative", 
                selectedTableType
              );
              
              // Get eliminated users count for notification
              // Note: This is a simplified calculation - you might want to get exact count from setDailyOutcome
              const totalParticipants = (participants || []).length;
              const estimatedEliminatedCount = Math.floor(totalParticipants / 2); // Rough estimate
              
              if (estimatedEliminatedCount > 0) {
                await notifyEliminatedUsers(contractAddress, estimatedEliminatedCount, selectedTableType);
              }
              
              console.log("✅ Pot outcome notifications sent successfully");
            } catch (notificationError) {
              console.error("❌ Notification failed (core operation still succeeded):", notificationError);
              // Don't show error to user - notifications are supplementary
            }
            
            showMessage("Final outcome set successfully!");
            setOutcomeInput("");
          } catch (error) {
            showMessage("Failed to set final outcome", true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isActuallyLoading}
        className="bg-purple-700 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
          setLastAction('distributePot');
          
          try {
            // Step 1: Determine winners
            const winnersString = await determineWinners(selectedTableType, participants || []);
            
            if (!winnersString?.trim()) {
              showMessage("No winners found for this round", true);
              setIsLoading(false);
              setLastAction('none');
              return;
            }
            
            // Step 2: Parse and validate addresses
            const addresses = winnersString.split(',').map(addr => addr.trim()).filter(addr => addr);
            if (addresses.length === 0) {
              showMessage("No valid winner addresses found", true);
              setIsLoading(false);
              setLastAction('none');
              return;
            }
            
            showMessage(`Found ${addresses.length} winner(s). Distributing pot...`);
            setWinnerAddresses(winnersString);
            
            // Step 3: Distribute pot using blockchain contract
            await writeContract({
              address: contractAddress as `0x${string}`,
              abi: PREDICTION_POT_ABI,
              functionName: 'distributePot',
              args: [addresses],
              gas: BigInt(300000)
            });
            
            showMessage("Pot distribution transaction submitted! Waiting for confirmation...");
            
          } catch (error) {
            console.error("Distribution failed:", error);
            showMessage("Failed to process winners and distribute pot", true);
            setIsLoading(false);
            setLastAction('none');
          }
        }}
        disabled={isActuallyLoading}
        className="bg-green-600 text-[#F5F5F5] px-6 py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full"
      >
        {isActuallyLoading && lastAction === "distributePot" ? "Processing Winners..." : "🏆 Process Winners & Distribute Pot"}
      </button>
    </div>

    {/* Navigate to Make Predictions */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4 border-2 border-purple-1000">
      <h3 className="text-[#F5F5F5] font-medium mb-2">🎯 Make Predictions</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        Go to the predictions page to make your own predictions.
      </p>
      <button
        onClick={() => setActiveSection('makePrediction')}
        className="bg-purple-600 text-[#F5F5F5] px-6 py-3 rounded-md font-medium hover:bg-purple-700 w-full"
      >
        📊 Go to Predictions Page
      </button>
    </div>

    {/* Navigate to Admin Evidence Review */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4 border-2 border-indigo-500">
      <h3 className="text-[#F5F5F5] font-medium mb-2">📋 Evidence Review</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        Review evidence submissions and manage dispute resolution.
      </p>
      <button
        onClick={() => setActiveSection('adminEvidenceReview')}
        className="bg-indigo-600 text-[#F5F5F5] px-6 py-3 rounded-md font-medium hover:bg-indigo-700 w-full"
      >
        🔍 Admin Evidence Review Page
      </button>
    </div>
    
  </div>
)}

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-lg ${message.includes('failed') ? 'bg-purple-900/50 border border-purple-1000' : 'bg-green-900/50 border border-green-500'}`}>
              <p className="text-[#F5F5F5]">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionPotTest;
