import React, { useState } from 'react'
import { useBinanceSymbols } from '../hooks/useBinanceAPI'

const SymbolSelector = ({ symbol, setSymbol, className = "" }) => {
  const { symbols, loading } = useBinanceSymbols()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredSymbols = symbols.filter(s => 
    s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.baseAsset.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50) // Limit to 50 results for performance

  const handleSymbolSelect = (selectedSymbol) => {
    setSymbol(selectedSymbol)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`}>
      <div className='flex'>
        <input
          type='text'
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onFocus={() => setIsOpen(true)}
          className='w-full h-9 px-3 py-1 text-sm rounded-l-md border border-r-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
          placeholder='e.g., BTCUSDT'
        />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='px-2 h-9 rounded-r-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors'
          disabled={loading}>
          {loading ? '⏳' : '▼'}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown */}
          <div className='absolute top-full left-0 right-0 z-20 mt-1 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg max-h-60 overflow-hidden'>
            {/* Search input */}
            <div className='p-2 border-b border-neutral-200 dark:border-neutral-800'>
              <input
                type='text'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search symbols...'
                className='w-full px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-neutral-100'
                autoFocus
              />
            </div>
            
            {/* Symbol list */}
            <div className='max-h-48 overflow-y-auto'>
              {loading ? (
                <div className='p-3 text-xs text-neutral-500 dark:text-neutral-400'>Loading symbols...</div>
              ) : filteredSymbols.length > 0 ? (
                filteredSymbols.map((s) => {
                  const formatContractType = (contractType, deliveryDate) => {
                    if (contractType === 'PERPETUAL') return 'PERP'
                    if (contractType === 'CURRENT_QUARTER') return 'CQ'
                    if (contractType === 'NEXT_QUARTER') return 'NQ'
                    if (deliveryDate) {
                      const date = new Date(deliveryDate)
                      return date.toISOString().slice(2, 10).replace(/-/g, '') // YYMMDD format
                    }
                    return contractType
                  }

                  return (
                    <button
                      key={s.symbol}
                      onClick={() => handleSymbolSelect(s.symbol)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                        symbol === s.symbol ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-neutral-700 dark:text-neutral-300'
                      }`}>
                      <div className='flex justify-between items-center'>
                        <div className='flex flex-col'>
                          <span className='font-medium'>{s.symbol}</span>
                          <span className='text-xs text-neutral-400 dark:text-neutral-500'>
                            {s.baseAsset} • {formatContractType(s.contractType, s.deliveryDate)}
                          </span>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          s.contractType === 'PERPETUAL' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        }`}>
                          {formatContractType(s.contractType, s.deliveryDate)}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className='p-3 text-xs text-neutral-500 dark:text-neutral-400'>
                  {searchTerm ? 'No symbols found' : 'No symbols available'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default SymbolSelector