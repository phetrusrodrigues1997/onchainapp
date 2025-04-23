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

const GoldTrades: React.FC = () => {
  const { address } = useAccount();
  const [activeAction, setActiveAction] = useState<ActionType>('mint');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [mintInProgress, setMintInProgress] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Hooks for writing to contracts
  const { writeContract: approveContract, isPending: isApproving, data: approveHash } = useWriteContract();
  const { writeContract: mintContract, isPending: isMinting, data: mintHash } = useWriteContract();
  const { writeContract: burnContract, isPending: isBurning, data: burnHash } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isMintLoading, isSuccess: isMintSuccess } = 
    useWaitForTransactionReceipt({ hash: mintHash });
  const { isLoading: isBurnLoading, isSuccess: isBurnSuccess } = 
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
      refetchInterval: false,
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
      refetchInterval: false,
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
      refetchInterval: false,
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

  // Update loading state based on transaction status
  useEffect(() => {
    setIsLoading(isApproving || isMinting || isBurning || isApproveLoading || isMintLoading || isBurnLoading);
  }, [isApproving, isMinting, isBurning, isApproveLoading, isMintLoading, isBurnLoading]);

  // Handle transaction success and refresh balances
  useEffect(() => {
    if (isApproveSuccess && mintInProgress) {
      console.log('Approval successful, proceeding to mint. Hash:', approveHash);
      handleMintAfterApproval();
    } else if (isApproveSuccess) {
      console.log('Approval completed standalone. Hash:', approveHash);
      toast.success('USDC approved successfully!');
      setTransactionStatus('');
      setShouldRefresh(true);
    }
    
    if (isMintSuccess) {
      

      console.log('Mint successful. Hash:', mintHash);
      toast.success('geGOLD minted successfully! Transaction complete.');
      setTransactionStatus('');
      setAmount('');
      setMintInProgress(false);
      setShouldRefresh(true);
      setIsLoading(false);
      
    }
    
    if (isBurnSuccess) {
      console.log('Burn successful. Hash:', burnHash);
      toast.success('geGOLD burned successfully!');
      setTransactionStatus('');
      setAmount('');
      setShouldRefresh(true);
    }
  }, [isApproveSuccess, isMintSuccess, isBurnSuccess, mintInProgress, approveHash, mintHash, burnHash]);

  // Refresh balances when needed, with debouncing
  useEffect(() => {
    if (shouldRefresh) {
      const refreshTimeout = setTimeout(() => {
        Promise.all([
          refetchUsdcBalance(),
          refetchGeGoldBalance(),
          refetchAllowance(),
        ])
          .then(() => {
            setShouldRefresh(false);
          })
          .catch((error) => {
            console.error('Balance refresh error:', error);
            setShouldRefresh(false);
          });
      }, 500);

      return () => clearTimeout(refreshTimeout);
    }
  }, [shouldRefresh, refetchUsdcBalance, refetchGeGoldBalance, refetchAllowance]);

  // Clear amount when switching between mint and burn
  useEffect(() => {
    setAmount('');
  }, [activeAction]);

  const handleMintWithApprovalIfNeeded = async () => {
    if (!amount || !address) return;
    
    try {
      const amountToUse = parseUnits(amount, 6);
      
      if (!allowance || (allowance as bigint) < amountToUse) {
        setTransactionStatus('Approving USDC...');
        setMintInProgress(true);
        
        console.log('Initiating approval for amount:', amountToUse.toString());
        approveContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [SYNTHETIC_GOLD_ADDRESS, amountToUse],
        });
      } else {
        handleMintAfterApproval();
      }
    } catch (error) {
      console.error('Approval error:', error);
      setTransactionStatus('');
      setMintInProgress(false);
      toast.error('Approval failed. Please try again.');
    }
  };

  const handleMintAfterApproval = () => {
    if (!amount) return;
    
    try {
      setTransactionStatus('Minting geGOLD...');
      const amountToUse = parseUnits(amount, 6);
      
      console.log('Initiating mint for amount:', amountToUse.toString());
      mintContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'mint',
        args: [amountToUse],
      });
      let refreshTimeout: NodeJS.Timeout;
      let counter = 0;
      // Start the counter and set the refresh timeout
    refreshTimeout = setInterval(() => {
      counter++;
      console.log(`Refreshing in ${18 - counter} seconds...`);
      if (counter >= 18) {
        window.location.reload();
        clearInterval(refreshTimeout); // Clear the interval after refreshing
      }
    }, 1000);

    // Clean up the interval if the component unmounts or isApproveSuccess changes
    return () => {
      clearInterval(refreshTimeout);
    };
    } catch (error) {
      console.error('Minting error:', error);
      setTransactionStatus('');
      setMintInProgress(false);
      toast.error('Minting failed. Please try again.');
    }
  };

  const handleBurn = async () => {
    if (!amount) return;
    
    try {
      setTransactionStatus('Burning geGOLD...');
      const amountToUse = parseUnits(amount, 18);
      
      burnContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'burn',
        args: [amountToUse],
      });
    } catch (error) {
      console.error('Burning error:', error);
      setTransactionStatus('');
      toast.error('Burning failed. Please try again.');
    }
  };

  const handleAction = () => {
    if (activeAction === 'mint') {
      handleMintWithApprovalIfNeeded();
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
    if (isApproveLoading) return 'Approving USDC...';
    if (isMintLoading) return 'Minting geGOLD...';
    if (isBurnLoading) return 'Burning geGOLD...';
    return activeAction === 'mint' ? 'Mint geGOLD' : 'Burn geGOLD';
  };

  const isActionDisabled = () => {
    if (isLoading) return true;
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
        {transactionStatus && (
          <div className="mb-6 p-3 bg-[#003300] rounded-lg text-center">
            <p className="text-[#00cc00]">{transactionStatus}</p>
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