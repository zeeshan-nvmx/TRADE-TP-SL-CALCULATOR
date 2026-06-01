# External Integrations
_Generated: 2026-06-01_

## Summary
The only external integration is the Binance USD-M Futures REST API (`https://fapi.binance.com/fapi/v1`), used for two read-only purposes: loading the full list of tradable USDT futures symbols on page load, and polling the live price of the currently selected symbol every 3 seconds. No authentication is required — both endpoints are public. There are no other external services, databases, analytics, or auth providers.

## Binance Futures REST API

**Base URL:** `https://fapi.binance.com/fapi/v1`

**Implementation files:**
- Service layer: `src/services/binanceAPI.js`
- React hooks: `src/hooks/useBinanceAPI.js`

### Endpoints Used

#### 1. Exchange Info — Symbol List
- **Endpoint:** `GET /fapi/v1/exchangeInfo`
- **Function:** `fetchFuturesSymbols()` in `src/services/binanceAPI.js`
- **When called:** Once on page load, inside the `useBinanceSymbols` hook via a `useEffect` with an empty dependency array
- **Auth required:** No
- **Filtering applied:** Only symbols where `status === 'TRADING'` and `quoteAsset === 'USDT'` are kept. All contract types are included (PERPETUAL, CURRENT_QUARTER, NEXT_QUARTER, PERPETUAL_DELIVERING).
- **Sort order:** Perpetuals first (alphabetically by base asset), then delivery contracts sorted by delivery date ascending
- **Fields extracted per symbol:** `symbol`, `baseAsset`, `quoteAsset`, `contractType`, `deliveryDate`, `pricePrecision`, `quantityPrecision`
- **Error handling:** `try/catch` — logs to `console.error`, returns empty array `[]` on failure

#### 2. Symbol Price Ticker
- **Endpoint:** `GET /fapi/v1/ticker/price?symbol={symbol}`
- **Function:** `fetchSymbolPrice(symbol)` in `src/services/binanceAPI.js`
- **When called:** On interval by the `usePriceUpdater` hook (see Polling section below)
- **Auth required:** No
- **Response:** `{ symbol, price: parseFloat(data.price), timestamp: Date.now() }`
- **Error handling:** `try/catch` — logs to `console.error`, returns `null` on failure

#### 3. Batch Price Ticker (defined but not actively used in current UI)
- **Endpoint:** `GET /fapi/v1/ticker/price?symbols=["SYM1","SYM2",...]`
- **Function:** `fetchMultiplePrices(symbols)` in `src/services/binanceAPI.js`
- **Status:** Exported but not called anywhere in the current component tree. Available for future use.

---

## Price Polling Mechanism

**Hook:** `usePriceUpdater(symbol, intervalMs = 3000)` in `src/hooks/useBinanceAPI.js`

**How it works:**
1. On mount (or when `symbol` changes), calls `fetchSymbolPrice` immediately (initial fetch)
2. Sets up a `setInterval` to call `fetchSymbolPrice` every `intervalMs` milliseconds (default 3000 ms = 3 seconds)
3. Cleans up the interval on unmount or when `symbol` changes (via `useEffect` cleanup)
4. Exposes connection status as a string: `'disconnected'` | `'connecting'` | `'connected'` | `'error'`

**Returned values:**
```js
{ price, loading, error, lastUpdate, status, refetch }
```

**Usage in the main calculator:**
- Called in `src/BinanceFuturesCalculatorNew.jsx`:
  ```js
  const { price: currentPrice, loading: priceLoading, status: priceStatus } =
    usePriceUpdater(calculatorState.symbol, 3000)
  ```

---

## Auto / Manual Price Update Toggle

**State:** `autoPriceUpdate` — boolean, managed in `useCalculator` hook (`src/hooks/useCalculator.js`), initialized to `true`

**How it works:**
- `usePriceUpdater` polls unconditionally — it always fetches the latest price on its interval regardless of the toggle state
- The toggle gates whether the polled price is *applied* to the entry price input:
  ```js
  useEffect(() => {
    if (calculatorState.autoPriceUpdate && currentPrice && currentPrice !== calculatorState.entryPrice) {
      calculatorState.handleEntryPriceChange(currentPrice.toString())
    }
  }, [currentPrice, calculatorState.autoPriceUpdate, ...])
  ```
  Source: `src/BinanceFuturesCalculatorNew.jsx` lines 15–19
- When `autoPriceUpdate` is `false`, the user's manually typed entry price is preserved even as new poll results arrive
- The toggle state and the `setAutoPriceUpdate` setter are passed as props to `TradeSetup` (`src/components/TradeSetup.jsx`) for the UI control

**Summary:** Polling always runs when a symbol is selected. The auto/manual toggle only controls whether each new polled price overwrites the entry price field.

---

## Authentication & Identity

None. All API calls are unauthenticated public endpoints. No API keys, tokens, or user accounts are involved.

---

## Data Storage

**Databases:** None

**File Storage:** None

**Caching:** None — no localStorage, sessionStorage, IndexedDB, or in-memory cache. Symbol list and prices are re-fetched fresh on every page load.

---

## Monitoring & Observability

**Error Tracking:** None — errors are logged only to `console.error`

**Analytics:** None

---

## CI/CD & Deployment

**Hosting:** Not configured in codebase (no Vercel, Netlify, or deployment config files present)

**CI Pipeline:** None detected (no `.github/workflows/`, no CI config files)

---

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None — the app is read-only relative to Binance; it never writes orders or account data
