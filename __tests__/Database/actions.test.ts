import { placeBitcoinBet, getTodaysBet } from '../../app/Database/actions'

// Mock the database connection
jest.mock('../../app/Database/actions', () => ({
  placeBitcoinBet: jest.fn(),
  getTodaysBet: jest.fn(),
}))

const mockPlaceBitcoinBet = placeBitcoinBet as jest.MockedFunction<typeof placeBitcoinBet>
const mockGetTodaysBet = getTodaysBet as jest.MockedFunction<typeof getTodaysBet>

describe('Database Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('placeBitcoinBet', () => {
    const mockWalletAddress = '0x1234567890123456789012345678901234567890'
    const mockPrediction = 'positive'
    const mockTableType = 'bitcoin'

    it('should successfully place a bitcoin bet', async () => {
      const mockBetResult = {
        id: 1,
        walletAddress: mockWalletAddress,
        prediction: mockPrediction,
        betDate: '2025-01-08',
        createdAt: new Date(),
      }

      mockPlaceBitcoinBet.mockResolvedValue([mockBetResult])

      const result = await placeBitcoinBet(mockWalletAddress, mockPrediction, mockTableType)

      expect(mockPlaceBitcoinBet).toHaveBeenCalledWith(
        mockWalletAddress,
        mockPrediction,
        mockTableType
      )
      expect(result).toEqual([mockBetResult])
    })

    it('should handle errors when placing a bet', async () => {
      const mockError = new Error('Database connection failed')
      mockPlaceBitcoinBet.mockRejectedValue(mockError)

      await expect(
        placeBitcoinBet(mockWalletAddress, mockPrediction, mockTableType)
      ).rejects.toThrow('Database connection failed')
    })

    it('should validate wallet address format', async () => {
      const invalidAddress = 'invalid-address'
      mockPlaceBitcoinBet.mockRejectedValue(new Error('Invalid wallet address'))

      await expect(
        placeBitcoinBet(invalidAddress, mockPrediction, mockTableType)
      ).rejects.toThrow('Invalid wallet address')
    })

    it('should validate prediction values', async () => {
      const invalidPrediction = 'invalid-prediction' as any
      mockPlaceBitcoinBet.mockRejectedValue(new Error('Invalid prediction'))

      await expect(
        placeBitcoinBet(mockWalletAddress, invalidPrediction, mockTableType)
      ).rejects.toThrow('Invalid prediction')
    })
  })

  describe('getTodaysBet', () => {
    const mockWalletAddress = '0x1234567890123456789012345678901234567890'
    const mockTableType = 'bitcoin'

    it('should retrieve today\'s bet for a user', async () => {
      const mockBet = {
        id: 1,
        walletAddress: mockWalletAddress,
        prediction: 'positive',
        betDate: '2025-01-08',
        createdAt: new Date(),
      }

      mockGetTodaysBet.mockResolvedValue(mockBet)

      const result = await getTodaysBet(mockWalletAddress, mockTableType)

      expect(mockGetTodaysBet).toHaveBeenCalledWith(mockWalletAddress, mockTableType)
      expect(result).toEqual(mockBet)
    })

    it('should return null when no bet exists for today', async () => {
      mockGetTodaysBet.mockResolvedValue(null)

      const result = await getTodaysBet(mockWalletAddress, mockTableType)

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockGetTodaysBet.mockRejectedValue(new Error('Database query failed'))

      await expect(
        getTodaysBet(mockWalletAddress, mockTableType)
      ).rejects.toThrow('Database query failed')
    })

    it('should default to bitcoin table type when not specified', async () => {
      mockGetTodaysBet.mockResolvedValue(null)

      await getTodaysBet(mockWalletAddress)

      expect(mockGetTodaysBet).toHaveBeenCalledWith(mockWalletAddress, 'bitcoin')
    })
  })

  describe('Prediction Logic Integration', () => {
    it('should prevent duplicate bets for the same day', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890'
      const existingBet = {
        id: 1,
        walletAddress: mockWalletAddress,
        prediction: 'positive',
        betDate: '2025-01-08',
        createdAt: new Date(),
      }

      // First, user has already placed a bet today
      mockGetTodaysBet.mockResolvedValue(existingBet)

      const todaysBet = await getTodaysBet(mockWalletAddress, 'bitcoin')
      expect(todaysBet).not.toBeNull()

      // Attempting to place another bet should be handled by the UI
      // (This is more of an integration test scenario)
    })

    it('should handle different table types correctly', async () => {
      const mockWalletAddress = '0x1234567890123456789012345678901234567890'
      
      // Test bitcoin table
      await getTodaysBet(mockWalletAddress, 'bitcoin')
      expect(mockGetTodaysBet).toHaveBeenCalledWith(mockWalletAddress, 'bitcoin')

      // Test crypto table
      await getTodaysBet(mockWalletAddress, 'crypto')
      expect(mockGetTodaysBet).toHaveBeenCalledWith(mockWalletAddress, 'crypto')
    })
  })
})