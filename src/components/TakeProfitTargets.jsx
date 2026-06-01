import React from 'react'
import { TP_PERCENT_PRESETS } from '../constants/presets'
import { formatNumber } from '../utils/calculations'

const TakeProfitTargets = ({
  takeProfits,
  handleTakeProfitChange,
  handleTakeProfitPreset,
  tradeDirection,
  entryPrice,
  tpAutoPriceUpdate,
  handleTPAutoPriceToggle,
  isLoadingPrice
}) => {
  return (
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
            {tp.enabled && (
              <div className={`text-xs font-medium tabular-nums ${
                tp.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
              } ${formatNumber(tp.profit) === 'N/A' || tp.profit === 0 ? 'invisible' : ''}`}>
                Net Profit: {tp.profit > 0 ? '+' : ''}{formatNumber(tp.profit)} USDT
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
              <div>
                <div className='flex justify-between items-center mb-1'>
                  <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>Price</label>
                  <button
                    onClick={() => handleTPAutoPriceToggle(index, !tpAutoPriceUpdate[index])}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      tpAutoPriceUpdate[index]
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                    title={tpAutoPriceUpdate[index] ? 'Auto price updates enabled' : 'Manual price mode - auto updates disabled'}>
                    {tpAutoPriceUpdate[index] ? '🔄 Auto' : '✋ Manual'}
                  </button>
                </div>
                <div className='flex relative'>
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
                {TP_PERCENT_PRESETS.map((percent) => (
                  <button
                    key={`tp-${index}-${percent}`}
                    onClick={() => handleTakeProfitPreset(index, percent)}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      Math.abs(tp.percent - percent) < 0.01
                        ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
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
  )
}

export default TakeProfitTargets