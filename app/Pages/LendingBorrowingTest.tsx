import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CreditCard, DollarSign, TrendingUp, Zap } from 'lucide-react';

// Lending Pool ABI (unchanged)
const lendingPoolABI = [
  {
    "inputs": [{"name": "_amount", "type": "uint256"}],
    "name": "supply",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
  "inputs": [{"name": "", "type": "address"}],
  "name": "borrowMaturityTimestamp",
  "outputs": [{"name": "", "type": "uint256"}],
  "stateMutability": "view",
  "type": "function"
},
  {
    "inputs": [{"name": "_amount", "type": "uint256"}],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_amount", "type": "uint256"}],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "_amount", "type": "uint256"}],
    "name": "repayBorrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimInterest",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "suppliedBalances",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "getBorrowedBalanceWithInterest",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "getSuppliedBalanceWithInterest",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "getBorrowLimit",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "getAccountHealthFactor",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "name": "getUtilizationRateBps",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "name": "getCurrentBorrowRateBps",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "name": "getCurrentSupplyRateBps",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "name": "paused",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Supplied",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "principal", "type": "uint256"},
      {"indexed": false, "name": "interest", "type": "uint256"}
    ],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Borrowed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "Repaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "InterestClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "liquidator", "type": "address"},
      {"indexed": true, "name": "borrower", "type": "address"},
      {"indexed": false, "name": "debtAmount", "type": "uint256"},
      {"indexed": false, "name": "collateralSeizedAmount", "type": "uint256"}
    ],
    "name": "Liquidated",
    "type": "event"
  }
] as const;

// ERC-20 ABI (unchanged)
const erc20ABI = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "owner", "type": "address"},
      {"name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// TODO: Verify this is the correct deployed address
// const LENDING_POOL_ADDRESS = '0xBeC7B52CDc9A442cA5E8828c78720F06fd371b38';

const LENDING_POOL_ADDRESS = '0x607B1C95A3032E6578880Aea034cCf71bBb4D426';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_CHAIN_ID = 8453; // Base network chain ID

// Define event argument interfaces
interface SuppliedEventArgs {
  user: `0x${string}`;
  amount: bigint;
}

interface WithdrawnEventArgs {
  user: `0x${string}`;
  principal: bigint;
  interest: bigint;
}

interface BorrowedEventArgs {
  user: `0x${string}`;
  amount: bigint;
}

interface RepaidEventArgs {
  user: `0x${string}`;
  amount: bigint;
}

interface InterestClaimedEventArgs {
  user: `0x${string}`;
  amount: bigint;
}

interface LiquidatedEventArgs {
  liquidator: `0x${string}`;
  borrower: `0x${string}`;
  debtAmount: bigint;
  collateralSeizedAmount: bigint;
}

const LendingPool: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  // State for inputs and transaction tracking
  const [supplyAmount, setSupplyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [claimInterest, setClaimInterest] = useState(false);
  const [approvalFor, setApprovalFor] = useState<'supply' | 'repay' | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeAction, setActiveAction] = useState<'Supply' | 'Borrow' | 'Withdraw' | 'Repay'>('Supply');

  // Transaction receipt for approval
  const { data: approvalReceipt } = useWaitForTransactionReceipt({ hash: approvalHash });

  // Read USDC balance
  const { data: usdcBalanceData, isLoading: isLoadingUsdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId,
  });
  const usdcBalance = usdcBalanceData ? parseFloat(usdcBalanceData.formatted) : 0;

  // Read supplied balance with interest
  const { data: suppliedBalanceWithInterestData, isLoading: isLoadingSuppliedBalance } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getSuppliedBalanceWithInterest',
    args: [address as `0x${string}`],
    chainId,
  });
  const suppliedBalanceWithInterest = suppliedBalanceWithInterestData ? BigInt(suppliedBalanceWithInterestData.toString()) : BigInt(0);

  // Read principal supplied balance (for reference)
  const { data: suppliedBalanceData, isLoading: isLoadingSuppliedPrincipal } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'suppliedBalances',
    args: [address as `0x${string}`],
    chainId,
  });
  const suppliedBalance = suppliedBalanceData ? BigInt(suppliedBalanceData.toString()) : BigInt(0);

  // Read borrowed balance with interest
  const { data: borrowedBalanceData, isLoading: isLoadingBorrowedBalance } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getBorrowedBalanceWithInterest',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowedBalance = borrowedBalanceData ? BigInt(borrowedBalanceData.toString()) : BigInt(0);

  // Read borrow limit
  const { data: borrowLimitData, isLoading: isLoadingBorrowLimit } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getBorrowLimit',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowLimit = borrowLimitData ? BigInt(borrowLimitData.toString()) : BigInt(0);

  // Read account health factor
  const { data: healthFactorData, isLoading: isLoadingHealthFactor } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getAccountHealthFactor',
    args: [address as `0x${string}`],
    chainId,
  });
  const healthFactor = healthFactorData ? Number(healthFactorData) / 10000 : Infinity; // Convert BPS to ratio

  // Read pool paused state
  const { data: isPausedData, isLoading: isLoadingPaused } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'paused',
    chainId,
  });
  const isPaused = Boolean(isPausedData);

  // Read allowance for lending pool
  const { data: allowanceData, isLoading: isLoadingAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, LENDING_POOL_ADDRESS],
    chainId,
  });
  const allowance = allowanceData ? BigInt(allowanceData.toString()) : BigInt(0);

  // Read APY rates
  const { data: supplyRateBps, isLoading: isLoadingSupplyRate } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getCurrentSupplyRateBps',
    chainId,
  });
  const { data: borrowRateBps, isLoading: isLoadingBorrowRate } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getCurrentBorrowRateBps',
    chainId,
  });

  const supplyAPY = supplyRateBps ? (Number(supplyRateBps) / 100).toFixed(2) : '0.00';
  const borrowAPY = borrowRateBps ? (Number(borrowRateBps) / 100).toFixed(2) : '0.00';



// Read borrow maturity timestamp
const { data: borrowMaturityTimestampData, isLoading: isLoadingBorrowMaturity } = useReadContract({
  address: LENDING_POOL_ADDRESS,
  abi: lendingPoolABI,
  functionName: 'borrowMaturityTimestamp',
  args: [address as `0x${string}`],
  chainId,
});
const borrowMaturityTimestamp = borrowMaturityTimestampData ? Number(borrowMaturityTimestampData) : 0;

const formatTimeLeft = (maturityTimestamp: number) => {
  if (maturityTimestamp === 0) return 'No active loan';
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const timeLeftSeconds = maturityTimestamp - now;
  if (timeLeftSeconds <= 0) return 'Loan matured';
  
  const days = Math.floor(timeLeftSeconds / (24 * 3600));
  const hours = Math.floor((timeLeftSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((timeLeftSeconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
};
  // Write contracts for each action
  const { writeContractAsync: approveAsync, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: supplyAsync, isPending: isSupplying } = useWriteContract();
  const { writeContractAsync: withdrawAsync, isPending: isWithdrawing } = useWriteContract();
  const { writeContractAsync: borrowAsync, isPending: isBorrowing } = useWriteContract();
  const { writeContractAsync: repayAsync, isPending: isRepaying } = useWriteContract();
  const { writeContractAsync: claimInterestAsync, isPending: isClaimingInterest } = useWriteContract();


  // Handle loading state for contract reads
  useEffect(() => {
    const isLoading = (
      isLoadingUsdcBalance ||
      isLoadingSuppliedBalance ||
      isLoadingSuppliedPrincipal ||
      isLoadingBorrowedBalance ||
      isLoadingBorrowLimit ||
      isLoadingHealthFactor ||
      isLoadingPaused ||
      isLoadingAllowance ||
      isLoadingSupplyRate ||
      isLoadingBorrowRate ||
      isLoadingBorrowMaturity
      

    );
    setIsLoadingData(isLoading);
  }, [
    isLoadingUsdcBalance,
    isLoadingSuppliedBalance,
    isLoadingSuppliedPrincipal,
    isLoadingBorrowedBalance,
    isLoadingBorrowLimit,
    isLoadingHealthFactor,
    isLoadingPaused,
    isLoadingAllowance,
    isLoadingSupplyRate,
    isLoadingBorrowRate,
    isLoadingBorrowMaturity
  ]);

  // Helper to parse input amounts (USDC has 6 decimals)
  const parseAmount = (amount: string) => {
    try {
      return parseUnits(amount, 6);
    } catch (error) {
      return BigInt(0);
    }
  };

  // Parse contract errors for user-friendly messages
  const parseContractError = (error: any): string => {
    const message = error?.reason || error?.message || 'Unknown error';
    if (message.includes('Withdrawal leaves insufficient collateral')) {
      return 'Withdrawal amount too high: insufficient collateral to cover debt.';
    } else if (message.includes('Insufficient supplied balance')) {
      return 'Withdrawal amount exceeds your supplied balance.';
    } else if (message.includes('Borrow amount exceeds LTV limit')) {
      return 'Borrow amount exceeds your borrow limit.';
    } else if (message.includes('Insufficient liquidity in pool')) {
      return 'Not enough USDC available in the pool to borrow.';
    } else if (message.includes('No debt to repay')) {
      return 'You have no debt to repay.';
    } else if (message.includes('No interest to claim')) {
      return 'No interest available to claim.';
    } else if (message.includes('Contract is paused')) {
      return 'Contract is paused. Try again later.';
    }
    return `Transaction failed: ${message}`;
  };

  // Supply handler with approval
  const handleSupply = async () => {
    if (!supplyAmount || isNaN(Number(supplyAmount))) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    const amount = parseAmount(supplyAmount);
    if (amount === BigInt(0)) {
      setErrorMessage('Invalid amount');
      return;
    }
    if (allowance < amount) {
      try {
        setApprovalFor('supply');
        setIsWaitingForReceipt(true);
        setErrorMessage(null);
        const hash = await approveAsync({
          address: USDC_ADDRESS,
          abi: erc20ABI,
          functionName: 'approve',
          args: [LENDING_POOL_ADDRESS, amount],
        });
        setApprovalHash(hash);
      } catch (error: any) {
        setErrorMessage(parseContractError(error));
        setApprovalFor(null);
        setIsWaitingForReceipt(false);
      }
    } else {
      try {
        setErrorMessage(null);
        await supplyAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'supply',
          args: [amount],
          gas: BigInt(500000), // Increased gas limit for liquidation
        });
        setSupplyAmount('');
      } catch (error: any) {
        setErrorMessage(parseContractError(error));
      }
    }
  };

  // Withdraw handler
  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    const amount = parseAmount(withdrawAmount);
    if (amount === BigInt(0)) {
      setErrorMessage('Invalid amount');
      return;
    }
    try {
      setErrorMessage(null);
      await withdrawAsync({
        address: LENDING_POOL_ADDRESS,
        abi: lendingPoolABI,
        functionName: 'withdraw',
        args: [amount],
        gas: BigInt(500000), // Increased gas limit for liquidation
      });
      setWithdrawAmount('');
    } catch (error: any) {
      setErrorMessage(parseContractError(error));
    }
  };

  // Borrow handler
  const handleBorrow = async () => {
    if (!borrowAmount || isNaN(Number(borrowAmount))) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    const amount = parseAmount(borrowAmount);
    if (amount === BigInt(0)) {
      setErrorMessage('Invalid amount');
      return;
    }
    try {
      setErrorMessage(null);
      await borrowAsync({
        address: LENDING_POOL_ADDRESS,
        abi: lendingPoolABI,
        functionName: 'borrow',
        args: [amount],
        gas: BigInt(500000), // Increased gas limit for liquidation
      });
      setBorrowAmount('');
    } catch (error: any) {
      setErrorMessage(parseContractError(error));
    }
  };

  // Repay handler with approval
  const handleRepay = async () => {
    if (!repayAmount || isNaN(Number(repayAmount))) {
      setErrorMessage('Please enter a valid amount');
      return;
    }
    const amount = parseAmount(repayAmount);
    if (amount === BigInt(0)) {
      setErrorMessage('Invalid amount');
      return;
    }
    if (allowance < amount) {
      try {
        setApprovalFor('repay');
        setIsWaitingForReceipt(true);
        setErrorMessage(null);
        const hash = await approveAsync({
          address: USDC_ADDRESS,
          abi: erc20ABI,
          functionName: 'approve',
          args: [LENDING_POOL_ADDRESS, amount],
        });
        setApprovalHash(hash);
      } catch (error: any) {
        setErrorMessage(parseContractError(error));
        setApprovalFor(null);
        setIsWaitingForReceipt(false);
      }
    } else {
      try {
        setErrorMessage(null);
        await repayAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'repayBorrow',
          args: [amount],
          gas: BigInt(500000), // Increased gas limit for liquidation
        });
        setRepayAmount('');
      } catch (error: any) {
        setErrorMessage(parseContractError(error));
      }
    }
  };

  // Claim interest handler
  const handleClaimInterest = async () => {
    try {
      setErrorMessage(null);
      await claimInterestAsync({
        address: LENDING_POOL_ADDRESS,
        abi: lendingPoolABI,
        functionName: 'claimInterest',
        args: [],
        gas: BigInt(500000), // Increased gas limit for liquidation
      });
      setClaimInterest(false);
    } catch (error: any) {
      setErrorMessage(parseContractError(error));
    }
  };

  // Effect to handle actions after approval confirmation
  useEffect(() => {
    if (approvalReceipt && approvalFor) {
      if (approvalFor === 'supply' && supplyAmount) {
        supplyAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'supply',
          args: [parseAmount(supplyAmount)],
          gas: BigInt(500000),
        })
          .then(() => {
            setSupplyAmount('');
            setApprovalFor(null);
            setApprovalHash(undefined);
            setIsWaitingForReceipt(false);
            setErrorMessage(null);
          })
          .catch((error: any) => {
            setErrorMessage(parseContractError(error));
            setApprovalFor(null);
            setApprovalHash(undefined);
            setIsWaitingForReceipt(false);
          });
      } else if (approvalFor === 'repay' && repayAmount) {
        repayAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'repayBorrow',
          args: [parseAmount(repayAmount)],
          gas: BigInt(500000),
        })
          .then(() => {
            setRepayAmount('');
            setApprovalFor(null);
            setApprovalHash(undefined);
            setIsWaitingForReceipt(false);
            setErrorMessage(null);
          })
          .catch((error: any) => {
            setErrorMessage(parseContractError(error));
            setApprovalFor(null);
            setApprovalHash(undefined);
            setIsWaitingForReceipt(false);
          });
      }
    }
  }, [approvalReceipt, approvalFor, supplyAmount, repayAmount, supplyAsync, repayAsync]);

  // Calculate available to withdraw and borrow
  const availableToWithdraw = borrowedBalance > 0
    ? formatUnits(suppliedBalanceWithInterest > borrowedBalance ? suppliedBalanceWithInterest - borrowedBalance : BigInt(0), 6)
    : formatUnits(suppliedBalanceWithInterest, 6);
  const availableToBorrow = borrowLimit > borrowedBalance ? formatUnits(borrowLimit - borrowedBalance, 6) : '0';
  // Safely convert string to BigInt with 6 decimals


  if (!address) {
    return <div>Please connect your wallet.</div>;
  }

  if (chainId !== BASE_CHAIN_ID) {
    return <div>Please switch to the Base network (Chain ID: {BASE_CHAIN_ID}).</div>;
  }

   return (
    <div className="min-h-screen bg-gradient-to-tr from-purple-900 via-indigo-900 to-black text-white p-8">
      {/* <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          USDC Neon Lending
        </h1>
        <p className="mt-2 text-lg text-indigo-300">Future of decentralised finance</p>
      </header> */}

      <section className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-12">
        {/* APY Rates Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-4 shadow-lg hover:shadow-2xl transition-shadow">
          {/* <h2 className="text-xl font-semibold tracking-wide">Current Rates</h2> */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-indigo-300">Supply APY</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-green-300 to-green-500 bg-clip-text text-transparent">{supplyAPY}%</p>
            </div>
            <div>
              <p className="text-sm text-indigo-300">Borrow APY</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-red-300 to-red-500 bg-clip-text text-transparent">{borrowAPY}%</p>
            </div>
          </div>
        </div>
        {/* Wallet & Balances Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-4 shadow-lg hover:shadow-2xl transition-shadow">
          {/* <div className="flex items-center justify-between">
            <CreditCard size={24} />
            <span className="font-mono bg-gradient-to-r from-pink-500 to-yellow-300 bg-clip-text text-transparent">
              {address.slice(0,6)}...{address.slice(-4)}
            </span>
          </div> */}
          <div className="space-y-2">
           
        <p><DollarSign className="inline-block mr-2" />Supplied: {formatUnits(suppliedBalanceWithInterest, 6)} USDC</p>
        <p><DollarSign className="inline-block mr-2" />Borrowed: {formatUnits(borrowedBalance, 6)} USDC</p>
<br />
 <p><TrendingUp className="inline-block mr-2" />Health Factor: <span className={`font-bold ${healthFactor < 1.1 ? 'text-red-500' : 'text-green-300'}`}>{healthFactor === Infinity ? 'N/A' : healthFactor.toFixed(2)}</span></p>
          {borrowedBalance > BigInt(0) && (
  <p>
    <Zap className="inline-block mr-2" />
    Time to Maturity: {isLoadingBorrowMaturity ? 'Loading...' : formatTimeLeft(borrowMaturityTimestamp)}
  </p>
)}

          </div>
        </div>

        
      </section>

      <div className="p-6 text-white">
      {/* Action Selector Tabs */}
      <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
        {['Supply', 'Borrow', 'Withdraw', 'Repay'].map((action) => (
          <button
            key={action}
            onClick={() => setActiveAction(action as any)}
            className={`px-4 py-2 rounded-xl font-semibold tracking-wider transition-all ${
              activeAction === action
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Action Box Content */}
      <section className="max-w-md mx-auto">
        {activeAction === 'Supply' && (
          <div className="bg-gradient-to-bl from-indigo-800 to-purple-800 rounded-2xl p-6 shadow-xl">
  <h3 className="text-lg font-semibold mb-4">Supply USDC</h3>

  <input
          type="number"
          value={supplyAmount}
          onChange={(e) => setSupplyAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2 text-black"
          disabled={isPaused || isApproving || isSupplying}
        />
        <button
          onClick={handleSupply}
          disabled={isPaused || isApproving || isSupplying || !supplyAmount}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isApproving ? 'Approving...' : isSupplying ? 'Supplying...' : 'Supply'}
        </button>
        {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
</div>

        )}

        {activeAction === 'Borrow' && (
          <div className="bg-gradient-to-bl from-black via-indigo-900 to-black rounded-2xl p-6 shadow-xl">
  <h3 className="text-lg font-semibold mb-4">Borrow USDC</h3>

  <input
          type="number"
          value={borrowAmount}
          onChange={(e) => setBorrowAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2 text-black"
          disabled={isPaused || isBorrowing}
        />
        <button
          onClick={() => setBorrowAmount(availableToBorrow)}
          className="bg-gray-500 text-white p-2 mr-2 rounded"
          disabled={isPaused || isBorrowing}
        >
          Max
        </button>
        <button
          onClick={handleBorrow}
          disabled={isPaused || isBorrowing || !borrowAmount || parseAmount(borrowAmount) > (borrowLimit - borrowedBalance)}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isBorrowing ? 'Borrowing...' : 'Borrow'}
        </button>                                                                                                                                                              
</div>

        )}






        {activeAction === 'Withdraw' && (
          <div className="bg-gradient-to-tr from-black via-purple-900 to-black rounded-2xl p-6 shadow-xl">
  <h3 className="text-lg font-semibold mb-4">Withdraw USDC</h3>

 <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2 text-black"
          disabled={isPaused || isWithdrawing}
        />
        <button
          onClick={() => setWithdrawAmount(availableToWithdraw)}
          className="bg-gray-500 text-white p-2 mr-2 rounded"
          disabled={isPaused || isWithdrawing}
        >
          Max
        </button>
        <br />
        Available: {borrowedBalance > BigInt(0) ? '0.00' : availableToWithdraw} USDC
        <button
          onClick={handleWithdraw}
          disabled={isPaused || isWithdrawing || !withdrawAmount || parseAmount(withdrawAmount) > (suppliedBalanceWithInterest > borrowedBalance ? suppliedBalanceWithInterest - borrowedBalance : suppliedBalanceWithInterest)}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
        </button>
</div>
        )}










        {activeAction === 'Repay' && (
          <div className="bg-gradient-to-tr from-indigo-900 via-black to-indigo-900 rounded-2xl p-6 shadow-xl">
  <h3 className="text-lg font-semibold mb-4">Repay USDC</h3>

  <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} placeholder="Amount" className="border p-2 mr-2 text-black" disabled={isPaused || isApproving || isRepaying} /> <button onClick={() => setRepayAmount(formatUnits(borrowedBalance, 6))} className="bg-gray-500 text-white p-2 mr-2 rounded" disabled={isPaused || isApproving || isRepaying} > Max </button> <button onClick={handleRepay} disabled={isPaused || isApproving || isRepaying || !repayAmount || parseAmount(repayAmount) > parseUnits(usdcBalance.toString(), 6)} className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400" > {isApproving ? 'Approving...' : isRepaying ? 'Repaying...' : 'Repay'} </button> {isWaitingForReceipt && approvalFor === 'repay' && ( <p className="text-yellow-500 mt-2">Waiting for approval transaction to confirm...</p> )}
</div>
        )}
      </section>
    </div>

      {/* Claim Interest
      <footer className="mt-12 text-center">
        <button className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-2xl font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-shadow">
          Claim Accrued Interest
        </button>
      </footer> */}
    </div>
  );
};

export default LendingPool;