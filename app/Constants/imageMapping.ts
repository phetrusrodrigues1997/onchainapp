// Static celebrity and topic image mapping
// Using public domain and CC0 licensed images

export const celebrityImages: Record<string, string> = {
  // Tech Leaders
  'elon musk': 'https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=400',
  'jeff bezos': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
  'mark zuckerberg': 'https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=400',
  'bill gates': 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400',
  
  // Political Figures
  'donald trump': 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=400',
  'joe biden': 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=400',
  
  // Entertainers
  'taylor swift': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'kanye west': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'kim kardashian': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'ariana grande': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'justin bieber': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'rihanna': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'lady gaga': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  
  // Sports Stars
  'cristiano ronaldo': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400',
  'lionel messi': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400',
  
  // Actors
  'the rock': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
  'ryan reynolds': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
  'leonardo dicaprio': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
  'brad pitt': 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
  
  // Other Public Figures  
  'oprah winfrey': 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400',
};

export const topicImages: Record<string, string> = {
  // Crypto
  'bitcoin': 'https://images.unsplash.com/photo-1518544866330-4e35c72ee69a?w=400',
  'ethereum': 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400',
  'cryptocurrency': 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400',
  'crypto': 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=400',
  
  // Tech
  'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
  'artificial intelligence': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
  'technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
  'tech': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
  
  // Social Media
  'twitter': 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400',
  'instagram': 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=400',
  'social media': 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400',
  
  // Business/Finance
  'stock market': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  'market': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  'business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
  
  // Sports
  'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
  'football': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400',
  'basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
  
  // Entertainment
  'music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
  'movies': 'https://images.unsplash.com/photo-1489599763687-b8cb417fac2b?w=400',
  'entertainment': 'https://images.unsplash.com/photo-1489599763687-b8cb417fac2b?w=400',
  
  // News/Politics
  'news': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
  'politics': 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?w=400',
  'breaking news': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
};

export const categoryFallbacks: Record<string, string> = {
  celebrity: 'https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400',
  technology: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400',
  finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
  entertainment: 'https://images.unsplash.com/photo-1489599763687-b8cb417fac2b?w=400',
  news: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
  default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
};

// Function to get image for a person or topic
export function getStaticImage(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check celebrity mapping first
  if (celebrityImages[normalizedQuery]) {
    return celebrityImages[normalizedQuery];
  }
  
  // Check topic mapping
  for (const [topic, imageUrl] of Object.entries(topicImages)) {
    if (normalizedQuery.includes(topic)) {
      return imageUrl;
    }
  }
  
  return null;
}

// Function to determine category for fallback
export function getCategoryFallback(query: string): string {
  const normalizedQuery = query.toLowerCase();
  
  const categories = Object.keys(celebrityImages);
  if (categories.some(celeb => normalizedQuery.includes(celeb))) {
    return categoryFallbacks.celebrity;
  }
  
  if (normalizedQuery.includes('bitcoin') || normalizedQuery.includes('crypto') || 
      normalizedQuery.includes('ethereum') || normalizedQuery.includes('market')) {
    return categoryFallbacks.finance;
  }
  
  if (normalizedQuery.includes('ai') || normalizedQuery.includes('tech') || 
      normalizedQuery.includes('app') || normalizedQuery.includes('software')) {
    return categoryFallbacks.technology;
  }
  
  if (normalizedQuery.includes('sport') || normalizedQuery.includes('game') || 
      normalizedQuery.includes('match') || normalizedQuery.includes('team')) {
    return categoryFallbacks.sports;
  }
  
  if (normalizedQuery.includes('music') || normalizedQuery.includes('movie') || 
      normalizedQuery.includes('show') || normalizedQuery.includes('album')) {
    return categoryFallbacks.entertainment;
  }
  
  if (normalizedQuery.includes('news') || normalizedQuery.includes('announce') || 
      normalizedQuery.includes('statement') || normalizedQuery.includes('report')) {
    return categoryFallbacks.news;
  }
  
  return categoryFallbacks.default;
}