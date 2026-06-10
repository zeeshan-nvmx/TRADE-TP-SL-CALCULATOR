---
phase: quick-260610-w0x
plan: 01
subsystem: src
tags: [cleanup, dead-code, deletion]
dependency_graph:
  requires: []
  provides: []
  affects: []
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified: []
  deleted:
    - src/BinanceFuturesCalculator.jsx
decisions:
  - "Legacy monolith deleted — app was already on BinanceFuturesCalculatorNew; no import of the old file existed"
metrics:
  duration: "< 1 minute"
  completed: "2026-06-10T17:05:50Z"
---

# Quick Task 260610-w0x: Delete Unused Legacy BinanceFuturesCalculator.jsx

**One-liner:** Deleted the 1643-line legacy monolith BinanceFuturesCalculator.jsx which was fully orphaned after migration to the modular BinanceFuturesCalculatorNew architecture.

## What Was Done

Removed `src/BinanceFuturesCalculator.jsx` (1643 lines) from the repository. The file had no importers — `src/App.jsx` imports `BinanceFuturesCalculatorNew`, and the grep safety check confirmed no other file referenced the legacy path. The production build continues to pass at 28 modules with no import errors.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove file, verify build, commit | 856ab63 | src/BinanceFuturesCalculator.jsx (deleted) |

## Verification

- `test ! -f src/BinanceFuturesCalculator.jsx` exits 0: FILE_GONE
- `npm run build` exits 0: 28 modules, built in ~430ms
- `git log --oneline -1` shows `856ab63 chore: remove unused legacy BinanceFuturesCalculator.jsx monolith`

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — dead-code deletion with no runtime impact, no new trust boundaries introduced.

## Self-Check: PASSED

- File deleted: confirmed (FILE_GONE)
- Commit present: 856ab63
- Build green: 28 modules, exit 0
