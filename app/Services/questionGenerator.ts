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

// Free News API function
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

function getTrendingTopics(): string[] {
  const topics = [
    'AI developments', 'cryptocurrency markets', 'tech earnings', 
    'social media trends', 'celebrity announcements', 'political statements',
    'sports highlights', 'entertainment news', 'market movements'
  ];
  return topics.slice(0, 3);
}

const celebrities = [
  'Elon Musk', 'Donald Trump', 'Taylor Swift', 'Kanye West', 'Joe Biden',
  'Kim Kardashian', 'Jeff Bezos', 'Mark Zuckerberg', 'Bill Gates', 'Oprah Winfrey',
  'Cristiano Ronaldo', 'Lionel Messi', 'Ariana Grande', 'Justin Bieber', 'Rihanna',
  'Lady Gaga', 'The Rock', 'Ryan Reynolds', 'Leonardo DiCaprio', 'Brad Pitt',
  'Beyoncé', 'Drake', 'Selena Gomez', 'Tom Hanks', 'Robert Downey Jr.',
  'Jennifer Lawrence', 'Will Smith', 'Scarlett Johansson', 'Chris Evans', 'Emma Stone',
  'Zendaya', 'Michael Jordan', 'LeBron James', 'Serena Williams', 'Lewis Hamilton'
];

const activities = [
  'tweet', 'post on Instagram', 'release a song', 'announce something',
  'make a statement', 'share a photo', 'go live on social media',
  'release a video', 'make news', 'comment on current events',
  'surprise fans', 'make an appearance', 'drop hints about a project',
  'share behind-the-scenes content', 'respond to controversy',
  'start a Twitter space', 'share a TikTok', 'post a story',
  'do an interview', 'make a cameo', 'reveal a secret',
  'tease new content', 'break their silence', 'share their thoughts'
];

const topics = [
  'AI', 'cryptocurrency', 'politics', 'music', 'movies', 'technology',
  'climate change', 'space', 'fashion', 'food', 'sports', 'gaming',
  'business', 'health', 'travel', 'art', 'science', 'social media',
  'China', 'the economy', 'their latest project', 'their personal life',
  'NFTs', 'the metaverse', 'electric cars', 'renewable energy',
  'mental health', 'fitness', 'relationships', 'parenting',
  'education', 'innovation', 'startups', 'investing'
];

function generateRandomQuestion(): string {
  const celebrity = celebrities[Math.floor(Math.random() * celebrities.length)];
  const activity = activities[Math.floor(Math.random() * activities.length)];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  
  const templates = [
    `Will ${celebrity} ${activity} about ${topic} in the next 15 minutes?`,
    `Will ${celebrity} ${activity} in the next 15 minutes?`,
    `Will ${celebrity} mention ${topic} in the next 15 minutes?`,
    `Will ${celebrity} surprise everyone with a ${activity} in the next 15 minutes?`,
    `Will someone famous ${activity} about ${topic} in the next 15 minutes?`,
    `Will breaking news about ${celebrity} surface in the next 15 minutes?`,
    `Will ${celebrity} trend on social media in the next 15 minutes?`,
    `Will a major ${topic} announcement happen in the next 15 minutes?`,
    `Will ${celebrity} make headlines about ${topic} in the next 15 minutes?`,
    `Will something viral related to ${celebrity} happen in the next 15 minutes?`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Get recent questions to avoid duplicates
async function getRecentQuestions(): Promise<string[]> {
  try {
    const { db } = await import('../Database/db');
    const { LiveQuestions } = await import('../Database/schema');
    const { desc } = await import('drizzle-orm');
    
    const recentQuestions = await db
      .select({ question: LiveQuestions.question })
      .from(LiveQuestions)
      .orderBy(desc(LiveQuestions.createdAt))
      .limit(10); // Get last 10 questions to avoid
    
    return recentQuestions.map(q => q.question);
  } catch (error) {
    console.error('Error fetching recent questions:', error);
    return [];
  }
}

export async function generateQuestion() {
  try {
    // Gather real-time data and recent questions to avoid duplicates
    const [btcPrice, ethPrice, recentNews, recentQuestions] = await Promise.all([
      getCryptoPrice('BTC'),
      getCryptoPrice('ETH'),
      getRecentNews(),
      getRecentQuestions()
    ]);

    // Add variety to crypto prices for different question types
    const cryptoPrices = await Promise.all([
      getCryptoPrice('AERO'),
      getCryptoPrice('VIRTUAL'),
      getCryptoPrice('AAVE')
    ]);

    // Prepare context with real-time data
    let contextData = '';
    
    if (btcPrice) {
      contextData += `Current Bitcoin price: $${btcPrice.toLocaleString()}. `;
    }
    if (ethPrice) {
      contextData += `Current Ethereum price: $${ethPrice.toLocaleString()}. `;
    }
    
    // Add other crypto prices for variety
    const cryptoNames = ['AERO', 'VIRTUAL', 'AAVE'];
    cryptoPrices.forEach((price, index) => {
      if (price) {
        contextData += `Current ${cryptoNames[index]} price: $${price.toLocaleString()}. `;
      }
    });
    
    if (recentNews.length > 0) {
      contextData += `Recent trending news headlines: ${recentNews.slice(0, 3).join(', ')}. `;
    } else {
      contextData += `Trending topics: ${getTrendingTopics().join(', ')}. `;
    }

    // Add recent questions context to avoid duplicates
    const recentQuestionsContext = recentQuestions.length > 0 
      ? `Avoid creating questions similar to these recent ones: ${recentQuestions.slice(0, 5).join(', ')}. `
      : '';

    // Add timestamp for more variety
    const currentHour = new Date().getHours();
    const timeContext = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Changed from gpt-4o for more variety and faster response
      messages: [
        {
          role: "system",
          content: `You are a creative question generator with access to real-time data. Create fun, engaging yes/no questions about events that could realistically happen in the next 15 minutes. Focus on variety and avoid repetition.
          
          Topics to explore (rotate between them):
          - Celebrity social media activity (tweets, posts, announcements)
          - Breaking news or trending topics
          - Sports moments or announcements  
          - Tech company announcements
          - Cryptocurrency price movements (Bitcoin, Ethereum, AERO, VIRTUAL, AAVE)
          - Entertainment industry updates
          - Political statements or reactions
          - Current events and trending topics
          - Weather or natural events
          - Business announcements
          
          Current context: ${contextData}
          Time of day: ${timeContext}
          ${recentQuestionsContext}
          
          Create diverse, specific questions. Examples:
          - "Will Elon Musk tweet about AI in the next 15 minutes?"
          - "Will Bitcoin break $${btcPrice ? Math.ceil(btcPrice/1000)*1000 : '100,000'} in the next 15 minutes?"
          - "Will a major tech company make an announcement in the next 15 minutes?"
          - "Will someone post a viral video in the next 15 minutes?"
          - "Will AERO price move more than 5% in the next 15 minutes?"
          
          IMPORTANT: Create something DIFFERENT from recent questions. Be creative and varied.
          Return only the question, nothing else.`
        },
        {
          role: "user",
          content: `Generate a unique, creative yes/no question about something that could happen in the next 15 minutes. Make it different from recent questions and incorporate current ${timeContext} context. Focus on being specific and interesting.`
        }
      ],
      max_tokens: 150,
      temperature: 1.1, // Increased for more variety
    });

    const aiQuestion = completion.choices[0]?.message?.content?.trim();
    
    // Check if the AI question is too similar to recent ones
    if (aiQuestion && recentQuestions.length > 0) {
      const isTooSimilar = recentQuestions.some(recent => 
        aiQuestion.toLowerCase().includes(recent.toLowerCase().split(' ').slice(0, 3).join(' '))
      );
      
      if (isTooSimilar) {
        console.log('AI question too similar to recent ones, using fallback');
        return { question: generateRandomQuestion() };
      }
    }
    
    const question = aiQuestion || generateRandomQuestion();

    return { 
      question
    };
  } catch (error) {
    console.error('Error generating question:', error);
    
    // Fallback to random question if OpenAI fails
    const fallbackQuestion = generateRandomQuestion();
    
    return { 
      question: fallbackQuestion
    };
  }
}