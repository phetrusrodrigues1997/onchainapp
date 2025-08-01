
import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import Cookies from 'js-cookie';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { setDailyOutcome, determineWinners, clearWrongPredictions } from './OwnerActions'; // Adjust path as needed



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
  const [contractAddress, setContractAddress] = useState<string>('0xe3DAE4BC36fDe8F83c1F0369028bdA5813394794');
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

  // Handle transaction confirmation and errors
  useEffect(() => {
    if (isConfirmed) {
      setIsLoading(false);
      if (lastAction === 'approve') {
        showMessage('USDC approval confirmed! You can now enter the pot.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (lastAction === 'enterPot') {
        showMessage('Successfully entered the pot! Redirecting to betting page...');
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

  const entryAmount = BigInt(50000); // 0.10 USDC (6 decimals: 0.10 * 10^6 = 100,000)

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

  const handleEnterPot = async () => {
    if (!contractAddress) return;
    
    setIsLoading(true);
    setLastAction('enterPot');
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: PREDICTION_POT_ABI,
        functionName: 'enterPot',
        args: [entryAmount], // Pass the hardcoded entryAmount
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
        <div className="bg-invisible rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#111111] mb-6 text-center">
            {t.bitcoinPotTitle || 'The ₿itcoin Pot'}
          </h1>

          {!isConnected && (
            <div className="text-center text-[#F5F5F5] mb-6">
              {t.connectWalletPrompt || 'Please connect your wallet to interact with the contract.'}
            </div>
          )}

          {/* Contract Info */}
          {contractAddress && (
            <div className="mb-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                <div className="bg-[#ffffff] p-4 rounded-lg border border-[#dedede]">
                  <div className="text-sm font-semibold text-[#111111]">{t.entryAmount || 'Entry Amount'}</div>
                  <div className="text-[#666666] font-semibold">
                    {formatBigIntValue(entryAmount)} USDC
                  </div>
                </div>
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

          {/* User Actions - Show different content if already a participant */}
          {isConnected && contractAddress && isParticipant && (
            <div className="mb-6">
              <div className="bg-[#2C2C47] p-6 rounded-lg text-center">
                <div className="text-[#d3c81a] text-xl font-semibold mb-3">
                  {t.alreadyInPot || "🎉 You're in the Pot!"}
                </div>
                <div className="text-[#F5F5F5] mb-4">
                  {t.enteredPotMessage || "You've successfully entered the Bitcoin Pot. You can now place your daily Bitcoin price predictions!"}
                </div>
                <button
                  onClick={() => setActiveSection('bitcoinBetting')}
                  className="bg-[#6A5ACD] text-black px-6 py-3 rounded-md font-medium hover:bg-[#c4b517] transition-colors"
                >
                  {t.goToBetting || 'Go to Betting Page'}
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

                {/* Enter Pot */}
                <div className="bg-[#2C2C47] p-4 rounded-lg">
                  <h3 className="text-[#F5F5F5] font-medium mb-2">{t.enterPot || '2. Enter Prediction Pot'}</h3>
                  <p className="text-[#A0A0B0] text-sm mb-3">
                    {t.pay10USDC || 'Pay 0.10 USDC to enter the pot. Make sure you have approved USDC spending first.'}
                  </p>
                  <button
                    onClick={handleEnterPot}
                    disabled={isActuallyLoading || !hasEnoughAllowance || !hasEnoughBalance}
                    className="bg-[#6A5ACD] text-black px-4 py-2 rounded-md font-medium hover:bg-[#c4b517] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isActuallyLoading && lastAction === 'enterPot'
                      ? t.enterPotProcessing
                      : t.enterPotButton}
                  </button>
                  {!hasEnoughBalance && (
                    <p className="text-red-400 text-sm mt-2">{t.insufficientUSDC || 'Insufficient USDC balance'}</p>
                  )}
                  {!hasEnoughAllowance && hasEnoughBalance && (
                    <p className="text-yellow-400 text-sm mt-2">{t.pleaseApproveFirst || 'Please approve USDC spending first'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Owner Actions */}
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
            await setDailyOutcome(outcomeInput as "positive" | "negative");
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

    {/* Determine Winners */}
    <div className="bg-[#2C2C47] p-4 rounded-lg mb-4">
      <h3 className="text-[#F5F5F5] font-medium mb-2">Determine Winners</h3>
      <p className="text-[#A0A0B0] text-sm mb-3">
        Generate a list of winners who correctly predicted all three days and save to winners.txt.
      </p>
      <button
        onClick={async () => {
          setIsLoading(true);
          try {
            await determineWinners();
            showMessage("Winners determined and saved to winners.txt!");
          } catch (error) {
            showMessage("Failed to determine winners", true);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isActuallyLoading}
        className="bg-red-600 text-[#F5F5F5] px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isActuallyLoading ? "Processing..." : "Determine Winners"}
      </button>
    </div>

    {/* Distribute Pot */}
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
        {isActuallyLoading && lastAction === "distributePot" ? "Processing..." : "Distribute Pot"}
      </button>
    </div>
    {/* Clear Wrong Predictions */}
<div className="bg-[#2C2C47] p-4 rounded-lg mb-4">
  <h3 className="text-[#F5F5F5] font-medium mb-2">Clear Wrong Predictions</h3>
  <p className="text-[#A0A0B0] text-sm mb-3">
    Use this if you want to reset all users flagged for wrong predictions.
  </p>
  <button
    onClick={async () => {
      setIsLoading(true);
      try {
        await clearWrongPredictions(); // make sure this is imported
        showMessage("Cleared wrong predictions!");
      } catch (error) {
        showMessage("Failed to clear wrong predictions", true);
      } finally {
        setIsLoading(false);
      }
    }}
    disabled={isActuallyLoading}
    className="bg-yellow-600 text-black px-4 py-2 rounded-md font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isActuallyLoading ? "Processing..." : "Clear Wrong Predictions"}
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
