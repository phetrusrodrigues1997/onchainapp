// SwapService.ts
// Service for handling token swaps

import { Token } from '@coinbase/onchainkit/token';
import { parseUnits, formatUnits } from 'viem';

// Interface for swap result
interface SwapResult {
  success: boolean;
  message: string;
  txHash?: string;
}

class SwapService {
  /**
   * Execute a token swap
   * @param fromToken Source token
   * @param toToken Destination token
   * @param amount Amount to swap as string
   * @param walletAddress User's wallet address
   * @param executeSwapFunction Function to execute the actual swap transaction
   * @returns Promise with swap result
   */
  async executeSwap(
    fromToken: Token,
    toToken: Token,
    amount: string,
    walletAddress: string,
    executeSwapFunction: (from: Token, to: Token, amount: string) => Promise<boolean>
  ): Promise<SwapResult> {
    try {
      // Validate inputs
      if (!fromToken || !toToken) {
        return {
          success: false,
          message: 'Invalid tokens specified for swap'
        };
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return {
          success: false,
          message: 'Invalid amount specified for swap'
        };
      }

      if (!walletAddress) {
        return {
          success: false,
          message: 'Wallet not connected'
        };
      }

      // Execute the swap using the provided function
      const success = await executeSwapFunction(fromToken, toToken, amount);

      if (success) {
        return {
          success: true,
          message: `Successfully initiated swap of ${amount} ${fromToken.symbol} to ${toToken.symbol}`
        };
      } else {
        return {
          success: false,
          message: `Swap transaction failed. Please check your balance and try again.`
        };
      }
    } catch (error) {
      console.error('Swap error:', error);
      return {
        success: false,
        message: `Swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse a natural language swap request
   * @param text User's text input
   * @param availableTokens List of available tokens
   * @returns Parsed swap parameters or null if not a valid swap request
   */
  parseSwapRequest(text: string, availableTokens: Token[]): { fromToken: Token; toToken: Token; amount: string } | null {
    // Different patterns to match swap requests
    const patterns = [
      /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,  // "swap 5 USDC for ETH"
      /convert\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|into)\s+(\w+)/i,  // "convert 5 USDC to ETH"
      /exchange\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,  // "exchange 5 USDC for ETH"
      /(?:i\s+)?(?:want\s+to\s+)?(?:swap|convert|exchange)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to|into)\s+(\w+)/i  // "I want to swap 5 USDC for ETH"
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [_, amountStr, fromTokenSymbol, toTokenSymbol] = match;
        
        // Find tokens by symbol
        const fromToken = availableTokens.find(t => 
          t.symbol.toLowerCase() === fromTokenSymbol.toLowerCase());
        const toToken = availableTokens.find(t => 
          t.symbol.toLowerCase() === toTokenSymbol.toLowerCase());
        
        if (fromToken && toToken) {
          return {
            fromToken,
            toToken,
            amount: amountStr
          };
        }
      }
    }

    return null;
  }

  /**
   * Format a swap confirmation message
   * @param fromToken Source token
   * @param toToken Destination token
   * @param amount Amount to swap
   * @returns Formatted confirmation message
   */
  formatSwapConfirmation(fromToken: Token, toToken: Token, amount: string): string {
    return `I'll help you swap ${amount} ${fromToken.symbol} to ${toToken.symbol}. Please confirm this transaction in your wallet.`;
  }
}

export default new SwapService();
