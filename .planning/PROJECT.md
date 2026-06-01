# Trade TP/SL Calculator

## What This Is

A personal web-based futures trading calculator for Binance and Bybit. It calculates position sizing, take profit and stop loss targets, fee impact, liquidation prices, and net P&L including trailing stop scenarios. Live entry price is fetched from the Binance Futures API with an auto/manual toggle.

## Core Value

Accurate net P&L calculation after real fees — so every trade decision reflects what actually lands in the account.

## Requirements

### Validated

- ✓ Position sizing: fixed USDT margin mode and risk-% mode — existing
- ✓ Up to 3 take profit targets with quantity allocation — existing
- ✓ Fixed stop loss with price/percent dual input — existing
- ✓ Trailing stop loss with activation price and simulation — existing
- ✓ Gross vs net profit/loss display (fees deducted) — existing
- ✓ Liquidation price estimation (isolated + cross) — existing
- ✓ Exchange toggle: Binance / Bybit with correct fee rates — existing
- ✓ Binance Futures REST API auto-price fetch for entry price (3s polling, auto/manual toggle) — existing
- ✓ Refactored component architecture (hooks, services, utils, components) — existing

### Active

- [ ] Fix exit fee rate: TP exits currently use maker rate; both entry and exit should use taker rate for all exchanges
- [ ] Verify and update Bybit 2026 taker fee (confirm current rate is correct)
- [ ] Extend auto-price fetch to TP price inputs — TP defaults to auto-update on app start
- [ ] Extend auto-price fetch to SL price input — SL defaults to manual on app start
- [ ] Entry price auto-fetch should also default to manual on app start (currently defaults to auto)
- [ ] Position sizing presets: add 20, 50 before the existing 100, 200, 250...
- [ ] Default margin input: change from 100 USDT to 50 USDT

### Out of Scope

- Backend / server — this is a pure frontend static app
- User accounts / saved trades — personal tool, no persistence needed
- Multiple exchange price feeds — Binance API only for price fetching
- Mobile app — web only

## Context

- The app was refactored from a monolithic 1600-line component into a hooks + components architecture on the dev branch; main branch now reflects this
- The old `BinanceFuturesCalculator.jsx` (monolithic) is still present as a reference but is not used — `App.jsx` renders `BinanceFuturesCalculatorNew`
- Binance Futures API endpoint: `https://fapi.binance.com/fapi/v1/ticker/price?symbol=SYMBOL` — no API key required
- Fee constants live in `useCalculator.js`: `exchangeFees = { binance: { maker: 0.0002, taker: 0.0004 }, bybit: { maker: 0.0001, taker: 0.0006 } }`
- The TP fee bug: `const tpFeeRate = fees.maker` in `calculateAll()` inside `useCalculator.js`

## Constraints

- **Stack**: React + Vite + Tailwind — no framework changes
- **API**: Must continue using `fapi.binance.com/fapi/v1/ticker/price` — same endpoint, same 3s interval
- **No API key**: Binance public endpoints only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Both entry and exit use taker fee | User trades as market taker in both directions; maker rate was incorrect default | All fee calcs use taker rate |
| TP auto-price defaults ON, Entry/SL default OFF | TP is most useful to track live; entry/SL are usually set manually at trade entry | Per-field auto toggle with different defaults |
| Presets start at 20, 50 | Smaller accounts and test trades need lower preset values | Prepend 20, 50 to existing preset array |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

---
*Last updated: 2026-06-01 after initialization*
