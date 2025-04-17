// CryptoPriceService.ts
// Service for fetching cryptocurrency price data

interface PriceData {
  [key: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

class CryptoPriceService {
  private cache: PriceData = {};
  private lastFetchTime: number = 0;
  private cacheDuration: number = 60 * 1000; // 1 minute cache

  // Map of common crypto names to their CoinGecko IDs
  private cryptoIdMap: { [key: string]: string } = {
    'bitcoin': 'bitcoin',
    'btc': 'bitcoin',
    'ethereum': 'ethereum',
    'eth': 'ethereum',
    'usdc': 'usd-coin',
    'cad': 'cad-coin',
    'cadc': 'cad-coin',
    'canadian dollar': 'cad-coin',
    'brz': 'brz',
    'brazilian real': 'brz',
    'mxn': 'mexican-peso-tether',
    'mxne': 'mexican-peso-tether',
    'mexican peso': 'mexican-peso-tether',
    'euro': 'euro-coin',
    'eurc': 'euro-coin',
    'tryb': 'turkish-lira',
    'turkish lira': 'turkish-lira',
    'cbbtc': 'bitcoin',
    'coinbase btc': 'bitcoin',
    'weth': 'ethereum',
    'wrapped eth': 'ethereum',
    'base': 'coinbase-wrapped-staked-eth',
  };

  /**
   * Get the current price of a cryptocurrency
   * @param cryptoName The name or symbol of the cryptocurrency
   * @returns Promise with price data or null if not found
   */
  async getPrice(cryptoName: string): Promise<{ price: number; change24h: number } | null> {
    const normalizedName = cryptoName.toLowerCase().trim();
    const coinId = this.cryptoIdMap[normalizedName];
    
    if (!coinId) {
      console.warn(`Unknown cryptocurrency: ${cryptoName}`);
      return null;
    }

    // Check if we need to refresh the cache
    const now = Date.now();
    if (now - this.lastFetchTime > this.cacheDuration || !this.cache[coinId]) {
      try {
        await this.fetchPrices([coinId]);
      } catch (error) {
        console.error('Error fetching price data:', error);
        // If we have cached data, use it even if it's expired
        if (this.cache[coinId]) {
          return {
            price: this.cache[coinId].usd,
            change24h: this.cache[coinId].usd_24h_change
          };
        }
        return null;
      }
    }

    // Return data from cache
    if (this.cache[coinId]) {
      return {
        price: this.cache[coinId].usd,
        change24h: this.cache[coinId].usd_24h_change
      };
    }

    return null;
  }

  /**
   * Fetch prices for multiple cryptocurrencies at once
   * @param coinIds Array of CoinGecko IDs to fetch
   */
  private async fetchPrices(coinIds: string[]): Promise<void> {
    // Use the specific endpoint provided by the user
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cad-coin,brz,mexican-peso-tether,euro-coin&vs_currencies=usd';
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add 24h change data if not included in the response
      Object.keys(data).forEach(key => {
        if (!data[key].usd_24h_change) {
          data[key].usd_24h_change = 0;
        }
        if (!data[key].last_updated_at) {
          data[key].last_updated_at = Date.now() / 1000;
        }
      });
      
      this.cache = { ...this.cache, ...data };
      this.lastFetchTime = Date.now();
    } catch (error) {
      console.error('Error fetching cryptocurrency prices:', error);
      throw error;
    }
  }

  /**
   * Format price data into a human-readable string
   * @param cryptoName The name or symbol of the cryptocurrency
   * @param priceData The price data object
   * @returns Formatted string with price information
   */
  formatPriceMessage(cryptoName: string, priceData: { price: number; change24h: number }): string {
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(priceData.price);
    
    const changeDirection = priceData.change24h >= 0 ? '↗️' : '↘️';
    const formattedChange = Math.abs(priceData.change24h).toFixed(2);
    
    return `${cryptoName.toUpperCase()} is currently trading at ${formattedPrice}. 24h change: ${changeDirection} ${formattedChange}%`;
  }

  /**
   * Get a list of supported cryptocurrencies
   * @returns Array of supported crypto names/symbols
   */
  getSupportedCryptos(): string[] {
    return Object.keys(this.cryptoIdMap);
  }
}

export default new CryptoPriceService();
