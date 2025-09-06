// src/data/markets.ts
import { getTranslation } from '../Languages/languages'

// “Translation” is whatever shape getTranslation returns
type Translation = ReturnType<typeof getTranslation>

export interface Market {
  id: string
  name: string
  symbol: string
  contractAddress?: string
  color: string
  question: string
  icon: string
  currentPrice: string
  participants: number
  potSize: string
  tabId?: string
}

export const getMarkets = (t: Translation, category: string): Market[] => {

  if (category === 'sports') {
    return [
  // Football (Soccer)
  {
    id: 'chelsea-manutd',
    name: 'Chelsea vs Man United',
    symbol: '⚽️',
    color: '#034694',
    question: 'Will Chelsea beat Man United?',
    icon: 'https://www.nbc.com/sites/nbcblog/files/2024/07/paris-2024-olympics-soccer.jpg',
    currentPrice: '-',
    participants: 210,
    potSize: '$2,100',
  }
  
]
  }

  else if (category === 'options') {
    return [
      {
    id: 'Trending',
    name: 'Trending',
    symbol: '',
    contractAddress: '0xd1547F5bC0390F5020B2A80F262e28ccfeF2bf9c',
    color: '#FF5733',
    question: '',
    icon: '',
    currentPrice: '$100',
    participants: 50,
    potSize: '$500',
  },
  {
    id: 'Crypto',
    name: 'Crypto',
    symbol: '',
    contractAddress: '0xe9b69d0EA3a6E018031931d300319769c6629866',
    color: '#FF5733',
    question: 'Will Bitcoin close the day higher than it opened?',
    icon: 'https://imagenes.elpais.com/resizer/v2/RHT44JJG7YLJUGQUHJZYYMVIDM.jpg?auth=660c11fcb0487f91edb65bc9c3ee0feaf3e584d22c991318625202b52722555a&width=1200',
    currentPrice: '$100',
    participants: 50,
    potSize: '$500',
  },
  {
    id: 'stocks',
    name: 'Stocks',
    symbol: '',
    contractAddress: '0xf07E717e1dB49dDdB207C68cCb433BaE4Bc65fC9',
    color: '#228B22',
    question: 'Will Tesla stock end the day higher?',
    icon: 'https://assets.finbold.com/uploads/2025/03/Short-squeeze-alert-for-Tesla-stock-1024x682.jpg',
    currentPrice: '$190',
    participants: 49,
    potSize: '$490',
  },
  {
    id: 'music',
    name: 'Music Charts',
    symbol: '',
    contractAddress: '0xb85D3aE374b8098A6cA553dB90C0978401a34f71',
    color: '#DA70D6',
    question: 'Will "Espresso" be the #1 track on Spotify Global?',
    icon: 'https://hips.hearstapps.com/hmg-prod/images/sabrina-carpenter-2-67d15874f2a23.jpg?crop=1xw:0.4999663797740721xh;center,top&resize=1200:*',
    currentPrice: '$130',
    participants: 42,
    potSize: '$420',
  },
  {
  id: 'xtrends',
  name: 'X Trending Topics',
  symbol: '',
  color: '#FF4500',
  question: 'Which topic will rank #1 on X trending topics in the United States by 21:00 UTC today?',
  icon: '',
  currentPrice: '$250',
  participants: 62,
  potSize: '$620',
},
  {
    id: 'weather',
    name: 'Weather',
    symbol: '',
    color: '#87CEEB',
    question: '',
    icon: '',
    currentPrice: '$90',
    participants: 38,
    potSize: '$380',
  }
,
  {
    id: 'sports',
    name: 'Sports',
    symbol: '',
    color: '#33FF57',
    question: '',
    icon: '',
    currentPrice: '$200',
    participants: 75,
    potSize: '$750',
  },
  {
    id: 'politics',
    name: 'Politics',
    symbol: '',
    color: '#1E90FF',
    question: '',
    icon: '',
    currentPrice: '$310',
    participants: 62,
    potSize: '$620',
  },
  
  {
    id: 'elections',
    name: 'Elections',
    symbol: '',
    color: '#FF4500',
    question: '',
    icon: '',
    currentPrice: '$470',
    participants: 94,
    potSize: '$940',
  },
  {
    id: 'tvshows',
    name: 'TV Shows',
    symbol: '',
    color: '#8A2BE2',
    question: '',
    icon: '',
    currentPrice: '$180',
    participants: 51,
    potSize: '$510',
  },
  {
    id: 'popculture',
    name: 'Pop Culture',
    symbol: '',
    color: '#FF69B4',
    question: '',
    icon: '',
    currentPrice: '$150',
    participants: 45,
    potSize: '$450',
  },
  {
    id: 'technews',
    name: 'Tech News',
    symbol: '',
    color: '#00CED1',
    question: '',
    icon: '',
    currentPrice: '$225',
    participants: 60,
    potSize: '$600',
  },
  
  {
    id: 'movies',
    name: 'Box Office',
    symbol: '',
    color: '#FFD700',
    question: '',
    icon: '',
    currentPrice: '$270',
    participants: 58,
    potSize: '$580',
  },
  {
    id: 'space',
    name: 'Astronomy',
    symbol: '',
    color: '#7B68EE',
    question: '',
    icon: '',
    currentPrice: '$140',
    participants: 36,
    potSize: '$360',
  },
  {
    id: 'fashion',
    name: 'Fashion Trends',
    symbol: '',
    color: '#FFB6C1',
    question: '',
    icon: '',
    currentPrice: '$110',
    participants: 30,
    potSize: '$300',
  },
  {
    id: 'celebs',
    name: 'Celebrity News',
    symbol: '',
    color: '#FFA500',
    question: '',
    icon: '',
    currentPrice: '$160',
    participants: 47,
    potSize: '$470',
  },
  
  {
    id: 'health',
    name: 'Health & Fitness',
    symbol: '',
    color: '#32CD32',
    question: '',
    icon: '',
    currentPrice: '$175',
    participants: 44,
    potSize: '$440',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    symbol: '',
    color: '#6A5ACD',
    question: '',
    icon: '',
    currentPrice: '$205',
    participants: 53,
    potSize: '$530',
  },
  {
    id: 'travel',
    name: 'Travel & Tourism',
    symbol: '',
    color: '#00BFFF',
    question: '',
    icon: '',
    currentPrice: '$185',
    participants: 40,
    potSize: '$400',
  }
]

 }

 else if (category === 'Trending') {
  return [{
  id: 'Trending',
  name: 'Random Topics',
  symbol: 'Trending',
  contractAddress: '0xd1547F5bC0390F5020B2A80F262e28ccfeF2bf9c',
  color: '#1DB954',
  question: 'Will Brazil impose tariffs on goods from the US?',
  icon: 'https://www.planetware.com/photos-large/BRA/brazil-rio-cristo-redentor.jpg',
  currentPrice: '$150',
  participants: 42,
  potSize: '$420',
}
]
 }

 else if (category === 'music') {
  return [
    {
  id: 'music',
  name: 'Music Charts',
  symbol: '',
  contractAddress: '0xb85D3aE374b8098A6cA553dB90C0978401a34f71',
  color: '#DA70D6',
  question: 'Will "Espresso" be the #1 track on Spotify Global?',
  icon: 'https://hips.hearstapps.com/hmg-prod/images/sabrina-carpenter-2-67d15874f2a23.jpg?crop=1xw:0.4999663797740721xh;center,top&resize=1200:*',
  currentPrice: '$130',
  participants: 42,
  potSize: '$420',
}

  ]}

  else if (category === 'politics') {
    return [
        {
    id: 'politics',
    name: 'Politics',
    symbol: '🏛️',
    color: '#1E90FF',
    question: 'Will Trump announce new tariffs on China?',
    icon: 'https://npr.brightspotcdn.com/dims3/default/strip/false/crop/1024x683+0+0/resize/1100/quality/50/format/jpeg/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2F51%2F2a%2Fe0fa06a0482ea1bf7ea26e125ecc%2Fgettyimages-2231338669.jpg',
    currentPrice: '$310',
    participants: 62,
    potSize: '$620',
  }
    ]
  }
else if (category === 'elections') {
  return [ 
    {
    id: 'elections',
    name: 'Elections',
    symbol: '🗳️',
    color: '#FF4500',
    question: 'Who will be the next president of the United States?',
    icon: 'https://npr.brightspotcdn.com/dims3/default/strip/false/crop/7284x4449+0+0/resize/1100/quality/50/format/jpeg/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2Fb7%2F4b%2F94c7b5864828a63e245d32cac5ed%2Fgettyimages-2010291515.jpg',
    currentPrice: '$470',
    participants: 94,
    potSize: '$940',
  } 
  ]
}

else if (category === 'tvshows') {
  return [
{
    id: 'tvshows',
    name: 'TV Shows',
    symbol: '📺',
    color: '#8A2BE2',
    question: 'Will a new Stranger Things trailer be released?',
    icon: 'https://m.media-amazon.com/images/I/71W6vyI-ISL._UF1000,1000_QL80_.jpg',
    currentPrice: '$180',
    participants: 51,
    potSize: '$510',
  }
  ]
}

else if (category === 'popculture') {
  return [
    {
    id: 'popculture',
    name: 'Pop Culture',
    symbol: '🎤',
    color: '#FF69B4',
    question: 'Will Drake tweet tomorrow?',
    icon: 'https://www.binghamtonhomepage.com/wp-content/uploads/sites/79/2023/10/GettyImages-1319708929-e1696608423581.jpg?w=1280',
    currentPrice: '$150',
    participants: 45,
    potSize: '$450',
  }
  ]
}

else if (category === 'technews') {
  return [
    {
    id: 'technews',
    name: 'Tech News',
    symbol: '💻',
    color: '#00CED1',
    question: 'Will ChatGPT become open source?',
    icon: 'https://i.guim.co.uk/img/media/3e8651062ef84e39193ac5df7c3ef7a576210509/0_82_4276_2566/master/4276.jpg?width=1200&quality=85&auto=format&fit=max&s=5ebea51b85c2cf99cdf4af26fca26cc8',
    currentPrice: '$225',
    participants: 60,
    potSize: '$600',
  }
  ] }

  else if (category === 'movies') {
  return [
    {
    id: 'movies',
    name: 'Box Office',
    symbol: '🎬',
    color: '#FFD700',
    question: 'Will Leonardo DiCaprio win an Oscar?',
    icon: 'https://www.watchmojo.com/uploads/thumbs720/WM-Film-Leonardo-DiCaprio-Movies-Ranked-from-WORST-to-Best_H0G3G3-ALTF.webp',
    currentPrice: '$270',
    participants: 58,
    potSize: '$580',
  }
  ] }
  else if (category === 'space') {
  return [  
    {
    id: 'space',
    name: 'Astronomy',
    symbol: '🚀',
    color: '#7B68EE',
    question: 'Will NASA find evidence of life on Europa?',
    icon: 'https://live.staticflickr.com/65535/54088897300_03f4f1647a.jpg',
    currentPrice: '$140',
    participants: 36,
    potSize: '$360',
  }
  ] }
  else if (category === 'fashion') {
  return [
    {
    id: 'fashion',
    name: 'Fashion Trends',
    symbol: '👗',
    color: '#FFB6C1',
    question: 'Will a major fashion brand launch a new sustainable line?',
    icon: 'https://cdn01.justjared.com/wp-content/uploads/2023/05/dua-lipa-met-gala/dua-lipa-met-gala-2023-12.jpg',
    currentPrice: '$110',
    participants: 30,
    potSize: '$300',
  }
  ] }

  else if (category === 'celebs') {
  return [
    {
    id: 'celebs',
    name: 'Celebrity News',
    symbol: '🌟',
    color: '#FFA500',
    question: 'Will Dua Lipa tweet about her new album?',
    icon: 'https://www.billboard.com/wp-content/uploads/2023/05/dua-lipa-2023-met-gala-billboard-1548.jpg',
    currentPrice: '$160',
    participants: 47,
    potSize: '$470',
  }
  ] }

  else if (category === 'health') {
  return [
    {
    id: 'health',
    name: 'Health & Fitness',
    symbol: '💪',
    color: '#32CD32',
    question: 'Will Pfizer announce a new advertisement?',
    icon: 'https://c.files.bbci.co.uk/1229D/production/_118379347_f959b3bf-db0b-4dc9-822e-64a7ea6170e0.jpg',
    currentPrice: '$175',
    participants: 44,
    potSize: '$440',
  }
  ] }
  
else if (category === 'gaming') {
  return [
    {
    id: 'gaming',
    name: 'Gaming',
    symbol: '🎮',
    color: '#6A5ACD',
    question: 'Will GTA 6 be announced?',
    icon: 'https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQuA0KJU4AVBo1FaTNbw4YaeVDbBNcZWplhTLyZ-JygNodAlFVgvAwAwrzEjHL5QHxjcjOBHg',
    currentPrice: '$205',
    participants: 53,
    potSize: '$530',
  }
  ] }

  else if (category === 'travel') {
  return [
    {
    id: 'travel',
    name: 'Travel & Tourism',
    symbol: '✈️',
    color: '#00BFFF',
    question: 'Will Ibiza have the hottest weather in Spain?',
    icon: 'https://static.vecteezy.com/system/resources/thumbnails/012/400/885/small_2x/tropical-sunset-beach-and-sky-background-as-exotic-summer-landscape-with-beach-swing-or-hammock-and-white-sand-and-calm-sea-beach-banner-paradise-island-beach-vacation-or-summer-holiday-destination-photo.jpg',
    currentPrice: '$185',
    participants: 40,
    potSize: '$400',
  }
  ] } 


 else if (category === 'weather') {
  return [
    {
      id: 'london-temp-3pm',
      name: 'London 3PM ≥ 22°C',
      symbol: '',
      color: '#4682B4',
      question: 'Will the temperature at London Heathrow at 15:00 UTC today be 22°C or higher?',
      icon: 'https://cdn.mos.cms.futurecdn.net/ZcS3oG3vjPb4mnVcRYGbmk.jpg',
      currentPrice: '-',
      participants: 94,
      potSize: '$940',
    },
    
  ]
}


 else if (category === 'stocks') {
  return [
    {
    id: 'stocks',
    name: 'Tesla',
    symbol: 'TSLA',
    contractAddress: '0xf07E717e1dB49dDdB207C68cCb433BaE4Bc65fC9',
    color: '#E31837',
    question: t.teslaQuestion ?? '',
    icon: 'https://assets.finbold.com/uploads/2025/03/Short-squeeze-alert-for-Tesla-stock-1024x682.jpg',
    currentPrice: '$248.50',
    participants: 156,
    potSize: '$1,560',
  },
  
  ]
}

else if (category === 'Crypto'){
  return [
    {
    id: 'Crypto',
    name: 'crypto',
    symbol: '',
    contractAddress: '0xe9b69d0EA3a6E018031931d300319769c6629866',
    color: '#FF5733',
    question: 'Will Bitcoin close the day higher than it opened?',
    icon: 'https://imagenes.elpais.com/resizer/v2/RHT44JJG7YLJUGQUHJZYYMVIDM.jpg?auth=660c11fcb0487f91edb65bc9c3ee0feaf3e584d22c991318625202b52722555a&width=1200',
    currentPrice: '$100',
    participants: 50,
    potSize: '$500',
  }]
}

else if (category === 'xtrends') {
  return [
    {
      id: 'us-sports-top',
      name: 'Sports',
      symbol: '',
      color: '#1DA1F2',
      question: 'Will a sports-related topic be the #1 trending topic on X in the United States at 21:00 UTC today?',
      icon: 'https://cdn.mos.cms.futurecdn.net/Pwh2dVaGJY9yDxznmn8vEg.jpg',
      currentPrice: '-',
      participants: 112,
      potSize: '$1120',
    }
  ] }

  // Default category (financial/crypto/etc)
  return [
  
]
}



