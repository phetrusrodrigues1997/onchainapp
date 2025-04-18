import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faDove, faTimes, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from 'wagmi';
import { Token } from '@coinbase/onchainkit/token';
import SwapService from './SwapService';
import SendService from "./SendService";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ChatbotInterfaceProps {
  onSwapRequest: (fromToken: Token, toToken: Token, amount: string) => Promise<boolean>;
  onSendRequest: (token: Token, amount: string, recipient: string) => Promise<boolean>;
  availableTokens: Token[];
  userAddress?: string;
  apiKey: string;
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({
  onSwapRequest,
  onSendRequest,
  availableTokens,
  userAddress,
  apiKey
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you send tokens, check crypto prices, or answer any question you have about cryptocurrency and beyond. Try asking me to send 1 ETH, the price of bitcoin, or explain blockchain!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to handle sending messages to OpenAI API
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Check if this is a price query we can handle locally
      const priceMatch = inputMessage.toLowerCase().match(/(?:what(?:'s| is) the )?price (?:of |for )?([a-z\s]+)(?:\?)?/i);
      if (priceMatch) {
        const cryptoName = priceMatch[1].trim();
        try {
          // Import CryptoPriceService dynamically to avoid circular dependencies
          const CryptoPriceService = await import('./CryptoPriceService').then(module => module.default);
          const priceData = await CryptoPriceService.getPrice(cryptoName);
          
          if (priceData) {
            const priceMessage = CryptoPriceService.formatPriceMessage(cryptoName, priceData);
            const assistantMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: priceMessage,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error fetching price data:", error);
          // Continue with OpenAI if price fetch fails
        }
      }
      
      // Check if this is a send request we can handle locally
      const sendMatch = SendService.parseSendRequest(inputMessage, availableTokens);
      if (sendMatch) {
        const { token, amount, recipient } = sendMatch;
        
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: SendService.formatSendConfirmation(token, amount, recipient),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Add a processing message
        const processingMessage: ChatMessage = {
          id: Date.now().toString() + '-processing',
          role: 'system',
          content: `Processing send request...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);
        
        // Execute the send
        try {
          console.log(`Attempting to send ${amount} ${token.symbol} to ${recipient}`);
          const success = await onSendRequest(token, amount, recipient);
          
          // Replace the processing message with the result
          const resultMessage: ChatMessage = {
            id: Date.now().toString() + '-result',
            role: 'system',
            content: success 
              ? `✅ Send initiated: ${amount} ${token.symbol} to ${recipient}. Check your wallet for confirmation.`
              : `❌ Send failed. Please check your balance and try again.`,
            timestamp: new Date()
          };
          
          // Find and replace the processing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === processingMessage.id ? resultMessage : msg
            )
          );
        } catch (error) {
          console.error("Send execution error:", error);
          
          // Replace the processing message with the error
          const errorMessage: ChatMessage = {
            id: Date.now().toString() + '-error',
            role: 'system',
            content: `❌ Error executing send: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          };
          
          // Find and replace the processing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === processingMessage.id ? errorMessage : msg
            )
          );
        }
        
        setIsLoading(false);
        return;
      }
      
      // Check if this is a swap request we can handle locally
      const swapMatch = SwapService.parseSwapRequest(inputMessage, availableTokens);
      if (swapMatch) {
        const { fromToken, toToken, amount } = swapMatch;
        
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I'll help you swap ${amount} ${fromToken.symbol} to ${toToken.symbol}. Please confirm the transaction in your wallet when prompted.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Add a processing message
        const processingMessage: ChatMessage = {
          id: Date.now().toString() + '-processing',
          role: 'system',
          content: `Processing swap request...`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, processingMessage]);
        
        // Execute the swap
        try {
          console.log(`Attempting to swap ${amount} ${fromToken.symbol} to ${toToken.symbol}`);
          const success = await onSwapRequest(fromToken, toToken, amount);
          
          // Replace the processing message with the result
          const resultMessage: ChatMessage = {
            id: Date.now().toString() + '-result',
            role: 'system',
            content: success 
              ? `✅ Swap initiated: ${amount} ${fromToken.symbol} to ${toToken.symbol}. Check your wallet for confirmation.`
              : `❌ Swap failed. Please check your balance and try again.`,
            timestamp: new Date()
          };
          
          // Find and replace the processing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === processingMessage.id ? resultMessage : msg
            )
          );
        } catch (error) {
          console.error("Swap execution error:", error);
          
          // Replace the processing message with the error
          const errorMessage: ChatMessage = {
            id: Date.now().toString() + '-error',
            role: 'system',
            content: `❌ Error executing swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date()
          };
          
          // Find and replace the processing message
          setMessages(prev => 
            prev.map(msg => 
              msg.id === processingMessage.id ? errorMessage : msg
            )
          );
        }
        
        setIsLoading(false);
        return;
      }
      
      // Fallback to a simple response if API key is missing or invalid
      if (!apiKey || apiKey.trim() === '') {
        const fallbackMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I'm sorry, I can only perform sends, swaps, and price fetching without an API key. Try using these commands:\n\n" +
            "• For sending: 'send [amount] [token] to [address/username]'. Example: 'send 10 USDC to 0x123...' or 'send 5 ETH to username'\n" +
            "• For price queries: 'What's the price of Bitcoin?'",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);
        setIsLoading(false);
        return;
      }
      
      // Prepare context for the AI
      const systemPrompt = `You are GoldenEagle Assistant, a helpful assistant for a cryptocurrency application on the BASE blockchain. 
You can answer general questions about cryptocurrency, blockchain technology, or anything else the user asks. 
You can also assist with token sends.

Available tokens: ${availableTokens.map(t => t.symbol).join(', ')}

- If the user explicitly requests a token swap (e.g., "swap 10 USDC to ETH"), extract the source token, destination token, and amount, and format it as: SWAP_REQUEST:fromToken:toToken:amount
- If the user explicitly requests a token send (e.g., "send 5 ETH to 0x123"), extract the token, amount, and recipient (address or username), and format it as: SEND_REQUEST:token:amount:recipient
- Only use SWAP_REQUEST or SEND_REQUEST formats when the user clearly intends to perform these actions, not when asking for information (e.g., "How do I swap tokens?").
- If a request is incomplete (e.g., "swap some USDC"), respond with guidance like: "Please specify the amount and destination token, e.g., 'swap 10 USDC to ETH'."
- For other queries, provide concise, helpful, and informative responses.
- Note that swaps are not currently working on our website, so let the user know that this is a future feature.
- Use a friendly and professional tone, and keep responses concise unless the user asks for detailed explanations.`;
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: inputMessage }
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      let aiResponse = data.choices[0].message.content;
      
      // Check if the response contains a swap or send request
      if (aiResponse.includes('SWAP_REQUEST:')) {
        const swapMatch = aiResponse.match(/SWAP_REQUEST:([^:]+):([^:]+):([^:]+)/);
        if (swapMatch) {
          const [_, fromTokenSymbol, toTokenSymbol, amount] = swapMatch;
          const fromToken = availableTokens.find(t => t.symbol.toLowerCase() === fromTokenSymbol.toLowerCase().trim());
          const toToken = availableTokens.find(t => t.symbol.toLowerCase() === toTokenSymbol.toLowerCase().trim());
          
          if (fromToken && toToken) {
            // Remove the SWAP_REQUEST format from the displayed message
            aiResponse = aiResponse.replace(/SWAP_REQUEST:[^:]+:[^:]+:[^:]+/, 
              `I'll help you swap ${amount} ${fromToken.symbol} to ${toToken.symbol}. Please confirm the transaction in your wallet.`);
            
            // Add the AI response
            const assistantMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            // Add a processing message
            const processingMessage: ChatMessage = {
              id: Date.now().toString() + '-processing',
              role: 'system',
              content: `Processing swap request...`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, processingMessage]);
            
            // Execute the swap
            try {
              const success = await onSwapRequest(fromToken, toToken, amount);
              
              // Replace the processing message with the result
              const resultMessage: ChatMessage = {
                id: Date.now().toString() + '-result',
                role: 'system',
                content: success 
                  ? `✅ Swap initiated: ${amount} ${fromToken.symbol} to ${toToken.symbol}`
                  : `❌ Swap failed. Please check your balance and try again.`,
                timestamp: new Date()
              };
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === processingMessage.id ? resultMessage : msg
                )
              );
            } catch (error) {
              // Replace the processing message with the error
              const errorMessage: ChatMessage = {
                id: Date.now().toString() + '-error',
                role: 'system',
                content: `❌ Error executing swap: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
              };
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === processingMessage.id ? errorMessage : msg
                )
              );
            }
          } else {
            // Token not found
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `I couldn't find one of the tokens you mentioned. Available tokens are: ${availableTokens.map(t => t.symbol).join(', ')}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }
      } else if (aiResponse.includes('SEND_REQUEST:')) {
        const sendMatch = aiResponse.match(/SEND_REQUEST:([^:]+):([^:]+):([^:]+)/);
        if (sendMatch) {
          const [_, tokenSymbol, amount, recipient] = sendMatch;
          const token = availableTokens.find(t => t.symbol.toLowerCase() === tokenSymbol.toLowerCase().trim());
          
          if (token) {
            // Remove the SEND_REQUEST format from the displayed message
            aiResponse = aiResponse.replace(/SEND_REQUEST:[^:]+:[^:]+:[^:]+/, 
              `I'll help you send ${amount} ${token.symbol} to ${recipient}. Please confirm the transaction in your wallet.`);
            
            // Add the AI response
            const assistantMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            // Add a processing message
            const processingMessage: ChatMessage = {
              id: Date.now().toString() + '-processing',
              role: 'system',
              content: `Processing send request...`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, processingMessage]);
            
            // Execute the send
            try {
              const success = await onSendRequest(token, amount, recipient);
              
              // Replace the processing message with the result
              const resultMessage: ChatMessage = {
                id: Date.now().toString() + '-result',
                role: 'system',
                content: success 
                  ? `✅ Send initiated: ${amount} ${token.symbol} to ${recipient}`
                  : `❌ Send failed. Please check your balance and try again.`,
                timestamp: new Date()
              };
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === processingMessage.id ? resultMessage : msg
                )
              );
            } catch (error) {
              // Replace the processing message with the error
              const errorMessage: ChatMessage = {
                id: Date.now().toString() + '-error',
                role: 'system',
                content: `❌ Error executing send: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
              };
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === processingMessage.id ? errorMessage : msg
                )
              );
            }
          } else {
            // Token not found
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `I couldn't find that token. Available tokens are: ${availableTokens.map(t => t.symbol).join(', ')}`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }
      } else {
        // Regular response (not a swap or send)
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("API or processing error:", error);
      
      // Handle API errors with more user-friendly messages
      let errorContent = "I'm having trouble connecting to my services right now.";
      
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorContent = "I'm having trouble with my AI service connection. In the meantime, you can still use these commands:\n\n" +
            "• For price queries: 'What's the price of Bitcoin?'\n" +
            "• For swaps: 'Swap 5 USDC for ETH'\n" +
            "• For sends: 'Send 1 ETH to 0x123'";
        } else if (error.message.includes("401") || error.message.includes("403")) {
          errorContent = "There seems to be an authentication issue with my AI service. In the meantime, you can still use direct commands for swaps, sends, and price checks.";
        } else if (error.message.includes("429")) {
          errorContent = "I've reached my usage limit for the moment. Please try again in a few minutes, or use direct commands for swaps, sends, and price checks.";
        } else if (error.message.includes("timeout") || error.message.includes("network")) {
          errorContent = "I'm having network connectivity issues. Please check your connection and try again.";
        }
      }
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle pressing Enter to send message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#d3c81a] text-black font-bold rounded-full py-3 mt-4 transition-colors hover:bg-[#00aa00] cursor-pointer"
      >
        Try our AI agent
      </button>

      {/* Chat interface */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 sm:w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-lg shadow-xl flex flex-col z-40">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg flex items-center">
            <FontAwesomeIcon icon={faDove} className="text-[#d3c81a] mr-2" />
            <h3 className="text-white font-bold">GoldenEagle Assistant</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="ml-auto text-gray-400 hover:text-white"
              aria-label="Close chat"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 ${
                  message.role === 'user' 
                    ? 'ml-auto text-right' 
                    : message.role === 'system' 
                      ? 'mx-auto text-center' 
                      : 'mr-auto'
                }`}
              >
                <div 
                  className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-[#3B82F6] text-white' 
                      : message.role === 'system' 
                        ? 'bg-gray-700 text-gray-300 text-sm' 
                        : 'bg-gray-800 text-white'
                  }`}
                >
                  {message.content}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${
                  message.role === 'user' ? 'text-right' : message.role === 'system' ? 'text-center' : 'text-left'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mr-auto mb-4">
                <div className="bg-gray-800 text-white rounded-lg px-4 py-2 max-w-[80%] flex items-center">
                  <div className="dot-typing"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-lg">
            {!address ? (
              <div className="text-center text-yellow-500 text-sm mb-2">
                Connect your wallet to use swap and send functionality
              </div>
            ) : null}
            <div className="flex items-center">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about prices, send tokens, swap, or anything else..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="ml-2 bg-white text-black p-2 rounded-full hover:bg-[#d3c81a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for typing animation */}
      <style jsx>{`
        .dot-typing {
          position: relative;
          left: -9999px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: white;
          color: white;
          box-shadow: 9984px 0 0 0 white, 9999px 0 0 0 white, 10014px 0 0 0 white;
          animation: dot-typing 1.5s infinite linear;
        }

        @keyframes dot-typing {
          0% {
            box-shadow: 9984px 0 0 0 white, 9999px 0 0 0 white, 10014px 0 0 0 white;
          }
          16.667% {
            box-shadow: 9984px -10px 0 0 white, 9999px 0 0 0 white, 10014px 0 0 0 white;
          }
          33.333% {
            box-shadow: 9984px 0 0 0 white, 9999px 0 0 0 white, 10014px 0 0 0 white;
          }
          50% {
            box-shadow: 9984px 0 0 0 white, 9999px -10px 0 0 white, 10014px 0 0 0 white;
          }
          66.667% {
            box-shadow: 9984px 0 0 0 white, 9999px 0 0 0 white, 10014px 0 0 0 white;
          }
          83.333% {
            box-shadow: 9984px 0 0 0 white, 9999px 0 0 0 white, 10014px -10px 0 0 white;
          }
          100% {
            box-shadow: 9984px 0 0 0 white, 9999px 0 0 0 white, 10014px 0 0 0 white;
          }
        }
      `}</style>
    </>
  );
};

export default ChatbotInterface;