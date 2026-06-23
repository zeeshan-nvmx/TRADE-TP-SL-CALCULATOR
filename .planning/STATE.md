---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: context exhaustion at 75% (2026-06-01)
last_updated: "2026-06-01T09:47:37.754Z"
last_activity: 2026-06-01 -- Phase 01 execution started
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-01)

**Core value:** Accurate net P&L calculation after real fees — so every trade decision reflects what actually lands in the account
**Current focus:** Phase 01 — calculator-accuracy-ux-fixes

## Current Position

Phase: 01 (calculator-accuracy-ux-fixes) — EXECUTING
Plan: 1 of 3
Status: Executing Phase 01
Last activity: 2026-06-23 -- Completed quick task 260623-cee: Reorder ResultsPanel sections on mobile

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: none yet
- Trend: -

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Both entry and exit use taker fee — user trades as market taker in both directions
- Phase 1: TP1 auto-price defaults ON, entry/TP2/TP3/SL default OFF — TP1 is most useful to track live
- Phase 1: Presets start at 20, 50 — smaller accounts and test trades need lower values

### Pending Todos

None yet.

### Blockers/Concerns

- `calculateAll()` in `useCalculator.js` has a stale-dependency eslint suppression (line 600) — avoid expanding the dependency array carelessly when adding auto-price state
- The TP fee bug is confirmed: `const tpFeeRate = fees.maker` in `calculateAll()` must become `fees.taker`

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Price feed | WebSocket-based price feed (lower latency) | v2 | Roadmap init |
| Price feed | Bybit live price feed | v2 | Roadmap init |

## Quick Tasks Completed

| Slug | Date | Description |
|------|------|-------------|
| upgrade-react-vite | 2026-06-01 | Upgrade react/react-dom to 19.2.6, vite to 8.0.15, @vitejs/plugin-react to 6.0.2 |
| 260610-w0x-delete-unused-legacy-binancefuturescalcu | 2026-06-10 | Delete unused legacy BinanceFuturesCalculator.jsx (commit 856ab63) |
| fast-fix-calculator-review-findings | 2026-06-10 | Remove hardcoded 85880 TP1 default (percent-driven now), fix TP handler state mutations, clear stale results on invalid entry, stop price status flicker, correct CLAUDE.md fee docs |
| fast-harden-price-polling | 2026-06-10 | Add AbortSignal timeouts to Binance fetches and in-flight guard to usePriceUpdater — hung connections now self-heal instead of leaving requests pending forever |
| fast-instant-pnl-on-entry | 2026-06-10 | Keep valid TP price when entry is empty and sync percent display for price-anchored TPs — P&L now shows immediately when entry price is typed |
| 260623-cee-mobile-results-panel-reorder | 2026-06-23 | Reorder ResultsPanel sections on mobile (Position Sizing & P/L scenarios above Trade Analysis/Binance Fees/Liquidation); desktop unchanged (commit c732b5b) |

## Session Continuity

Last session: 2026-06-01T09:47:37.750Z
Stopped at: context exhaustion at 75% (2026-06-01)
Resume file: None
