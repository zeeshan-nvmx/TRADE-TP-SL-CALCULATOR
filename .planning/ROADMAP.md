# Roadmap: Trade TP/SL Calculator — Brownfield Improvements

## Overview

A single focused phase that corrects the TP fee bug, extends the auto-price toggle to TP and SL fields with correct per-field defaults, and updates position sizing presets and the default margin value. All 9 requirements ship together as they touch related parts of the calculator and can be verified in one pass.

## Phases

- [ ] **Phase 1: Calculator Accuracy & UX Fixes** - Fix fee rates, extend auto-price toggles to TP/SL, and update position sizing defaults

## Phase Details

### Phase 1: Calculator Accuracy & UX Fixes
**Goal**: The calculator shows accurate net P&L using correct taker fees for all exits, live price toggling works on TP and SL fields with sensible defaults, and position sizing presets match real trading needs
**Depends on**: Nothing (first phase)
**Requirements**: FEE-01, FEE-02, PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, POS-01, POS-02
**Success Criteria** (what must be TRUE):
  1. Net P&L for a TP exit is lower than gross P&L by the taker fee amount (not maker fee) for both Binance and Bybit
  2. Each TP price field and the SL price field has its own auto/manual toggle that independently controls whether that field tracks the live Binance price
  3. On app load, TP1 auto-toggle is ON (live), TP2/TP3 and SL and entry price are OFF (manual)
  4. The fixed USDT preset buttons include 20 and 50 before the existing values, and the margin input defaults to 50 USDT
**Plans**: 3 plans

Plans:

**Wave 1**
- [ ] 01-01-PLAN.md — Fix TP exit fee (taker not maker) and update position sizing defaults/presets

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 01-02-PLAN.md — Extend useCalculator hook with per-field auto-price state and handlers

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 01-03-PLAN.md — Add auto/manual toggle buttons to TP and SL components, wire to price feed

Cross-cutting constraints:
- All TP exits must use taker fee (FEE-01) — no maker fee in any exit calculation branch
- Per-field auto-price state (`tpAutoPriceUpdate[index]`, `slAutoPriceUpdate`) must remain separate from `takeProfits` array to avoid breaking quantity redistribution logic

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Calculator Accuracy & UX Fixes | 0/3 | Not started | - |
