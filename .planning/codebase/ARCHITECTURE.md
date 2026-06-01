# Architecture
_Generated: 2026-06-01_

## Summary
This is a single-page React application for calculating futures trade risk/reward, position sizing, and fee projections. All application state lives in a single `useCalculator` hook, which is consumed by a root orchestrator component (`BinanceFuturesCalculatorNew`) that fans state and handlers down to five pure presentational components. Live price data is fetched from the Binance Futures REST API via a dedicated polling hook and merged into calculator state when auto-price mode is enabled.

---

## Component Hierarchy

```
src/main.jsx
└── src/App.jsx
    └── src/BinanceFuturesCalculatorNew.jsx   (orchestrator)
        ├── hooks/useCalculator.js             (all state + calculation logic)
        ├── hooks/useBinanceAPI.js → usePriceUpdater()
        │
        ├── components/TradeSetup.jsx          (left column)
        │   └── components/SymbolSelector.jsx  (uses useBinanceSymbols internally)
        ├── components/TakeProfitTargets.jsx   (left column)
        ├── components/StopLossConfig.jsx      (left column)
        ├── components/PositionSizing.jsx      (left column)
        └── components/ResultsPanel.jsx        (right column, spread props)
```

The layout is a two-column CSS grid (`md:grid-cols-2`). The left column holds all input components stacked vertically. The right column is entirely `ResultsPanel`, which receives the full `calculatorState` object spread as props (`{...calculatorState}`).

---

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

---

## State Management

All mutable state is owned by `useCalculator` (`src/hooks/useCalculator.js`). The hook returns a flat object of ~60 values (state, derived state, and handlers). No external state library is used.

**Input state (raw string + parsed numeric pairs):**
- `accountSizeInput` / `accountSize`
- `leverageInput` / `leverage`
- `entryPriceInput` / `entryPrice`
- `positionSizeUSDTInput` / `positionSizeUSDT`
- `riskPercentInput` / `riskPercent`
- `stopLossPriceInput` / `stopLossPrice`, `stopLossPercentInput` / `stopLossPercent`
- `trailingStop*Input` / `trailingStop*` (percent, activation price, simulation price)
- `takeProfits` array — each element carries both `priceInput`/`price` and `percentInput`/`percent`

**Mode/flag state:**
- `exchange` — `'binance'` or `'bybit'`
- `tradeDirection` — `'LONG'` or `'SHORT'`
- `calculationMode` — `'fixed'` (margin USDT) or `'risk'` (risk percent of account)
- `useStopLoss`, `useTrailingStop`
- `autoPriceUpdate` — controls whether live API price overwrites `entryPrice`

**Calculated/derived state** (set inside `calculateAll()`, triggered by a `useEffect` on all inputs):
- `quantity`, `effectiveMargin`, `totalPositionSize`
- `lossAmount`, `lossPercent`, `grossLossAmount`, `grossLossPercent`
- `weightedTakeProfit`, `weightedGrossTakeProfit`
- `liquidationPrice`, `realLiquidationPrice`
- `entryFee`, `exitFeeTP`, `exitFeeSL`, `exitFeeTrailingSL`, `totalFeesTP`, `totalFeesSL`, `totalFeesTrailingSL`
- `riskRewardRatio`, `grossRiskRewardRatio`
- Trailing stop calculated values: `trailingStopTriggerPrice`, `trailingStopLossAmount`, `trailingStopProfit`, etc.

**TP/SL sync state:**
- `lastUpdated` — tracks whether each TP and the SL was last set by `'price'` or `'percent'`, used to determine which field to recalculate when `entryPrice` changes.

---

## Data Flow

### Live Price → Entry Price

```
Binance REST API (fapi.binance.com/fapi/v1/ticker/price)
    ↓ polled every 3 000 ms
usePriceUpdater(symbol, 3000)   [src/hooks/useBinanceAPI.js]
    ↓ returns { price, loading, status }
BinanceFuturesCalculatorNew.jsx
    ↓ useEffect: if autoPriceUpdate && price !== entryPrice
calculatorState.handleEntryPriceChange(price.toString())
    ↓
useCalculator → setEntryPriceInput / setEntryPrice
    ↓ triggers calculateAll() effect
All downstream calculated state updated
```

### User Input → Calculation

```
User types in any input field
    ↓ calls handler (e.g., handleStopLossPriceChange)
useCalculator: sets both raw input string AND parsed numeric state
    ↓ useEffect dependency array detects change
calculateAll() runs synchronously within the effect
    ↓
Calculated state values updated via setState calls
    ↓
ResultsPanel re-renders with new values
```

### Symbol List → SymbolSelector

```
SymbolSelector mounts
    ↓ useBinanceSymbols() [src/hooks/useBinanceAPI.js]
fetchFuturesSymbols() [src/services/binanceAPI.js]
    ↓ GET /fapi/v1/exchangeInfo
Filters TRADING + USDT pairs, sorts PERPETUAL first
    ↓
Dropdown displays up to 50 filtered results by search term
    ↓ user selects
setSymbol(selectedSymbol) → bubbles to useCalculator.symbol
    ↓ usePriceUpdater re-subscribes to new symbol
```

---

## Auto / Manual Price Toggle Pattern

`autoPriceUpdate` (boolean, default `true`) is owned by `useCalculator` and exposed as state + setter.

The toggle button lives in `TradeSetup` (`src/components/TradeSetup.jsx`, line 162). It calls `setAutoPriceUpdate(!autoPriceUpdate)` and renders `'🔄 Auto'` or `'✋ Manual'` accordingly.

The enforcement logic lives in the orchestrator (`src/BinanceFuturesCalculatorNew.jsx`, lines 15–18):

```js
useEffect(() => {
  if (calculatorState.autoPriceUpdate && currentPrice && currentPrice !== calculatorState.entryPrice) {
    calculatorState.handleEntryPriceChange(currentPrice.toString())
  }
}, [currentPrice, calculatorState.autoPriceUpdate, calculatorState.entryPrice, calculatorState.handleEntryPriceChange])
```

When `autoPriceUpdate` is `false`, the effect fires but the condition fails silently — the user's manually entered price is preserved. The entry price input field remains fully editable in both modes.

---

## TP/SL Dual-Input Sync Pattern

Each TP target and the SL can be specified by either price or percent. A `lastUpdated` tracker records which was set last (`'price'` or `'percent'`). When `entryPrice` or `tradeDirection` changes, a `useEffect` in `useCalculator` (line 618–643) recalculates whichever field was NOT the last-set one:

- If `lastUpdated.tp[i] === 'percent'`, recompute price from percent.
- If `lastUpdated.sl === 'percent'`, recompute SL price from percent.
- If last set by `'price'`, the price field is stable and is not overwritten.

---

## Calculation Engine

`calculateAll()` (`src/hooks/useCalculator.js`, line 386) runs as a single synchronous function triggered by a `useEffect` whenever any input state changes. It is NOT memoised — it re-runs on every relevant state change and calls multiple `setState` setters in sequence. Key calculation steps:

1. Determine effective calculation mode (`'risk'` falls back to `'fixed'` if SL is invalid)
2. Compute quantity, margin, position size
3. Apply exchange fee rates from `EXCHANGE_FEES` (`src/constants/presets.js`) — entry uses taker rate, TP exit uses maker rate, SL exit uses taker rate
4. Calculate per-TP profit (gross and net), fee portions, weighted combined profit
5. Calculate SL gross/net loss
6. Calculate trailing stop trigger price (via separate `calculateTrailingStopTrigger` `useCallback`)
7. Calculate trailing stop P&L from simulation price
8. Calculate liquidation price (standard: margin-based) and real liquidation price (cross-margin: account-balance-based), using `MMR = 0.005` from `src/constants/presets.js`
9. Set all calculated state values

---

## Error Handling

There is no error boundary. The `usePriceUpdater` and `useBinanceSymbols` hooks catch fetch errors internally via try/catch and expose an `error` string and `status` field. Price fetch errors are surfaced via the status indicator dot in `TradeSetup`. Calculation errors are guarded via `safeDivide` (`src/utils/calculations.js`) which returns `0` on divide-by-zero or NaN.

---

## Anti-Patterns

### Stale Dependency Suppression

**What happens:** `calculateAll()` is called inside a `useEffect` with `// eslint-disable-next-line react-hooks/exhaustive-deps` (line 600) and a manually curated dependency array that does not include all referenced state.

**Why it's wrong:** If a referenced value changes but is not in the dependency array, the effect will use a stale closure value.

**Do this instead:** Extract `calculateAll` into a `useCallback` with all dependencies, or restructure so inputs are derived rather than spread across many useState calls.

### Props Spread on ResultsPanel

**What happens:** `<ResultsPanel {...calculatorState} />` (`src/BinanceFuturesCalculatorNew.jsx`, line 101) passes the entire hook return object as props.

**Why it's wrong:** Every state change in `useCalculator` triggers a full re-render of `ResultsPanel`, even if the changed field is not used by the panel. It also makes the interface opaque.

**Do this instead:** Pass only the specific values `ResultsPanel` needs.

---

*Architecture analysis: 2026-06-01*
