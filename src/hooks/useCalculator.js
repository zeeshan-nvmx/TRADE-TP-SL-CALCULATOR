import { useState, useEffect, useCallback } from 'react'
import { safeDivide, parseFloatInput } from '../utils/calculations'
import { EXCHANGE_FEES, DEFAULT_TAKE_PROFITS, MMR } from '../constants/presets'

export const useCalculator = () => {
  // --- State Definitions ---
  const [exchange, setExchange] = useState('binance')
  const [accountSizeInput, setAccountSizeInput] = useState('500')
  const [accountSize, setAccountSize] = useState(500)
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [leverageInput, setLeverageInput] = useState('50')
  const [leverage, setLeverage] = useState(50)
  const [exceedsAccount, setExceedsAccount] = useState(false)
  const [requiredAccountSize, setRequiredAccountSize] = useState(0)
  const [tradeDirection, setTradeDirection] = useState('SHORT')
  const [entryPriceInput, setEntryPriceInput] = useState('')
  const [entryPrice, setEntryPrice] = useState(0)
  const [autoPriceUpdate, setAutoPriceUpdate] = useState(false)
  const [tpAutoPriceUpdate, setTPAutoPriceUpdate] = useState([true, false, false])
  const [slAutoPriceUpdate, setSLAutoPriceUpdate] = useState(false)

  const [takeProfits, setTakeProfits] = useState(DEFAULT_TAKE_PROFITS)

  // --- Stop Loss States ---
  const [useStopLoss, setUseStopLoss] = useState(true)
  const [stopLossPriceInput, setStopLossPriceInput] = useState('')
  const [stopLossPrice, setStopLossPrice] = useState(null)
  const [stopLossPercentInput, setStopLossPercentInput] = useState('')
  const [stopLossPercent, setStopLossPercent] = useState(0)

  // --- Trailing Stop Loss States ---
  const [useTrailingStop, setUseTrailingStop] = useState(false)
  const [trailingStopPercentInput, setTrailingStopPercentInput] = useState('0.5')
  const [trailingStopPercent, setTrailingStopPercent] = useState(0.5)
  const [trailingActivationPriceInput, setTrailingActivationPriceInput] = useState('')
  const [trailingActivationPrice, setTrailingActivationPrice] = useState(null)
  const [trailingStopSimulationPriceInput, setTrailingStopSimulationPriceInput] = useState('')
  const [trailingStopSimulationPrice, setTrailingStopSimulationPrice] = useState(null)
  const [trailingStopTriggerPrice, setTrailingStopTriggerPrice] = useState(null)
  const [trailingStopLossAmount, setTrailingStopLossAmount] = useState(0)
  const [trailingStopLossPercent, setTrailingStopLossPercent] = useState(0)
  const [trailingStopProfit, setTrailingStopProfit] = useState(0)
  const [trailingStopProfitPercent, setTrailingStopProfitPercent] = useState(0)

  const [lastUpdated, setLastUpdated] = useState({ tp: Array(3).fill('price'), sl: 'price' })
  const [calculationMode, setCalculationMode] = useState('fixed')
  const [positionSizeUSDTInput, setPositionSizeUSDTInput] = useState('50')
  const [positionSizeUSDT, setPositionSizeUSDT] = useState(50)
  const [riskPercentInput, setRiskPercentInput] = useState('20')
  const [riskPercent, setRiskPercent] = useState(20)

  // --- Calculated States ---
  const [quantity, setQuantity] = useState(0)
  const [effectiveMargin, setEffectiveMargin] = useState(0)
  const [totalPositionSize, setTotalPositionSize] = useState(0)
  // Net Loss
  const [lossAmount, setLossAmount] = useState(0)
  const [lossPercent, setLossPercent] = useState(0)
  // Gross Loss
  const [grossLossAmount, setGrossLossAmount] = useState(0)
  const [grossLossPercent, setGrossLossPercent] = useState(0)
  // R/R
  const [riskRewardRatio, setRiskRewardRatio] = useState(NaN)
  const [grossRiskRewardRatio, setGrossRiskRewardRatio] = useState(NaN)
  // Liq
  const [liquidationPrice, setLiquidationPrice] = useState(NaN)
  const [realLiquidationPrice, setRealLiquidationPrice] = useState(NaN)
  // Profit
  const [weightedTakeProfit, setWeightedTakeProfit] = useState(0)
  const [weightedGrossTakeProfit, setWeightedGrossTakeProfit] = useState(0)
  // Fees
  const [entryFee, setEntryFee] = useState(0)
  const [exitFeeTP, setExitFeeTP] = useState(0)
  const [exitFeeSL, setExitFeeSL] = useState(0)
  const [exitFeeTrailingSL, setExitFeeTrailingSL] = useState(0)
  const [totalFeesTP, setTotalFeesTP] = useState(0)
  const [totalFeesSL, setTotalFeesSL] = useState(0)
  const [totalFeesTrailingSL, setTotalFeesTrailingSL] = useState(0)
  // Display helpers
  const [riskAmountDisplay, setRiskAmountDisplay] = useState(0)
  const [slDistDisplay, setSlDistDisplay] = useState(0)

  // --- Input Handlers ---
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

  const handleTPAutoPriceToggle = (index, enabled) => {
    const updated = [...tpAutoPriceUpdate]
    updated[index] = enabled
    setTPAutoPriceUpdate(updated)
  }

  const handleSLAutoPriceToggle = (enabled) => {
    setSLAutoPriceUpdate(enabled)
    if (enabled) {
      // Auto mode: derive SL price from the current percent so it's immediately valid
      setLastUpdated((prev) => ({ ...prev, sl: 'percent' }))
      if (entryPrice > 0 && stopLossPercentInput) {
        const slPercent = parseFloatInput(stopLossPercentInput)
        if (slPercent !== null && slPercent > 0) {
          const newSLPrice = entryPrice * (1 + (tradeDirection === 'LONG' ? -slPercent : slPercent) / 100)
          if (newSLPrice > 0) {
            setStopLossPrice(newSLPrice)
            setStopLossPriceInput(newSLPrice.toFixed(8))
          }
        }
      }
    } else {
      // Manual mode: lock price as-is, stop auto-updating
      setLastUpdated((prev) => ({ ...prev, sl: 'price' }))
    }
  }

  // --- Trailing Stop Loss Handlers ---
  const handleTrailingStopPercentChange = (value) => {
    setTrailingStopPercentInput(value)
    const p = parseFloatInput(value)
    setTrailingStopPercent(p !== null && p > 0 ? p : 0.5)
  }

  const handleTrailingActivationPriceChange = (value) => {
    setTrailingActivationPriceInput(value)
    const p = parseFloatInput(value)
    if (p !== null && p > 0) {
      const isValid = (tradeDirection === 'LONG' && p > entryPrice) || (tradeDirection === 'SHORT' && p < entryPrice)
      setTrailingActivationPrice(isValid ? p : null)
    } else {
      setTrailingActivationPrice(null)
    }
  }

  const handleTrailingStopSimulationPriceChange = (value) => {
    setTrailingStopSimulationPriceInput(value)
    const p = parseFloatInput(value)

    if (p !== null && p > 0 && trailingActivationPrice !== null) {
      const isValid = (tradeDirection === 'LONG' && p > trailingActivationPrice) || (tradeDirection === 'SHORT' && p < trailingActivationPrice)
      setTrailingStopSimulationPrice(isValid ? p : null)
    } else {
      setTrailingStopSimulationPrice(null)
    }
  }

  // Calculate trailing stop trigger price
  const calculateTrailingStopTrigger = useCallback(() => {
    if (!useTrailingStop || trailingStopSimulationPrice === null || trailingActivationPrice === null || trailingStopPercent <= 0) {
      setTrailingStopTriggerPrice(null)
      return null
    }

    let triggerPrice
    if (tradeDirection === 'LONG') {
      triggerPrice = trailingStopSimulationPrice * (1 - trailingStopPercent / 100)
    } else {
      triggerPrice = trailingStopSimulationPrice * (1 + trailingStopPercent / 100)
    }

    if (useStopLoss && stopLossPrice !== null) {
      if (tradeDirection === 'LONG') {
        triggerPrice = Math.max(triggerPrice, stopLossPrice)
      } else {
        triggerPrice = Math.min(triggerPrice, stopLossPrice)
      }
    }

    setTrailingStopTriggerPrice(triggerPrice)
    return triggerPrice
  }, [useTrailingStop, trailingStopSimulationPrice, trailingActivationPrice, trailingStopPercent, tradeDirection, useStopLoss, stopLossPrice])

  const handleAutoSetActivationPrice = () => {
    const activationPercent = tradeDirection === 'LONG' ? 1 : -1
    const autoActivationPrice = entryPrice * (1 + (activationPercent * 2) / 100)
    setTrailingActivationPrice(autoActivationPrice)
    setTrailingActivationPriceInput(autoActivationPrice.toFixed(2))
  }

  // --- TP/SL Price/Percent Update Functions ---
  const updateTPPriceFromPercent = useCallback((index, currentEntryPrice, currentTradeDirection, currentTakeProfits) => {
    const tpPercent = parseFloatInput(currentTakeProfits[index].percentInput)
    if (currentEntryPrice === null || currentEntryPrice <= 0 || tpPercent === null || tpPercent <= 0) return currentTakeProfits[index]
    let newPrice = currentEntryPrice * (1 + (currentTradeDirection === 'LONG' ? tpPercent : -tpPercent) / 100)
    return { ...currentTakeProfits[index], price: newPrice > 0 ? newPrice : 0, priceInput: newPrice > 0 ? newPrice.toFixed(8) : '0' }
  }, [])

  const updateSLPriceFromPercent = useCallback(
    (currentEntryPrice, currentTradeDirection, currentStopLossPercentInput) => {
      const slPercent = parseFloatInput(currentStopLossPercentInput)
      if (currentEntryPrice === null || currentEntryPrice <= 0 || slPercent === null || slPercent <= 0) return { price: stopLossPrice, priceInput: stopLossPriceInput }
      let newSLPrice = currentEntryPrice * (1 + (currentTradeDirection === 'LONG' ? -slPercent : slPercent) / 100)
      return { price: newSLPrice > 0 ? newSLPrice : 0, priceInput: newSLPrice > 0 ? newSLPrice.toFixed(8) : '0' }
    },
    [stopLossPrice, stopLossPriceInput]
  )

  // Quantity redistribution logic
  const redistributeTPQuantities = (currentTakeProfits, changedIndex = -1, newQuantityForChanged = null) => {
    const nextTakeProfits = currentTakeProfits.map((tp) => ({ ...tp }))
    const enabledIndices = nextTakeProfits.map((tp, i) => (tp.enabled ? i : -1)).filter((i) => i !== -1)
    
    if (enabledIndices.length === 0) {
      return nextTakeProfits.map((tp) => ({ ...tp, quantity: 0, quantityInput: '0' }))
    }
    
    if (enabledIndices.length === 1) {
      const onlyEnabledIndex = enabledIndices[0]
      nextTakeProfits[onlyEnabledIndex] = { ...nextTakeProfits[onlyEnabledIndex], quantity: 100, quantityInput: '100' }
      return nextTakeProfits.map((tp, i) => (i === onlyEnabledIndex ? tp : { ...tp, quantity: 0, quantityInput: '0' }))
    }
    
    if (changedIndex !== -1 && newQuantityForChanged !== null && enabledIndices.includes(changedIndex)) {
      const clampedNewQuantity = Math.max(0, Math.min(100, newQuantityForChanged))
      nextTakeProfits[changedIndex].quantity = clampedNewQuantity
      const quantityToDistribute = 100 - clampedNewQuantity
      const otherEnabledIndices = enabledIndices.filter((i) => i !== changedIndex)
      
      if (otherEnabledIndices.length > 0) {
        let remainingSum = 0
        otherEnabledIndices.forEach((idx) => (remainingSum += nextTakeProfits[idx].quantity))
        let distributedTotal = 0
        
        otherEnabledIndices.forEach((idx, loopIdx) => {
          const proportion = remainingSum > 0 ? nextTakeProfits[idx].quantity / remainingSum : 1 / otherEnabledIndices.length
          let newAmount = Math.round(quantityToDistribute * proportion)
          if (loopIdx === otherEnabledIndices.length - 1) {
            newAmount = quantityToDistribute - distributedTotal
          }
          nextTakeProfits[idx].quantity = Math.max(0, newAmount)
          nextTakeProfits[idx].quantityInput = String(nextTakeProfits[idx].quantity)
          distributedTotal += nextTakeProfits[idx].quantity
        })
        
        let finalSumCheck = nextTakeProfits.reduce((sum, tp) => sum + (tp.enabled ? tp.quantity : 0), 0)
        if (finalSumCheck !== 100 && otherEnabledIndices.length > 0) {
          const diff = 100 - finalSumCheck
          const adjustIndex = otherEnabledIndices[0]
          nextTakeProfits[adjustIndex].quantity += diff
          nextTakeProfits[adjustIndex].quantity = Math.max(0, Math.min(100, nextTakeProfits[adjustIndex].quantity))
          nextTakeProfits[adjustIndex].quantityInput = String(nextTakeProfits[adjustIndex].quantity)
        }
      } else if (clampedNewQuantity < 100) {
        nextTakeProfits[changedIndex].quantity = 100
        nextTakeProfits[changedIndex].quantityInput = '100'
      }
    } else if (changedIndex === -1) {
      const baseAmount = Math.floor(100 / enabledIndices.length)
      let remainder = 100 % enabledIndices.length
      
      enabledIndices.forEach((idx) => {
        let currentAmount = baseAmount + (remainder > 0 ? 1 : 0)
        remainder = Math.max(0, remainder - 1)
        nextTakeProfits[idx].quantity = currentAmount
        nextTakeProfits[idx].quantityInput = String(currentAmount)
      })
      
      let finalSumCheck = nextTakeProfits.reduce((sum, tp) => sum + (tp.enabled ? tp.quantity : 0), 0)
      if (finalSumCheck !== 100 && enabledIndices.length > 0) {
        const diff = 100 - finalSumCheck
        const adjustIndex = enabledIndices[0]
        nextTakeProfits[adjustIndex].quantity += diff
        nextTakeProfits[adjustIndex].quantity = Math.max(0, Math.min(100, nextTakeProfits[adjustIndex].quantity))
        nextTakeProfits[adjustIndex].quantityInput = String(nextTakeProfits[adjustIndex].quantity)
      }
    }
    
    return nextTakeProfits.map((tp) => (tp.enabled ? tp : { ...tp, quantity: 0, quantityInput: '0' }))
  }

  // TP handlers
  const handleTakeProfitChange = (index, field, value) => {
    let newTakeProfits = [...takeProfits]
    const currentEntry = entryPrice
    const newLastUpdated = { ...lastUpdated }
    let needsRedistribution = false
    let changedQuantityValue = null

    if (field === 'priceInput') {
      newTakeProfits[index].priceInput = value
      const parsedPrice = parseFloatInput(value)
      if (parsedPrice !== null && parsedPrice > 0 && currentEntry > 0) {
        newTakeProfits[index].price = parsedPrice
        let newPercent = Math.abs(safeDivide(parsedPrice - currentEntry, currentEntry) * 100)
        newTakeProfits[index].percent = newPercent
        newTakeProfits[index].percentInput = newPercent.toFixed(2)
        newLastUpdated.tp[index] = 'price'
      } else {
        newTakeProfits[index].price = null
        newTakeProfits[index].percent = null
        newTakeProfits[index].percentInput = ''
      }
    } else if (field === 'percentInput') {
      newTakeProfits[index].percentInput = value
      const parsedPercent = parseFloatInput(value)
      if (parsedPercent !== null && parsedPercent > 0) {
        newTakeProfits[index].percent = parsedPercent
        newLastUpdated.tp[index] = 'percent'
        const updatedTP = updateTPPriceFromPercent(index, currentEntry, tradeDirection, newTakeProfits)
        newTakeProfits[index] = updatedTP
      } else {
        newTakeProfits[index].percent = null
        newTakeProfits[index].price = null
        newTakeProfits[index].priceInput = ''
      }
    } else if (field === 'enabled') {
      newTakeProfits[index].enabled = value
      needsRedistribution = true
    } else if (field === 'quantityInput') {
      newTakeProfits[index].quantityInput = value
      const parsedQuantity = parseFloatInput(value)
      if (parsedQuantity !== null) {
        changedQuantityValue = parsedQuantity
        needsRedistribution = true
      }
    }

    if (needsRedistribution) {
      const finalIndex = field === 'quantityInput' ? index : -1
      const finalQuantity = field === 'quantityInput' ? changedQuantityValue : null
      newTakeProfits = redistributeTPQuantities(newTakeProfits, finalIndex, finalQuantity)
    }

    setLastUpdated(newLastUpdated)
    setTakeProfits(newTakeProfits)
  }

  const handleTakeProfitPreset = (index, percent) => {
    let newTakeProfits = [...takeProfits]
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
      const isValidSL = (tradeDirection === 'LONG' && parsedPrice < currentEntry) || (tradeDirection === 'SHORT' && parsedPrice > currentEntry)
      if (isValidSL) {
        setStopLossPrice(parsedPrice)
        let newPercent = Math.abs(safeDivide(currentEntry - parsedPrice, currentEntry) * 100)
        setStopLossPercent(newPercent)
        setStopLossPercentInput(newPercent.toFixed(2))
        setLastUpdated({ ...lastUpdated, sl: 'price' })
      } else {
        setStopLossPrice(null)
        setStopLossPercent(null)
        setStopLossPercentInput('')
      }
    } else {
      setStopLossPrice(null)
      setStopLossPercent(null)
      setStopLossPercentInput('')
    }
  }

  const handleStopLossPercentChange = (value) => {
    setStopLossPercentInput(value)
    const parsedPercent = parseFloatInput(value)
    if (parsedPercent !== null && parsedPercent > 0) {
      setStopLossPercent(parsedPercent)
      setLastUpdated({ ...lastUpdated, sl: 'percent' })
      const { price: newSLPrice, priceInput: newSLPriceInput } = updateSLPriceFromPercent(entryPrice, tradeDirection, value)
      setStopLossPrice(newSLPrice)
      setStopLossPriceInput(newSLPriceInput)
    } else {
      setStopLossPercent(null)
      setStopLossPrice(null)
      setStopLossPriceInput('')
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

  // --- Main Calculation Logic ---
  const calculateAll = () => {
    const currentAccountSize = accountSize > 0 ? accountSize : 0
    const currentLeverage = leverage >= 1 ? leverage : 1
    const currentEntryPrice = entryPrice > 0 ? entryPrice : 0
    const currentPositionSizeUSDT = positionSizeUSDT >= 0 ? positionSizeUSDT : 0
    const currentRiskPercent = riskPercent >= 0 ? riskPercent : 0
    const currentTakeProfits = takeProfits

    if (currentEntryPrice <= 0 || currentLeverage < 1) {
      return
    }

    // SL Validation & Distance
    let currentStopLossPriceVal = null
    let priceDifferenceSL = 0
    let isStopLossValid = false
    if (useStopLoss) {
      currentStopLossPriceVal = stopLossPrice !== null && stopLossPrice > 0 ? stopLossPrice : null
      if (currentEntryPrice > 0 && currentStopLossPriceVal !== null) {
        priceDifferenceSL = Math.abs(currentEntryPrice - currentStopLossPriceVal)
        isStopLossValid =
          priceDifferenceSL > 0 &&
          ((tradeDirection === 'LONG' && currentStopLossPriceVal < currentEntryPrice) || (tradeDirection === 'SHORT' && currentStopLossPriceVal > currentEntryPrice))
        if (!isStopLossValid) priceDifferenceSL = 0
      }
    }
    setSlDistDisplay(isStopLossValid ? priceDifferenceSL : 0)

    // Position Sizing
    let calculatedQuantity = 0,
      calculatedMargin = 0,
      calculatedPositionSize = 0,
      riskAmount = 0
    const effectiveCalculationMode = calculationMode === 'risk' && useStopLoss && isStopLossValid ? 'risk' : 'fixed'
    
    if (effectiveCalculationMode === 'risk') {
      riskAmount = currentAccountSize * (currentRiskPercent / 100)
      calculatedQuantity = safeDivide(riskAmount, priceDifferenceSL)
      calculatedPositionSize = calculatedQuantity * currentEntryPrice
      calculatedMargin = safeDivide(calculatedPositionSize, currentLeverage)
    } else {
      calculatedMargin = currentPositionSizeUSDT
      calculatedPositionSize = calculatedMargin * currentLeverage
      calculatedQuantity = safeDivide(calculatedPositionSize, currentEntryPrice)
      if (useStopLoss && isStopLossValid) {
        riskAmount = calculatedQuantity * priceDifferenceSL
      } else {
        riskAmount = 0
      }
    }
    
    setRiskAmountDisplay(riskAmount)
    setExceedsAccount(calculatedMargin > currentAccountSize)
    setRequiredAccountSize(calculatedMargin)

    // Fees
    const fees = EXCHANGE_FEES[exchange]
    const entryFeeRate = fees.taker
    const tpFeeRate = fees.taker
    const slFeeRate = fees.taker
    const trailingSlFeeRate = fees.taker
    const calcEntryFee = calculatedPositionSize * entryFeeRate
    let calcExitFeeTP = 0,
      calcWeightedNetProfit = 0,
      calcWeightedGrossProfit = 0

    // TP Calculations
    const updatedTPResults = currentTakeProfits.map((tp) => {
      let tpNetProfit = 0,
        tpNetProfitPercent = 0,
        tpGrossProfit = 0,
        tpGrossProfitPercent = 0
      if (tp.enabled && tp.price !== null && tp.price > 0 && tp.quantity > 0 && calculatedQuantity > 0) {
        const tpPortionQuantity = calculatedQuantity * (tp.quantity / 100)
        const tpPortionPositionSize = calculatedPositionSize * (tp.quantity / 100)
        const priceDiffTP = tradeDirection === 'LONG' ? tp.price - currentEntryPrice : currentEntryPrice - tp.price
        tpGrossProfit = tpPortionQuantity * priceDiffTP
        tpGrossProfitPercent = safeDivide(tpGrossProfit, currentAccountSize) * 100

        const isProfitTarget = priceDiffTP > 0
        const exitFeeRateForTP = isProfitTarget ? tpFeeRate : slFeeRate
        const entryFeePortion = calcEntryFee * (tp.quantity / 100)
        const exitFeePortion = tpPortionPositionSize * exitFeeRateForTP
        calcExitFeeTP += exitFeePortion

        tpNetProfit = tpGrossProfit - entryFeePortion - exitFeePortion
        tpNetProfitPercent = safeDivide(tpNetProfit, currentAccountSize) * 100

        calcWeightedNetProfit += tpNetProfit
        calcWeightedGrossProfit += tpGrossProfit
      }
      return { profit: tpNetProfit, profitPercent: tpNetProfitPercent, grossProfit: tpGrossProfit, grossProfitPercent: tpGrossProfitPercent }
    })
    
    // Update TP state
    const resultsChanged =
      JSON.stringify(currentTakeProfits.map((tp) => ({ p: tp.profit, pp: tp.profitPercent, gp: tp.grossProfit, gpp: tp.grossProfitPercent }))) !==
      JSON.stringify(updatedTPResults.map((r) => ({ p: r.profit, pp: r.profitPercent, gp: r.grossProfit, gpp: r.grossProfitPercent })))
    if (resultsChanged) {
      setTakeProfits(currentTakeProfits.map((tp, index) => ({ ...tp, ...updatedTPResults[index] })))
    }

    // SL Calculations
    const calcExitFeeSL = useStopLoss && isStopLossValid ? calculatedPositionSize * slFeeRate : 0
    let calcNetLossAmount = 0,
      calcNetLossPercent = 0,
      calcGrossLossAmount = 0,
      calcGrossLossPercent = 0
    if (useStopLoss && isStopLossValid && calculatedQuantity > 0) {
      calcGrossLossAmount = calculatedQuantity * priceDifferenceSL
      calcGrossLossPercent = safeDivide(calcGrossLossAmount, currentAccountSize) * 100

      calcNetLossAmount = calcGrossLossAmount + calcEntryFee + calcExitFeeSL
      calcNetLossPercent = safeDivide(calcNetLossAmount, currentAccountSize) * 100
    }

    // Trailing Stop Loss Calculations
    let calcTrailingExitFee = 0
    let trailingProfit = 0
    let trailingProfitPercent = 0
    let trailingLoss = 0
    let trailingLossPercent = 0

    if (useTrailingStop && trailingStopTriggerPrice !== null && calculatedQuantity > 0) {
      const priceDiff = tradeDirection === 'LONG' ? trailingStopTriggerPrice - currentEntryPrice : currentEntryPrice - trailingStopTriggerPrice
      const grossAmount = calculatedQuantity * priceDiff
      calcTrailingExitFee = calculatedPositionSize * trailingSlFeeRate
      const netAmount = grossAmount - calcEntryFee - calcTrailingExitFee
      const netAmountPercent = safeDivide(netAmount, currentAccountSize) * 100

      if (priceDiff >= 0) {
        trailingProfit = netAmount
        trailingProfitPercent = netAmountPercent
        trailingLoss = 0
        trailingLossPercent = 0
      } else {
        trailingLoss = Math.abs(netAmount)
        trailingLossPercent = Math.abs(netAmountPercent)
        trailingProfit = 0
        trailingProfitPercent = 0
      }
    }

    setTrailingStopProfit(trailingProfit)
    setTrailingStopProfitPercent(trailingProfitPercent)
    setTrailingStopLossAmount(trailingLoss)
    setTrailingStopLossPercent(trailingLossPercent)
    setExitFeeTrailingSL(calcTrailingExitFee)
    setTotalFeesTrailingSL(calcEntryFee + calcTrailingExitFee)

    // R/R Calculation
    const calcNetRiskRewardRatio = useStopLoss && isStopLossValid && calcNetLossAmount > 0 ? safeDivide(calcWeightedNetProfit, calcNetLossAmount) : NaN
    const calcGrossRiskRewardRatio = useStopLoss && isStopLossValid && calcGrossLossAmount > 0 ? safeDivide(calcWeightedGrossProfit, calcGrossLossAmount) : NaN

    // Liquidation Price
    let calcLiquidationPrice = NaN
    let calcRealLiquidationPrice = NaN
    if (currentLeverage > 1 && calculatedQuantity > 0 && currentEntryPrice > 0) {
      const qty = calculatedQuantity
      const entry = currentEntryPrice
      const initialMarginForLiq = calculatedMargin > 0 ? calculatedMargin : safeDivide(calculatedPositionSize, currentLeverage)
      const accountBalance = currentAccountSize
      if (tradeDirection === 'LONG') {
        const stdDenominator = qty * (1 - MMR)
        if (stdDenominator !== 0) {
          calcLiquidationPrice = Math.max(0, safeDivide(qty * entry - initialMarginForLiq, stdDenominator))
        }
        const realDenominator = qty * (1 - MMR)
        if (realDenominator !== 0) {
          calcRealLiquidationPrice = Math.max(0, safeDivide(qty * entry - accountBalance, realDenominator))
        }
      } else {
        const stdDenominator = qty * (1 + MMR)
        if (stdDenominator !== 0) {
          calcLiquidationPrice = safeDivide(initialMarginForLiq + qty * entry, stdDenominator)
        }
        const realDenominator = qty * (1 + MMR)
        if (realDenominator !== 0) {
          calcRealLiquidationPrice = safeDivide(accountBalance + qty * entry, realDenominator)
        }
      }
    } else if (currentLeverage === 1) {
      calcLiquidationPrice = tradeDirection === 'LONG' ? 0 : Infinity
      calcRealLiquidationPrice = calcLiquidationPrice
    }

    // Update State
    setQuantity(calculatedQuantity)
    setEffectiveMargin(calculatedMargin)
    setTotalPositionSize(calculatedPositionSize)
    setWeightedTakeProfit(calcWeightedNetProfit)
    setWeightedGrossTakeProfit(calcWeightedGrossProfit)
    setLossAmount(calcNetLossAmount)
    setLossPercent(calcNetLossPercent)
    setGrossLossAmount(calcGrossLossAmount)
    setGrossLossPercent(calcGrossLossPercent)
    setRiskRewardRatio(calcNetRiskRewardRatio)
    setGrossRiskRewardRatio(calcGrossRiskRewardRatio)
    setLiquidationPrice(calcLiquidationPrice)
    setRealLiquidationPrice(calcRealLiquidationPrice)
    setEntryFee(calcEntryFee)
    setExitFeeTP(calcExitFeeTP)
    setExitFeeSL(calcExitFeeSL)
    setTotalFeesTP(calcEntryFee + calcExitFeeTP)
    setTotalFeesSL(calcEntryFee + calcExitFeeSL)
  }

  // --- Effects ---
  useEffect(() => {
    calculateTrailingStopTrigger()
  }, [trailingStopSimulationPrice, trailingActivationPrice, trailingStopPercent, tradeDirection, useTrailingStop, calculateTrailingStopTrigger])

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
    useTrailingStop,
    trailingStopTriggerPrice,
    JSON.stringify(takeProfits.map((tp) => ({ enabled: tp.enabled, quantity: tp.quantity, price: tp.price, percent: tp.percent }))),
  ])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryPrice, tradeDirection, useStopLoss, stopLossPercentInput])

  // SL Distance helper
  const getSLDistance = () => {
    if (useStopLoss && entryPrice > 0 && stopLossPrice !== null && stopLossPrice > 0) {
      let d = Math.abs(entryPrice - stopLossPrice)
      const isValid = (tradeDirection === 'LONG' && stopLossPrice < entryPrice) || (tradeDirection === 'SHORT' && stopLossPrice > entryPrice)
      return isValid && d > 0 ? d : null
    }
    return null
  }

  return {
    // State values
    exchange,
    accountSizeInput,
    accountSize,
    symbol,
    leverageInput,
    leverage,
    exceedsAccount,
    requiredAccountSize,
    tradeDirection,
    entryPriceInput,
    entryPrice,
    autoPriceUpdate,
    takeProfits,
    useStopLoss,
    stopLossPriceInput,
    stopLossPrice,
    stopLossPercentInput,
    stopLossPercent,
    useTrailingStop,
    trailingStopPercentInput,
    trailingStopPercent,
    trailingActivationPriceInput,
    trailingActivationPrice,
    trailingStopSimulationPriceInput,
    trailingStopSimulationPrice,
    trailingStopTriggerPrice,
    trailingStopLossAmount,
    trailingStopLossPercent,
    trailingStopProfit,
    trailingStopProfitPercent,
    calculationMode,
    positionSizeUSDTInput,
    positionSizeUSDT,
    riskPercentInput,
    riskPercent,
    quantity,
    effectiveMargin,
    totalPositionSize,
    lossAmount,
    lossPercent,
    grossLossAmount,
    grossLossPercent,
    riskRewardRatio,
    grossRiskRewardRatio,
    liquidationPrice,
    realLiquidationPrice,
    weightedTakeProfit,
    weightedGrossTakeProfit,
    entryFee,
    exitFeeTP,
    exitFeeSL,
    exitFeeTrailingSL,
    totalFeesTP,
    totalFeesSL,
    totalFeesTrailingSL,
    riskAmountDisplay,
    slDistDisplay,
    
    // Handlers
    setExchange,
    setSymbol,
    setTradeDirection,
    setCalculationMode,
    setUseStopLoss,
    setUseTrailingStop,
    setAutoPriceUpdate,
    tpAutoPriceUpdate,
    slAutoPriceUpdate,
    setTPAutoPriceUpdate,
    setSLAutoPriceUpdate,
    handleTPAutoPriceToggle,
    handleSLAutoPriceToggle,
    handleAccountSizeChange,
    handleLeverageChange,
    handleEntryPriceChange,
    handlePositionSizeChange,
    handleRiskPercentChange,
    handleTrailingStopPercentChange,
    handleTrailingActivationPriceChange,
    handleTrailingStopSimulationPriceChange,
    handleAutoSetActivationPrice,
    handleTakeProfitChange,
    handleTakeProfitPreset,
    handleStopLossPriceChange,
    handleStopLossPercentChange,
    handleStopLossPreset,
    
    // Utilities
    getSLDistance,
  }
}