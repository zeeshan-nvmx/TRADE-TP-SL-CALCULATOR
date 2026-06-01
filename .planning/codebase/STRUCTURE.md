# Codebase Structure
_Generated: 2026-06-01_

## Summary
The project is a Vite + React SPA with a flat `src/` tree organized by role: `components/`, `hooks/`, `services/`, `constants/`, and `utils/`. There is no routing — the single page renders one calculator component. The legacy monolithic component (`BinanceFuturesCalculator.jsx`) is kept alongside the refactored version for reference but is not mounted.

---

## Directory Layout

```
TRADE-TP-SL-CALCULATOR/
├── public/
│   └── vite.svg                    # Static asset
├── src/
│   ├── main.jsx                    # Vite entry, mounts <App /> into #root
│   ├── App.jsx                     # Root component — renders BinanceFuturesCalculatorNew only
│   ├── index.css                   # Tailwind base directives
│   ├── assets/
│   │   └── react.svg               # Vite scaffold asset (unused)
│   ├── BinanceFuturesCalculatorNew.jsx   # Active main component (orchestrator)
│   ├── BinanceFuturesCalculator.jsx      # Legacy monolithic component (not rendered, reference only)
│   ├── components/
│   │   ├── TradeSetup.jsx          # Exchange, account size, symbol, leverage, direction, entry price
│   │   ├── SymbolSelector.jsx      # Searchable dropdown for Binance futures symbols
│   │   ├── TakeProfitTargets.jsx   # Up to 3 TP targets with price/percent/quantity inputs
│   │   ├── StopLossConfig.jsx      # Fixed SL + trailing stop loss configuration
│   │   ├── PositionSizing.jsx      # Fixed margin vs. risk-percent mode toggle + inputs
│   │   └── ResultsPanel.jsx        # All read-only calculated outputs
│   ├── hooks/
│   │   ├── useCalculator.js        # All calculator state, handlers, and calculation engine
│   │   └── useBinanceAPI.js        # usePriceUpdater (polling) + useBinanceSymbols (one-shot)
│   ├── services/
│   │   └── binanceAPI.js           # Raw fetch functions for Binance fapi.binance.com REST API
│   ├── constants/
│   │   └── presets.js              # Fee rates, preset arrays, DEFAULT_TAKE_PROFITS, MMR constant
│   └── utils/
│       └── calculations.js         # Pure math helpers: safeDivide, parseFloatInput, formatNumber, formatPrice
├── index.html                      # Vite HTML shell
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS (for Tailwind)
├── eslint.config.js                # ESLint flat config
├── package.json                    # Dependencies and scripts
└── package-lock.json               # Lockfile
```

---

## Entry Points

**DOM mount:** `src/main.jsx` — calls `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`.

**App root:** `src/App.jsx` — imports and renders `<BinanceFuturesCalculatorNew />` directly, nothing else.

**Active calculator:** `src/BinanceFuturesCalculatorNew.jsx` — the orchestrator that wires hooks to components.

---

## Key File Details

### `src/BinanceFuturesCalculatorNew.jsx`
The only stateful component. Calls `useCalculator()` and `usePriceUpdater(symbol, 3000)`. Bridges live price into calculator state via a `useEffect`. Renders the two-column grid layout. All other components are stateless/controlled.

### `src/hooks/useCalculator.js`
~741 lines. The entire application logic lives here: state declarations, input handlers (each sets both a raw string input and a parsed numeric value), the `calculateAll()` engine, three `useEffect`s for recalculation and TP/SL price-percent sync, and `redistributeTPQuantities()` for automatic TP quantity balancing. Returns a flat object consumed by the orchestrator.

### `src/hooks/useBinanceAPI.js`
Exports two hooks:
- `usePriceUpdater(symbol, intervalMs)` — polls `fetchSymbolPrice` on an interval, exposes `{ price, loading, status, error, refetch }`. Status values: `'connected'`, `'connecting'`, `'disconnected'`, `'error'`.
- `useBinanceSymbols()` — one-shot fetch of all USDT futures symbols, exposes `{ symbols, loading, error }`. Used internally by `SymbolSelector`.

### `src/services/binanceAPI.js`
Three plain async functions (no class, no singleton):
- `fetchFuturesSymbols()` — GET `/fapi/v1/exchangeInfo`, returns filtered + sorted symbol array
- `fetchSymbolPrice(symbol)` — GET `/fapi/v1/ticker/price?symbol=`, returns `{ symbol, price, timestamp }`
- `fetchMultiplePrices(symbols)` — batch price fetch (not currently used in the UI)

Base URL: `https://fapi.binance.com/fapi/v1`

### `src/constants/presets.js`
Single source of truth for:
- `EXCHANGE_FEES` — `{ binance: { maker: 0.0002, taker: 0.0004 }, bybit: { maker: 0.0001, taker: 0.0006 } }`
- `MMR` — `0.005` (Maintenance Margin Rate used for liquidation price formula)
- Preset arrays: `LEVERAGE_PRESETS`, `TP_PERCENT_PRESETS`, `SL_PERCENT_PRESETS`, `TRAILING_STOP_PERCENT_PRESETS`, `RISK_PERCENT_PRESETS`, `FIXED_USDT_PRESETS`
- `DEFAULT_TAKE_PROFITS` — initial state for the TP array (3 entries)

### `src/utils/calculations.js`
Four pure utility functions, no side effects:
- `safeDivide(num, denom)` — returns `0` on zero/NaN/Infinity denominator
- `parseFloatInput(value)` — returns `null` for empty/invalid strings, `parseFloat` otherwise
- `formatNumber(num, decimals=2)` — formats to fixed decimals, handles NaN/Infinity → `'N/A'`
- `formatHighPrecision(num, decimals=6)` — same but auto-escalates to 8 decimals for sub-0.0001 values
- `formatPrice(num)` — adaptive decimal display (2 for >100, 4 for >1, 6 for <1)

### `src/BinanceFuturesCalculator.jsx`
Legacy monolithic version. Not imported by `App.jsx` and not rendered. Kept for historical reference. Can be deleted when no longer needed.

---

## Naming Conventions

**Files:** PascalCase for components and the main calculator file (`TradeSetup.jsx`, `ResultsPanel.jsx`). camelCase for hooks (`useCalculator.js`), services (`binanceAPI.js`), constants (`presets.js`), and utils (`calculations.js`).

**Hooks:** `use` prefix, camelCase (`useCalculator`, `usePriceUpdater`, `useBinanceSymbols`).

**Constants:** SCREAMING_SNAKE_CASE for exported constants (`EXCHANGE_FEES`, `MMR`, `DEFAULT_TAKE_PROFITS`).

**Handlers:** `handle` prefix for event/input handlers (`handleEntryPriceChange`, `handleStopLossPreset`).

---

## Where to Add New Code

**New input section (e.g., a new config panel):**
- Create `src/components/MyNewPanel.jsx`
- Add props to the handler/state cluster in `src/hooks/useCalculator.js`
- Wire it in `src/BinanceFuturesCalculatorNew.jsx` (left column `<div className='space-y-4'>`)

**New calculation output:**
- Add state and computation to `calculateAll()` in `src/hooks/useCalculator.js`
- Add the new value to the return object at the bottom of `useCalculator`
- Display in `src/components/ResultsPanel.jsx` (add to destructured props list)

**New exchange fee support:**
- Add entry to `EXCHANGE_FEES` in `src/constants/presets.js`
- Add toggle button in `src/components/TradeSetup.jsx` (exchange selector section)

**New preset array:**
- Add to `src/constants/presets.js`, import in the relevant component

**New API call:**
- Add fetch function to `src/services/binanceAPI.js`
- Wrap with a hook in `src/hooks/useBinanceAPI.js` if polling/lifecycle is needed

**New utility function:**
- Add to `src/utils/calculations.js` if it is a pure number transformation with no React dependencies

---

## Special Directories

**`public/`:**
- Purpose: Static files served at root, not processed by Vite bundler
- Generated: No
- Committed: Yes

**`src/assets/`:**
- Purpose: Vite scaffold SVG asset, effectively unused in this project
- Generated: No (scaffold remnant)
- Committed: Yes

---

*Structure analysis: 2026-06-01*
