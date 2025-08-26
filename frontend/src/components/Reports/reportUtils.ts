import { TimeFrame } from '../NewDistributor/types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { PartStockRecommendation, VehicleLocationData } from '../../services/distributorDataService';

/**
 * Converts a TimeFrame to a display-friendly string
 */
export const formatTimeFrame = (timeFrame: TimeFrame): string => {
  switch (timeFrame) {
    case '7days':
      return 'Next 7 Days';
    case '1month':
      return 'Next Month';
    case '3months':
      return 'Next 3 Months';
    case '6months':
      return 'Next 6 Months';
    default:
      return String(timeFrame);
  }
};

/**
 * Calculates days until stockout based on current stock and estimated demand
 */
export const calculateDaysUntilStockout = (
  currentStock: number,
  estimatedDemand: number,
  timeFrame: TimeFrame
): number => {
  if (estimatedDemand <= 0) return Infinity;
  
  // Convert time frame to days for calculation
  const days = 
    timeFrame === '7days' ? 7 :
    timeFrame === '1month' ? 30 :
    timeFrame === '3months' ? 90 :
    timeFrame === '6months' ? 180 : 
    30; // Default to 1 month
  
  // Calculate daily demand rate
  const dailyDemand = estimatedDemand / days;
  
  // Calculate days until stockout
  return Math.floor(currentStock / dailyDemand);
};

/**
 * Returns a status label based on days until stockout
 */
export const getStockoutStatus = (daysUntilStockout: number): string => {
  if (daysUntilStockout <= 0) {
    return 'OUT OF STOCK';
  } else if (daysUntilStockout <= 7) {
    return `${daysUntilStockout} DAYS (CRITICAL)`;
  } else if (daysUntilStockout <= 30) {
    return `${daysUntilStockout} DAYS (LOW)`;
  } else {
    return `${daysUntilStockout} DAYS`;
  }
};

/**
 * Calculates the recommended order quantity based on current stock and expected demand
 */
export const calculateRecommendedOrder = (
  currentStock: number,
  estimatedDemand: number,
  safetyStockDays: number = 14
): number => {
  // Calculate daily demand rate (using 180 days for 6-month forecast)
  const dailyDemand = estimatedDemand / 180;
  
  // Calculate target stock level (current demand + safety stock)
  const targetStock = estimatedDemand + (dailyDemand * safetyStockDays);
  
  // Calculate order quantity needed to reach target
  const orderQuantity = Math.max(0, Math.ceil(targetStock - currentStock));
  
  return orderQuantity;
};

/**
 * Calculate the potential lost revenue if a part goes out of stock
 */
export const calculatePotentialLostRevenue = (
  daysUntilStockout: number,
  estimatedDemand: number,
  timeFrame: TimeFrame,
  unitPrice: number
): number => {
  if (daysUntilStockout === Infinity) return 0;
  
  // Convert time frame to days
  const totalDays = 
    timeFrame === '7days' ? 7 :
    timeFrame === '1month' ? 30 :
    timeFrame === '3months' ? 90 :
    timeFrame === '6months' ? 180 : 
    30; // Default to 1 month
  
  // Calculate daily demand and revenue
  const dailyDemand = estimatedDemand / totalDays;
  const dailyRevenue = dailyDemand * unitPrice;
  
  // Calculate lost revenue based on days out of stock
  const daysOutOfStock = Math.max(0, totalDays - daysUntilStockout);
  
  return dailyRevenue * daysOutOfStock;
};

/**
 * Sorts parts by criticality for stocking
 */
export const sortPartsByCriticality = (parts: PartStockRecommendation[]): PartStockRecommendation[] => {
  return [...parts].sort((a, b) => {
    // First priority: Critical status
    if (a.status === 'Critical' && b.status !== 'Critical') return -1;
    if (a.status !== 'Critical' && b.status === 'Critical') return 1;
    
    // Second priority: Ratio of current stock to estimated demand (lower is more critical)
    const ratioA = a.estimatedDemand > 0 ? a.currentStock / a.estimatedDemand : Infinity;
    const ratioB = b.estimatedDemand > 0 ? b.currentStock / b.estimatedDemand : Infinity;
    
    if (ratioA !== ratioB) return ratioA - ratioB;
    
    // Third priority: Revenue opportunity (higher is more important)
    return b.revenueOpportunity - a.revenueOpportunity;
  });
};

/**
 * Group vehicles by make for more organized presentation
 */
export const groupVehiclesByMake = (
  vehicles: VehicleLocationData[]
): { make: string; models: VehicleLocationData[] }[] => {
  // Create a map of makes to their models
  const makeMap = new Map<string, VehicleLocationData[]>();
  
  vehicles.forEach(vehicle => {
    if (!makeMap.has(vehicle.make)) {
      makeMap.set(vehicle.make, []);
    }
    makeMap.get(vehicle.make)!.push(vehicle);
  });
  
  // Convert to array and sort by total registrations
  return Array.from(makeMap.entries())
    .map(([make, models]) => ({
      make,
      models: models.sort((a, b) => b.registrations - a.registrations)
    }))
    .sort((a, b) => {
      const totalA = a.models.reduce((sum, v) => sum + v.registrations, 0);
      const totalB = b.models.reduce((sum, v) => sum + v.registrations, 0);
      return totalB - totalA;
    });
}; 