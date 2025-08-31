'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Megaphone, Plus, Calendar, User } from 'lucide-react';
import { 
  createAnnouncement,
  getAllAnnouncements,
  getUserContractAnnouncements,
  getUnreadAnnouncements,
  markAnnouncementsAsRead 
} from '../Database/actions';

interface Announcement {
  id: number;
  message: string;
  datetime: string;
  contractAddress?: string;
  isContractSpecific?: boolean;
}

interface MessagingPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const MessagingPage = ({ setActiveSection }: MessagingPageProps) => {
  const { address, isConnected } = useAccount();
  
  // Special admin wallet address
  const SPECIAL_ADDRESS = '0xA90611B6AFcBdFa9DDFfCB2aa2014446297b6680';
  const isSpecialUser = address && address.toLowerCase() === SPECIAL_ADDRESS.toLowerCase();

  // State for announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('');
  

  // Load announcements from database (both global and contract-specific)
  const loadAnnouncements = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      
      // Get both global and contract-specific announcements for this user
      const allAnnouncements = await getUserContractAnnouncements(address);
      
      // Convert database format to component format
      const formattedAnnouncements: Announcement[] = allAnnouncements.map(announcement => ({
        id: announcement.id,
        message: announcement.message,
        datetime: announcement.datetime,
        contractAddress: announcement.contractAddress || undefined,
        isContractSpecific: !!announcement.contractAddress,
      }));
      
      setAnnouncements(formattedAnnouncements);
    } catch (error) {
      console.error("Error loading announcements:", error);
      setStatus('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  // Mark announcements as read when user loads the page
  const markAllAnnouncementsAsRead = async () => {
    if (!address || announcements.length === 0) return;
    
    try {
      const announcementIds = announcements.map(a => a.id);
      await markAnnouncementsAsRead(address, announcementIds);
    } catch (error) {
      console.error("Error marking announcements as read:", error);
    }
  };

  useEffect(() => {
    if (address) {
      loadAnnouncements();
    }
  }, [address]);

  // Mark announcements as read immediately when they're loaded
  useEffect(() => {
    if (address && announcements.length > 0) {
      // Mark as read immediately to prevent flashing purple dot
      markAllAnnouncementsAsRead();
    }
  }, [address, announcements]);

  // Removed automatic scroll to bottom behavior

  const showStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 3000);
  };

  const handleAddAnnouncement = async () => {
    if (!address || !newAnnouncement.trim()) return;
    
    if (!isSpecialUser) {
      showStatus('Unauthorized: Only admin can add announcements');
      return;
    }

    try {
      setLoading(true);
      
      // Create announcement in database
      await createAnnouncement(newAnnouncement.trim());
      
      // Reload announcements to get updated list
      await loadAnnouncements();
      
      setNewAnnouncement('');
      setShowAddForm(false);
      
      showStatus('Announcement posted successfully');
    } catch (error) {
      console.error("Error adding announcement:", error);
      showStatus('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    }
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-purple-700 rounded-full flex items-center justify-center mx-auto mb-8">
            <Megaphone className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-purple-700 mb-4 tracking-tight">
            Global Announcements
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Connect your wallet to see the latest updates and announcements
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-purple-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-700 rounded-full flex items-center justify-center shadow-lg">
                  <Megaphone className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-purple-700 tracking-tight">Global Announcements</h1>
                  <p className="text-sm text-gray-600">Latest updates from the PrediWin team</p>
                </div>
              </div>
            </div>
            
            {/* Add announcement button - only visible to admin */}
            {isSpecialUser && (
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors duration-200 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-semibold uppercase tracking-wide">Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Add announcement form - only visible to admin */}
        {isSpecialUser && showAddForm && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-700">Create New Announcement</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-purple-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-700 mb-2">
                  Announcement Message
                </label>
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  placeholder="Enter your announcement message here..."
                  rows={4}
                  className="w-full p-3 border border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors duration-200 resize-none text-black"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleAddAnnouncement}
                  disabled={loading || !newAnnouncement.trim()}
                  className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
                >
                  {loading ? 'Posting...' : 'Post Announcement'}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="border border-purple-200 text-purple-700 px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors duration-200 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="text-purple-400 w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-600">Check back later for updates from the team.</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${
                  announcement.isContractSpecific 
                    ? 'border-green-200 bg-gradient-to-r from-green-50 to-white' 
                    : 'border-purple-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    announcement.isContractSpecific 
                      ? 'bg-green-700' 
                      : 'bg-purple-700'
                  }`}>
                    <Megaphone className="text-white w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className={`w-4 h-4 ${
                          announcement.isContractSpecific ? 'text-green-600' : 'text-purple-600'
                        }`} />
                        <span className={`text-sm font-semibold ${
                          announcement.isContractSpecific ? 'text-green-700' : 'text-purple-700'
                        }`}>
                          PrediWin Team
                        </span>
                      </div>
                      
                      {/* Market-specific badge */}
                      {announcement.isContractSpecific && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          🎯 Market Update
                        </span>
                      )}
                      
                      {/* Global announcement badge */}
                      {!announcement.isContractSpecific && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                          📢 Global
                        </span>
                      )}
                      
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs">{formatTime(announcement.datetime)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                      {announcement.message}
                    </p>
                    
                    {/* Contract address for debugging (you can remove this later) */}
                    {announcement.contractAddress && (
                      <p className="text-xs text-gray-500 mt-2 font-mono">
                        Contract: {announcement.contractAddress.slice(0, 6)}...{announcement.contractAddress.slice(-4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className="fixed bottom-6 right-6 bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">{status}</p>
        </div>
      )}
    </div>
  );
};

export default MessagingPage;