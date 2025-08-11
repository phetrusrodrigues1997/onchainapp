'use client';

import React from 'react';
import { Users, Trophy, Target, Clock, Zap, Plus } from 'lucide-react';

interface CreatePotPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const CreatePotPage = ({ activeSection, setActiveSection }: CreatePotPageProps) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-full mb-8">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-6xl font-light text-black mb-6">Create Pot</h1>
            <p className="text-2xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
              Start your own prediction market and invite friends to compete in forecasting the future
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Custom Markets</h3>
              <p className="text-gray-600 leading-relaxed">
                Create prediction markets on any topic - crypto prices, sports outcomes, or world events
              </p>
            </div>
            
            <div className="text-center p-8 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Private Groups</h3>
              <p className="text-gray-600 leading-relaxed">
                Invite your friends and family to join your exclusive prediction competitions
              </p>
            </div>
            
            <div className="text-center p-8 border border-gray-200 rounded-lg hover:border-black transition-colors">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-medium text-black mb-3">Winner Takes All</h3>
              <p className="text-gray-600 leading-relaxed">
                Set entry fees and prize pools - most accurate predictors split the winnings
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-50 rounded-lg p-12 mb-16">
            <h2 className="text-3xl font-light text-black text-center mb-12">How It Works</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-light">
                  1
                </div>
                <h4 className="text-lg font-medium text-black mb-2">Set Topic</h4>
                <p className="text-sm text-gray-600">Choose what your friends will predict</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-light">
                  2
                </div>
                <h4 className="text-lg font-medium text-black mb-2">Invite Friends</h4>
                <p className="text-sm text-gray-600">Share your pot with friends to join</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-light">
                  3
                </div>
                <h4 className="text-lg font-medium text-black mb-2">Collect Predictions</h4>
                <p className="text-sm text-gray-600">Everyone makes their forecasts</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-light">
                  4
                </div>
                <h4 className="text-lg font-medium text-black mb-2">Determine Winners</h4>
                <p className="text-sm text-gray-600">Most accurate predictions win the pot</p>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Fixed Create Button */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => {
              // TODO: Implement create pot functionality
              console.log('Create pot clicked');
            }}
            className="w-full bg-black text-white py-4 px-8 text-lg font-light rounded-none transition-all hover:bg-gray-900 flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Create Your Prediction Pot
          </button>
          
          <p className="text-center text-sm text-gray-500 mt-3">
            Start competing with friends in 30 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePotPage;