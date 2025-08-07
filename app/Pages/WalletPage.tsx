import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Copy, Check, QrCode, Wallet, ArrowDown } from 'lucide-react';

// USDC Token configuration for Base chain
const USDCToken = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
  chainId: 8453,
  decimals: 6,
  name: "USD Coin",
  symbol: "USDC",
  image: "https://dynamic-assets.coinbase.com/3c15df5e2ac7d4abbe9499ed9335041f00c620f28e8de2f93474a9f432058742cdf4674bd43f309e69778a26969372310135be97eb183d91c492154176d455b8/asset_icons/9d67b728b6c8f457717154b3a35f9ddc702eae7e76c4684ee39302c4d7fd0bb8.png",
};

interface ReceivePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const WalletPage: React.FC<ReceivePageProps> = ({ activeSection, setActiveSection }) => {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Get USDC balance
  const usdcBalance = useBalance({
    address,
    token: USDCToken.address,
    chainId: 8453
  });

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

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Generate QR code data URL
  const generateQRCode = (text: string) => {
    // Simple QR code placeholder - in production, use a proper QR library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
    
    if (ctx) {
      // Create a simple placeholder pattern
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code', 100, 100);
      ctx.fillText(formatAddress(text), 100, 120);
    }
    
    return canvas.toDataURL();
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Wallet</h1>
            <p className="text-gray-600">Connect your wallet to view your receive address</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ArrowDown className="w-10 h-10 text-white" />
          </div>
          
          
          <div className="flex items-center justify-center mb-6">
            {/* <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
              <img 
                src={USDCToken.image} 
                alt="USDC"
                className="w-10 h-10 object-cover"
              />
            </div> */}
            <div className="text-center">
  <h2 className="text-md font-bold text-gray-900 flex items-center justify-center gap-2">
    <img 
      src={USDCToken.image} 
      alt="USDC"
      className="w-6 h-6 object-cover" // match approx. text-md size (~1.25rem = 20px)
    />
    {usdcBalance.data ? parseFloat(usdcBalance.data.formatted).toFixed(2) : '0.00'}
  </h2>
  <p className="text-gray-600 font-medium">USDC Balance</p>
</div>

          </div>
        </div>

       

        {/* Address Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 mb-6 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Receiver Address</h3>
            <p className="text-gray-600 text-sm">Share this address to receive USDC</p>
          </div>

          {/* Address Display */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="font-mono text-sm text-gray-900 break-all text-center leading-relaxed">
              {address}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={copyAddressToClipboard}
              className="flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <QrCode className="w-5 h-5" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* QR Code Modal/Section */}
        {showQR && (
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-6">QR Code</h3>
              
              {/* QR Code Display */}
              <div className="bg-white rounded-2xl p-6 mb-6 inline-block shadow-inner">
                <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                  {/* Placeholder QR pattern */}
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 64 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 ${
                          Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">
                Scan this QR code to get the wallet address
              </p>

              <button
                onClick={() => setShowQR(false)}
                className="text-gray-500 hover:text-gray-700 font-medium"
              >
                Hide QR Code
              </button>
            </div>
          </div>
        )}

        {/* Network Info */}
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-700 text-sm font-semibold mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Base Network</span>
          </div>
          <p className="text-blue-600 text-xs">
            Only send USDC on Base network to this address
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;