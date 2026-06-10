// Binance Futures API service functions

const BINANCE_API_BASE = 'https://fapi.binance.com/fapi/v1'

// Abort hung requests so a dead socket can't leave fetches pending forever —
// a timed-out request frees the connection and the next poll retries fresh.
const PRICE_TIMEOUT_MS = 4000
const EXCHANGE_INFO_TIMEOUT_MS = 15000

// Fetch all active futures symbols
export const fetchFuturesSymbols = async () => {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/exchangeInfo`, {
      signal: AbortSignal.timeout(EXCHANGE_INFO_TIMEOUT_MS),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    // Filter for active USDT futures pairs (all contract types)
    const symbols = data.symbols
      .filter(symbol => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === 'USDT'
        // Include all contract types: PERPETUAL, CURRENT_QUARTER, NEXT_QUARTER, PERPETUAL_DELIVERING
      )
      .map(symbol => ({
        symbol: symbol.symbol,
        baseAsset: symbol.baseAsset,
        quoteAsset: symbol.quoteAsset,
        contractType: symbol.contractType,
        deliveryDate: symbol.deliveryDate || null,
        pricePrecision: symbol.pricePrecision,
        quantityPrecision: symbol.quantityPrecision,
      }))
      .sort((a, b) => {
        // Sort perpetuals first, then delivery contracts by delivery date
        if (a.contractType === 'PERPETUAL' && b.contractType !== 'PERPETUAL') return -1
        if (a.contractType !== 'PERPETUAL' && b.contractType === 'PERPETUAL') return 1
        
        // Within same contract type, sort alphabetically by base asset, then by delivery date
        const baseAssetCompare = a.baseAsset.localeCompare(b.baseAsset)
        if (baseAssetCompare !== 0) return baseAssetCompare
        
        // If same base asset, sort by delivery date (earlier dates first)
        if (a.deliveryDate && b.deliveryDate) {
          return new Date(a.deliveryDate) - new Date(b.deliveryDate)
        }
        
        return a.symbol.localeCompare(b.symbol)
      })
    
    return symbols
  } catch (error) {
    console.error('Error fetching futures symbols:', error)
    return []
  }
}

// Fetch current price for a symbol
export const fetchSymbolPrice = async (symbol) => {
  try {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbol=${symbol}`, {
      signal: AbortSignal.timeout(PRICE_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return {
      symbol: data.symbol,
      price: parseFloat(data.price),
      timestamp: Date.now()
    }
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}

// Fetch prices for multiple symbols
export const fetchMultiplePrices = async (symbols) => {
  try {
    const symbolsParam = symbols.map(s => `"${s}"`).join(',')
    const response = await fetch(`${BINANCE_API_BASE}/ticker/price?symbols=[${symbolsParam}]`, {
      signal: AbortSignal.timeout(PRICE_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    const prices = {}
    data.forEach(item => {
      prices[item.symbol] = {
        price: parseFloat(item.price),
        timestamp: Date.now()
      }
    })
    
    return prices
  } catch (error) {
    console.error('Error fetching multiple prices:', error)
    return {}
  }
}