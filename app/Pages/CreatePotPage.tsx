'use client';

import React, { useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Search } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { createPrivatePot, getPotsByCreator, getPotDetails } from '../Database/actions2';
import { CustomAlert, useCustomAlert } from '../Components/CustomAlert';

// Contract ABI for ETH-based PredictionPot cloner
const PREDICTION_POT_CLONING_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_potName", "type": "string"},
      {"internalType": "string", "name": "_description", "type": "string"}
    ],
    "name": "createClone",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;


const FACTORY_CONTRACT_ADDRESS = '0x34c2fF1bb3a8cbF05a7a98f70143DD6F22Df3490' as const;

interface CreatePotPageProps {
  navigateToPrivatePot?: (contractAddress: string) => void;
}

const CreatePotPage = ({ navigateToPrivatePot }: CreatePotPageProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMyPots, setShowMyPots] = useState(false);
  const [showJoinPot, setShowJoinPot] = useState(false);
  const [potName, setPotName] = useState('');
  const [description, setDescription] = useState('');
  const [createdPotAddress, setCreatedPotAddress] = useState<string | null>(null);
  const [myPots, setMyPots] = useState<Array<{
    id: number;
    contractAddress: string;
    creatorAddress: string;
    potName: string;
    description: string;
    entryAmount: number;
    createdAt: Date;
  }>>([]);
  const [joinAddress] = useState('');
  const [isLoadingMyPots, setIsLoadingMyPots] = useState(false);
  const { alertState, showAlert, closeAlert } = useCustomAlert();


  const { address } = useAccount();
  const { data: hash, writeContract, isPending } = useWriteContract();
  
  
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  // Simplified transaction handling
  React.useEffect(() => {
    if (isConfirmed && receipt) {
      // Simple success - let user check transaction manually if needed
      showAlert('Pot created successfully! Transaction confirmed on Base network.', 'success', 'Success!');
      
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


  // Note: Pot loading now happens in handleMyMarketsClick for better UX

  // Handle My Markets button click with loading screen
  const handleMyMarketsClick = async () => {
    if (!address) {
      showAlert('Please connect your wallet to view your pots', 'warning', 'Wallet Required');
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
      showAlert('Pot not found. Make sure the contract address is correct.', 'error', 'Pot Not Found');
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
        args: [potName.trim(), description.trim()],
      });
    } catch (error) {
      console.error('Error creating pot:', error);
      showAlert('Failed to create pot. Please try again.', 'error', 'Creation Failed');
    }
  };



  // Success state - show created pot details
  if (isConfirmed && (createdPotAddress || receipt)) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Pot Created!</h1>
            <p className="text-lg text-gray-600 mb-8">
              &quot;{potName}&quot; is now live and ready for participants
            </p>
            
            <div className="flex gap-4 justify-center">
              {createdPotAddress && navigateToPrivatePot && (
                <button
                  onClick={() => navigateToPrivatePot(createdPotAddress)}
                  className="bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Pot
                </button>
              )}
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreatedPotAddress(null);
                  setPotName('');
                  setDescription('');
                }}
                className="border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // My Pots view
  if (showMyPots) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          
          {/* Simple Back Button */}
          <button
            onClick={() => setShowMyPots(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          {/* Simple Header */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Pots</h1>

          {/* Markets List */}
          <div className="space-y-4">
            {myPots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-6">You haven&apos;t created any pots yet.</p>
                <button
                  onClick={() => {
                    setShowMyPots(false);
                    setShowCreateForm(true);
                  }}
                  className="bg-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Create Your First Pot
                </button>
              </div>
            ) : (
              myPots.map((pot) => (
                <div key={pot.contractAddress} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{pot.potName}</h3>
                      <p className="text-gray-600 mb-3">{pot.description}</p>
                      <div className="text-sm text-gray-500">
                        <p>Created {pot.createdAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {navigateToPrivatePot && (
                      <button
                        onClick={() => navigateToPrivatePot(pot.contractAddress)}
                        className="bg-black text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  

  // Create form state
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          
          {/* Simple Back Button */}
          <button
            onClick={() => setShowCreateForm(false)}
            className="flex items-center gap-2 text-gray-600 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          {/* Simple Header */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Pot</h1>

          {/* Simple Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Pot Name
              </label>
              <input
                type="text"
                value={potName}
                onChange={(e) => setPotName(e.target.value)}
                placeholder="e.g., Bitcoin December Prediction"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-gray-900 placeholder-gray-500"
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Will Bitcoin be above $95,000 on December 15th, 2024?"
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-gray-900 h-24 resize-none placeholder-gray-500"
                maxLength={200}
              />
            </div>
            
            <button
              onClick={handleCreatePot}
              disabled={!address || isPending || isConfirming || !potName.trim() || !description.trim()}
              className="w-full bg-black text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-gray-500 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
            >
              {isPending || isConfirming ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isPending ? 'Creating...' : 'Confirming...'}
                </>
              ) : (
                'Create Pot'
              )}
            </button>
            
            {!address && (
              <p className="text-center text-sm text-purple-1000">
                Connect your wallet to create a pot
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Landing page state
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12 md:mt-8">
        
        {/* Simple Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Private Pots <span className="text-4xl">🎉</span>
          </h1>
        
          
          {/* Visual benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-8 md:mt-24 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-blue-600 text-xl">💰</span>
              </div>
              <p className="text-sm text-gray-600">Share link with friends</p>
            </div>
            {/* <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-green-600 text-xl">👑</span>
              </div>
              <p className="text-sm text-gray-600">You decide the winners</p>
            </div> */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-purple-600 text-xl">🏆</span>
              </div>
              <p className="text-sm text-gray-600">Winners split the pot equally</p>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-black text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-gray-500 transition-colors"
          >
            Create New Pot
          </button>
          
          <button
            onClick={handleMyMarketsClick}
            disabled={isLoadingMyPots}
            className="w-full bg-purple-700 py-4 px-6 rounded-lg text-lg text-white font-medium hover:border-gray-400 hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoadingMyPots ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              'My Pots'
            )}
          </button>
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
    </div>
  );
};

export default CreatePotPage;