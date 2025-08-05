# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Foresight - Survival of the Brightest** is a Next.js prediction market application built with OnchainKit and Base blockchain integration. The app focuses on cryptocurrency prediction markets, particularly Bitcoin betting, with wallet connectivity and user profile management.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Core Structure
- **App Router**: Uses Next.js 14 App Router with TypeScript
- **Blockchain**: Built on Base network using OnchainKit and Wagmi
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Custom CSS with Tailwind-like classes
- **State Management**: React hooks and Wagmi for blockchain state

### Key Directories
- `app/Pages/`: Main application pages (LandingPage, Markets, BitcoinBetting, etc.)
- `app/Sections/`: Reusable UI components (NavigationMenu, ResponsiveLogo)
- `app/Database/`: Database schema and actions using Drizzle ORM
- `app/Constants/`: Configuration files for markets, coins, and pricing
- `app/Languages/`: Internationalization support

### Main Application Flow
The main app component (`app/page.tsx`) uses a section-based navigation system where different pages are rendered based on `activeSection` state. Navigation is handled through the `NavigationMenu` component.

### Database Schema
- `Messages`: User messaging system
- `FeaturedBets`: Bitcoin prediction bets
- `CryptoBets`: General crypto prediction bets
- `WrongPredictions`/`WrongPredictionsCrypto`: Tracking incorrect predictions
- `ImageURLs`: User profile images

### Blockchain Integration
- Uses OnchainKit for wallet connections and Base network integration
- Wagmi hooks for blockchain interactions
- ConnectWallet component integrated in header
- Wallet provider configured for Base chain in `providers.tsx`
- Environment variables needed: `NEXT_PUBLIC_ONCHAINKIT_API_KEY`, `NEXT_PUBLIC_PROJECT_ID`

### Configuration Notes
- TypeScript and ESLint errors are ignored during build (see `next.config.mjs`)
- Webpack configuration includes externals for WalletConnect compatibility
- Drizzle ORM is used for database operations
- Python script for token launching in `LaunchToken/newtoken.py`

## Development Notes

- The app uses a single-page application approach with conditional rendering
- Wallet integration is required for most functionality
- Database operations use Drizzle ORM with PostgreSQL
- Charts and data visualization components use various charting libraries
- Real-time crypto price data integration through Constants/getPrice.ts