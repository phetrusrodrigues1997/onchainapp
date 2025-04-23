import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const GoldTrades: React.FC = () => {
  const { address } = useAccount();
  const [usdcAmount, setUsdcAmount] = useState('');
  const [geGoldAmount, setGeGoldAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [refreshBalances, setRefreshBalances] = useState(0); // Counter to trigger balance refresh
  const [mintInProgress, setMintInProgress] = useState(false);

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
      // If approval was successful and we're in the mint process, proceed to mint
      handleMintAfterApproval();
    } else if (isApproveSuccess) {
      toast.success('USDC approved successfully!');
      setTransactionStatus('');
      refetchAllowance();
    }
    
    if (isMintSuccess) {
      toast.success('geGOLD minted successfully!');
      setTransactionStatus('');
      setUsdcAmount(''); // Clear input field
      setMintInProgress(false);
      setRefreshBalances(prev => prev + 1); // Trigger balance refresh
    }
    
    if (isBurnSuccess) {
      toast.success('geGOLD burned successfully!');
      setTransactionStatus('');
      setGeGoldAmount(''); // Clear input field
      setRefreshBalances(prev => prev + 1); // Trigger balance refresh
    }
  }, [isApproveSuccess, isMintSuccess, isBurnSuccess, mintInProgress]);

  // Refresh balances when transactions complete
  useEffect(() => {
    if (refreshBalances > 0) {
      refetchUsdcBalance();
      refetchGeGoldBalance();
      refetchAllowance();
    }
  }, [refreshBalances, refetchUsdcBalance, refetchGeGoldBalance, refetchAllowance]);

  const handleMintWithApprovalIfNeeded = async () => {
    if (!usdcAmount || !address) return;
    
    try {
      const amount = parseUnits(usdcAmount, 6); // USDC has 6 decimals
      
      // Check if we need to approve first
      if (!allowance || (allowance as bigint) < amount) {
        setTransactionStatus('Approving USDC...');
        setMintInProgress(true);
        
        approveContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: 'approve',
          args: [SYNTHETIC_GOLD_ADDRESS, amount],
        });
      } else {
        // Already approved, proceed directly to mint
        handleMintAfterApproval();
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setTransactionStatus('');
      setMintInProgress(false);
      toast.error('Transaction failed. Please try again.');
    }
  };

  const handleMintAfterApproval = () => {
    if (!usdcAmount) return;
    
    try {
      setTransactionStatus('Minting geGOLD...');
      const amount = parseUnits(usdcAmount, 6);
      
      mintContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'mint',
        args: [amount],
      });
    } catch (error) {
      console.error('Minting error:', error);
      setTransactionStatus('');
      setMintInProgress(false);
      toast.error('Minting failed. Please try again.');
    }
  };

  const handleBurn = async () => {
    if (!geGoldAmount) return;
    
    try {
      setTransactionStatus('Burning geGOLD...');
      const amount = parseUnits(geGoldAmount, 18); // geGOLD has 18 decimals
      
      burnContract({
        address: SYNTHETIC_GOLD_ADDRESS,
        abi: SYNTHETIC_GOLD_ABI,
        functionName: 'burn',
        args: [amount],
      });
    } catch (error) {
      console.error('Burning error:', error);
      setTransactionStatus('');
      toast.error('Burning failed. Please try again.');
    }
  };

  const hasEnoughGeGold = geGoldBalance && geGoldAmount && 
    (geGoldBalance as bigint) >= parseUnits(geGoldAmount, 18);

  // Calculate estimated geGOLD to receive based on USDC amount and price
  const estimatedGeGold = usdcAmount && goldPrice 
    ? parseFloat(usdcAmount) / parseFloat(formatUnits(goldPrice as bigint, 8))
    : 0;

  // Calculate estimated USDC to receive based on geGOLD amount and price
  const estimatedUsdc = geGoldAmount && goldPrice 
    ? parseFloat(geGoldAmount) * parseFloat(formatUnits(goldPrice as bigint, 8))
    : 0;

  return (
    <div className="bg-gradient-to-b from-[#002200] to-[#001100] p-8 rounded-xl shadow-2xl border border-[#004400] max-w-md mx-auto">
      {/* Toast Container for notifications */}
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
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#00dd00]">geGOLD Trading</h1>
        <div className="px-4 py-2 bg-[#003300] rounded-lg">
          <p className="text-sm text-[#00aa00]">
            Gold Price: {goldPrice ? `$${parseFloat(formatUnits(goldPrice as bigint, 8)).toFixed(2)}` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Status message */}
      {transactionStatus && (
        <div className="mb-6 p-3 bg-[#003300] rounded-lg text-center">
          <p className="text-[#00cc00]">{transactionStatus}</p>
          <div className="mt-2 w-full bg-[#004400] rounded-full h-1.5">
            <div className="bg-[#00aa00] h-1.5 rounded-full animate-pulse w-full"></div>
          </div>
        </div>
      )}

      {/* Mint Section */}
      <div className="mb-8 bg-[#001800] p-6 rounded-lg border border-[#003300]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🔨</span> Mint geGOLD
        </h2>
        <div className="mb-4">
          <label className="block text-[#00aa00] text-sm mb-1">USDC Amount</label>
          <div className="relative">
            <input
              type="number"
              value={usdcAmount}
              onChange={(e) => setUsdcAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 bg-[#002200] text-white border border-[#004400] rounded-md focus:border-[#00aa00] focus:ring-1 focus:ring-[#00aa00] outline-none"
            />
            <span className="absolute right-3 top-3 text-[#00aa00]">USDC</span>
          </div>
          {usdcAmount && (
            <p className="text-sm text-[#00aa00] mt-1">
              Estimated geGOLD: ~{estimatedGeGold.toFixed(8)}
            </p>
          )}
        </div>
        
        <button
          onClick={handleMintWithApprovalIfNeeded}
          disabled={!usdcAmount || isLoading}
          className="w-full p-3 bg-gradient-to-r from-[#00aa00] to-[#008800] hover:from-[#00cc00] hover:to-[#00aa00] text-black font-bold rounded-md disabled:opacity-50 transition-all duration-200"
        >
          {isApproveLoading ? 'Approving USDC...' : isMintLoading ? 'Minting geGOLD...' : 'Mint geGOLD'}
        </button>
      </div>

      {/* Burn Section */}
      <div className="mb-8 bg-[#001800] p-6 rounded-lg border border-[#003300]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <span className="mr-2">🔥</span> Burn geGOLD
        </h2>
        <div className="mb-4">
          <label className="block text-[#00aa00] text-sm mb-1">geGOLD Amount</label>
          <div className="relative">
            <input
              type="number"
              value={geGoldAmount}
              onChange={(e) => setGeGoldAmount(e.target.value)}
              placeholder="0.00000000"
              className="w-full p-3 bg-[#002200] text-white border border-[#004400] rounded-md focus:border-[#00aa00] focus:ring-1 focus:ring-[#00aa00] outline-none"
            />
            <span className="absolute right-3 top-3 text-[#00aa00]">geGOLD</span>
          </div>
          {geGoldAmount && (
            <p className="text-sm text-[#00aa00] mt-1">
              Estimated USDC: ~{estimatedUsdc.toFixed(6)}
            </p>
          )}
        </div>
        
        <button
          onClick={handleBurn}
          disabled={!geGoldAmount || !hasEnoughGeGold || isLoading}
          className="w-full p-3 bg-gradient-to-r from-[#00aa00] to-[#008800] hover:from-[#00cc00] hover:to-[#00aa00] text-black font-bold rounded-md disabled:opacity-50 transition-all duration-200"
        >
          {isBurnLoading ? 'Burning...' : 'Burn geGOLD'}
        </button>
      </div>

      {/* Balances */}
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
