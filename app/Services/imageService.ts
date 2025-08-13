import { getStaticImage, getCategoryFallback } from '../Constants/imageMapping';

interface ImageResult {
  url: string;
  source: 'static' | 'unsplash' | 'pexels' | 'fallback';
  alt: string;
}

// Cache for storing image results (24h cache in production)
const imageCache = new Map<string, { result: ImageResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

// Pexels API configuration  
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API = 'https://api.pexels.com/v1/search';

// Extract entities from question using simple keyword matching
// (In production, this could be enhanced with OpenAI entity extraction)
export function extractEntitiesFromQuestion(question: string): {
  people: string[];
  topics: string[];
  mainEntity: string | null;
} {
  const normalizedQuestion = question.toLowerCase();
  
  // Common celebrities and public figures
  const celebrities = [
    'elon musk', 'donald trump', 'taylor swift', 'kanye west', 'joe biden',
    'kim kardashian', 'jeff bezos', 'mark zuckerberg', 'bill gates', 'oprah winfrey',
    'cristiano ronaldo', 'lionel messi', 'ariana grande', 'justin bieber', 'rihanna',
    'lady gaga', 'the rock', 'ryan reynolds', 'leonardo dicaprio', 'brad pitt'
  ];
  
  // Common topics
  const topics = [
    'bitcoin', 'ethereum', 'cryptocurrency', 'crypto', 'ai', 'artificial intelligence',
    'technology', 'tech', 'twitter', 'instagram', 'social media', 'stock market',
    'sports', 'football', 'basketball', 'music', 'movies', 'news', 'politics'
  ];
  
  const foundPeople = celebrities.filter(celeb => normalizedQuestion.includes(celeb));
  const foundTopics = topics.filter(topic => normalizedQuestion.includes(topic));
  
  // Determine main entity (first found person or topic)
  const mainEntity = foundPeople[0] || foundTopics[0] || null;
  
  return {
    people: foundPeople,
    topics: foundTopics,
    mainEntity
  };
}

// Enhanced entity extraction using OpenAI (optional)
export async function extractEntitiesWithAI(question: string): Promise<{
  people: string[];
  topics: string[];
  mainEntity: string | null;
}> {
  try {
    // This would make an API call to OpenAI to extract entities
    // For now, falling back to keyword matching
    return extractEntitiesFromQuestion(question);
  } catch (error) {
    console.error('AI entity extraction failed, using fallback:', error);
    return extractEntitiesFromQuestion(question);
  }
}

// Search Unsplash for images
async function searchUnsplash(query: string, count: number = 1): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not found, using demo images');
    const demoImages = [
      'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    ];
    return demoImages[Math.floor(Math.random() * demoImages.length)];
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API}?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the regular size image URL with width parameter for optimization
    const imageUrl = data.results[0]?.urls?.regular;
    if (imageUrl) {
      // Add width parameter for optimization
      return imageUrl + '&w=400&q=80';
    }
    
    return null;
  } catch (error) {
    console.error('Unsplash search failed:', error);
    
    // Fallback to demo images if API fails
    const demoImages = [
      'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    ];
    return demoImages[Math.floor(Math.random() * demoImages.length)];
  }
}

// Search Pexels for images
async function searchPexels(query: string, count: number = 1): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API key not found, using demo images');
    const demoImages = [
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=400',
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=400',
      'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?w=400',
    ];
    return demoImages[Math.floor(Math.random() * demoImages.length)];
  }

  try {
    const response = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`, 
      {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return the medium size image URL with width optimization
    const photo = data.photos?.[0];
    if (photo?.src?.medium) {
      // Pexels allows width parameter for optimization
      return photo.src.medium + '?w=400&h=300&fit=crop';
    }
    
    return null;
  } catch (error) {
    console.error('Pexels search failed:', error);
    
    // Fallback to demo images if API fails
    const demoImages = [
      'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=400',
      'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=400',
      'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?w=400',
    ];
    return demoImages[Math.floor(Math.random() * demoImages.length)];
  }
}

// Main function to get image for a question
export async function getImageForQuestion(question: string): Promise<ImageResult> {
  // Check cache first
  const cacheKey = question.toLowerCase().trim();
  const cached = imageCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }
  
  // Extract entities from question
  const { people, topics, mainEntity } = extractEntitiesFromQuestion(question);
  
  let result: ImageResult;
  
  // Tier 1: Check static mapping
  if (mainEntity) {
    const staticImage = getStaticImage(mainEntity);
    if (staticImage) {
      result = {
        url: staticImage,
        source: 'static',
        alt: `Image related to ${mainEntity}`
      };
      
      // Cache and return
      imageCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }
  }
  
  // Tier 2: Try dynamic APIs
  let dynamicImage: string | null = null;
  let source: 'unsplash' | 'pexels' = 'unsplash';
  
  if (mainEntity) {
    // Enhance search terms for better Unsplash results
    let searchTerm = mainEntity;
    
    // For celebrities, add "portrait" or "person" to get better results
    if (people.length > 0) {
      searchTerm = `${mainEntity} portrait person face`;
    }
    // For topics, add relevant context
    else if (topics.length > 0) {
      if (mainEntity.includes('bitcoin') || mainEntity.includes('crypto')) {
        searchTerm = `${mainEntity} cryptocurrency digital money`;
      } else if (mainEntity.includes('ai') || mainEntity.includes('artificial')) {
        searchTerm = `artificial intelligence technology robot`;
      } else if (mainEntity.includes('tech')) {
        searchTerm = `technology computer innovation`;
      }
    }
    
    // Try Unsplash first
    dynamicImage = await searchUnsplash(searchTerm);
    
    // Fallback to Pexels if Unsplash fails
    if (!dynamicImage) {
      dynamicImage = await searchPexels(mainEntity);
      source = 'pexels';
    }
  }
  
  if (dynamicImage) {
    result = {
      url: dynamicImage,
      source,
      alt: `Image related to ${mainEntity}`
    };
    
    // Cache and return
    imageCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }
  
  // Tier 3: Category fallback
  const fallbackImage = getCategoryFallback(question);
  result = {
    url: fallbackImage,
    source: 'fallback',
    alt: 'Related image'
  };
  
  // Cache and return
  imageCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}

// Helper function to preload critical images
export function preloadCriticalImages(): void {
  const criticalImages = [
    'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
    'https://images.unsplash.com/photo-1518544866330-4e35c72ee69a?w=400',
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// Clear cache (useful for development)
export function clearImageCache(): void {
  imageCache.clear();
}