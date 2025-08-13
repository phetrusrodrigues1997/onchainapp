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
  
  // Specific, verifiable question templates
  const templates = [
    `Will ${celebrity} post on X/Twitter in the next 15 minutes?`,
    `Will ${celebrity} post on Instagram in the next 15 minutes?`,
    `Will ${celebrity} share a new photo on social media in the next 15 minutes?`,
    `Will Bitcoin price go above $50,000 in the next 15 minutes?`,
    `Will Bitcoin price drop below $40,000 in the next 15 minutes?`,
    `Will Ethereum price move up by 2% in the next 15 minutes?`,
    `Will CNN publish a new article in the next 15 minutes?`,
    `Will BBC News post a new story in the next 15 minutes?`,
    `Will Apple stock (AAPL) change by more than 0.5% in the next 15 minutes?`,
    `Will Tesla stock (TSLA) move up in the next 15 minutes?`,
    `Will Google stock (GOOGL) hit a new daily high in the next 15 minutes?`,
    `Will the S&P 500 index move up by 0.1% in the next 15 minutes?`,
    `Will ${celebrity} go live on any social platform in the next 15 minutes?`,
    `Will ${celebrity} reply to someone on X/Twitter in the next 15 minutes?`,
    `Will any cryptocurrency gain more than 5% in the next 15 minutes?`,
    `Will the USD/EUR exchange rate change by 0.1% in the next 15 minutes?`,
    `Will Reuters publish breaking news in the next 15 minutes?`,
    `Will the weather change in New York City in the next 15 minutes?`,
    `Will someone with over 1M followers post about crypto in the next 15 minutes?`,
    `Will any stock in the Dow Jones hit a new daily high in the next 15 minutes?`
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
export async function generateQuestionBatch(count: number = 24) {
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
      ? `Avoid creating questions similar to these recent ones: ${recentQuestions.slice(0, 10).join(', ')}. `
      : '';

    // Add timestamp for more variety
    const currentHour = new Date().getHours();
    const timeContext = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a creative question generator creating ${count} diverse yes/no questions about events that could happen in the next 15 minutes each. Create a varied mix covering different categories:
          
          Categories to cover (distribute evenly):
          - Specific celebrity social media activity (name specific people like Elon Musk, Taylor Swift, etc.)
          - Cryptocurrency price movements with specific thresholds
          - Major news website headlines (CNN, BBC, Reuters, etc.)
          - Stock market movements with specific numbers
          - Weather events in major cities
          - Sports scores or announcements
          - Tech company stock prices
          - Specific social media trends
          
          Current context: ${contextData}
          Time of day: ${timeContext}
          ${recentQuestionsContext}
          
          CRITICAL REQUIREMENTS - QUESTIONS MUST BE:
          ✅ SPECIFIC: Use exact names, numbers, thresholds
          ✅ VERIFIABLE: Anyone can check the answer objectively
          ✅ REALISTIC: Possible within 15 minutes
          ✅ CLEAR: No ambiguous terms like "major", "famous", "expert", "significant"
          
          ❌ AVOID VAGUE TERMS:
          - "major expert" → Use specific person names
          - "famous YouTuber" → Use specific channel names
          - "significant price movement" → Use specific percentage/dollar amounts
          - "breaking news" → Use specific news sources
          
          ✅ GOOD EXAMPLES:
          - "Will Elon Musk post on X/Twitter in the next 15 minutes?"
          - "Will Bitcoin price go above $45,000 in the next 15 minutes?"
          - "Will CNN publish a new article in the next 15 minutes?"
          - "Will Apple stock (AAPL) move up or down by 0.5% in the next 15 minutes?"
          - "Will it start raining in New York City in the next 15 minutes?"
          
          ❌ BAD EXAMPLES:
          - "Will a crypto expert predict something?" (who counts as expert?)
          - "Will a famous person make news?" (who counts as famous?)
          - "Will there be major market movement?" (how much is major?)
          
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
          content: `You are a creative question generator with access to real-time data. Create specific, verifiable yes/no questions about events that could realistically happen in the next 15 minutes.
          
          REQUIREMENTS - Questions must be:
          ✅ SPECIFIC: Use exact names, numbers, thresholds
          ✅ VERIFIABLE: Anyone can check the answer objectively
          ✅ REALISTIC: Possible within 15 minutes
          ✅ CLEAR: No vague terms
          
          Topics to focus on:
          - Named celebrity social media activity (Elon Musk, Taylor Swift, etc.)
          - Cryptocurrency prices with specific thresholds
          - Named news sources (CNN, BBC, Reuters)
          - Stock prices with specific percentages
          - Weather in named cities
          - Named social media accounts
          
          Current context: ${contextData}
          Time of day: ${timeContext}
          ${recentQuestionsContext}
          
          ✅ GOOD examples:
          - "Will Elon Musk post on X/Twitter in the next 15 minutes?"
          - "Will Bitcoin go above $${btcPrice ? Math.ceil(btcPrice/1000)*1000 : '50,000'} in the next 15 minutes?"
          - "Will CNN publish a new article in the next 15 minutes?"
          - "Will Apple stock move up by 0.5% in the next 15 minutes?"
          
          ❌ AVOID vague terms like: "major", "famous", "significant", "expert", "breaking"
          
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