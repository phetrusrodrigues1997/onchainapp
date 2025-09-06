'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, Mail, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_TO_TABLE_MAPPING, getMarketDisplayName } from '../Database/config';
import { getUserEmail, saveUserEmail } from '../Database/actions';

interface DashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  selectedMarket?: string;
}

// Use centralized contract mapping from config
const CONTRACT_ADDRESSES = CONTRACT_TO_TABLE_MAPPING;

// Prediction Pot ABI
const PREDICTION_POT_ABI = [
  {
    "inputs": [],
    "name": "getParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "participant", "type": "address"}],
    "name": "removeParticipant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const Dashboard = ({ activeSection, setActiveSection, selectedMarket }: DashboardProps) => {
  const [marketInfo, setMarketInfo] = useState({ name: '', section: '', address: '' });
  const [userPots, setUserPots] = useState<string[]>([]);
  const [selectedMarketAddress, setSelectedMarketAddress] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('Tomorrow\'s Predictions');
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [potBalance, setPotBalance] = useState<string>('');
  
  // Email collection states
  const [showEmailCollection, setShowEmailCollection] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [emailSubmitting, setEmailSubmitting] = useState<boolean>(false);
  const [hasUserEmail, setHasUserEmail] = useState<boolean | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState<boolean>(true);
  
  const { address, isConnected } = useAccount();

  // Check if user has email when wallet connects
  useEffect(() => {
    const checkUserEmail = async () => {
      console.log('🔍 TutorialBridge - Checking user email. Connected:', isConnected, 'Address:', address);
      if (isConnected && address) {
        setIsLoadingEmail(true);
        console.log('📧 Loading email data...');
        try {
          const userEmailData = await getUserEmail(address);
          console.log('📧 Email data received:', userEmailData);
          if (userEmailData?.email) {
            console.log('✅ User has email, showing tutorial');
            setHasUserEmail(true);
            setShowEmailCollection(false);
          } else {
            console.log('❌ User has no email, showing email collection');
            setHasUserEmail(false);
            setShowEmailCollection(true);
          }
        } catch (error) {
          console.error('Error checking user email:', error);
          setHasUserEmail(false);
          setShowEmailCollection(true);
        }
        setIsLoadingEmail(false);
        console.log('📧 Loading complete');
      } else {
        console.log('🔌 Not connected or no address');
        setHasUserEmail(null);
        setShowEmailCollection(false);
        setIsLoadingEmail(false);
      }
    };

    checkUserEmail();
  }, [address, isConnected]);

  // Check user participation in pots
  useEffect(() => {
    if (!isConnected || !address) {
      setUserPots([]);
    }
  }, [address, isConnected]);

  // Get contract addresses array
  const contractAddresses = Object.keys(CONTRACT_ADDRESSES) as Array<keyof typeof CONTRACT_ADDRESSES>;

  // Read participants from all contracts - hooks must be called at top level
  const { data: participants1 } = useReadContract({
    address: contractAddresses[0] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address }
  });

  const { data: participants2 } = useReadContract({
    address: contractAddresses[1] as `0x${string}`,
    abi: PREDICTION_POT_ABI,
    functionName: 'getParticipants',
    query: { enabled: isConnected && !!address }
  });

  const participantsData = useMemo(() => [participants1, participants2], [participants1, participants2]);

  // Set up the selected market address and question from cookies
  useEffect(() => {
    const savedMarket = Cookies.get('selectedMarket');
    if (savedMarket) {
      setSelectedMarketAddress(savedMarket);
    }
    
    const savedQuestion = Cookies.get('selectedMarketQuestion');
    if (savedQuestion) {
      setSelectedQuestion(savedQuestion);
    }
    
    const savedIcon = Cookies.get('selectedMarketIcon');
    if (savedIcon) {
      setSelectedIcon(savedIcon);
    }
    
    // Load pot balance from cookies
    const savedPotBalances = Cookies.get('potBalances');
    if (savedPotBalances) {
      try {
        const potBalances = JSON.parse(savedPotBalances);
        const marketType = CONTRACT_TO_TABLE_MAPPING[savedMarket as keyof typeof CONTRACT_TO_TABLE_MAPPING];
        const marketName = getMarketDisplayName(marketType);
        if (potBalances[marketName]) {
          setPotBalance(potBalances[marketName]);
        }
      } catch (error) {
        console.error('Error parsing pot balances from cookies:', error);
      }
    }
  }, []);

  // Update userPots when participant data changes
  useEffect(() => {
    if (!isConnected || !address) return;

    const participatingPots: string[] = [];

    // Check all contracts
    participantsData.forEach((participants, index) => {
      if (participants && Array.isArray(participants)) {
        const isParticipant = participants.some(
          (participant: string) => participant.toLowerCase() === address.toLowerCase()
        );
        if (isParticipant) {
          participatingPots.push(contractAddresses[index]);
        }
      }
    });

    setUserPots(participatingPots);
  }, [participantsData, address, isConnected]);

  // Get selected market from cookie - separate useEffect to avoid infinite loops
  useEffect(() => {
    const getSelectedMarket = () => {
      const selectedMarketAddress = Cookies.get('selectedMarket');
      console.log('Selected pot address from cookie:', selectedMarketAddress);
      
      // Check if the selected market address exists in our CONTRACT_ADDRESSES
      if (selectedMarketAddress && selectedMarketAddress in CONTRACT_ADDRESSES) {
        const marketType = CONTRACT_ADDRESSES[selectedMarketAddress as keyof typeof CONTRACT_ADDRESSES];
        setMarketInfo({ 
          name: getMarketDisplayName(marketType), 
          section: 'bitcoinPot',  // Both markets use the same section, PredictionPotTest handles the difference
          address: selectedMarketAddress 
        });
      } else {
        // Default to first market if no cookie or unknown address
        const defaultAddress = contractAddresses[0];
        setMarketInfo({ 
          name: 'Trending', 
          section: 'bitcoinPot',
          address: defaultAddress 
        });
      }
    };

    getSelectedMarket();
  }, []); // Only run once on mount

  // Handle email submission
  const handleEmailSubmit = async () => {
    if (!email.trim() || !address) return;
    
    setEmailSubmitting(true);
    try {
      const result = await saveUserEmail(address, email.trim());
      if (result.success) {
        setHasUserEmail(true);
        setShowEmailCollection(false);
        setEmail('');
      } else {
        console.error('Failed to save email:', result.error);
        // Could show error message here
      }
    } catch (error) {
      console.error('Error saving email:', error);
    }
    setEmailSubmitting(false);
  };

  // Handle skip email
  const handleSkipEmail = () => {
    setShowEmailCollection(false);
    setHasUserEmail(true); // Prevent showing again this session
  };

  // Debug logging for render conditions
  React.useEffect(() => {
    console.log('🎨 TutorialBridge Render - States:');
    console.log('  - isLoadingEmail:', isLoadingEmail);
    console.log('  - showEmailCollection:', showEmailCollection);
    console.log('  - isConnected:', isConnected);
    console.log('  - hasUserEmail:', hasUserEmail);
    console.log('  - address:', address);
    console.log('  - Tutorial condition (!isLoadingEmail && !showEmailCollection && isConnected):', !isLoadingEmail && !showEmailCollection && isConnected);
  }, [isLoadingEmail, showEmailCollection, isConnected, hasUserEmail, address]);

  return (
    <div className="min-h-screen bg-white text-black w-full overflow-x-hidden">
      <div className="w-full mx-auto p-6">
        <div className="flex items-start justify-center pt-16 md:pt-32">
          <div className="text-center w-full max-w-4xl">
            {/* Loading State */}
            {isLoadingEmail && isConnected && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            )}

            {/* Apple-like Email Collection UI */}
            {!isLoadingEmail && showEmailCollection && isConnected && (
              <div className="w-full mt-16 md:mt-0 px-6 md:px-12">
                {/* Email form container */}
                <div className="relative max-w-2xl mx-auto animate-fade-in-up opacity-0" style={{ 
                  animation: 'fadeInUp 0.8s ease-out 0.2s forwards' 
                }}>
                  {/* Title - top left */}
                  <h1 className="text-3xl md:text-4xl font-light text-gray-900 text-left tracking-tight mb-6 md:mb-8">
                    Enter your email
                  </h1>

                  {/* Large email input */}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-2 md:px-6 py-4 md:py-5 text-base md:text-lg bg-transparent border-0 border-b-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors duration-300 placeholder-gray-500 text-center font-light tracking-wide mb-4"
                    onKeyPress={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  />

                  {/* Action buttons - bottom right */}
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleSkipEmail}
                      className="text-gray-600 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-sm md:text-base tracking-wide"
                    >
                      Skip
                    </button>
                    <button
                      onClick={handleEmailSubmit}
                      disabled={emailSubmitting || !email.trim()}
                      className="bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 text-sm md:text-base tracking-wide disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {emailSubmitting ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving
                        </span>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </div>
                {/* Custom CSS for animations */}
                <style>{`
                  @keyframes fadeInUp {
                    from {
                      opacity: 0;
                      transform: translateY(30px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            )}

            {/* Tutorial Screen - Show when email is collected or skipped */}
            {!isLoadingEmail && !showEmailCollection && isConnected && (
              <div className="max-w-4xl mx-auto opacity-100">
                {/* Tutorial Content */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12 mb-8">
                  <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-8 text-center">
                    How to Play
                  </h2>
                  
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
                        1
                      </div>
                      <p className="text-base md:text-lg">
                        <strong>Anyone in the world can enter your pot.</strong> Players from around the globe compete in the same prediction tournaments.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
                        2
                      </div>
                      <p className="text-base md:text-lg">
                        <strong>Predict tomorrow's outcome</strong> every day. Will the price go up or down? Make your prediction and wait for results.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
                        3
                      </div>
                      <p className="text-base md:text-lg">
                        <strong>Entry fees increase daily.</strong> Sunday is cheapest (~$0.01), rising to Friday (~$0.06). Join early to save money!
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
                        4
                      </div>
                      <p className="text-base md:text-lg">
                        <strong>Eliminated? Re-enter anytime!</strong> Pay today's entry fee to rejoin this pot, or find another pot to enter.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
                        5
                      </div>
                      <p className="text-base md:text-lg">
                        <strong>Tournament continues until final 10.</strong> When players drop below 10, we have one final prediction day to determine the winners.
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 text-purple-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-1">
                        6
                      </div>
                      <p className="text-base md:text-lg">
                        <strong>Check player counts on the home page.</strong> Every pot shows current players and minimum needed to begin the tournament.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-10 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                    <p className="text-center text-base md:text-lg text-gray-800 font-medium">
                      🎯 <strong>Your Goal:</strong> Keep predicting correctly until you win or get eliminated. Last players standing share the pot!
                    </p>
                  </div>
                </div>

                {/* View Pot Button */}
                <div className="text-center">
                  <button
                    onClick={() => setActiveSection(marketInfo.section)}
                    className="bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white px-10 py-4 rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg mx-auto transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Wallet className="w-5 h-5" />
                    Enter the Pot
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;