'use client';

import React, { useState, useEffect } from 'react';
import { Users, Trophy, Target, Plus, ArrowLeft, Check, Copy, Search, ExternalLink } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { createPrivatePot, getPotsByCreator, getPotDetails } from '../Database/actions2';

// Contract ABI for PredictionPotWithCloning
const PREDICTION_POT_CLONING_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "_usdc", "type": "address"},
      {"internalType": "string", "name": "_potName", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"}
    ],
    "name": "createClone",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// USDC Contract ABI (minimal)
const USDC_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

const FACTORY_CONTRACT_ADDRESS = '0xeE44be339B390726865aAC73435B96552C0697d3' as const;
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;

interface CreatePotPageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  navigateToPrivatePot?: (contractAddress: string) => void;
}

const CreatePotPage = ({ activeSection, setActiveSection, navigateToPrivatePot }: CreatePotPageProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMyPots, setShowMyPots] = useState(false);
  const [showJoinPot, setShowJoinPot] = useState(false);
  const [potName, setPotName] = useState('');
  const [description, setDescription] = useState('');
  const [createdPotAddress, setCreatedPotAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [myPots, setMyPots] = useState<any[]>([]);
  const [joinAddress, setJoinAddress] = useState('');


  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Extract contract address from transaction receipt when confirmed
  React.useEffect(() => {
    if (isConfirmed && receipt && receipt.logs && receipt.logs.length > 0) {
      try {
        // CloneCreated event signature: CloneCreated(address indexed clone, address indexed owner)
        // The clone address should be in the first topic (after the event signature)
        const cloneCreatedLog = receipt.logs.find(log => 
          log.address?.toLowerCase() === FACTORY_CONTRACT_ADDRESS.toLowerCase()
        );
        
        if (cloneCreatedLog && cloneCreatedLog.topics && cloneCreatedLog.topics.length >= 2) {
          // Extract the clone address from the first indexed parameter (topic[1])
          const cloneAddressHex = cloneCreatedLog.topics[1];
          if (cloneAddressHex && cloneAddressHex.length >= 42) {
            const cloneAddress = '0x' + cloneAddressHex.slice(-40);
            setCreatedPotAddress(cloneAddress);
            
            // Register the pot in the database
            if (address) {
              createPrivatePot(cloneAddress, address, potName, description)
                .then(result => {
                  if (result.success) {
                    console.log('Pot registered in database:', result.pot);
                  } else {
                    console.error('Failed to register pot in database:', result.error);
                  }
                })
                .catch(error => {
                  console.error('Database registration error:', error);
                });
            }
          }
        }
      } catch (error) {
        console.error('Error extracting clone address:', error);
        // Fallback: show a generic success message
        alert('Pot created successfully! Check the transaction on Basescan for the contract address.');
      }
    }
  }, [isConfirmed, receipt]);

  // Load user's pots when they view "My Pots"
  useEffect(() => {
    const loadMyPots = async () => {
      if (showMyPots && address) {
        const pots = await getPotsByCreator(address);
        setMyPots(pots);
      }
    };
    loadMyPots();
  }, [showMyPots, address]);

  const handleJoinByAddress = async () => {
    if (!joinAddress || !navigateToPrivatePot) return;
    
    // Validate address format
    if (!joinAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Please enter a valid contract address');
      return;
    }

    // Check if pot exists in database
    const potDetails = await getPotDetails(joinAddress);
    if (!potDetails) {
      alert('Pot not found. Make sure the contract address is correct.');
      return;
    }

    // Navigate to the pot
    navigateToPrivatePot(joinAddress);
  };

  const handleCreatePot = async () => {
    if (!address || !potName.trim() || !description.trim()) {
      alert('Please connect wallet and fill in all fields');
      return;
    }

    try {
      writeContract({
        address: FACTORY_CONTRACT_ADDRESS,
        abi: PREDICTION_POT_CLONING_ABI,
        functionName: 'createClone',
        args: [USDC_ADDRESS, potName.trim(), description.trim()],
      });
    } catch (error) {
      console.error('Error creating pot:', error);
      alert('Failed to create pot. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Debug logging
  React.useEffect(() => {
    console.log('Transaction state:', { isPending, isConfirming, isConfirmed, hash, createdPotAddress });
    if (receipt) {
      console.log('Receipt:', receipt);
    }
  }, [isPending, isConfirming, isConfirmed, hash, createdPotAddress, receipt]);

  // Success state - show created pot details
  if (isConfirmed && (createdPotAddress || receipt)) {
    const addressToShow = createdPotAddress || 'Check transaction on Basescan';
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <Check className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-light text-black mb-4">Pot Created Successfully!</h1>
          <p className="text-xl text-gray-600 mb-8">Your prediction pot "{potName}" is now live</p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium mb-4">Contract Address</h3>
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded border">
              <code className="text-sm text-gray-800 break-all">{addressToShow}</code>
              {createdPotAddress && (
                <button
                  onClick={() => copyToClipboard(createdPotAddress)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
            {copied && <p className="text-green-600 text-sm mt-2">Copied to clipboard!</p>}
          </div>
          
          <div className="flex gap-4 justify-center">
            {createdPotAddress && navigateToPrivatePot && (
              <button
                onClick={() => navigateToPrivatePot(createdPotAddress)}
                className="bg-green-600 text-white py-3 px-8 rounded hover:bg-green-700 transition-colors"
              >
                Open Your Pot
              </button>
            )}
            
            <button
              onClick={() => {
                setShowCreateForm(false);
                setCreatedPotAddress(null);
                setPotName('');
                setDescription('');
              }}
              className="bg-black text-white py-3 px-8 rounded hover:bg-gray-900 transition-colors"
            >
              Create Another Pot
            </button>
          </div>
        </div>
      </div>
    );
  }

  // My Pots view
  if (showMyPots) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            
            {/* Back Button */}
            <button
              onClick={() => setShowMyPots(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-light text-black mb-4">My Prediction Pots</h1>
              <p className="text-lg text-gray-600">Manage your created prediction markets</p>
            </div>

            {/* My Pots List */}
            <div className="space-y-4">
              {myPots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">You haven't created any pots yet.</p>
                  <button
                    onClick={() => {
                      setShowMyPots(false);
                      setShowCreateForm(true);
                    }}
                    className="bg-black text-white py-2 px-6 rounded hover:bg-gray-900"
                  >
                    Create Your First Pot
                  </button>
                </div>
              ) : (
                myPots.map((pot) => (
                  <div key={pot.contractAddress} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-black transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-medium text-black mb-2">{pot.potName}</h3>
                        <p className="text-gray-600 mb-3">{pot.description}</p>
                        <div className="text-sm text-gray-500">
                          <p>Created: {new Date(pot.createdAt).toLocaleDateString()}</p>
                          <p>Contract: {pot.contractAddress.slice(0, 6)}...{pot.contractAddress.slice(-4)}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(pot.contractAddress)}
                          className="p-2 text-gray-500 hover:text-black border border-gray-300 rounded hover:border-black"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        
                        {navigateToPrivatePot && (
                          <button
                            onClick={() => navigateToPrivatePot(pot.contractAddress)}
                            className="flex items-center gap-2 bg-black text-white py-2 px-4 rounded hover:bg-gray-900"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Join Pot by Address view
  if (showJoinPot) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            
            {/* Back Button */}
            <button
              onClick={() => setShowJoinPot(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6">
                <Search className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-light text-black mb-4">Join Prediction Pot</h1>
              <p className="text-lg text-gray-600">Enter a contract address to join an existing pot</p>
            </div>

            {/* Address Input */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Contract Address
                </label>
                <input
                  type="text"
                  value={joinAddress}
                  onChange={(e) => setJoinAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-4 border border-gray-200 rounded-lg focus:border-black focus:outline-none text-lg"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-black mb-2">How to find the address:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Get it from the pot creator</li>
                  <li>• It was shared when the pot was created</li>
                  <li>• Starts with "0x" followed by 40 characters</li>
                </ul>
              </div>
            </div>

            {/* Join Button */}
            <div className="mt-8">
              <button
                onClick={handleJoinByAddress}
                disabled={!joinAddress || !navigateToPrivatePot}
                className="w-full bg-black text-white py-4 px-8 text-lg font-light transition-all hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Search className="w-5 h-5" />
                Join Pot
              </button>
              
              {!navigateToPrivatePot && (
                <p className="text-center text-sm text-red-500 mt-3">
                  Navigation function not available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create form state
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            
            {/* Back Button */}
            <button
              onClick={() => setShowCreateForm(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {/* Form Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-full mb-6">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-light text-black mb-4">Create Your Prediction Pot</h1>
              <p className="text-lg text-gray-600">Set up a custom prediction market for your friends</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Pot Name
                </label>
                <input
                  type="text"
                  value={potName}
                  onChange={(e) => setPotName(e.target.value)}
                  placeholder="e.g., Bitcoin December Prediction"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:border-black focus:outline-none text-lg placeholder-gray-400"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Will Bitcoin be above $95,000 on December 15th, 2024?"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:border-black focus:outline-none text-lg h-32 resize-none placeholder-gray-400"
                  style={{ color: '#000000', backgroundColor: '#ffffff' }}
                  maxLength={200}
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-black mb-2">How it works:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Friends can enter with any USDC amount</li>
                  <li>• You decide the winners and distribute the pot</li>
                  <li>• Winners split the total pot equally</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleCreatePot}
              disabled={!address || isPending || isConfirming || !potName.trim() || !description.trim()}
              className="w-full bg-black text-white py-4 px-8 text-lg font-light transition-all hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isPending || isConfirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isPending ? 'Creating...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Prediction Pot
                </>
              )}
            </button>
            
            {!address && (
              <p className="text-center text-sm text-red-500 mt-3">
                Please connect your wallet to create a pot
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Landing page state
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

      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Main Create Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-black text-white py-4 px-8 text-lg font-light transition-all hover:bg-gray-900 flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Create Your Prediction Pot
          </button>
          
          {/* Secondary Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowMyPots(true)}
              className="w-full bg-gray-100 text-black py-3 px-6 font-light transition-all hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              My Pots
            </button>
            
            <button
              onClick={() => setShowJoinPot(true)}
              className="w-full bg-gray-100 text-black py-3 px-6 font-light transition-all hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Join by Address
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-3">
            Create new pots, manage existing ones, or join with an address
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePotPage;