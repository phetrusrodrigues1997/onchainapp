import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { toast, ToastContainer } from 'react-toastify';

// Minimal ABIs for USDC and Synthetic Gold contracts
const USDC_ABI = [
  { inputs: [{ name: "", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }
] as const;

const SYNTHETIC_GOLD_ABI = [
  { inputs: [{ name: "", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "collateralAmount", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "sGoldAmount", type: "uint256" }], name: "burn", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "getTWAP", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" }
] as const;

// Contract addresses (Base Mainnet)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const SYNTHETIC_GOLD_ADDRESS = '0x3F2d6160c04E19e96483A95F2036367687626989'; // SyntheticGold contract address

type ActionType = 'mint' | 'burn';
type TransactionStep = 'idle' | 'approving' | 'minting' | 'burning' | 'completed' | 'failed';

const GoldTrades: React.FC = () => {
  const { address } = useAccount();
  const [activeAction, setActiveAction] = useState<ActionType>('mint');
  const [amount, setAmount] = useState('');
  const [transactionStep, setTransactionStep] = useState<TransactionStep>('idle');
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Hooks for writing to contracts
  const { writeContract: approveContract, isPending: isApproving, data: approveHash } = useWriteContract();
  const { writeContract: mintContract, isPending: isMinting, data: mintHash } = useWriteContract();
  const { writeContract: burnContract, isPending: isBurning, data: burnHash } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess, isError: isApproveError } = 
    useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isMintLoading, isSuccess: isMintSuccess, isError: isMintError } = 
    useWaitForTransactionReceipt({ hash: mintHash });
  const { isLoading: isBurnLoading, isSuccess: isBurnSuccess, isError: isBurnError } = 
    useWaitForTransactionReceipt({ hash: burnHash });

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      gcTime: 0,
    },
  });

  // Fetch geGOLD balance
  const { data: geGoldBalance, refetch: refetchGeGoldBalance } = useReadContract({
    address: SYNTHETIC_GOLD_ADDRESS,
    abi: SYNTHETIC_GOLD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined, 
    query: {
      enabled: Boolean(address),
      gcTime: 0,
    },
  });

  // Fetch USDC allowance for geGOLD contract
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && SYNTHETIC_GOLD_ADDRESS ? [address, SYNTHETIC_GOLD_ADDRESS] : undefined,
    query: {
      enabled: Boolean(address),
      gcTime: 0,
    },
  });

  // Fetch Gold/USD price
  const { data: goldPrice } = useReadContract({
    address: SYNTHETIC_GOLD_ADDRESS,
    abi: SYNTHETIC_GOLD_ABI,
    functionName: 'getTWAP',
    query: {
      enabled: true,
    },
  });

  // Clear amount when switching between mint and burn
  useEffect(() => {
    setAmount('');
    setTransactionStep('idle');
    setTransactionError(null);
  }, [activeAction]);

  // Handle transaction status changes
  useEffect(() => {
    // Update transaction step based on transaction status
    if (isApproving || isApproveLoading) {
      setTransactionStep('approving');
    } else if (isMinting || isMintLoading) {
      setTransactionStep('minting');
    } else if (isBurning || isBurnLoading) {
      setTransactionStep('burning');
    }

    // Handle transaction errors
    if (isApproveError) {
      setTransactionStep('failed');
      setTransactionError('USDC approval failed. Please try again.');
      toast.error('USDC approval failed. Please try again.');
    } else if (isMintError) {
      setTransactionStep('failed');
      setTransactionError('Minting failed. Please try again.');
      toast.error('Minting failed. Please try again.');
    } else if (isBurnError) {
      setTransactionStep('failed');
      setTransactionError('Burning failed. Please try again.');
      toast.error('Burning failed. Please try again.');
    }
  }, [
    isApproving, isApproveLoading, isApproveError,
    isMinting, isMintLoading, isMintError,
    isBurning, isBurnLoading, isBurnError
  ]);

  // Handle successful transactions and refresh balances
  useEffect(() => {
    const refreshBalances = async () => {
      try {
        await Promise.all([
          refetchUsdcBalance(),
          refetchGeGoldBalance(),
          refetchAllowance(),
        ]);
      } catch (error) {
        console.error('Balance refresh error:', error);
      }
    };

    if (isApproveSuccess && transactionStep === 'approving') {
      console.log('Approval successful. Hash:', approveHash);
      
      // Check if we're in the middle of a mint operation
      if (activeAction === 'mint' && amount) {
        toast.success('USDC approved successfully! Proceeding to mint...');
        // Proceed to mint after a short delay to ensure the approval is confirmed
        setTimeout(() => {
          handleMint();
        }, 1000);
      } else {
        toast.success('USDC approved successfully!');
        setTransactionStep('completed');
        refreshBalances();
      }
    }
    
    if (isMintSuccess) {
      console.log('Mint successful. Hash:', mintHash);
      toast.success('geGOLD minted successfully!');
      setTransactionStep('completed');
      setAmount('');
      refreshBalances();
      for (let i = 0; i < 30; i++) {
        console.log("i is:", i);
      }
      window.location.reload(); // Reload the page to reflect changes
    }
    
    if (isBurnSuccess) {
      console.log('Burn successful. Hash:', burnHash);
      toast.success('geGOLD burned successfully!');
      setTransactionStep('completed');
      setAmount('');
      refreshBalances();
      for (let i = 0; i < 30; i++) {
        console.log("i is:", i);
      }
      window.location.reload(); // Reload the page to reflect changes
    }
  }, [
    isApproveSuccess, isMintSuccess, isBurnSuccess,
    approveHash, mintHash, burnHash,
    transactionStep, activeAction, amount,
    refetchUsdcBalance, refetchGeGoldBalance, refetchAllowance
  ]);

  const handleApprove = async () => {
    if (!amount || !address) return;
    
    try {
      setTransactionStep('approving');
      setTransactionError(null);
      
      const amountToUse = parseUnits(amount, 6);
      console.log('Initiating approval for amount:', amountToUse.toString());
      
      approveContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [SYNTHETIC_GOLD_ADDRESS, amountToUse],
      });
    } catch (error) {
      console.error('Approval error:', error);
      setTransactionStep('failed');
      setTransactionError('Failed to initiate approval. Please try again.');
      toast.error('Failed to initiate approval. Please try again.');
    }
  };

  const handleMint = () => {
    if (!amount) return;
    
    try {
      setTransactionStep('minting');
      setTransactionError(null);
      
      const amountToUse = parseUnits(amount, 6);
      console.log('Initiating mint for amount:', amountToUse.toString());
      
      mintContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'mint',
        args: [amountToUse],
      });
    } catch (error) {
      console.error('Minting error:', error);
      setTransactionStep('failed');
      setTransactionError('Failed to initiate minting. Please try again.');
      toast.error('Failed to initiate minting. Please try again.');
    }
  };

  const handleMintWithApprovalIfNeeded = async () => {
    if (!amount || !address) return;
    
    try {
      const amountToUse = parseUnits(amount, 6);
      
      // Check if we need to approve first
      if (!allowance || (allowance as bigint) < amountToUse) {
        handleApprove();
      } else {
        // If already approved, proceed directly to mint
        handleMint();
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setTransactionStep('failed');
      setTransactionError('Transaction failed. Please try again.');
      toast.error('Transaction failed. Please try again.');
    }
  };

  const handleBurn = async () => {
    if (!amount) return;
    
    try {
      setTransactionStep('burning');
      setTransactionError(null);
      
      const amountToUse = parseUnits(amount, 18);
      console.log('Initiating burn for amount:', amountToUse.toString());
      
      burnContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'burn',
        args: [amountToUse],
      });
    } catch (error) {
      console.error('Burning error:', error);
      setTransactionStep('failed');
      setTransactionError('Failed to initiate burning. Please try again.');
      toast.error('Failed to initiate burning. Please try again.');
    }
  };

  const handleAction = () => {
    // Reset any previous errors
    setTransactionError(null);
    
    if (activeAction === 'mint') {
      handleMintWithApprovalIfNeeded();
    } else {
      handleBurn();
    }
  };

  const handleRetry = () => {
    setTransactionStep('idle');
    setTransactionError(null);
    handleAction();
  };

  const isTransactionInProgress = transactionStep === 'approving' || 
                                 transactionStep === 'minting' || 
                                 transactionStep === 'burning';

  const hasEnoughGeGold = geGoldBalance && amount && activeAction === 'burn' && 
    (geGoldBalance as bigint) >= parseUnits(amount, 18);

  const hasEnoughUsdc = usdcBalance && amount && activeAction === 'mint' && 
    (usdcBalance as bigint) >= parseUnits(amount, 6);

  const estimatedValue = amount && goldPrice 
    ? activeAction === 'mint'
      ? parseFloat(amount) / parseFloat(formatUnits(goldPrice as bigint, 8))
      : parseFloat(amount) * parseFloat(formatUnits(goldPrice as bigint, 8))
    : 0;

  const availableBalance = activeAction === 'mint'
    ? usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '0'
    : geGoldBalance ? formatUnits(geGoldBalance as bigint, 18) : '0';

  const currencySymbol = activeAction === 'mint' ? 'USDC' : 'geGOLD';
  
  const estimatedCurrencySymbol = activeAction === 'mint' ? 'geGOLD' : 'USDC';

  const getButtonText = () => {
    switch (transactionStep) {
      case 'approving':
        return 'Approving USDC...';
      case 'minting':
        return 'Minting geGOLD...';
      case 'burning':
        return 'Burning geGOLD...';
      case 'failed':
        return 'Retry';
      default:
        return activeAction === 'mint' ? 'Mint geGOLD' : 'Burn geGOLD';
    }
  };

  const isActionDisabled = () => {
    if (isTransactionInProgress) return true;
    if (!amount || amount === '0') return true;
    if (activeAction === 'mint' && !hasEnoughUsdc) return true;
    if (activeAction === 'burn' && !hasEnoughGeGold) return true;
    return false;
  };

  const handleUseMax = () => {
    if (activeAction === 'mint' && usdcBalance) {
      setAmount(formatUnits(usdcBalance as bigint, 6));
    } else if (activeAction === 'burn' && geGoldBalance) {
      setAmount(formatUnits(geGoldBalance as bigint, 18));
    }
  };

  const getTransactionStatusMessage = () => {
    switch (transactionStep) {
      case 'approving':
        return 'Approving USDC...';
      case 'minting':
        return 'Minting geGOLD...';
      case 'burning':
        return 'Burning geGOLD...';
      case 'failed':
        return transactionError || 'Transaction failed. Please try again.';
      case 'completed':
        return activeAction === 'mint' 
          ? 'geGOLD minted successfully!' 
          : 'geGOLD burned successfully!';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#002200] to-[#001100] p-8 rounded-xl shadow-2xl border border-[#004400] max-w-md mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      
      <div className="grid grid-cols-2 gap-1 mb-6 bg-[#001800] rounded-lg p-1">
        <button
          onClick={() => setActiveAction('mint')}
          disabled={isTransactionInProgress}
          className={`py-3 px-4 rounded-md font-bold transition-all duration-200 ${
            activeAction === 'mint'
              ? 'bg-[#00aa00] text-black'
              : 'bg-transparent text-[#00aa00] hover:bg-[#002200]'
          } ${isTransactionInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Mint
        </button>
        <button
          onClick={() => setActiveAction('burn')}
          disabled={isTransactionInProgress}
          className={`py-3 px-4 rounded-md font-bold transition-all duration-200 ${
            activeAction === 'burn'
              ? 'bg-[#00aa00] text-black'
              : 'bg-transparent text-[#00aa00] hover:bg-[#002200]'
          } ${isTransactionInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Burn
        </button>
      </div>

      <div className="bg-[#001800] p-6 rounded-lg border border-[#003300] mb-6">
        {(isTransactionInProgress || transactionStep === 'failed' || transactionStep === 'completed') && (
          <div className={`mb-6 p-3 rounded-lg text-center ${
            transactionStep === 'failed' 
              ? 'bg-[#330000] border border-[#660000]' 
              : transactionStep === 'completed'
                ? 'bg-[#003300] border border-[#006600]'
                : 'bg-[#003300]'
          }`}>
            <p className={`${
              transactionStep === 'failed' 
                ? 'text-[#ff0000]' 
                : transactionStep === 'completed'
                  ? 'text-[#00ff00]'
                  : 'text-[#00cc00]'
            }`}>
              {getTransactionStatusMessage()}
            </p>
            {isTransactionInProgress && (
              <div className="mt-2 w-full bg-[#004400] rounded-full h-1.5">
                <div className="bg-[#00aa00] h-1.5 rounded-full animate-pulse w-full"></div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center bg-[#002200] px-4 py-2 rounded-full">
            <div className="w-6 h-6 bg-[#00aa00] rounded-full flex items-center justify-center mr-2">
              <span className="text-black font-bold text-xs">$</span>
            </div>
            <span className="text-[#00aa00]">
              {activeAction === 'mint' ? 'USDC' : 'geGOLD'}
            </span>
          </div>
          <div className="bg-[#002200] px-4 py-2 rounded-full">
            <p className="text-sm text-[#00aa00]">
              Gold Price: {goldPrice ? `$${parseFloat(formatUnits(goldPrice as bigint, 8)).toFixed(2)}` : 'Loading...'}
            </p>
          </div>
        </div>

        <div className="bg-[#002800] p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xl font-bold text-white">{parseFloat(availableBalance || '0').toFixed(4)} {currencySymbol}</p>
              <p className="text-sm text-[#00aa00]">Available to {activeAction}</p>
            </div>
            <button
              onClick={handleUseMax}
              disabled={isTransactionInProgress}
              className={`text-[#4d7cfe] hover:text-[#6e92ff] transition-colors ${
                isTransactionInProgress ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Use max
            </button>
          </div>
        </div>

        <div className="bg-[#002800] p-4 rounded-lg mb-6">
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              disabled={isTransactionInProgress}
              className={`w-full text-3xl bg-transparent text-white border-none focus:outline-none focus:ring-0 ${
                isTransactionInProgress ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <div className="absolute right-0 top-0 text-[#00aa00]">
              {currencySymbol}
            </div>
          </div>
          {amount && (
            <p className="text-sm text-[#00aa00] mt-2">
              Estimated {estimatedCurrencySymbol}: ~{estimatedValue.toFixed(activeAction === 'mint' ? 8 : 6)}
            </p>
          )}
        </div>

        <button
          onClick={transactionStep === 'failed' ? handleRetry : handleAction}
          disabled={isActionDisabled()}
          className={`w-full py-4 font-bold rounded-lg transition-all duration-200 ${
            transactionStep === 'failed'
              ? 'bg-[#aa0000] hover:bg-[#cc0000] text-white'
              : 'bg-white hover:bg-gray-100 text-black'
          } disabled:opacity-50`}
        >
          {getButtonText()}
        </button>
      </div>

      <div className="bg-[#001800] p-6 rounded-lg border border-[#003300]">
        <h2 className="text-xl font-bold text-white mb-4">Your Balances</h2>
        <div className="flex justify-between items-center mb-2">
          <p className="text-[#00aa00]">USDC:</p>
          <p className="text-white font-mono">
            {usdcBalance ? formatUnits(usdcBalance as bigint, 6) : '0.00'} USDC
          </p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[#00aa00]">geGOLD:</p>
          <p className="text-white font-mono">
            {geGoldBalance ? formatUnits(geGoldBalance as bigint, 18) : '0.00000000'} geGOLD
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-center text-xs text-[#006600]">
        <p>Powered by Synthetic Gold Protocol • Base Mainnet</p>
      </div>
    </div>
  );
};

export default GoldTrades;
