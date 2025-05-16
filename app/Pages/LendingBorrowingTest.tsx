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
  "inputs": [],
  "name": "totalReserves",
  "outputs": [{"name": "", "type": "uint256"}],
  "stateMutability": "view",
  "type": "function"
},
{
  "inputs": [],
  "name": "MIN_RESERVE_THRESHOLD",
  "outputs": [{"name": "", "type": "uint256"}],
  "stateMutability": "view",
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

const LENDING_POOL_ADDRESS = '0x0d6C351997Ec7dcFe260076B7177CC813E07BdEA';
const CADC_LENDING_POOL_ADDRESS = '0x5AB0479B9B895B922cFbb5a2F2BAB8D492d0E47D'; // CADC lending pool address
const MEXICAN_LENDING_POOL_ADDRESS = '0x135F4Fe385fDf6DEa41CB087834d121D7DAAbB52';
const BRZ_LENDING_POOL_ADDRESS = '0x0b80C0F199ef9A3F4f77105c3d64f09eaF573C1a'; // BRZ lending pool address
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const MXNe_ADDRESS = '0x269caE7Dc59803e5C596c95756faEeBb6030E0aF'; // MXNe token address
const BRZ_ADDRESS = '0xE9185Ee218cae427aF7B9764A011bb89FeA761B4'; // BRZ token address
const BASE_CHAIN_ID = 8453; // Base network chain ID

const tokenImages = {
    "ETH": "https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
    "WETH": "https://directus.messari.io/assets/12912b0f-3bae-4969-8ddd-99e654af2282",
    "AERO": "https://basescan.org/token/images/aerodrome_32.png",
    "VIRTUAL": "https://basescan.org/token/images/virtualprotocol_32.png",
    "BTC": "https://basescan.org/token/images/cbbtc_32.png",
    "AAVE": "https://basescan.org/token/images/aave_32.svg",
    "MORPHO": "https://basescan.org/token/images/morphoorg_new_32.png",
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
    "EURC": "https://coin-images.coingecko.com/coins/images/26045/large/euro.png?1696525125",
    "CADC": "https://www.svgrepo.com/show/405442/flag-for-flag-canada.svg",
    "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4": "https://www.svgrepo.com/show/401552/flag-for-brazil.svg",
    "LIRA": "https://www.svgrepo.com/show/242355/turkey.svg",
    "MXP": "https://www.svgrepo.com/show/401694/flag-for-mexico.svg",
  };

  const getAssetIcon = (asset: string | null) => {
    if (!asset) return 'default_icon.png';
    return tokenImages[asset as keyof typeof tokenImages] || 'default_icon.png';
  };

const LendingPool: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  // State for inputs and transaction tracking
  const [supplyAmount, setSupplyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [approvalFor, setApprovalFor] = useState<'supply' | 'repay' | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeAction, setActiveAction] = useState<'Supply' | 'Borrow' | 'Withdraw' | 'Repay'>('Supply');
  const actions = ['Supply', 'Borrow', 'Withdraw', 'Repay'] as const;
  // State for selected lending pool
  const [selectedPool, setSelectedPool] = useState(LENDING_POOL_ADDRESS);
  const tokenAddress = selectedPool === LENDING_POOL_ADDRESS
  ? USDC_ADDRESS
  : selectedPool === BRZ_LENDING_POOL_ADDRESS
    ? BRZ_ADDRESS
    : MXNe_ADDRESS;
  // Transaction receipt for approval
  const { data: approvalReceipt } = useWaitForTransactionReceipt({ hash: approvalHash });

  // Read USDC balance
  const { data: tokenBalanceData, isLoading: isLoadingTokenBalance } = useBalance({
    address,
    token: tokenAddress,
    chainId,
  });
  const tokenBalance = tokenBalanceData ? parseFloat(tokenBalanceData.formatted) : 0;

  // Read supplied balance with interest
  const { data: suppliedBalanceWithInterestData, isLoading: isLoadingSuppliedBalance } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'getSuppliedBalanceWithInterest',
    args: [address as `0x${string}`],
    chainId,
  });
  const suppliedBalanceWithInterest = suppliedBalanceWithInterestData ? BigInt(suppliedBalanceWithInterestData.toString()) : BigInt(0);

  // Read principal supplied balance (for reference)
  const { data: suppliedBalanceData, isLoading: isLoadingSuppliedPrincipal } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'suppliedBalances',
    args: [address as `0x${string}`],
    chainId,
  });
  const suppliedBalance = suppliedBalanceData ? BigInt(suppliedBalanceData.toString()) : BigInt(0);

  // Read borrowed balance with interest
  const { data: borrowedBalanceData, isLoading: isLoadingBorrowedBalance } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'getBorrowedBalanceWithInterest',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowedBalance = borrowedBalanceData ? BigInt(borrowedBalanceData.toString()) : BigInt(0);

  // Read borrow limit
  const { data: borrowLimitData, isLoading: isLoadingBorrowLimit } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'getBorrowLimit',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowLimit = borrowLimitData ? BigInt(borrowLimitData.toString()) : BigInt(0);

  // Read account health factor
  const { data: healthFactorData, isLoading: isLoadingHealthFactor } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'getAccountHealthFactor',
    args: [address as `0x${string}`],
    chainId,
  });
  const healthFactor = healthFactorData ? Number(healthFactorData) / 10000 : Infinity; // Convert BPS to ratio

  // Read pool paused state
  const { data: isPausedData, isLoading: isLoadingPaused } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'paused',
    chainId,
  });
  const isPaused = Boolean(isPausedData);

  const { data: allowanceData, isLoading: isLoadingAllowance } = useReadContract({
  address: tokenAddress,
  abi: erc20ABI,
  functionName: 'allowance',
  args: [address as `0x${string}`, selectedPool as `0x${string}`],
  chainId,
});
  const allowance = allowanceData ? BigInt(allowanceData.toString()) : BigInt(0);

  // Read APY rates
  const { data: supplyRateBps, isLoading: isLoadingSupplyRate } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'getCurrentSupplyRateBps',
    chainId,
  });
  const { data: borrowRateBps, isLoading: isLoadingBorrowRate } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'getCurrentBorrowRateBps',
    chainId,
  });

  const supplyAPY = supplyRateBps ? (Number(supplyRateBps) / 100).toFixed(2) : '0.00';
  const borrowAPY = borrowRateBps ? (Number(borrowRateBps) / 100).toFixed(2) : '0.00';

  // Read borrow maturity timestamp
  const { data: borrowMaturityTimestampData, isLoading: isLoadingBorrowMaturity } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'borrowMaturityTimestamp',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowMaturityTimestamp = borrowMaturityTimestampData ? Number(borrowMaturityTimestampData) : 0;

  const { data: totalReservesData, isLoading: isLoadingTotalReserves } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'totalReserves',
    chainId,
  });
  const { data: minReserveThresholdData, isLoading: isLoadingMinReserveThreshold } = useReadContract({
    address: selectedPool as `0x${string}`,
    abi: lendingPoolABI,
    functionName: 'MIN_RESERVE_THRESHOLD',
    chainId,
  });
  const decimals = tokenAddress === "0xE9185Ee218cae427aF7B9764A011bb89FeA761B4" ? 18 : 6;
  const totalReserves = totalReservesData ? Number(formatUnits(BigInt(totalReservesData.toString()), decimals)) : 0;
  const minReserveThreshold = minReserveThresholdData ? Number(formatUnits(BigInt(minReserveThresholdData.toString()), decimals)) : 0;

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
      isLoadingTokenBalance ||
      isLoadingSuppliedBalance ||
      isLoadingSuppliedPrincipal ||
      isLoadingBorrowedBalance ||
      isLoadingBorrowLimit ||
      isLoadingHealthFactor ||
      isLoadingPaused ||
      isLoadingAllowance ||
      isLoadingSupplyRate ||
      isLoadingBorrowRate ||
      isLoadingBorrowMaturity ||
      isLoadingMinReserveThreshold
    );
    setIsLoadingData(isLoading);
  }, [
    isLoadingTokenBalance,
    isLoadingSuppliedBalance,
    isLoadingSuppliedPrincipal,
    isLoadingBorrowedBalance,
    isLoadingBorrowLimit,
    isLoadingHealthFactor,
    isLoadingPaused,
    isLoadingAllowance,
    isLoadingSupplyRate,
    isLoadingBorrowRate,
    isLoadingBorrowMaturity,
    isLoadingMinReserveThreshold
  ]);

  const parseAmount = (amount: string, decimals: number) => {
  try {
    return parseUnits(amount, decimals);
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
    const amount = parseAmount(supplyAmount,decimals);
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
  address: tokenAddress,
  abi: erc20ABI,
  functionName: 'approve',
  args: [selectedPool as `0x${string}`, amount],
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
          address: selectedPool as `0x${string}`,
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
    const amount = parseAmount(withdrawAmount,decimals);
    if (amount === BigInt(0)) {
      setErrorMessage('Invalid amount');
      return;
    }
    try {
      setErrorMessage(null);
      await withdrawAsync({
        address: selectedPool as `0x${string}`,
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
    const amount = parseAmount(borrowAmount,decimals);
    if (amount === BigInt(0)) {
      setErrorMessage('Invalid amount');
      return;
    }
    try {
      setErrorMessage(null);
      await borrowAsync({
        address: selectedPool as `0x${string}`,
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
    const amount = parseAmount(repayAmount,decimals);
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
  address: tokenAddress,
  abi: erc20ABI,
  functionName: 'approve',
  args: [selectedPool as `0x${string}`, amount],
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
          address: selectedPool as `0x${string}`,
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

  

  // Effect to handle actions after approval confirmation
  useEffect(() => {
    if (approvalReceipt && approvalFor) {
      if (approvalFor === 'supply' && supplyAmount) {
        supplyAsync({
          address: selectedPool as `0x${string}`,
          abi: lendingPoolABI,
          functionName: 'supply',
          args: [parseAmount(supplyAmount,decimals)],
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
          address: selectedPool as `0x${string}`,
          abi: lendingPoolABI,
          functionName: 'repayBorrow',
          args: [parseAmount(repayAmount,decimals)],
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
    ? formatUnits(suppliedBalanceWithInterest > borrowedBalance ? suppliedBalanceWithInterest - borrowedBalance : BigInt(0), decimals)
    : formatUnits(suppliedBalanceWithInterest, decimals);
  const availableToBorrow = borrowLimit > borrowedBalance ? formatUnits(borrowLimit - borrowedBalance, decimals) : '0';

  // Calculate display string for health factor
  const rawHealth: number = healthFactor; // explicitly typed as number
  let hfDisplay: string;
  if (rawHealth === Infinity) {
    hfDisplay = 'N/A';
  } else {
    // Convert to numeric string then format
    const parsed = typeof rawHealth === 'number'
      ? rawHealth
      : parseFloat(String(rawHealth));
    // Cap extremely large values
    hfDisplay = parsed > 1e6 ? '>1e6' : parsed.toFixed(2);
  }


  if (!address) {
    return <div>Please connect your wallet.</div>;
  }

  if (chainId !== BASE_CHAIN_ID) {
    return <div>Please switch to the Base network (Chain ID: {BASE_CHAIN_ID}).</div>;
  }

  return (
    <div className="min-h-screen bg-white/5 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg p-8 text-white space-y-8">
      {/* Header */}
      <header className="flex flex-col items-center space-y-2">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-gray-400">Manage your positions seamlessly</p>
      </header>
<div className="flex justify-between items-center">
          <label className="text-white">Choose Pool:</label>
          <select
            value={selectedPool}
            onChange={(e) => setSelectedPool(e.target.value)}
            className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm px-4 py-2 rounded-md focus:outline-none"
          >
            <option value={LENDING_POOL_ADDRESS} className='bg-black'>USDC Pool</option>
            <option value={MEXICAN_LENDING_POOL_ADDRESS} className='bg-black'>MXNe Pool</option>
            <option value={BRZ_LENDING_POOL_ADDRESS} className='bg-black'>BRZ Pool</option>
          </select>
        </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-lg rounded-2xl p-6 flex flex-col space-y-4 shadow-lg hover:shadow-2xl transition-shadow">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-400">Supply APY</p>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">{supplyAPY}%</p>
            </div>
            <CreditCard size={32} className="text-green-400" />
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-400">Borrow APY</p>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">{borrowAPY}%</p>
            </div>
            <TrendingUp size={32} className="text-red-400" />
          </div>
        </div>
        <div className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-lg rounded-2xl p-6 flex flex-col space-y-4 shadow-lg hover:shadow-2xl transition-shadow">
          <div className="flex items-center space-x-2">
            <DollarSign size={24} className="text-blue-300" />
            <span>Supplied: <strong>{formatUnits(suppliedBalanceWithInterest, decimals)}</strong></span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign size={24} className="text-pink-300" />
            <span>Borrowed: <strong>{formatUnits(borrowedBalance, decimals)}</strong></span>
          </div>
           <div className="flex items-center space-x-2">
            <TrendingUp
              size={24}
              className={rawHealth < 1.1 ? 'text-red-300' : 'text-green-300'}
            />
            <span>
              Health: <strong>{hfDisplay}</strong>
            </span>
          </div>
          {borrowedBalance > 0 && (
            <div className="flex items-center space-x-2">
              <Zap size={24} className="text-yellow-300" />
              <span>Maturity: <strong>{formatTimeLeft(borrowMaturityTimestamp)}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <label className="text-white">Action:</label>
          <select
            value={activeAction}
            onChange={(e) => setActiveAction(e.target.value as any)}
            className="bg-gradient-to-b from-gray-900 to-black backdrop-blur-sm px-4 py-2 rounded-md focus:outline-none"
          >
            {actions.map(action => <option key={action} value={action} className='bg-black'>{action}</option>)}
          </select>
        </div>

        {/* Action Panel */}
        <div className={`bg-transparent rounded-2xl p-6 transform hover:scale-[1.02] transition-transform`}>
          <section className="max-w-md mx-auto">
          {activeAction === 'Supply' && (
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Supply</h3>
              <input
                type="number"
                value={supplyAmount}
                onChange={(e) => setSupplyAmount(e.target.value)}
                placeholder="Amount"
                className="bg-white/10 backdrop-blur-lg border border-cyan-400/20 shadow-green-400 text-white placeholder-white/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                disabled={isPaused || isApproving || isSupplying}
              />
              <button
                onClick={handleSupply}
                disabled={isPaused || isApproving || isSupplying || !supplyAmount}
                className="bg-blue-500 mt-5 ml-32 flex-1 text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center disabled:bg-gradient-to-r from-[#d3c81a] to-[#c4b918]"
              >
                {isApproving ? 'Approving...' : isSupplying ? 'Supplying...' : 'Supply'}
              </button>
              {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
            </div>
          )}

          {activeAction === 'Borrow' && (
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Borrow</h3>
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="Amount"
                className="bg-white/10 backdrop-blur-lg border border-cyan-400/20 shadow-green-400 text-white placeholder-white/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                disabled={isPaused || isBorrowing}
              />
              <div className="flex items-center space-x-2 mt-5">
  <button
    onClick={() => setBorrowAmount(availableToBorrow)}
    className="bg-[#ff0000] text-white p-2 rounded"
    disabled={isPaused || isBorrowing}
  >
    Max
  </button>
  <button
    onClick={handleBorrow}
    disabled={
      isPaused || isBorrowing || !borrowAmount || parseAmount(borrowAmount, decimals) > (borrowLimit - borrowedBalance)
    }
    className="bg-blue-500 flex-1 text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center disabled:bg-gradient-to-r from-[#d3c81a] to-[#c4b918]"
  >
    {isBorrowing ? 'Borrowing...' : 'Borrow'}
  </button>
</div>

            </div>
          )}

          {activeAction === 'Withdraw' && (
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Withdraw</h3>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount"
                className="bg-white/10 backdrop-blur-lg border border-cyan-400/20 shadow-green-400 text-white placeholder-white/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                disabled={isPaused || isWithdrawing}
              />
              <div className="flex items-center space-x-2 mt-5">
              <button
                onClick={() => setWithdrawAmount(availableToWithdraw)}
                className="bg-[#ff0000] text-white p-2 mr-2 rounded"
                disabled={isPaused || isWithdrawing}
              >
                Max
              </button>
              
              <button
                onClick={handleWithdraw}
                disabled={isPaused || isWithdrawing || !withdrawAmount || parseAmount(withdrawAmount,decimals) > (suppliedBalanceWithInterest > borrowedBalance ? suppliedBalanceWithInterest - borrowedBalance : suppliedBalanceWithInterest)}
                className="bg-blue-500 flex-1 text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center disabled:bg-gradient-to-r from-[#d3c81a] to-[#c4b918]"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
              </button>
              </div>
               <br />
              Available: {borrowedBalance > BigInt(0) ? '0.00' : availableToWithdraw}
            </div>
          )}

          {activeAction === 'Repay' && (
            <div className="bg-gradient-to-b from-gray-900 to-black rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Repay</h3>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="Amount"
                className="bg-white/10 backdrop-blur-lg border border-cyan-400/20 shadow-green-400 text-white placeholder-white/50 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                disabled={isPaused || isApproving || isRepaying}
              />
              <div className="flex items-center space-x-2 mt-5">
              <button
                onClick={() => setRepayAmount(formatUnits(borrowedBalance, decimals))}
                className="bg-[#ff0000] text-white p-2 mr-2 rounded"
                disabled={isPaused || isApproving || isRepaying}
              >
                Max
              </button>
              <button
                onClick={handleRepay}
                disabled={isPaused || isApproving || isRepaying || !repayAmount || parseAmount(repayAmount,decimals) > parseUnits(tokenBalance.toString(), decimals)}
                className="bg-blue-500 flex-1 text-black font-medium py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:from-[#e4d81b] hover:to-[#d5ca19] transition-all duration-300 flex items-center justify-center disabled:bg-gradient-to-r from-[#d3c81a] to-[#c4b918]"
              >
                {isApproving ? 'Approving...' : isRepaying ? 'Repaying...' : 'Repay'}
              </button>
              </div>
              {isWaitingForReceipt && approvalFor === 'repay' && (
                <p className="text-yellow-500 mt-2">Waiting for approval transaction to confirm...</p>
              )}
            </div>
          )}
        </section>
        </div>
      </div>
    </div>
  );
};

export default LendingPool;