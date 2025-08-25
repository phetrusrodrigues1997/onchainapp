import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import { Copy, Check, QrCode, Wallet, ArrowDown } from 'lucide-react';
import { getPrice } from '../Constants/getPrice';

// ETH Token configuration for Base chain
const ETHToken = {
  chainId: 8453,
  decimals: 18,
  name: "Ethereum",
  symbol: "ETH",
  image:"https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",

};

interface ReceivePageProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const WalletPage: React.FC<ReceivePageProps> = ({ activeSection, setActiveSection }) => {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState<boolean>(true);

  // Get ETH balance
  const ethBalance = useBalance({
    address,
    chainId: 8453
  });

  // Fetch ETH price
  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const price = await getPrice('ETH');
        setEthPrice(price);
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Failed to fetch ETH price:', error);
        setEthPrice(4700); // Fallback price
        setIsLoadingPrice(false);
      }
    };

    fetchEthPrice();
    
    // Refresh price every 5 minutes
    const interval = setInterval(fetchEthPrice, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to convert ETH to USD
  const ethToUsd = (ethAmount: bigint): number => {
    const fallbackEthPrice = 4700;
    const currentEthPrice = ethPrice || fallbackEthPrice;
    const ethValue = Number(formatUnits(ethAmount, 18));
    return ethValue * currentEthPrice;
  };

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
      src={ETHToken.image} 
      alt="ETH"
      className="w-6 h-6 object-cover" // match approx. text-md size (~1.25rem = 20px)
    />
    {ethBalance.data ? `$${ethToUsd(ethBalance.data.value).toFixed(2)}` : '$0.00'}
  </h2>
  <p className="text-gray-600 font-medium">ETH Balance</p>
</div>

          </div>
        </div>

       

        {/* Address Card */}
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 mb-6 shadow-2xl">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Receiver Address</h3>
            <p className="text-gray-600 text-sm">Share this address to receive ETH on the Base network.</p>
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
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg"
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
            Only send ETH on Base network to this address
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;