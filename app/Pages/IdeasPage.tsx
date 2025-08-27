'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Lightbulb, Send, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { submitPredictionIdea, getRecentPredictionIdeas, likePredictionIdea } from '../Database/actions';

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

const IdeasPage = ({ activeSection, setActiveSection }: IdeasPageProps) => {
  const { address, isConnected } = useAccount();
  const [idea, setIdea] = useState('');
  const [category, setCategory] = useState('crypto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentIdeas, setRecentIdeas] = useState<PredictionIdea[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingIdeas, setLoadingIdeas] = useState(true);

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

  // Load recent ideas on component mount
  useEffect(() => {
    const loadRecentIdeas = async () => {
      try {
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
        
        setTimeout(() => setShowSuccess(false), 3000);
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
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-8 h-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold">Prediction Market Ideas</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Share your ideas for new prediction markets! Help shape what we predict next.
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-800">
              <TrendingUp className="w-5 h-5 mr-2" />
              <span className="font-medium">Idea submitted successfully! 🎉</span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              Thanks for your contribution. We'll review your idea soon!
            </p>
          </div>
        )}

        {/* Submission Form */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Send className="w-5 h-5 mr-2 text-red-600" />
            Submit Your Idea
          </h2>
          
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Connect your wallet to submit prediction market ideas</p>
              <button 
                onClick={() => setActiveSection('home')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                        category === cat.value
                          ? 'bg-red-50 border-red-200 text-red-800'
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
                <label className="block text-sm font-medium mb-2">
                  Your Prediction Market Idea
                </label>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Example: Will Bitcoin reach $200,000 by end of 2025?"
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {idea.length}/500 characters
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || idea.trim().length < 10}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Idea
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Recent Ideas Section */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Recent Community Ideas
          </h2>
          
          {loadingIdeas ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-gray-600">Loading recent ideas...</p>
            </div>
          ) : recentIdeas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No ideas submitted yet. Be the first to share yours!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentIdeas.map((ideaItem) => (
                <div key={ideaItem.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(ideaItem.status)}`}>
                      {ideaItem.status.charAt(0).toUpperCase() + ideaItem.status.slice(1)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(ideaItem.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-800 mb-2">{ideaItem.idea}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Category: {categories.find(c => c.value === ideaItem.category)?.label || ideaItem.category}
                    </span>
                    <button
                      onClick={() => handleLikeIdea(ideaItem.id)}
                      className="flex items-center text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      {ideaItem.likes} likes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <button 
            onClick={() => setActiveSection('home')}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeasPage;