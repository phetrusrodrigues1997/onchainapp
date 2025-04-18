'use client';

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { createMessage, getUnreadMessages, getUsername } from '../Database/actions';

export default function CreateMessage() {
  const [showForm, setShowForm] = useState(false);
  const [to, setTo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const { address } = useAccount();

  const shortenAddress = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-4)}` : '';

  // Fetch messages on load
  useEffect(() => {
    async function fetchMessages() {
      if (address) {
        const username = await getUsername(address);

      let unreadByAddress = await getUnreadMessages(address);
      let unreadByUsername = username ? await getUnreadMessages(username) : [];

      const unread = [...unreadByAddress, ...unreadByUsername];

        setMessages(unread);
      }
    }
    fetchMessages();
  }, [address]);

  const formattedDate = new Date().toLocaleString('en-US', {
    month: 'short', // <-- short month like "Apr"
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleSend = async () => {
    setError(null);
    if (!address) return setError('Please connect your wallet.');
    if (!to.trim() || !message.trim()) return setError('Please fill in all fields.');

    try {
      await createMessage(address, to.trim(), message.trim(), formattedDate);
      setSuccess('Message sent successfully!');
      setTo('');
      setMessage('');
      setShowForm(false);
      // Refresh list
      const unread = await getUnreadMessages(address);
      setMessages(unread);
    } catch {
      setError('Failed to send message.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Messages Grid */}
      <section>
      <div className="mb-4">
  {/* h2 and button side-by-side */}
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-2xl font-bold text-white dark:text-white">
      Your Messages
    </h2>

    {!showForm && (
      <button
      onClick={() => { setShowForm(true);  }}
      className="bg-white hover:bg-white font-bold px-4 py-2 rounded-lg transition-colors"
    >
      ➕
    </button>
    )}
  </div>

  {/* Form appears below h2 when showForm is true */}
  {showForm && (
    <div className="bg-[#002200] dark:bg-[#002200] p-6 rounded-lg shadow-md space-y-4 border border-gray-400">
      <h3 className="text-xl font-semibold text-white">New Message</h3>

      <div>
        <label htmlFor="to" className="block text-sm font-medium text-white dark:text-gray-300">
          To:
        </label>
        <input
          id="to"
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Recipient address"
          className="mt-1 w-full p-2 bg-[#002200] dark:bg-[#002200] border border-gray-400 dark:border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white dark:text-gray-300">
          Message:
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
          rows={4}
          className="mt-1 w-full p-2 bg-[#002200] dark:bg-[#002200] border border-gray-400 dark:border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSend}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Send
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-green-600 dark:text-green-400">{success}</p>}
    </div>
  )}
</div>
        {messages.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            You have no unread messages.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-16">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="bg- dark:bg-[#002200] p-4 rounded-lg cursor-pointer border border-gray-400"
                onClick={() => setSelectedMsg(msg)}
              >
                <div className="text-sm text-white dark:text-white">
                  From: <span className="font-medium text-[#d3c81a] dark:text-[#d3c81a]">{shortenAddress(msg.from)}</span>
                </div>
                
                {(() => {
                  const [datePart, timePart] = msg.datetime.split(',');
                  return (
                    <>
                      <div className="text-xs text-white mt-6">{datePart}{timePart}</div>
                      
                    </>
                  );
                })()}
                <p className="text-sm text-white dark:text-gray-300 truncate">
                  
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Message Modal */}
      {selectedMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setSelectedMsg(null)}
          />
          <div className="relative bg-white dark:bg-gray-900 w-11/12 max-w-md p-6 rounded-lg shadow-lg z-10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Message from {shortenAddress(selectedMsg.from)}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{selectedMsg.date}</p>
            <div className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
              {selectedMsg.message}
            </div>
            <button
              onClick={() => setSelectedMsg(null)}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      
    </div>
  );
}
