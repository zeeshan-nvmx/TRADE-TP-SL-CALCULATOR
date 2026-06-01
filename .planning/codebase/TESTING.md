# Testing Patterns

_Generated: 2026-06-01_

## Summary

This project has no test infrastructure whatsoever. No test runner, no test files, no assertion library, and no CI pipeline. The `package.json` scripts contain only `dev`, `build`, `lint`, and `preview`. All validation is manual browser-based testing.

---

## Test Framework

**Runner:** None installed

**Assertion Library:** None

**Test files found:** 0

**Run Commands:**
```bash
# No test command exists. Current scripts:
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run lint      # ESLint only
npm run preview   # Preview production build
```

---

## Test File Organization

No test files exist anywhere in the project tree. There is no `__tests__/`, `tests/`, or `*.test.*` / `*.spec.*` file in `src/` or at the root.

---

## Coverage

**Requirements:** None enforced

**Coverage tooling:** Not installed

---

## What Should Be Tested (Priority Order)

### High Priority — Pure Utility Functions

`src/utils/calculations.js` contains four pure functions with no side effects. These are the highest-value test targets and require no mocking:

- `safeDivide(numerator, denominator)` — edge cases: `0`, `NaN`, `Infinity`, negative denominator
- `parseFloatInput(value)` — edge cases: `null`, `undefined`, `''`, `'abc'`, `'3.14'`, `'-1'`
- `formatNumber(num, decimals)` — edge cases: `NaN`, `Infinity`, negative zero, large numbers
- `formatPrice(num)` — dynamic decimal precision based on magnitude (< 1, < 100, >= 100)

### High Priority — Core Calculation Logic

`src/hooks/useCalculator.js` contains `calculateAll()` — the central calculation function. This is the most complex and most critical piece. Because it is embedded inside a hook, it would require extraction into a pure function or use of `renderHook` from `@testing-library/react-hooks` to test.

Critical calculation paths to test:
- Fixed USDT mode: position size → quantity → margin math
- Risk % mode: riskAmount → quantity derivation from SL distance
- Fee calculation: entry taker fee, TP exit fee (currently `maker`), SL exit fee (taker)
- Net profit per TP target including proportional fees
- Net loss including both entry and exit fees
- Liquidation price formula for LONG and SHORT, leverage=1 edge case
- R/R ratio: net and gross variants, NaN when SL is invalid/disabled

### Medium Priority — Trailing Stop Logic

`calculateTrailingStopTrigger` in `src/hooks/useCalculator.js` has conditional branching for LONG vs SHORT, and a floor/ceiling clamp using the fixed SL price. Test cases:
- Trigger with no fixed SL floor
- Trigger clamped to fixed SL (LONG: `Math.max`, SHORT: `Math.min`)
- Returns `null` when activation price or simulation price is unset

### Medium Priority — TP Quantity Redistribution

`redistributeTPQuantities` in `src/hooks/useCalculator.js` is a pure-ish function (takes array, returns array). Test:
- Single enabled TP → forces 100%
- All disabled → forces all 0%
- Changing one TP's quantity → proportional redistribution of others
- Rounding remainder correction (sum must always equal 100)

### Low Priority — API Service Functions

`src/services/binanceAPI.js` — `fetchFuturesSymbols` and `fetchSymbolPrice` require `fetch` mocking. Worth testing error handling (network failure, non-200 responses) and the sort order logic for perpetuals vs delivery contracts.

---

## Recommended Setup (If Adding Tests)

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.js`:
```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js',
}
```

Suggested structure:
```
src/
  utils/
    calculations.test.js       # Pure function unit tests
  hooks/
    useCalculator.test.js      # renderHook tests for calculation logic
  services/
    binanceAPI.test.js         # fetch-mocked unit tests
```

---

## Test Coverage Gaps

**`src/utils/calculations.js`:**
- What's not tested: all four exported functions
- Risk: silent regressions to number formatting or division guard logic could produce wrong displayed values without any alert

**`calculateAll` in `src/hooks/useCalculator.js`:**
- What's not tested: fee calculation correctness, position sizing modes, liquidation formula
- Risk: fee rate changes (e.g., fixing taker vs maker on TP exit) could silently produce wrong net profit/loss figures
- Priority: High

**`redistributeTPQuantities` in `src/hooks/useCalculator.js`:**
- What's not tested: rounding correction, proportional redistribution
- Risk: off-by-one rounding could cause quantity totals to drift from 100%
- Priority: Medium

**`src/services/binanceAPI.js`:**
- What's not tested: error handling paths, sorting logic
- Risk: API shape changes go undetected
- Priority: Low

---

*Testing analysis: 2026-06-01*
