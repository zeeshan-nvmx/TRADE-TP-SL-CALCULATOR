# Requirements

## v1 Requirements

### Fee Fix

- [ ] **FEE-01**: TP exit fee uses taker rate (not maker) — both entry and exit are market taker orders for all exchanges
- [ ] **FEE-02**: Verify Binance 2026 perpetual futures taker fee is 0.04% and Bybit is 0.06% — update constants if incorrect

### Auto-Price Fetch Extension

- [ ] **PRICE-01**: TP price inputs have per-field auto/manual toggle using the same Binance Futures API endpoint (`https://fapi.binance.com/fapi/v1/ticker/price`, 3s polling interval)
- [ ] **PRICE-02**: SL price input has auto/manual toggle using the same API
- [ ] **PRICE-03**: Entry price auto-fetch defaults to **manual** on app start (currently defaults to auto)
- [ ] **PRICE-04**: TP1 auto-fetch defaults to **auto** on app start; TP2 and TP3 default to manual
- [ ] **PRICE-05**: SL auto-fetch defaults to **manual** on app start

### Position Sizing

- [ ] **POS-01**: Fixed USDT preset buttons start with 20, 50 then continue with existing values (100, 200, 250, 300, 400, 500...)
- [ ] **POS-02**: Default margin input value is 50 USDT (changed from 100 USDT)

---

## v2 (Deferred)

- WebSocket-based price feed (lower latency than 3s REST polling)
- Bybit live price feed

## Out of Scope

- Backend / server — static frontend app only
- User accounts or saved trades — personal tool
- Multiple exchange price feeds simultaneously — Binance API only
- Mobile app — web only

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| FEE-01 | Phase 1 |
| FEE-02 | Phase 1 |
| PRICE-01 | Phase 1 |
| PRICE-02 | Phase 1 |
| PRICE-03 | Phase 1 |
| PRICE-04 | Phase 1 |
| PRICE-05 | Phase 1 |
| POS-01 | Phase 1 |
| POS-02 | Phase 1 |
