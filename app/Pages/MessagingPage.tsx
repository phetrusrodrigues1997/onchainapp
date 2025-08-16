'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { 
  getAllMessages,
  getUnreadMessages,
  sendMessage,
  markAsRead,
  deleteMessage 
} from '../Database/actions';

interface Message {
  id: number;
  from: string;
  to: string;
  message: string;
  read: boolean;
  datetime: string;
}

interface MessagingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const MessagingPage = ({ setActiveSection }: MessagingPageProps) => {
  const { address, isConnected } = useAccount();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [newRecipient, setNewRecipient] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showNewMessage, setShowNewMessage] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const allMessages = await getAllMessages(address);
      setMessages(allMessages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      setStatus('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadMessages();
    }
  }, [address]);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setShowSidebar(true);
      } else if (!selectedConversation && !showNewMessage) {
        setShowSidebar(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedConversation, showNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  const getConversations = () => {
    const conversations = new Map<string, { 
      otherParty: string; 
      lastMessage: Message; 
      unreadCount: number; 
    }>();
    
    messages.forEach(msg => {
      const otherParty = msg.from === address ? msg.to : msg.from;
      const existing = conversations.get(otherParty);
      
      if (!existing || new Date(msg.datetime) > new Date(existing.lastMessage.datetime)) {
        const unreadCount = messages.filter(m => 
          m.from === otherParty && m.to === address && !m.read
        ).length;
        
        conversations.set(otherParty, {
          otherParty,
          lastMessage: msg,
          unreadCount
        });
      }
    });
    
    return Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastMessage.datetime).getTime() - new Date(a.lastMessage.datetime).getTime()
    );
  };

  const getConversationMessages = (otherParty: string) => {
    return messages
      .filter(msg => 
        (msg.from === address && msg.to === otherParty) ||
        (msg.from === otherParty && msg.to === address)
      )
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  };

  const handleSendMessage = async () => {
    if (!address || !newMessage.trim()) return;
    
    const recipient = selectedConversation || newRecipient;
    if (!recipient.trim()) {
      showStatus('Please enter a recipient address');
      return;
    }

    try {
      setLoading(true);
      const datetime = new Date().toISOString();
      
      await sendMessage(address, recipient.trim(), newMessage.trim(), datetime);
      
      setNewMessage('');
      setNewRecipient('');
      setShowNewMessage(false);
      
      await loadMessages();
      
      if (!selectedConversation) {
        setSelectedConversation(recipient.trim());
      }
      
      showStatus('Message sent');
    } catch (error) {
      console.error("Error sending message:", error);
      showStatus('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markAsRead(messageId);
      await loadMessages();
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-[#fdfdfd] flex items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-white text-2xl">💬</span>
          </div>
          <h1 className="text-3xl font-light text-black mb-4 tracking-tight">
            Messages
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Connect your wallet to send and receive messages
          </p>
        </div>
      </div>
    );
  }

  const conversations = getConversations();
  const conversationMessages = selectedConversation ? getConversationMessages(selectedConversation) : [];

  return (
    <div className="min-h-screen bg-[#fdfdfd]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setActiveSection('profile')}
                className="group inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors duration-200"
              >
                <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
                <span className="text-sm tracking-wide uppercase hidden sm:inline">Back</span>
              </button>
              
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden p-2 text-gray-500 hover:text-black transition-colors duration-200"
              >
                <span className="text-lg">☰</span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💬</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-light text-black tracking-tight">Messages</h1>
              </div>
            </div>
            
            <button
              onClick={() => setShowNewMessage(true)}
              className="bg-black text-white px-3 py-2 sm:px-4 hover:bg-gray-800 transition-colors duration-200"
            >
              <span className="text-sm tracking-wide uppercase">✚</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex relative h-[calc(100vh-80px)]">
        {/* Mobile overlay */}
        {showSidebar && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-5"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Conversations Sidebar */}
        <div className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:relative z-10 w-full sm:w-80 md:w-1/3 h-full border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out`}>
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-light text-black tracking-wide">Conversations</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden p-2 text-gray-500 hover:text-black transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            {loading && conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-4">No conversations yet</p>
                <button
                  onClick={() => {
                    setShowNewMessage(true);
                    setSelectedConversation('');
                    setShowSidebar(false); // Hide sidebar on mobile when starting new conversation
                  }}
                  className="text-black underline hover:text-[#0000fe] text-sm"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.otherParty}
                    onClick={() => {
                      setSelectedConversation(conv.otherParty);
                      setShowNewMessage(false);
                      setShowSidebar(false); // Hide sidebar on mobile when conversation is selected
                      // Mark messages as read
                      messages
                        .filter(m => m.from === conv.otherParty && m.to === address && !m.read)
                        .forEach(m => handleMarkAsRead(m.id));
                    }}
                    className={`w-full text-left p-4 border border-gray-200 hover:border-black transition-all duration-200 ${
                      selectedConversation === conv.otherParty ? 'bg-black text-white' : 'bg-white text-black'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-sm">
                        {formatAddress(conv.otherParty)}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          selectedConversation === conv.otherParty ? 'bg-white text-black' : 'bg-black text-white'
                        }`}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      selectedConversation === conv.otherParty ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {conv.lastMessage.message}
                    </p>
                    <span className={`text-xs ${
                      selectedConversation === conv.otherParty ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatTime(conv.lastMessage.datetime)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 w-full md:w-auto">
          {selectedConversation || showNewMessage ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Mobile back to conversations button */}
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="md:hidden p-2 text-gray-500 hover:text-black transition-colors duration-200"
                    >
                      ←
                    </button>
                    <div>
                      {showNewMessage ? (
                        <h3 className="text-lg font-light text-black tracking-wide">New Message</h3>
                      ) : (
                        <h3 className="text-lg font-light text-black tracking-wide">
                          {formatAddress(selectedConversation)}
                        </h3>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedConversation('');
                      setShowNewMessage(false);
                      setShowSidebar(true); // Show sidebar when closing chat on mobile
                    }}
                    className="text-gray-500 hover:text-black transition-colors duration-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {showNewMessage ? (
                  <div className="bg-white border border-gray-200 p-4 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2 tracking-wide uppercase">
                          Recipient Address
                        </label>
                        <input
                          type="text"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          placeholder="0x..."
                          className="w-full p-3 border border-gray-300 focus:border-black focus:outline-none transition-colors duration-200 font-mono text-sm text-black"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from === address ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 ${
                          msg.from === address
                            ? 'bg-black text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm text-black leading-relaxed">{msg.message}</p>
                        <span
                          className={`text-xs mt-1 block ${
                            msg.from === address ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(msg.datetime)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4 sm:p-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-3 text-black border border-gray-300 focus:border-black focus:outline-none transition-colors duration-200"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-black text-white px-4 sm:px-6 py-3 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <span className="text-sm tracking-wide uppercase">
                      {loading ? 'Sending...' : 'Send'}
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-600 text-2xl">💬</span>
                </div>
                <p className="text-gray-600 mb-4">Select a conversation to start messaging</p>
                <button
                  onClick={() => {
                    setShowNewMessage(true);
                    setSelectedConversation('');
                    setShowSidebar(false); // Hide sidebar on mobile when starting new conversation
                  }}
                  className="text-black underline hover:text-[#0000fe] text-sm tracking-wide uppercase"
                >
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 shadow-lg">
          <p className="text-sm tracking-wide">{status}</p>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;