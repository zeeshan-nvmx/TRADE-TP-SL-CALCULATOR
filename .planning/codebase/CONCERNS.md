# Codebase Concerns

_Generated: 2026-06-01_

## Summary

The core calculation logic is solid and well-structured, but there are three confirmed logic bugs affecting fee accuracy, one UX inconsistency with the auto-price feature, and several preset/default values that assume large account sizes. There is zero test coverage, meaning any calculation fix can silently introduce regressions. The legacy `BinanceFuturesCalculator.jsx` file at the root of `src/` adds noise and risk of accidental use.

---

## Known Bugs

### TP Exit Fee Uses Maker Rate Instead of Taker

**Symptoms:** Net profit after TP is slightly overstated for standard market-order workflows. The Fees panel labels the exit fee column "Exit Fee (Est.)" which masks the mismatch.

**Files:** `src/hooks/useCalculator.js` line 444, line 466–468

**Details:** The fee rates are assigned at lines 443–446:
```js
const entryFeeRate = fees.taker   // correct — entries are always market (taker)
const tpFeeRate = fees.maker      // BUG — TP limit orders do use maker, but only if they rest as limit orders
const slFeeRate = fees.taker      // correct
const trailingSlFeeRate = fees.taker  // correct
```
Then at line 466:
```js
const exitFeeRateForTP = isProfitTarget ? tpFeeRate : slFeeRate
// = maker rate when TP is in profit
```
The issue: on Binance Futures, a standard Take Profit order placed as a Limit order at the target price does fill as a maker (0.02%). However, a Take Profit Market order or a TP that triggers and immediately fills at market is a taker (0.04%). Since most users set TP as market or the order can fill as taker in fast markets, using maker consistently understates fees. The correct conservative default is taker for all exits. The rate should be `fees.taker` for TP exits unless a separate "Limit TP" mode is introduced.

**Fix approach:** In `src/hooks/useCalculator.js`, change line 444:
```js
// Change:
const tpFeeRate = fees.maker
// To:
const tpFeeRate = fees.taker
```
If a future "Limit TP" mode is desired, add a `tpOrderType` state (`'limit' | 'market'`) and conditionally select the rate.

---

## Tech Debt

### Auto-Price Feature Only Wires to Entry Price

**Issue:** The live price auto-update (`usePriceUpdater` + `autoPriceUpdate` toggle) feeds only `entryPriceInput` in `BinanceFuturesCalculatorNew.jsx` (lines 15–18). TP prices and SL price are not auto-populated from the live price — they must be set manually or via the % fields.

**Files:** `src/BinanceFuturesCalculatorNew.jsx` lines 15–18, `src/components/TradeSetup.jsx`

**Impact:** When the user opens the calculator, the entry price updates live (if Auto is on), but TP targets and SL price remain at their default/hardcoded values (`85880`, `84551` from `src/constants/presets.js`). The TP and SL % fields do recalculate from the new entry price via the `useEffect` at line 618–643 of `useCalculator.js`, so the relative distance is preserved — but the absolute default prices are stale on first load.

**Fix approach:** The `useEffect` in `useCalculator.js` at line 618–643 already handles recomputing TP/SL prices from percent when entry price changes. The main gap is the initial hardcoded defaults in `src/constants/presets.js`. Options:
1. Remove hardcoded price defaults from `DEFAULT_TAKE_PROFITS` and rely solely on percent-based calculation from the live entry price on mount
2. Add an "Auto TP" toggle similar to the entry price toggle, which sets TP price from the current live price + percent offset

### Position Sizing Presets Start at 100 USDT

**Issue:** `FIXED_USDT_PRESETS` in `src/constants/presets.js` line 18 starts at 100 as the minimum:
```js
export const FIXED_USDT_PRESETS = [
  100, 200, 250, 300, 400, 500, ...
]
```
The default `positionSizeUSDTInput` in `useCalculator.js` line 45 is also `'100'`.

**Impact:** Users with small accounts (under 500 USDT) or who want to test with small positions (20, 50 USDT) have no preset buttons and must type manually. The 100 USDT default with 50x leverage produces a 5,000 USDT position — this is reasonable for mid-sized accounts but large for beginners.

**Fix approach:** Add smaller presets to `src/constants/presets.js`:
```js
export const FIXED_USDT_PRESETS = [
  20, 50, 100, 200, 250, 300, 400, 500, ...
]
```
Optionally change the default `positionSizeUSDTInput` from `'100'` to `'50'` in `useCalculator.js` line 45.

### Default Margin Is 100 USDT (Hardcoded in Two Places)

**Issue:** The default position size is set to `'100'` in `useCalculator.js` line 45–46:
```js
const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('100')
const [positionSizeUSDT, setPositionSizeUSDT] = useState(100)
```
This is also the first value in `FIXED_USDT_PRESETS`. The default is consistent but should be driven from a single constant to avoid drift.

**Fix approach:** Export a `DEFAULT_POSITION_SIZE` constant from `src/constants/presets.js` and use it in both `useCalculator.js` and `FIXED_USDT_PRESETS` where applicable.

### Legacy `BinanceFuturesCalculator.jsx` in `src/` Root

**Issue:** Two legacy files remain at `src/BinanceFuturesCalculator.jsx` and `src/BinanceFuturesCalculatorSL.jsx` (deleted in working tree per git status, but the non-SL version is still present on disk). These are the pre-refactor monolithic components and are not imported anywhere in the current build.

**Files:** `src/BinanceFuturesCalculator.jsx` (present on disk, not imported)

**Risk:** Any future developer may confuse this with the active component (`BinanceFuturesCalculatorNew.jsx`), or accidentally re-introduce it. The `New` suffix on the active component is a temporary naming artifact that should be cleaned up.

**Fix approach:**
1. Delete `src/BinanceFuturesCalculator.jsx`
2. Rename `src/BinanceFuturesCalculatorNew.jsx` → `src/BinanceFuturesCalculator.jsx`
3. Update the import in `src/App.jsx`

---

## Test Coverage Gaps

**Entire codebase:**
- What's not tested: everything — no test runner exists
- Files: `src/utils/calculations.js`, `src/hooks/useCalculator.js`, `src/services/binanceAPI.js`
- Risk: Fee rate corrections, formula changes, and preset changes can all silently produce wrong output
- Priority: High — especially for `calculateAll` and the four utility functions in `calculations.js`

See `TESTING.md` for the full test gap analysis and recommended setup.

---

## Security Considerations

**Binance API calls are unauthenticated:**
- Risk: None for current read-only usage (public ticker/exchange info endpoints). No API keys are used or stored.
- Files: `src/services/binanceAPI.js`
- Current mitigation: Only public REST endpoints are called (`/fapi/v1/ticker/price`, `/fapi/v1/exchangeInfo`)

**No `.env` file present:** The hardcoded `BINANCE_API_BASE = 'https://fapi.binance.com/fapi/v1'` in `src/services/binanceAPI.js` is fine for a public API with no auth.

---

## Performance Considerations

**`JSON.stringify` in a `useEffect` dependency array:**
- File: `src/hooks/useCalculator.js` line 615
- Code: `JSON.stringify(takeProfits.map((tp) => ({ enabled: tp.enabled, quantity: tp.quantity, price: tp.price, percent: tp.percent })))`
- Issue: This runs on every render to produce the dependency string. For 3 TP objects it is negligible, but it is an unusual pattern that defeats the normal reference-equality optimization of React effects.
- Impact: Low at current scale (3 TPs). Would matter if TP count scaled to 10+.
- Fix approach: Use a dedicated `useMemo` to produce a stable serialized key, or restructure so each TP's relevant numeric values are in flat state.

**Live price polling at 3-second intervals:**
- File: `src/hooks/useBinanceAPI.js` line 73, `src/BinanceFuturesCalculatorNew.jsx` line 12
- Every price update triggers `handleEntryPriceChange` if `autoPriceUpdate` is true, which updates `entryPrice` state, which fires the entire `calculateAll` effect chain.
- Impact: ~20 state updates per minute while Auto mode is on. Acceptable but worth noting if more complex calculations are added.

---

## Missing Critical Features

**No persistence (localStorage/URL):**
- Problem: All inputs reset on page refresh. Users cannot bookmark or share a specific trade configuration.
- Blocks: Sharing calculated setups with others

**No export/copy functionality:**
- Problem: There is no way to copy the calculation results as text or export them.
- Blocks: Use in trading workflows where users want to paste setup details into a trade log

**Bybit exchange selected but still calls Binance API:**
- Files: `src/hooks/useBinanceAPI.js`, `src/services/binanceAPI.js`
- When `exchange` is set to `'bybit'` via the toggle in `TradeSetup`, the fee rates correctly switch to Bybit values, but the symbol list and live price still come from Binance Futures API (`fapi.binance.com`). Bybit symbols and prices are never fetched.
- Impact: Users selecting Bybit get Binance price data with Bybit fee math — a silent mismatch.
- Fix approach: Add a Bybit API service (`src/services/bybitAPI.js`) and conditionally use it in `useBinanceAPI.js` (or create a `useExchangeAPI.js` hook) based on the `exchange` state.

---

*Concerns audit: 2026-06-01*
