// Preset values for quick input selection

export const EXCHANGE_FEES = {
  binance: { maker: 0.0002, taker: 0.0005, name: 'Binance' },
  bybit: { maker: 0.0001, taker: 0.0006, name: 'Bybit' },
}

export const LEVERAGE_PRESETS = [5, 10, 15, 20, 25, 35, 45, 50, 60, 75, 100]

export const TP_PERCENT_PRESETS = [1, 2, 3, 5, 6, 7, 9, 10, 12.5, 15]

export const SL_PERCENT_PRESETS = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]

export const TRAILING_STOP_PERCENT_PRESETS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5]

export const RISK_PERCENT_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50]

export const FIXED_USDT_PRESETS = [
  20, 50, 100, 200, 250, 300, 400, 500, 600, 800, 1000,
  1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7500, 8000, 10000, 12500, 15000, 20000
]

export const DEFAULT_TAKE_PROFITS = [
  {
    enabled: true,
    priceInput: '',
    price: null,
    percentInput: '2',
    percent: 2,
    quantityInput: '100',
    quantity: 100,
    profit: 0,
    profitPercent: 0,
    grossProfit: 0,
    grossProfitPercent: 0,
  },
  {
    enabled: false,
    priceInput: '',
    price: null,
    percentInput: '3',
    percent: 3,
    quantityInput: '0',
    quantity: 0,
    profit: 0,
    profitPercent: 0,
    grossProfit: 0,
    grossProfitPercent: 0,
  },
  {
    enabled: false,
    priceInput: '',
    price: null,
    percentInput: '5',
    percent: 5,
    quantityInput: '0',
    quantity: 0,
    profit: 0,
    profitPercent: 0,
    grossProfit: 0,
    grossProfitPercent: 0,
  },
]

// Maintenance Margin Rate for liquidation calculations
export const MMR = 0.005