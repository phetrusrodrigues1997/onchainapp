'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  createMessage,
  getUnreadMessages,
  getUsername,
  updateMessageReadStatus,
  getWalletAddress,
  deleteMessage
} from '../Database/actions';

export default function MessagesPage() {
  // State variables
  const [showForm, setShowForm] = useState(false);
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage] = useState(6);
  const [replyMode, setReplyMode] = useState(false);
  const [categories] = useState(['All', 'Read', 'Unread']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isDeleting, setIsDeleting] = useState(false);
  const { address } = useAccount();

  // Helper
  const shortenAddress = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-4)}` : '';

  // Fetch messages
  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      if (!address) return setIsLoading(false);
      try {
        const username = await getUsername(address);
        const inboxA = await getUnreadMessages(address);
        const inboxB = username ? await getUnreadMessages(username) : [];
        const all = [...inboxA, ...inboxB];
        all.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
        setMessages(all);
      } catch {
        setError('Failed to load messages.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [address]);

  const formattedDate = () => new Date().toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  // Send
  const handleSend = async () => {
    setError(null);
    if (!address) return setError('Connect wallet.');
    if (!to.trim() || !message.trim()) return setError('Complete all fields.');
    setIsLoading(true);
    try {
      let recipient = to.trim();
      if (!recipient.startsWith('0x')) {
        const resolved = await getWalletAddress(recipient);
        if (!resolved) throw new Error('User not found');
        recipient = resolved;
      }
      await createMessage(address, recipient, message.trim(), formattedDate());
      setSuccess('Message sent!');
      setShowForm(false);
      setReplyMode(false);
      // refresh
      const username = await getUsername(address);
      const inboxA = await getUnreadMessages(address);
      const inboxB = username ? await getUnreadMessages(username) : [];
      const all = [...inboxA, ...inboxB];
      all.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      setMessages(all);
    } catch (err) {
      setError('Failed to send.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await deleteMessage(id);
      setMessages(messages.filter(m => m.id !== id));
      setSelectedMsg((prev: any | null) => prev?.id === id ? null : prev);
      setSuccess('Deleted!');
    } catch {
      setError('Delete failed.');
    } finally {
      setIsDeleting(false);
    }
  };
  const [usernameMap, setUsernameMap] = useState<{[key: string]: string | null}>({});

  useEffect(() => {
    async function loadUsernames() {
      const addressMap: {[key: string]: string | null} = {};
      
      // Create a unique list of addresses to look up
      const uniqueAddresses = Array.from(new Set(messages.map(m => m.from)));
      
      // Fetch all usernames in parallel
      const promises = uniqueAddresses.map(async (address) => {
        try {
          const username = await getUsername(address);
          addressMap[address] = username;
        } catch (error) {
          addressMap[address] = null;
        }
      });
      
      await Promise.all(promises);
      setUsernameMap(addressMap);
    }
    
    if (messages.length > 0) {
      loadUsernames();
    }
  }, [messages]);

  // Mark read
  const handleMarkAsRead = async (id: number) => {
    try {
      await updateMessageReadStatus(id);
      setMessages(messages.map(m => m.id === id ? { ...m, read: true } : m));
      if (selectedMsg?.id === id) setSelectedMsg({ ...selectedMsg, read: true });
    } catch {}
  };

  // Reply
  const handleReply = (msg: any) => {
    setReplyMode(true);
    setShowForm(true);
    setTo(msg.from);
    setMessage(`Re: ${msg.message.slice(0,30)}${msg.message.length>30?'...':''}\n\n`);
  };

  // Filter & paginate
  const filtered = messages.filter(m => {
    const text = searchTerm.toLowerCase();
    const hit = m.message?.toLowerCase().includes(text)
      || m.from?.toLowerCase().includes(text)
      || m.to?.toLowerCase().includes(text);
    if (selectedCategory==='All') return hit;
    if (selectedCategory==='Read') return hit && m.read;
    return hit && !m.read;
  });
  const last = currentPage * messagesPerPage;
  const first = last - messagesPerPage;
  const pageMsgs = filtered.slice(first, last);
  const total = Math.ceil(filtered.length / messagesPerPage);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">

      {/* Header */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Your Messages</h2>
          {!showForm && (
            
            <button
            onClick={() => { setShowForm(true); setReplyMode(false); }}
      className="bg-white hover:bg-white font-bold px-4 py-2 rounded-lg transition-colors"
    >
      ➕
    </button>
          )}
        </div>

        <div className="flex flex-col gap-4 mt-8">
  {/* Categories - now first */}
  <div className="flex space-x-2">
    {categories.map(cat => (
      <button
        key={cat}
        onClick={() => setSelectedCategory(cat)}
        className={`px-4 py-2 rounded-lg transition focus:outline-none border ${
          selectedCategory===cat ? 'bg-white text-black border-transparent' :
          'bg-[#001800] text-gray-300 hover:bg-[#002800] border-gray-600'
        }`}
      >{cat}</button>
    ))}
  </div>
  
  {/* Search - now second */}
  <div className="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="Search messages..."
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      className="w-full p-2 pl-10 bg-[#001800] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
    />
    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
  </div>
</div>

        {/* Form */}
        {showForm && (
          <div className="bg-[#002200] p-6 rounded-lg shadow-md border border-gray-600 space-y-4 mt-8">
            <h3 className="text-xl font-semibold text-white">
              {replyMode ? 'Reply' : 'New Message'}</h3>
            <div>
              <label htmlFor="to" className="block text-sm text-white">To:</label>
              <input
                id="to" type="text" value={to}
                onChange={e=>setTo(e.target.value)}
                placeholder="Address or username"
                className="mt-1 w-full p-2 bg-[#001800] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Enter wallet address or username</p>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm text-white">Message:</label>
              <textarea
                id="message" rows={4} value={message}
                onChange={e=>setMessage(e.target.value)}
                placeholder="Type here..."
                className="mt-1 w-full p-2 bg-[#001800] border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSend} disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center"
              >{isLoading ? 'Sending...' : 'Send'}</button>
              <button onClick={()=>setShowForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >Cancel</button>
            </div>
            {error && <div className="text-red-400">{error}</div>}
            {success && <div className="text-green-400">{success}</div>}
          </div>
        )}
      </section>

      {/* Messages Grid */}
      <section>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-green-500" />
          </div>
        ) : filtered.length===0 ? (
          <div className="text-center py-10 bg-[#001800] rounded-lg border border-gray-600">
            <p className="text-gray-400">
              {searchTerm ? 'No messages match.' : 'You have no messages.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {pageMsgs.map((msg, i) => (
                <div key={i}
                  className={`bg-[#001800] p-4 rounded-lg cursor-pointer border ${msg.read ? 'border-gray-600' : 'border-green-500'} hover:shadow-lg transition transform hover:-translate-y-1`}
                  onClick={() => { setSelectedMsg(msg); !msg.read && handleMarkAsRead(msg.id); }}
                >
                  <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-white">
              From: <span className="font-medium text-[#d3c81a]">
                {usernameMap[msg.from] || shortenAddress(msg.from)}
              </span>
            </div>
                    {!msg.read && <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />}
                  </div>
                  <div className="mt-2 mb-3 h-16 overflow-hidden">
                    <p className="text-sm text-gray-300 line-clamp-3">{msg.message}</p>
                  </div>
                  <div className="flex justify-between items-end mt-auto">
                    <div className="text-xs text-gray-400">{msg.datetime}</div>
                    <button
                      onClick={e => { e.stopPropagation(); handleReply(msg); }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >Reply</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {total>1 && (
              <div className="flex justify-center mt-8 space-x-2">
                <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}
                  className={`px-3 py-1 rounded-md ${currentPage===1?'bg-gray-700 text-gray-500':'bg-[#002200] text-white hover:bg-[#003300]'} border border-gray-600`}
                >« Prev</button>
                {Array.from({ length: total }, (_, i) => i+1).map(n => (
                  <button key={n} onClick={()=>setCurrentPage(n)}
                    className={`px-3 py-1 rounded-md ${currentPage===n?'bg-green-600 text-white':'bg-[#002200] text-white hover:bg-[#003300]'} border border-gray-600`}
                  >{n}</button>
                ))}
                <button disabled={currentPage===total} onClick={()=>setCurrentPage(p=>p+1)}
                  className={`px-3 py-1 rounded-md ${currentPage===total?'bg-gray-700 text-gray-500':'bg-[#002200] text-white hover:bg-[#003300]'} border border-gray-600`}
                >Next »</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={()=>setSelectedMsg(null)} />
          <div className="relative bg-[#001800] w-11/12 max-w-md p-6 rounded-lg shadow-lg z-10 border border-gray-600">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">From {shortenAddress(selectedMsg.from)}</h3>
              <div className="flex space-x-2">
                <button onClick={e=>{e.stopPropagation(); handleReply(selectedMsg); setSelectedMsg(null);}} className="text-blue-400">↩️</button>
                <button onClick={e=>{e.stopPropagation(); handleDelete(selectedMsg.id);}} className="text-red-400">{isDeleting?'⏳':'🗑️'}</button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">{selectedMsg.datetime}</p>
            <div className="text-white whitespace-pre-wrap bg-[#002200] p-4 rounded-lg border border-gray-600 max-h-60 overflow-y-auto">
              {selectedMsg.message}
            </div>
            <button onClick={()=>setSelectedMsg(null)}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
            >Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
