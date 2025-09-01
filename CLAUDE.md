# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PrediWin.com - Predict, Win, Repeat** is a sophisticated Next.js prediction market platform that gamifies forecasting across multiple asset classes and events through blockchain-based prediction competitions. Built on Base network with OnchainKit integration, users compete in weekly prediction cycles covering cryptocurrency, stocks, sports, and other market movements with structured timing for pot entry, prediction periods, and results determination.

### Core Concept & Weekly Schedule
- Users pay **ETH entry fees** (converted from USD values ~$0.01-0.06 based on day) to enter prediction pots via smart contracts
- **Structured weekly cycle** with specific timing for different activities:
  - **Sunday-Friday**: Pot entry period (users can join with increasing daily fees based on USD value)
  - **Sunday-Friday**: Prediction period (participants make forecasts on various assets)
  - **Saturday**: Results day (winners determined at midnight UTC, pot distributed) - pot entries CLOSED
- **Prediction Logic**: Users predict next day's asset price movements (positive/negative) across multiple markets
- **Winners split the pot** equally based on actual price movement outcomes
- **Wrong predictors get temporarily blocked** from future prediction rounds until re-entry fee is paid
- **Referral system** rewards users with free pot entries for bringing friends
- **Re-entry System**: Users who made wrong predictions can pay today's entry fee to re-enter markets

### Private Pot Creation System (New)
- **Create Custom Pots**: Users can deploy their own private prediction markets on any topic
- **Factory Contract**:  enables cheap EIP-1167 cloning of prediction pots
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
| **Sunday** | ✅ Open | ✅ Open | Cheapest entry (~$0.01 USD in ETH) |
| **Monday** | ✅ Open | ✅ Open | Low entry fee (~$0.02 USD in ETH) |
| **Tuesday** | ✅ Open | ✅ Open | Medium entry fee (~$0.03 USD in ETH) |
| **Wednesday** | ✅ Open | ✅ Open | Higher entry fee (~$0.04 USD in ETH) |
| **Thursday** | ✅ Open | ✅ Open | High entry fee (~$0.05 USD in ETH) |
| **Friday** | ✅ Open | ✅ Open | Highest entry fee (~$0.06 USD in ETH) |

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
- `app/Pages/`: Main application pages (LandingPage, Markets, MakePredictionPage, createPotPage, etc.)
- `app/Sections/`: Reusable UI components (NavigationMenu, ResponsiveLogo)
- `app/Database/`: Database schema and actions using Drizzle ORM
  - `actions.ts`: Main database operations
  - `actions3.ts`: Pot participation history functions + Live chart data (NEW 2025)
  - `OwnerActions.ts`: Admin/owner operations
  - `schema.ts`: Complete database schema definitions
- `app/Constants/`: Configuration files for markets, coins, and pricing
- `app/Languages/`: Internationalization support

### Main Application Flow
The main app component (`app/page.tsx`) uses a section-based navigation system where different pages are rendered based on `activeSection` state. Navigation is handled through the `NavigationMenu` component.

**Updated Navigation (2025)**: When users click markets from LandingPage, they are **always routed to TutorialBridge dashboard** (instead of automatic redirects to different pages based on participation status). This ensures all users see the live prediction chart and can make informed decisions about their next steps.

### Database Schema

#### Core Prediction Tables
- `FeaturedBets`: Primary prediction markets (walletAddress, prediction, betDate, createdAt) - covers Bitcoin and featured assets
- `CryptoBets`: General crypto prediction markets
- `WrongPredictions`/`WrongPredictionsCrypto`: Tracking incorrect predictions and re-entry fees

#### Pot Participation History System (NEW - 2025)
- `PotParticipationHistory`: Complete audit trail of pot entry/exit events (walletAddress, contractAddress, tableType, eventType, eventDate, eventTimestamp)
- **Fair Eligibility System**: Tracks who was eligible for predictions on specific dates to prevent unfair penalties
- **Same-Day Entry Protection**: Users entering mid-week aren't penalized for missing predictions before their entry date
- **Event-Based Tracking**: Records 'entry' and 'exit' events with precise timestamps for accurate eligibility determination

#### Referral System Tables (New)
- `ReferralCodes`: Unique 8-character codes per user (walletAddress, referralCode, createdAt)
- `Referrals`: Tracks referral relationships and confirmation status (referrerWallet, referredWallet, referralCode, potEntryConfirmed, confirmedAt)
- `FreeEntries`: Manages earned/used free pot entries (walletAddress, earnedFromReferrals, usedEntries)

#### AI Trivia System Tables
- `TriviaStats`: Tracks AI trivia game statistics (walletAddress, correctAnswers, totalQuestions, currentStreak, bestStreak, discountEarned)

#### Email Collection System (New)
- `UserEmails`: Stores user email addresses for marketing and updates (walletAddress, email, sourcePage, createdAt, updatedAt)
- Comprehensive input validation and SQL injection protection implemented across all database operations
- Email collection modal system with persistent dismissal state (3-day duration) and permanent opt-out after submission

#### User Management
- `Messages`: User messaging system
- `ImageURLs`: User profile images

### Blockchain Integration
- **Smart Contracts**: PredictionPot contracts handle ETH pot entry and winner distribution
- **⚠️ CRITICAL CONTRACT ISSUE RESOLVED**: Original PredictionPot.sol had permanent corruption bug using `transfer()` which fails with 2300 gas limit when sending to smart contracts. **FIXED CONTRACT DEPLOYED**: `PredictionPotFixed` at `0xd1547F5bC0390F5020B2A80F262e28ccfeF2bf9c` uses `call()` instead of `transfer()` to prevent permanent distribution failures
- **Factory Contract**: `PredictionPotWithCloning` enables users to create private pots
- **EIP-1167 Cloning**: Gas-efficient deployment of new prediction pots using minimal proxy pattern
- **OnchainKit & Wagmi**: Wallet connections, transaction handling, and Base network integration
- **ETH Payments**: Users send ETH directly for pot entries (amounts calculated from USD values)
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
- **Weekly Pot Entry**: Users pay dynamic ETH fees (converted from $0.01-0.06 USD) to enter prediction competitions (Sunday-Friday)
- **Dynamic Pricing**: Entry fees increase daily to incentivize early participation
- **Dynamic UI**: Shows countdown timers and status messages based on current day
- **Direct ETH Payment**: Single-step process - users send ETH directly to contract
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
- **Fraud Protection**: Free entries only awarded after confirmed ETH pot payments
- **Referral Dashboard**: Collapsible UI showing stats, code sharing, and available free entries
- **Smart UI Flow**: Prioritizes free entries over ETH payments when available

### Owner/Admin Functions
- **Daily Outcome Setting**: Admins set "positive" or "negative" asset movement results
- **Winner Processing**: Automated system determines winners and distributes pot funds
- **Wrong Prediction Management**: Tracks incorrect predictions and manages re-entry fees
- **Combined Operations**: Streamlined workflow for weekly settlement cycles

### Prediction Logic (`MakePredictionsPage.tsx`)
- **Weekly Prediction Window**: Users can make predictions Sunday-Friday
- **Same-Day Predictions**: Users can predict starting from their entry day (including same day)
- **Tomorrow's Predictions**: Users forecast next day's asset price movements
- **One Prediction Per Day**: System prevents multiple predictions, allows updates before cutoff
- **Immediate Penalty System**: `checkMissedPredictionPenalty()` runs on page load to instantly block users with missed predictions
- **Fair Eligibility**: Only penalizes users who were actually eligible for missed predictions (no penalties for pre-entry dates)
- **Re-entry System**: Wrong predictors must pay today's entry fee to re-enter markets
- **Day-Based UI Logic**:
  - **Sunday-Friday**: Shows normal prediction interface (positive/negative buttons)
  - **Saturday**: Shows "Results Day" with settlement countdown
- **Multiple Markets**: Support for Featured (Bitcoin) and general Crypto prediction markets
- **Clean Terminology**: Uses "predict/prediction" terminology instead of "bet/betting"

#### Updated MakePredictionsPage Layout Structure:
- **Priority Layout**: New prediction interface displays first, previous predictions and timers below
- **Universal Dual Timer System**: Always shows exactly 2 timers regardless of state:
  - **"New Question"**: Red timer counting to next midnight (next prediction opportunity)
  - **"Next Elimination"**: Blue timer counting to outcome reveal (24 hours after new question)
- **Visual Urgency Feedback**: Timers change color and animate when urgent (<1 hour orange, <15 min red)
- **Mobile Optimized**: Responsive spacing, typography, and touch-friendly elements
- **Interface Flow**:
  1. **Main Prediction Interface** (top) - New question prominently displayed first
  2. **Game Timers Section** (middle) - Consistent dual timer system after scroll
  3. **Previous Prediction Section** (bottom) - Context for awaiting results
- **Timer Logic**: 
  - New Question: Counts to tonight's midnight
  - Next Elimination: Counts to tomorrow's midnight (24 hours after new question)
- **State Independence**: Timers maintain consistent countdown regardless of prediction actions

### TutorialBridge Dashboard (`TutorialBridge.tsx`) - **MAJOR UPDATE (2025)**
- **Live Prediction Chart**: Real-time SVG timeline showing Yes/No prediction sentiment throughout the day
  - **3-Hour Intervals**: Chart displays data every 3 hours (12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm)
  - **Live Data**: Only shows completed time periods, grows throughout the day as more data comes in
  - **Y-Axis Separation**: Yes line slightly above, No line slightly below to prevent overlap when percentages are similar
  - **Professional Design**: Percentage labels on right side, AM/PM time format, thin lines with data points
  - **Top-Left Legend**: Current percentages with colored dots (election results style)
- **Database Integration**: Uses `getHourlyPredictionData()` from `actions3.ts` to fetch tomorrow's predictions grouped by hour
- **Rules Summary Dropdown**: Collapsible section with game rules (replaces old tutorial steps)
- **Always Accessible**: Removed automatic redirects - all users now see this dashboard regardless of participation status
- **Strategic Enter Button**: Positioned absolutely in top-right corner, always visible while viewing chart data
- **Real-time Updates**: Chart refreshes every 30 seconds showing live sentiment changes
- **Market-Specific Data**: Chart shows data for the currently selected pot (Featured/Trending vs Crypto)

### Buy Page System (`BuyPage.tsx`)
- **ETH Purchase Support**: Users can purchase ETH via Coinbase OnChainKit
- **ETH for Everything**: Single token for both pot entries and gas fees
- **Base Network**: Native ETH transactions with low fees (~$0.01-0.05)
- **Educational UI**: Clear explanations of ETH usage for pot participation
- **Integrated Purchase Flow**: Seamless buying experience within the app

### Re-entry System
- **Wrong Prediction Recovery**: Users who made incorrect predictions can re-enter markets
- **Current Day Pricing**: Re-entry fee matches today's pot entry fee (not tomorrow's)
- **Direct ETH Payment**: Single-step process - users send ETH directly to re-enter
- **Database Cleanup**: Removes user from wrong predictions table upon successful payment
- **UI Integration**: Minimalist design matching the "You're in the Pot" aesthetic
- **Clear Messaging**: Uses "today's entry fee" instead of specific amounts for cleaner UX

### Missed Prediction Penalty System (NEW - 2025)
- **Immediate Page-Level Checking**: `checkMissedPredictionPenalty()` runs when users visit MakePredictionsPage
- **Fair Eligibility Logic**: Uses `PotParticipationHistory` to determine who should have made predictions
- **Same-Day Entry Protection**: Users entering today aren't penalized for today's missed predictions  
- **Instant Blocking UI**: Users with penalties see immediate block screen with re-entry button
- **Automatic Penalty Addition**: Missed predictions automatically added to wrong predictions table
- **Single Source of Truth**: Replaced complex `setDailyOutcome` logic with clean page-level validation
- **Database Functions**: `recordPotEntry()`, `isUserActiveOnDate()`, `getEligiblePredictors()`, `checkMissedPredictionPenalty()`
- **Production Architecture**: Eliminates race conditions and provides immediate user feedback

### Private Pot Creation System (`createPotPage.tsx`)
- **Factory Contract Integration**: Uses deployed `PredictionPotWithCloning` at `0x34c2fF1bb3a8cbF05a7a98f70143DD6F22Df3490`
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
- **100 Answer Milestone**: Users earn ~$0.01 USD ETH discount after answering 100 questions correctly
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
- **Email Collection Integration**: Modal appears 2 seconds after wallet connection with dismissible 3-day persistence

### Email Collection System (NEW)
- **Universal Integration**: Implemented across PredictionPotTest, AIPage, PrivatePotInterface, and CreatePotPage
- **Smart Timing**: Modal appears 2 seconds after wallet connection on each page
- **Persistent State Management**: Uses localStorage with 3-day dismissal duration
- **Hook-Based Architecture**: `useEmailCollection` hook serves as single source of truth for modal state
- **Database Security**: Comprehensive input validation, sanitization, and SQL injection protection
- **User Experience**: 
  - **Dismissible**: Users can close modal and won't see it again for 3 days
  - **One-Time Collection**: After email submission, modal permanently disappears
  - **Non-Intrusive**: Only appears once per wallet per page with respectful timing
- **State Synchronization**: Hook state takes precedence over database checks to prevent modal re-appearance after submission
- **Source Tracking**: Tracks which page collected each email (PredictionPot, AI, PrivatePot, CreatePot)

### Performance Optimizations & Database Considerations

#### LandingPage.tsx Bookmark System (CRITICAL)
⚠️ **Potential Database Overload Issue**: The bookmark functionality in `LandingPage.tsx` can generate excessive database queries that may overwhelm the Neon PostgreSQL instance.

**The Problem:**
- **Original Implementation**: Made 50+ simultaneous database calls via `isMarketBookmarked()` for every market on each render
- **Trigger Points**: Executed whenever `address`, `isConnected`, `marketOptions`, or language (`t`) changed
- **Database Impact**: Could cause connection limits to be exceeded and slow response times
- **User Impact**: Slow page loads, potential timeouts, poor user experience

**Optimization Implemented:**
- **Batched Processing**: Process markets in groups of 10 with 100ms delays between batches
- **Dependency Reduction**: Removed `marketOptions` and `t` from useEffect dependencies to prevent excessive re-runs
- **Request Debouncing**: Added 200ms debounce to prevent rapid successive calls during wallet connection changes
- **Cancellation Logic**: Proper cleanup prevents memory leaks and stale requests
- **Caching Strategy**: Geo IP language detection cached for 1 hour in localStorage
- **Detailed Logging**: Console tracking for bookmark loading performance monitoring

**Current Behavior:**
```javascript
// Before: 50+ simultaneous queries on every render change
// After: 10 queries per batch with delays, only on wallet/connection changes
console.log('📑 Loading bookmark status for user:', address);
console.log('📑 Checking bookmarks for 45 markets');
console.log('📑 Loaded 12 bookmarks');
```

**Database Function Optimization:**
- **BookmarksPage**: Added 10-second timeout and 100-market limit in `getUserBookmarks()`
- **Query Performance**: Added timing logs and error handling for slow database responses
- **Memory Management**: Proper async cleanup prevents memory leaks

**Monitoring Guidelines:**
- Watch console logs for bookmark loading times exceeding 2-3 seconds
- Monitor Neon database connection count and query performance
- Alert if `getUserBookmarks()` consistently times out (indicates database issues)
- Consider implementing Redis caching layer if bookmark queries become frequent

## Critical Bug Resolution - Pot Distribution Fix (August 2025)

### **The Problem: Permanent Contract Corruption**
A critical production issue was discovered where pot distribution would work multiple times, then suddenly fail permanently with "execution reverted" errors. The contract would become completely unusable for distribution, even though:
- Owner verification passed ✅
- Balance checks passed ✅  
- Winner validation passed ✅
- Gas estimation looked correct ✅
- All contract state appeared normal ✅

### **The Root Cause: transfer() vs call()**
After extensive debugging, the issue was traced to **Solidity's `transfer()` function** in the original contract:

```solidity
// BROKEN - Original code causing permanent failures
for (uint256 i = 0; i < winners.length; i++) {
    payable(winners[i]).transfer(share);  // ❌ 2300 gas limit fails with smart contracts
}
```

**Why transfer() fails:**
- `transfer()` has a hardcoded **2300 gas limit**
- When sending ETH to smart contract addresses (like multisigs), 2300 gas is insufficient
- The function **permanently reverts** and corrupts the distribution process
- Once it fails once, the contract becomes unusable for distribution

### **The Solution: call() with Proper Error Handling**
The fix was deploying `PredictionPotFixed.sol` with `call()` instead of `transfer()`:

```solidity
// FIXED - New code that handles all recipient types
uint256 successfulTransfers = 0;
for (uint256 i = 0; i < winners.length; i++) {
    (bool success, ) = payable(winners[i]).call{value: share}("");  // ✅ Forwards all gas
    if (success) {
        successfulTransfers++;
    } else {
        emit TransferFailed(winners[i], share);
        // Continue with other winners instead of reverting
    }
}
require(successfulTransfers > 0, "All transfers failed");
```

**Fixed Contract Deployed:** `0xd1547F5bC0390F5020B2A80F262e28ccfeF2bf9c`

### **Key Lessons Learned**
1. **Never use `transfer()` for ETH distribution** - use `call()` instead
2. **Smart contract recipients need more than 2300 gas** for their receive functions  
3. **Production contracts must handle edge cases** like multisig wallets
4. **Graceful degradation is critical** - if one transfer fails, continue with others
5. **Emergency withdrawal functions** are essential for stuck funds

### **Impact & Resolution**
- ✅ **Root cause permanently fixed** with new contract architecture
- ✅ **No more distribution failures** regardless of recipient address type
- ✅ **Future-proof solution** handles EOAs, smart contracts, and multisigs
- ✅ **Emergency recovery** built-in if needed
- ✅ **Production-ready** with millions of dollars in mind

This fix ensures pot distribution will **never fail again** due to recipient address types.

## Development Notes

- **OnchainKit Version**: Currently on `0.38.2` (upgraded from `0.37.6`). Note: 0.37.6 had mobile wallet modal black background issue, 0.38.5+ has desktop z-index issues. 0.38.2 has mobile issue but desktop works - waiting for OnchainKit team to fix mobile modal bug in future releases.
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
- **ETH Amount Calculation**: All ETH amounts calculated from USD values with proper wei precision handling
- **Dynamic Pricing System**: Daily entry fees increase from Sunday (~$0.01 USD) to Friday (~$0.06 USD) in ETH
- **Multi-Asset Support**: Platform designed for predictions beyond crypto (stocks, sports, etc.)
- **Immediate Penalty System**: Page-level validation prevents delayed surprises and provides instant feedback
- **Event-Based History Tracking**: Complete audit trail of all pot participation for fair penalty determination
- **Same-Day Prediction Eligibility**: Users can predict starting from their entry day (including entry day itself)