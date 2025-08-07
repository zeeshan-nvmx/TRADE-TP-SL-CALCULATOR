# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

This is a comprehensive React-based futures trading calculator built with Vite. The application calculates Take Profit (TP), Stop Loss (SL), position sizing, risk management, and includes advanced features like trailing stop losses.

### Technology Stack
- **Frontend**: React 19 with JSX
- **Build Tool**: Vite
- **Styling**: TailwindCSS v3.4.17 with dark mode support (`class` strategy)
- **Linting**: ESLint 9.21 with React hooks and refresh plugins
- **PostCSS**: Autoprefixer integration

### File Structure
```
src/
├── main.jsx                      # React DOM rendering entry point
├── App.jsx                       # Main app wrapper (renders BinanceFuturesCalculator)
├── BinanceFuturesCalculator.jsx  # Core calculator (1642 lines, ~27k tokens)
├── index.css                     # Global TailwindCSS imports
└── assets/                       # Static React logo assets
```

## Core Component Architecture (BinanceFuturesCalculator.jsx)

### Helper Functions (lines 3-41)
Located at the top of the file, these utility functions handle:
- `safeDivide()` - Division with zero/NaN/Infinity protection
- `parseFloatInput()` - Safe parsing of user input with null handling
- `formatNumber()` - Number formatting with decimal places (default 2)
- `formatHighPrecision()` - High precision formatting (6-8 decimals for small numbers)
- `formatPrice()` - Price formatting with adaptive decimal places based on magnitude

### State Management (lines 44-162)
The component uses extensive local state with useState hooks:

**Core Trading States:**
- `exchange` - 'binance' or 'bybit' with different fee structures
- `accountSize` / `accountSizeInput` - User's account balance
- `symbol` - Trading pair (e.g., 'BTCUSDT')
- `leverage` / `leverageInput` - 1-125x leverage
- `tradeDirection` - 'LONG' or 'SHORT'
- `entryPrice` / `entryPriceInput` - Entry price for the position

**Take Profit Management:**
- `takeProfits` - Array of 3 TP objects with structure:
  ```js
  {
    enabled: boolean,
    priceInput: string,
    price: number,
    percentInput: string, 
    percent: number,
    quantityInput: string,
    quantity: number,  // Must sum to 100% across enabled TPs
    profit: number,    // Net profit calculated
    profitPercent: number,
    grossProfit: number,   // Profit before fees
    grossProfitPercent: number
  }
  ```

**Stop Loss States:**
- `useStopLoss` - Boolean toggle
- `stopLossPrice` / `stopLossPriceInput` - SL price
- `stopLossPercent` / `stopLossPercentInput` - SL distance from entry

**Trailing Stop Loss (NEW Feature):**
- `useTrailingStop` - Boolean toggle
- `trailingStopPercent` - Distance percentage for trailing
- `trailingActivationPrice` - Price level where trailing begins
- `trailingStopSimulationPrice` - Simulated peak price for testing
- `trailingStopTriggerPrice` - Calculated trailing stop trigger price

**Position Sizing:**
- `calculationMode` - 'fixed' (use specified USDT) or 'risk' (use % of account)
- `positionSizeUSDT` - Fixed margin amount
- `riskPercent` - Risk percentage of account for risk-based sizing

### Key Calculation Logic (lines 460-682)

**Position Sizing Modes:**
1. **Fixed Mode**: `positionSize = margin * leverage`
2. **Risk Mode**: `quantity = riskAmount / stopLossDistance` (requires valid SL)

**Fee Structure:**
- Binance: Maker 0.02%, Taker 0.04%
- Bybit: Maker 0.01%, Taker 0.06%
- Entry orders = Taker fees, TP orders = Maker fees, SL orders = Taker fees

**Profit/Loss Calculations:**
- **Gross P&L**: Price difference × Quantity (before fees)
- **Net P&L**: Gross P&L - Entry Fee - Exit Fee
- All calculations respect LONG vs SHORT direction

**Liquidation Price Formula:**
- **Standard**: Based on initial margin and MMR (0.5%)
- **Real**: Includes entire account balance as buffer
- LONG: `(qty × entry - margin) / (qty × (1 - MMR))`
- SHORT: `(margin + qty × entry) / (qty × (1 + MMR))`

### Input Validation & Synchronization (lines 253-450)

**Price/Percent Synchronization:**
- TP and SL can be set by either price or percentage
- `lastUpdated` state tracks which field was last modified
- Automatic conversion between price ↔ percentage based on entry price

**Quantity Redistribution:**
- TP quantities must always sum to 100%
- `redistributeTPQuantities()` handles automatic rebalancing when TPs are enabled/disabled
- Proportional distribution maintains relative weights

**Input Handlers:**
- All numeric inputs have dedicated handlers with validation
- Leverage is clamped between 1-125
- Price validation ensures SL is on correct side of entry price

### Preset Systems (lines 737-743)
Pre-configured values for quick input:
- **Leverage**: [5, 10, 15, 20, 25, 35, 45, 50, 60, 75, 100]
- **TP Percentages**: [1, 2, 3, 5, 6, 7, 9, 10, 12.5, 15]
- **SL Percentages**: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]
- **Trailing Stop**: [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5]
- **Risk Percentages**: [5, 10, 15, 20, 25, 30, 40, 50]
- **Fixed USDT**: [100, 200, 250, 300, 400, 500, 600, 800, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 3000, 3500, 4000, 4500, 5000]

### UI Layout (lines 756-1642)

**Left Column - Inputs:**
1. **Trade Setup** (lines 762-889)
   - Exchange selection (Binance/Bybit)
   - Account size, Symbol, Leverage with presets
   - LONG/SHORT direction toggle
   - Entry price input

2. **Take Profit Targets** (lines 891-995)
   - 3 configurable TP levels with enable/disable
   - Quantity distribution (must sum to 100%)
   - Price and percentage inputs with validation
   - Visual warnings for invalid TP levels
   - Preset percentage buttons

3. **Stop Loss Configuration** (lines 997-1194)
   - Regular stop loss with price/percentage inputs
   - **Trailing Stop Loss Section** with:
     - Trailing distance percentage
     - Activation price (auto-set to entry ±2%)
     - Simulation price for testing scenarios
     - Real-time trigger price calculation display

4. **Position Sizing** (lines 1196-1294)
   - Toggle between Fixed USDT and Risk % modes
   - Risk mode only available when SL is enabled
   - Preset buttons for both modes

**Right Column - Results:**
1. **Trade Analysis** - Position size, quantity, margin requirements, R/R ratios
2. **Fees Analysis** - Detailed fee breakdown by exchange and scenario
3. **Liquidation Analysis** - Standard and real liquidation prices with buffer info
4. **Profit Scenarios** - Individual TP analysis and combined profit calculations
5. **Loss Scenario** - SL impact analysis or liquidation warnings
6. **Trailing Stop Scenario** - Complete simulation of trailing stop execution

### Advanced Features

**Trailing Stop Loss Logic:**
- Activation price must be favorable to entry (above for LONG, below for SHORT)
- Simulation price must be beyond activation price
- Trigger price calculated as `simulationPrice × (1 ± trailingPercent)`
- Never allows trailing below initial SL (for protection)

**Risk Management:**
- Position size warnings when margin exceeds account size
- Visual indicators for invalid price targets
- Comprehensive fee calculations for all scenarios
- Buffer calculations showing account protection

**Real-time Updates:**
- `useEffect` hooks trigger recalculations on input changes
- Dependency arrays ensure efficient re-rendering
- Price/percent synchronization maintains consistency

**Binance Futures API Integration:**
- Auto-fetches ALL Binance Futures contract types every 5 seconds
- Includes PERPETUAL, CURRENT_QUARTER, NEXT_QUARTER, and delivery-date contracts
- Symbol selector with search functionality and contract type indicators
- Real-time price updates with connection status indicators (🟢🟡🔴)
- Smart sorting: Perpetuals first, then delivery contracts by date

## Development Guidelines

### Code Organization
- **Refactored Architecture**: Modular component-based structure
- **Main Components**: `BinanceFuturesCalculatorNew.jsx` orchestrates all components
- **Extracted Utilities**: `utils/calculations.js` and `constants/presets.js`
- **Custom Hooks**: `hooks/useCalculator.js` and `hooks/useBinanceAPI.js`
- **API Services**: `services/binanceAPI.js` for Binance Futures API integration
- **UI Components**: Separated into logical components in `components/` directory
- **No Tests**: Testing infrastructure is not present

### Styling Approach
- **TailwindCSS Classes**: Extensive use of utility classes
- **Dark Mode**: `dark:` prefixes throughout with `class` strategy
- **Responsive Design**: `md:` breakpoints for mobile/desktop layouts
- **Color System**: Neutral grays, green for profits, red for losses, blue for info

### State Patterns
- **Dual Inputs**: Separate `input` (string) and parsed (number) states for all numeric fields
- **Validation States**: Boolean flags for invalid conditions with visual feedback
- **Calculated States**: Derived values updated via useEffect dependencies

### Common Modification Patterns
- **Adding New Presets**: Update preset arrays and add corresponding map/button rendering
- **New Calculations**: Add state variables and update `calculateAll()` function
- **UI Changes**: Modify JSX structure while maintaining TailwindCSS class patterns
- **Validation Logic**: Add checks in input handlers and visual indicators in JSX

### Performance Considerations
- **Large Component**: File may be slow to load in editors due to size
- **Frequent Recalculations**: Multiple useEffect hooks trigger on input changes
- **String Comparisons**: JSON.stringify used for deep state change detection