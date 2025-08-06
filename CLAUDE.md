# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Foresight - Survival of the Brightest** is a sophisticated Next.js prediction market application that gamifies cryptocurrency forecasting through blockchain-based pot betting. Built on Base network with OnchainKit integration, users compete in daily Bitcoin price prediction tournaments where accuracy determines winners and losers face temporary betting restrictions.

### Core Concept
- Users pay **0.01 USDC** to enter prediction pots via smart contracts
- Make daily **Bitcoin price predictions** (positive/negative movement)  
- **Winners split the pot** equally at day's end based on actual price movement
- **Wrong predictors get temporarily blocked** from future betting rounds
- **Referral system** rewards users with free pot entries for bringing friends

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

#### Core Betting Tables
- `FeaturedBets`: Bitcoin prediction bets (walletAddress, prediction, betDate, createdAt)
- `CryptoBets`: General crypto prediction bets
- `WrongPredictions`/`WrongPredictionsCrypto`: Tracking incorrect predictions for temporary bans

#### Referral System Tables (New)
- `ReferralCodes`: Unique 8-character codes per user (walletAddress, referralCode, createdAt)
- `Referrals`: Tracks referral relationships and confirmation status (referrerWallet, referredWallet, referralCode, potEntryConfirmed, confirmedAt)
- `FreeEntries`: Manages earned/used free pot entries (walletAddress, earnedFromReferrals, usedEntries)

#### User Management
- `Messages`: User messaging system
- `ImageURLs`: User profile images

### Blockchain Integration
- **Smart Contracts**: PredictionPot contracts handle USDC pot entry and winner distribution
- **OnchainKit & Wagmi**: Wallet connections, transaction handling, and Base network integration
- **USDC Payments**: Users approve and spend USDC for pot entries (0.01 USDC per entry)
- **ConnectWallet**: Integrated in header for seamless wallet connectivity
- **Contract Addresses**: Configurable via cookies, supports multiple prediction markets
- **Environment variables needed**: `NEXT_PUBLIC_ONCHAINKIT_API_KEY`, `NEXT_PUBLIC_PROJECT_ID`

### Configuration Notes
- TypeScript and ESLint errors are ignored during build (see `next.config.mjs`)
- Webpack configuration includes externals for WalletConnect compatibility
- Drizzle ORM is used for database operations
- Python script for token launching in `LaunchToken/newtoken.py`

## Key Features

### Prediction Pot System (`PredictionPotTest.tsx`)
- **Pot Entry**: Users pay 0.01 USDC to enter daily prediction competitions
- **USDC Approval Flow**: Two-step process (approve → enter pot) for blockchain security
- **Smart Contract Integration**: Automated pot distribution to winners via blockchain
- **Participant Tracking**: Real-time display of pot balance and participant count

### Referral Program (New Implementation)
- **Unique Codes**: Each user gets an 8-character alphanumeric referral code
- **Friend Rewards**: When 3 friends enter pots with your code, you earn 1 free entry
- **Fraud Protection**: Free entries only awarded after confirmed USDC pot payments
- **Referral Dashboard**: Collapsible UI showing stats, code sharing, and available free entries
- **Smart UI Flow**: Prioritizes free entries over USDC payments when available

### Owner/Admin Functions
- **Daily Outcome Setting**: Admins set "positive" or "negative" Bitcoin movement results
- **Winner Processing**: Automated system determines winners and distributes pot funds
- **Wrong Prediction Clearing**: Removes temporary bans for next betting round
- **Combined Operations**: Streamlined workflow for end-of-day settlement

### Betting & Prediction Logic
- **Tomorrow's Bets**: Users predict next day's Bitcoin price movement
- **One Bet Per Day**: System prevents multiple bets, allows bet updates before cutoff
- **Temporary Blocking**: Wrong predictors are temporarily banned from future rounds
- **Multiple Markets**: Support for both Featured (Bitcoin) and Crypto prediction markets

## Development Notes

- **SPA Architecture**: Single-page application with conditional rendering based on `activeSection`
- **Wallet-First Design**: Most functionality requires wallet connection and Base network
- **Database Operations**: All data persistence uses Drizzle ORM with PostgreSQL
- **Real-time Updates**: Integrates live crypto pricing via `Constants/getPrice.ts`
- **Blockchain State Management**: Wagmi hooks for contract reads/writes and transaction monitoring
- **Error Handling**: Comprehensive error states for failed transactions and network issues