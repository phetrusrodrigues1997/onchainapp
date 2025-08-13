import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Import the existing crypto price function
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

const symbolToIdMap: Record<string, string> = {
  ETH: 'ethereum',
  BTC: 'bitcoin',
  AERO: 'aerodrome-finance',
  VIRTUAL: 'virtual-protocol',
  AAVE: 'aave',
  USDC: 'usd-coin',
};

async function getCryptoPrice(symbolOrId: string): Promise<number | null> {
  const id = symbolToIdMap[symbolOrId.toUpperCase()] || symbolOrId.toLowerCase();
  try {
    const response = await fetch(`${COINGECKO_API}?ids=${id}&vs_currencies=usd`);
    const data = await response.json();
    return data[id]?.usd ?? null;
  } catch (error) {
    console.error(`Error fetching price for ${symbolOrId}:`, error);
    return null;
  }
}

// Free News API function (using The News API)
async function getRecentNews(): Promise<string[]> {
  try {
    const response = await fetch('https://api.thenewsapi.com/v1/news/top?api_token=free&locale=us&limit=5');
    const data = await response.json();
    
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((article: any) => article.title).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Simple function to get trending topics (fallback if news API fails)
function getTrendingTopics(): string[] {
  const topics = [
    'AI developments', 'cryptocurrency markets', 'tech earnings', 
    'social media trends', 'celebrity announcements', 'political statements',
    'sports highlights', 'entertainment news', 'market movements'
  ];
  return topics.slice(0, 3); // Return 3 random topics
}

const celebrities = [
  'Elon Musk', 'Donald Trump', 'Taylor Swift', 'Kanye West', 'Joe Biden',
  'Kim Kardashian', 'Jeff Bezos', 'Mark Zuckerberg', 'Bill Gates', 'Oprah Winfrey',
  'Cristiano Ronaldo', 'Lionel Messi', 'Ariana Grande', 'Justin Bieber', 'Rihanna',
  'Lady Gaga', 'The Rock', 'Ryan Reynolds', 'Leonardo DiCaprio', 'Brad Pitt'
];

const activities = [
  'tweet', 'post on Instagram', 'release a song', 'announce something',
  'make a statement', 'share a photo', 'go live on social media',
  'release a video', 'make news', 'comment on current events',
  'surprise fans', 'make an appearance', 'drop hints about a project',
  'share behind-the-scenes content', 'respond to controversy'
];

const topics = [
  'AI', 'cryptocurrency', 'politics', 'music', 'movies', 'technology',
  'climate change', 'space', 'fashion', 'food', 'sports', 'gaming',
  'business', 'health', 'travel', 'art', 'science', 'social media',
  'China', 'the economy', 'their latest project', 'their personal life'
];

const generateRandomQuestion = () => {
  const celebrity = celebrities[Math.floor(Math.random() * celebrities.length)];
  const activity = activities[Math.floor(Math.random() * activities.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  const templates = [
    `Will ${celebrity} ${activity} about ${topic} in the next 15 minutes?`,
    `Will ${celebrity} ${activity} in the next 15 minutes?`,
    `Will ${celebrity} mention ${topic} in the next 15 minutes?`,
    `Will ${celebrity} surprise everyone with a ${activity} in the next 15 minutes?`,
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

export async function POST(request: NextRequest) {
  try {
    // Gather real-time data
    const [btcPrice, ethPrice, recentNews] = await Promise.all([
      getCryptoPrice('BTC'),
      getCryptoPrice('ETH'),
      getRecentNews()
    ]);

    // Prepare context with real-time data
    let contextData = '';
    
    if (btcPrice) {
      contextData += `Current Bitcoin price: $${btcPrice.toLocaleString()}. `;
    }
    if (ethPrice) {
      contextData += `Current Ethereum price: $${ethPrice.toLocaleString()}. `;
    }
    
    if (recentNews.length > 0) {
      contextData += `Recent trending news headlines: ${recentNews.slice(0, 3).join(', ')}. `;
    } else {
      contextData += `Trending topics: ${getTrendingTopics().join(', ')}. `;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a creative question generator with access to real-time data. Create fun, engaging yes/no questions about events that could realistically happen in the next 15 minutes. Focus on:
          - Celebrity social media activity (tweets, posts, announcements)
          - Breaking news or trending topics
          - Sports moments or announcements
          - Tech company announcements
          - Cryptocurrency price movements
          - Entertainment industry updates
          - Political statements or reactions
          - Current events and trending topics
          
          Use this real-time context to make more relevant questions: ${contextData}
          
          Make questions specific, timely, and interesting. Examples:
          - "Will Elon Musk tweet about AI in the next 15 minutes?"
          - "Will Bitcoin break $${btcPrice ? Math.ceil(btcPrice/1000)*1000 : '100,000'} in the next 15 minutes?"
          - "Will someone famous respond to the trending news in the next 15 minutes?"
          
          Return only the question, nothing else.`
        },
        {
          role: "user",
          content: "Generate a fun yes/no question about something that could happen in the next 15 minutes, incorporating current market conditions and trending topics."
        }
      ],
      max_tokens: 100,
      temperature: 0.9,
    });

    const aiQuestion = completion.choices[0]?.message?.content?.trim();
    const question = aiQuestion || generateRandomQuestion();

    return NextResponse.json({ 
      question
    });
  } catch (error) {
    console.error('Error generating question:', error);
    
    // Fallback to random question if OpenAI fails
    const fallbackQuestion = generateRandomQuestion();
    
    return NextResponse.json({ 
      question: fallbackQuestion
    });
  }
}