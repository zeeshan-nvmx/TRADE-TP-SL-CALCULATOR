import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchFuturesSymbols, fetchSymbolPrice } from '../services/binanceAPI'

export const useBinanceSymbols = () => {
  const [symbols, setSymbols] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadSymbols = async () => {
      try {
        setLoading(true)
        const fetchedSymbols = await fetchFuturesSymbols()
        setSymbols(fetchedSymbols)
        setError(null)
      } catch (err) {
        setError(err.message)
        console.error('Failed to load Binance symbols:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSymbols()
  }, [])

  return { symbols, loading, error }
}

export const usePriceUpdater = (symbol, intervalMs = 3000) => {
  const [price, setPrice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [status, setStatus] = useState('disconnected') // 'connected', 'connecting', 'disconnected', 'error'
  const inFlightRef = useRef(false)

  const fetchPrice = useCallback(async () => {
    if (!symbol) return
    // Skip this tick if the previous request is still pending — it will either
    // resolve or be aborted by its timeout, so requests never pile up.
    if (inFlightRef.current) return
    inFlightRef.current = true

    try {
      setLoading(true)
      // Stay 'connected' during routine polls — only show 'connecting' from a cold/error state
      setStatus((prev) => (prev === 'connected' ? 'connected' : 'connecting'))
      const priceData = await fetchSymbolPrice(symbol)
      
      if (priceData) {
        setPrice(priceData.price)
        setLastUpdate(new Date())
        setError(null)
        setStatus('connected')
      } else {
        setError('No price data received')
        setStatus('error')
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
      console.error(`Failed to fetch price for ${symbol}:`, err)
    } finally {
      inFlightRef.current = false
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    if (!symbol) {
      setStatus('disconnected')
      return
    }

    // Initial fetch
    fetchPrice()

    // Set up interval for auto-updates
    const interval = setInterval(fetchPrice, intervalMs)

    // Cleanup
    return () => {
      clearInterval(interval)
      setStatus('disconnected')
    }
  }, [symbol, intervalMs, fetchPrice])

  return {
    price,
    loading,
    error,
    lastUpdate,
    status,
    refetch: fetchPrice
  }
}