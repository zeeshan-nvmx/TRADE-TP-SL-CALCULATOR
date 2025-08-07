import React from 'react'
import { FIXED_USDT_PRESETS, RISK_PERCENT_PRESETS } from '../constants/presets'

const PositionSizing = ({
  calculationMode,
  setCalculationMode,
  useStopLoss,
  positionSizeUSDTInput,
  positionSizeUSDT,
  handlePositionSizeChange,
  riskPercentInput,
  riskPercent,
  handleRiskPercentChange
}) => {
  return (
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
            Fixed USDT
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
            Risk %
          </button>
        </div>
      </div>
      {calculationMode === 'risk' && useStopLoss && (
        <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
          <p className='text-xs text-blue-700 dark:text-blue-300'>Calculates position size so hitting the Stop Loss risks the specified % of account size.</p>
        </div>
      )}
      {calculationMode === 'fixed' && (
        <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
          <p className='text-xs text-blue-700 dark:text-blue-300'>Sets position size based on the specified Margin multiplied by Leverage.</p>
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
            {FIXED_USDT_PRESETS.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePositionSizeChange(amount.toString())}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  positionSizeUSDT === amount
                    ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                {amount}
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
              className='w-full h-8 px-2 py-1 text-xs rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
              placeholder='e.g., 2'
            />
            <div className='px-2 flex items-center text-xs rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'>
              %
            </div>
          </div>
          <div className='flex flex-wrap gap-1 pt-1'>
            {RISK_PERCENT_PRESETS.map((rp) => (
              <button
                key={rp}
                onClick={() => handleRiskPercentChange(rp.toString())}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  riskPercent === rp
                    ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}>
                {rp}%
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PositionSizing