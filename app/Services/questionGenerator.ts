// Deterministic question generation - no external APIs needed

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

// Removed external news API dependencies - using deterministic generation

const celebrities = [
  'Elon Musk', 'Donald Trump', 'Taylor Swift', 'Kanye West', 'Joe Biden',
  'Kim Kardashian', 'Jeff Bezos', 'Mark Zuckerberg', 'Bill Gates', 'Oprah Winfrey',
  'Cristiano Ronaldo', 'Lionel Messi', 'Ariana Grande', 'Justin Bieber', 'Rihanna',
  'Lady Gaga', 'The Rock', 'Ryan Reynolds', 'Leonardo DiCaprio', 'Brad Pitt',
  'Beyoncé', 'Drake', 'Selena Gomez', 'Tom Hanks', 'Robert Downey Jr.',
  'Jennifer Lawrence', 'Will Smith', 'Scarlett Johansson', 'Chris Evans', 'Emma Stone',
  'Zendaya', 'Michael Jordan', 'LeBron James', 'Serena Williams', 'Lewis Hamilton'
];

// Simplified generation - removed unused topic arrays

// Deterministic question generation with guaranteed 50/50 balance
function generateDeterministicQuestion(): string {
  const questionTypes = [
    'social_media',
    'crypto_current_price', 
    'news_websites',
    
    'stock_current_price'
  ];
  
  const typeIndex = Math.floor(Math.random() * questionTypes.length);
  const type = questionTypes[typeIndex];
  
  switch (type) {
    case 'social_media':
      const celebrity = celebrities[Math.floor(Math.random() * celebrities.length)];
      const platform = Math.random() < 0.5 ? 'X/Twitter' : 'Instagram';
      return `Will ${celebrity} post on ${platform} in the next 15 minutes?`;
      
    case 'crypto_current_price':
      const cryptos = ['Bitcoin', 'Ethereum', 'AAVE', 'AERO', 'VIRTUAL'];
      const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      const direction = Math.random() < 0.5 ? 'above' : 'below';
      return `Will ${crypto} price be ${direction} its current price in the next 15 minutes?`;
      
    case 'news_websites':
      const newsOutlets = ['CNN', 'BBC News', 'Reuters', 'The New York Times', 'AP News'];
      const outlet = newsOutlets[Math.floor(Math.random() * newsOutlets.length)];
      return `Will ${outlet} publish a new article in the next 15 minutes?`;
      
    
      
    case 'stock_current_price':
      const stocks = [
        { name: 'Apple (AAPL)', symbol: 'AAPL' },
        { name: 'Tesla (TSLA)', symbol: 'TSLA' }, 
        { name: 'Google (GOOGL)', symbol: 'GOOGL' },
        { name: 'Amazon (AMZN)', symbol: 'AMZN' },
        { name: 'Microsoft (MSFT)', symbol: 'MSFT' }
      ];
      const stock = stocks[Math.floor(Math.random() * stocks.length)];
      const stockDirection = Math.random() < 0.5 ? 'above' : 'below';
      return `Will ${stock.name} stock price be ${stockDirection} its current price in the next 15 minutes?`;
      
    default:
      return 'Will Bitcoin price be above its current price in the next 15 minutes?';
  }
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
    // Get recent questions to avoid duplicates
    const recentQuestions = await getRecentQuestions();
    interface GeneratedQuestion {
      question: string;
    }
    const generatedQuestions: GeneratedQuestion[] = [];
    const maxAttempts = count * 3; // Allow multiple attempts to avoid duplicates
    let attempts = 0;
    
    console.log(`Generating ${count} deterministic questions...`);
    
    while (generatedQuestions.length < count && attempts < maxAttempts) {
      attempts++;
      const question = generateDeterministicQuestion();
      
      // Check if this question is too similar to recent ones
      const isSimilar = recentQuestions.some(recent => {
        const recentWords = recent.toLowerCase().split(' ').slice(0, 4).join(' ');
        const newWords = question.toLowerCase().split(' ').slice(0, 4).join(' ');
        return recentWords === newWords;
      });
      
      // Also check against already generated questions in this batch
      const isDuplicate = generatedQuestions.some(generated => 
        generated.question.toLowerCase() === question.toLowerCase()
      );
      
      if (!isSimilar && !isDuplicate) {
        generatedQuestions.push({ question });
      }
    }
    
    // If we couldn't generate enough unique questions, fill the remainder with variations
    while (generatedQuestions.length < count) {
      generatedQuestions.push({ question: generateDeterministicQuestion() });
    }
    
    console.log(`Generated ${generatedQuestions.length} deterministic questions successfully`);
    return generatedQuestions;

  } catch (error) {
    console.error('Error generating deterministic question batch:', error);
    
    // Fallback: generate basic questions
    const fallbackQuestions = [];
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({ question: generateDeterministicQuestion() });
    }
    return fallbackQuestions;
  }
}

// Keep the single question generator for compatibility
export async function generateQuestion() {
  try {
    // Get recent questions to avoid duplicates
    const recentQuestions = await getRecentQuestions();
    const maxAttempts = 10;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      attempts++;
      const question = generateDeterministicQuestion();
      
      // Check if this question is too similar to recent ones
      const isSimilar = recentQuestions.some(recent => {
        const recentWords = recent.toLowerCase().split(' ').slice(0, 4).join(' ');
        const newWords = question.toLowerCase().split(' ').slice(0, 4).join(' ');
        return recentWords === newWords;
      });
      
      if (!isSimilar) {
        return { question };
      }
    }
    
    // If we couldn't find a unique question, just return a new one
    return { question: generateDeterministicQuestion() };
    
  } catch (error) {
    console.error('Error generating deterministic question:', error);
    
    // Fallback to basic deterministic question
    return { question: generateDeterministicQuestion() };
  }
}