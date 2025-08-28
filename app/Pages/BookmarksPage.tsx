'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Cookies from 'js-cookie';
import { Bookmark, Clock, X } from 'lucide-react';
import { getUserBookmarks, removeBookmark } from '../Database/actions';

interface BookmarksPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface BookmarkItem {
  id: number;
  walletAddress: string;
  marketId: string;
  marketName: string;
  marketQuestion: string;
  marketCategory: string;
  contractAddress?: string | null;
  bookmarkedAt: Date;
}

const BookmarksPage = ({ activeSection, setActiveSection }: BookmarksPageProps) => {
  const { address, isConnected } = useAccount();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  // Load bookmarks when component mounts or address changes
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!isConnected || !address) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('📑 Loading bookmarks for:', address);
        
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Database query took too long')), 10000) // 10 second timeout
        );
        
        const bookmarksPromise = getUserBookmarks(address);
        
        const userBookmarks = await Promise.race([bookmarksPromise, timeoutPromise]);
        setBookmarks(userBookmarks as any);
        console.log('📑 Bookmarks loaded successfully, count:', (userBookmarks as any).length);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        // Set empty bookmarks on error so page still loads
        setBookmarks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [address, isConnected]);

  const handleRemoveBookmark = async (marketId: string) => {
    if (!address) return;

    try {
      setRemoving(marketId);
      const result = await removeBookmark(address, marketId);
      
      if (result.success) {
        // Remove from local state
        setBookmarks(prev => prev.filter(bookmark => bookmark.marketId !== marketId));
      } else {
        console.error('Failed to remove bookmark:', result.message);
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewMarket = (bookmark: BookmarkItem) => {
    if (bookmark.contractAddress) {
      // Set cookies for market navigation if contract address is available
      Cookies.set('selectedMarket', bookmark.contractAddress, { 
        sameSite: 'lax',
        expires: 7 
      });
      
      Cookies.set('selectedMarketQuestion', bookmark.marketQuestion, { 
        sameSite: 'lax',
        expires: 7 
      });

      // Navigate to dashboard/prediction page
      setTimeout(() => {
        setActiveSection('dashboard');
      }, 200);
    } else {
      // Fallback: navigate to home and show the market category
      setActiveSection('home');
      // Could potentially set the selected market category here if needed
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to view your bookmarked markets.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Your Bookmarks</h1>
          </div>
          <p className="text-gray-600">Markets you've saved for later</p>
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No bookmarks yet</h2>
            <p className="text-gray-600 mb-6">Start bookmarking markets to see them here.</p>
            <button
              onClick={() => setActiveSection('home')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explore Markets
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {bookmark.marketCategory}
                      </span>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(bookmark.bookmarkedAt)}
                      </div>
                    </div>

                    {/* Market Question */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {bookmark.marketQuestion}
                    </h3>

                    {/* Market Name */}
                    <p className="text-gray-600 text-sm">
                      {bookmark.marketName}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveBookmark(bookmark.marketId)}
                    disabled={removing === bookmark.marketId}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove bookmark"
                  >
                    {removing === bookmark.marketId ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleViewMarket(bookmark)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {bookmark.contractAddress ? 'View Market' : 'Go to Category'}
                  </button>
                  {bookmark.contractAddress && (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full self-center">
                      Contract Available
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;