---
phase: 01-calculator-accuracy-ux-fixes
plan: "02"
subsystem: calculator-core
tags: [auto-price, state-management, hooks, defaults]
dependency_graph:
  requires: [01-01]
  provides: [tpAutoPriceUpdate-state, slAutoPriceUpdate-state, handleTPAutoPriceToggle, handleSLAutoPriceToggle, autoPriceUpdate-false-default]
  affects: [src/hooks/useCalculator.js]
tech_stack:
  added: []
  patterns: [dual-input-state, array-immutable-update]
key_files:
  created: []
  modified:
    - src/hooks/useCalculator.js
decisions:
  - "autoPriceUpdate defaults to false — entry price is manual on load (PRICE-03)"
  - "tpAutoPriceUpdate initialized to [true, false, false] — TP1 auto by default, TP2/TP3 manual (PRICE-04)"
  - "slAutoPriceUpdate initialized to false — SL is manual on load (PRICE-05)"
  - "Toggle states excluded from calculateAll() dependency array — toggling must not trigger P&L recalculation (T-02-02)"
metrics:
  duration: "~5 minutes"
  completed: "2026-06-01T08:00:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 1
---

# Phase 1 Plan 2: Extend useCalculator with Per-Field Auto-Price State Summary

Per-field auto-price toggle state (tpAutoPriceUpdate, slAutoPriceUpdate) added to useCalculator hook with corrected autoPriceUpdate default and two new handler functions exported for Plan 03 UI consumption.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix autoPriceUpdate default and add tpAutoPriceUpdate/slAutoPriceUpdate state | b7c6811 | src/hooks/useCalculator.js |
| 2 | Add handleTPAutoPriceToggle/handleSLAutoPriceToggle handlers, export all new state | d81f392 | src/hooks/useCalculator.js |

## What Was Built

### Task 1: State Declarations

Three changes in the state declarations section of `src/hooks/useCalculator.js`:

1. `autoPriceUpdate` default changed from `true` to `false` (line 18) — satisfies PRICE-03: entry price is manual on app load.
2. `tpAutoPriceUpdate` added: `useState([true, false, false])` — TP1 auto-price enabled by default, TP2 and TP3 manual (PRICE-04).
3. `slAutoPriceUpdate` added: `useState(false)` — SL manual on load (PRICE-05).

Both new states are top-level state variables (not embedded in the `takeProfits` array object), consistent with the hook's flat-state pattern.

### Task 2: Handlers and Exports

Two new handler functions added in the Input Handlers section (before Trailing Stop Loss Handlers):

- `handleTPAutoPriceToggle(index, enabled)`: creates shallow copy of `tpAutoPriceUpdate`, sets `copy[index] = enabled`, calls `setTPAutoPriceUpdate`. Follows the same array immutable-update pattern used in TP quantity redistribution.
- `handleSLAutoPriceToggle(enabled)`: calls `setSLAutoPriceUpdate(enabled)` directly. Single boolean, no array mutation.

Six new fields added to the return object (after `setAutoPriceUpdate`):
- `tpAutoPriceUpdate`
- `slAutoPriceUpdate`
- `setTPAutoPriceUpdate`
- `setSLAutoPriceUpdate`
- `handleTPAutoPriceToggle`
- `handleSLAutoPriceToggle`

The `calculateAll()` `useEffect` dependency array was not modified — toggle state changes must not trigger P&L recalculation (threat T-02-02 mitigated).

## Deviations from Plan

### Lint Not Runnable (Pre-existing Condition)

- **Found during:** Task 2 verification
- **Issue:** `node_modules` is not installed in the worktree (same pre-existing condition as Plan 01). `npm run lint` cannot be executed.
- **Impact:** None expected — changes are pure React state hook additions using existing `useState` import. No new imports, no complex logic, no exhaustive-deps violations (new states intentionally excluded from calculateAll effect).
- **Resolution:** Pre-existing condition; not caused by plan changes.

## Known Stubs

None.

## Threat Flags

None — changes are internal React state hook additions with no new network endpoints, auth paths, file access patterns, or schema changes.

## Self-Check: PASSED

- `src/hooks/useCalculator.js` line 18: `autoPriceUpdate` initialized to `false`
- `src/hooks/useCalculator.js` line 19: `tpAutoPriceUpdate` initialized to `[true, false, false]`
- `src/hooks/useCalculator.js` line 20: `slAutoPriceUpdate` initialized to `false`
- `src/hooks/useCalculator.js` lines 114-122: both handler functions defined
- `src/hooks/useCalculator.js` lines 735-740: all six new fields in return object
- calculateAll() dependency array (lines 613-628) does not contain tpAutoPriceUpdate or slAutoPriceUpdate
- Commit b7c6811 exists: fix(01-02) state declarations
- Commit d81f392 exists: feat(01-02) handlers and exports
