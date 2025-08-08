# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Foresight - Survival of the Brightest** is a sophisticated Next.js prediction market application that gamifies cryptocurrency forecasting through blockchain-based pot betting. Built on Base network with OnchainKit integration, users compete in weekly Bitcoin price prediction cycles with structured timing for pot entry, betting periods, and results determination.

### Core Concept & Weekly Schedule
- Users pay **0.01 USDC** to enter prediction pots via smart contracts
- **Structured weekly cycle** with specific timing for different activities:
  - **Saturday-Tuesday**: Pot entry period (users can join with USDC)
  - **Tuesday-Thursday**: Betting period (participants make Bitcoin predictions)
  - **Friday**: Results day (winners determined at midnight UTC, pot distributed)
- **Prediction Logic**: Users predict next day's Bitcoin price movement (positive/negative)
- **Winners split the pot** equally based on actual price movement
- **Wrong predictors get temporarily blocked** from future betting rounds
- **Referral system** rewards users with free pot entries for bringing friends

### Complete Weekly Flow
| Day | Pot Entry | Betting | Status |
|-----|-----------|---------|---------|
| **Saturday** | ✅ Open | ❌ Closed | Weekend pot entry |
| **Sunday** | ✅ Open | ❌ Closed | Weekend pot entry |
| **Monday** | ✅ Open | ❌ Closed | Final pot entry day |
| **Tuesday** | ✅ Open | ✅ **Opens** | Pot entry + betting begins |
| **Wednesday** | ❌ **Closes** | ✅ Active | Betting continues |
| **Thursday** | ❌ Closed | ✅ Active | Final betting day |
| **Friday** | ❌ Closed | ❌ **Closes** | Results day + pot distribution |

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
- **Weekly Pot Entry**: Users pay 0.01 USDC to enter prediction competitions (Saturday-Tuesday)
- **Dynamic UI**: Shows countdown timers and status messages based on current day
- **USDC Approval Flow**: Two-step process (approve → enter pot) for blockchain security
- **Smart Contract Integration**: Automated pot distribution to winners via blockchain
- **Participant Tracking**: Real-time display of pot balance and participant count
- **Day-Based Logic**: 
  - **Sat-Tue**: Shows pot entry interface + deadline countdown to Wednesday
  - **Wed-Fri**: Shows "pot entry closed" countdown to next Saturday

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

### Betting & Prediction Logic (`BitcoinBetting.tsx`)
- **Weekly Betting Window**: Users can only place bets Tuesday-Thursday
- **Tomorrow's Bets**: Users predict next day's Bitcoin price movement
- **One Bet Per Day**: System prevents multiple bets, allows bet updates before cutoff
- **Temporary Blocking**: Wrong predictors are temporarily banned from future rounds
- **Day-Based UI Logic**:
  - **Tuesday-Thursday**: Shows normal betting interface (YES/NO buttons)
  - **Friday**: Shows special "Results Day" message with excitement and countdown
  - **Saturday-Monday**: Shows "Betting Closed" with schedule information
- **Multiple Markets**: Support for both Featured (Bitcoin) and Crypto prediction markets

### Tutorial System (`TutorialBridge.tsx`)
- **5-Step Tutorial**: Guides new users through the weekly game cycle
- **Updated Content**: Reflects accurate timing and schedules for pot entry and betting
- **Bilingual Support**: English and Portuguese translations
- **Cookie-Based**: Remembers if user has completed tutorial

## Development Notes

- **SPA Architecture**: Single-page application with conditional rendering based on `activeSection`
- **Wallet-First Design**: Most functionality requires wallet connection and Base network
- **Database Operations**: All data persistence uses Drizzle ORM with PostgreSQL
- **Real-time Updates**: Integrates live crypto pricing via `Constants/getPrice.ts`
- **Blockchain State Management**: Wagmi hooks for contract reads/writes and transaction monitoring
- **Error Handling**: Comprehensive error states for failed transactions and network issues
- **Day-Based Logic**: Core functionality changes based on current day of the week using JavaScript `Date.getDay()`
- **Countdown Systems**: Multiple real-time countdowns for pot entry deadlines and reopening schedules
- **Responsive UI**: Different interfaces and messages shown based on weekly schedule phases