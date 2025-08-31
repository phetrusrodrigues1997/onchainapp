'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { MessageSquare, Plus, Clock, ThumbsUp, TrendingUp, Users, Hash } from 'lucide-react';
import { submitPredictionIdea, getRecentPredictionIdeas, likePredictionIdea, getUserProfiles } from '../Database/actions';
import LoadingScreen from '../Components/LoadingScreen';

interface IdeasPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

interface PredictionIdea {
  id: number;
  walletAddress: string;
  idea: string;
  category: string;
  createdAt: string;
  likes: number;
  status: 'pending' | 'approved' | 'implemented';
}

interface UserProfile {
  walletAddress: string;
  imageUrl: string | null;
}

const IdeasPage = ({ activeSection, setActiveSection }: IdeasPageProps) => {
  const { address, isConnected } = useAccount();
  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState('crypto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentIdeas, setRecentIdeas] = useState<PredictionIdea[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());

  const categories = [
    { value: 'crypto', label: '🪙 Crypto', color: 'text-orange-600' },
    { value: 'stocks', label: '📈 Stocks', color: 'text-green-600' },
    { value: 'sports', label: '⚽ Sports', color: 'text-blue-600' },
    { value: 'politics', label: '🏛️ Politics', color: 'text-purple-600' },
    { value: 'entertainment', label: '🎬 Entertainment', color: 'text-pink-600' },
    { value: 'weather', label: '🌤️ Weather', color: 'text-cyan-600' },
    { value: 'tech', label: '💻 Technology', color: 'text-indigo-600' },
    { value: 'other', label: '✨ Other', color: 'text-gray-600' }
  ];

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getUserAvatar = (walletAddress: string) => {
    const profile = userProfiles.get(walletAddress.toLowerCase());
    console.log(`👤 Avatar for ${walletAddress}:`, profile);
    
    if (profile?.imageUrl) {
      console.log(`🖼️ Using profile image: ${profile.imageUrl}`);
      return (
        <img 
          src={profile.imageUrl} 
          alt="Profile" 
          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
        />
      );
    }
    
    console.log(`🎨 Using fallback avatar for ${walletAddress}`);
    // Fallback: gradient background with initials
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-purple-1000 to-gray-700 rounded-full flex items-center justify-center border-2 border-gray-200">
        <span className="text-white font-bold text-sm">
          {walletAddress.slice(2, 4).toUpperCase()}
        </span>
      </div>
    );
  };

  // Load recent ideas and user profiles on component mount
  useEffect(() => {
    const loadRecentIdeas = async () => {
      try {
        const ideas = await getRecentPredictionIdeas(10);
        const formattedIdeas = ideas.map(idea => ({
          id: idea.id,
          walletAddress: idea.walletAddress,
          idea: idea.idea,
          category: idea.category,
          createdAt: idea.submittedAt.toISOString(),
          likes: idea.likes,
          status: idea.status as 'pending' | 'approved' | 'implemented'
        }));
        
        setRecentIdeas(formattedIdeas);

        // Load user profiles for all unique wallet addresses
        const addressSet = new Set(formattedIdeas.map(idea => idea.walletAddress));
        const uniqueAddresses = Array.from(addressSet);
        console.log('🔍 Unique addresses from ideas:', uniqueAddresses);
        
        if (uniqueAddresses.length > 0) {
          const profiles = await getUserProfiles(uniqueAddresses);
          console.log('📸 Received profiles:', profiles);
          
          const profileMap = new Map();
          profiles.forEach(profile => {
            profileMap.set(profile.walletAddress.toLowerCase(), profile);
          });
          console.log('🗺️ Profile map:', profileMap);
          setUserProfiles(profileMap);
        }
      } catch (error) {
        console.error('Error loading recent ideas:', error);
      } finally {
        setLoadingIdeas(false);
      }
    };

    loadRecentIdeas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) return;
    
    if (idea.trim().length < 10) {
      alert('Please provide a more detailed idea (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitPredictionIdea({
        walletAddress: address,
        idea: idea.trim(),
        category
      });
      
      if (result.success) {
        setShowSuccess(true);
        setIdea('');
        setCategory('crypto');
        
        // Refresh recent ideas
        const ideas = await getRecentPredictionIdeas(10);
        setRecentIdeas(ideas.map(idea => ({
          id: idea.id,
          walletAddress: idea.walletAddress,
          idea: idea.idea,
          category: idea.category,
          createdAt: idea.submittedAt.toISOString(),
          likes: idea.likes,
          status: idea.status as 'pending' | 'approved' | 'implemented'
        })));
        
        setTimeout(() => {
          setShowSuccess(false);
          setShowCreateModal(false);
        }, 2000);
      } else {
        alert(result.error || 'Failed to submit idea. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
      alert('Failed to submit idea. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeIdea = async (ideaId: number) => {
    try {
      const result = await likePredictionIdea(ideaId);
      if (result.success && result.likes !== undefined) {
        // Update the local state to reflect the new like count
        setRecentIdeas(prev => prev.map(idea => 
          idea.id === ideaId ? { ...idea, likes: result.likes! } : idea
        ));
      }
    } catch (error) {
      console.error('Error liking idea:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      implemented: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-6 h-6 text-purple-700 mr-3" />
              <h1 className="text-xl font-bold">Community Ideas</h1>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-700 text-white px-4 py-2 rounded-full font-medium hover:bg-purple-700 transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Share Idea
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loadingIdeas ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-700 border-t-transparent mx-auto mb-3"></div>
            <p className="text-gray-600">Loading community ideas...</p>
          </div>
        ) : recentIdeas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No ideas yet</h3>
            <p className="mb-6">Be the first to share a prediction insight!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-700 text-white px-6 py-2 rounded-full font-medium hover:bg-purple-700 transition-colors"
            >
              Share the first idea
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {recentIdeas.map((ideaItem) => (
              <div key={ideaItem.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getUserAvatar(ideaItem.walletAddress)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {ideaItem.walletAddress.slice(0, 6)}...{ideaItem.walletAddress.slice(-4)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{formatTimeAgo(ideaItem.createdAt)}</span>
                        <span>•</span>
                        <Hash className="w-3 h-3" />
                        <span>{categories.find(c => c.value === ideaItem.category)?.label?.replace(/[🪙📈⚽🏛️🎬🌤️💻✨]/g, '') || ideaItem.category}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-800 leading-relaxed">{ideaItem.idea}</p>
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleLikeIdea(ideaItem.id)}
                    className="flex items-center gap-2 text-gray-500 hover:text-purple-700 transition-colors py-2"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{ideaItem.likes}</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-500 py-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">0</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 py-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Share Your Idea</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {!isConnected ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Connect your wallet to share ideas</p>
                  <button 
                    onClick={() => {
                      setShowCreateModal(false);
                      setActiveSection('home');
                    }}
                    className="bg-purple-700 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Success Message */}
                  {showSuccess && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center text-green-800">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        <span className="font-medium">Idea shared successfully! 🎉</span>
                      </div>
                    </div>
                  )}

                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setCategory(cat.value)}
                          className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                            category === cat.value
                              ? 'bg-purple-100 border-purple-200 text-purple-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Idea Input */}
                  <div>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      placeholder="Share your prediction insight, strategy, or question..."
                      rows={4}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-1000 focus:border-purple-1000 resize-none"
                      maxLength={500}
                    />
                    <div className="text-right text-sm text-gray-500 mt-1">
                      {idea.length}/500
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || idea.trim().length < 10}
                    className="w-full bg-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Sharing...
                      </>
                    ) : (
                      'Share Idea'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Back to Home */}
      <div className="text-center py-8">
        <button 
          onClick={() => setActiveSection('home')}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default IdeasPage;