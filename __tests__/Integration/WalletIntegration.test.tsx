import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BitcoinBetting from '../../app/Pages/BitcoinBetting'
import { placeBitcoinBet, getTodaysBet } from '../../app/Database/actions'

// Mock the database actions
jest.mock('../../app/Database/actions')
const mockPlaceBitcoinBet = placeBitcoinBet as jest.MockedFunction<typeof placeBitcoinBet>
const mockGetTodaysBet = getTodaysBet as jest.MockedFunction<typeof getTodaysBet>

describe('Wallet Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Connected Wallet Scenarios', () => {
    beforeEach(() => {
      // Mock connected wallet
      jest.mocked(require('wagmi').useAccount).mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })

      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: ['0x1234567890123456789012345678901234567890'],
        isLoading: false,
        error: null,
      })

      mockGetTodaysBet.mockResolvedValue(null)
    })

    it('should enable betting when wallet is connected and user is participant', async () => {
      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/Positive/i)).toBeEnabled()
        expect(screen.getByText(/Negative/i)).toBeEnabled()
      })
    })

    it('should complete full betting flow successfully', async () => {
      const user = userEvent.setup()
      mockPlaceBitcoinBet.mockResolvedValue([{
        id: 1,
        walletAddress: '0x1234567890123456789012345678901234567890',
        prediction: 'positive',
        betDate: '2025-01-08',
        createdAt: new Date(),
      }])

      render(<BitcoinBetting />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText(/Positive/i)).toBeEnabled()
      })

      // Place a bet
      const positiveButton = screen.getByText(/Positive/i)
      await user.click(positiveButton)

      // Verify database call
      await waitFor(() => {
        expect(mockPlaceBitcoinBet).toHaveBeenCalledWith(
          '0x1234567890123456789012345678901234567890',
          'positive',
          'bitcoin'
        )
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/Bet placed successfully/i)).toBeInTheDocument()
      })
    })

    it('should handle wallet address changes', async () => {
      const { rerender } = render(<BitcoinBetting />)

      // Initial load with first address
      await waitFor(() => {
        expect(mockGetTodaysBet).toHaveBeenCalledWith(
          '0x1234567890123456789012345678901234567890',
          'bitcoin'
        )
      })

      // Change wallet address
      jest.mocked(require('wagmi').useAccount).mockReturnValue({
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        isConnected: true,
      })

      rerender(<BitcoinBetting />)

      // Should check for bets with new address
      await waitFor(() => {
        expect(mockGetTodaysBet).toHaveBeenCalledWith(
          '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          'bitcoin'
        )
      })
    })
  })

  describe('Disconnected Wallet Scenarios', () => {
    beforeEach(() => {
      // Mock disconnected wallet
      jest.mocked(require('wagmi').useAccount).mockReturnValue({
        address: undefined,
        isConnected: false,
      })

      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      })
    })

    it('should disable betting when wallet is not connected', () => {
      render(<BitcoinBetting />)

      // Should show wallet connection requirement
      expect(screen.getByText(/connect/i) || screen.getByText(/wallet/i)).toBeInTheDocument()
    })

    it('should not make database calls when wallet is disconnected', async () => {
      render(<BitcoinBetting />)

      // Give time for any potential calls
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockGetTodaysBet).not.toHaveBeenCalled()
      expect(mockPlaceBitcoinBet).not.toHaveBeenCalled()
    })
  })

  describe('Participant Status Integration', () => {
    beforeEach(() => {
      jest.mocked(require('wagmi').useAccount).mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })
      mockGetTodaysBet.mockResolvedValue(null)
    })

    it('should enable betting when user is in participant list', async () => {
      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: ['0x1234567890123456789012345678901234567890'],
        isLoading: false,
        error: null,
      })

      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/Positive/i)).toBeEnabled()
        expect(screen.getByText(/Negative/i)).toBeEnabled()
      })
    })

    it('should disable betting when user is not in participant list', async () => {
      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: ['0xdifferentaddress123456789012345678901234'],
        isLoading: false,
        error: null,
      })

      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/not authorized/i) || screen.getByText(/participant/i)).toBeInTheDocument()
      })
    })

    it('should handle participant list loading state', () => {
      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })

      render(<BitcoinBetting />)

      expect(screen.getByText(/loading/i) || screen.getByText(/checking/i)).toBeInTheDocument()
    })

    it('should handle participant list errors', () => {
      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Contract call failed'),
      })

      render(<BitcoinBetting />)

      expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument()
    })
  })

  describe('Existing Bet Integration', () => {
    beforeEach(() => {
      jest.mocked(require('wagmi').useAccount).mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })

      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: ['0x1234567890123456789012345678901234567890'],
        isLoading: false,
        error: null,
      })
    })

    it('should prevent duplicate betting when user has already bet today', async () => {
      const existingBet = {
        id: 1,
        walletAddress: '0x1234567890123456789012345678901234567890',
        prediction: 'positive',
        betDate: '2025-01-08',
        createdAt: new Date(),
      }
      mockGetTodaysBet.mockResolvedValue(existingBet)

      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/already placed/i)).toBeInTheDocument()
        expect(screen.getByText(/positive/i)).toBeInTheDocument()
      })

      // Betting buttons should be disabled
      expect(screen.queryByText(/Positive/i)?.closest('button')).toBeDisabled() ||
      expect(screen.getByText(/already placed/i)).toBeInTheDocument()
    })

    it('should display existing bet information correctly', async () => {
      const existingBet = {
        id: 1,
        walletAddress: '0x1234567890123456789012345678901234567890',
        prediction: 'negative',
        betDate: '2025-01-08',
        createdAt: new Date(),
      }
      mockGetTodaysBet.mockResolvedValue(existingBet)

      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/negative/i)).toBeInTheDocument()
        expect(screen.getByText(/2025-01-08/i) || screen.getByText(/today/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    beforeEach(() => {
      jest.mocked(require('wagmi').useAccount).mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      })

      jest.mocked(require('wagmi').useReadContract).mockReturnValue({
        data: ['0x1234567890123456789012345678901234567890'],
        isLoading: false,
        error: null,
      })

      mockGetTodaysBet.mockResolvedValue(null)
    })

    it('should handle betting transaction errors gracefully', async () => {
      const user = userEvent.setup()
      mockPlaceBitcoinBet.mockRejectedValue(new Error('Transaction failed'))

      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/Positive/i)).toBeEnabled()
      })

      const positiveButton = screen.getByText(/Positive/i)
      await user.click(positiveButton)

      await waitFor(() => {
        expect(screen.getByText(/failed/i) || screen.getByText(/error/i)).toBeInTheDocument()
      })

      // Should still allow retry
      expect(positiveButton).toBeEnabled()
    })

    it('should handle network connectivity issues', async () => {
      mockGetTodaysBet.mockRejectedValue(new Error('Network error'))

      render(<BitcoinBetting />)

      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument()
      })
    })
  })
})