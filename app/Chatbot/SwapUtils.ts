// SwapUtils.ts
// Utility functions for token swaps on Base blockchain

import { Token } from '@coinbase/onchainkit/token';
import { parseUnits, formatUnits, encodeFunctionData, Address } from 'viem';
import { createPublicClient, http, createWalletClient } from 'viem';
import { base } from 'viem/chains';

// Uniswap V3 Router ABI (simplified for the functions we need)
const UNISWAP_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenIn', type: 'address' },
          { internalType: 'address', name: 'tokenOut', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
          { internalType: 'uint256', name: 'amountOutMinimum', type: 'uint256' },
          { internalType: 'uint160', name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        internalType: 'struct ISwapRouter.ExactInputSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'exactInputSingle',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes[]', name: 'data', type: 'bytes[]' }
    ],
    name: 'multicall',
    outputs: [{ internalType: 'bytes[]', name: 'results', type: 'bytes[]' }],
    stateMutability: 'payable',
    type: 'function',
  }
];

// Quoter ABI for getting swap quotes
const QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'tokenIn', type: 'address' },
          { internalType: 'address', name: 'tokenOut', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
          { internalType: 'uint160', name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
        internalType: 'struct IQuoterV2.QuoteExactInputSingleParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'quoteExactInputSingle',
    outputs: [
      { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
      { internalType: 'uint160', name: 'sqrtPriceX96After', type: 'uint160' },
      { internalType: 'uint32', name: 'initializedTicksCrossed', type: 'uint32' },
      { internalType: 'uint256', name: 'gasEstimate', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// ERC20 ABI for token approvals
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'owner', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// Contract addresses on Base
const UNISWAP_ROUTER_ADDRESS = '0x2626664c2603336E57B271c5C0b26F421741e481'; // Uniswap V3 Router on Base
const QUOTER_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'; // Uniswap V3 Quoter on Base

// Common pool fees on Uniswap V3 (in basis points * 100)
const POOL_FEES = {
  LOWEST: 100,   // 0.01%
  LOW: 500,      // 0.05%
  MEDIUM: 3000,  // 0.3%
  HIGH: 10000    // 1%
};

// Create a public client for reading from the blockchain
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * Get a quote for a token swap
 * @param fromToken Source token
 * @param toToken Destination token
 * @param amount Amount to swap as string
 * @returns Promise with the expected output amount and gas estimate
 */
export const getSwapQuote = async (
  fromToken: Token,
  toToken: Token,
  amount: string
): Promise<{ amountOut: bigint, gasEstimate: bigint }> => {
  try {
    // Parse the input amount with the correct decimals
    const amountIn = parseUnits(amount, fromToken.decimals);
    
    // Try different fee tiers to find the best quote
    const feeTiers = [POOL_FEES.LOWEST, POOL_FEES.LOW, POOL_FEES.MEDIUM, POOL_FEES.HIGH];
    let bestQuote: { amountOut: bigint, gasEstimate: bigint } | null = null;
    
    for (const fee of feeTiers) {
      try {
        // Prepare the quote parameters
        const quoteParams = {
          tokenIn: fromToken.address as Address,
          tokenOut: toToken.address as Address,
          fee: fee,
          amountIn: amountIn,
          sqrtPriceLimitX96: BigInt(0), // No price limit
        };
        
        // Call the quoter contract
        const quoteResult = await publicClient.readContract({
          address: QUOTER_ADDRESS as Address,
          abi: QUOTER_ABI,
          functionName: 'quoteExactInputSingle',
          args: [quoteParams],
        });
        
        // Extract the quote data
        const [amountOut, _, __, gasEstimate] = quoteResult as [bigint, bigint, number, bigint];
        
        // Update the best quote if this is better
        if (!bestQuote || amountOut > bestQuote.amountOut) {
          bestQuote = { amountOut, gasEstimate };
        }
      } catch (error) {
        console.warn(`Failed to get quote for fee tier ${fee}:`, error);
        // Continue to try other fee tiers
      }
    }
    
    if (!bestQuote) {
      throw new Error('Could not find a valid pool for this token pair');
    }
    
    return bestQuote;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw new Error(`Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Calculate the minimum amount out based on slippage tolerance
 * @param amountOut Expected output amount
 * @param slippageTolerance Slippage tolerance percentage (e.g., 0.5 for 0.5%)
 * @returns Minimum amount out with slippage applied
 */
export const calculateAmountOutMinimum = (
  amountOut: bigint,
  slippageTolerance: number = 0.5
): bigint => {
  const slippageFactor = 100 - slippageTolerance;
  return (amountOut * BigInt(Math.floor(slippageFactor * 100))) / BigInt(10000);
};

/**
 * Prepare swap transaction data
 * @param fromToken Source token
 * @param toToken Destination token
 * @param amount Amount to swap as string
 * @param walletAddress User's wallet address
 * @returns Promise with the transaction data
 */
export const prepareSwapTransaction = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  walletAddress: string
): Promise<{
  to: Address,
  data: `0x${string}`,
  value: bigint,
  gasLimit: bigint
}> => {
  try {
    // Parse the input amount with the correct decimals
    const amountIn = parseUnits(amount, fromToken.decimals);
    
    // Get the best quote
    const { amountOut, gasEstimate } = await getSwapQuote(fromToken, toToken, amount);
    
    // Calculate minimum amount out with 0.5% slippage tolerance
    const amountOutMinimum = calculateAmountOutMinimum(amountOut, 0.5);
    
    // Calculate deadline (30 minutes from now)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60);
    
    // Prepare the swap parameters
    const swapParams = {
      tokenIn: fromToken.address as Address,
      tokenOut: toToken.address as Address,
      fee: POOL_FEES.MEDIUM, // Default to medium fee, could be optimized based on quote
      recipient: walletAddress as Address,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum,
      sqrtPriceLimitX96: BigInt(0), // No price limit
    };
    
    // Encode the function call
    const swapData = encodeFunctionData({
      abi: UNISWAP_ROUTER_ABI,
      functionName: 'exactInputSingle',
      args: [swapParams],
    });
    
    // Wrap in multicall for better compatibility
    const multicallData = encodeFunctionData({
      abi: UNISWAP_ROUTER_ABI,
      functionName: 'multicall',
      args: [[swapData]],
    });
    
    // Prepare the transaction
    return {
      to: UNISWAP_ROUTER_ADDRESS as Address,
      data: multicallData,
      value: fromToken.address === '' ? amountIn : BigInt(0), // If ETH is the input token, include value
      gasLimit: gasEstimate + BigInt(50000), // Add some buffer to the gas estimate
    };
  } catch (error) {
    console.error('Error preparing swap transaction:', error);
    throw new Error(`Failed to prepare swap transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check and approve token allowance if needed
 * @param tokenAddress Token address to approve
 * @param amount Amount to approve
 * @param walletAddress User's wallet address
 * @returns Promise with approval transaction hash if needed, or null if no approval needed
 */
export const checkAndApproveTokenAllowance = async (
  tokenAddress: string,
  amount: bigint,
  walletAddress: string
): Promise<string | null> => {
  try {
    // Native ETH doesn't need approval
    if (!tokenAddress || tokenAddress === '') {
      return null;
    }
    
    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [walletAddress as Address, UNISWAP_ROUTER_ADDRESS as Address],
    }) as bigint;
    
    // If allowance is sufficient, no need to approve
    if (currentAllowance >= amount) {
      return null;
    }
    
    // Prepare approval data
    const approvalData = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNISWAP_ROUTER_ADDRESS as Address, amount],
    });
    
    // Return the approval transaction data
    return approvalData;
  } catch (error) {
    console.error('Error checking token allowance:', error);
    throw new Error(`Failed to check token allowance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
