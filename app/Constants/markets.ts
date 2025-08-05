// src/data/markets.ts
import { getTranslation } from '../Languages/languages'
import React, { useEffect, useState } from 'react';
import { getPrice } from '../Constants/getPrice';

// “Translation” is whatever shape getTranslation returns
type Translation = ReturnType<typeof getTranslation>

export interface Market {
  id: string
  name: string
  symbol: string
  color: string
  question: string
  icon: string
  currentPrice: string
  participants: number
  potSize: string
}

export const getMarkets = (t: Translation, category: String): Market[] => {
  const [bitcoinPrice, setBitcoinPrice] = useState<number | null>(null);
  const [ethereumPrice, setEthereumPrice] = useState<number | null>(null);

useEffect(() => {
    async function fetchPrice() {
      const price = await getPrice('bitcoin');
      const ethPrice = await getPrice('ethereum');
      setBitcoinPrice(price);
      setEthereumPrice(ethPrice);
    }
    fetchPrice();
  }, []);

  if (category === 'sports') {
    return [
  // Football (Soccer)
  {
    id: 'chelsea-manutd',
    name: 'Chelsea vs Man United',
    symbol: '⚽️',
    color: '#034694',
    question: '',
    icon: '⚽️',
    currentPrice: '-',
    participants: 210,
    potSize: '$2,100',
  }
  
]
  }

  else if (category === 'options') {
    return [
      {
    id: 'Featured',
    name: 'Featured',
    symbol: '★',
    color: '#FF5733',
    question: '',
    icon: '★',
    currentPrice: '$100',
    participants: 50,
    potSize: '$500',
  },
  {
    id: 'crypto',
    name: 'Crypto',
    symbol: '₿',
    color: '#FF5733',
    question: '',
    icon: '₿',
    currentPrice: '$100',
    participants: 50,
    potSize: '$500',
  },
  {
    id: 'stocks',
    name: 'Stocks',
    symbol: '💰',
    color: '#228B22',
    question: '',
    icon: '💰',
    currentPrice: '$190',
    participants: 49,
    potSize: '$490',
  },
  {
  id: 'xtrends',
  name: 'X Trending Topics',
  symbol: '🔥',
  color: '#FF4500',
  question: 'Which topic will rank #1 on X trending topics in the United States by 21:00 UTC today?',
  icon: '🔥',
  currentPrice: '$250',
  participants: 62,
  potSize: '$620',
},
  {
    id: 'weather',
    name: 'Weather',
    symbol: '☁️',
    color: '#87CEEB',
    question: '',
    icon: '☁️',
    currentPrice: '$90',
    participants: 38,
    potSize: '$380',
  }
,
{
    id: 'music',
    name: 'Music Charts',
    symbol: '🎵',
    color: '#DA70D6',
    question: '',
    icon: '🎵',
    currentPrice: '$130',
    participants: 42,
    potSize: '$420',
  },
  {
    id: 'sports',
    name: 'Sports',
    symbol: '🏆',
    color: '#33FF57',
    question: '',
    icon: '🏆',
    currentPrice: '$200',
    participants: 75,
    potSize: '$750',
  },
  {
    id: 'politics',
    name: 'Politics',
    symbol: '🏛️',
    color: '#1E90FF',
    question: '',
    icon: '🏛️',
    currentPrice: '$310',
    participants: 62,
    potSize: '$620',
  },
  
  {
    id: 'elections',
    name: 'Elections',
    symbol: '🗳️',
    color: '#FF4500',
    question: '',
    icon: '🗳️',
    currentPrice: '$470',
    participants: 94,
    potSize: '$940',
  },
  {
    id: 'tvshows',
    name: 'TV Shows',
    symbol: '📺',
    color: '#8A2BE2',
    question: '',
    icon: '📺',
    currentPrice: '$180',
    participants: 51,
    potSize: '$510',
  },
  {
    id: 'popculture',
    name: 'Pop Culture',
    symbol: '🎤',
    color: '#FF69B4',
    question: '',
    icon: '🎤',
    currentPrice: '$150',
    participants: 45,
    potSize: '$450',
  },
  {
    id: 'technews',
    name: 'Tech News',
    symbol: '💻',
    color: '#00CED1',
    question: '',
    icon: '💻',
    currentPrice: '$225',
    participants: 60,
    potSize: '$600',
  },
  
  {
    id: 'movies',
    name: 'Box Office',
    symbol: '🎬',
    color: '#FFD700',
    question: '',
    icon: '🎬',
    currentPrice: '$270',
    participants: 58,
    potSize: '$580',
  },
  {
    id: 'space',
    name: 'Space & Astronomy',
    symbol: '🚀',
    color: '#7B68EE',
    question: '',
    icon: '🚀',
    currentPrice: '$140',
    participants: 36,
    potSize: '$360',
  },
  {
    id: 'fashion',
    name: 'Fashion Trends',
    symbol: '👗',
    color: '#FFB6C1',
    question: '',
    icon: '👗',
    currentPrice: '$110',
    participants: 30,
    potSize: '$300',
  },
  {
    id: 'celebs',
    name: 'Celebrity News',
    symbol: '🌟',
    color: '#FFA500',
    question: '',
    icon: '🌟',
    currentPrice: '$160',
    participants: 47,
    potSize: '$470',
  },
  
  {
    id: 'health',
    name: 'Health & Fitness',
    symbol: '💪',
    color: '#32CD32',
    question: '',
    icon: '💪',
    currentPrice: '$175',
    participants: 44,
    potSize: '$440',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    symbol: '🎮',
    color: '#6A5ACD',
    question: '',
    icon: '🎮',
    currentPrice: '$205',
    participants: 53,
    potSize: '$530',
  },
  {
    id: 'travel',
    name: 'Travel & Tourism',
    symbol: '✈️',
    color: '#00BFFF',
    question: '',
    icon: '✈️',
    currentPrice: '$185',
    participants: 40,
    potSize: '$400',
  }
]

 }

 else if (category === 'Featured') {
  return [{
  id: 'Featured',
  name: 'Featured - Random Topics',
  symbol: '',
  color: '#1DB954',
  question: 'Will Elon Musk talk about Trump tomorrow?',
  icon: 'https://media-cldnry.s-nbcnews.com/image/upload/t_fit-1500w,f_auto,q_auto:best/rockcms/2024-12/241219-elon-musk-vl-347p-f0e2a5.jpg',
  currentPrice: '$150',
  participants: 42,
  potSize: '$420',
}
]
 }

 else if (category === 'music') {
  return [
    {
  id: 'spotify-global-1',
  name: 'Global #1',
  symbol: '',
  color: '#1DB954',
  question: 'Will “Espresso” be the #1 track on Spotify Global Top 50 by 21:00 UTC today?',
  icon: '🌍',
  currentPrice: '$150',
  participants: 42,
  potSize: '$420',
}

  ]}

 else if (category === 'weather') {
  return [
    {
      id: 'london-temp-3pm',
      name: 'London 3PM ≥ 22°C',
      symbol: '🌡️',
      color: '#4682B4',
      question: 'Will the temperature at London Heathrow at 15:00 UTC today be 22°C or higher?',
      icon: '🌡️',
      currentPrice: '-',
      participants: 94,
      potSize: '$940',
    },
    
  ]
}


 else if (category === 'stocks') {
  return [
    {
    id: 'tesla',
    name: 'Tesla',
    symbol: 'TSLA',
    color: '#E31837',
    question: t.teslaQuestion ?? '',
    icon: '🚗',
    currentPrice: '$248.50',
    participants: 156,
    potSize: '$1,560',
  },
  
  ]
}

else if (category === 'xtrends') {
  return [
    {
      id: 'us-sports-top',
      name: 'Sports',
      symbol: '',
      color: '#1DA1F2',
      question: 'Will a sports-related topic be the #1 trending topic on X in the United States at 21:00 UTC today?',
      icon: '🏈',
      currentPrice: '-',
      participants: 112,
      potSize: '$1120',
    }
  ] }

  // Default category (financial/crypto/etc)
  return [
  {
    id: 'Crypto',
    name: 'Crypto',
    symbol: 'BTC',
    color: '#F7931A',
    question: t.bitcoinQuestion ?? '',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/800px-Bitcoin.svg.png',
    currentPrice: bitcoinPrice !== null ? `$${bitcoinPrice.toFixed(2)}` : '$0.00',
    participants: 127,
    potSize: '$1,270',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    question: t.ethereumQuestion ?? '',
    icon:"https://dynamic-assets.coinbase.com/dbb4b4983bde81309ddab83eb598358eb44375b930b94687ebe38bc22e52c3b2125258ffb8477a5ef22e33d6bd72e32a506c391caa13af64c00e46613c3e5806/asset_icons/4113b082d21cc5fab17fc8f2d19fb996165bcce635e6900f7fc2d57c4ef33ae9.png",
    currentPrice: '$3,456',
    participants: 89,
    potSize: '$890',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    color: '#9945FF',
    question: t.solanaQuestion ?? '',
    icon: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
    currentPrice: '$198',
    participants: 64,
    potSize: '$640',
  },
  
  {
    id: 'dogecoin',
    name: 'Dogecoin',
    symbol: 'DOGE',
    color: '#C2A633',
    question: t.dogecoinQuestion ?? '',
    icon: 'https://upload.wikimedia.org/wikipedia/en/d/d0/Dogecoin_Logo.png',
    currentPrice: '$0.075',
    participants: 72,
    potSize: '$720',
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    color: '#0033AD',
    question: t.cardanoQuestion ?? '',
    icon: 'https://static1.tokenterminal.com//cardano/logo.png',
    currentPrice: '$0.42',
    participants: 54,
    potSize: '$540',
  },
  {
    id: 'xrp',
    name: 'XRP',
    symbol: 'XRP',
    color: '#346AA9',
    question: t.xrpQuestion ?? '',
    icon: 'https://zengo.com/wp-content/uploads/xrp-1.png',
    currentPrice: '$0.62',
    participants: 60,
    potSize: '$600',
  },
 
  {
    id: 'litecoin',
    name: 'Litecoin',
    symbol: 'LTC',
    color: '#BEBEBE',
    question: t.litecoinQuestion ?? '',
    icon: 'https://s3.coinmarketcap.com/static/img/portraits/630c5fcaf8184351dc5c6ee5.png',
    currentPrice: '$150.25',
    participants: 45,
    potSize: '$450',
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    color: '#E6007A',
    question: t.polkadotQuestion ?? '',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/200x200/6636.png',
    currentPrice: '$6.50',
    participants: 38,
    potSize: '$380',
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    color: '#375BD2',
    question: t.chainlinkQuestion ?? '',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/200x200/1975.png',
    currentPrice: '$8.75',
    participants: 50,
    potSize: '$500',
  }
]
}



