import React from 'react'
import { SL_PERCENT_PRESETS, TRAILING_STOP_PERCENT_PRESETS } from '../constants/presets'
import { formatPrice } from '../utils/calculations'

const StopLossConfig = ({
  useStopLoss,
  setUseStopLoss,
  stopLossPriceInput,
  stopLossPrice,
  handleStopLossPriceChange,
  stopLossPercentInput,
  handleStopLossPercentChange,
  handleStopLossPreset,
  tradeDirection,
  entryPrice,
  useTrailingStop,
  setUseTrailingStop,
  trailingStopPercentInput,
  trailingStopPercent,
  handleTrailingStopPercentChange,
  trailingActivationPriceInput,
  trailingActivationPrice,
  handleTrailingActivationPriceChange,
  handleAutoSetActivationPrice,
  trailingStopSimulationPriceInput,
  handleTrailingStopSimulationPriceChange,
  trailingStopTriggerPrice,
  trailingStopSimulationPrice,
  slAutoPriceUpdate,
  handleSLAutoPriceToggle,
  isLoadingPrice
}) => {
  return (
    <div className='space-y-3 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg'>
      <div className='flex items-center justify-between mb-2'>
        <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100'>Stop Loss</h3>
        <label className='flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={useStopLoss}
            onChange={(e) => setUseStopLoss(e.target.checked)}
            className='h-4 w-4 rounded border-neutral-400 dark:border-neutral-600 text-blue-600 focus:ring-blue-500'
          />
          <span className='text-xs text-neutral-600 dark:text-neutral-400'>Enable Stop Loss</span>
        </label>
      </div>

      {useStopLoss ? (
        <div className='space-y-3'>
          <div className='grid grid-cols-3 gap-2 items-center'>
            <div className='flex justify-between items-center mb-1 col-span-1'>
              <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                Price
                {isLoadingPrice && <span className='text-blue-500 ml-1'>(updating...)</span>}
              </label>
              <button
                onClick={() => handleSLAutoPriceToggle(!slAutoPriceUpdate)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  slAutoPriceUpdate
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}
                title={slAutoPriceUpdate ? 'Auto price updates enabled' : 'Manual price mode - auto updates disabled'}>
                {slAutoPriceUpdate ? '🔄 Auto' : '✋ Manual'}
              </button>
            </div>
            <div className='flex col-span-2 relative'>
              <input
                type='text'
                inputMode='decimal'
                value={stopLossPriceInput}
                onChange={(e) => handleStopLossPriceChange(e.target.value)}
                className={`w-full h-8 px-2 py-1 text-xs rounded-md border ${
                  (stopLossPrice !== null && entryPrice > 0 && 
                   ((tradeDirection === 'LONG' && stopLossPrice >= entryPrice) || (tradeDirection === 'SHORT' && stopLossPrice <= entryPrice)))
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 focus:ring-red-500'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black focus:ring-neutral-950'
                } text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 dark:focus:ring-neutral-100`}
                placeholder={`${tradeDirection === 'LONG' ? 'Below' : 'Above'} entry price`}
              />
              {(stopLossPrice !== null && entryPrice > 0 && 
               ((tradeDirection === 'LONG' && stopLossPrice >= entryPrice) || (tradeDirection === 'SHORT' && stopLossPrice <= entryPrice))) && (
                <div
                  className='absolute -right-5 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400'
                  title={tradeDirection === 'LONG' ? 'SL above/at entry' : 'SL below/at entry'}>
                  ⚠️
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

          <div className='flex flex-wrap gap-1'>
            {SL_PERCENT_PRESETS.map((percent) => (
              <button
                key={`sl-${percent}`}
                onClick={() => handleStopLossPreset(percent)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  Math.abs((stopLossPrice && entryPrice) ? Math.abs((entryPrice - stopLossPrice) / entryPrice * 100) - percent : -1) < 0.1
                    ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                {percent}%
              </button>
            ))}
          </div>

          {/* Trailing Stop Loss Section */}
          <div className='mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>Trailing Stop Loss</h4>
              <label className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={useTrailingStop}
                  onChange={(e) => setUseTrailingStop(e.target.checked)}
                  className='h-4 w-4 rounded border-neutral-400 dark:border-neutral-600 text-blue-600 focus:ring-blue-500'
                />
                <span className='text-xs text-neutral-600 dark:text-neutral-400'>Enable Trailing</span>
              </label>
            </div>

            {useTrailingStop ? (
              <div className='space-y-3'>
                <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
                  <p className='text-xs text-blue-700 dark:text-blue-300'>
                    Trailing stop follows the price at a fixed distance and triggers when price retraces, locking in profits while limiting losses. Set activation and simulation prices to test the
                    action.
                  </p>
                </div>

                <div className='grid grid-cols-3 gap-2 items-center'>
                  <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>Trailing Distance</label>
                  <div className='flex col-span-2'>
                    <input
                      type='text'
                      inputMode='decimal'
                      value={trailingStopPercentInput}
                      onChange={(e) => handleTrailingStopPercentChange(e.target.value)}
                      className='w-full h-8 px-2 py-1 text-xs rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                      placeholder='e.g., 0.5'
                    />
                    <div className='px-2 flex items-center text-xs rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'>
                      %
                    </div>
                  </div>
                </div>

                <div className='flex flex-wrap gap-1'>
                  {TRAILING_STOP_PERCENT_PRESETS.map((percent) => (
                    <button
                      key={`trailing-${percent}`}
                      onClick={() => handleTrailingStopPercentChange(percent.toString())}
                      className={`text-xs px-2 py-1 rounded-md transition-colors ${
                        Math.abs(trailingStopPercent - percent) < 0.01
                          ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                          : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                      {percent}%
                    </button>
                  ))}
                </div>

                <div className='grid grid-cols-3 gap-2 items-center'>
                  <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>Activation Price</label>
                  <div className='flex col-span-2 relative'>
                    <input
                      type='text'
                      inputMode='decimal'
                      value={trailingActivationPriceInput}
                      onChange={(e) => handleTrailingActivationPriceChange(e.target.value)}
                      className='w-full h-8 px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                      placeholder={`${tradeDirection === 'LONG' ? 'Above' : 'Below'} entry price`}
                    />
                    <button
                      onClick={handleAutoSetActivationPrice}
                      className='absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
                      title='Set to entry +/- 2%'>
                      Auto
                    </button>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-2 items-center'>
                  <label className='text-xs text-neutral-500 dark:text-neutral-400 col-span-1'>
                    Simulation Price
                    <div className='text-xs text-neutral-400 dark:text-neutral-500'>(Current market price)</div>
                  </label>
                  <div className='flex col-span-2'>
                    <input
                      type='text'
                      inputMode='decimal'
                      value={trailingStopSimulationPriceInput}
                      onChange={(e) => handleTrailingStopSimulationPriceChange(e.target.value)}
                      className='w-full h-8 px-2 py-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                      placeholder={`${tradeDirection === 'LONG' ? 'Above' : 'Below'} activation price`}
                    />
                  </div>
                </div>

                <div className='p-2 border border-neutral-200 dark:border-neutral-700 rounded-md space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-xs text-neutral-500 dark:text-neutral-400'>Trailing Stop Trigger:</span>
                    <span className='text-xs font-medium text-neutral-900 dark:text-neutral-100'>
                      {trailingStopTriggerPrice !== null ? formatPrice(trailingStopTriggerPrice) : 'N/A'}
                    </span>
                  </div>

                  {trailingStopTriggerPrice !== null && (
                    <div className='text-xs text-blue-700 dark:text-blue-300'>
                      If price reaches {formatPrice(trailingActivationPrice)}, then moves to {formatPrice(trailingStopSimulationPrice)}, trailing stop will be at{' '}
                      {formatPrice(trailingStopTriggerPrice)}.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
                <p className='text-xs text-blue-700 dark:text-blue-300'>Enable trailing stop to simulate stop loss that moves with favorable price movement.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className='p-2 border border-yellow-300 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-900/20'>
          <p className='text-xs text-yellow-700 dark:text-yellow-400'>Enable stop loss for risk management and to use Risk % position sizing.</p>
        </div>
      )}
    </div>
  )
}

export default StopLossConfig