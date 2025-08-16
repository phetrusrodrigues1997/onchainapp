'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Trophy, Target, Plus, ArrowLeft, Check, Copy, Search, ExternalLink } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Language, getTranslation, supportedLanguages } from '../Languages/languages';
import { createPrivatePot, getPotsByCreator, getPotDetails } from '../Database/actions2';
import { CustomAlert, useCustomAlert } from '../Components/CustomAlert';
import { EmailCollectionModal, useEmailCollection } from '../Components/EmailCollectionModal';
import { checkEmailExists, saveUserEmail } from '../Database/emailActions';

// Contract ABI for PredictionPot (simplified contract)
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

const FACTORY_CONTRACT_ADDRESS = '0x1344e4614719ff4D491280f0d2707e87354ed823' as const;
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
  const [isLoadingMyPots, setIsLoadingMyPots] = useState(false);
  const { alertState, showAlert, closeAlert } = useCustomAlert();


  const { address, isConnected } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  
  // Email collection modal
  const emailModalRef = useRef<NodeJS.Timeout | null>(null);
  const {
    showModal: showEmailModal,
    showEmailModal: triggerEmailModal,
    hideEmailModal,
    markEmailCollected,
    setIsEmailCollected,
    isDismissed,
    isEmailCollected: hookEmailCollected
  } = useEmailCollection(address);
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Simplified transaction handling
  React.useEffect(() => {
    if (isConfirmed && receipt) {
      // Simple success - let user check transaction manually if needed
      showAlert('Market created successfully! Transaction confirmed on Base network.', 'success', 'Success!');
      
      // Try to extract clone address, but don't fail if we can't
      try {
        const cloneCreatedLog = receipt.logs?.find(log => 
          log.address?.toLowerCase() === FACTORY_CONTRACT_ADDRESS.toLowerCase()
        );
        
        if (cloneCreatedLog?.topics?.[1]) {
          const cloneAddress = '0x' + cloneCreatedLog.topics[1].slice(-40);
          setCreatedPotAddress(cloneAddress);
          
          // Register in database (optional - don't block UI if this fails)
          if (address) {
            createPrivatePot(cloneAddress, address, potName, description)
              .catch(error => console.log('Database registration failed:', error));
          }
        }
      } catch (error) {
        console.log('Clone address extraction failed:', error);
      }
    }
  }, [isConfirmed, receipt]);

  // Email collection logic - trigger 2 seconds after wallet connects
  useEffect(() => {
    const handleEmailCollection = async () => {
      console.log('🔍 CreatePot Email Debug:', {
        isConnected,
        address,
        activeSection,
        hookEmailCollected,
        isDismissed,
        condition: isConnected && address && activeSection === 'createPot'
      });

      if (isConnected && address && activeSection === 'createPot') {
        console.log('✅ Wallet connected on Create Pot page, checking email...');
        console.log('📧 Hook email collected state:', hookEmailCollected);
        console.log('📧 Dismissal state:', isDismissed);
        
        // First check the hook's state - it's the single source of truth
        if (hookEmailCollected) {
          console.log('📧 Hook says email already collected, not showing modal');
          return;
        }

        if (isDismissed) {
          console.log('📧 Modal was dismissed, not showing modal');
          return;
        }
        
        // Only check database if hook doesn't have email collected info yet
        try {
          const emailExists = await checkEmailExists(address);
          console.log('📧 Database email check result:', emailExists);
          
          if (emailExists) {
            console.log('📧 Database says email exists, updating hook state');
            setIsEmailCollected(true);
            return;
          }
          
          // Clear any existing timer
          if (emailModalRef.current) {
            clearTimeout(emailModalRef.current);
          }
          
          console.log('⏰ Setting 2-second timer for email modal...');
          // Show modal after 2 seconds
          emailModalRef.current = setTimeout(() => {
            console.log('🎯 Timer triggered! Showing email modal...');
            triggerEmailModal();
          }, 2000);
        } catch (error) {
          console.error('❌ Error checking email status:', error);
        }
      } else {
        console.log('❌ Conditions not met for email modal');
        // Clear timer if wallet disconnects or user leaves page
        if (emailModalRef.current) {
          clearTimeout(emailModalRef.current);
          emailModalRef.current = null;
        }
      }
    };

    handleEmailCollection();
    
    return () => {
      if (emailModalRef.current) {
        clearTimeout(emailModalRef.current);
      }
    };
  }, [isConnected, address, activeSection, triggerEmailModal, setIsEmailCollected, isDismissed, hookEmailCollected]);

  // Handle email submission
  const handleEmailSubmit = async (email: string) => {
    if (!address) return;
    
    console.log('📧 Starting email submission for CreatePot:', email);
    try {
      const result = await saveUserEmail(address, email, 'CreatePot');
      console.log('📧 saveUserEmail result:', result);
      
      if (result.success) {
        console.log('📧 Email saved successfully, marking as collected in hook...');
        markEmailCollected(); // This should be the single source of truth
        console.log('📧 Hook state updated with markEmailCollected()');
      } else {
        throw new Error(result.error || 'Failed to save email');
      }
    } catch (error) {
      console.error('❌ Email submission error:', error);
      throw error;
    }
  };

  // Note: Pot loading now happens in handleMyMarketsClick for better UX

  // Handle My Markets button click with loading screen
  const handleMyMarketsClick = async () => {
    if (!address) {
      showAlert('Please connect your wallet to view your markets', 'warning', 'Wallet Required');
      return;
    }
    
    setIsLoadingMyPots(true);
    
    // Start database operation immediately
    const potsPromise = getPotsByCreator(address);
    
    // Ensure minimum 2 seconds of loading
    const [pots] = await Promise.all([
      potsPromise,
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);
    
    // Set the data and show the view
    setMyPots(pots);
    setShowMyPots(true);
    setIsLoadingMyPots(false);
  };

  const handleJoinByAddress = async () => {
    if (!joinAddress || !navigateToPrivatePot) return;
    
    // Validate address format
    if (!joinAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      showAlert('Please enter a valid contract address', 'error', 'Invalid Address');
      return;
    }

    // Check if pot exists in database
    const potDetails = await getPotDetails(joinAddress);
    if (!potDetails) {
      showAlert('Market not found. Make sure the contract address is correct.', 'error', 'Market Not Found');
      return;
    }

    // Navigate to the pot
    navigateToPrivatePot(joinAddress);
  };

  const handleCreatePot = async () => {
    if (!address || !potName.trim() || !description.trim()) {
      showAlert('Please connect wallet and fill in all fields', 'warning', 'Missing Information');
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
      showAlert('Failed to create market. Please try again.', 'error', 'Creation Failed');
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
          
          <h1 className="text-4xl font-light text-black mb-4">Market Created Successfully!</h1>
          <p className="text-xl text-gray-600 mb-8">Your prediction market "{potName}" is now live</p>
          
          <div className="flex gap-4 justify-center">
            {createdPotAddress && navigateToPrivatePot && (
              <button
                onClick={() => navigateToPrivatePot(createdPotAddress)}
                className="bg-green-600 text-white py-3 px-8 rounded hover:bg-green-700 transition-colors"
              >
                Open Your Market
              </button>
            )}
            
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
              <h1 className="text-4xl font-light text-black mb-4">My Prediction Markets</h1>
              <p className="text-lg text-gray-600">Manage your created prediction markets</p>
            </div>

            {/* My Pots List */}
            <div className="space-y-4">
              {myPots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">You haven't created any markets yet.</p>
                  <button
                    onClick={() => {
                      setShowMyPots(false);
                      setShowCreateForm(true);
                    }}
                    className="bg-[#0000aa] text-white py-2 px-6 rounded hover:bg-gray-900"
                  >
                    Create Market
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
                          {/* <p>Contract: {pot.contractAddress.slice(0, 6)}...{pot.contractAddress.slice(-4)}</p> */}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {/* <button
                          onClick={() => copyToClipboard(pot.contractAddress)}
                          className="p-2 text-gray-500 hover:text-black border border-gray-300 rounded hover:border-black"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4" />
                        </button> */}
                        
                        {navigateToPrivatePot && (
                          <button
                            onClick={() => navigateToPrivatePot(pot.contractAddress)}
                            className="flex items-center gap-2 bg-black text-white py-2 px-4 rounded hover:bg-[#eaeaea] hover:text-black transition-colors"
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
              <h1 className="text-4xl font-light text-black mb-4">Join Prediction Market</h1>
              <p className="text-lg text-gray-600">Enter a contract address to join an existing market</p>
            </div>

            

            {/* Join Button */}
            <div className="mt-8">
              <button
                onClick={handleJoinByAddress}
                disabled={!joinAddress || !navigateToPrivatePot}
                className="w-full bg-black text-white py-4 px-8 text-lg font-light transition-all hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Search className="w-5 h-5" />
                Join Market
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
              <h1 className="text-4xl font-light text-black mb-4">Create Prediction Market</h1>
              <p className="text-lg text-gray-600">Set up a custom prediction market for your friends</p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Market Name
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
                  <li>• You decide the winners and distribute the market</li>
                  <li>• Winners split the total market equally</li>
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
                  Create Prediction Market
                </>
              )}
            </button>
            
            {!address && (
              <p className="text-center text-sm text-red-500 mt-3">
                Please connect your wallet to create a market
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
          <div className="text-center mb-2 pt-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-full mb-8">
              <Users className="w-12 h-12 text-white" />
            </div>
            {/* <h1 className="text-6xl font-light text-black mb-6">Create Pot</h1> */}
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

         

          
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          
          {/* Main Create Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-[#0000aa] text-white py-4 px-8 text-lg font-light transition-all hover:bg-gray-900 flex items-center justify-center gap-3"
          >
            <Plus className="w-5 h-5" />
            Create Prediction Market
          </button>
          
          {/* Secondary Actions */}
          <button
            onClick={handleMyMarketsClick}
            disabled={isLoadingMyPots}
            className="w-full bg-gray-100 text-black py-3 px-6 font-light transition-all hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoadingMyPots ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                My Markets
              </>
            )}
          </button>
          
          <footer className="relative z-10 px-6 py-10 bg-white text-center text-[#666666] text-sm">
        &copy; {new Date().getFullYear()} PrediWin.com — All rights reserved.
      </footer>
        </div>
      </div>
      
      {/* Custom Alert */}
      <CustomAlert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        autoClose={alertState.autoClose}
      />
      
      {/* Email Collection Modal */}
      <EmailCollectionModal
        isOpen={showEmailModal}
        onClose={hideEmailModal}
        onSubmit={handleEmailSubmit}
        sourcePage="CreatePot"
      />
    </div>
  );
};

export default CreatePotPage;