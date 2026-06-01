---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 1 UI-SPEC approved
last_updated: "2026-06-01T07:39:08.817Z"
last_activity: 2026-06-01 -- Phase 01 execution started
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
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
Last activity: 2026-06-01 -- Phase 01 execution started

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

## Session Continuity

Last session: 2026-06-01T07:28:07.071Z
Stopped at: Phase 1 UI-SPEC approved
Resume file: .planning/phases/01-calculator-accuracy-ux-fixes/01-UI-SPEC.md
