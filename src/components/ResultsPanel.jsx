import React from 'react'
import { EXCHANGE_FEES } from '../constants/presets'
import PositionSizing from './PositionSizing'
import { formatNumber, formatHighPrecision, formatPrice, safeDivide } from '../utils/calculations'

const ResultsPanel = ({
  // Calculator state
  exchange,
  symbol,
  accountSize,
  calculationMode,
  useStopLoss,
  tradeDirection,
  entryPrice,
  totalPositionSize,
  quantity,
  effectiveMargin,
  exceedsAccount,
  riskAmountDisplay,
  positionSizeUSDT,
  positionSizeUSDTInput,
  handlePositionSizeChange,
  setCalculationMode,
  riskPercentInput,
  riskPercent,
  handleRiskPercentChange,
  leverage,
  slDistDisplay,
  riskRewardRatio,
  grossRiskRewardRatio,
  entryFee,
  exitFeeTP,
  exitFeeSL,
  totalFeesTP,
  totalFeesSL,
  liquidationPrice,
  realLiquidationPrice,
  takeProfits,
  weightedTakeProfit,
  weightedGrossTakeProfit,
  useTrailingStop,
  trailingStopTriggerPrice,
  totalFeesTrailingSL,
  stopLossPrice,
  stopLossPercent,
  lossAmount,
  lossPercent,
  grossLossAmount,
  grossLossPercent,
  trailingActivationPrice,
  trailingStopSimulationPrice,
  trailingStopProfit,
  trailingStopProfitPercent,
  trailingStopLossAmount,
  trailingStopLossPercent,
  trailingStopPercent,
  getSLDistance
}) => {
  const slDistance = getSLDistance()

  return (
    <div className='space-y-4'>
      {/* Trade Analysis */}
      <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
        <h2 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Trade Analysis</h2>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Total Position (USDT)</label>
            <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'>
              {formatNumber(totalPositionSize)}
            </div>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
              {calculationMode === 'risk' && useStopLoss
                ? `Risk: ${formatNumber(riskAmountDisplay)} USDT`
                : calculationMode === 'fixed'
                ? `= ${formatNumber(positionSizeUSDT)} × ${leverage}x`
                : 'N/A'}
            </p>
          </div>
          <div>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Quantity ({symbol.replace(/USDT|USD|BUSD/g, '')})</label>
            <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'>
              {formatHighPrecision(quantity)}
            </div>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>{slDistDisplay > 0 ? `SL Dist: ${formatPrice(slDistDisplay)}` : ''}</p>
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
              {formatNumber(effectiveMargin)} USDT
            </div>
            {exceedsAccount && <p className='text-xs text-amber-600 dark:text-amber-400 mt-1'>Exceeds account by {formatNumber(effectiveMargin - accountSize)}</p>}
          </div>
          <div>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Risk/Reward Ratio</label>
            <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100'>
              {formatNumber(riskRewardRatio) !== 'N/A' ? `1 : ${formatNumber(riskRewardRatio)}` : 'N/A'}
            </div>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>
              Net Profit / Net Loss
              {formatNumber(grossRiskRewardRatio) !== 'N/A' && ` (Gross 1:${formatNumber(grossRiskRewardRatio)})`}
            </p>
          </div>
        </div>
      </div>

      {/* Fees Analysis */}
      <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
        <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>{EXCHANGE_FEES[exchange].name} Fees</h3>
        <div className='grid grid-cols-3 gap-2 text-xs'>
          <div>
            <label className='font-medium text-neutral-500 dark:text-neutral-400 block'>Maker / Taker</label>
            <div className='mt-1 text-neutral-700 dark:text-neutral-300'>
              {(EXCHANGE_FEES[exchange].maker * 100).toFixed(2)}% / {(EXCHANGE_FEES[exchange].taker * 100).toFixed(2)}%
            </div>
          </div>
          <div>
            <label className='font-medium text-neutral-500 dark:text-neutral-400 block'>Entry Fee (Taker)</label>
            <div className='mt-1 text-red-500 dark:text-red-400'>{formatNumber(entryFee)} USDT</div>
          </div>
          <div>
            <label className='font-medium text-neutral-500 dark:text-neutral-400 block'>Exit Fee (Est.)</label>
            <div className='mt-1 text-red-500 dark:text-red-400'>
              TP: {formatNumber(exitFeeTP)} / SL: {formatNumber(exitFeeSL)}
            </div>
          </div>
        </div>
        <div className='text-xs'>
          <span className='font-medium text-neutral-500 dark:text-neutral-400'>Total Fees (Est.): </span>
          <span className='text-red-500 dark:text-red-400'>
            TP Scenario: {formatNumber(totalFeesTP)} ({formatNumber(safeDivide(totalFeesTP, totalPositionSize) * 100, 3)}%) / SL Scenario: {formatNumber(totalFeesSL)}{' '}
            ({formatNumber(safeDivide(totalFeesSL, totalPositionSize) * 100, 3)}%)
            {useTrailingStop &&
              trailingStopTriggerPrice !== null &&
              ` / Trailing SL: ${formatNumber(totalFeesTrailingSL)} (${formatNumber(safeDivide(totalFeesTrailingSL, totalPositionSize) * 100, 3)}%)`}
          </span>
        </div>
      </div>

      {/* Position Sizing */}
      <PositionSizing
        calculationMode={calculationMode}
        setCalculationMode={setCalculationMode}
        useStopLoss={useStopLoss}
        positionSizeUSDTInput={positionSizeUSDTInput}
        positionSizeUSDT={positionSizeUSDT}
        handlePositionSizeChange={handlePositionSizeChange}
        riskPercentInput={riskPercentInput}
        riskPercent={riskPercent}
        handleRiskPercentChange={handleRiskPercentChange}
      />

      {/* Profit Scenarios */}
      <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
        <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Profit Scenarios</h3>
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
                    <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>
                      TP {originalIndex + 1} @ {formatPrice(tp.price)} ({formatNumber(tp.percent)}%)
                    </span>
                    <span className='text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-300'>
                      {formatNumber(tp.quantity, 0)}% Qty
                    </span>
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Profit (Gross)</label>
                      <div
                        className={`px-2 py-1 text-xs rounded-md ${tp.grossProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tp.grossProfit >= 0 ? '+' : ''}
                        {formatNumber(tp.grossProfit)} ({tp.grossProfit >= 0 ? '+' : ''}
                        {formatNumber(tp.grossProfitPercent)}%)
                      </div>
                    </div>
                    <div>
                      <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Profit (Net)</label>
                      <div className={`px-2 py-1 text-xs rounded-md ${tp.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {tp.profit >= 0 ? '+' : ''}
                        {formatNumber(tp.profit)} ({tp.profit >= 0 ? '+' : ''}
                        {formatNumber(tp.profitPercent)}%)
                      </div>
                    </div>
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
              <span className='text-xs font-medium text-neutral-700 dark:text-neutral-300'>Combined Profit (Net)</span>
              <span className={`text-xs font-medium ${weightedTakeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {weightedTakeProfit >= 0 ? '+' : ''}
                {formatNumber(weightedTakeProfit)} USDT
              </span>
            </div>
            <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
              Gross Profit:&nbsp;
              <span className={`font-medium ${weightedGrossTakeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {weightedGrossTakeProfit >= 0 ? '+' : ''}
                {formatNumber(weightedGrossTakeProfit)} USDT
              </span>
            </div>
            <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
              Final balance:&nbsp;
              <span className={`font-medium ${weightedTakeProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                {formatNumber(accountSize + weightedTakeProfit)} USDT
              </span>
            </div>
            <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
              Fees paid: <span className='font-medium text-red-500 dark:text-red-400'>{formatNumber(totalFeesTP)} USDT</span>
            </div>
          </div>
        )}
      </div>

      {/* Loss Scenario / Protection */}
      <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
        {useStopLoss ? (
          <>
            <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Loss Scenario</h3>
            {slDistance !== null ? (
              <>
                <p className='text-xs text-neutral-500 dark:text-neutral-400 -mt-2 mb-2'>
                  If SL @ {formatPrice(stopLossPrice)} ({formatNumber(stopLossPercent)}%) is hit:
                </p>
                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Loss (Gross)</label>
                    <div className='px-2 py-1 text-xs rounded-md text-red-500 dark:text-red-400'>
                      -{formatNumber(grossLossAmount)} ({formatNumber(grossLossPercent)}%)
                    </div>
                  </div>
                  <div>
                    <label className='text-xs text-neutral-500 dark:text-neutral-400 block'>Loss (Net)</label>
                    <div className='px-2 py-1 text-xs rounded-md text-red-500 dark:text-red-400'>
                      -{formatNumber(lossAmount)} ({formatNumber(lossPercent)}%)
                    </div>
                  </div>
                </div>
                <div className='p-2 border border-neutral-200 dark:border-neutral-800 rounded-md mt-2'>
                  <div className='text-xs text-neutral-500 dark:text-neutral-400'>
                    Final balance: <span className='font-medium text-red-500 dark:text-red-400'>{formatNumber(accountSize - lossAmount)} USDT</span>
                  </div>
                  <div className='mt-1 text-xs text-neutral-500 dark:text-neutral-400'>
                    Fees paid: <span className='font-medium text-red-500 dark:text-red-400'>{formatNumber(totalFeesSL)} USDT</span>
                  </div>
                </div>
              </>
            ) : (
              <p className='text-xs text-orange-600 dark:text-orange-400'>Invalid Stop Loss price (must be {tradeDirection === 'LONG' ? 'below' : 'above'} entry).</p>
            )}
          </>
        ) : (
          <div className='space-y-2'>
            <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100'>Loss Protection</h3>
            <div className='p-2 border border-yellow-300 dark:border-yellow-800 rounded-md bg-yellow-50 dark:bg-yellow-900/20'>
              <p className='text-xs text-yellow-700 dark:text-yellow-400'>
                <strong>No stop loss set.</strong> Max loss determined by liquidation.
              </p>
              <p className='text-xs text-yellow-700 dark:text-yellow-400 mt-1'>
                Liquidation at <strong>{formatPrice(realLiquidationPrice)}</strong> (Real Price) would result in a loss of approx.&nbsp;
                <strong>{formatNumber(accountSize)} USDT</strong> (your entire balance used for margin + buffer).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Trailing Stop Loss Scenario */}
      {useTrailingStop && trailingStopTriggerPrice !== null && (
        <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
          <h3 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Trailing Stop Scenario</h3>

          <div className='p-2 border-l-4 border-l-blue-500 border-t border-r border-b border-neutral-200 dark:border-neutral-700 rounded-md bg-blue-50/30 dark:bg-blue-900/10'>
            <p className='text-xs text-blue-700 dark:text-blue-400'>
              This scenario simulates what would happen if your trailing stop is triggered at {formatPrice(trailingStopTriggerPrice)}.
            </p>
          </div>

          <div className='space-y-3'>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Price Simulation</label>
                <div className='px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50'>
                  <div className='flex justify-between'>
                    <span className='text-xs text-neutral-600 dark:text-neutral-400'>Entry:</span>
                    <span className='text-xs font-medium text-neutral-800 dark:text-neutral-200'>{formatPrice(entryPrice)}</span>
                  </div>
                  <div className='flex justify-between mt-1'>
                    <span className='text-xs text-neutral-600 dark:text-neutral-400'>Activation:</span>
                    <span className='text-xs font-medium text-neutral-800 dark:text-neutral-200'>{formatPrice(trailingActivationPrice)}</span>
                  </div>
                  <div className='flex justify-between mt-1'>
                    <span className='text-xs text-neutral-600 dark:text-neutral-400'>Peak price:</span>
                    <span className='text-xs font-medium text-neutral-800 dark:text-neutral-200'>{formatPrice(trailingStopSimulationPrice)}</span>
                  </div>
                  <div className='flex justify-between mt-1'>
                    <span className='text-xs text-neutral-600 dark:text-neutral-400'>Trailing stop:</span>
                    <span className='text-xs font-medium text-neutral-800 dark:text-neutral-200'>{formatPrice(trailingStopTriggerPrice)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Outcome</label>
                <div className='px-3 py-2 text-sm rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50'>
                  {trailingStopProfit > 0 ? (
                    <>
                      <div className='flex justify-between'>
                        <span className='text-xs text-neutral-600 dark:text-neutral-400'>Profit:</span>
                        <span className='text-xs font-medium text-green-600 dark:text-green-400'>
                          +{formatNumber(trailingStopProfit)} USDT ({formatNumber(trailingStopProfitPercent)}%)
                        </span>
                      </div>
                      <div className='flex justify-between mt-1'>
                        <span className='text-xs text-neutral-600 dark:text-neutral-400'>Final balance:</span>
                        <span className='text-xs font-medium text-green-600 dark:text-green-400'>{formatNumber(accountSize + trailingStopProfit)} USDT</span>
                      </div>
                    </>
                  ) : trailingStopLossAmount > 0 ? (
                    <>
                      <div className='flex justify-between'>
                        <span className='text-xs text-neutral-600 dark:text-neutral-400'>Loss:</span>
                        <span className='text-xs font-medium text-red-500 dark:text-red-400'>
                          -{formatNumber(trailingStopLossAmount)} USDT ({formatNumber(trailingStopLossPercent)}%)
                        </span>
                      </div>
                      <div className='flex justify-between mt-1'>
                        <span className='text-xs text-neutral-600 dark:text-neutral-400'>Final balance:</span>
                        <span className='text-xs font-medium text-red-500 dark:text-red-400'>{formatNumber(accountSize - trailingStopLossAmount)} USDT</span>
                      </div>
                    </>
                  ) : (
                    <div className='text-xs text-neutral-600 dark:text-neutral-400'>No price movement simulated yet</div>
                  )}
                  <div className='flex justify-between mt-1'>
                    <span className='text-xs text-neutral-600 dark:text-neutral-400'>Fees paid:</span>
                    <span className='text-xs font-medium text-red-500 dark:text-red-400'>{formatNumber(totalFeesTrailingSL)} USDT</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
              <p className='text-xs text-blue-700 dark:text-blue-300'>
                <strong>How it works:</strong> After price reaches the activation level ({formatPrice(trailingActivationPrice)}), the trailing stop follows at{' '}
                {formatNumber(trailingStopPercent)}% distance. If price retraces by {formatNumber(trailingStopPercent)}% from its highest point, the stop is
                triggered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liquidation Analysis */}
      <div className='p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3'>
        <h2 className='text-base font-medium text-neutral-900 dark:text-neutral-100 mb-2'>Liquidation Analysis</h2>
        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Liquidation Price (Est.)</label>
            <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-red-500 dark:text-red-400'>
              {formatPrice(liquidationPrice)}
            </div>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>Based on margin & MMR</p>
          </div>
          <div>
            <label className='text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1 block'>Real Liq. Price (Cross)</label>
            <div className='h-9 px-3 py-2 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 text-red-500 dark:text-red-400'>
              {formatPrice(realLiquidationPrice)}
            </div>
            <p className='text-xs text-neutral-500 dark:text-neutral-400 mt-1'>Includes account buffer</p>
          </div>
        </div>
        <div className='p-2 border border-blue-200 dark:border-blue-800 rounded-md bg-blue-50 dark:bg-blue-900/20'>
          <p className='text-xs text-blue-700 dark:text-blue-300'>
            <strong>Liquidation buffer:</strong> {formatNumber(Math.max(0, accountSize - effectiveMargin))} USDT extra funds provide additional protection.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResultsPanel