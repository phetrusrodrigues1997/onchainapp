import React, { useState, useEffect, useCallback } from 'react';
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
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const SYNTHETIC_GOLD_ADDRESS = '0x3F2d6160c04E19e96483A95F2036367687626989';

type ActionType = 'mint' | 'burn';
interface TransactionState {
  status: 'idle' | 'approving' | 'minting' | 'burning' | 'success' | 'error' | 'pending';
  errorMessage?: string;
}

const GoldTrades: React.FC = () => {
  const { address } = useAccount();
  const [activeAction, setActiveAction] = useState<ActionType>('mint');
  const [amount, setAmount] = useState('');
  const [transactionState, setTransactionState] = useState<TransactionState>({ status: 'idle' });
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Contract hooks
  const { writeContract: approveContract, data: approveHash, error: approveError } = useWriteContract();
  const { writeContract: mintContract, data: mintHash, error: mintError } = useWriteContract();
  const { writeContract: burnContract, data: burnHash, error: burnError } = useWriteContract();

  // Transaction receipt hooks
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isMintLoading, isSuccess: isMintSuccess } = 
    useWaitForTransactionReceipt({ hash: mintHash });
  const { isLoading: isBurnLoading, isSuccess: isBurnSuccess } = 
    useWaitForTransactionReceipt({ hash: burnHash });

  // Read contract data
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: geGoldBalance, refetch: refetchGeGoldBalance } = useReadContract({
    address: SYNTHETIC_GOLD_ADDRESS,
    abi: SYNTHETIC_GOLD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && SYNTHETIC_GOLD_ADDRESS ? [address, SYNTHETIC_GOLD_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { data: goldPrice } = useReadContract({
    address: SYNTHETIC_GOLD_ADDRESS,
    abi: SYNTHETIC_GOLD_ABI,
    functionName: 'getTWAP',
    query: { enabled: true },
  });

  const refreshBalances = useCallback(async () => {
    try {
      await Promise.all([
        refetchUsdcBalance(),
        refetchGeGoldBalance(),
        refetchAllowance(),
      ]);
    } catch (error) {
      console.error('Balance refresh error:', error);
      toast.error('Failed to refresh balances');
    }
  }, [refetchUsdcBalance, refetchGeGoldBalance, refetchAllowance]);

  const handleMint = useCallback(async () => {
    if (!amount || !address) return;

    try {
      const amountToUse = parseUnits(amount, 6);
      
      // Check allowance
      if (!allowance || (allowance as bigint) < amountToUse) {
        setTransactionState({ status: 'approving' });
        approveContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [SYNTHETIC_GOLD_ADDRESS, amountToUse],
        });
      } else {
        setTransactionState({ status: 'minting' });
        mintContract({
          address: SYNTHETIC_GOLD_ADDRESS,
          abi: SYNTHETIC_GOLD_ABI,
          functionName: 'mint',
          args: [amountToUse],
        });
      }
    } catch (error) {
      console.error('Mint error:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => handleMint(), 2000);
      } else {
        setTransactionState({ 
          status: 'error', 
          errorMessage: 'Minting failed after retries'
        });
        toast.error('Minting failed. Please try again.');
        setRetryCount(0);
      }
    }
  }, [amount, address, allowance, approveContract, mintContract, retryCount]);

  const handleBurn = async () => {
    if (!amount) return;

    try {
      setTransactionState({ status: 'burning' });
      const amountToUse = parseUnits(amount, 18);
      
      burnContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'burn',
        args: [amountToUse],
      });
    } catch (error) {
      console.error('Burn error:', error);
      setTransactionState({ 
        status: 'error', 
        errorMessage: 'Burning failed'
      });
      toast.error('Burning failed. Please try again.');
    }
  };

  // Handle transaction states
  useEffect(() => {
    if (approveError) {
      setTransactionState({ 
        status: 'error', 
        errorMessage: 'Approval failed'
      });
      toast.error('Approval failed');
      setRetryCount(0);
    }

    if (isApproveSuccess) {
      setTransactionState({ status: 'minting' });
      mintContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'mint',
        args: [parseUnits(amount, 6)],
      });
    }

    if (mintError) {
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          mintContract({
            address: SYNTHETIC_GOLD_ADDRESS,
            abi: SYNTHETIC_GOLD_ABI,
            functionName: 'mint',
            args: [parseUnits(amount, 6)],
          });
        }, 2000);
      } else {
        setTransactionState({ 
          status: 'error', 
          errorMessage: 'Minting failed after retries'
        });
        toast.error('Minting failed');
        setRetryCount(0);
      }
    }

    if (isMintSuccess) {
      setTransactionState({ status: 'success' });
      toast.success('Successfully minted geGOLD!');
      setAmount('');
      refreshBalances();
    }

    if (burnError) {
      setTransactionState({ 
        status: 'error', 
        errorMessage: 'Burning failed'
      });
      toast.error('Burning failed');
    }

    if (isBurnSuccess) {
      setTransactionState({ status: 'success' });
      toast.success('Successfully burned geGOLD!');
      setAmount('');
      refreshBalances();
    }
  }, [
    approveError,
    isApproveSuccess,
    mintError,
    isMintSuccess,
    burnError,
    isBurnSuccess,
    amount,
    mintContract,
    retryCount,
    refreshBalances
  ]);

  // Reset amount on action change
  useEffect(() => {
    setAmount('');
    setTransactionState({ status: 'idle' });
    setRetryCount(0);
  }, [activeAction]);

  const handleAction = () => {
    if (activeAction === 'mint') {
      handleMint();
    } else {
      handleBurn();
    }
  };

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
    switch (transactionState.status) {
      case 'approving':
        return 'Approving USDC...';
      case 'minting':
        return 'Minting geGOLD...';
      case 'burning':
        return 'Burning geGOLD...';
      case 'error':
        return 'Retry';
      default:
        return activeAction === 'mint' ? 'Mint geGOLD' : 'Burn geGOLD';
    }
  };

  const isActionDisabled = () => {
    if (transactionState.status !== 'idle' && transactionState.status !== 'error') return true;
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
          className={`py-3 px-4 rounded-md font-bold transition-all duration-200 ${
            activeAction === 'mint'
              ? 'bg-[#00aa00] text-black'
              : 'bg-transparent text-[#00aa00] hover:bg-[#002200]'
          }`}
        >
          Mint
        </button>
        <button
          onClick={() => setActiveAction('burn')}
          className={`py-3 px-4 rounded-md font-bold transition-all duration-200 ${
            activeAction === 'burn'
              ? 'bg-[#00aa00] text-black'
              : 'bg-transparent text-[#00aa00] hover:bg-[#002200]'
          }`}
        >
          Burn
        </button>
      </div>

      <div className="bg-[#001800] p-6 rounded-lg border border-[#003300] mb-6">
        {transactionState.status !== 'idle' && transactionState.status !== 'success' && (
          <div className="mb-6 p-3 bg-[#003300] rounded-lg text-center">
            <p className="text-[#00cc00]">
              {transactionState.errorMessage || getButtonText()}
            </p>
            <div className="mt-2 w-full bg-[#004400] rounded-full h-1.5">
              <div className="bg-[#00aa00] h-1.5 rounded-full animate-pulse w-full"></div>
            </div>
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
              className="text-[#4d7cfe] hover:text-[#6e92ff] transition-colors"
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
              className="w-full text-3xl bg-transparent text-white border-none focus:outline-none focus:ring-0"
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
          onClick={handleAction}
          disabled={isActionDisabled()}
          className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-lg disabled:opacity-50 transition-all duration-200"
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