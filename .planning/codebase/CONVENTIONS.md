# Coding Conventions

_Generated: 2026-06-01_

## Summary

This is a React 19 + Vite + Tailwind CSS single-page application. All components are functional with no class components. Logic is cleanly separated into hooks, utilities, services, and constants. Tailwind is used exclusively for styling — no CSS modules or styled-components.

---

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx` — e.g., `TradeSetup.jsx`, `ResultsPanel.jsx`, `TakeProfitTargets.jsx`
- Hooks: camelCase prefixed with `use`, `.js` extension — e.g., `useCalculator.js`, `useBinanceAPI.js`
- Utilities: camelCase noun `.js` — e.g., `calculations.js`
- Services: camelCase noun `.js` — e.g., `binanceAPI.js`
- Constants: camelCase noun `.js` — e.g., `presets.js`

**Functions:**
- Event handlers: `handle` prefix — e.g., `handleEntryPriceChange`, `handleTakeProfitPreset`, `handleStopLossPercentChange`
- Setters exposed from hooks: `set` prefix matching the state name — e.g., `setExchange`, `setTradeDirection`
- Utility functions: verb + noun — e.g., `formatNumber`, `safeDivide`, `parseFloatInput`, `formatHighPrecision`, `formatPrice`
- Async service functions: verb + noun — e.g., `fetchFuturesSymbols`, `fetchSymbolPrice`, `fetchMultiplePrices`

**Variables/State:**
- Input string mirror: `[fieldName]Input` alongside the parsed numeric — e.g., `entryPriceInput` / `entryPrice`, `leverageInput` / `leverage`
- Boolean toggles: `use` prefix — e.g., `useStopLoss`, `useTrailingStop`, `autoPriceUpdate`
- Calculated results: descriptive — e.g., `weightedTakeProfit`, `grossLossAmount`, `effectiveMargin`

**Constants (presets.js):**
- SCREAMING_SNAKE_CASE — e.g., `EXCHANGE_FEES`, `LEVERAGE_PRESETS`, `DEFAULT_TAKE_PROFITS`, `MMR`

**Types:**
- No TypeScript; plain JavaScript with JSDoc-style comments where beneficial

---

## Input State Pattern

Every numeric input field has two parallel state values: a raw string for the `<input>` value and a parsed numeric for calculations. This prevents cursor-jump and NaN issues.

```js
// In useCalculator.js — the canonical pattern
const [entryPriceInput, setEntryPriceInput] = useState('84882')  // string → bound to <input>
const [entryPrice, setEntryPrice] = useState(84882)              // number → used in math

const handleEntryPriceChange = (value) => {
  setEntryPriceInput(value)
  const p = parseFloatInput(value)
  setEntryPrice(p !== null && p > 0 ? p : 0)
}
```

All `handle*Change` functions follow this exact shape. Use `parseFloatInput` (from `src/utils/calculations.js`) — never raw `parseFloat` — to handle empty/null/NaN safely.

---

## Hook Patterns

**`useCalculator` (`src/hooks/useCalculator.js`):**
- Owns all calculator state and all handler functions
- Returns a flat object of state + handlers (no nesting)
- `calculateAll()` is the single calculation entry point, triggered by a `useEffect` that lists all input dependencies explicitly
- The `eslint-disable-next-line react-hooks/exhaustive-deps` comment is intentional on the main `calculateAll` effect — do not remove it without careful review
- Uses `useCallback` for functions that are themselves listed as `useEffect` dependencies (`calculateTrailingStopTrigger`, `updateTPPriceFromPercent`, `updateSLPriceFromPercent`)
- The dependency array for the main calculation effect uses `JSON.stringify(...)` for the `takeProfits` array to avoid object reference instability

**`useBinanceSymbols` / `usePriceUpdater` (`src/hooks/useBinanceAPI.js`):**
- Data-fetching hooks only — no calculation logic
- `usePriceUpdater` sets up a `setInterval` for live price polling (default 3000ms) and cleans up on unmount/symbol change
- Exposes a `status` string: `'connected' | 'connecting' | 'disconnected' | 'error'`

---

## Component Design

**Props are explicit, not spread (except ResultsPanel):**
- Every component destructures its props explicitly in the function signature
- Exception: `<ResultsPanel {...calculatorState} />` in `BinanceFuturesCalculatorNew.jsx` — this is intentional to avoid a very long prop list, but it means `ResultsPanel` is tightly coupled to the `useCalculator` return shape

**Components are presentational:**
- No components compute derived values — all math happens in `useCalculator`
- Components only call handler functions passed as props

**Section layout pattern (all card components):**
```jsx
<div className='space-y-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg'>
  <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Section Title</h3>
  {/* content */}
</div>
```

---

## Tailwind Usage

**Dark mode:** Class-based (`dark:` prefix). Every color utility has a `dark:` counterpart.

**Color palette:** Exclusively `neutral-*` scale for structural UI (borders, backgrounds, text). Semantic colors used for state only:
- Green (`green-600` / `dark:green-400`): profit, LONG active, connected status
- Red (`red-500` / `dark:red-400`): loss, invalid inputs, error state
- Amber (`amber-500` / `dark:amber-400`): warnings (margin exceeded)
- Blue (`blue-200`/`blue-700` etc.): informational callout boxes
- Yellow (`yellow-300`/`yellow-700` etc.): risk warning callouts

**Input field standard class:**
```
w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800
bg-white dark:bg-black text-neutral-900 dark:text-neutral-100
focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100
```
Small variant uses `h-8 px-2 py-1 text-xs`.

**Active/selected button pattern (toggle):**
```
// Active
bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium
// Inactive
border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300
```

**Display (read-only) field standard class:**
```
h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800
bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100
```

---

## Import Organization

Order within files:
1. React core (`import React from 'react'`, named hooks)
2. Internal hooks (`../hooks/...`)
3. Internal components (`./components/...` or `../components/...`)
4. Internal constants (`../constants/presets`)
5. Internal utilities (`../utils/calculations`)
6. Internal services (`../services/...`)

No path aliases are configured. All imports use relative paths.

---

## Code Style

**Formatting:** Vite default (Prettier-compatible). Single quotes, no semicolons in JSX attribute strings (Tailwind className values use template literals or string concatenation).

**Linting:** ESLint 9 flat config (`eslint.config.js`) with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`.

**No TypeScript.** All files are `.js` or `.jsx`.

**Comments:**
- Section comments inside long functions use `// --- Section Name ---` format (see `useCalculator.js`)
- Inline clarification comments on non-obvious logic only
- No JSDoc on component functions; prop documentation is implicit from destructuring

---

## Module Design

**Exports:**
- Components: single default export per file
- Hooks: named exports (`export const useCalculator = ...`)
- Utils/services/constants: named exports only, no default exports

**No barrel files** (`index.js` re-exports). Each consumer imports directly from the source file.

---

*Convention analysis: 2026-06-01*
