import React, { useEffect } from 'react'
import { useCalculator } from './hooks/useCalculator'
import { usePriceUpdater } from './hooks/useBinanceAPI'
import TradeSetup from './components/TradeSetup'
import TakeProfitTargets from './components/TakeProfitTargets'
import StopLossConfig from './components/StopLossConfig'
import PositionSizing from './components/PositionSizing'
import ResultsPanel from './components/ResultsPanel'

const BinanceFuturesCalculatorNew = () => {
  const calculatorState = useCalculator()
  const { price: currentPrice, loading: priceLoading, status: priceStatus } = usePriceUpdater(calculatorState.symbol, 3000)

  // Update entry price when we get a new price from the API (only if auto mode is enabled)
  useEffect(() => {
    if (calculatorState.autoPriceUpdate && currentPrice && currentPrice !== calculatorState.entryPrice) {
      calculatorState.handleEntryPriceChange(currentPrice.toString())
    }
  }, [currentPrice, calculatorState.autoPriceUpdate, calculatorState.entryPrice, calculatorState.handleEntryPriceChange])

  return (
    <div className='max-w-4xl mx-auto p-4 dark:bg-black bg-white text-sm font-sans'>
      <h1 className='text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100'>Futures Calculator</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Left column - Inputs */}
        <div className='space-y-4'>
          {/* Trade Setup */}
          <TradeSetup
            exchange={calculatorState.exchange}
            setExchange={calculatorState.setExchange}
            accountSizeInput={calculatorState.accountSizeInput}
            handleAccountSizeChange={calculatorState.handleAccountSizeChange}
            symbol={calculatorState.symbol}
            setSymbol={calculatorState.setSymbol}
            leverageInput={calculatorState.leverageInput}
            leverage={calculatorState.leverage}
            handleLeverageChange={calculatorState.handleLeverageChange}
            exceedsAccount={calculatorState.exceedsAccount}
            requiredAccountSize={calculatorState.requiredAccountSize}
            accountSize={calculatorState.accountSize}
            tradeDirection={calculatorState.tradeDirection}
            setTradeDirection={calculatorState.setTradeDirection}
            entryPriceInput={calculatorState.entryPriceInput}
            handleEntryPriceChange={calculatorState.handleEntryPriceChange}
            isLoadingPrice={priceLoading}
            priceUpdateStatus={priceStatus}
            autoPriceUpdate={calculatorState.autoPriceUpdate}
            setAutoPriceUpdate={calculatorState.setAutoPriceUpdate}
          />

          {/* Take Profit Targets */}
          <TakeProfitTargets
            takeProfits={calculatorState.takeProfits}
            handleTakeProfitChange={calculatorState.handleTakeProfitChange}
            handleTakeProfitPreset={calculatorState.handleTakeProfitPreset}
            tradeDirection={calculatorState.tradeDirection}
            entryPrice={calculatorState.entryPrice}
          />

          {/* Stop Loss */}
          <StopLossConfig
            useStopLoss={calculatorState.useStopLoss}
            setUseStopLoss={calculatorState.setUseStopLoss}
            stopLossPriceInput={calculatorState.stopLossPriceInput}
            stopLossPrice={calculatorState.stopLossPrice}
            handleStopLossPriceChange={calculatorState.handleStopLossPriceChange}
            stopLossPercentInput={calculatorState.stopLossPercentInput}
            handleStopLossPercentChange={calculatorState.handleStopLossPercentChange}
            handleStopLossPreset={calculatorState.handleStopLossPreset}
            tradeDirection={calculatorState.tradeDirection}
            entryPrice={calculatorState.entryPrice}
            useTrailingStop={calculatorState.useTrailingStop}
            setUseTrailingStop={calculatorState.setUseTrailingStop}
            trailingStopPercentInput={calculatorState.trailingStopPercentInput}
            trailingStopPercent={calculatorState.trailingStopPercent}
            handleTrailingStopPercentChange={calculatorState.handleTrailingStopPercentChange}
            trailingActivationPriceInput={calculatorState.trailingActivationPriceInput}
            trailingActivationPrice={calculatorState.trailingActivationPrice}
            handleTrailingActivationPriceChange={calculatorState.handleTrailingActivationPriceChange}
            handleAutoSetActivationPrice={calculatorState.handleAutoSetActivationPrice}
            trailingStopSimulationPriceInput={calculatorState.trailingStopSimulationPriceInput}
            handleTrailingStopSimulationPriceChange={calculatorState.handleTrailingStopSimulationPriceChange}
            trailingStopTriggerPrice={calculatorState.trailingStopTriggerPrice}
          />

          {/* Position Sizing */}
          <PositionSizing
            calculationMode={calculatorState.calculationMode}
            setCalculationMode={calculatorState.setCalculationMode}
            useStopLoss={calculatorState.useStopLoss}
            positionSizeUSDTInput={calculatorState.positionSizeUSDTInput}
            positionSizeUSDT={calculatorState.positionSizeUSDT}
            handlePositionSizeChange={calculatorState.handlePositionSizeChange}
            riskPercentInput={calculatorState.riskPercentInput}
            riskPercent={calculatorState.riskPercent}
            handleRiskPercentChange={calculatorState.handleRiskPercentChange}
          />
        </div>

        {/* Right column - Results */}
        <ResultsPanel {...calculatorState} />
      </div>
      
      {/* Footer */}
      <div className='mt-8 text-center text-neutral-500 dark:text-neutral-400 text-xs'>
        <p>
          Disclaimer: Calculations are estimates and may differ slightly from exchange values due to fees, funding rates, MMR tiers, and price volatility. Always use
          official exchange tools for final confirmation.
        </p>
        <p className='mt-1'>© {new Date().getFullYear()} Futures Calculator</p>
      </div>
    </div>
  )
}

export default BinanceFuturesCalculatorNew