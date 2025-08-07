// Mathematical utility functions for trading calculations

export const safeDivide = (numerator, denominator) => {
  if (!denominator || isNaN(denominator) || !isFinite(denominator) || denominator === 0) {
    return 0
  }
  const result = numerator / denominator
  return isNaN(result) || !isFinite(result) ? 0 : result
}

export const parseFloatInput = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

export const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A'
  const fixed = num.toFixed(decimals)
  return fixed === `-0.${'0'.repeat(decimals)}` ? `0.${'0'.repeat(decimals)}` : fixed
}

export const formatHighPrecision = (num, decimals = 6) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return 'N/A'
  if (Math.abs(num) > 0 && Math.abs(num) < 1e-4) decimals = 8
  const fixed = num.toFixed(decimals)
  return fixed === `-0.${'0'.repeat(decimals)}` ? `0.${'0'.repeat(decimals)}` : fixed
}

export const formatPrice = (num) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) {
    if (num === Infinity) return '∞'
    return 'N/A'
  }
  let decimals = 2
  if (num > 0 && num < 1) decimals = 6
  else if (num > 0 && num < 100) decimals = 4
  const fixed = num.toFixed(decimals)
  return fixed === `-0.${'0'.repeat(decimals)}` ? `0.${'0'.repeat(decimals)}` : fixed
}