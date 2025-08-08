
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import Cookies from 'js-cookie';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { setDailyOutcome, determineWinners, clearWrongPredictions } from '../Database/OwnerActions'; // Adjust path as needed
import { useQueryClient } from '@tanstack/react-query';
import { 
  generateReferralCode, 
  recordReferral, 
  confirmReferralPotEntry, 
  getAvailableFreeEntries, 
  consumeFreeEntry, 
  getReferralStats 
} from '../Database/actions';


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
  // Contract addresses
  const [contractAddress, setContractAddress] = useState<string>('');
  const [usdcAddress, setUsdcAddress] = useState<string>('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); 
  

  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [winnerAddresses, setWinnerAddresses] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  const [selectedTableType, setSelectedTableType] = useState<TableType>('featured');
  
  // Referral system state
  const [referralCode, setReferralCode] = useState<string>('');
  const [inputReferralCode, setInputReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<any>(null);
  const [freeEntriesAvailable, setFreeEntriesAvailable] = useState<number>(0);
  const [showReferralSection, setShowReferralSection] = useState<boolean>(false);
  
  // Countdown state
  const [timeUntilWednesday, setTimeUntilWednesday] = useState<{
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
    
    if (savedContract) {
      setContractAddress(savedContract);
      const tableType = tableMapping[savedContract as keyof typeof tableMapping];
      if (tableType) {
        setSelectedTableType(tableType);
      } else {
        setSelectedTableType('featured'); // Default fallback
      }

    } else {
      // Fallback to bitcoin contract if no cookie is found
      
      console.log('No cookie found, using default bitcoin contract');
    }
  }, []);

  // Load referral data when wallet connects
  useEffect(() => {
    if (address) {
      loadReferralData();
    }
  }, [address]);

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
      // On Saturday, Sunday, Monday, Tuesday - show deadline countdown
      updateDeadlineCountdown();
      const interval = setInterval(updateDeadlineCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const loadReferralData = async () => {
    if (!address) return;
    
    try {
      // Generate referral code if doesn't exist
      const code = await generateReferralCode(address);
      setReferralCode(code);
      
      // Load referral stats
      const stats = await getReferralStats(address);
      console.log("Debug - referral stats:", stats);
      setReferralStats(stats);
      
      // Load available free entries
      const freeEntries = await getAvailableFreeEntries(address);
      console.log("Debug - getAvailableFreeEntries returned:", freeEntries);
      setFreeEntriesAvailable(freeEntries);
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

  // Dynamic entry amount: 0.02 USDC if user has free entries, 0.01 USDC otherwise
  const entryAmount = freeEntriesAvailable > 0 ? BigInt(30000) : BigInt(10000); // 0.02 or 0.01 USDC (6 decimals)

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


  // const getParticipantCount = (): number => {
  //   if (!participants || !Array.isArray(participants)) return 0;
  //   return participants.length;
  // };

  // Utility functions for countdown
  const isPotEntryBlocked = (): boolean => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    return day === 3 || day === 4 || day === 5; // Wednesday, Thursday, Friday - pot entry blocked
  };

  const getNextSaturdayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilSaturday;
    
    if (currentDay >= 3 && currentDay <= 5) {
      // Wednesday (3), Thursday (4), Friday (5) - next Saturday
      daysUntilSaturday = 6 - currentDay;
    } else {
      // Saturday (6), Sunday (0), Monday (1), Tuesday (2) - next Saturday (next week)
      if (currentDay === 6) {
        daysUntilSaturday = 7; // Saturday to next Saturday
      } else {
        daysUntilSaturday = 6 - currentDay; // Sunday/Monday/Tuesday to Saturday
      }
    }
    
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    nextSaturday.setUTCHours(0, 0, 0, 0); // Midnight UTC
    return nextSaturday;
  };

  const getNextWednesdayMidnight = (): Date => {
    const now = new Date();
    const currentDay = now.getDay();
    let daysUntilWednesday;
    
    if (currentDay === 6) {
      // Saturday - this Wednesday
      daysUntilWednesday = 4;
    } else if (currentDay <= 2) {
      // Sunday (0), Monday (1), Tuesday (2) - this Wednesday
      if (currentDay === 0) {
        daysUntilWednesday = 3; // Sunday to Wednesday
      } else {
        daysUntilWednesday = 3 - currentDay; // Monday/Tuesday to Wednesday
      }
    } else {
      // Wednesday (3), Thursday (4), Friday (5) - next Wednesday (next week)
      daysUntilWednesday = 7 - currentDay + 3;
    }
    
    const nextWednesday = new Date(now);
    nextWednesday.setDate(now.getDate() + daysUntilWednesday);
    nextWednesday.setUTCHours(0, 0, 0, 0); // Midnight UTC
    return nextWednesday;
  };

  const updateCountdown = () => {
    const now = new Date();
    const target = getNextSaturdayMidnight();
    const difference = target.getTime() - now.getTime();

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeUntilWednesday({ days, hours, minutes, seconds });
    } else {
      setTimeUntilWednesday({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  const updateDeadlineCountdown = () => {
    const now = new Date();
    const target = getNextWednesdayMidnight();
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
    
    try {
      // If using discounted entry, check and consume free entry from database
      if (useDiscounted) {
        const freeEntryUsed = await consumeFreeEntry(address!);
        if (!freeEntryUsed) {
          showMessage('No discounted entries available', true);
          setIsLoading(false);
          setLastAction('');
          return;
        }
      }
      
      // Handle referral code if provided for paid entries (run in background)
      if (inputReferralCode.trim()) {
        // Don't await this - run in background to avoid blocking pot entry
        recordReferral(inputReferralCode.trim().toUpperCase(), address!)
          .then(() => {
            console.log('Referral recorded successfully');
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

  const queryClient = useQueryClient();
useEffect(() => {
  if (isConfirmed) {
    if (lastAction === 'approve') {
      setIsLoading(false);
      showMessage('USDC approval confirmed! You can now enter the pot.');
      setTimeout(() => {
  // Force refetch of all contract data
  queryClient.invalidateQueries({ queryKey: ['readContract'] });
}, 1000);
    } else if (lastAction === 'enterPot') {
      setIsLoading(false);
      showMessage('Successfully entered the pot! Redirecting to betting page...');
      
      // Always force refetch of contract data first (same as before referral system)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['readContract'] });
      }, 2000);
      
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
        }, 3000); // Run after contract refresh completes
      }
    } else if (lastAction === 'distributePot') {
      setIsLoading(false);
      showMessage('Pot distributed successfully!');
      setTimeout(() => {
  // Force refetch of all contract data
  queryClient.invalidateQueries({ queryKey: ['readContract'] });
}, 1000);
    } else if (lastAction === 'processWinners') {
      // This handles the combined action - pot distribution is confirmed, now clear wrong predictions
      const finishProcessing = async () => {
        try {
          showMessage("Step 3/3: Clearing wrong predictions...");
          await clearWrongPredictions(selectedTableType);
          showMessage("🎉 Winners processed successfully! Pot distributed and wrong predictions cleared!");
          setTimeout(() => {
  // Force refetch of all contract data
  queryClient.invalidateQueries({ queryKey: ['readContract'] });
}, 2000);
        } catch (error) {
          showMessage("Pot distributed but failed to clear wrong predictions. Please clear manually.", true);
        } finally {
          setIsLoading(false);
          setLastAction('');
        }
      };
      
      finishProcessing();
      return; // Don't execute the common cleanup below
    }
    
    setLastAction('');
  }
}, [isConfirmed, lastAction]);

  return (
    <div className="min-h-screen bg-invisible p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-invisible rounded-lg p-6 mb-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
              {t.bitcoinPotTitle || 'The ₿itcoin Pot'}
            </h1>
            <div className="w-20 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div>
          </div>

          {!isConnected && (
            <div className="text-center text-bold text-[#111111] mb-6">
              {t.connectWalletPrompt || 'Please connect your wallet to interact with the contract.'}
            </div>
          )}

          {/* Contract Info */}
          {contractAddress && (
            <div className="mb-6">
              <div className="grid md:grid-cols-1 lg:grid-cols-1">
                {/* <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                  <div className="text-sm font-semibold text-[#111111]">{t.entryAmount || 'Entry Amount'}</div>
                  <div className="text-[#666666] font-semibold">
                    {formatBigIntValue(entryAmount)} USDC
                  </div>
                </div> */}
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                  <div className="text-sm text-[#111111] font-semibold">{t.amountBalance || 'Amount Balance'}</div>
                  <div className="text-[#666666] font-semibold">
                    {formatBigIntValue(potBalance)} USDC
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

          {/* Referral System Section */}
          {isConnected && address && (
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Referral Program</h2>
                  <button
                    onClick={() => setShowReferralSection(!showReferralSection)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {showReferralSection ? '−' : '+'}
                  </button>
                </div>
                
                {showReferralSection && (
                  <div className="space-y-4">
                    {/* Your Referral Code */}
                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-2">Your Referral Code</h3>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-3 py-2 rounded text-lg text-black font-bold">
                          {referralCode || 'Loading...'}
                        </code>
                        {referralCode && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(referralCode);
                              showMessage('Referral code copied to clipboard!');
                            }}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Share this code with friends. When 3 friends enter the pot with your code, you get a free entry!
                      </p>
                    </div>

                    {/* Referral Stats */}
                    {referralStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{referralStats.totalReferrals}</div>
                          <div className="text-sm text-gray-600">Total Referrals</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{referralStats.confirmedReferrals}</div>
                          <div className="text-sm text-gray-600">Confirmed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{referralStats.freeEntriesEarned}</div>
                          <div className="text-sm text-gray-600">Free Entries Earned</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{freeEntriesAvailable}</div>
                          <div className="text-sm text-gray-600">Available</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Actions - Show different content if already a participant */}
          {isConnected && contractAddress && isParticipant && (
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-gray-300 transition-all duration-300 text-center">
                <div className="text-2xl font-light text-gray-900 mb-3">
                  {t.alreadyInPot || "✓ You're in the Pot"}
                </div>
                <div className="text-gray-600 font-light mb-6 leading-relaxed">
                  {t.enteredPotMessage || "You've successfully entered the Bitcoin Pot. You can now place your daily Bitcoin price predictions!"}
                </div>
                <button
                  onClick={() => setActiveSection('bitcoinBetting')}
                  className="px-8 py-3 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all duration-300 hover:scale-105"
                >
                  {t.goToBetting || 'Start Betting'}
                </button>
              </div>
            </div>
          )}

          {/* User Actions - Show countdown or pot entry based on day */}
          {isConnected && contractAddress && !isParticipant && (
            <div className="mb-6">
              {isPotEntryBlocked() ? (
                /* Wednesday/Thursday/Friday Countdown */
                <div className="bg-white rounded-xl border-2 border-gray-900 p-12 text-center">
                  <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-4">
                      Pot Entry Closed
                    </h2>
                    <p className="text-gray-600 text-lg font-medium">
                      New pot entries open every Saturday at midnight UTC
                    </p>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-8 mb-8">
                    <div className="grid grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-4xl font-black text-white mb-2">
                          {timeUntilWednesday.days.toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                          Days
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-white mb-2">
                          {timeUntilWednesday.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                          Hours
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-white mb-2">
                          {timeUntilWednesday.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                          Minutes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-white mb-2">
                          {timeUntilWednesday.seconds.toString().padStart(2, '0')}
                        </div>
                        <div className="text-sm font-medium text-gray-300 uppercase tracking-wide">
                          Seconds
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-gray-600">
                    <p className="font-medium mb-2">
                      ⏰ Pot entry resumes this weekend
                    </p>
                    <p className="text-sm">
                      Current participants can continue betting on their predictions
                    </p>
                  </div>
                </div>
              ) : (
                /* Regular pot entry - Saturday, Sunday, Monday, Tuesday */
                <div className="space-y-4">
                  
                  {/* Pot Entry Deadline Countdown */}
                  <div className="bg-red-50 rounded-lg border-2 border-red-200 p-6 text-center">
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-red-900 mb-2">
                        ⏰ Pot Entry Deadline
                      </h3>
                      <p className="text-red-700 font-medium">
                        Pot entries close Wednesday at midnight UTC
                      </p>
                    </div>
                    
                    <div className="bg-red-900 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">
                            {timeUntilDeadline.days.toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs font-medium text-red-200 uppercase tracking-wide">
                            Days
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">
                            {timeUntilDeadline.hours.toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs font-medium text-red-200 uppercase tracking-wide">
                            Hours
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">
                            {timeUntilDeadline.minutes.toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs font-medium text-red-200 uppercase tracking-wide">
                            Minutes
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-white mb-1">
                            {timeUntilDeadline.seconds.toString().padStart(2, '0')}
                          </div>
                          <div className="text-xs font-medium text-red-200 uppercase tracking-wide">
                            Seconds
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-red-600">
                      Enter now to participate in the next prediction round!
                    </p>
                  </div>
                  
                  {/* Free Entry Option */}
                  {freeEntriesAvailable > 0 && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="text-black font-bold mb-2">🎉 Discounted Entry Available!</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Special price: {formatBigIntValue(entryAmount)} USDC (normally 0.01 USDC)
                      </p>
                      
                      {!hasEnoughAllowance ? (
                        <button
                          onClick={handleApprove}
                          disabled={isActuallyLoading}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                        >
                          {isActuallyLoading && lastAction === 'approve'
                            ? 'Approving...'
                            : `Approve ${formatBigIntValue(entryAmount)} USDC`}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnterPot(true)}
                          disabled={isActuallyLoading || !hasEnoughBalance}
                          className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isActuallyLoading && lastAction === 'enterPot'
                            ? 'Using Discounted Entry...'
                            : `Pay ${formatBigIntValue(entryAmount)} USDC to Enter`}
                        </button>
                      )}
                      {!hasEnoughBalance && (
                        <p className="text-red-400 text-sm mt-2">Insufficient USDC balance for discounted entry</p>
                      )}
                      {!hasEnoughAllowance && (
                        <p className="text-yellow-400 text-sm mt-2">Need to approve {formatBigIntValue(entryAmount)} USDC first</p>
                      )}
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
                        Pay {formatBigIntValue(entryAmount)} USDC to enter the pot. Make sure you have approved USDC spending first.
                      </p>
                      
                      {/* Referral Code Input */}
                      <div className="mb-3">
                        <label className="text-[#F5F5F5] text-sm mb-1 block">Referral Code (Optional)</label>
                        <input
                          type="text"
                          placeholder="Enter friend's referral code"
                          value={inputReferralCode}
                          onChange={(e) => setInputReferralCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 bg-black/50 border border-[#d3c81a] rounded-md text-[#F5F5F5] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d3c81a]"
                          maxLength={8}
                        />
                        <p className="text-[#A0A0B0] text-xs mt-1">
                          Help a friend earn free entries
                        </p>
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
    
    {/* Set Today's Outcome */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4">
      <h3 className="text-[#F5F5F5] font-medium mb-2">Set Today's Outcome</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        Enter the actual Bitcoin price movement for today ("positive" or "negative").
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
            await setDailyOutcome(outcomeInput as "positive" | "negative", selectedTableType);
            showMessage("Today's outcome set successfully!");
            setOutcomeInput("");
          } catch (error) {
            showMessage("Failed to set outcome", true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isActuallyLoading}
        className="bg-[#6A5ACD] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isActuallyLoading ? "Processing..." : "Set Today's Outcome"}
      </button>
    </div>

    {/* Combined Winner Processing & Pot Distribution */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4">
      <h3 className="text-[#F5F5F5] font-medium mb-2">Process Winners & Distribute Pot</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        This will automatically determine winners, distribute the pot equally among them, and clear wrong predictions for the next round.
      </p>
      <button
        onClick={async () => {
          setIsLoading(true);
          setLastAction("processWinners");
          
          try {
            // Step 1: Determine winners
            showMessage("Step 1/3: Determining winners...");
            const winnersString = await determineWinners(selectedTableType);
            
            if (!winnersString || winnersString.trim() === "") {
              showMessage("No winners found for this round", true);
              return;
            }
            
            // Parse winner addresses
            const addresses = winnersString.split(',').map(addr => addr.trim()).filter(addr => addr);
            
            if (addresses.length === 0) {
              showMessage("No valid winner addresses found", true);
              return;
            }
            
            showMessage(`Found ${addresses.length} winner(s). Step 2/3: Distributing pot...`);
            
            // Step 2: Distribute pot using the blockchain contract
            await writeContract({
              address: contractAddress as `0x${string}`,
              abi: PREDICTION_POT_ABI,
              functionName: 'distributePot',
              args: [addresses],
            });
            
            // Note: The transaction confirmation will be handled by the existing useEffect
            // We'll show the final message there, but for now show the interim message
            showMessage("Pot distribution transaction submitted! Step 3/3 will happen after confirmation...");
            await clearWrongPredictions(selectedTableType);
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
        {isActuallyLoading && lastAction === "processWinners" ? "Processing Winners..." : "🏆 Process Winners & Distribute Pot"}
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
