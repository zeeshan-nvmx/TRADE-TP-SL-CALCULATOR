---
phase: quick-260623-cee
plan: 01
subsystem: src/components
tags: [ui, mobile, layout, responsive]
dependency_graph:
  requires: []
  provides: []
  affects: [src/components/ResultsPanel.jsx]
tech_stack:
  added: []
  patterns: [responsive-css-order, flex-column]
key_files:
  created: []
  modified:
    - src/components/ResultsPanel.jsx
  deleted: []
decisions:
  - "Used responsive Tailwind order utilities (order-N mobile, md:order-N desktop) so mobile reorders while the desktop DOM order is preserved exactly — no JS, no orchestrator change"
  - "Trailing Stop Scenario (not in the requested mobile list) placed last on mobile (order-7) so it does not interrupt the specified flow; it stays at its desktop position (md:order-6)"
  - "Root container switched space-y-4 -> flex flex-col gap-4 because CSS order only applies inside flex/grid; gap-4 equals space-y-4 spacing, so visuals are unchanged"
metrics:
  duration: "< 1 minute"
  completed: "2026-06-23"
status: complete
---

# Quick Task 260623-cee: Reorder Results Panel Sections on Mobile

**One-liner:** Reordered ResultsPanel sections on mobile so Position Sizing and the Profit/Loss scenarios appear directly under the inputs, above Trade Analysis / Binance Fees / Liquidation Analysis — desktop layout untouched.

## What Was Done

`src/components/ResultsPanel.jsx`:
- Root container: `space-y-4` → `flex flex-col gap-4` (enables CSS `order`; identical 16px gap).
- Added responsive `order` / `md:order` classes to each section. The `md:order-*` values exactly reproduce the prior desktop DOM order, so desktop is pixel-identical.
- Wrapped the bare `<PositionSizing/>` in `<div className='order-1 md:order-3'>`.

## Mobile order achieved
Trade Setup → Take Profit Targets → Stop Loss → **Position Sizing → Profit Scenarios → Loss Scenario → Trade Analysis → Binance Fees → Liquidation Analysis** → (Trailing Stop Scenario)

## Desktop
Unchanged (Trade Analysis → Binance Fees → Position Sizing → Profit Scenarios → Loss Scenario → Trailing Stop Scenario → Liquidation Analysis).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Apply responsive order utilities, verify build, commit | c732b5b | src/components/ResultsPanel.jsx |

## Verification

- `npm run build`: ✓ 28 modules transformed, no errors.
- `npm run lint`: 0 errors (20 pre-existing warnings, none in ResultsPanel.jsx).
- Desktop invariance: the `md:order-*` map reproduces the prior DOM order exactly, so desktop rendering is unchanged.

## Notes

- Trailing Stop Scenario was not in the requested mobile sequence; it is placed last on mobile (`order-7`). If a different mobile position is wanted, change its `order-7` value.
- No orchestrator (`BinanceFuturesCalculatorNew.jsx`) or hook changes — Position Sizing already lives inside ResultsPanel.
