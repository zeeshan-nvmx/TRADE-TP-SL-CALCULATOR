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
- Auto-fetches ALL Binance Futures contract types every 3 seconds
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

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Trade TP/SL Calculator**

A personal web-based futures trading calculator for Binance and Bybit. It calculates position sizing, take profit and stop loss targets, fee impact, liquidation prices, and net P&L including trailing stop scenarios. Live entry price is fetched from the Binance Futures API with an auto/manual toggle.

**Core Value:** Accurate net P&L calculation after real fees — so every trade decision reflects what actually lands in the account.

### Constraints

- **Stack**: React + Vite + Tailwind — no framework changes
- **API**: Must continue using `fapi.binance.com/fapi/v1/ticker/price` — same endpoint, same 3s interval
- **No API key**: Binance public endpoints only
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Summary
## Languages
- JavaScript (ES2020+) — all source files use `.js` / `.jsx` extensions; no TypeScript in use despite `@types/react` being listed as a dev dependency
- CSS — `src/index.css` for global base styles, Tailwind utility classes used inline throughout components
## Runtime
- Browser only — no Node.js server runtime
- Node.js is used only for the Vite dev/build toolchain
- npm — `package-lock.json` is present and committed
## Frameworks
- React `^19.0.0` (`react`, `react-dom`) — UI rendering, hooks-based state management
- Vite `^6.2.0` — dev server, HMR, production bundler
- `@vitejs/plugin-react` `^4.3.4` — Babel-based JSX transform for Vite
- Tailwind CSS `^3.4.17` — utility-first CSS
- PostCSS `^8.5.3` — required by Tailwind; config: `postcss.config.js`
- Autoprefixer `^10.4.21` — PostCSS plugin for vendor prefixes
- None — no test runner, no assertion library
## Key Dependencies
- `react` `^19.0.0` — component model and hooks (`useState`, `useEffect`, `useCallback`)
- `react-dom` `^19.0.0` — DOM renderer; entry point `src/main.jsx` calls `ReactDOM.createRoot`
- `eslint` `^9.21.0` — linting; flat config in `eslint.config.js`
- `eslint-plugin-react-hooks` `^5.1.0` — enforces Rules of Hooks
- `eslint-plugin-react-refresh` `^0.4.19` — warns on non-component exports that break HMR
- `globals` `^15.15.0` — browser global definitions for ESLint
- `@types/react` `^19.0.10`, `@types/react-dom` `^19.0.4` — TypeScript type definitions (present but TypeScript itself is not used)
## Configuration Files
| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build config — registers `@vitejs/plugin-react` |
| `tailwind.config.js` | Tailwind content paths, dark mode strategy (`class`) |
| `postcss.config.js` | PostCSS plugins for Tailwind + Autoprefixer |
| `eslint.config.js` | Flat ESLint config — JS/JSX, react-hooks, react-refresh rules |
| `index.html` | Vite entry HTML — mounts `<div id="root">`, loads `src/main.jsx` |
| `package.json` | Project manifest; scripts: `dev`, `build`, `lint`, `preview` |
## Build Commands
## Platform Requirements
- Node.js (version not pinned — no `.nvmrc` or `.node-version` file)
- npm (lockfile present)
- Static file hosting only — the `dist/` output is a fully static site with no server-side requirements
- No environment variables required at build time (all runtime config is hardcoded or user-provided)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Summary
## Naming Patterns
- React components: PascalCase `.jsx` — e.g., `TradeSetup.jsx`, `ResultsPanel.jsx`, `TakeProfitTargets.jsx`
- Hooks: camelCase prefixed with `use`, `.js` extension — e.g., `useCalculator.js`, `useBinanceAPI.js`
- Utilities: camelCase noun `.js` — e.g., `calculations.js`
- Services: camelCase noun `.js` — e.g., `binanceAPI.js`
- Constants: camelCase noun `.js` — e.g., `presets.js`
- Event handlers: `handle` prefix — e.g., `handleEntryPriceChange`, `handleTakeProfitPreset`, `handleStopLossPercentChange`
- Setters exposed from hooks: `set` prefix matching the state name — e.g., `setExchange`, `setTradeDirection`
- Utility functions: verb + noun — e.g., `formatNumber`, `safeDivide`, `parseFloatInput`, `formatHighPrecision`, `formatPrice`
- Async service functions: verb + noun — e.g., `fetchFuturesSymbols`, `fetchSymbolPrice`, `fetchMultiplePrices`
- Input string mirror: `[fieldName]Input` alongside the parsed numeric — e.g., `entryPriceInput` / `entryPrice`, `leverageInput` / `leverage`
- Boolean toggles: `use` prefix — e.g., `useStopLoss`, `useTrailingStop`, `autoPriceUpdate`
- Calculated results: descriptive — e.g., `weightedTakeProfit`, `grossLossAmount`, `effectiveMargin`
- SCREAMING_SNAKE_CASE — e.g., `EXCHANGE_FEES`, `LEVERAGE_PRESETS`, `DEFAULT_TAKE_PROFITS`, `MMR`
- No TypeScript; plain JavaScript with JSDoc-style comments where beneficial
## Input State Pattern
## Hook Patterns
- Owns all calculator state and all handler functions
- Returns a flat object of state + handlers (no nesting)
- `calculateAll()` is the single calculation entry point, triggered by a `useEffect` that lists all input dependencies explicitly
- The `eslint-disable-next-line react-hooks/exhaustive-deps` comment is intentional on the main `calculateAll` effect — do not remove it without careful review
- Uses `useCallback` for functions that are themselves listed as `useEffect` dependencies (`calculateTrailingStopTrigger`, `updateTPPriceFromPercent`, `updateSLPriceFromPercent`)
- The dependency array for the main calculation effect uses `JSON.stringify(...)` for the `takeProfits` array to avoid object reference instability
- Data-fetching hooks only — no calculation logic
- `usePriceUpdater` sets up a `setInterval` for live price polling (default 3000ms) and cleans up on unmount/symbol change
- Exposes a `status` string: `'connected' | 'connecting' | 'disconnected' | 'error'`
## Component Design
- Every component destructures its props explicitly in the function signature
- Exception: `<ResultsPanel {...calculatorState} />` in `BinanceFuturesCalculatorNew.jsx` — this is intentional to avoid a very long prop list, but it means `ResultsPanel` is tightly coupled to the `useCalculator` return shape
- No components compute derived values — all math happens in `useCalculator`
- Components only call handler functions passed as props
## Tailwind Usage
- Green (`green-600` / `dark:green-400`): profit, LONG active, connected status
- Red (`red-500` / `dark:red-400`): loss, invalid inputs, error state
- Amber (`amber-500` / `dark:amber-400`): warnings (margin exceeded)
- Blue (`blue-200`/`blue-700` etc.): informational callout boxes
- Yellow (`yellow-300`/`yellow-700` etc.): risk warning callouts
## Import Organization
## Code Style
- Section comments inside long functions use `// --- Section Name ---` format (see `useCalculator.js`)
- Inline clarification comments on non-obvious logic only
- No JSDoc on component functions; prop documentation is implicit from destructuring
## Module Design
- Components: single default export per file
- Hooks: named exports (`export const useCalculator = ...`)
- Utils/services/constants: named exports only, no default exports
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Summary
## Component Hierarchy
```
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| `BinanceFuturesCalculatorNew` | Orchestrates all state, stitches together price polling and calculator hooks, lays out the two-column grid | `src/BinanceFuturesCalculatorNew.jsx` |
| `TradeSetup` | Exchange selector, account size, symbol, leverage presets, trade direction, entry price field, auto/manual price toggle | `src/components/TradeSetup.jsx` |
| `SymbolSelector` | Searchable dropdown for Binance futures symbols; fetches symbol list itself via `useBinanceSymbols` | `src/components/SymbolSelector.jsx` |
| `TakeProfitTargets` | Up to 3 TP targets, each with price/percent dual input and quantity allocation | `src/components/TakeProfitTargets.jsx` |
| `StopLossConfig` | Fixed SL (price/percent dual input) and trailing stop loss (activation price, simulation price, callback percent) | `src/components/StopLossConfig.jsx` |
| `PositionSizing` | Toggles between fixed USDT margin mode and risk-percent mode | `src/components/PositionSizing.jsx` |
| `ResultsPanel` | Read-only output: position size, margin, quantity, fees, liquidation prices, profit/loss scenarios, trailing SL scenario | `src/components/ResultsPanel.jsx` |
## State Management
- `accountSizeInput` / `accountSize`
- `leverageInput` / `leverage`
- `entryPriceInput` / `entryPrice`
- `positionSizeUSDTInput` / `positionSizeUSDT`
- `riskPercentInput` / `riskPercent`
- `stopLossPriceInput` / `stopLossPrice`, `stopLossPercentInput` / `stopLossPercent`
- `trailingStop*Input` / `trailingStop*` (percent, activation price, simulation price)
- `takeProfits` array — each element carries both `priceInput`/`price` and `percentInput`/`percent`
- `exchange` — `'binance'` or `'bybit'`
- `tradeDirection` — `'LONG'` or `'SHORT'`
- `calculationMode` — `'fixed'` (margin USDT) or `'risk'` (risk percent of account)
- `useStopLoss`, `useTrailingStop`
- `autoPriceUpdate` — controls whether live API price overwrites `entryPrice`
- `quantity`, `effectiveMargin`, `totalPositionSize`
- `lossAmount`, `lossPercent`, `grossLossAmount`, `grossLossPercent`
- `weightedTakeProfit`, `weightedGrossTakeProfit`
- `liquidationPrice`, `realLiquidationPrice`
- `entryFee`, `exitFeeTP`, `exitFeeSL`, `exitFeeTrailingSL`, `totalFeesTP`, `totalFeesSL`, `totalFeesTrailingSL`
- `riskRewardRatio`, `grossRiskRewardRatio`
- Trailing stop calculated values: `trailingStopTriggerPrice`, `trailingStopLossAmount`, `trailingStopProfit`, etc.
- `lastUpdated` — tracks whether each TP and the SL was last set by `'price'` or `'percent'`, used to determine which field to recalculate when `entryPrice` changes.
## Data Flow
### Live Price → Entry Price
```
```
### User Input → Calculation
```
```
### Symbol List → SymbolSelector
```
```
## Auto / Manual Price Toggle Pattern
```js
```
## TP/SL Dual-Input Sync Pattern
- If `lastUpdated.tp[i] === 'percent'`, recompute price from percent.
- If `lastUpdated.sl === 'percent'`, recompute SL price from percent.
- If last set by `'price'`, the price field is stable and is not overwritten.
## Calculation Engine
## Error Handling
## Anti-Patterns
### Stale Dependency Suppression
### Props Spread on ResultsPanel
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
