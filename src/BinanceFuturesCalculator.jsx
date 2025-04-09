import React, { useState, useEffect, useCallback } from 'react'

// Helper function for safe division
const safeDivide = (numerator, denominator) => {
  // Prevent division by zero or non-numeric values
  if (!denominator || isNaN(denominator) || !isFinite(denominator)) {
    return 0
  }
  const result = numerator / denominator
  return isNaN(result) || !isFinite(result) ? 0 : result
}

// Helper function to parse float input, returning null for invalid/empty
const parseFloatInput = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

// Helper function for formatting numbers, handling NaN/Infinity
const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A'
  // Avoid -0.00 representation
  const fixed = num.toFixed(decimals)
  return fixed === `-0.${'0'.repeat(decimals)}` ? `0.${'0'.repeat(decimals)}` : fixed
}
const formatHighPrecision = (num, decimals = 6) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A'
  if (Math.abs(num) > 0 && Math.abs(num) < 1e-4) {
    decimals = 8
  }
  const fixed = num.toFixed(decimals)
  return fixed === `-0.${'0'.repeat(decimals)}` ? `0.${'0'.repeat(decimals)}` : fixed
}
const formatPrice = (num) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
    // Handle Infinity specifically for SHORT 1x Liq
    if (num === Infinity) return '∞'
    return 'N/A'
  }
  let decimals = 2
  if (num > 0 && num < 1) decimals = 6
  else if (num > 0 && num < 100) decimals = 4
  const fixed = num.toFixed(decimals)
  return fixed === `-0.${'0'.repeat(decimals)}` ? `0.${'0'.repeat(decimals)}` : fixed
}

const BinanceFuturesCalculator = () => {
  // State Definitions
  const [exchange, setExchange] = useState('binance')
  const exchangeFees = {
    binance: { maker: 0.0002, taker: 0.0004, name: 'Binance' },
    bybit: { maker: 0.0001, taker: 0.0006, name: 'Bybit' },
  }

  const [accountSizeInput, setAccountSizeInput] = useState('10000') 
  const [accountSize, setAccountSize] = useState(10000)

  const [symbol, setSymbol] = useState('BTCUSDT')

  const [leverageInput, setLeverageInput] = useState('35') 
  const [leverage, setLeverage] = useState(35)

  const [exceedsAccount, setExceedsAccount] = useState(false)
  const [requiredAccountSize, setRequiredAccountSize] = useState(0)

  const [tradeDirection, setTradeDirection] = useState('LONG')

  const [entryPriceInput, setEntryPriceInput] = useState('76900') 
  const [entryPrice, setEntryPrice] = useState(76900)

  // Initialize TP state with calculated price based on initial entry/direction
  const initialEntryPrice = parseFloatInput(entryPriceInput)
  const initialTradeDirection = 'LONG'
  const initialTakeProfitsState = [
    { enabled: true, priceInput: '', price: null, percentInput: '6', percent: 6, quantityInput: '100', quantity: 100, profit: 0, profitPercent: 0 }, 
    { enabled: false, priceInput: '', price: null, percentInput: '3', percent: 3, quantityInput: '0', quantity: 0, profit: 0, profitPercent: 0 },
    { enabled: false, priceInput: '', price: null, percentInput: '5', percent: 5, quantityInput: '0', quantity: 0, profit: 0, profitPercent: 0 },
  ].map((tp) => {
    const tpPercent = parseFloatInput(tp.percentInput)
    if (initialEntryPrice && initialEntryPrice > 0 && tpPercent !== null) {
      const price = initialEntryPrice * (1 + (initialTradeDirection === 'LONG' ? tpPercent : -tpPercent) / 100)
      return { ...tp, price: price > 0 ? price : 0, priceInput: price > 0 ? price.toFixed(8) : '0' }
    }
    return tp
  })
  const [takeProfits, setTakeProfits] = useState(initialTakeProfitsState)

  const [useStopLoss, setUseStopLoss] = useState(true) 
  const [stopLossPriceInput, setStopLossPriceInput] = useState('') 
  const [stopLossPrice, setStopLossPrice] = useState(null)
  const [stopLossPercentInput, setStopLossPercentInput] = useState('5') 
  const [stopLossPercent, setStopLossPercent] = useState(5)

  const [lastUpdated, setLastUpdated] = useState({
    tp: Array(3).fill('percent'),
    sl: 'percent',
  })

  const [calculationMode, setCalculationMode] = useState('risk') 

  const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('500') // Default, irrelevant in risk mode initially
  const [positionSizeUSDT, setPositionSizeUSDT] = useState(500)

  const [riskPercentInput, setRiskPercentInput] = useState('5') 
  const [riskPercent, setRiskPercent] = useState(5)

  // Calculated States
  const [quantity, setQuantity] = useState(0)
  const [effectiveMargin, setEffectiveMargin] = useState(0)
  const [lossAmount, setLossAmount] = useState(0)
  const [lossPercent, setLossPercent] = useState(0)
  const [riskRewardRatio, setRiskRewardRatio] = useState(NaN)
  const [liquidationPrice, setLiquidationPrice] = useState(NaN)
  const [realLiquidationPrice, setRealLiquidationPrice] = useState(NaN)
  const [totalPositionSize, setTotalPositionSize] = useState(0)
  const [weightedTakeProfit, setWeightedTakeProfit] = useState(0)

  const [entryFee, setEntryFee] = useState(0)
  const [exitFeeTP, setExitFeeTP] = useState(0)
  const [exitFeeSL, setExitFeeSL] = useState(0)
  const [totalFeesTP, setTotalFeesTP] = useState(0)
  const [totalFeesSL, setTotalFeesSL] = useState(0)

  // Input Handlers 
  const handleAccountSizeChange = (value) => {
    setAccountSizeInput(value)
    const p = parseFloatInput(value)
    setAccountSize(p !== null && p >= 0 ? p : 0)
  }
  const handleLeverageChange = (value) => {
    setLeverageInput(value)
    const p = parseInt(value, 10)
    setLeverage(!isNaN(p) ? Math.max(1, Math.min(125, p)) : 1)
  }
  const handleEntryPriceChange = (value) => {
    setEntryPriceInput(value)
    const p = parseFloatInput(value)
    setEntryPrice(p !== null && p > 0 ? p : 0)
  }
  const handlePositionSizeChange = (value) => {
    setPositionSizeUSDTInput(value)
    const p = parseFloatInput(value)
    setPositionSizeUSDT(p !== null && p >= 0 ? p : 0)
  }
  const handleRiskPercentChange = (value) => {
    setRiskPercentInput(value)
    const p = parseFloatInput(value)
    setRiskPercent(p !== null && p >= 0 ? p : 0)
  }

  // TP/SL Price/Percent Update Functions (Memoized)
  const updateTPPriceFromPercent = useCallback((index, currentEntryPrice, currentTradeDirection, currentTakeProfits) => {
    const tpPercent = parseFloatInput(currentTakeProfits[index].percentInput)
    if (currentEntryPrice === null || currentEntryPrice <= 0 || tpPercent === null) return currentTakeProfits[index]
    let newPrice = currentEntryPrice * (1 + (currentTradeDirection === 'LONG' ? tpPercent : -tpPercent) / 100)
    return { ...currentTakeProfits[index], price: newPrice > 0 ? newPrice : 0, priceInput: newPrice > 0 ? newPrice.toFixed(8) : '0' }
  }, [])

  const updateSLPriceFromPercent = useCallback(
    (currentEntryPrice, currentTradeDirection, currentStopLossPercentInput) => {
      const slPercent = parseFloatInput(currentStopLossPercentInput)
      if (currentEntryPrice === null || currentEntryPrice <= 0 || slPercent === null) return { price: stopLossPrice, priceInput: stopLossPriceInput }
      let newSLPrice = currentEntryPrice * (1 + (currentTradeDirection === 'LONG' ? -slPercent : slPercent) / 100)
      return { price: newSLPrice > 0 ? newSLPrice : 0, priceInput: newSLPrice > 0 ? newSLPrice.toFixed(8) : '0' }
    },
    [stopLossPrice, stopLossPriceInput]
  ) // Dependencies are fallback values

  // Input Handlers for TP/SL
  const handleTakeProfitChange = (index, field, value) => {
    const newTakeProfits = [...takeProfits]
    const currentEntry = entryPrice
    const newLastUpdated = { ...lastUpdated }
    if (field === 'priceInput') {
      newTakeProfits[index].priceInput = value
      const parsedPrice = parseFloatInput(value)
      if (parsedPrice !== null && parsedPrice > 0 && currentEntry > 0) {
        newTakeProfits[index].price = parsedPrice
        let newPercent = safeDivide(parsedPrice - currentEntry, currentEntry) * 100 * (tradeDirection === 'LONG' ? 1 : -1)
        newTakeProfits[index].percent = newPercent
        newTakeProfits[index].percentInput = newPercent.toFixed(2)
        newLastUpdated.tp[index] = 'price'
      } else {
        newTakeProfits[index].price = null
      }
    } else if (field === 'percentInput') {
      newTakeProfits[index].percentInput = value
      const parsedPercent = parseFloatInput(value)
      if (parsedPercent !== null) {
        newTakeProfits[index].percent = parsedPercent
        newLastUpdated.tp[index] = 'percent'
        const updatedTP = updateTPPriceFromPercent(index, currentEntry, tradeDirection, newTakeProfits)
        newTakeProfits[index] = updatedTP
      } else {
        newTakeProfits[index].percent = null
      }
    } else if (field === 'enabled') {
      newTakeProfits[index].enabled = value
      if (!newTakeProfits[index].enabled) {
        newTakeProfits[index].quantity = 0
        newTakeProfits[index].quantityInput = '0'
      }
    } else if (field === 'quantityInput') {
      newTakeProfits[index].quantityInput = value
      let parsedQuantity = parseFloatInput(value)
      newTakeProfits[index].quantity = parsedQuantity !== null ? Math.max(0, Math.min(100, parsedQuantity)) : 0
    }
    setLastUpdated(newLastUpdated)
    setTakeProfits(newTakeProfits)
  }
  const handleTakeProfitPreset = (index, percent) => {
    const newTakeProfits = [...takeProfits]
    const newLastUpdated = { ...lastUpdated }
    const currentEntry = entryPrice
    newTakeProfits[index].percent = percent
    newTakeProfits[index].percentInput = percent.toString()
    newLastUpdated.tp[index] = 'percent'
    const updatedTP = updateTPPriceFromPercent(index, currentEntry, tradeDirection, newTakeProfits)
    newTakeProfits[index] = updatedTP
    setTakeProfits(newTakeProfits)
    setLastUpdated(newLastUpdated)
  }
  const handleStopLossPriceChange = (value) => {
    setStopLossPriceInput(value)
    const parsedPrice = parseFloatInput(value)
    const currentEntry = entryPrice
    if (parsedPrice !== null && parsedPrice > 0 && currentEntry > 0) {
      setStopLossPrice(parsedPrice)
      let newPercent = safeDivide(currentEntry - parsedPrice, currentEntry) * 100 * (tradeDirection === 'LONG' ? 1 : -1)
      setStopLossPercent(newPercent)
      setStopLossPercentInput(newPercent.toFixed(2))
      setLastUpdated({ ...lastUpdated, sl: 'price' })
    } else {
      setStopLossPrice(null)
    }
  }
  const handleStopLossPercentChange = (value) => {
    setStopLossPercentInput(value)
    const parsedPercent = parseFloatInput(value)
    if (parsedPercent !== null) {
      setStopLossPercent(parsedPercent)
      setLastUpdated({ ...lastUpdated, sl: 'percent' })
      const { price: newSLPrice, priceInput: newSLPriceInput } = updateSLPriceFromPercent(entryPrice, tradeDirection, value)
      setStopLossPrice(newSLPrice)
      setStopLossPriceInput(newSLPriceInput)
    } else {
      setStopLossPercent(null)
    }
  }
  const handleStopLossPreset = (percent) => {
    setStopLossPercent(percent)
    setStopLossPercentInput(percent.toString())
    setLastUpdated({ ...lastUpdated, sl: 'percent' })
    const { price: newSLPrice, priceInput: newSLPriceInput } = updateSLPriceFromPercent(entryPrice, tradeDirection, percent.toString())
    setStopLossPrice(newSLPrice)
    setStopLossPriceInput(newSLPriceInput)
  }

  // Main Calculation Logic
  const calculateAll = () => {
    // Inputs
    const currentAccountSize = accountSize > 0 ? accountSize : 0
    const currentLeverage = leverage >= 1 ? leverage : 1
    const currentEntryPrice = entryPrice > 0 ? entryPrice : 0
    const currentPositionSizeUSDT = positionSizeUSDT >= 0 ? positionSizeUSDT : 0
    const currentRiskPercent = riskPercent >= 0 ? riskPercent : 0
    const currentTakeProfits = takeProfits // Use state directly

    // SL Validation
    let currentStopLossPriceVal = null
    let priceDifference = 0
    let isStopLossValid = false
    if (useStopLoss) {
      currentStopLossPriceVal = stopLossPrice !== null && stopLossPrice > 0 ? stopLossPrice : null
      if (currentEntryPrice > 0 && currentStopLossPriceVal !== null) {
        priceDifference = tradeDirection === 'LONG' ? currentEntryPrice - currentStopLossPriceVal : currentStopLossPriceVal - currentEntryPrice
        isStopLossValid = priceDifference > 0
        if (!isStopLossValid) priceDifference = 0
      }
    }

    // Early Exit
    if (currentEntryPrice <= 0 || currentLeverage < 1) {
      /* Reset states... */ return
    }

    // Position Sizing
    let calculatedQuantity = 0,
      calculatedMargin = 0,
      calculatedPositionSize = 0,
      riskAmount = 0
    const effectiveCalculationMode = calculationMode === 'risk' && useStopLoss && isStopLossValid ? 'risk' : 'fixed'

    if (effectiveCalculationMode === 'risk') {
      riskAmount = currentAccountSize * (currentRiskPercent / 100)
      calculatedQuantity = safeDivide(riskAmount, priceDifference)
      calculatedPositionSize = calculatedQuantity * currentEntryPrice
      calculatedMargin = safeDivide(calculatedPositionSize, currentLeverage)
    } else {
      // Fixed mode or fallback
      calculatedMargin = currentPositionSizeUSDT
      calculatedPositionSize = calculatedMargin * currentLeverage
      calculatedQuantity = safeDivide(calculatedPositionSize, currentEntryPrice)
      if (useStopLoss && isStopLossValid) riskAmount = calculatedQuantity * priceDifference
      else riskAmount = 0
    }
    setExceedsAccount(calculatedMargin > currentAccountSize)
    setRequiredAccountSize(calculatedMargin)

    // Fees
    const fees = exchangeFees[exchange]
    const entryFeeRate = fees.taker
    const tpFeeRate = fees.maker
    const slFeeRate = fees.taker
    const calcEntryFee = calculatedPositionSize * entryFeeRate
    let calcExitFeeTP = 0,
      calculatedWeightedProfit = 0

    // TP Calculations
    const updatedTPResults = currentTakeProfits.map((tp) => {
      let tpProfit = 0,
        tpProfitPercent = 0
      if (tp.enabled && tp.price !== null && tp.price > 0 && tp.quantity > 0 && calculatedQuantity > 0) {
        const tpPortionQuantity = calculatedQuantity * (tp.quantity / 100)
        const tpPortionPositionSize = calculatedPositionSize * (tp.quantity / 100)
        let grossProfit = tpPortionQuantity * (tradeDirection === 'LONG' ? tp.price - currentEntryPrice : currentEntryPrice - tp.price)
        const isProfitTarget = (tradeDirection === 'LONG' && tp.price > currentEntryPrice) || (tradeDirection === 'SHORT' && tp.price < currentEntryPrice)
        const exitFeeRateForTP = isProfitTarget ? tpFeeRate : slFeeRate
        const entryFeePortion = calcEntryFee * (tp.quantity / 100)
        const exitFeePortion = tpPortionPositionSize * exitFeeRateForTP
        calcExitFeeTP += exitFeePortion
        tpProfit = grossProfit - entryFeePortion - exitFeePortion
        tpProfitPercent = safeDivide(tpProfit, currentAccountSize) * 100
        calculatedWeightedProfit += tpProfit
      }
      return { profit: tpProfit, profitPercent: tpProfitPercent }
    })
    // Update TP state once with results
    setTakeProfits(currentTakeProfits.map((tp, index) => ({ ...tp, ...updatedTPResults[index] })))

    // SL Calculations
    const calcExitFeeSL = useStopLoss && isStopLossValid ? calculatedPositionSize * slFeeRate : 0
    let calcLossAmount = 0,
      calcLossPercent = 0
    if (useStopLoss && isStopLossValid && calculatedQuantity > 0) {
      const grossLoss = calculatedQuantity * priceDifference
      calcLossAmount = grossLoss + calcEntryFee + calcExitFeeSL
      calcLossPercent = safeDivide(calcLossAmount, currentAccountSize) * 100
    }

    // R/R
    const calcRiskRewardRatio = useStopLoss && isStopLossValid && calcLossAmount > 0 ? safeDivide(calculatedWeightedProfit, calcLossAmount) : NaN

    // Liquidation Price
    let calcLiquidationPrice = NaN
    let calcRealLiquidationPrice = NaN
    const MMR = 0.005 // Maintenance Margin Rate

    if (currentLeverage > 1 && calculatedQuantity > 0 && currentEntryPrice > 0) {
      const qty = calculatedQuantity
      const entry = currentEntryPrice
      const initialMargin = calculatedMargin > 0 ? calculatedMargin : safeDivide(calculatedPositionSize, currentLeverage) // Ensure initialMargin is calculated even if 0 input
      const accountBalance = currentAccountSize

      if (tradeDirection === 'LONG') {
        // Standard Liq (approximates Isolated using only initial margin)
        const stdDenominator = qty * (1 - MMR)
        if (stdDenominator !== 0) {
          // Formula: (Qty * Entry - InitialMargin) / (Qty * (1 - MMR)) --- derived from InitialMargin + PNL = MM
          calcLiquidationPrice = Math.max(0, safeDivide(qty * entry - initialMargin, stdDenominator))
        }

        // Real Liq (Cross Margin using full account balance)
        const realDenominator = qty * (1 - MMR)
        if (realDenominator !== 0) {
          // Formula: (Qty * Entry - AccountBalance) / (Qty * (1 - MMR)) --- derived from AccountBalance + PNL = MM
          calcRealLiquidationPrice = Math.max(0, safeDivide(qty * entry - accountBalance, realDenominator))
        }
      } else {
        // SHORT
        // Standard Liq
        const stdDenominator = qty * (1 + MMR)
        if (stdDenominator !== 0) {
          // Formula: (InitialMargin + Qty * Entry) / (Qty * (1 + MMR))
          calcLiquidationPrice = safeDivide(initialMargin + qty * entry, stdDenominator)
        }
        // Real Liq
        const realDenominator = qty * (1 + MMR)
        if (realDenominator !== 0) {
          // Formula: (AccountBalance + Qty * Entry) / (Qty * (1 + MMR))
          calcRealLiquidationPrice = safeDivide(accountBalance + qty * entry, realDenominator)
        }
      }
    } else if (currentLeverage === 1) {
      // 1x Leverage
      calcLiquidationPrice = tradeDirection === 'LONG' ? 0 : Infinity // Virtually no liquidation
      calcRealLiquidationPrice = calcLiquidationPrice
    }

    // Update State
    setQuantity(calculatedQuantity)
    setEffectiveMargin(calculatedMargin)
    setTotalPositionSize(calculatedPositionSize)
    setWeightedTakeProfit(calculatedWeightedProfit)
    setEntryFee(calcEntryFee)
    setExitFeeTP(calcExitFeeTP)
    setExitFeeSL(calcExitFeeSL)
    setTotalFeesTP(calcEntryFee + calcExitFeeTP)
    setTotalFeesSL(calcEntryFee + calcExitFeeSL)
    setLossAmount(calcLossAmount)
    setLossPercent(calcLossPercent)
    setRiskRewardRatio(calcRiskRewardRatio)
    setLiquidationPrice(calcLiquidationPrice)
    setRealLiquidationPrice(calcRealLiquidationPrice)
  }

  // Effect 1: Run main calculation when primary inputs change
  useEffect(() => {
    calculateAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accountSize,
    leverage,
    tradeDirection,
    entryPrice,
    calculationMode,
    positionSizeUSDT,
    riskPercent,
    exchange,
    useStopLoss,
    stopLossPrice,
    stopLossPercent,
    JSON.stringify(takeProfits.map((tp) => ({ enabled: tp.enabled, quantity: tp.quantity, price: tp.price, percent: tp.percent }))),
  ])

  // Effect 2: Update dependent prices when entry/direction/SL settings change
  useEffect(() => {
    const currentEntry = entryPrice
    if (currentEntry <= 0) return
    let tpsChanged = false
    const newTPs = takeProfits.map((tp, index) => {
      if (tp.price === null || lastUpdated.tp[index] === 'percent') {
        const updatedTP = updateTPPriceFromPercent(index, currentEntry, tradeDirection, takeProfits)
        if (updatedTP.price !== tp.price) {
          tpsChanged = true
          return updatedTP
        }
      }
      return tp
    })
    if (tpsChanged) {
      setTakeProfits(newTPs)
    }

    if (useStopLoss && (stopLossPrice === null || lastUpdated.sl === 'percent')) {
      const { price: newSLPrice, priceInput: newSLPriceInput } = updateSLPriceFromPercent(currentEntry, tradeDirection, stopLossPercentInput)
      if (newSLPrice !== stopLossPrice) {
        setStopLossPrice(newSLPrice)
        setStopLossPriceInput(newSLPriceInput)
      }
    }
    // This effect updates prices based on percentages when primary inputs change.
    // It avoids triggering full calculateAll directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPrice, tradeDirection, useStopLoss, stopLossPercentInput]) // Removed lastUpdated/callbacks

  // Presets
  const tpPercentPresets = [1, 2, 3, 5, 6, 7, 9, 10] 
  const slPercentPresets = [1, 1.5, 2, 3, 5, 10] 

  // SL Distance for Display
  const getSLDistance = () => {
     if (useStopLoss && entryPrice > 0 && stopLossPrice !== null && stopLossPrice > 0) {
      let d = tradeDirection === 'LONG' ? entryPrice - stopLossPrice : stopLossPrice - entryPrice
      return d > 0 ? d : null
    }
    return null
  }
  const slDistance = getSLDistance()

  return (
    <div className='max-w-4xl mx-auto p-4 dark:bg-black bg-white text-sm font-sans'>
      {' '}
      <h1 className='text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100'>Futures Calculator</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Left column - Inputs */}
        <div className='space-y-4'>
          {/* Trade Setup */}
          <div className='space-y-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg'>
            <div className='flex justify-between items-center mb-2'>
              <h2 className='text-base font-medium text-neutral-900 dark:text-neutral-100'>Trade Setup</h2>
              <div className='flex gap-2'>
                <button
                  onClick={() => setExchange('binance')}
                  className={`h-8 text-xs px-3 rounded-md transition-colors ${
                    exchange === 'binance'
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                  {' '}
                  Binance{' '}
                </button>
                <button
                  onClick={() => setExchange('bybit')}
                  className={`h-8 text-xs px-3 rounded-md transition-colors ${
                    exchange === 'bybit'
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                  {' '}
                  Bybit{' '}
                </button>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Account Size (USDT)</label>
                <input
                  type='text'
                  inputMode='decimal'
                  value={accountSizeInput}
                  onChange={(e) => handleAccountSizeChange(e.target.value)}
                  className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                  placeholder='e.g., 10000'
                />
              </div>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Symbol</label>
                <input
                  type='text'
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                  placeholder='e.g., BTCUSDT'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Leverage</label>
                <div className='space-y-1'>
                  <div className='relative'>
                    <input
                      type='text'
                      inputMode='numeric'
                      pattern='[0-9]*'
                      value={leverageInput}
                      onChange={(e) => handleLeverageChange(e.target.value)}
                      className={`w-full h-9 pl-3 pr-8 py-1 text-sm rounded-md border ${
                        exceedsAccount
                          ? 'border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black'
                      } text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100`}
                      placeholder='1-125'
                    />
                    <span className='absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-neutral-400'>x</span>
                    {exceedsAccount && (
                      <div
                        className='absolute -right-5 top-1/2 transform -translate-y-1/2 text-amber-500 dark:text-amber-400'
                        title={`Requires ${formatNumber(requiredAccountSize)} USDT margin (${formatNumber(requiredAccountSize - accountSize)} USDT over)`}>
                        {' '}
                        ⚠️{' '}
                      </div>
                    )}
                  </div>
                  {exceedsAccount && <p className='text-xs text-amber-600 dark:text-amber-400'> Margin requires {formatNumber(requiredAccountSize)} USDT </p>}
                  <div className='flex flex-wrap gap-1'>
                    {[5, 10, 20, 35, 50, 100].map((lev) => (
                      <button
                        key={lev}
                        onClick={() => handleLeverageChange(lev.toString())}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                          leverage === lev
                            ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                            : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}>
                        {' '}
                        {lev}x{' '}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Direction</label>
                <div className='grid grid-cols-2 gap-1'>
                  <button
                    onClick={() => setTradeDirection('LONG')}
                    className={`h-9 text-sm rounded-md transition-colors ${
                      tradeDirection === 'LONG'
                        ? 'bg-green-600 text-white font-medium'
                        : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}>
                    {' '}
                    LONG{' '}
                  </button>
                  <button
                    onClick={() => setTradeDirection('SHORT')}
                    className={`h-9 text-sm rounded-md transition-colors ${
                      tradeDirection === 'SHORT'
                        ? 'bg-red-600 text-white font-medium'
                        : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}>
                    {' '}
                    SHORT{' '}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Entry Price</label>
              <input
                type='text'
                inputMode='decimal'
                value={entryPriceInput}
                onChange={(e) => handleEntryPriceChange(e.target.value)}
                className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                placeholder='e.g., 76900'
              />
            </div>
          </div>

          {/* Take Profit Targets */}
          <div className='space-y-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg'>
            <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Take Profit Targets</h3>
            {takeProfits.map((tp, index) => (
              <div
                key={`tp-${index}`}
                className={`p-3 rounded-md border ${
                  tp.enabled ? 'border-neutral-300 dark:border-neutral-600' : 'border-neutral-200 dark:border-neutral-800 opacity-60'
                }`}>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={tp.enabled}
                      onChange={(e) => handleTakeProfitChange(index, 'enabled', e.target.checked)}
                      className='h-4 w-4 rounded border-neutral-400 dark:border-neutral-600 text-blue-600 focus:ring-blue-500'
                    />
                    <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>TP {index + 1}</span>
                  </div>
                  {tp.enabled && formatNumber(tp.profit) !== 'N/A' && tp.profit !== 0 && (
                    <div className={`text-xs font-medium ${tp.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {' '}
                      Profit: {tp.profit > 0 ? '+' : ''}
                      {formatNumber(tp.profit)} USDT{' '}
                    </div>
                  )}
                </div>
                {tp.enabled && (
                  <div className='space-y-2'>
                    <div className='grid grid-cols-3 gap-2 items-center'>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>Quantity</label>
                      <div className='flex col-span-2'>
                        <input
                          type='text'
                          inputMode='decimal'
                          value={tp.quantityInput}
                          onChange={(e) => handleTakeProfitChange(index, 'quantityInput', e.target.value)}
                          className='w-full h-8 px-2 py-1 text-xs rounded-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                          placeholder='0-100'
                        />
                        <div className='px-2 flex items-center text-xs rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'>
                          %
                        </div>
                      </div>
                    </div>
                    <div className='grid grid-cols-3 gap-2 items-center'>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>Price</label>
                      <div className='flex col-span-2 relative'>
                        <input
                          type='text'
                          inputMode='decimal'
                          value={tp.priceInput}
                          onChange={(e) => handleTakeProfitChange(index, 'priceInput', e.target.value)}
                          className={`w-full h-8 px-2 py-1 text-xs rounded-md border ${
                            (tradeDirection === 'LONG' && tp.price !== null && entryPrice > 0 && tp.price < entryPrice) ||
                            (tradeDirection === 'SHORT' && tp.price !== null && entryPrice > 0 && tp.price > entryPrice)
                              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 focus:ring-red-500'
                              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black focus:ring-neutral-950'
                          } text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 dark:focus:ring-neutral-100`}
                          placeholder='Target price'
                        />
                        {((tradeDirection === 'LONG' && tp.price !== null && entryPrice > 0 && tp.price < entryPrice) ||
                          (tradeDirection === 'SHORT' && tp.price !== null && entryPrice > 0 && tp.price > entryPrice)) && (
                          <div
                            className='absolute -right-5 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400'
                            title={tradeDirection === 'LONG' ? 'TP below entry' : 'TP above entry'}>
                            {' '}
                            ⚠️{' '}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className='grid grid-cols-3 gap-2 items-center'>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>% from Entry</label>
                      <div className='flex col-span-2'>
                        <input
                          type='text'
                          inputMode='decimal'
                          value={tp.percentInput}
                          onChange={(e) => handleTakeProfitChange(index, 'percentInput', e.target.value)}
                          className='w-full h-8 px-2 py-1 text-xs rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                          placeholder='e.g., 5'
                        />
                        <div className='px-2 flex items-center text-xs rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'>
                          %
                        </div>
                      </div>
                    </div>
                    <div className='flex flex-wrap gap-1 pt-1'>
                      {tpPercentPresets.map((percent) => (
                        <button
                          key={`tp-${index}-${percent}`}
                          onClick={() => handleTakeProfitPreset(index, percent)}
                          className={`text-xs px-2 py-1 rounded-md transition-colors ${
                            Math.abs(tp.percent - percent) < 0.01
                              ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                              : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}>
                          {' '}
                          {percent}%{' '}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stop Loss */}
          <div className='space-y-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100'>Stop Loss {tradeDirection === 'LONG' ? '↓' : '↑'}</h3>
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='useStopLossCheckbox'
                  checked={useStopLoss}
                  onChange={() => {
                    const newState = !useStopLoss
                    setUseStopLoss(newState)
                    if (!newState && calculationMode === 'risk') {
                      setCalculationMode('fixed')
                    }
                  }}
                  className='h-4 w-4 rounded mr-2 border-neutral-400 dark:border-neutral-600 text-blue-600 focus:ring-blue-500'
                />
                <label htmlFor='useStopLossCheckbox' className='text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer'>
                  Use Stop Loss
                </label>
              </div>
            </div>
            {useStopLoss ? (
              <div className='space-y-2'>
                <div className='grid grid-cols-3 gap-2 items-center'>
                  <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>Price</label>
                  <div className='flex col-span-2'>
                    <input
                      type='text'
                      inputMode='decimal'
                      value={stopLossPriceInput}
                      onChange={(e) => handleStopLossPriceChange(e.target.value)}
                      className='w-full h-8 px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                      placeholder='Stop price'
                    />
                  </div>
                </div>
                <div className='grid grid-cols-3 gap-2 items-center'>
                  <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>% from Entry</label>
                  <div className='flex col-span-2'>
                    <input
                      type='text'
                      inputMode='decimal'
                      value={stopLossPercentInput}
                      onChange={(e) => handleStopLossPercentChange(e.target.value)}
                      className='w-full h-8 px-2 py-1 text-xs rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                      placeholder='e.g., 2'
                    />
                    <div className='px-2 flex items-center text-xs rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'>
                      %
                    </div>
                  </div>
                </div>
                <div className='flex flex-wrap gap-1 pt-1'>
                  {slPercentPresets.map((percent) => (
                    <button
                      key={`sl-${percent}`}
                      onClick={() => handleStopLossPreset(percent)}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        Math.abs(stopLossPercent - percent) < 0.01
                          ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                          : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                      {' '}
                      {percent}%{' '}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
                {' '}
                <p className='text-xs text-blue-700 dark:text-blue-300'>
                  {' '}
                  No stop loss set. Risk limited by liquidation or manual intervention.
                  <br />
                  Risk % sizing disabled.{' '}
                </p>{' '}
              </div>
            )}
          </div>

          {/* Position Sizing */}
          <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
            <div className='flex justify-between items-center mb-2'>
              <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100'>Position Sizing</h3>
              <div className='flex space-x-1'>
                <button
                  onClick={() => setCalculationMode('fixed')}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    calculationMode === 'fixed'
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                  {' '}
                  Fixed USDT{' '}
                </button>
                <button
                  onClick={() => {
                    if (useStopLoss) setCalculationMode('risk')
                  }}
                  disabled={!useStopLoss}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    calculationMode === 'risk'
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  } ${!useStopLoss ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!useStopLoss ? 'Enable Stop Loss to use Risk %' : ''}>
                  {' '}
                  Risk %{' '}
                </button>
              </div>
            </div>
            {calculationMode === 'risk' && useStopLoss && (
              <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
                {' '}
                <p className='text-xs text-blue-700 dark:text-blue-300'>
                  {' '}
                  Calculates position size so hitting the Stop Loss risks the specified % of account size.{' '}
                </p>{' '}
              </div>
            )}
            {calculationMode === 'fixed' && (
              <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
                {' '}
                <p className='text-xs text-blue-700 dark:text-blue-300'> Sets position size based on the specified Margin multiplied by Leverage. </p>{' '}
              </div>
            )}
            {calculationMode === 'fixed' ? (
              <div className='space-y-2'>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 block'>Margin to Use (USDT)</label>
                <input
                  type='text'
                  inputMode='decimal'
                  value={positionSizeUSDTInput}
                  onChange={(e) => handlePositionSizeChange(e.target.value)}
                  className='w-full h-8 px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                  placeholder='e.g., 500'
                />
                <div className='flex flex-wrap gap-1 pt-1'>
                  {[100, 250, 500, 1000, 2500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handlePositionSizeChange(amount.toString())}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        positionSizeUSDT === amount
                          ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                          : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                      {' '}
                      {amount}{' '}
                    </button>
                  ))}
                </div>
              </div>
            ) : useStopLoss ? (
              <div className='space-y-2'>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 block'>Risk % of Account</label>
                <div className='flex col-span-2'>
                  <input
                    type='text'
                    inputMode='decimal'
                    value={riskPercentInput}
                    onChange={(e) => handleRiskPercentChange(e.target.value)}
                    className={`w-full h-8 px-2 py-1 text-xs rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100`}
                    placeholder='e.g., 2'
                  />
                  <div
                    className={`px-2 flex items-center text-xs rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400`}>
                    %
                  </div>
                </div>
                <div className='flex flex-wrap gap-1 pt-1'>
                  {[1, 2, 3, 5, 10].map((rp) => (
                    <button
                      key={rp}
                      onClick={() => handleRiskPercentChange(rp.toString())}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        riskPercent === rp
                          ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                          : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                      {' '}
                      {rp}%{' '}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>{' '}
        {/* End Left Column */}
        {/* Right column - Results */}
        <div className='space-y-4'>
          {/* Trade Analysis */}
          <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
            <h2 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Trade Analysis</h2>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Total Position (USDT)</label>
                <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'>
                  {' '}
                  {formatNumber(totalPositionSize)}{' '}
                </div>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                  {' '}
                  {calculationMode === 'fixed'
                    ? `= ${formatNumber(positionSizeUSDT)} × ${leverage}x`
                    : useStopLoss
                    ? `Risk: ${formatNumber(accountSize * (riskPercent / 100))} USDT`
                    : 'Fixed USDT Mode'}{' '}
                </p>
              </div>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Quantity ({symbol.replace(/USDT|USD|BUSD/g, '')})</label>
                <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'>
                  {' '}
                  {formatHighPrecision(quantity)}{' '}
                </div>
                {calculationMode === 'risk' && slDistance !== null && (
                  <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'> SL Dist: {formatPrice(slDistance)} </p>
                )}
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Required Margin</label>
                <div
                  className={`h-9 px-3 py-2 text-sm font-medium rounded-md border ${
                    exceedsAccount
                      ? 'border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'
                  }`}>
                  {' '}
                  {formatNumber(effectiveMargin)} USDT{' '}
                </div>
                {exceedsAccount && <p className='text-xs text-amber-600 dark:text-amber-400 mt-1'> Exceeds account by {formatNumber(effectiveMargin - accountSize)} </p>}
              </div>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Risk/Reward Ratio</label>
                <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'>
                  {' '}
                  {formatNumber(riskRewardRatio) !== 'N/A' ? `1 : ${formatNumber(riskRewardRatio)}` : 'N/A'}{' '}
                </div>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'> {useStopLoss ? `(Net Profit / Net Loss)` : `Requires Stop Loss`} </p>
              </div>
            </div>
          </div>

          {/* Fees Analysis */}
          <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
            <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>{exchangeFees[exchange].name} Fees</h3>
            <div className='grid grid-cols-3 gap-2 text-xs'>
              <div>
                {' '}
                <label className='font-medium text-neutral-500 dark:text-neutral-400 block'>Maker / Taker</label>{' '}
                <div className='mt-1 text-neutral-700 dark:text-neutral-300'>
                  {' '}
                  {(exchangeFees[exchange].maker * 100).toFixed(2)}% / {(exchangeFees[exchange].taker * 100).toFixed(2)}%{' '}
                </div>{' '}
              </div>
              <div>
                {' '}
                <label className='font-medium text-neutral-500 dark:text-neutral-400 block'>Entry Fee (Taker)</label>{' '}
                <div className='mt-1 text-red-500 dark:text-red-400'> {formatNumber(entryFee)} USDT </div>{' '}
              </div>
              <div>
                {' '}
                <label className='font-medium text-neutral-500 dark:text-neutral-400 block'>Exit Fee (Est.)</label>{' '}
                <div className='mt-1 text-red-500 dark:text-red-400'>
                  {' '}
                  TP: {formatNumber(exitFeeTP)} / SL: {formatNumber(exitFeeSL)}{' '}
                </div>{' '}
              </div>
            </div>
            <div className='text-xs'>
              {' '}
              <span className='font-medium text-neutral-500 dark:text-neutral-400'>Total Fees (Est.): </span>{' '}
              <span className='text-red-500 dark:text-red-400'>
                {' '}
                TP Scenario: {formatNumber(totalFeesTP)} ({formatNumber(safeDivide(totalFeesTP, totalPositionSize) * 100, 3)}%) / SL Scenario: {formatNumber(totalFeesSL)}{' '}
                ({formatNumber(safeDivide(totalFeesSL, totalPositionSize) * 100, 3)}%){' '}
              </span>{' '}
            </div>
          </div>

          {/* Liquidation Analysis */}
          <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
            <h2 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Liquidation Analysis</h2>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                {' '}
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Liquidation Price (Est.)</label>{' '}
                <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-red-500 dark:text-red-400'>
                  {' '}
                  {formatPrice(liquidationPrice)}{' '}
                </div>{' '}
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>Based on margin & MMR</p>{' '}
              </div>
              <div>
                {' '}
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Real Liq. Price (Cross)</label>{' '}
                <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-red-500 dark:text-red-400'>
                  {' '}
                  {formatPrice(realLiquidationPrice)}{' '}
                </div>{' '}
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>Includes account buffer</p>{' '}
              </div>
            </div>
            <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
              {' '}
              <p className='text-xs text-blue-700 dark:text-blue-300'>
                {' '}
                <strong>Liquidation buffer:</strong> {formatNumber(Math.max(0, accountSize - effectiveMargin))} USDT extra funds provide additional protection.{' '}
              </p>{' '}
            </div>
          </div>

          {/* Profit Scenarios */}
          <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
            <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Profit Scenarios (Net)</h3>
            {takeProfits.filter((tp) => tp.enabled && tp.price !== null).length > 0 ? (
              takeProfits
                .filter((tp) => tp.enabled && tp.price !== null)
                .map((tp, index) => {
                  const originalIndex = takeProfits.findIndex((originalTP) => originalTP === tp)
                  const isLossTarget =
                    (tradeDirection === 'LONG' && entryPrice > 0 && tp.price < entryPrice) || (tradeDirection === 'SHORT' && entryPrice > 0 && tp.price > entryPrice)
                  return (
                    <div
                      key={`profit-${originalIndex}`}
                      className={`p-2 border rounded-md space-y-1 ${
                        isLossTarget ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-neutral-200 dark:border-neutral-800'
                      }`}>
                      <div className='flex justify-between items-center'>
                        {' '}
                        <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>
                          {' '}
                          TP {originalIndex + 1} @ {formatPrice(tp.price)} ({formatNumber(tp.percent)}%){' '}
                        </span>{' '}
                        <span className='text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300'>
                          {' '}
                          {formatNumber(tp.quantity, 0)}% Qty{' '}
                        </span>{' '}
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        {' '}
                        <div>
                          {' '}
                          <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Profit Amount</label>{' '}
                          <div className={`px-2 py-1 text-xs rounded-md ${tp.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {' '}
                            {tp.profit >= 0 ? '+' : ''}
                            {formatNumber(tp.profit)} USDT{' '}
                          </div>{' '}
                        </div>{' '}
                        <div>
                          {' '}
                          <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Account % Gain</label>{' '}
                          <div
                            className={`px-2 py-1 text-xs rounded-md ${tp.profitPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {' '}
                            {tp.profitPercent >= 0 ? '+' : ''}
                            {formatNumber(tp.profitPercent)}%{' '}
                          </div>{' '}
                        </div>{' '}
                      </div>
                      {isLossTarget && <p className='text-xs text-red-500 dark:text-red-400'>Warning: TP target results in a loss.</p>}
                    </div>
                  )
                })
            ) : (
              <p className='text-xs text-neutral-500 dark:text-neutral-400'>Enable Take Profit targets to see profit scenarios.</p>
            )}
            {takeProfits.filter((tp) => tp.enabled).length > 0 && (
              <div className='p-2 border border-neutral-200 dark:border-neutral-800 rounded-md mt-2'>
                <div className='flex justify-between items-center'>
                  {' '}
                  <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>Combined Profit (If all TPs hit)</span>{' '}
                  <span className={`text-xs font-medium ${weightedTakeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {' '}
                    {weightedTakeProfit >= 0 ? '+' : ''}
                    {formatNumber(weightedTakeProfit)} USDT{' '}
                  </span>{' '}
                </div>
                <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                  {' '}
                  Final balance:{' '}
                  <span className={`font-medium ${weightedTakeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {' '}
                    {formatNumber(accountSize + weightedTakeProfit)} USDT{' '}
                  </span>{' '}
                </div>
                <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                  {' '}
                  Fees paid: <span className='font-medium text-red-500 dark:text-red-400'>{formatNumber(totalFeesTP)} USDT</span>{' '}
                </div>
              </div>
            )}
          </div>

          {/* Loss Scenario / Protection */}
          <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
            {useStopLoss ? (
              <>
                <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'> Loss Scenario (Net) </h3>
                {slDistance !== null ? (
                  <>
                    <p className='text-xs text-neutral-500 dark:text-neutral-400 -mt-2 mb-2'>
                      {' '}
                      If SL @ {formatPrice(stopLossPrice)} ({formatNumber(stopLossPercent)}%) is hit:{' '}
                    </p>
                    <div className='grid grid-cols-2 gap-2'>
                      {' '}
                      <div>
                        {' '}
                        <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Loss Amount</label>{' '}
                        <div className='px-2 py-1 text-xs rounded-md text-red-500 dark:text-red-400'> -{formatNumber(lossAmount)} USDT </div>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Account % Loss</label>{' '}
                        <div className='px-2 py-1 text-xs rounded-md text-red-500 dark:text-red-400'> -{formatNumber(lossPercent)}% </div>{' '}
                      </div>{' '}
                    </div>
                    <div className='p-2 border border-neutral-200 dark:border-neutral-800 rounded-md mt-2'>
                      {' '}
                      <div className='text-xs text-neutral-500 dark:text-neutral-400'>
                        {' '}
                        Final balance: <span className='font-medium text-red-500 dark:text-red-400'>{formatNumber(accountSize - lossAmount)} USDT</span>{' '}
                      </div>{' '}
                      <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                        {' '}
                        Fees paid: <span className='font-medium text-red-500 dark:text-red-400'>{formatNumber(totalFeesSL)} USDT</span>{' '}
                      </div>{' '}
                    </div>
                  </>
                ) : (
                  <p className='text-xs text-orange-600 dark:text-orange-400'>Invalid Stop Loss price (must be {tradeDirection === 'LONG' ? 'below' : 'above'} entry).</p>
                )}
              </>
            ) : (
              <div className='space-y-2'>
                {' '}
                <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100'>Loss Protection</h3>{' '}
                <div className='p-2 border border-yellow-300 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-900/20'>
                  {' '}
                  <p className='text-xs text-yellow-700 dark:text-yellow-400'>
                    {' '}
                    <strong>No stop loss set.</strong> Max loss determined by liquidation.{' '}
                  </p>{' '}
                  <p className='text-xs text-yellow-700 dark:text-yellow-400 mt-1'>
                    {' '}
                    Liquidation at <strong>{formatPrice(realLiquidationPrice)}</strong> (Real Price) would result in a loss of approx.{' '}
                    <strong>{formatNumber(accountSize)} USDT</strong> (your entire balance used for margin + buffer).{' '}
                  </p>{' '}
                </div>{' '}
              </div>
            )}
          </div>
        </div>{' '}
        {/* End Right Column */}
      </div>
      {/* Footer */}
      <div className='mt-8 text-center text-neutral-500 dark:text-neutral-400 text-xs'>
        <p>
          Disclaimer: Calculations are estimates and may differ slightly from exchange values due to fees, funding rates, MMR tiers, and price volatility. Always use
          official exchange tools for final confirmation.
        </p>
        <p className='mt-1'>© {new Date().getFullYear()} Zeeshan's Trading Calculator</p>
      </div>
    </div>
  )
}

export default BinanceFuturesCalculator
