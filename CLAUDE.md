# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrediWin.com - Predict, Win, Repeat** is a sophisticated Next.js prediction market platform that gamifies forecasting across multiple asset classes and events through blockchain-based prediction competitions. Built on Base network with OnchainKit integration, users compete in weekly prediction cycles covering cryptocurrency, stocks, sports, and other market movements with structured timing for pot entry, prediction periods, and results determination.

### Core Concept & Weekly Schedule
- Users pay **dynamic entry fees** (0.01-0.06 USDC based on day) to enter prediction pots via smart contracts
- **Structured weekly cycle** with specific timing for different activities:
  - **Sunday-Friday**: Pot entry period (users can join with increasing daily fees: 0.01→0.06 USDC)
  - **Sunday-Friday**: Prediction period (participants make forecasts on various assets)
  - **Saturday**: Results day (winners determined at midnight UTC, pot distributed) - pot entries CLOSED
- **Prediction Logic**: Users predict next day's asset price movements (positive/negative) across multiple markets
- **Winners split the pot** equally based on actual price movement outcomes
- **Wrong predictors get temporarily blocked** from future prediction rounds until re-entry fee is paid
- **Referral system** rewards users with free pot entries for bringing friends
- **Re-entry System**: Users who made wrong predictions can pay today's entry fee to re-enter markets

### Private Pot Creation System (New)
- **Create Custom Pots**: Users can deploy their own private prediction markets on any topic
- **Factory Contract**: `0xeE44be339B390726865aAC73435B96552C0697d3` enables cheap EIP-1167 cloning of prediction pots
- **User-Owned Markets**: Each created pot is owned and controlled by the creator
- **Flexible Topics**: Crypto prices, sports outcomes, world events, or any custom prediction
- **Gas-Efficient**: Users pay minimal Base network gas fees (~$0.01-0.05) for pot creation
- **Social Viral Growth**: Every pot creator brings their friend group to the platform
- **Creator Control**: Pot owners decide winners and distribute funds to participants
- **Full Lifecycle Implemented**: Create → Join → Predict → Distribute → Database Cleanup (all working)
- **⚠️ Design Improvement Needed**: Core functionality works but UI/UX requires significant design enhancement

### Complete Weekly Flow
| Day | Pot Entry | Predictions | Status & Fees |
|-----|-----------|-------------|---------------|
| **Saturday** | ❌ Closed | ❌ Closed | Results day - pot distribution |
| **Sunday** | ✅ Open | ✅ Open | Cheapest entry (0.01 USDC) |
| **Monday** | ✅ Open | ✅ Open | Low entry fee (0.02 USDC) |
| **Tuesday** | ✅ Open | ✅ Open | Medium entry fee (0.03 USDC) |
| **Wednesday** | ✅ Open | ✅ Open | Higher entry fee (0.04 USDC) |
| **Thursday** | ✅ Open | ✅ Open | High entry fee (0.05 USDC) |
| **Friday** | ✅ Open | ✅ Open | Highest entry fee (0.06 USDC) |

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
- `app/Pages/`: Main application pages (LandingPage, Markets, BitcoinBetting, createPotPage, etc.)
- `app/Sections/`: Reusable UI components (NavigationMenu, ResponsiveLogo)
- `app/Database/`: Database schema and actions using Drizzle ORM
- `app/Constants/`: Configuration files for markets, coins, and pricing
- `app/Languages/`: Internationalization support

### Main Application Flow
The main app component (`app/page.tsx`) uses a section-based navigation system where different pages are rendered based on `activeSection` state. Navigation is handled through the `NavigationMenu` component.

### Database Schema

#### Core Prediction Tables
- `FeaturedBets`: Primary prediction markets (walletAddress, prediction, betDate, createdAt) - covers Bitcoin and featured assets
- `CryptoBets`: General crypto prediction markets
- `WrongPredictions`/`WrongPredictionsCrypto`: Tracking incorrect predictions and re-entry fees

#### Referral System Tables (New)
- `ReferralCodes`: Unique 8-character codes per user (walletAddress, referralCode, createdAt)
- `Referrals`: Tracks referral relationships and confirmation status (referrerWallet, referredWallet, referralCode, potEntryConfirmed, confirmedAt)
- `FreeEntries`: Manages earned/used free pot entries (walletAddress, earnedFromReferrals, usedEntries)

#### AI Trivia System Tables
- `TriviaStats`: Tracks AI trivia game statistics (walletAddress, correctAnswers, totalQuestions, currentStreak, bestStreak, discountEarned)

#### User Management
- `Messages`: User messaging system
- `ImageURLs`: User profile images

### Blockchain Integration
- **Smart Contracts**: PredictionPot contracts handle USDC pot entry and winner distribution
- **Factory Contract**: `PredictionPotWithCloning` at `0xeE44be339B390726865aAC73435B96552C0697d3` enables users to create private pots
- **EIP-1167 Cloning**: Gas-efficient deployment of new prediction pots using minimal proxy pattern
- **OnchainKit & Wagmi**: Wallet connections, transaction handling, and Base network integration
- **USDC Payments**: Users approve and spend USDC for pot entries (0.01-0.06 USDC based on day)
- **ConnectWallet**: Integrated in header for seamless wallet connectivity
- **Contract Addresses**: Configurable via cookies, supports multiple prediction markets
- **Environment variables needed**: `NEXT_PUBLIC_ONCHAINKIT_API_KEY`, `NEXT_PUBLIC_PROJECT_ID`

### Configuration Notes
- TypeScript and ESLint errors are ignored during build (see `next.config.mjs`)
- Webpack configuration includes externals for WalletConnect compatibility
- Drizzle ORM is used for database operations
- Python script for token launching in `LaunchToken/newtoken.py`
- **OpenAI Integration**: Uses `OPENAI_API_KEY` environment variable for AI trivia question generation

## Key Features

### Prediction Pot System (`PredictionPotTest.tsx`)
- **Weekly Pot Entry**: Users pay dynamic fees (0.01-0.06 USDC) to enter prediction competitions (Sunday-Friday)
- **Dynamic Pricing**: Entry fees increase daily to incentivize early participation
- **Dynamic UI**: Shows countdown timers and status messages based on current day
- **USDC Approval Flow**: Two-step process (approve → enter pot) for blockchain security
- **Smart Contract Integration**: Automated pot distribution to winners via blockchain
- **Participant Tracking**: Real-time display of pot balance and participant count
- **Re-entry System**: Users with wrong predictions can pay today's entry fee to re-enter
- **Day-Based Logic**: 
  - **Sunday**: Shows cheapest entry opportunity
  - **Monday-Friday**: Shows increasing entry fees with clear pricing
  - **Saturday**: Shows "results day" with pot closed

### Referral Program (New Implementation)
- **Unique Codes**: Each user gets an 8-character alphanumeric referral code
- **Friend Rewards**: When 3 friends enter pots with your code, you earn 1 free entry
- **Fraud Protection**: Free entries only awarded after confirmed USDC pot payments
- **Referral Dashboard**: Collapsible UI showing stats, code sharing, and available free entries
- **Smart UI Flow**: Prioritizes free entries over USDC payments when available

### Owner/Admin Functions
- **Daily Outcome Setting**: Admins set "positive" or "negative" asset movement results
- **Winner Processing**: Automated system determines winners and distributes pot funds
- **Wrong Prediction Management**: Tracks incorrect predictions and manages re-entry fees
- **Combined Operations**: Streamlined workflow for weekly settlement cycles

### Prediction Logic (`BitcoinBetting.tsx`)
- **Weekly Prediction Window**: Users can make predictions Sunday-Friday
- **Tomorrow's Predictions**: Users forecast next day's asset price movements
- **One Prediction Per Day**: System prevents multiple predictions, allows updates before cutoff
- **Re-entry System**: Wrong predictors must pay today's entry fee to re-enter markets
- **Day-Based UI Logic**:
  - **Sunday-Friday**: Shows normal prediction interface (positive/negative buttons)
  - **Saturday**: Shows "Results Day" with settlement countdown
- **Multiple Markets**: Support for Featured (Bitcoin) and general Crypto prediction markets
- **Clean Terminology**: Uses "predict/prediction" terminology instead of "bet/betting"

### Tutorial System (`TutorialBridge.tsx`)
- **5-Step Tutorial**: Guides new users through the weekly game cycle
- **Updated Content**: Reflects accurate timing and schedules for pot entry and predictions
- **Bilingual Support**: English and Portuguese translations
- **Cookie-Based**: Remembers if user has completed tutorial
- **Clean Terminology**: Updated to use prediction-focused language

### Buy Page System (`BuyPage.tsx`)
- **Dual Token Support**: Users can purchase both USDC and ETH via Coinbase OnChainKit
- **USDC for Pot Entries**: Stablecoin for prediction market participation
- **ETH for Gas Fees**: Base network native token for transaction fees (~$0.01-0.05)
- **Educational UI**: Clear explanations of what each token is needed for
- **Integrated Purchase Flow**: Seamless buying experience within the app

### Re-entry System
- **Wrong Prediction Recovery**: Users who made incorrect predictions can re-enter markets
- **Current Day Pricing**: Re-entry fee matches today's pot entry fee (not tomorrow's)
- **Two-Step Process**: USDC approval → re-entry payment (same as normal pot entry)
- **Database Cleanup**: Removes user from wrong predictions table upon successful payment
- **UI Integration**: Minimalist design matching the "You're in the Pot" aesthetic
- **Clear Messaging**: Uses "today's entry fee" instead of specific amounts for cleaner UX

### Private Pot Creation System (`createPotPage.tsx`)
- **Factory Contract Integration**: Uses deployed `PredictionPotWithCloning` at `0xeE44be339B390726865aAC73435B96552C0697d3`
- **Three-State UI Flow**: Landing page → Create form → Success confirmation
- **Custom Pot Details**: Users input pot name and description for their prediction market
- **EIP-1167 Cloning**: Creates cheap proxy contracts (~$0.01-0.05 gas on Base)
- **Real-time Transaction Status**: Shows "Creating..." and "Confirming..." states during deployment
- **Success Handling**: Displays new pot contract address with copy-to-clipboard functionality
- **User Ownership**: Each created pot is owned and controlled by the creator
- **Wallet Integration**: Requires wallet connection, handles transaction states and errors
- **Social Viral Mechanism**: Every pot creator becomes a distribution point bringing friend groups
- **Gas-Efficient Deployment**: Users pay minimal Base network fees for their own pot creation

### AI Trivia Game System (`AIPage.tsx`)
- **OpenAI Integration**: Uses GPT-3.5-turbo model for dynamic question generation across 25+ categories
- **Minimalistic Design**: Black and white UI design with clean typography and responsive layout
- **Statistics Tracking**: Comprehensive stats including correct answers, accuracy, current streak, and best streak
- **100 Answer Milestone**: Users earn 0.01 USDC discount after answering 100 questions correctly
- **Hybrid Storage System**: 
  - **Database Storage**: Connected wallet users get persistent stats in PostgreSQL via Drizzle ORM
  - **localStorage Fallback**: Non-connected users use browser storage with seamless migration on wallet connect
- **Database Functions**: `getTriviaStats()`, `updateTriviaStats()`, `resetTriviaStats()` with error handling
- **Real-time Updates**: Immediate stat updates after each question with database synchronization
- **Mobile Responsive**: Optimized grid layouts and touch-friendly interface
- **Question Categories**: Science, History, Geography, Literature, Math, Sports, Technology, Art, Music, Movies, etc.
- **Fallback System**: Built-in fallback questions if OpenAI API fails
- **Progress Tracking**: Visual progress bar showing advancement toward 100 correct answers goal
- **Database Optimization**: Currently updates database immediately per question; future optimization could batch updates on page unload/inactivity for better performance

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
- **Prediction-Focused Language**: Entire UI uses "predict/prediction" terminology instead of "bet/betting" to avoid gambling associations
- **USDC Display Precision**: All USDC amounts properly calculated using 6-decimal precision (divide by 1,000,000)
- **Dynamic Pricing System**: Daily entry fees increase from Sunday (0.01 USDC) to Friday (0.06 USDC)
- **Multi-Asset Support**: Platform designed for predictions beyond crypto (stocks, sports, etc.)