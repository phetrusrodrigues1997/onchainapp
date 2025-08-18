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
      <div className="min-h-screen bg-[#fdfdfd] flex items-center justify-center px-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-white text-2xl">↗</span>
          </div>
          <h1 className="text-3xl font-light text-black mb-4 tracking-tight">
            Referral Program
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Connect your wallet to view your referral details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <button
            onClick={() => setActiveSection('bitcoinPot')}
            className="group inline-flex items-center gap-2 text-gray-500 hover:text-black transition-colors duration-200 mb-8"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span>
            <span className="text-sm tracking-wide uppercase">Back</span>
          </button>
          
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-white text-2xl">↗</span>
          </div>
          
          <h1 className="text-4xl font-light text-black mb-4 tracking-tight">
            Referral Program
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">
            Earn free pot entries by bringing friends to the platform
          </p>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white border border-gray-200 rounded-none p-8 mb-8 shadow-sm">
          <div className="text-center">
            <h2 className="text-xl font-light text-black mb-6 tracking-wide">Your Referral Code</h2>
            
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="bg-black text-white px-6 py-4 font-mono text-2xl tracking-wider">
                {referralCode || 'LOADING...'}
              </div>
              {referralCode && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    showMessage('Code copied to clipboard');
                  }}
                  className="p-4 bg-[#aa0000] text-white border border-gray-300 hover:border-black hover:bg-black hover:text-white transition-all duration-200"
                >
                  <span className="text-sm tracking-wide uppercase">🗐 Copy</span>


                </button>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
              Share this code with friends. Every 3 confirmed referrals earns you 1 free pot entry.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white border border-gray-200 rounded-none p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-light text-black mb-8 tracking-wide text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-mono">1</div>
                <p className="text-gray-700 leading-relaxed">Share your unique referral code with friends</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-mono">2</div>
                <p className="text-gray-700 leading-relaxed">Friends enter the code when joining a prediction pot</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-mono">3</div>
                <p className="text-gray-700 leading-relaxed">After 3 confirmed referrals, you earn 1 free entry</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-mono">4</div>
                <p className="text-gray-700 leading-relaxed">Use free entries for discounted pot access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {referralStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="text-3xl font-light text-black mb-2">{referralStats.totalReferrals}</div>
              <div className="text-sm text-gray-600 tracking-wide uppercase">Total</div>
            </div>
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="text-3xl font-light text-black mb-2">{referralStats.confirmedReferrals}</div>
              <div className="text-sm text-gray-600 tracking-wide uppercase">Confirmed</div>
            </div>
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="text-3xl font-light text-black mb-2">{referralStats.freeEntriesEarned}</div>
              <div className="text-sm text-gray-600 tracking-wide uppercase">Earned</div>
            </div>
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="text-3xl font-light text-black mb-2">{freeEntriesAvailable}</div>
              <div className="text-sm text-gray-600 tracking-wide uppercase">Available</div>
            </div>
          </div>
        )}

        {/* Share Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-none p-8 mb-8">
          <h2 className="text-xl font-light text-black mb-6 tracking-wide text-center">Share Your Code</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                const text = `Join me on PrediWin prediction markets! Use my referral code ${referralCode} when entering your first pot. https://prediwin.com`;
                navigator.clipboard.writeText(text);
                showMessage('Message copied to clipboard');
              }}
              className="group p-6 bg-white border border-gray-300 hover:border-black hover:bg-black transition-all duration-200 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span className="text-sm tracking-wide uppercase text-gray-700 group-hover:text-white transition-colors duration-200">Copy Message</span>
              </div>
            </button>
            
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on PrediWin prediction markets! Use my referral code ${referralCode} when entering your first pot.`)}&url=https://prediwin.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-white border border-gray-300 hover:border-black hover:bg-black transition-all duration-200 text-center block"
            >
              <div className="flex flex-col items-center gap-3">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-sm tracking-wide uppercase text-gray-700 group-hover:text-white transition-colors duration-200">Share on X</span>
              </div>
            </a>
            
            <button
              onClick={() => {
                const text = `Join me on PrediWin prediction markets! Use my referral code ${referralCode} when entering your first pot. https://prediwin.com`;
                if (navigator.share) {
                  navigator.share({
                    title: 'PrediWin Referral',
                    text: text,
                  });
                } else {
                  navigator.clipboard.writeText(text);
                  showMessage('Share text copied to clipboard');
                }
              }}
              className="group p-6 bg-white border border-gray-300 hover:border-black hover:bg-black transition-all duration-200 text-center"
            >
              <div className="flex flex-col items-center gap-3">
                <svg className="w-6 h-6 text-gray-600 group-hover:text-white transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
                <span className="text-sm tracking-wide uppercase text-gray-700 group-hover:text-white transition-colors duration-200">Native Share</span>
              </div>
            </button>
          </div>
        </div>

        {/* Action Section */}
        {freeEntriesAvailable > 0 ? (
          <div className="bg-black text-white p-8 text-center">
            <h3 className="text-xl font-light mb-4 tracking-wide">Free Entries Available</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              You have {freeEntriesAvailable} free {freeEntriesAvailable === 1 ? 'entry' : 'entries'} ready to use
            </p>
            <button
              onClick={() => setActiveSection('bitcoinPot')}
              className="bg-white text-black px-8 py-3 hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="text-sm tracking-wide uppercase">Use Free Entry</span>
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 p-8 text-center border border-gray-200">
            <p className="text-gray-600 leading-relaxed">
              Continue sharing your referral code to earn more free entries
            </p>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className="mt-8 p-4 bg-black text-white text-center">
            <p className="text-sm tracking-wide">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralProgram;