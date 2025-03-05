 import React, { useState } from 'react';
import type { Token } from '@coinbase/onchainkit/token';


const TokenSelectModal = ({ isOpen, onClose, onSelectToken, tokens = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter tokens based on search query
  const filteredTokens = tokens?.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-900">Swap To Token</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 relative">
          <div className="flex items-center border border-gray-300 rounded-full px-3 py-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="WETH, USDC, 0x..."
              className="w-full ml-2 focus:outline-none text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-2 max-h-96 overflow-y-auto">
          {filteredTokens.map((token) => (
            <div 
              key={token.address}
              onClick={() => onSelectToken(token)}
              className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 mr-3 rounded-full overflow-hidden flex-shrink-0">
                  <img src={token.image || '/api/placeholder/32/32'} alt={token.symbol} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-xs text-gray-500 truncate max-w-xs">
                    {token.address?.substring(0, 6)}...{token.address?.substring(token.address.length - 4)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{token.balance || '0.00000'}</div>
                <div className="text-xs text-gray-500">~${token.usdValue || '0.00'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Usage example component that includes both the modal and a demo UI
const TokenSwapWithSelector = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectingFor, setSelectingFor] = useState(null); // 'from' or 'to'
  
  // Example tokens array
  const tokens = [
    {
      symbol: 'ETH',
      name: 'Ethereum',
      address: '0x0000000000000000000000000000000000000000',
      image: 'https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png',
      balance: '0.00073',
      usdValue: '1.61359'
    },
    {
      symbol: 'fBOMB',
      name: 'fBOMB',
      address: '0x74cc...e8979',
      image: '/api/placeholder/32/32',
      balance: '9.36154',
      usdValue: '0.2567'
    },
    {
      symbol: 'ANIME',
      name: 'ANIME',
      address: '0x0e0c...c9564',
      image: '/api/placeholder/32/32',
      balance: '0.12542',
      usdValue: '0.00001'
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ethereum',
      address: '0x4200...00006',
      image: '/api/placeholder/32/32',
      balance: '0.0',
      usdValue: '0.0'
    },
    {
      symbol: 'L2VE',
      name: 'L2VE',
      address: '0xa193...c12f4',
      image: '/api/placeholder/32/32',
      balance: '0.00004',
      usdValue: '0.0'
    }
  ];
  
  const openModal = (type) => {
    setSelectingFor(type);
    setIsModalOpen(true);
  };
  
  const handleSelectToken = (token) => {
    setSelectedToken(token);
    setIsModalOpen(false);
  };
  
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">From</p>
        <button 
          onClick={() => openModal('from')}
          className="flex items-center space-x-2 border border-gray-200 rounded-full p-2 w-full"
        >
          <img 
            src={selectedToken?.image || '/api/placeholder/24/24'} 
            alt="Token" 
            className="w-6 h-6 rounded-full"
          />
          <span>{selectedToken?.symbol || 'Select Token'}</span>
          <span className="ml-auto">▼</span>
        </button>
      </div>
      
      <TokenSelectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectToken={handleSelectToken}
        tokens={tokens}
      />
    </div>
  );
};

export default TokenSelectModal;