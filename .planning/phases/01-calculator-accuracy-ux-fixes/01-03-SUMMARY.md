---
plan: 01-03
phase: 01-calculator-accuracy-ux-fixes
status: complete
completed: 2026-06-01
---

# Plan 01-03 Summary: Auto/Manual Toggle UI + BinanceFuturesCalculatorNew Wiring

## What Was Built

Three components updated to add per-field auto/manual price toggle buttons wired to the live Binance price feed.

### TakeProfitTargets.jsx
- Added per-TP toggle button (one above each TP price input) using TradeSetup pattern
- TP1 defaults to Auto (green) on load; TP2/TP3 default to Manual (gray)
- Layout: full-width `flex justify-between` row above the input — not squeezed into col-span-1

### StopLossConfig.jsx
- Added one SL toggle button above the SL price input
- Defaults to Manual (gray) on load
- Same full-width layout pattern

### BinanceFuturesCalculatorNew.jsx
- Expanded useEffect to apply live price to all five fields (entry, TP1, TP2, TP3, SL) when each field's toggle is ON
- Passes `tpAutoPriceUpdate`, `handleTPAutoPriceToggle`, `isLoadingPrice` to TakeProfitTargets
- Passes `slAutoPriceUpdate`, `handleSLAutoPriceToggle`, `isLoadingPrice` to StopLossConfig

## Additional Fixes Applied During Checkpoint

- **Layout stability**: removed `(updating...)` from TP/SL price labels (was causing toggle button to wrap under input on every 3s tick); used `invisible` for TP Net Profit text to reserve height
- **Binance taker fee**: corrected 0.04% → 0.05% for standard (non-VIP) customers
- **Entry price + SL defaults**: cleared hardcoded BTC values, fields start blank/0
- **Default direction**: changed from LONG → SHORT

## Commits

- `6bc5f6f` feat(01-03): add per-TP auto/manual toggle buttons and SL toggle
- `c97bcff` feat(01-03): expand auto-price useEffect and pass new props
- `e207e08` fix(01-03): fix toggle button layout and UI jumping
- `d7f427d` fix: correct Binance taker fee to 0.05% and clear hardcoded defaults
- `4d7bf34` feat: default trade direction to SHORT on app start

## Verification

All 9 requirements met (FEE-01, FEE-02, PRICE-01–05, POS-01, POS-02):
- Entry/TP/SL toggles render correctly with correct defaults
- Toggle buttons stable — no layout shift on price ticks
- Binance taker fee 0.05% used on all exits (taker in, taker out)
- Entry price blank on load, direction defaults to SHORT

## Self-Check: PASSED
