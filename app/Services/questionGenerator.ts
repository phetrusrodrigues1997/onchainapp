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
  
  // Focus on EASILY VERIFIABLE questions with BALANCED OUTCOMES (not obvious answers)
  const templates = [
    // Social media posts (roughly 50/50 chance - celebrities don't post every 15 minutes)
    `Will ${celebrity} post on X/Twitter in the next 15 minutes?`,
    `Will ${celebrity} post on Instagram in the next 15 minutes?`,
    
    // Cryptocurrency current price comparisons (perfect 50/50 chance)
    `Will Bitcoin price be above its current price in the next 15 minutes?`,
    `Will Bitcoin price be below its current price in the next 15 minutes?`,
    `Will Ethereum price be above its current price in the next 15 minutes?`,
    `Will Ethereum price be below its current price in the next 15 minutes?`,
    
    // News websites (balanced - major sites don't publish every 15 minutes)
    `Will CNN publish a new article in the next 15 minutes?`,
    `Will BBC News post a new story in the next 15 minutes?`,
    `Will Reuters publish a new article in the next 15 minutes?`,
    `Will The New York Times publish a new article in the next 15 minutes?`,
    
    // Stock prices with reasonable thresholds (balanced outcomes)
    `Will Apple stock (AAPL) price be above $200 in the next 15 minutes?`,
    `Will Tesla stock (TSLA) price be above $250 in the next 15 minutes?`,
    `Will Google stock (GOOGL) price be above $160 in the next 15 minutes?`,
    `Will Amazon stock (AMZN) price be above $190 in the next 15 minutes?`,
    `Will Microsoft stock (MSFT) price be above $420 in the next 15 minutes?`,
    
    
    // Additional current price comparisons (perfect 50/50 balance)
    `Will AAVE token price be above its current price in the next 15 minutes?`,
    `Will USDC be 2 cents above or below $1 in the next 15 minutes?`,
    
    // More current price comparisons (perfect 50/50 outcomes)
    `Will AERO token price be above its current price in the next 15 minutes?`,
    `Will VIRTUAL token price be above its current price in the next 15 minutes?`
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

// Generate a batch of 24 questions for 6 hours (24 * 15-minute slots)
// Helper function to get live games data
async function getLiveGamesData() {
  try {
    const { getAllLiveGames } = await import('./sportsData');
    return await getAllLiveGames();
  } catch (error) {
    console.error('Error getting live games:', error);
    return { nfl: [], nba: [] };
  }
}

export async function generateQuestionBatch(count: number = 24) {
  try {
    // Gather real-time data and recent questions to avoid duplicates
    const [btcPrice, ethPrice, recentNews, recentQuestions, liveGames] = await Promise.all([
      getCryptoPrice('BTC'),
      getCryptoPrice('ETH'),
      getRecentNews(),
      getRecentQuestions(),
      getLiveGamesData()
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
      ? `Avoid creating questions similar to these recent ones: ${recentQuestions.slice(0, 10).join(', ')}. `
      : '';

    // Add timestamp for more variety
    const currentHour = new Date().getHours();
    const timeContext = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
    
    // Add live sports context if games are happening
    const liveGamesContext = liveGames.nfl.length > 0 || liveGames.nba.length > 0 
      ? `Live games currently happening: NFL games: ${liveGames.nfl.map(g => g.shortName).join(', ')}, NBA games: ${liveGames.nba.map(g => g.shortName).join(', ')}. You can create questions about these specific live games.`
      : 'No live games currently happening. Avoid questions about live sports results.';

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a creative question generator creating ${count} diverse yes/no questions about events that could happen in the next 15 minutes each. Create a varied mix covering different categories:
          
          Categories to cover (distribute evenly) - ALL MUST BE EASILY VERIFIABLE:
          - Social media posts (X/Twitter, Instagram) - easily verified by visiting the platform
          - Cryptocurrency current price comparisons - "above/below current price" (perfect 50/50 chance)
          - News website article publications - easily verified by checking CNN.com, BBC.com, Reuters.com homepage
          - Stock prices current comparisons - "above/below current price" (perfect 50/50 chance)
          - Time-based questions - easily verified by checking current time
          - Sports scores (when games are live) - easily verified on ESPN.com scoreboard
          
          Current context: ${contextData}
          Time of day: ${timeContext}
          ${recentQuestionsContext}
          Sports context: ${liveGamesContext}
          
          CRITICAL REQUIREMENTS - QUESTIONS MUST BE EASILY VERIFIABLE & BALANCED:
          ✅ SPECIFIC: Use exact names, numbers, thresholds
          ✅ EASILY VERIFIABLE: Anyone can check the answer in 30 seconds on a major website
          ✅ BALANCED OUTCOMES: Roughly 50/50 chance for YES/NO - avoid obvious answers
          ✅ REALISTIC: Possible within 15 minutes
          ✅ CLEAR: No ambiguous terms like "major", "famous", "expert", "significant"
          ✅ ACCESSIBLE: Verifiable on popular websites (CNN.com, CoinGecko, Yahoo Finance, X.com, Instagram.com, ESPN.com)
          
          ❌ AVOID HARD-TO-VERIFY OR OBVIOUS QUESTIONS:
          - "Will there be a foul in the NBA game?" → Sports sites don't show individual fouls
          - "Will a timeout be called?" → Not prominently displayed on scoreboards
          - "Will someone get a first down?" → Play-by-play details aren't always visible
          - "Will it rain in New York?" → Weather changes are hard to verify quickly
          - "Will a stock hit a new daily high?" → Requires tracking throughout the day
          - "Will Bitcoin's last digit be odd?" → OBVIOUS YES - crypto prices change constantly
          - "Will any cryptocurrency change price?" → OBVIOUS YES - prices always fluctuate
          - "Will it be past midnight somewhere?" → OBVIOUS YES - time zones make this guaranteed
          - "Will Bitcoin remain #1 by market cap?" → OBVIOUS YES - rankings are very stable
          - "Will Bitcoin be between $X-$Y?" → COMPLEX - hard to verify, use current price instead
          
          ✅ PERFECT EXAMPLES (Easy to verify + 50/50 balance):
          - "Will Elon Musk post on X/Twitter in the next 15 minutes?" (check @elonmusk)
          - "Will Bitcoin price be above its current price in the next 15 minutes?" (check CoinGecko - perfect 50/50)
          - "Will CNN publish a new article in the next 15 minutes?" (check CNN.com homepage)
          - "Will Apple stock be above its current price in the next 15 minutes?" (check Yahoo Finance - perfect 50/50)
          - "Will the Lakers score change from its current score?" (check ESPN.com when games are live)
          - "Will the seconds be greater than 30 when this expires?" (check current time - true 50/50)
          
          ❌ HARD-TO-VERIFY EXAMPLES:
          - "Will there be a foul called in the Lakers game?" (fouls aren't prominently shown)
          - "Will it start raining in Los Angeles?" (weather changes hard to verify)
          - "Will Apple stock hit a new daily high?" (requires historical tracking)
          
          Return EXACTLY ${count} questions as a JSON array of strings.
          
          Generate ${count} specific, verifiable questions now.`
        },
        {
          role: "user",
          content: `Create ${count} specific, verifiable yes/no questions about things that could realistically happen in the next 15 minutes. Each question must be answerable with a clear YES or NO by checking specific, named sources. Avoid all vague terms. Return as a JSON array.`
        }
      ],
      max_tokens: 2000,
      temperature: 1.2, // High temperature for maximum variety
    });

    const response = completion.choices[0]?.message?.content?.trim();
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    try {
      // Try to parse as JSON
      const questions = JSON.parse(response);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions.slice(0, count).map((q: any) => ({ question: String(q).trim() }));
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
    }

    // Fallback: if JSON parsing fails, try to extract questions from text
    const lines = response.split('\n').filter(line => line.trim().length > 10);
    const extractedQuestions = lines.map(line => {
      // Remove common prefixes and clean up
      let cleaned = line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim();
      if (cleaned.includes('?')) {
        return { question: cleaned };
      }
      return null;
    }).filter(q => q !== null).slice(0, count);

    if (extractedQuestions.length > 0) {
      return extractedQuestions;
    }

    // Ultimate fallback: generate random questions
    const fallbackQuestions = [];
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({ question: generateRandomQuestion() });
    }
    return fallbackQuestions;

  } catch (error) {
    console.error('Error generating question batch:', error);
    
    // Fallback to random questions
    const fallbackQuestions = [];
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({ question: generateRandomQuestion() });
    }
    return fallbackQuestions;
  }
}

// Keep the single question generator for compatibility
export async function generateQuestion() {
  try {
    // Gather real-time data and recent questions to avoid duplicates
    const [btcPrice, ethPrice, recentNews, recentQuestions, liveGames] = await Promise.all([
      getCryptoPrice('BTC'),
      getCryptoPrice('ETH'),
      getRecentNews(),
      getRecentQuestions(),
      getLiveGamesData()
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
    
    // Add live sports context
    const liveGamesContext = liveGames.nfl.length > 0 || liveGames.nba.length > 0 
      ? `Live games: NFL: ${liveGames.nfl.map(g => g.shortName).join(', ')}, NBA: ${liveGames.nba.map(g => g.shortName).join(', ')}`
      : 'No live games currently';

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Changed from gpt-4o for more variety and faster response
      messages: [
        {
          role: "system",
          content: `You are a creative question generator with access to real-time data. Create specific, verifiable yes/no questions about events that could realistically happen in the next 15 minutes.
          
          REQUIREMENTS - Questions must be:
          ✅ SPECIFIC: Use exact names, numbers, thresholds
          ✅ VERIFIABLE: Anyone can check the answer objectively
          ✅ BALANCED: Roughly 50/50 chance for YES/NO - avoid obvious answers
          ✅ REALISTIC: Possible within 15 minutes
          ✅ CLEAR: No vague terms
          
          Topics to focus on (ALL MUST BE EASILY VERIFIABLE):
          - Celebrity social media posts (check X.com, Instagram.com directly)
          - Cryptocurrency current price comparisons - "above/below current price" (check CoinGecko.com)
          - News website article publications (check CNN.com, BBC.com, Reuters.com homepage)
          - Stock current price comparisons - "above/below current price" (check Yahoo Finance)
          - Time-based questions (check current time)
          - Live sports scores when games are active (check ESPN.com scoreboard)
          
          Current context: ${contextData}
          Time of day: ${timeContext}
          ${recentQuestionsContext}
          Sports context: ${liveGamesContext}
          
          ✅ PERFECT BALANCED examples:
          - "Will Elon Musk post on X/Twitter in the next 15 minutes?" (balanced - doesn't post constantly)
          - "Will Bitcoin price be above its current price in the next 15 minutes?" (perfect 50/50 - use current price)
          - "Will CNN publish a new article in the next 15 minutes?" (balanced - doesn't publish every 15 min)
          - "Will Apple stock be above its current price in the next 15 minutes?" (perfect 50/50 - use current price)
          - "Will the seconds be greater than 30 when this expires?" (true 50/50)
          
          ❌ AVOID obvious/guaranteed answers: "Will Bitcoin price change?", "Will any digit appear?", "Will time pass?"
          
          Return only the specific, verifiable question, nothing else.`
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