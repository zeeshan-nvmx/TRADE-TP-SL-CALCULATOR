---
phase: 01-calculator-accuracy-ux-fixes
plan: "01"
subsystem: calculator-core
tags: [fee-fix, defaults, presets, accuracy]
dependency_graph:
  requires: []
  provides: [correct-tp-fee-calculation, 50-usdt-default, 20-50-presets]
  affects: [src/hooks/useCalculator.js, src/constants/presets.js]
tech_stack:
  added: []
  patterns: [dual-input-state, fee-rate-constant]
key_files:
  created: []
  modified:
    - src/hooks/useCalculator.js
    - src/constants/presets.js
decisions:
  - "TP exits use taker fee (0.04% Binance, 0.06% Bybit) — matches real market-order execution"
  - "Default margin 50 USDT and presets starting at 20, 50 support micro-trading scenarios"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-01T07:41:29Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 1 Plan 1: Fix TP Fee Rate and Position Sizing Defaults Summary

TP exit fee corrected from maker to taker rate, and position sizing defaults updated to 50 USDT with 20/50 preset buttons prepended.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix TP exit fee rate (FEE-01, FEE-02) | 8f8a5b6 | src/hooks/useCalculator.js |
| 2 | Update position sizing defaults and presets (POS-01, POS-02) | 39e8da1 | src/hooks/useCalculator.js, src/constants/presets.js |

## What Was Built

### Task 1: TP Fee Rate Fix

Changed `const tpFeeRate = fees.maker` to `const tpFeeRate = fees.taker` in `calculateAll()` inside `src/hooks/useCalculator.js` (line 444).

This corrects the net P&L calculation for TP exits:
- Binance: TP exits now use 0.04% taker (was 0.02% maker) — net profit overstated by 0.02% of position size per TP exit is now corrected
- Bybit: TP exits now use 0.06% taker (was 0.01% maker) — net profit overstated by 0.05% per TP exit is now corrected

EXCHANGE_FEES constants verified correct (FEE-02): `binance.taker = 0.0004`, `bybit.taker = 0.0006` — no changes needed.

### Task 2: Position Sizing Defaults and Presets

- `positionSizeUSDTInput` default: `'100'` → `'50'`
- `positionSizeUSDT` default: `100` → `50`
- `FIXED_USDT_PRESETS`: prepended `20` and `50` before the existing `100` — array now starts `[20, 50, 100, 200, ...]`

## Deviations from Plan

### Lint Check Not Runnable

- **Found during:** Task 2 verification
- **Issue:** `node_modules` is not installed in the project (neither in the worktree nor the main repo directory). `npm run lint` fails with `eslint: command not found`.
- **Impact:** Lint could not be verified in-place. However, the changes are trivial: a single constant swap (`fees.maker` → `fees.taker`) and number literal changes (`100` → `50`, `'100'` → `'50'`), plus prepending two integers to an array. None of these patterns can introduce ESLint violations.
- **Resolution:** Documented as pre-existing condition; not caused by plan changes. Running `npm install` before `npm run lint` in the live environment will pass.

## Verification Notes

Manual browser verification steps (from plan):
1. Binance, 1000 USDT position at 50000 BTC, 1x leverage, TP1 at 51000 (2%):
   - Expected net = 20 - 0.4 - 0.4 = **19.2 USDT** (previously showed 19.8 with maker fee)
2. PositionSizing section: margin input shows **"50"** on first load
3. Preset buttons show **"20"** and **"50"** before **"100"**

## Known Stubs

None.

## Threat Flags

None — changes are internal constant/default modifications with no new network endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- `src/hooks/useCalculator.js` modified: tpFeeRate uses fees.taker (line 444); positionSizeUSDTInput defaults to '50' (line 45); positionSizeUSDT defaults to 50 (line 46)
- `src/constants/presets.js` modified: FIXED_USDT_PRESETS starts with [20, 50, 100, ...]
- Commit 8f8a5b6 exists: fix(01-01): use taker fee rate for TP exits (FEE-01)
- Commit 39e8da1 exists: feat(01-01): update position sizing defaults and presets (POS-01, POS-02)
