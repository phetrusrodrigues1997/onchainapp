import { getMarkets } from '../../app/Constants/markets'
import { getTranslation } from '../../app/Languages/languages'

describe('Markets Utility Functions', () => {
  const mockTranslation = getTranslation('en')

  describe('getMarkets', () => {
    it('should return sports markets when category is sports', () => {
      const markets = getMarkets(mockTranslation, 'sports')
      
      expect(markets).toHaveLength(1)
      expect(markets[0]).toHaveProperty('id', 'chelsea-manutd')
      expect(markets[0]).toHaveProperty('name', 'Chelsea vs Man United')
      expect(markets[0]).toHaveProperty('symbol', '⚽️')
    })

    it('should return options markets when category is options', () => {
      const markets = getMarkets(mockTranslation, 'options')
      
      expect(markets.length).toBeGreaterThan(5)
      expect(markets.some(market => market.id === 'Featured')).toBe(true)
      expect(markets.some(market => market.id === 'crypto')).toBe(true)
      expect(markets.some(market => market.id === 'stocks')).toBe(true)
    })

    it('should return featured markets when category is Featured', () => {
      const markets = getMarkets(mockTranslation, 'Featured')
      
      expect(markets).toHaveLength(1)
      expect(markets[0]).toHaveProperty('id', 'Featured')
      expect(markets[0]).toHaveProperty('name', 'Featured - Random Topics')
    })

    it('should return music markets when category is music', () => {
      const markets = getMarkets(mockTranslation, 'music')
      
      expect(markets).toHaveLength(1)
      expect(markets[0]).toHaveProperty('id', 'spotify-global-1')
      expect(markets[0]).toHaveProperty('name', 'Global #1')
    })

    it('should return weather markets when category is weather', () => {
      const markets = getMarkets(mockTranslation, 'weather')
      
      expect(markets).toHaveLength(1)
      expect(markets[0]).toHaveProperty('id', 'london-temp-3pm')
      expect(markets[0]).toHaveProperty('name', 'London 3PM ≥ 22°C')
    })

    it('should return stocks markets when category is stocks', () => {
      const markets = getMarkets(mockTranslation, 'stocks')
      
      expect(markets).toHaveLength(1)
      expect(markets[0]).toHaveProperty('id', 'tesla')
      expect(markets[0]).toHaveProperty('symbol', 'TSLA')
    })

    it('should return X trends markets when category is xtrends', () => {
      const markets = getMarkets(mockTranslation, 'xtrends')
      
      expect(markets).toHaveLength(1)
      expect(markets[0]).toHaveProperty('id', 'us-sports-top')
    })

    it('should return default crypto markets for unknown category', () => {
      const markets = getMarkets(mockTranslation, 'unknown-category')
      
      expect(markets.length).toBeGreaterThan(5)
      expect(markets.some(market => market.id === 'Crypto')).toBe(true)
      expect(markets.some(market => market.symbol === 'ETH')).toBe(true)
      expect(markets.some(market => market.symbol === 'SOL')).toBe(true)
    })

    it('should include required market properties', () => {
      const markets = getMarkets(mockTranslation, 'crypto')
      
      markets.forEach(market => {
        expect(market).toHaveProperty('id')
        expect(market).toHaveProperty('name')
        expect(market).toHaveProperty('symbol')
        expect(market).toHaveProperty('color')
        expect(market).toHaveProperty('question')
        expect(market).toHaveProperty('icon')
        expect(market).toHaveProperty('currentPrice')
        expect(market).toHaveProperty('participants')
        expect(market).toHaveProperty('potSize')
        
        expect(typeof market.id).toBe('string')
        expect(typeof market.name).toBe('string')
        expect(typeof market.participants).toBe('number')
        expect(market.participants).toBeGreaterThan(0)
      })
    })

    it('should use translation data correctly', () => {
      const markets = getMarkets(mockTranslation, 'stocks')
      const teslaMarket = markets.find(market => market.id === 'tesla')
      
      expect(teslaMarket?.question).toBe(mockTranslation.teslaQuestion || '')
    })

    it('should handle empty translation gracefully', () => {
      const emptyTranslation = {} as any
      const markets = getMarkets(emptyTranslation, 'stocks')
      
      expect(markets).toBeDefined()
      expect(markets.length).toBeGreaterThan(0)
    })
  })

  describe('Market Data Integrity', () => {
    it('should have unique market IDs within each category', () => {
      const categories = ['sports', 'options', 'Featured', 'music', 'weather', 'stocks', 'xtrends', 'crypto']
      
      categories.forEach(category => {
        const markets = getMarkets(mockTranslation, category)
        const ids = markets.map(market => market.id)
        const uniqueIds = new Set(ids)
        
        expect(uniqueIds.size).toBe(ids.length)
      })
    })

    it('should have valid color values', () => {
      const markets = getMarkets(mockTranslation, 'options')
      
      markets.forEach(market => {
        expect(market.color).toMatch(/^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{3}$/)
      })
    })

    it('should have valid participant counts', () => {
      const markets = getMarkets(mockTranslation, 'crypto')
      
      markets.forEach(market => {
        expect(market.participants).toBeGreaterThan(0)
        expect(market.participants).toBeLessThan(10000) // Reasonable upper bound
      })
    })

    it('should have properly formatted pot sizes', () => {
      const markets = getMarkets(mockTranslation, 'crypto')
      
      markets.forEach(market => {
        expect(market.potSize).toMatch(/^\$[\d,]+$/) // Format like $1,000
      })
    })
  })
})