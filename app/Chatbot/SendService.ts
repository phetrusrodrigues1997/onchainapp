// SendService.ts
// Service for handling token sending to wallet addresses

import { Token } from '@coinbase/onchainkit/token';
import { parseUnits } from 'viem';

// Interface for send result
interface SendResult {
  success: boolean;
  message: string;
  txHash?: string;
}

class SendService {
  /**
   * Execute a token send
   * @param token Token to send
   * @param amount Amount to send as string
   * @param recipient Recipient wallet address or username
   * @param walletAddress Sender's wallet address
   * @param executeSendFunction Function to execute the actual send transaction
   * @returns Promise with send result
   */
  async executeSend(
    token: Token,
    amount: string,
    recipient: string,
    walletAddress: string,
    executeSendFunction: (token: Token, amount: string, recipient: string) => Promise<boolean>
  ): Promise<SendResult> {
    try {
      // Validate inputs
      if (!token) {
        return {
          success: false,
          message: 'Invalid token specified for sending'
        };
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return {
          success: false,
          message: 'Invalid amount specified for sending'
        };
      }

      if (!recipient) {
        return {
          success: false,
          message: 'Invalid recipient address or username'
        };
      }

      if (!walletAddress) {
        return {
          success: false,
          message: 'Wallet not connected'
        };
      }

      // Execute the send using the provided function
      const success = await executeSendFunction(token, amount, recipient);

      if (success) {
        return {
          success: true,
          message: `Successfully initiated sending ${amount} ${token.symbol} to ${recipient}`
        };
      } else {
        return {
          success: false,
          message: `Send transaction failed. Please check your balance and try again.`
        };
      }
    } catch (error) {
      console.error('Send error:', error);
      return {
        success: false,
        message: `Send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Parse a natural language send request
   * @param text User's text input
   * @param availableTokens List of available tokens
   * @returns Parsed send parameters or null if not a valid send request
   */
  parseSendRequest(text: string, availableTokens: Token[]): { token: Token; amount: string; recipient: string } | null {
    // Different patterns to match send requests
    const patterns = [
      /send\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to)\s+([^\s]+)/i,  // "send 5 USDC to 0x123 or username"
      /transfer\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to)\s+([^\s]+)/i,  // "transfer 5 USDC to 0x123 or username"
      /(?:i\s+)?(?:want\s+to\s+)?(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to)\s+([^\s]+)/i  // "I want to send 5 USDC to 0x123 or username"
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [_, amountStr, tokenSymbol, recipient] = match;
        
        // Find token by symbol
        const token = availableTokens.find(t => 
          t.symbol.toLowerCase() === tokenSymbol.toLowerCase());
        
        if (token) {
          return {
            token,
            amount: amountStr,
            recipient: recipient.trim()
          };
        }
      }
    }

    return null;
  }

  /**
   * Format a send confirmation message
   * @param token Token to send
   * @param amount Amount to send
   * @param recipient Recipient address or username
   * @returns Formatted confirmation message
   */
  formatSendConfirmation(token: Token, amount: string, recipient: string): string {
    return `I'll help you send ${amount} ${token.symbol} to ${recipient}. Please confirm this transaction in your wallet.`;
  }

  /**
   * Check if a string is a valid Ethereum address
   * @param address Address to check
   * @returns True if valid, false otherwise
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

export default new SendService();
