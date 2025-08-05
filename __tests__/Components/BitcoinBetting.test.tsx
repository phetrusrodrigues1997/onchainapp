import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BitcoinBetting from '../../app/Pages/BitcoinBetting'
import { placeBitcoinBet, getTodaysBet } from '../../app/Database/actions'

// Mock the database actions
jest.mock('../../app/Database/actions')
const mockPlaceBitcoinBet = placeBitcoinBet as jest.MockedFunction<typeof placeBitcoinBet>
const mockGetTodaysBet = getTodaysBet as jest.MockedFunction<typeof getTodaysBet>

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useReadContract: () => ({
    data: ['0x1234567890123456789012345678901234567890'],
    isLoading: false,
    error: null,
  }),
}))

describe('BitcoinBetting Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetTodaysBet.mockResolvedValue(null) // No existing bet by default
  })

  it('renders the bitcoin betting interface', () => {
    render(<BitcoinBetting />)
    
    expect(screen.getByText(/Bitcoin Prediction Market/i)).toBeInTheDocument()
    expect(screen.getByText(/Will Bitcoin price go UP or DOWN/i)).toBeInTheDocument()
  })

  it('shows positive and negative betting buttons', () => {
    render(<BitcoinBetting />)
    
    expect(screen.getByText(/Positive/i)).toBeInTheDocument()
    expect(screen.getByText(/Negative/i)).toBeInTheDocument()
  })

  it('disables betting when user has already placed a bet today', async () => {
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
      expect(screen.getByText(/You have already placed your bet today/i)).toBeInTheDocument()
    })
  })

  it('allows placing a positive bet', async () => {
    const user = userEvent.setup()
    mockPlaceBitcoinBet.mockResolvedValue([{
      id: 1,
      walletAddress: '0x1234567890123456789012345678901234567890',
      prediction: 'positive',
      betDate: '2025-01-08',
      createdAt: new Date(),
    }])

    render(<BitcoinBetting />)

    const positiveButton = screen.getByText(/Positive/i)
    await user.click(positiveButton)

    await waitFor(() => {
      expect(mockPlaceBitcoinBet).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'positive',
        'bitcoin'
      )
    })
  })

  it('allows placing a negative bet', async () => {
    const user = userEvent.setup()
    mockPlaceBitcoinBet.mockResolvedValue([{
      id: 1,
      walletAddress: '0x1234567890123456789012345678901234567890',
      prediction: 'negative',
      betDate: '2025-01-08',
      createdAt: new Date(),
    }])

    render(<BitcoinBetting />)

    const negativeButton = screen.getByText(/Negative/i)
    await user.click(negativeButton)

    await waitFor(() => {
      expect(mockPlaceBitcoinBet).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890',
        'negative',
        'bitcoin'
      )
    })
  })

  it('shows success message after placing a bet', async () => {
    const user = userEvent.setup()
    mockPlaceBitcoinBet.mockResolvedValue([{
      id: 1,
      walletAddress: '0x1234567890123456789012345678901234567890',
      prediction: 'positive',
      betDate: '2025-01-08',
      createdAt: new Date(),
    }])

    render(<BitcoinBetting />)

    const positiveButton = screen.getByText(/Positive/i)
    await user.click(positiveButton)

    await waitFor(() => {
      expect(screen.getByText(/Bet placed successfully/i)).toBeInTheDocument()
    })
  })

  it('shows error message when bet placement fails', async () => {
    const user = userEvent.setup()
    mockPlaceBitcoinBet.mockRejectedValue(new Error('Database error'))

    render(<BitcoinBetting />)

    const positiveButton = screen.getByText(/Positive/i)
    await user.click(positiveButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to place bet/i)).toBeInTheDocument()
    })
  })

  it('shows loading state while placing bet', async () => {
    const user = userEvent.setup()
    // Create a promise that we can control
    let resolvePromise: (value: any) => void
    const betPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    mockPlaceBitcoinBet.mockReturnValue(betPromise as any)

    render(<BitcoinBetting />)

    const positiveButton = screen.getByText(/Positive/i)
    await user.click(positiveButton)

    // Should show loading state
    expect(screen.getByText(/Placing bet/i)).toBeInTheDocument()

    // Resolve the promise
    resolvePromise([{
      id: 1,
      walletAddress: '0x1234567890123456789012345678901234567890',
      prediction: 'positive',
      betDate: '2025-01-08',
      createdAt: new Date(),
    }])

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByText(/Placing bet/i)).not.toBeInTheDocument()
    })
  })

  it('switches between different table types', async () => {
    const user = userEvent.setup()
    render(<BitcoinBetting />)

    // Should start with bitcoin table type
    expect(mockGetTodaysBet).toHaveBeenCalledWith(
      '0x1234567890123456789012345678901234567890',
      'bitcoin'
    )

    // If there's a crypto option, test switching
    const cryptoOption = screen.queryByText(/Crypto/i)
    if (cryptoOption) {
      await user.click(cryptoOption)
      
      await waitFor(() => {
        expect(mockGetTodaysBet).toHaveBeenCalledWith(
          '0x1234567890123456789012345678901234567890',
          'crypto'
        )
      })
    }
  })

  it('handles wallet not connected state', () => {
    // Mock disconnected wallet
    jest.mocked(require('wagmi').useAccount).mockReturnValue({
      address: undefined,
      isConnected: false,
    })

    render(<BitcoinBetting />)

    // Should show connect wallet message or disable betting
    expect(screen.getByText(/connect/i) || screen.getByText(/wallet/i)).toBeInTheDocument()
  })

  it('displays current bet information when user has placed a bet', async () => {
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
      expect(screen.getByText(/positive/i)).toBeInTheDocument()
    })
  })
})