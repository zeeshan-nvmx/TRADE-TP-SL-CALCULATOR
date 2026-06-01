# Phase 1: Calculator Accuracy & UX Fixes - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5 (100% coverage)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/hooks/useCalculator.js` | hook | request-response, state | `src/hooks/useCalculator.js` (same file, self-reference) | exact |
| `src/constants/presets.js` | config | static export | `src/constants/presets.js` (same file) | exact |
| `src/components/TakeProfitTargets.jsx` | component | request-response | `src/components/TradeSetup.jsx` | exact (toggle pattern) |
| `src/components/StopLossConfig.jsx` | component | request-response | `src/components/TradeSetup.jsx` | exact (toggle pattern) |
| `src/BinanceFuturesCalculatorNew.jsx` | orchestrator | event-driven | `src/BinanceFuturesCalculatorNew.jsx` (same file) | exact |

---

## Pattern Assignments

### `src/hooks/useCalculator.js` — Fee Fix (FEE-01)

**Modification:** Line 444, change `tpFeeRate` from `fees.maker` to `fees.taker`

**Current Code** (lines 441–446):
```javascript
// Fees
const fees = EXCHANGE_FEES[exchange]
const entryFeeRate = fees.taker
const tpFeeRate = fees.maker        // ← BUG: should be taker for market exit
const slFeeRate = fees.taker
const trailingSlFeeRate = fees.taker
```

**After Fix:**
```javascript
// Fees
const fees = EXCHANGE_FEES[exchange]
const entryFeeRate = fees.taker
const tpFeeRate = fees.taker        // ← FIXED: taker fee for TP market exit
const slFeeRate = fees.taker
const trailingSlFeeRate = fees.taker
```

**Rationale:** TP exits are market orders (taker fee), not limit orders (maker fee). The SL and trailing SL logic already use taker correctly; TP was the only error.

**Source file:** `src/hooks/useCalculator.js` lines 441–446

---

### `src/hooks/useCalculator.js` — Entry Price Auto-Toggle Default (PRICE-03)

**Modification:** Line 18, change `autoPriceUpdate` default from `true` to `false`

**Current Code** (line 18):
```javascript
const [autoPriceUpdate, setAutoPriceUpdate] = useState(true)  // ← BUG: auto ON by default
```

**After Fix:**
```javascript
const [autoPriceUpdate, setAutoPriceUpdate] = useState(false) // ← FIXED: manual by default
```

**Rationale:** Entry price is typically fixed by the trader; auto-updates should not distract unless explicitly enabled.

**Source file:** `src/hooks/useCalculator.js` line 18

---

### `src/hooks/useCalculator.js` — Position Sizing Default (POS-02)

**Modification:** Line 45–46, change `positionSizeUSDTInput` and `positionSizeUSDT` defaults from `'100'` / `100` to `'50'` / `50`

**Current Code** (lines 45–46):
```javascript
const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('100')
const [positionSizeUSDT, setPositionSizeUSDT] = useState(100)
```

**After Fix:**
```javascript
const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('50')
const [positionSizeUSDT, setPositionSizeUSDT] = useState(50)
```

**Rationale:** Lower default supports smaller accounts and micro-trading scenarios; allows users with 20–50 USDT to trade on startup.

**Source file:** `src/hooks/useCalculator.js` lines 45–46

---

### `src/hooks/useCalculator.js` — Per-Field Auto-Price State (PRICE-01, PRICE-02, PRICE-04)

**New State to Add** (after line 18, around lines 18–20):

```javascript
// Auto-price update states (per field)
const [tpAutoPriceUpdate, setTPAutoPriceUpdate] = useState([true, false, false])  // TP1 ON, TP2/3 OFF
const [slAutoPriceUpdate, setSLAutoPriceUpdate] = useState(false)  // SL OFF
```

**New Handlers to Add** (after line 98, in the input handlers section):

```javascript
const handleTPAutoPriceToggle = (index, enabled) => {
  const updated = [...tpAutoPriceUpdate]
  updated[index] = enabled
  setTPAutoPriceUpdate(updated)
}

const handleSLAutoPriceToggle = (enabled) => {
  setSLAutoPriceUpdate(enabled)
}
```

**Export in Return Statement** (after line 722 in the return object):

```javascript
tpAutoPriceUpdate,
slAutoPriceUpdate,
setTPAutoPriceUpdate,
setSLAutoPriceUpdate,
handleTPAutoPriceToggle,
handleSLAutoPriceToggle,
```

**Rationale:**
- `tpAutoPriceUpdate` array mirrors the existing `takeProfits` array structure (3 elements, one per TP)
- TP1 defaults to auto-tracking (user often wants best available exit); TP2/3 default manual
- SL defaults manual (risk control is user-driven)
- Toggle handlers follow same pattern as existing `setAutoPriceUpdate` setter

**Pattern Source:** `src/hooks/useCalculator.js` lines 1–100 (state initialization pattern)

---

### `src/constants/presets.js` — Position Sizing Presets (POS-01)

**Modification:** Line 18–21, prepend `[20, 50]` to `FIXED_USDT_PRESETS` array

**Current Code** (lines 18–21):
```javascript
export const FIXED_USDT_PRESETS = [
  100, 200, 250, 300, 400, 500, 600, 800, 1000, 
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 8000, 10000, 12500, 15000, 20000
]
```

**After Fix:**
```javascript
export const FIXED_USDT_PRESETS = [
  20, 50, 100, 200, 250, 300, 400, 500, 600, 800, 1000, 
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 8000, 10000, 12500, 15000, 20000
]
```

**Rationale:** Adds preset buttons for micro-trading (20 USDT) and conservative positions (50 USDT); maintains existing order.

**Source file:** `src/constants/presets.js` lines 18–21

---

### `src/components/TakeProfitTargets.jsx` — Per-TP Auto-Price Toggle

**New Props to Accept** (update function signature around line 5–10):

Add to destructured props:
```javascript
tpAutoPriceUpdate,
handleTPAutoPriceToggle,
isLoadingPrice
```

**New UI Pattern to Add** (above each TP price input, after the quantity section):

Reference pattern from `TradeSetup.jsx` (lines 155–171), adapt for TP1, TP2, TP3:

```javascript
// For each TP (inside tp.enabled condition, above the price input at line 56):
<div className='flex justify-between items-center mb-1'>
  <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
    Price
    {isLoadingPrice && <span className='text-blue-500 ml-1'>(updating...)</span>}
  </label>
  <button
    onClick={() => handleTPAutoPriceToggle(index, !tpAutoPriceUpdate[index])}
    className={`text-xs px-2 py-1 rounded transition-colors ${
      tpAutoPriceUpdate[index]
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }`}
    title={tpAutoPriceUpdate[index] ? 'Auto price updates enabled' : 'Manual price mode - auto updates disabled'}>
    {tpAutoPriceUpdate[index] ? '🔄 Auto' : '✋ Manual'}
  </button>
</div>
```

**Styling Reference:** `src/components/TradeSetup.jsx` lines 163–167 (button classes for active/inactive states)

**Apply Pattern To:**
- TP1 (index 0): Add toggle above price input
- TP2 (index 1): Add toggle above price input
- TP3 (index 2): Add toggle above price input

**Source file:** `src/components/TradeSetup.jsx` lines 155–171 (exact toggle styling and structure)

---

### `src/components/StopLossConfig.jsx` — SL Auto-Price Toggle

**New Props to Accept** (update function signature around line 5–28):

Add to destructured props:
```javascript
slAutoPriceUpdate,
handleSLAutoPriceToggle,
isLoadingPrice
```

**New UI Pattern to Add** (above SL price input, around line 47–48):

Replace the simple label with flex container + toggle (same pattern as TP):

```javascript
<div className='flex justify-between items-center mb-1'>
  <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
    Price
    {isLoadingPrice && <span className='text-blue-500 ml-1'>(updating...)</span>}
  </label>
  <button
    onClick={() => handleSLAutoPriceToggle(!slAutoPriceUpdate)}
    className={`text-xs px-2 py-1 rounded transition-colors ${
      slAutoPriceUpdate
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }`}
    title={slAutoPriceUpdate ? 'Auto price updates enabled' : 'Manual price mode - auto updates disabled'}>
    {slAutoPriceUpdate ? '🔄 Auto' : '✋ Manual'}
  </button>
</div>
```

**Styling Reference:** Same as TakeProfitTargets — copy from `src/components/TradeSetup.jsx` lines 163–167

**Source file:** `src/components/TradeSetup.jsx` lines 155–171

---

### `src/BinanceFuturesCalculatorNew.jsx` — Extend Auto-Price useEffect (PRICE-01 through PRICE-05)

**New useEffect Hook to Add** (after existing auto-price effect at lines 15–19):

Replace the single auto-price effect with an expanded version that checks all four toggle states:

```javascript
// Update prices when we get new data from API (based on per-field toggle state)
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
}, [currentPrice, calculatorState.autoPriceUpdate, calculatorState.tpAutoPriceUpdate, calculatorState.slAutoPriceUpdate, calculatorState.entryPrice, calculatorState.takeProfits, calculatorState.stopLossPrice, calculatorState.handleEntryPriceChange, calculatorState.handleTakeProfitChange, calculatorState.handleStopLossPriceChange])
```

**Dependency Array Notes:**
- Include all toggle states: `autoPriceUpdate`, `tpAutoPriceUpdate` (array), `slAutoPriceUpdate`
- Include all price states being compared: `entryPrice`, `takeProfits` (for comparison), `stopLossPrice`
- Include all handlers called: `handleEntryPriceChange`, `handleTakeProfitChange`, `handleStopLossPriceChange`

**Props to Pass to Components** (update existing prop-passing around lines 52–82):

Update TakeProfitTargets props (around line 52–58):
```javascript
<TakeProfitTargets
  takeProfits={calculatorState.takeProfits}
  handleTakeProfitChange={calculatorState.handleTakeProfitChange}
  handleTakeProfitPreset={calculatorState.handleTakeProfitPreset}
  tradeDirection={calculatorState.tradeDirection}
  entryPrice={calculatorState.entryPrice}
  tpAutoPriceUpdate={calculatorState.tpAutoPriceUpdate}
  handleTPAutoPriceToggle={calculatorState.handleTPAutoPriceToggle}
  isLoadingPrice={priceLoading}
/>
```

Update StopLossConfig props (around line 61–82):
```javascript
<StopLossConfig
  useStopLoss={calculatorState.useStopLoss}
  setUseStopLoss={calculatorState.setUseStopLoss}
  stopLossPriceInput={calculatorState.stopLossPriceInput}
  stopLossPrice={calculatorState.stopLossPrice}
  handleStopLossPriceChange={calculatorState.handleStopLossPriceChange}
  stopLossPercentInput={calculatorState.stopLossPercentInput}
  handleStopLossPercentChange={calculatorState.handleStopLossPercentChange}
  handleStopLossPreset={calculatorState.handleStopLossPreset}
  tradeDirection={calculatorState.tradeDirection}
  entryPrice={calculatorState.entryPrice}
  useTrailingStop={calculatorState.useTrailingStop}
  setUseTrailingStop={calculatorState.setUseTrailingStop}
  trailingStopPercentInput={calculatorState.trailingStopPercentInput}
  trailingStopPercent={calculatorState.trailingStopPercent}
  handleTrailingStopPercentChange={calculatorState.handleTrailingStopPercentChange}
  trailingActivationPriceInput={calculatorState.trailingActivationPriceInput}
  trailingActivationPrice={calculatorState.trailingActivationPrice}
  handleTrailingActivationPriceChange={calculatorState.handleTrailingActivationPriceChange}
  handleAutoSetActivationPrice={calculatorState.handleAutoSetActivationPrice}
  trailingStopSimulationPriceInput={calculatorState.trailingStopSimulationPriceInput}
  handleTrailingStopSimulationPriceChange={calculatorState.handleTrailingStopSimulationPriceChange}
  trailingStopTriggerPrice={calculatorState.trailingStopTriggerPrice}
  trailingStopSimulationPrice={calculatorState.trailingStopSimulationPrice}
  slAutoPriceUpdate={calculatorState.slAutoPriceUpdate}
  handleSLAutoPriceToggle={calculatorState.handleSLAutoPriceToggle}
  isLoadingPrice={priceLoading}
/>
```

**Source file:** `src/BinanceFuturesCalculatorNew.jsx` lines 15–19 (existing effect pattern)

---

## Shared Patterns

### Input Synchronization Pattern

**Source:** `src/hooks/useCalculator.js` lines 94–98 (entry price handler)

**Apply to:** All new TP and SL auto-price handlers

When API price triggers a field update, use this exact pattern:
```javascript
const handleXPriceChange = (value) => {
  setXPriceInput(value)          // Update string input
  const p = parseFloatInput(value)
  setXPrice(p !== null && p > 0 ? p : 0)  // Update parsed price (with bounds)
}
```

This pattern:
- Updates the input string field first
- Parses safely with `parseFloatInput()` (handles null, NaN, edge cases)
- Sets the numeric price field with bounds validation
- Automatically triggers `calculateAll()` via useEffect dependency

---

### Toggle Button Styling Pattern

**Source:** `src/components/TradeSetup.jsx` lines 161–170 (entry price toggle)

**Apply to:** All new TP and SL auto-price toggles

```javascript
// Active state (Auto ON)
<button className='... bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
  🔄 Auto
</button>

// Inactive state (Manual OFF)
<button className='... bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'>
  ✋ Manual
</button>
```

Key classes (required for consistency):
- Active: `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`
- Inactive: `bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400`
- Both: `text-xs px-2 py-1 rounded transition-colors`

---

### State Array Mutation Pattern

**Source:** `src/hooks/useCalculator.js` lines 337–407 (TP quantity redistribution)

**Apply to:** `handleTPAutoPriceToggle` handler

When modifying an array state (like `tpAutoPriceUpdate[index]`), always:
1. Create a shallow copy: `const updated = [...array]`
2. Modify the copy: `updated[index] = newValue`
3. Set state with the new array: `setState(updated)`

This ensures React detects the state change and re-renders.

---

## No Analog Found

All files in this phase have clear analogs in the existing codebase. No novel patterns required.

---

## Metadata

**Analog search scope:** 
- `src/hooks/*.js`
- `src/constants/*.js`
- `src/components/*.jsx`

**Files scanned:** 8
**Pattern extraction date:** 2026-06-01

**Quality notes:**
- Fee fix is a single-line change in existing calculation logic
- Per-field auto-price toggles reuse TradeSetup toggle pattern exactly
- All state initialization follows existing convention (line 18 pattern)
- Position sizing presets follow existing array structure
