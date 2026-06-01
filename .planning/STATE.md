# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-01)

**Core value:** Accurate net P&L calculation after real fees — so every trade decision reflects what actually lands in the account
**Current focus:** Phase 1 — Calculator Accuracy & UX Fixes

## Current Position

Phase: 1 of 1 (Calculator Accuracy & UX Fixes)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-06-01 — Roadmap created

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

## Session Continuity

Last session: 2026-06-01
Stopped at: Roadmap and state initialized, ready for /gsd:plan-phase 1
Resume file: None
