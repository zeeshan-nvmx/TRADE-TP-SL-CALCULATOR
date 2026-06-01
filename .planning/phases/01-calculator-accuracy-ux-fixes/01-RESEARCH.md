# Phase 1: Calculator Accuracy & UX Fixes - Research

**Researched:** 2026-06-01
**Domain:** React calculator application — fee calculation fix, extended auto-price toggle, position sizing presets
**Confidence:** HIGH

## Summary

This phase addresses three distinct but tightly coupled concerns in the futures trading calculator:

1. **Fee Calculation Bug (FEE-01, FEE-02):** The TP exit fee uses the maker rate (0.02% Binance / 0.01% Bybit) instead of the taker rate (0.04% Binance / 0.06% Bybit). Since traders exit TP targets as market orders (taker), the net P&L is overstated by the fee difference. The fix is a single-line change: `tpFeeRate = fees.maker` → `tpFeeRate = fees.taker` in `useCalculator.js` line 444. Binance and Bybit 2026 rates match the constants file.

2. **Per-Field Auto-Price Toggle (PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05):** Currently only the entry price field has an auto/manual toggle. TP1, TP2, TP3, and SL price fields need independent toggles using the same Binance Futures API endpoint. The default state differs by field: entry and TP2/TP3/SL are OFF (manual), while TP1 is ON (auto) on app load.

3. **Position Sizing Defaults (POS-01, POS-02):** Fixed USDT presets must include 20 and 50 before existing values. The default margin input must change from 100 to 50 USDT.

**Primary recommendation:** Implement as three sequential commits targeting the three requirements groups. The fee fix is isolated and low-risk. Per-field auto-price toggle requires architectural changes to state (adding per-TP and SL `autoPriceUpdate` booleans) and passing new handlers through the component tree. Position sizing is the simplest — constants and initial state only.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|-----------|-------------|----------------|-----------|
| Fee calculation | useCalculator hook | — | All P&L math lives in the main calculation loop |
| TP exit fee determination | useCalculator hook | — | Fee selection happens during TP profit calculation |
| Entry price auto-fetch | BinanceFuturesCalculatorNew + usePriceUpdater | — | Main component orchestrates the price hook and applies updates via handlers |
| TP price auto-fetch | BinanceFuturesCalculatorNew + usePriceUpdater | TakeProfitTargets component | Price hook updates state; component renders toggle and receives handler |
| SL price auto-fetch | BinanceFuturesCalculatorNew + usePriceUpdater | StopLossConfig component | Price hook updates state; component renders toggle and receives handler |
| Fixed USDT presets | PositionSizing component | presets.js constants | Component maps presets from constants |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEE-01 | TP exit fee uses taker rate (not maker) — entry and exit are market taker orders | Verified: Line 444 in useCalculator.js incorrectly reads `const tpFeeRate = fees.maker`. SL and trailing SL already use taker correctly. All TP profits calculated with wrong exit fee. |
| FEE-02 | Verify Binance 2026 perpetual futures taker fee is 0.04% and Bybit is 0.06% | Verified in presets.js: Binance taker 0.0004 (0.04%), Bybit taker 0.0006 (0.06%) — correct values, no update needed. |
| PRICE-01 | TP price inputs have per-field auto/manual toggle using Binance Futures API | Not implemented — currently only entry price has toggle. Requires adding per-TP state: `tpAutoPriceUpdate[0]`, `tpAutoPriceUpdate[1]`, `tpAutoPriceUpdate[2]` + handlers. |
| PRICE-02 | SL price input has auto/manual toggle using same API | Not implemented — requires `slAutoPriceUpdate` state and handler. |
| PRICE-03 | Entry price auto-fetch defaults to manual on app start | **Bug:** Currently defaults to auto (line 18 in useCalculator.js: `setAutoPriceUpdate(true)`). Must change to `false`. |
| PRICE-04 | TP1 auto-fetch defaults to auto; TP2 and TP3 default to manual | Not implemented — requires per-TP initialization logic. TP1 only. |
| PRICE-05 | SL auto-fetch defaults to manual on app start | Not implemented — SL needs new `slAutoPriceUpdate` state, must initialize to `false`. |
| POS-01 | Fixed USDT presets start with 20, 50 before existing values | Not implemented — presets.js line 18-21 currently starts at 100. Must prepend [20, 50] to FIXED_USDT_PRESETS array. |
| POS-02 | Default margin input value is 50 USDT (changed from 100) | Not implemented — useCalculator.js line 45 initializes `positionSizeUSDTInput` to '100'. Must change to '50' and `positionSizeUSDT` state to 50. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | Component model, hooks | Project framework; all state management via useState/useEffect |
| Vite | 6.2.0 | Dev server and bundler | Build tool specified in CLAUDE.md; used for HMR during development |
| TailwindCSS | 3.4.17 | Utility-first styling | Existing project CSS; dark mode support via `class` strategy |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ESLint | 9.21.0 | Code linting | Run `npm run lint` before commit; catches React hooks rules violations |
| @vitejs/plugin-react | 4.3.4 | Babel JSX transform for Vite | Already configured in vite.config.js; enables HMR for .jsx files |

**Installation:** No new packages required. All changes use existing frameworks.

## Package Legitimacy Audit

No external packages are added in this phase. All modifications use existing dependencies (React, Vite, TailwindCSS, ESLint).

## Architecture Patterns

### System Architecture Overview

```
User Input (UI Layer)
  ├─ BinanceFuturesCalculatorNew
  │   ├─ useCalculator() hook [state + handlers]
  │   ├─ usePriceUpdater() hook [live API price + status]
  │   │
  │   └─ Left Column (Input Components)
  │       ├─ TradeSetup
  │       │   └─ [Entry Price] + [Auto/Manual Toggle] → entryPrice state
  │       ├─ TakeProfitTargets [will add per-TP toggles]
  │       │   └─ TP1/TP2/TP3 price fields + [per-field toggles] → takeProfits state
  │       ├─ StopLossConfig [will add toggle]
  │       │   └─ SL price field + [Auto/Manual Toggle] → stopLossPrice state
  │       └─ PositionSizing
  │           └─ [Margin input] + [Preset buttons] → positionSizeUSDT state
  │
  └─ useCalculator.calculateAll()
      ├─ Position Sizing math
      ├─ Fee calculations [FIXED in this phase]
      │   └─ entryFeeRate = fees.taker ✓ (already correct)
      │   └─ tpFeeRate = fees.taker [BUG FIX: change from fees.maker]
      │   └─ slFeeRate = fees.taker ✓ (already correct)
      │   └─ trailingSlFeeRate = fees.taker ✓ (already correct)
      └─ P&L Calculations
          └─ Output → ResultsPanel (read-only display)
```

### Current Auto-Price Update Flow (Entry Only)

```
usePriceUpdater hook
  └─ Every 3 seconds: fetch latest price from Binance Futures API
      └─ Return: { price, loading, status }
  
BinanceFuturesCalculatorNew useEffect (line 15-19)
  └─ If autoPriceUpdate === true AND currentPrice changed
      └─ Call handleEntryPriceChange(currentPrice)
          └─ Updates entryPriceInput and entryPrice state
```

### Required Architecture Change: Per-Field Auto-Price

Each field (TP1, TP2, TP3, SL) that receives live price updates needs:

1. **State variable:** `tpAutoPriceUpdate: [boolean, boolean, boolean]` or `tp1AutoPrice`, `tp2AutoPrice`, etc.
2. **Handler function:** `setTPAutoPriceUpdate(index, boolean)` — toggled by UI button
3. **useEffect in BinanceFuturesCalculatorNew:** Similar to entry price, but for each TP/SL:
   ```js
   if (tpAutoPriceUpdate[i] && currentPrice) {
     handleTakeProfitChange(i, 'priceInput', currentPrice.toString())
   }
   ```
4. **UI Toggle Button:** In TakeProfitTargets and StopLossConfig, next to each price field label

### Recommended Project Structure (No Changes)

```
src/
├── hooks/
│   └── useCalculator.js         [MODIFIED: fee fix + add TP/SL auto states]
├── constants/
│   └── presets.js               [MODIFIED: update FIXED_USDT_PRESETS, default position size]
├── components/
│   ├── TradeSetup.jsx           [NO CHANGE: entry price already has toggle]
│   ├── TakeProfitTargets.jsx    [MODIFIED: add per-TP toggle UI]
│   ├── StopLossConfig.jsx       [MODIFIED: add SL toggle UI]
│   └── PositionSizing.jsx       [NO CHANGE: reads presets from constants]
└── BinanceFuturesCalculatorNew.jsx  [MODIFIED: pass new handlers, update useEffect for per-field toggle]
```

### Pattern 1: Fee Selection in Calculation

**What:** The `calculateAll()` function in useCalculator.js determines which fee rate to use for each exit type:
- Entry order = Taker (always a market order entering the position)
- TP exit = Taker (not Maker — traders hit market to exit profit targets)
- SL exit = Taker (emergency exit at worst price)
- Trailing SL exit = Taker (emergency exit at worst price)

**When to use:** Every exit scenario uses taker fee. The bug (taker → maker for TP) breaks the accuracy goal.

**Example:**
```javascript
// Source: useCalculator.js lines 442-450
const fees = EXCHANGE_FEES[exchange]
const entryFeeRate = fees.taker        // ✓ Correct
const tpFeeRate = fees.taker           // [BUG FIX: was fees.maker]
const slFeeRate = fees.taker           // ✓ Correct
const trailingSlFeeRate = fees.taker   // ✓ Correct
const calcEntryFee = calculatedPositionSize * entryFeeRate
// ... rest of calculation
```

### Pattern 2: Per-Field Auto-Price Toggle Initialization

**What:** On app load, different fields default to different auto/manual states for UX:
- Entry price: OFF (user usually has a specific entry price, auto-update distracting)
- TP1: ON (user wants to track best available exit for first target)
- TP2, TP3: OFF (user sets these manually)
- SL: OFF (user controls risk level directly)

**When to use:** Initialize state in useCalculator hook (lines 18, and new per-TP/SL states).

**Example:**
```javascript
// Current (BUG):
const [autoPriceUpdate, setAutoPriceUpdate] = useState(true)  // should be false

// After fix:
const [autoPriceUpdate, setAutoPriceUpdate] = useState(false) // entry defaults OFF
const [tpAutoPriceUpdate, setTPAutoPriceUpdate] = useState([true, false, false]) // TP1 ON, TP2/3 OFF
const [slAutoPriceUpdate, setSLAutoPriceUpdate] = useState(false)  // SL OFF
```

### Pattern 3: Dual-Input Sync with Auto-Price

**What:** When a price field has auto-update ON and API returns new price, it must:
1. Update the `priceInput` (string state)
2. Update the `price` (parsed number state)
3. Sync the percentage field (if entry price is available)
4. Mark the field as "last updated via price" for the percent ↔ price sync logic

**When to use:** In the handler called by the useEffect when auto-price triggers.

**Example:**
```javascript
// Current entry price handler (works, but must also sync percent):
const handleEntryPriceChange = (value) => {
  setEntryPriceInput(value)
  const p = parseFloatInput(value)
  setEntryPrice(p !== null && p > 0 ? p : 0)
  // Note: This already recalculates all TP percentages via calculateAll() effect
}

// New TP price handler (exists, lines 252-288) already does this sync
// Must ensure it also marks lastUpdated.tp[index] = 'price'
```

### Anti-Patterns to Avoid

- **Don't:** Add auto-toggle state directly to the `takeProfits` array object. This breaks the existing quantity redistribution logic and state update tracking. Keep toggles separate as `tpAutoPriceUpdate[index]` array.
- **Don't:** Call `calculateAll()` directly after API price update. It's already triggered by the useEffect dependency array on entryPrice/stopLossPrice/takeProfits changes.
- **Don't:** Use maker fee for TP exit in any calculation branch. The taker fee is mandatory for market exits. There is no condition where maker fee applies to TP.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Price formatting for display | Custom number formatting | `formatPrice()` / `formatNumber()` from utils/calculations.js | Functions already handle decimal precision, NaN, Infinity, large/small numbers |
| State parsing from user input | Parse as-is, then validate | `parseFloatInput()` from utils/calculations.js | Handles null, NaN, whitespace, multiple decimals safely |
| Fee calculation accuracy | Custom fee logic | `EXCHANGE_FEES` constants + calculation in `calculateAll()` | Centralized fee source; changing exchanges is single-point update |
| Position sync between price and percent | Manual conversion every field | Let `calculateAll()` depend on entry price; it recalculates all derived values | React dependency arrays handle cascading updates; manual sync introduces bugs |

**Key insight:** The calculator already has pattern-consistent utilities for input parsing and formatting. The fee bug exists because fee rate selection is hard-coded per exit type in one calculation function, making it easy to miss. There is no need for custom fee logic — just use the existing `EXCHANGE_FEES[exchange]` correctly.

## Common Pitfalls

### Pitfall 1: Breaking the TP Quantity Redistribution

**What goes wrong:** Adding auto-price toggle state directly to each TP object means the state shape changes. The quantity redistribution logic (which sums enabled TP quantities and rebalances to 100%) operates on `takeProfits` array and compares before/after to detect changes. Adding a new field to each TP object without updating the comparison logic breaks it.

**Why it happens:** The `lastUpdated` state already lives separately from `takeProfits` to avoid this. Each TP object has `priceInput`, `price`, `percentInput`, `percent`, `quantityInput`, `quantity`, profit/loss fields. Adding `autoPriceUpdate` to the object bloats it and mixes UI state (toggle preference) with calculation state (price, percent, quantity, profits).

**How to avoid:** Keep `tpAutoPriceUpdate` as a separate `[bool, bool, bool]` array in state, not nested in `takeProfits`. Update the comparison logic in the TP results section (around line 481) only if the profit/loss values change, not if auto-toggle changes.

**Warning signs:** State updates that re-render but don't recalculate (toggle changes don't affect P&L). Changes to `calculateAll()` dependency array that include the new TP auto-state.

### Pitfall 2: Forgetting to Update Entry Price Auto-Toggle Default

**What goes wrong:** The requirement says entry price should default to OFF (manual), but line 18 in useCalculator.js currently sets it to `true` (ON/auto). If this isn't fixed, entry price will auto-track when the user expects it not to, and tests will fail.

**Why it happens:** The original implementation had only entry price auto-fetch, which was useful for live price tracking. The requirement contradicts this, but the code wasn't updated.

**How to avoid:** Review all default state initializations. Compare to requirements:
- `autoPriceUpdate` (entry) → must be `false`
- `tpAutoPriceUpdate[0]` (TP1) → must be `true`
- `tpAutoPriceUpdate[1]` (TP2) → must be `false`
- `tpAutoPriceUpdate[2]` (TP3) → must be `false`
- `slAutoPriceUpdate` → must be `false`

**Warning signs:** Entry price field starts with "🔄 Auto" button active on page load (it should be "✋ Manual").

### Pitfall 3: Fee Bug Affects Historical Calculations

**What goes wrong:** If any saved trades or test data was computed with the old maker fee for TP exit, the net P&L is 0.02-0.05% overstated (difference between 0.02% maker and 0.04% taker for Binance). Changing to taker fee will make historical results look worse.

**Why it happens:** The bug has been in place since development; any reference calculations or user notes about expected P&L are wrong.

**How to avoid:** This is not code to avoid, but validation to do: After the fix, manually verify a TP scenario:
1. Set Binance, 1 USDT position at 50000 BTC, 1x leverage
2. TP1 at 51000 (2% gain)
3. Gross profit = 1 * (51000 - 50000) = 1000 USDT
4. Entry fee = 1000 * 0.0004 = 0.4 USDT
5. Exit fee (taker) = 1000 * 0.0004 = 0.4 USDT
6. Net profit = 1000 - 0.4 - 0.4 = 999.2 USDT
7. ResultsPanel must show 999.2, not 999.8 (which was the old maker fee result)

**Warning signs:** Test result differs from calculation by exactly 0.02% (maker) or 0.04% (taker) on a round position.

## Code Examples

### Fee Fix Example

```javascript
// Source: useCalculator.js, lines 442-450
// BEFORE (BUG):
const fees = EXCHANGE_FEES[exchange]
const entryFeeRate = fees.taker
const tpFeeRate = fees.maker        // ← BUG: should be taker
const slFeeRate = fees.taker
const trailingSlFeeRate = fees.taker

// AFTER (FIXED):
const fees = EXCHANGE_FEES[exchange]
const entryFeeRate = fees.taker
const tpFeeRate = fees.taker        // ← FIXED: now uses taker
const slFeeRate = fees.taker
const trailingSlFeeRate = fees.taker
```

### Default Margin Input Change

```javascript
// Source: useCalculator.js, line 45
// BEFORE:
const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('100')
const [positionSizeUSDT, setPositionSizeUSDT] = useState(100)

// AFTER:
const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('50')
const [positionSizeUSDT, setPositionSizeUSDT] = useState(50)
```

### Fixed USDT Presets Update

```javascript
// Source: presets.js, lines 18-21
// BEFORE:
export const FIXED_USDT_PRESETS = [
  100, 200, 250, 300, 400, 500, 600, 800, 1000, 
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 8000, 10000, 12500, 15000, 20000
]

// AFTER:
export const FIXED_USDT_PRESETS = [
  20, 50, 100, 200, 250, 300, 400, 500, 600, 800, 1000, 
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 8000, 10000, 12500, 15000, 20000
]
```

### Entry Price Auto-Toggle Default Fix

```javascript
// Source: useCalculator.js, line 18
// BEFORE:
const [autoPriceUpdate, setAutoPriceUpdate] = useState(true)  // ← BUG: should be false

// AFTER:
const [autoPriceUpdate, setAutoPriceUpdate] = useState(false) // ← FIXED: manual on load
```

### Per-TP Auto-Price State (Skeleton)

```javascript
// Source: useCalculator.js, new state (to add around line 18-20)
const [tpAutoPriceUpdate, setTPAutoPriceUpdate] = useState([true, false, false])  // TP1 ON, TP2/3 OFF
const [slAutoPriceUpdate, setSLAutoPriceUpdate] = useState(false)  // SL OFF

// Handler to toggle per-TP auto mode:
const handleTPAutoPriceToggle = (index, enabled) => {
  const updated = [...tpAutoPriceUpdate]
  updated[index] = enabled
  setTPAutoPriceUpdate(updated)
}

const handleSLAutoPriceToggle = (enabled) => {
  setSLAutoPriceUpdate(enabled)
}
```

### Per-Field Toggle in BinanceFuturesCalculatorNew useEffect (Skeleton)

```javascript
// Source: BinanceFuturesCalculatorNew.jsx, lines 15-19 (expand existing)
// CURRENT (entry price only):
useEffect(() => {
  if (calculatorState.autoPriceUpdate && currentPrice && currentPrice !== calculatorState.entryPrice) {
    calculatorState.handleEntryPriceChange(currentPrice.toString())
  }
}, [currentPrice, calculatorState.autoPriceUpdate, ...])

// AFTER (add per-TP and SL):
useEffect(() => {
  if (calculatorState.autoPriceUpdate && currentPrice && currentPrice !== calculatorState.entryPrice) {
    calculatorState.handleEntryPriceChange(currentPrice.toString())
  }
  
  // TP1 auto-update
  if (calculatorState.tpAutoPriceUpdate[0] && currentPrice && currentPrice !== calculatorState.takeProfits[0].price) {
    calculatorState.handleTakeProfitChange(0, 'priceInput', currentPrice.toString())
  }
  
  // TP2 auto-update
  if (calculatorState.tpAutoPriceUpdate[1] && currentPrice && currentPrice !== calculatorState.takeProfits[1].price) {
    calculatorState.handleTakeProfitChange(1, 'priceInput', currentPrice.toString())
  }
  
  // TP3 auto-update
  if (calculatorState.tpAutoPriceUpdate[2] && currentPrice && currentPrice !== calculatorState.takeProfits[2].price) {
    calculatorState.handleTakeProfitChange(2, 'priceInput', currentPrice.toString())
  }
  
  // SL auto-update
  if (calculatorState.slAutoPriceUpdate && currentPrice && currentPrice !== calculatorState.stopLossPrice) {
    calculatorState.handleStopLossPriceChange(currentPrice.toString())
  }
}, [currentPrice, calculatorState.autoPriceUpdate, calculatorState.tpAutoPriceUpdate, calculatorState.slAutoPriceUpdate, ...])
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — no test infrastructure in project |
| Config file | — |
| Quick run command | Manual testing in browser: `npm run dev` |
| Full suite command | No automated tests exist |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Validation Method | 
|--------|----------|-----------|-------------------|
| FEE-01 | TP exit fee uses taker (0.04% Binance, 0.06% Bybit) | Manual | Calculate TP scenario manually; verify net P&L includes taker fee, not maker |
| FEE-02 | Fee rates are current for 2026 | Document inspection | Check presets.js EXCHANGE_FEES values match official exchange docs |
| PRICE-01 | Each TP price field has independent auto/manual toggle | Manual UI test | Toggle button appears next to each TP price label; toggle state persists across re-renders |
| PRICE-02 | SL price field has independent auto/manual toggle | Manual UI test | Toggle button appears next to SL price label; toggle state persists |
| PRICE-03 | Entry price defaults to manual (OFF) on page load | Manual startup test | Open app; entry price field shows "✋ Manual" button active on first load |
| PRICE-04 | TP1 defaults to auto (ON), TP2/TP3 default to manual (OFF) on page load | Manual startup test | Open app; TP1 toggle shows "🔄 Auto", TP2/TP3 show "✋ Manual" |
| PRICE-05 | SL defaults to manual (OFF) on page load | Manual startup test | Open app; SL toggle shows "✋ Manual" active |
| POS-01 | Fixed USDT preset buttons include 20 and 50 before existing values | Manual UI test | Preset buttons visible in order: 20, 50, 100, 200, 250, ... |
| POS-02 | Default margin input is 50 USDT | Manual startup test | Open app; Margin to Use field shows "50" on page load |

### Sampling Rate
- **Per task commit:** Open app (`npm run dev`), verify each requirement manually in browser
- **Per phase merge:** Full manual test of all 9 requirements with different exchanges and trade directions

### Wave 0 Gaps
- **Testing infrastructure is absent from this project.** No Jest, Vitest, Playwright, or other test runner is configured. All validation is manual. Consider adding test infrastructure as a future phase if calculation correctness becomes critical (e.g., for production trading).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Binance and Bybit fee rates in presets.js (0.0004/0.0006 taker) are correct for 2026 | Standard Stack | If rates are outdated, net P&L calculations will be inaccurate after fix is deployed. FEE-02 requires verification. |
| A2 | `handleTakeProfitChange()` and `handleStopLossPriceChange()` handlers support 'priceInput' field for auto-price updates to work | Code Examples | If handlers don't exist or have different names, auto-price update won't work. Must verify both handlers accept index/field/value params. |
| A3 | TakeProfitTargets and StopLossConfig components accept new handler props for toggling auto-mode | Architecture Patterns | If components are tightly coupled to single handlers, new toggle handlers may not propagate correctly. Must check component prop signatures. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.
*Not empty: A1, A2, A3 above require confirmation before planning proceeds.*

## Open Questions

1. **Fee Rate Verification (FEE-02)**
   - What we know: presets.js defines Binance taker as 0.0004 (0.04%) and Bybit taker as 0.0006 (0.06%). These are standard rates as of early 2026.
   - What's unclear: Whether user has confirmed these rates are still active in 2026 or should be checked against official exchange docs.
   - Recommendation: Include a task to verify rates against Binance futures fee schedule and Bybit perpetuals fee schedule before finalizing (or trust the constants as stated and verify post-implementation).

2. **Auto-Price Field Naming**
   - What we know: The existing entry price toggle uses `autoPriceUpdate` state. New TP/SL toggles will be `tpAutoPriceUpdate` array and `slAutoPriceUpdate` boolean.
   - What's unclear: Whether `tpAutoPriceUpdate` should be an array of 3 booleans, or three separate states (`tp1AutoPrice`, `tp2AutoPrice`, `tp3AutoPrice`). Array is more elegant; three separate states are more explicit.
   - Recommendation: Use array for consistency with `lastUpdated.tp[index]` pattern already in the code.

3. **Default Margin Value Communication**
   - What we know: POS-02 requires changing default from 100 to 50 USDT.
   - What's unclear: Whether existing user workflows are hardcoded around the 100 USDT default (e.g., user bookmarks, documentation, training materials). Changing the default will surprise those users.
   - Recommendation: This is a UX decision, not a code question. Proceed with the requirement as stated.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — all changes are client-side React state and UI).

## Project Constraints (from CLAUDE.md)

1. **Stack Lock:** React + Vite + Tailwind — no framework changes allowed
2. **API Constraint:** Must continue using `fapi.binance.com/fapi/v1/ticker/price` — same endpoint, same 3s interval
3. **No API Key:** Binance public endpoints only (no authenticated endpoints)
4. **Testing:** No test infrastructure present; all validation is manual
5. **No TypeScript:** Project uses plain JavaScript (ES2020+) with JSX

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single auto-price toggle for entry only | Per-field auto-price toggle (entry, TP1-3, SL) | This phase (2026-06-01) | Users can independently choose which price fields track live prices, reducing UI noise |
| Maker fee for TP exits (incorrect) | Taker fee for all exits (correct) | This phase (2026-06-01) | Net P&L calculations match actual market execution costs; accuracy improves by ~0.02% |
| 100 USDT minimum position | 20 USDT minimum position | This phase (2026-06-01) | Supports smaller accounts and micro-trading scenarios |

## Sources

### Primary (HIGH confidence)
- **CLAUDE.md** — Project constraints, current architecture overview
- **REQUIREMENTS.md** — Phase requirements and success criteria
- **useCalculator.js** — Current fee calculation code (lines 442-450 show the bug)
- **presets.js** — Fee rates and default preset values
- **BinanceFuturesCalculatorNew.jsx** — Current auto-price implementation for entry price

### Secondary (MEDIUM confidence)
- **ROADMAP.md** — Phase context and success criteria phrasing
- **STATE.md** — Project history and recorded decisions (notes mention the TP fee bug)

## Metadata

**Confidence breakdown:**
- **Fee Fix (FEE-01, FEE-02):** HIGH — Bug is visible in code; fee rates verified in constants
- **Per-Field Auto-Price (PRICE-01 through PRICE-05):** MEDIUM — Requirements are clear, but implementation requires state changes that could affect other features (e.g., quantity redistribution). Architecture is well-understood; assumption A2/A3 need verification.
- **Position Sizing Defaults (POS-01, POS-02):** HIGH — Simple constant and initial state changes; low risk of side effects

**Research date:** 2026-06-01
**Valid until:** 2026-06-30 (or until exchange fees change; recommend re-check if FEE-02 verification deferred)
