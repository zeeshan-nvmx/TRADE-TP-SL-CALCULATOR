import React from 'react'
import { LEVERAGE_PRESETS } from '../constants/presets'
import { formatNumber } from '../utils/calculations'
import SymbolSelector from './SymbolSelector'

const TradeSetup = ({
  exchange,
  setExchange,
  accountSizeInput,
  handleAccountSizeChange,
  symbol,
  setSymbol,
  leverageInput,
  leverage,
  handleLeverageChange,
  exceedsAccount,
  requiredAccountSize,
  accountSize,
  tradeDirection,
  setTradeDirection,
  entryPriceInput,
  handleEntryPriceChange,
  isLoadingPrice,
  priceUpdateStatus,
  autoPriceUpdate,
  setAutoPriceUpdate
}) => {
  return (
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
            Binance
          </button>
          <button
            onClick={() => setExchange('bybit')}
            className={`h-8 text-xs px-3 rounded-md transition-colors ${
              exchange === 'bybit'
                ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
            }`}>
            Bybit
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
          <div className='flex items-center gap-2'>
            <div className='flex-1 min-w-0'>
              <SymbolSelector
                symbol={symbol}
                setSymbol={setSymbol}
              />
            </div>
            {priceUpdateStatus && (
              <span
                className='text-xs flex-shrink-0'
                title={`Price updates: ${priceUpdateStatus}`}>
                {priceUpdateStatus === 'connected' ? '🟢' :
                 priceUpdateStatus === 'connecting' ? '🟡' : '🔴'}
              </span>
            )}
          </div>
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
                  ⚠️
                </div>
              )}
            </div>
            {exceedsAccount && <p className='text-xs text-amber-600 dark:text-amber-400'> Margin requires {formatNumber(requiredAccountSize)} USDT </p>}
            <div className='flex flex-wrap gap-1'>
              {LEVERAGE_PRESETS.map((lev) => (
                <button
                  key={lev}
                  onClick={() => handleLeverageChange(lev.toString())}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    leverage === lev
                      ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
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
          <div className='grid grid-cols-2 gap-1'>
            <button
              onClick={() => setTradeDirection('LONG')}
              className={`h-9 text-sm rounded-md transition-colors ${
                tradeDirection === 'LONG'
                  ? 'bg-green-600 text-white font-medium'
                  : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
              LONG
            </button>
            <button
              onClick={() => setTradeDirection('SHORT')}
              className={`h-9 text-sm rounded-md transition-colors ${
                tradeDirection === 'SHORT'
                  ? 'bg-red-600 text-white font-medium'
                  : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
              SHORT
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className='flex justify-between items-center mb-1'>
          <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
            Entry Price
            {isLoadingPrice && <span className='text-blue-500 ml-1'>(updating...)</span>}
          </label>
          <button
            onClick={() => setAutoPriceUpdate(!autoPriceUpdate)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoPriceUpdate
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
            }`}
            title={autoPriceUpdate ? 'Auto price updates enabled' : 'Manual price mode - auto updates disabled'}>
            {autoPriceUpdate ? '🔄 Auto' : '✋ Manual'}
          </button>
        </div>
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
  )
}

export default TradeSetup