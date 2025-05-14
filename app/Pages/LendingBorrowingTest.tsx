import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Log } from 'viem';

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
const LENDING_POOL_ADDRESS = '0x1F43458aa8Cc759fDf999Cb4714A5BF01Db753a5';
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
      isLoadingBorrowRate
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
  const accruedInterest = formatUnits(
    suppliedBalanceWithInterest > suppliedBalance ? suppliedBalanceWithInterest - suppliedBalance : BigInt(0),
    6
  );

  if (!address) {
    return <div>Please connect your wallet.</div>;
  }

  if (chainId !== BASE_CHAIN_ID) {
    return <div>Please switch to the Base network (Chain ID: {BASE_CHAIN_ID}).</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">USDC Lending Pool</h1>
      {isPaused && <p className="text-red-500 mb-4">Contract is paused. Interactions are disabled.</p>}
      {isLoadingData && <p className="text-yellow-500 mb-4">Loading data...</p>}

      {/* User Info with APY and Health Factor */}
      <div className="mb-6">
        <p>Wallet: {address.slice(0, 6)}...{address.slice(-4)}</p>
        <p>USDC Balance: {usdcBalance.toFixed(2)} USDC</p>
        <p>Supplied (Principal): {formatUnits(suppliedBalance, 6)} USDC</p>
        <p>Accrued Interest: {accruedInterest} USDC</p>
        <p>Total Supplied (with Interest): {formatUnits(suppliedBalanceWithInterest, 6)} USDC</p>
        <p>Available to Withdraw: {availableToWithdraw} USDC</p>
        <p>Borrowed: {formatUnits(borrowedBalance, 6)} USDC</p>
        <p>Borrow Limit: {formatUnits(borrowLimit, 6)} USDC</p>
        <p>Available to Borrow: {availableToBorrow} USDC</p>
        <p>Health Factor: {healthFactor === Infinity ? 'N/A' : healthFactor.toFixed(2)} {healthFactor < 1.1 && healthFactor !== Infinity && <span className="text-red-500">(At risk of liquidation)</span>}</p>
        <p>Current Supply APY: {supplyAPY}%</p>
        <p>Current Borrow APY: {borrowAPY}%</p>
        <p className="text-yellow-500 mt-2">Note: Transactions may have higher gas costs due to automated liquidation of up to 5 borrowers.</p>
      </div>

      {/* Supply */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Supply USDC</h2>
        <input
          type="number"
          value={supplyAmount}
          onChange={(e) => setSupplyAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2 text-black"
          disabled={isPaused || isApproving || isSupplying}
        />
        <button
          onClick={() => setSupplyAmount(usdcBalance.toFixed(6))}
          className="bg-gray-500 text-white p-2 mr-2 rounded"
          disabled={isPaused || isApproving || isSupplying}
        >
          Max
        </button>
        <button
          onClick={handleSupply}
          disabled={isPaused || isApproving || isSupplying || !supplyAmount || parseAmount(supplyAmount) > parseUnits(usdcBalance.toString(), 6)}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isApproving ? 'Approving...' : isSupplying ? 'Supplying...' : 'Supply'}
        </button>
        {isWaitingForReceipt && approvalFor === 'supply' && (
          <p className="text-yellow-500 mt-2">Waiting for approval transaction to confirm...</p>
        )}
      </div>

      {/* Withdraw */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Withdraw USDC</h2>
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
        <button
          onClick={handleWithdraw}
          disabled={isPaused || isWithdrawing || !withdrawAmount || parseAmount(withdrawAmount) > (suppliedBalanceWithInterest > borrowedBalance ? suppliedBalanceWithInterest - borrowedBalance : suppliedBalanceWithInterest)}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
        </button>
      </div>

      {/* Borrow */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Borrow USDC</h2>
        <input
          type="number"
          value={borrowAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
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

      {/* Repay */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Repay USDC</h2>
        <input
          type="number"
          value={repayAmount}
          onChange={(e) => setRepayAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2 text-black"
          disabled={isPaused || isApproving || isRepaying}
        />
        <button
          onClick={() => setRepayAmount(formatUnits(borrowedBalance, 6))}
          className="bg-gray-500 text-white p-2 mr-2 rounded"
          disabled={isPaused || isApproving || isRepaying}
        >
          Max
        </button>
        <button
          onClick={handleRepay}
          disabled={isPaused || isApproving || isRepaying || !repayAmount || parseAmount(repayAmount) > parseUnits(usdcBalance.toString(), 6)}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isApproving ? 'Approving...' : isRepaying ? 'Repaying...' : 'Repay'}
        </button>
        {isWaitingForReceipt && approvalFor === 'repay' && (
          <p className="text-yellow-500 mt-2">Waiting for approval transaction to confirm...</p>
        )}
      </div>

      {/* Claim Interest */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Claim Interest</h2>
        <button
          onClick={handleClaimInterest}
          disabled={isPaused || isClaimingInterest || Number(accruedInterest) <= 0}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isClaimingInterest ? 'Claiming...' : 'Claim Interest'}
        </button>
      </div>

      {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
    </div>
  );
};

export default LendingPool;