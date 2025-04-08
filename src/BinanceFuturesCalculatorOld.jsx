import React, { useState, useEffect } from 'react'

const BinanceFuturesCalculator = () => {
  // Input states
  const [accountSize, setAccountSize] = useState(5000)
  const [accountSizeInput, setAccountSizeInput] = useState('5000')

  const [symbol, setSymbol] = useState('BTCUSDT')

  const [leverage, setLeverage] = useState(10)
  const [leverageInput, setLeverageInput] = useState('10')

  const [tradeDirection, setTradeDirection] = useState('LONG')

  const [entryPrice, setEntryPrice] = useState(80000)
  const [entryPriceInput, setEntryPriceInput] = useState('80000')

  // Multiple take profit targets
  const [takeProfits, setTakeProfits] = useState([
    {
      enabled: true,
      price: 81600,
      priceInput: '81600',
      percent: 2,
      percentInput: '2',
      quantity: 100, // Percentage of position size allocated to this TP (0-100)
      quantityInput: '100',
      profit: 0,
      profitPercent: 0,
    },
    {
      enabled: false,
      price: 82400,
      priceInput: '82400',
      percent: 3,
      percentInput: '3',
      quantity: 0,
      quantityInput: '0',
      profit: 0,
      profitPercent: 0,
    },
    {
      enabled: false,
      price: 84000,
      priceInput: '84000',
      percent: 5,
      percentInput: '5',
      quantity: 0,
      quantityInput: '0',
      profit: 0,
      profitPercent: 0,
    },
  ])

  // Stop loss
  const [stopLossPrice, setStopLossPrice] = useState(79200)
  const [stopLossPriceInput, setStopLossPriceInput] = useState('79200')

  const [stopLossPercent, setStopLossPercent] = useState(1)
  const [stopLossPercentInput, setStopLossPercentInput] = useState('1')

  // Track which field was last updated to prevent circular updates
  const [lastUpdated, setLastUpdated] = useState({
    tp: Array(3).fill('none'),
    sl: 'none',
  })

  // Position sizing
  const [calculationMode, setCalculationMode] = useState('risk')

  const [positionSizeUSDT, setPositionSizeUSDT] = useState(500)
  const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('500')

  const [riskPercent, setRiskPercent] = useState(10)
  const [riskPercentInput, setRiskPercentInput] = useState('10')

  // Calculated states
  const [quantity, setQuantity] = useState(0)
  const [effectiveMargin, setEffectiveMargin] = useState(0)
  const [lossAmount, setLossAmount] = useState(0)
  const [lossPercent, setLossPercent] = useState(0)
  const [riskRewardRatio, setRiskRewardRatio] = useState(0)
  const [liquidationPrice, setLiquidationPrice] = useState(0)
  const [totalPositionSize, setTotalPositionSize] = useState(0)
  const [weightedTakeProfit, setWeightedTakeProfit] = useState(0)

  // ===== INPUT HANDLERS =====

  // Handle account size input
  const handleAccountSizeChange = (value) => {
    setAccountSizeInput(value)
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      setAccountSize(parsed)
    }
  }

  // Handle leverage input
  const handleLeverageChange = (value) => {
    setLeverageInput(value)
    const parsed = parseInt(value)
    if (!isNaN(parsed)) {
      setLeverage(Math.max(1, Math.min(125, parsed)))
    }
  }

  // Handle entry price input
  const handleEntryPriceChange = (value) => {
    setEntryPriceInput(value)
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      setEntryPrice(parsed)
    }
  }

  // Handle take profit price/percent input
  const handleTakeProfitChange = (index, field, value) => {
    const newTakeProfits = [...takeProfits]

    if (field === 'priceInput') {
      newTakeProfits[index].priceInput = value
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        newTakeProfits[index].price = parsed

        // Calculate and update percentage
        let newPercent
        if (tradeDirection === 'LONG') {
          newPercent = (parsed / entryPrice - 1) * 100
        } else {
          newPercent = (1 - parsed / entryPrice) * 100
        }

        newTakeProfits[index].percent = newPercent
        newTakeProfits[index].percentInput = newPercent.toFixed(2)

        // Update last updated
        const newLastUpdated = { ...lastUpdated }
        newLastUpdated.tp[index] = 'price'
        setLastUpdated(newLastUpdated)
      }
    } else if (field === 'percentInput') {
      newTakeProfits[index].percentInput = value
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        newTakeProfits[index].percent = parsed

        // Calculate and update price
        let newPrice
        if (tradeDirection === 'LONG') {
          newPrice = entryPrice * (1 + parsed / 100)
        } else {
          newPrice = entryPrice * (1 - parsed / 100)
        }

        newTakeProfits[index].price = newPrice
        newTakeProfits[index].priceInput = newPrice.toString()

        // Update last updated
        const newLastUpdated = { ...lastUpdated }
        newLastUpdated.tp[index] = 'percent'
        setLastUpdated(newLastUpdated)
      }
    } else if (field === 'enabled') {
      // Toggle enabled state
      newTakeProfits[index].enabled = !newTakeProfits[index].enabled

      // If enabling, give it a default allocation
      if (newTakeProfits[index].enabled && newTakeProfits[index].quantity === 0) {
        // Distribute quantity evenly among enabled TPs
        const enabledCount = newTakeProfits.filter((tp) => tp.enabled).length
        if (enabledCount > 0) {
          // Reset all quantities first
          newTakeProfits.forEach((tp) => {
            if (tp.enabled) {
              tp.quantity = 0
              tp.quantityInput = '0'
            }
          })

          // Then redistribute
          const perTP = 100 / enabledCount
          newTakeProfits.forEach((tp) => {
            if (tp.enabled) {
              tp.quantity = perTP
              tp.quantityInput = perTP.toFixed(0)
            }
          })
        }
      } else if (!newTakeProfits[index].enabled) {
        // If disabling, redistribute its allocation to other enabled TPs
        const disabledQuantity = newTakeProfits[index].quantity
        newTakeProfits[index].quantity = 0
        newTakeProfits[index].quantityInput = '0'

        const remainingEnabled = newTakeProfits.filter((tp, i) => i !== index && tp.enabled)
        if (remainingEnabled.length > 0) {
          const totalRemainingQuantity = remainingEnabled.reduce((sum, tp) => sum + tp.quantity, 0)

          if (totalRemainingQuantity > 0) {
            // Redistribute proportionally
            remainingEnabled.forEach((tp) => {
              const proportion = tp.quantity / totalRemainingQuantity
              const newQuantity = tp.quantity + disabledQuantity * proportion

              // Find and update the TP in the newTakeProfits array
              const tpIndex = newTakeProfits.findIndex((item) => item === tp)
              if (tpIndex !== -1) {
                newTakeProfits[tpIndex].quantity = newQuantity
                newTakeProfits[tpIndex].quantityInput = newQuantity.toFixed(0)
              }
            })
          } else {
            // If all remaining were at 0, distribute evenly
            const perTP = 100 / remainingEnabled.length
            remainingEnabled.forEach((tp) => {
              const tpIndex = newTakeProfits.findIndex((item) => item === tp)
              if (tpIndex !== -1) {
                newTakeProfits[tpIndex].quantity = perTP
                newTakeProfits[tpIndex].quantityInput = perTP.toFixed(0)
              }
            })
          }
        }
      }
    } else if (field === 'quantityInput') {
      // Update the input display value
      newTakeProfits[index].quantityInput = value

      // Parse and validate the value
      let parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        // Ensure value is between 0-100
        parsed = Math.max(0, Math.min(100, parsed))
        newTakeProfits[index].quantity = parsed

        // Calculate total quantity across all enabled TPs
        const enabledTPs = newTakeProfits.filter((tp) => tp.enabled)
        const totalQuantity = enabledTPs.reduce((sum, tp, i) => {
          return sum + (i === enabledTPs.findIndex((e) => e === newTakeProfits[index]) ? parsed : tp.quantity)
        }, 0)

        // Normalize to 100% if needed
        if (totalQuantity > 100) {
          // Scale all other TPs down proportionally
          const scale = (100 - parsed) / (totalQuantity - parsed)
          enabledTPs.forEach((tp) => {
            if (tp !== newTakeProfits[index]) {
              const tpIndex = newTakeProfits.findIndex((item) => item === tp)
              if (tpIndex !== -1) {
                newTakeProfits[tpIndex].quantity = tp.quantity * scale
                newTakeProfits[tpIndex].quantityInput = (tp.quantity * scale).toFixed(0)
              }
            }
          })
        }
      }
    }

    setTakeProfits(newTakeProfits)
  }

  // Handle preset TP percentages
  const handleTakeProfitPreset = (index, percent) => {
    const newTakeProfits = [...takeProfits]
    newTakeProfits[index].percent = percent
    newTakeProfits[index].percentInput = percent.toString()

    // Calculate and update price
    let newPrice
    if (tradeDirection === 'LONG') {
      newPrice = entryPrice * (1 + percent / 100)
    } else {
      newPrice = entryPrice * (1 - percent / 100)
    }

    newTakeProfits[index].price = newPrice
    newTakeProfits[index].priceInput = newPrice.toString()

    // Update last updated
    const newLastUpdated = { ...lastUpdated }
    newLastUpdated.tp[index] = 'percent'
    setLastUpdated(newLastUpdated)

    setTakeProfits(newTakeProfits)
  }

  // Handle stop loss price input
  const handleStopLossPriceChange = (value) => {
    setStopLossPriceInput(value)
    const parsed = parseFloat(value)

    if (!isNaN(parsed)) {
      setStopLossPrice(parsed)

      // Calculate and update percentage
      let newPercent
      if (tradeDirection === 'LONG') {
        newPercent = (1 - parsed / entryPrice) * 100
      } else {
        newPercent = (parsed / entryPrice - 1) * 100
      }

      setStopLossPercent(newPercent)
      setStopLossPercentInput(newPercent.toString())
      setLastUpdated({ ...lastUpdated, sl: 'price' })
    }
  }

  // Handle stop loss percentage input
  const handleStopLossPercentChange = (value) => {
    setStopLossPercentInput(value)
    const parsed = parseFloat(value)

    if (!isNaN(parsed)) {
      setStopLossPercent(parsed)
      setLastUpdated({ ...lastUpdated, sl: 'percent' })
    }
  }

  // Handle stop loss preset percentages
  const handleStopLossPreset = (percent) => {
    setStopLossPercent(percent)
    setStopLossPercentInput(percent.toString())
    setLastUpdated({ ...lastUpdated, sl: 'percent' })
  }

  // Handle position size input
  const handlePositionSizeChange = (value) => {
    setPositionSizeUSDTInput(value)
    const parsed = parseFloat(value)

    if (!isNaN(parsed)) {
      setPositionSizeUSDT(parsed)
    }
  }

  // Handle risk percentage input
  const handleRiskPercentChange = (value) => {
    setRiskPercentInput(value)
    const parsed = parseFloat(value)

    if (!isNaN(parsed)) {
      setRiskPercent(parsed)
    }
  }

  // ===== CALCULATION FUNCTIONS =====

  // Handle direction change
  useEffect(() => {
    // When direction changes, recalculate prices from percentages
    updatePricesFromPercentages()
  }, [tradeDirection])

  // When entry price changes, update TP/SL based on their percentages
  useEffect(() => {
    updatePricesFromPercentages()
  }, [entryPrice])

  // When SL percentage changes, update SL price (only if percentage was changed directly)
  useEffect(() => {
    if (lastUpdated.sl === 'percent') {
      updateSLPriceFromPercent()
    }
  }, [stopLossPercent, tradeDirection])

  // When TP percentages change, update TP prices
  useEffect(() => {
    takeProfits.forEach((tp, index) => {
      if (lastUpdated.tp[index] === 'percent') {
        updateTPPriceFromPercent(index)
      }
    })
  }, [takeProfits.map((tp) => tp.percent), tradeDirection])

  // Update TP and SL prices based on their respective percentages
  const updatePricesFromPercentages = () => {
    takeProfits.forEach((_, index) => {
      updateTPPriceFromPercent(index)
    })
    updateSLPriceFromPercent()
  }

  // Update TP price from percentage for a specific TP
  const updateTPPriceFromPercent = (index) => {
    const newTakeProfits = [...takeProfits]

    if (tradeDirection === 'LONG') {
      const newTP = entryPrice * (1 + newTakeProfits[index].percent / 100)
      newTakeProfits[index].price = newTP
      newTakeProfits[index].priceInput = newTP.toString()
    } else {
      const newTP = entryPrice * (1 - newTakeProfits[index].percent / 100)
      newTakeProfits[index].price = newTP
      newTakeProfits[index].priceInput = newTP.toString()
    }

    setTakeProfits(newTakeProfits)
  }

  // Update SL price from percentage
  const updateSLPriceFromPercent = () => {
    if (tradeDirection === 'LONG') {
      const newSL = entryPrice * (1 - stopLossPercent / 100)
      setStopLossPrice(newSL)
      setStopLossPriceInput(newSL.toString())
    } else {
      const newSL = entryPrice * (1 + stopLossPercent / 100)
      setStopLossPrice(newSL)
      setStopLossPriceInput(newSL.toString())
    }
  }

  // Calculate all values when inputs change
  useEffect(() => {
    calculateAll()
  }, [accountSize, leverage, tradeDirection, entryPrice, takeProfits, stopLossPrice, calculationMode, positionSizeUSDT, riskPercent])

  const calculateAll = () => {
    // Guard against invalid inputs
    if (!accountSize || !leverage || !entryPrice || !stopLossPrice) {
      return
    }

    let calculatedPositionSize = 0
    let calculatedQuantity = 0
    let calculatedMargin = 0

    if (calculationMode === 'fixed') {
      // In Fixed USDT mode, positionSizeUSDT is how much margin you're committing
      calculatedMargin = positionSizeUSDT

      // The total position size is margin * leverage
      calculatedPositionSize = calculatedMargin * leverage

      // Calculate quantity based on total position size
      calculatedQuantity = calculatedPositionSize / entryPrice
    } else {
      // Risk-based position sizing calculation

      // 1. Calculate risk amount (how much we're willing to lose)
      const riskAmount = accountSize * (riskPercent / 100)

      // 2. Calculate price difference between entry and stop loss
      let priceDifference
      if (tradeDirection === 'LONG') {
        priceDifference = entryPrice - stopLossPrice
      } else {
        priceDifference = stopLossPrice - entryPrice
      }

      // 3. Calculate position quantity based on risk
      calculatedQuantity = riskAmount / priceDifference

      // 4. Calculate position size
      calculatedPositionSize = calculatedQuantity * entryPrice

      // 5. Apply leverage to calculate margin
      calculatedMargin = calculatedPositionSize / leverage

      // 6. Check if margin exceeds account size and adjust if needed
      if (calculatedMargin > accountSize) {
        calculatedMargin = accountSize
        calculatedPositionSize = calculatedMargin * leverage
        calculatedQuantity = calculatedPositionSize / entryPrice
      }
    }

    // Calculate loss amount if stop loss is hit
    let calculatedLossAmount
    if (tradeDirection === 'LONG') {
      calculatedLossAmount = calculatedQuantity * (entryPrice - stopLossPrice)
    } else {
      calculatedLossAmount = calculatedQuantity * (stopLossPrice - entryPrice)
    }

    // Calculate loss as percentage of account
    const calculatedLossPercent = (calculatedLossAmount / accountSize) * 100

    // Calculate profit for each take profit level and weighted average take profit
    const newTakeProfits = [...takeProfits]
    let totalWeightedProfit = 0
    let totalWeight = 0

    newTakeProfits.forEach((tp, index) => {
      if (tp.enabled) {
        // Calculate profit for this TP level
        let tpProfit
        if (tradeDirection === 'LONG') {
          tpProfit = calculatedQuantity * (tp.price - entryPrice) * (tp.quantity / 100)
        } else {
          tpProfit = calculatedQuantity * (entryPrice - tp.price) * (tp.quantity / 100)
        }

        // Store profit in the take profit object
        tp.profit = tpProfit
        tp.profitPercent = (tpProfit / accountSize) * 100

        // Add to weighted total
        totalWeightedProfit += tpProfit
        totalWeight += tp.quantity
      } else {
        tp.profit = 0
        tp.profitPercent = 0
      }
    })

    // Normalize weights if they don't add up to 100%
    if (totalWeight > 0 && Math.abs(totalWeight - 100) > 0.1) {
      const scale = 100 / totalWeight
      newTakeProfits.forEach((tp) => {
        if (tp.enabled) {
          tp.quantity = tp.quantity * scale
          tp.quantityInput = tp.quantity.toFixed(0)
        }
      })
    }

    setTakeProfits(newTakeProfits)

    // Calculate risk/reward ratio
    const calculatedRiskRewardRatio = calculatedLossAmount > 0 ? totalWeightedProfit / calculatedLossAmount : 0

    // Calculate estimated liquidation price
    let calculatedLiquidationPrice

    // Special case for 1x leverage
    if (leverage === 1) {
      // At 1x leverage, liquidation happens when you lose nearly everything
      if (tradeDirection === 'LONG') {
        calculatedLiquidationPrice = entryPrice * 0.01 // Near zero
      } else {
        calculatedLiquidationPrice = entryPrice * 100 // Very high price
      }
    } else {
      // For leveraged positions
      if (tradeDirection === 'LONG') {
        // For LONG positions, liquidation happens when price drops enough
        calculatedLiquidationPrice = entryPrice * (1 - 1 / leverage)
      } else {
        // For SHORT positions, liquidation happens when price rises enough
        calculatedLiquidationPrice = entryPrice * (1 + 1 / leverage)
      }
    }

    // Update all states
    setQuantity(calculatedQuantity)
    setEffectiveMargin(calculatedMargin)
    setLossAmount(calculatedLossAmount)
    setLossPercent(calculatedLossPercent)
    setRiskRewardRatio(calculatedRiskRewardRatio)
    setLiquidationPrice(calculatedLiquidationPrice)
    setTotalPositionSize(calculatedPositionSize)
    setWeightedTakeProfit(totalWeightedProfit)
  }

  // Quick percentage presets
  const tpPercentPresets = [1, 2, 3, 5, 10]
  const slPercentPresets = [1, 2, 3, 5, 10]

  return (
    <div className='max-w-4xl mx-auto p-4 dark:bg-black bg-white'>
      <h1 className='text-lg font-medium mb-6 text-neutral-900 dark:text-neutral-100'>Binance Futures Calculator</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Left column - Inputs */}
        <div className='space-y-4'>
          <div className='space-y-3'>
            <h2 className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>Trade Setup</h2>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Account Size</label>
                <input
                  type='text'
                  value={accountSizeInput}
                  onChange={(e) => handleAccountSizeChange(e.target.value)}
                  className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                />
              </div>

              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Symbol</label>
                <input
                  type='text'
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Leverage</label>
                <div className='space-y-1'>
                  <input
                    type='text'
                    value={leverageInput}
                    onChange={(e) => handleLeverageChange(e.target.value)}
                    className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                  />
                  <div className='flex flex-wrap gap-1'>
                    {[5, 10, 20, 50, 100].map((lev) => (
                      <button
                        key={lev}
                        onClick={() => {
                          setLeverage(lev)
                          setLeverageInput(lev.toString())
                        }}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${
                          leverage === lev
                            ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                            : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}>
                        {lev}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Direction</label>
                <div className='grid grid-cols-2 gap-2'>
                  <button
                    onClick={() => setTradeDirection('LONG')}
                    className={`h-9 text-sm rounded-md transition-colors ${
                      tradeDirection === 'LONG'
                        ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}>
                    LONG
                  </button>
                  <button
                    onClick={() => setTradeDirection('SHORT')}
                    className={`h-9 text-sm rounded-md transition-colors ${
                      tradeDirection === 'SHORT'
                        ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}>
                    SHORT
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Entry Price</label>
              <input
                type='text'
                value={entryPriceInput}
                onChange={(e) => handleEntryPriceChange(e.target.value)}
                className='w-full h-9 px-3 py-1 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
              />
            </div>
          </div>

          {/* Take Profit Targets */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>Take Profit Targets</h3>

            {takeProfits.map((tp, index) => (
              <div key={`tp-${index}`} className={`p-3 rounded-md border border-neutral-200 dark:border-neutral-800 ${!tp.enabled && 'opacity-70'}`}>
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center space-x-2'>
                    <input
                      type='checkbox'
                      checked={tp.enabled}
                      onChange={() => handleTakeProfitChange(index, 'enabled')}
                      className='h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-neutral-500 dark:focus:ring-neutral-500'
                    />
                    <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>TP {index + 1}</span>
                  </div>

                  {tp.enabled && <div className='text-xs text-neutral-500 dark:text-neutral-400'>Profit: +{tp.profit.toFixed(2)} USDT</div>}
                </div>

                {tp.enabled && (
                  <div className='space-y-2'>
                    <div className='grid grid-cols-3 gap-2'>
                      <div className='flex col-span-1'>
                        <input
                          type='text'
                          value={tp.quantityInput}
                          onChange={(e) => handleTakeProfitChange(index, 'quantityInput', e.target.value)}
                          className='w-full h-8 px-3 py-1 text-xs rounded-l-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                        />
                        <div className='px-2 flex items-center text-xs rounded-r-md border-t border-r border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'>
                          %
                        </div>
                      </div>

                      <div className='flex col-span-2'>
                        <input
                          type='text'
                          value={tp.priceInput}
                          onChange={(e) => handleTakeProfitChange(index, 'priceInput', e.target.value)}
                          className='w-full h-8 px-3 py-1 text-xs rounded-l-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                        />
                        <div className='px-2 flex items-center text-xs rounded-r-md border-t border-r border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'>
                          Price
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-3 gap-2'>
                      <div className='col-span-1'></div>
                      <div className='flex col-span-2'>
                        <input
                          type='text'
                          value={tp.percentInput}
                          onChange={(e) => handleTakeProfitChange(index, 'percentInput', e.target.value)}
                          className='w-full h-8 px-3 py-1 text-xs rounded-l-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                        />
                        <div className='px-2 flex items-center text-xs rounded-r-md border-t border-r border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'>
                          % from entry
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-1'>
                      {tpPercentPresets.map((percent) => (
                        <button
                          key={`tp-${index}-${percent}`}
                          onClick={() => handleTakeProfitPreset(index, percent)}
                          className={`text-xs px-2 py-1 rounded-md transition-colors ${
                            Math.abs(tp.percent - percent) < 0.01
                              ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                              : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}>
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className='space-y-2'>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Stop Loss {tradeDirection === 'LONG' ? '↓' : '↑'}</label>
            <div className='grid grid-cols-2 gap-2'>
              <div className='flex'>
                <input
                  type='text'
                  value={stopLossPriceInput}
                  onChange={(e) => handleStopLossPriceChange(e.target.value)}
                  className='w-full h-8 px-3 py-1 text-xs rounded-l-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                />
                <div className='px-2 flex items-center text-xs rounded-r-md border-t border-r border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'>
                  Price
                </div>
              </div>

              <div className='flex'>
                <input
                  type='text'
                  value={stopLossPercentInput}
                  onChange={(e) => handleStopLossPercentChange(e.target.value)}
                  className='w-full h-8 px-3 py-1 text-xs rounded-l-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                />
                <div className='px-2 flex items-center text-xs rounded-r-md border-t border-r border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400'>
                  %
                </div>
              </div>
            </div>

            <div className='flex flex-wrap gap-1'>
              {slPercentPresets.map((percent) => (
                <button
                  key={`sl-${percent}`}
                  onClick={() => handleStopLossPreset(percent)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    Math.abs(stopLossPercent - percent) < 0.01
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                  {percent}%
                </button>
              ))}
            </div>
          </div>

          <div className='rounded-md border border-neutral-200 dark:border-neutral-800 p-3 space-y-2'>
            <div className='flex justify-between items-center'>
              <h3 className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>Position Sizing</h3>
              <div className='flex space-x-1'>
                <button
                  onClick={() => setCalculationMode('fixed')}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    calculationMode === 'fixed'
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                  Fixed USDT
                </button>
                <button
                  onClick={() => setCalculationMode('risk')}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    calculationMode === 'risk'
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}>
                  Risk %
                </button>
              </div>
            </div>

            {calculationMode === 'fixed' ? (
              <div className='space-y-2'>
                <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Margin to Use (USDT)</label>
                <input
                  type='text'
                  value={positionSizeUSDTInput}
                  onChange={(e) => handlePositionSizeChange(e.target.value)}
                  className='w-full h-8 px-3 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                />
                <div className='flex flex-wrap gap-1'>
                  {[10, 20, 50, 100, 200].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setPositionSizeUSDT(amount)
                        setPositionSizeUSDTInput(amount.toString())
                      }}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        positionSizeUSDT === amount
                          ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                          : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                      {amount}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className='space-y-2'>
                <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Risk % of Account</label>
                <input
                  type='text'
                  value={riskPercentInput}
                  onChange={(e) => handleRiskPercentChange(e.target.value)}
                  className='w-full h-8 px-3 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                />
                <div className='flex flex-wrap gap-1'>
                  {[1, 2, 3, 5, 10].map((rp) => (
                    <button
                      key={rp}
                      onClick={() => {
                        setRiskPercent(rp)
                        setRiskPercentInput(rp.toString())
                      }}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        riskPercent === rp
                          ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                          : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                      {rp}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Results */}
        <div className='space-y-4'>
          <h2 className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>Trade Analysis</h2>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Total Position (USDT)</label>
              <div className='h-9 px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100'>
                {totalPositionSize.toFixed(2)}
              </div>
              {calculationMode === 'fixed' && (
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
                  = {positionSizeUSDT} × {leverage}x
                </p>
              )}
              {calculationMode === 'risk' && (
                <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>Risk: {(accountSize * (riskPercent / 100)).toFixed(2)} USDT</p>
              )}
            </div>

            <div>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Quantity ({symbol.replace(/USDT|USD|BUSD/g, '')})</label>
              <div className='h-9 px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100'>
                {quantity.toFixed(6)}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Required Margin</label>
              <div className='h-9 px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100'>
                {effectiveMargin.toFixed(2)} USDT
              </div>
            </div>

            <div>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Liquidation Price (Est.)</label>
              <div className='h-9 px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-red-500 dark:text-red-400'>
                {liquidationPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <div>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Risk/Reward Ratio</label>
            <div className='h-9 px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100'>
              1 : {riskRewardRatio.toFixed(2)}
            </div>
          </div>

          <div className='space-y-3 border border-neutral-200 dark:border-neutral-800 rounded-md p-3'>
            <h3 className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>Profit Scenarios</h3>

            {takeProfits
              .filter((tp) => tp.enabled)
              .map((tp, index) => (
                <div key={`profit-${index}`} className='p-2 border border-neutral-200 dark:border-neutral-800 rounded-md space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>
                      TP {index + 1} (@ {tp.price.toFixed(2)})
                    </span>
                    <span className='text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300'>
                      {tp.quantity.toFixed(0)}%
                    </span>
                  </div>

                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Profit Amount</label>
                      <div className='px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-green-600 dark:text-green-400'>
                        +{tp.profit.toFixed(2)} USDT
                      </div>
                    </div>

                    <div>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Account % Gain</label>
                      <div className='px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-green-600 dark:text-green-400'>
                        +{tp.profitPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            {takeProfits.filter((tp) => tp.enabled).length > 0 && (
              <div className='p-2 border border-neutral-200 dark:border-neutral-800 rounded-md'>
                <div className='flex justify-between items-center'>
                  <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>Combined Profit</span>
                  <span className='text-xs font-medium text-green-600 dark:text-green-400'>+{weightedTakeProfit.toFixed(2)} USDT</span>
                </div>
                <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                  Final balance: <span className='font-medium text-green-600 dark:text-green-400'>{(accountSize + weightedTakeProfit).toFixed(2)} USDT</span>
                </div>
              </div>
            )}
          </div>

          <div className='border border-neutral-200 dark:border-neutral-800 rounded-md p-3 space-y-3'>
            <h3 className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>
              Loss Scenario (SL: {parseFloat(stopLossPercentInput || '0').toFixed(2)}% {tradeDirection === 'LONG' ? 'down' : 'up'})
            </h3>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Loss Amount</label>
                <div className='px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-red-500 dark:text-red-400'>
                  -{lossAmount.toFixed(2)} USDT
                </div>
              </div>

              <div>
                <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Account % Loss</label>
                <div className='px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-red-500 dark:text-red-400'>
                  -{lossPercent.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className='p-2 border border-neutral-200 dark:border-neutral-800 rounded-md'>
              <span className='text-xs'>
                Final balance: <span className='font-medium text-red-500 dark:text-red-400'>{(accountSize - lossAmount).toFixed(2)} USDT</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='mt-4 text-center text-neutral-500 dark:text-neutral-400 text-xs'>
        <p>© {new Date().getFullYear()} Binance Futures Calculator</p>
      </div>
    </div>
  )
}

export default BinanceFuturesCalculator
