/**
 * Formatting utilities for consistent number and currency display across the application
 */

/**
 * Formats a number with thousands separators
 * 
 * @param value - The number to format
 * @param precision - Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export const formatNumber = (value: number, precision: number = 0): string => {
  return value.toLocaleString('en-US', { 
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
};

/**
 * Formats a currency value with appropriate scaling and symbol
 * 
 * @param value - The currency value to format
 * @param useAbbreviations - Whether to use K/M abbreviations for large numbers (default: true)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, useAbbreviations: boolean = true): string => {
  if (useAbbreviations) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
  }
  
  // For smaller values or when abbreviations are disabled
  return value.toLocaleString('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formats a percentage value
 * 
 * @param value - The percentage value (0-100)
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted percentage string with % symbol
 */
export const formatPercent = (value: number, precision: number = 1): string => {
  return `${value.toFixed(precision)}%`;
};

/**
 * Formats a number as compact representation (e.g., 1.2K, 3.4M)
 * 
 * @param value - The number to format
 * @returns Formatted compact string
 */
export const formatCompact = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};

/**
 * Returns an estimate of days until stock-out based on current stock and demand
 * 
 * @param currentStock - Current inventory level
 * @param estimatedDemand - Expected demand (items per day)
 * @returns Days until stock-out or "Overstocked"
 */
export const calculateStockOutDays = (currentStock: number, estimatedDailyDemand: number): string => {
  if (estimatedDailyDemand <= 0) return "N/A";
  
  const days = Math.floor(currentStock / estimatedDailyDemand);
  
  if (days <= 0) {
    return "Out of stock";
  } else if (days <= 7) {
    return `${days} days (Critical)`;
  } else if (days <= 30) {
    return `${days} days (Low)`;
  } else {
    return `${days} days`;
  }
}; 