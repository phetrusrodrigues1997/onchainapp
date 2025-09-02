import React, { useState } from "react";
import { useAccount } from 'wagmi';
import { Copy, Check, QrCode, Wallet, ArrowLeft } from 'lucide-react';

interface ReceiveSectionProps {
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

const ReceiveSection: React.FC<ReceiveSectionProps> = ({ activeSection, setActiveSection }) => {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);

  const copyAddressToClipboard = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  // QR Code component
  const QRCodeDisplay = ({ value }: { value: string }) => {
    return (
      <div className="bg-white p-3 rounded-xl shadow-inner border">
        <div className="w-32 h-32 bg-white flex items-center justify-center mx-auto">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=000000&margin=3`}
            alt="QR Code"
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `
                <div class="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-gray-400 text-xs">QR Code</div>
                    <div class="text-xs text-gray-500">Unavailable</div>
                  </div>
                </div>
              `;
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-4 py-8">
        

        {!isConnected || !address ? (
          /* Not Connected State */
          <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 text-center shadow-xl">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-black mb-3">Connect Your Wallet</h2>
            <p className="text-gray-600">
              Connect your wallet to view your receive address and QR code
            </p>
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            {/* Combined QR Code & Address Section */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 p-5 shadow-xl">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full mb-3">
                  <QrCode className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-600">Receive ETH</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <QRCodeDisplay value={address} />
              </div>

              {/* Wallet Address */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="font-mono text-xs text-gray-900 break-all text-center leading-relaxed">
                  {address}
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={copyAddressToClipboard}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-3"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>

              {/* Network Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 text-xs font-semibold">Base Network Only</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiveSection;