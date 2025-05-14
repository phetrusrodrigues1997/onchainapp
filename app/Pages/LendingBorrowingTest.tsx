import React, { useState, useEffect } from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Lending Pool ABI (based on USDCLendingPool.sol)
const lendingPoolABI = [
  "function supply(uint256 _amount)",
  "function withdraw(uint256 _amount)",
  "function borrow(uint256 _amount)",
  "function repayBorrow(uint256 _amount)",
  "function suppliedBalances(address) view returns (uint256)",
  "function getBorrowedBalanceWithInterest(address) view returns (uint256)",
  "function getBorrowLimit(address) view returns (uint256)",
  "function getUtilizationRateBps() view returns (uint256)",
  "function getCurrentBorrowRateBps() view returns (uint256)",
  "function getCurrentSupplyRateBps() view returns (uint256)",
  "function paused() view returns (bool)",
] as const;

// ERC20 ABI for USDC
const erc20ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
] as const;

const LENDING_POOL_ADDRESS = '0x120E65560A5e4D510889EfA7cD36c8c302B858B7';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const BASE_CHAIN_ID = 8453; // Base network chain ID

const LendingPool: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  // State for input amounts and approval tracking
  const [supplyAmount, setSupplyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [approvalFor, setApprovalFor] = useState<'supply' | 'repay' | null>(null);
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(undefined);

  // Transaction receipt for approval
  const { data: approvalReceipt } = useWaitForTransactionReceipt({ hash: approvalHash });

  // Read USDC balance
  const { data: usdcBalanceData } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId,
  });
  const usdcBalance = usdcBalanceData ? parseFloat(usdcBalanceData.formatted) : 0;

  // Read supplied balance
  const { data: suppliedBalanceData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'suppliedBalances',
    args: [address as `0x${string}`],
    chainId,
  });
  const suppliedBalance = suppliedBalanceData ? BigInt(suppliedBalanceData.toString()) : BigInt(0);

  // Read borrowed balance with interest
  const { data: borrowedBalanceData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getBorrowedBalanceWithInterest',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowedBalance = borrowedBalanceData ? BigInt(borrowedBalanceData.toString()) : BigInt(0);

  // Read borrow limit
  const { data: borrowLimitData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'getBorrowLimit',
    args: [address as `0x${string}`],
    chainId,
  });
  const borrowLimit = borrowLimitData ? BigInt(borrowLimitData.toString()) : BigInt(0);

  // Read pool paused state
  const { data: isPausedData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'paused',
    chainId,
  });
  const isPaused = Boolean(isPausedData);

  // Read allowance for lending pool
  const { data: allowanceData } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, LENDING_POOL_ADDRESS],
    chainId,
  });
  const allowance = allowanceData ? BigInt(allowanceData.toString()) : BigInt(0);

  // Write contracts for each action
  const { writeContractAsync: approveAsync, isPending: isApproving } = useWriteContract();
  const { writeContractAsync: supplyAsync, isPending: isSupplying } = useWriteContract();
  const { writeContractAsync: withdrawAsync, isPending: isWithdrawing } = useWriteContract();
  const { writeContractAsync: borrowAsync, isPending: isBorrowing } = useWriteContract();
  const { writeContractAsync: repayAsync, isPending: isRepaying } = useWriteContract();

  // Helper to parse input amounts (USDC has 6 decimals)
  const parseAmount = (amount: string) => parseUnits(amount, 6);

  // Supply handler with approval
  const handleSupply = async () => {
    if (!supplyAmount || isNaN(Number(supplyAmount))) return;
    const amount = parseAmount(supplyAmount);
    if (allowance < amount) {
      try {
        setApprovalFor('supply');
        const hash: `0x${string}` = await approveAsync({
          address: USDC_ADDRESS,
          abi: erc20ABI,
          functionName: 'approve',
          args: [LENDING_POOL_ADDRESS, amount],
        });
        setApprovalHash(hash);
      } catch (error) {
        console.error('Approval failed:', error);
        setApprovalFor(null);
      }
    } else {
      try {
        await supplyAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'supply',
          args: [amount],
        });
        setSupplyAmount('');
      } catch (error) {
        console.error('Supply failed:', error);
      }
    }
  };

  // Withdraw handler
  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(Number(withdrawAmount))) return;
    const amount = parseAmount(withdrawAmount);
    try {
      await withdrawAsync({
        address: LENDING_POOL_ADDRESS,
        abi: lendingPoolABI,
        functionName: 'withdraw',
        args: [amount],
      });
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  // Borrow handler
  const handleBorrow = async () => {
    if (!borrowAmount || isNaN(Number(borrowAmount))) return;
    const amount = parseAmount(borrowAmount);
    try {
      await borrowAsync({
        address: LENDING_POOL_ADDRESS,
        abi: lendingPoolABI,
        functionName: 'borrow',
        args: [amount],
      });
      setBorrowAmount('');
    } catch (error) {
      console.error('Borrow failed:', error);
    }
  };

  // Repay handler with approval
  const handleRepay = async () => {
    if (!repayAmount || isNaN(Number(repayAmount))) return;
    const amount = parseAmount(repayAmount);
    if (allowance < amount) {
      try {
        setApprovalFor('repay');
        const hash: `0x${string}` = await approveAsync({
          address: USDC_ADDRESS,
          abi: erc20ABI,
          functionName: 'approve',
          args: [LENDING_POOL_ADDRESS, amount],
        });
        setApprovalHash(hash);
      } catch (error) {
        console.error('Approval failed:', error);
        setApprovalFor(null);
      }
    } else {
      try {
        await repayAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'repayBorrow',
          args: [amount],
        });
        setRepayAmount('');
      } catch (error) {
        console.error('Repay failed:', error);
      }
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
        })
          .then(() => {
            setSupplyAmount('');
            setApprovalFor(null);
            setApprovalHash(undefined);
          })
          .catch((error) => {
            console.error('Supply failed after approval:', error);
            setApprovalFor(null);
            setApprovalHash(undefined);
          });
      } else if (approvalFor === 'repay' && repayAmount) {
        repayAsync({
          address: LENDING_POOL_ADDRESS,
          abi: lendingPoolABI,
          functionName: 'repayBorrow',
          args: [parseAmount(repayAmount)],
        })
          .then(() => {
            setRepayAmount('');
            setApprovalFor(null);
            setApprovalHash(undefined);
          })
          .catch((error) => {
            console.error('Repay failed after approval:', error);
            setApprovalFor(null);
            setApprovalHash(undefined);
          });
      }
    }
  }, [approvalReceipt, approvalFor, supplyAmount, repayAmount, supplyAsync, repayAsync]);

  // Calculate available to borrow
  const availableToBorrow = borrowLimit > borrowedBalance ? formatUnits(borrowLimit - borrowedBalance, 6) : '0';

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

      {/* User Info */}
      <div className="mb-6">
        <p>Wallet: {address.slice(0, 6)}...{address.slice(-4)}</p>
        <p>USDC Balance: {usdcBalance.toFixed(2)} USDC</p>
        <p>Supplied: {formatUnits(suppliedBalance, 6)} USDC</p>
        <p>Borrowed: {formatUnits(borrowedBalance, 6)} USDC</p>
        <p>Borrow Limit: {formatUnits(borrowLimit, 6)} USDC</p>
        <p>Available to Borrow: {availableToBorrow} USDC</p>
      </div>

      {/* Supply */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Supply USDC</h2>
        <input
          type="number"
          value={supplyAmount}
          onChange={(e) => setSupplyAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2"
          disabled={isPaused || isApproving || isSupplying}
        />
        <button
          onClick={handleSupply}
          disabled={isPaused || isApproving || isSupplying || !supplyAmount}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isApproving ? 'Approving...' : isSupplying ? 'Supplying...' : 'Supply'}
        </button>
      </div>

      {/* Withdraw */}
      <div className="mb-4">
        <h2 className="text-xl mb-2">Withdraw USDC</h2>
        <input
          type="number"
          value={withdrawAmount}
          onChange={(e) => setWithdrawAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2"
          disabled={isPaused || isWithdrawing}
        />
        <button
          onClick={handleWithdraw}
          disabled={isPaused || isWithdrawing || !withdrawAmount || parseAmount(withdrawAmount) > suppliedBalance}
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
          onChange={(e) => setBorrowAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2"
          disabled={isPaused || isBorrowing}
        />
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
          className="border p-2 mr-2"
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
          disabled={isPaused || isApproving || isRepaying || !repayAmount}
          className="bg-blue-500 text-white p-2 rounded disabled:bg-gray-400"
        >
          {isApproving ? 'Approving...' : isRepaying ? 'Repaying...' : 'Repay'}
        </button>
      </div>
    </div>
  );
};

export default LendingPool;