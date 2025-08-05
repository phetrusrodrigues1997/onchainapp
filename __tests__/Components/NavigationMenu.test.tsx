import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavigationMenu from '../../app/Sections/NavigationMenu'

const mockProps = {
  activeSection: 'home',
  setActiveSection: jest.fn(),
}

describe('NavigationMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders navigation menu items', () => {
    render(<NavigationMenu {...mockProps} />)
    
    // Check for main navigation items
    expect(screen.getByText(/Home/i)).toBeInTheDocument()
    expect(screen.getByText(/Markets/i)).toBeInTheDocument()
    expect(screen.getByText(/Activity/i)).toBeInTheDocument()
  })

  it('highlights the active section', () => {
    render(<NavigationMenu {...mockProps} activeSection="markets" />)
    
    const marketsLink = screen.getByText(/Markets/i)
    expect(marketsLink.closest('button')).toHaveClass('bg-gray-100')
  })

  it('calls setActiveSection when clicking navigation items', async () => {
    const user = userEvent.setup()
    render(<NavigationMenu {...mockProps} />)

    const marketsButton = screen.getByText(/Markets/i)
    await user.click(marketsButton)

    expect(mockProps.setActiveSection).toHaveBeenCalledWith('markets')
  })

  it('changes active state when different section is selected', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<NavigationMenu {...mockProps} />)

    // Click on markets
    const marketsButton = screen.getByText(/Markets/i)
    await user.click(marketsButton)

    // Re-render with markets as active
    rerender(<NavigationMenu {...mockProps} activeSection="markets" />)

    // Markets should now be highlighted
    expect(marketsButton.closest('button')).toHaveClass('bg-gray-100')
  })

  it('handles multiple navigation items correctly', async () => {
    const user = userEvent.setup()
    render(<NavigationMenu {...mockProps} />)

    // Test multiple navigation items
    const homeButton = screen.getByText(/Home/i)
    const activityButton = screen.getByText(/Activity/i)

    await user.click(homeButton)
    expect(mockProps.setActiveSection).toHaveBeenCalledWith('home')

    await user.click(activityButton)
    expect(mockProps.setActiveSection).toHaveBeenCalledWith('activity')
  })

  it('maintains accessibility features', () => {
    render(<NavigationMenu {...mockProps} />)
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeEnabled()
      expect(button).toBeVisible()
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<NavigationMenu {...mockProps} />)

    const firstButton = screen.getByText(/Home/i)
    firstButton.focus()

    // Test Enter key
    await user.keyboard('{Enter}')
    expect(mockProps.setActiveSection).toHaveBeenCalledWith('home')
  })

  it('displays proper styling for inactive items', () => {
    render(<NavigationMenu {...mockProps} activeSection="home" />)
    
    const marketsButton = screen.getByText(/Markets/i)
    expect(marketsButton.closest('button')).not.toHaveClass('bg-gray-100')
  })

  it('handles rapid clicking without issues', async () => {
    const user = userEvent.setup()
    render(<NavigationMenu {...mockProps} />)

    const marketsButton = screen.getByText(/Markets/i)
    
    // Rapid clicks
    await user.click(marketsButton)
    await user.click(marketsButton)
    await user.click(marketsButton)

    expect(mockProps.setActiveSection).toHaveBeenCalledTimes(3)
  })
})