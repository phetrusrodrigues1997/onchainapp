import React from 'react';
import { useAccount, useChainId, useBalance } from 'wagmi';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Lending Pool ABI (subset based on USDCLendingPool.sol)
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
];

const LENDING_POOL_ADDRESS = '0x120E65560A5e4D510889EfA7cD36c8c302B858B7'; // Replace with actual address
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Replace with actual address

const LendingPool: React.FC = () => {
  const { address } = useAccount();
  const chainId = useChainId();

  // Read borrow limit from the lending pool contract
  const { data: borrowLimitData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'borrowLimit',
    args: [address as `0x${string}`],
    chainId,
  });

  // Read borrowed balance
  const { data: borrowedBalanceData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'borrowedBalance',
    args: [address as `0x${string}`],
    chainId,
  });

  // Check if the pool is paused
  const { data: isPausedData } = useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: lendingPoolABI,
    functionName: 'isPaused',
    chainId,
  });

  // Get USDC balance
  const { data: usdcBalanceData } = useBalance({
    address,
    token: USDC_ADDRESS,
    chainId,
  });

  // Write contract to borrow assets
  const { writeContract, data: txHash, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isTxLoading } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Type the data explicitly
  const borrowLimit = borrowLimitData ? BigInt(borrowLimitData.toString()) : BigInt(0);
  const borrowedBalance = borrowedBalanceData ? BigInt(borrowedBalanceData.toString()) : BigInt(0);
  const isPaused = Boolean(isPausedData);
  const usdcBalance = usdcBalanceData ? parseFloat(usdcBalanceData.formatted) : 0;

  // Borrow function
  const handleBorrow = () => {
    if (!address) return;
    const amount = parseUnits('100', 6); // Example: Borrow 100 USDC (6 decimals)
    writeContract({
      address: LENDING_POOL_ADDRESS,
      abi: lendingPoolABI,
      functionName: 'borrow',
      args: [amount],
    });
  };

  if (!address) {
    return <div>Please connect your wallet.</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Lending Pool</h1>
      <div className="mt-4">
        <p>Borrow Limit: {formatUnits(borrowLimit, 6)} USDC</p>
        <p>Borrowed Balance: {formatUnits(borrowedBalance, 6)} USDC</p>
        <p>USDC Balance: {usdcBalance.toFixed(2)} USDC</p>
        <p>Pool Paused: {isPaused ? 'Yes' : 'No'}</p>
      </div>
      <button
        onClick={handleBorrow}
        disabled={isPending || isTxLoading || isPaused}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {isPending || isTxLoading ? 'Borrowing...' : 'Borrow 100 USDC'}
      </button>
    </div>
  );
};

export default LendingPool;