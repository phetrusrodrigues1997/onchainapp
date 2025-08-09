import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  generateReferralCode, 
  getReferralStats,
  getAvailableFreeEntries
} from '../Database/actions';

interface ReferralProgramProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const ReferralProgram = ({ setActiveSection }: ReferralProgramProps) => {
  const { address, isConnected } = useAccount();
  
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralStats, setReferralStats] = useState<any>(null);
  const [freeEntriesAvailable, setFreeEntriesAvailable] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  const loadReferralData = async () => {
    if (!address) return;
    
    try {
      const code = await generateReferralCode(address);
      setReferralCode(code);
      
      const stats = await getReferralStats(address);
      console.log("Debug - referral stats:", stats);
      setReferralStats(stats);
      
      const freeEntries = await getAvailableFreeEntries(address);
      console.log("Debug - getAvailableFreeEntries returned:", freeEntries);
      setFreeEntriesAvailable(freeEntries);
      
    } catch (error) {
      console.error("Error loading referral data:", error);
    }
  };

  useEffect(() => {
    if (address) {
      loadReferralData();
    }
  }, [address]);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-invisible p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-invisible rounded-lg p-6 mb-6">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                Referral Program
              </h1>
              <div className="w-20 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div>
            </div>
            <div className="text-center text-bold text-[#111111] mb-6">
              Please connect your wallet to view your referral program details.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-invisible p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-invisible rounded-lg p-6 mb-6">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
              Referral Program
            </h1>
            <div className="w-20 h-1.5 bg-gradient-to-r from-gray-900 via-gray-600 to-gray-900 mx-auto rounded-full shadow-sm"></div>
          </div>

          {/* Back button */}
          <div className="mb-6">
            <button
              onClick={() => setActiveSection('bitcoinPot')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              ← Back to Prediction Pot
            </button>
          </div>

          {/* Referral Program Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Your Referral Code */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Referral Code</h3>
                <div className="flex items-center space-x-3">
                  <code className="bg-gray-100 px-4 py-3 rounded-lg text-2xl text-black font-bold">
                    {referralCode || 'Loading...'}
                  </code>
                  {referralCode && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode);
                        showMessage('Referral code copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all duration-300"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <p className="text-gray-600 mt-3 leading-relaxed">
                  Share this code with friends. When 3 friends enter the pot with your code, you earn 1 free entry!
                </p>
              </div>

              {/* How It Works */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">How the Referral Program Works</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <p className="text-blue-800">Share your unique referral code with friends</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <p className="text-blue-800">Friends enter the code when joining a prediction pot</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <p className="text-blue-800">After 3 confirmed referrals, you earn 1 free pot entry</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <p className="text-blue-800">Use free entries for discounted pot access (0.02 USDC)</p>
                  </div>
                </div>
              </div>

              {/* Referral Stats */}
              {referralStats && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Referral Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{referralStats.totalReferrals}</div>
                      <div className="text-sm text-gray-600">Total Referrals</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600 mb-1">{referralStats.confirmedReferrals}</div>
                      <div className="text-sm text-gray-600">Confirmed</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{referralStats.freeEntriesEarned}</div>
                      <div className="text-sm text-gray-600">Free Entries Earned</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{freeEntriesAvailable}</div>
                      <div className="text-sm text-gray-600">Available Now</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Share Buttons */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Share Your Code</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      const text = `Join me on Foresight prediction markets! Use my referral code ${referralCode} when entering your first pot. https://foresight-app.vercel.app`;
                      navigator.clipboard.writeText(text);
                      showMessage('Share message copied to clipboard!');
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300"
                  >
                    <span>📋</span>
                    <span>Copy Message</span>
                  </button>
                  
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on Foresight prediction markets! Use my referral code ${referralCode} when entering your first pot.`)}&url=https://foresight-app.vercel.app`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300"
                  >
                    <span>🐦</span>
                    <span>Share on X</span>
                  </a>
                  
                  <button
                    onClick={() => {
                      const text = `Join me on Foresight prediction markets! Use my referral code ${referralCode} when entering your first pot. https://foresight-app.vercel.app`;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Foresight Referral',
                          text: text,
                        });
                      } else {
                        navigator.clipboard.writeText(text);
                        showMessage('Share text copied to clipboard!');
                      }
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300"
                  >
                    <span>📤</span>
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              {freeEntriesAvailable > 0 ? (
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 You have free entries available!</h3>
                  <p className="text-green-700 mb-4">Use them when entering prediction pots for discounted access.</p>
                  <button
                    onClick={() => setActiveSection('bitcoinPot')}
                    className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300"
                  >
                    Use Free Entry Now
                  </button>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">Keep sharing your referral code to earn more free entries!</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-green-800">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;