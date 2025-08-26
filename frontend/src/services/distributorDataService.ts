/**
 * Distributor Dashboard Data Service
 * 
 * This service handles all data processing for the distributor dashboard.
 * It includes functions for:
 * - Loading and parsing CSV data files
 * - Filtering data based on time period, state, and county selections
 * - Joining related data across multiple sources
 * - Calculating metrics and insights for dashboard visualizations
 * - Caching results for performance optimization
 * 
 * Implementation follows a clear, maintainable pattern:
 * 1. Define data types that match CSV structures
 * 2. Create loader functions for each data source
 * 3. Implement filtering and aggregation functions
 * 4. Build calculator functions for derived metrics
 * 5. Expose high-level methods for UI components
 */

import { TimeFrame } from '../components/NewDistributor/types';
import Papa from 'papaparse';

// -----------------------------------------------------
// DATA TYPES
// -----------------------------------------------------

// Region Types
export interface Region {
  region_id: number;
  name: string;
  type: 'state' | 'county';
  parent_region_id: number | null;
  population: number;
  latitude: number;
  longitude: number;
  created_at: string;
}

// Vehicle Types
export interface Vehicle {
  vehicle_id: number;
  type_id: number;
  mileage: number;
  estimated_monthly_accumulation: number;
  last_update: string;
}

export interface VehicleType {
  type_id: number;
  make: string;
  model: string;
  year: number;
}

export interface RegionVehicleType {
  id: number;
  region_id: number;
  type_id: number;
  registration_count: number;
  year_recorded: number;
  last_updated: string;
}

// Parts Types
export interface Part {
  part_id: number;
  part_name: string;
  part_number: string;
  type_id: number;
  component_id: number;
}

export interface Component {
  component_id: number;
  component_name: string;
}

export interface Failure {
  failure_id: number;
  vehicle_id: number;
  part_id: number;
  mileage_at_failure: number;
  date: string;
}

export interface PartPrice {
  part_id: number;
  retail_price: number;
  wholesale_price: number;
}

export interface DemandForecast {
  part_id: number;
  part_name: string;
  part_number: string;
  expected_demand: number;
  current_stock: number;
  recommended_stock: number;
  retail_price: number;
  wholesale_price: number;
  demand_trend: string;
  priority: string;
}

// Interface for table data types
export interface VehicleLocationData {
  make: string;
  model: string;
  year: number;
  estimatedMileage: number;
  registrations: number;
  trend: number; // 1 = up, 0 = stable, -1 = down
}

// Derived/Calculated Types
export interface PartStockRecommendation {
  partNumber: string;
  partName: string;
  currentStock: number;
  recommendedStock: number;
  status: 'Critical' | 'Low' | 'Adequate' | 'Overstock';
  estimatedDemand: number;
  revenueOpportunity: number;
  isCritical: boolean;
  stockingTrend: number; // Positive = increasing, negative = decreasing, 0 = stable
  demandTrend: number; // Positive = increasing, negative = decreasing, 0 = stable
}

export interface MarketInsight {
  type: 'demand' | 'vehicle' | 'seasonal' | 'profit';
  title: string;
  description: string;
  value?: string | number;
  sentiment: 'positive' | 'negative' | 'neutral';
  metadata?: Record<string, any>; // For additional context
}

export interface DashboardMetrics {
  predictedDemandUnits: number;
  predictedDemandUnitsPrevious?: number;
  revenueOpportunity: number;
  revenueOpportunityPrevious?: number;
  partsCoverageRatio: number;
  partsCoverageRatioPrevious?: number;
  criticalStockingNeeds: number;
  criticalItems: number;
}

// Interface for dashboard data
export interface DistributorDashboardData {
  metrics: DashboardMetrics;
  stockingRecommendations: PartStockRecommendation[];
  marketInsights: MarketInsight[];
  vehicleData: VehicleLocationData[];
}

// Interface for region vehicle makes data from CSV
export interface RegionVehicleMake {
  region_id: number;
  make: string;
  model: string;
  year: number;
  registration_count: number;
  year_recorded: number;
}

// -----------------------------------------------------
// DATA LOADING FUNCTIONS
// -----------------------------------------------------

// CSV Loading Utility
async function loadCsv<T>(filePath: string, transform: (value: string) => any = (v: string) => v): Promise<T[]> {
  try {
    const response = await fetch(filePath);
    const text = await response.text();
    
    const result = Papa.parse(text, {
      header: true,
      transform: transform,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    
    return result.data as T[];
  } catch (error) {
    console.error(`Error loading CSV from ${filePath}:`, error);
    return [];
  }
}

// Load Regions
export async function loadRegions(): Promise<Region[]> {
  return loadCsv<Region>('/static_data/regions.csv');
}

// Load Vehicle Types
export async function loadVehicleTypes(): Promise<VehicleType[]> {
  return loadCsv<VehicleType>('/static_data/vehicle_types.csv');
}

// Load Vehicles
export async function loadVehicles(): Promise<Vehicle[]> {
  return loadCsv<Vehicle>('/static_data/vehicles.csv');
}

// Load Region Vehicle Types
export async function loadRegionVehicleTypes(): Promise<RegionVehicleType[]> {
  return loadCsv<RegionVehicleType>('/static_data/region_vehicle_types.csv');
}

// Load Parts
export async function loadParts(): Promise<Part[]> {
  return loadCsv<Part>('/static_data/parts.csv');
}

// Load Components
export async function loadComponents(): Promise<Component[]> {
  return loadCsv<Component>('/static_data/components.csv');
}

// Load Failures
export async function loadFailures(): Promise<Failure[]> {
  return loadCsv<Failure>('/static_data/failures.csv');
}

// Load Part Prices
export async function loadPartPrices(): Promise<PartPrice[]> {
  return loadCsv<PartPrice>('/static_data/part_prices.csv');
}

// Load Demand Forecast
export async function loadDemandForecast(): Promise<DemandForecast[]> {
  return loadCsv<DemandForecast>('/static_data/demand_forecast.csv');
}

// Load Region Vehicle Makes (from region_vehicle_makes.csv)
export async function loadRegionVehicleMakes(): Promise<RegionVehicleMake[]> {
  try {
    return await loadCsv<RegionVehicleMake>('/generative_data/data/region_vehicle_makes.csv');
  } catch (error) {
    console.error('Error loading from generative_data path:', error);
    // Fallback to trying static_data path
    try {
      console.log('Trying static_data path instead...');
      return await loadCsv<RegionVehicleMake>('/static_data/region_vehicle_makes.csv');
    } catch (fallbackError) {
      console.error('Error loading from static_data path:', fallbackError);
      return [];
    }
  }
}

// -----------------------------------------------------
// DATA TRANSFORMATION FUNCTIONS
// -----------------------------------------------------

// Convert demand trend string to numeric value
function convertTrendToNumeric(trend: string): number {
  if (trend === 'increasing') return 1;
  if (trend === 'decreasing') return -1;
  return 0; // stable or unknown
}

// Calculate estimated mileage for a vehicle type
function calculateEstimatedMileage(vehicleType: VehicleType, vehicles: Vehicle[]): number {
  const matchingVehicles = vehicles.filter(v => v.type_id === vehicleType.type_id);
  if (matchingVehicles.length === 0) return 0;
  
  // Calculate average mileage
  const totalMileage = matchingVehicles.reduce((sum, v) => sum + v.mileage, 0);
  return Math.round(totalMileage / matchingVehicles.length);
}

// Get trend for vehicle registrations
function getRegistrationTrend(vehicleType: VehicleType, regionVehicleTypes: RegionVehicleType[]): number {
  // Filter region vehicle types for this vehicle type
  const matchingRegionVehicles = regionVehicleTypes.filter(rv => rv.type_id === vehicleType.type_id);
  if (matchingRegionVehicles.length < 2) return 0; // Not enough data for trend
  
  // Sort by year recorded
  const sortedByYear = [...matchingRegionVehicles].sort((a, b) => a.year_recorded - b.year_recorded);
  
  // Get most recent two years
  const recentYears = sortedByYear.slice(-2);
  if (recentYears.length !== 2) return 0;
  
  // Compare registration counts
  if (recentYears[1].registration_count > recentYears[0].registration_count) return 1;
  if (recentYears[1].registration_count < recentYears[0].registration_count) return -1;
  return 0; // stable
}

// Get total registrations for a vehicle type across all regions
function getTotalRegistrations(vehicleType: VehicleType, regionVehicleTypes: RegionVehicleType[]): number {
  const mostRecentYear = Math.max(...regionVehicleTypes.map(rv => rv.year_recorded));
  
  // Filter for most recent year and matching vehicle type
  const matchingRecords = regionVehicleTypes.filter(
    rv => rv.type_id === vehicleType.type_id && rv.year_recorded === mostRecentYear
  );
  
  // Sum up registration counts
  return matchingRecords.reduce((total, rv) => total + rv.registration_count, 0);
}

// -----------------------------------------------------
// DATA FILTERING
// -----------------------------------------------------

/**
 * Filters regions by state and/or county
 */
export function filterRegions(
  regions: Region[],
  stateId: number | null,
  countyId: number | null
): Region[] {
  if (countyId) {
    return regions.filter(r => r.region_id === countyId);
  }
  
  if (stateId) {
    return regions.filter(r => 
      r.region_id === stateId || 
      r.parent_region_id === stateId
    );
  }
  
  return regions;
}

/**
 * Converts a TimeFrame to days for calculation purposes
 */
function timeFrameToDays(timeFrame: TimeFrame): number {
  switch (timeFrame) {
    case '7days': return 7;
    case '1month': return 30;
    case '3months': return 90;
    case '6months': return 180;
    default: return 180; // Default to 6 months
  }
}

// -----------------------------------------------------
// DATA JOINING & AGGREGATION
// -----------------------------------------------------

/**
 * Gets the vehicles registered in specified regions
 */
export function getRegionVehicles(
  regionVehicleTypes: RegionVehicleType[],
  regions: Region[],
  stateId: number | null,
  countyId: number | null
): RegionVehicleType[] {
  const filteredRegions = filterRegions(regions, stateId, countyId);
  const regionIds = filteredRegions.map(r => r.region_id);
  
  return regionVehicleTypes.filter(rvt => 
    regionIds.includes(rvt.region_id)
  );
}

/**
 * Gets failure rates for parts based on vehicle types in the region
 */
export function calculatePartFailureRates(
  failures: Failure[],
  parts: Part[],
  vehicles: Vehicle[],
  vehicleTypes: VehicleType[],
  regionVehicles: RegionVehicleType[]
): { [partId: number]: number } {
  // This is a placeholder for a more sophisticated calculation
  // In a real implementation, this would use statistical methods
  // to determine failure rates based on regional factors
  
  const failureRates: { [partId: number]: number } = {};
  
  // Map vehicle types in the region to their counts
  const vehicleTypeCounts = regionVehicles.reduce((acc, rv) => {
    acc[rv.type_id] = (acc[rv.type_id] || 0) + rv.registration_count;
    return acc;
  }, {} as { [vehicleTypeId: number]: number });
  
  // Count failures by part
  parts.forEach(part => {
    // Check if this part applies to vehicles in the region
    if (vehicleTypeCounts[part.type_id]) {
      // Calculate a baseline failure rate
      const partFailures = failures.filter(f => f.part_id === part.part_id);
      
      // Calculate the failure rate (simplified version)
      const failureCount = partFailures.length;
      const vehicleCount = vehicleTypeCounts[part.type_id];
      
      // Simple baseline - in reality this would be much more sophisticated
      // considering age of vehicles, usage patterns, etc.
      failureRates[part.part_id] = (failureCount / vehicleCount) || 0.01;
    } else {
      failureRates[part.part_id] = 0;
    }
  });
  
  return failureRates;
}

// -----------------------------------------------------
// DASHBOARD METRICS
// -----------------------------------------------------

/**
 * Calculate dashboard metrics
 */
export async function calculateDashboardMetrics(
  timeFrame: TimeFrame,
  stateId: number | null,
  countyId: number | null
): Promise<DashboardMetrics> {
  // Load required data
  const [
    regions,
    parts,
    components,
    vehicleTypes,
    regionVehicleTypes,
    failures,
    partPrices,
    demandForecasts
  ] = await Promise.all([
    loadRegions(),
    loadParts(),
    loadComponents(),
    loadVehicleTypes(),
    loadRegionVehicleTypes(),
    loadFailures(),
    loadPartPrices(),
    loadDemandForecast()
  ]);
  
  // Filter to relevant regions
  const filteredRegions = filterRegions(regions, stateId, countyId);
  const regionIds = filteredRegions.map(r => r.region_id);
  
  // Get vehicle distribution in the region
  const regionVehicles = getRegionVehicles(regionVehicleTypes, regions, stateId, countyId);
  
  // Calculate the time window in days
  const timeFrameDays = timeFrameToDays(timeFrame);
  
  // Mock current inventory - in reality this would come from an inventory system
  const mockInventory: { [partId: number]: number } = {};
  parts.forEach(part => {
    mockInventory[part.part_id] = Math.floor(Math.random() * 200); // Random inventory levels
  });
  
  // Calculate predicted demand
  // In reality, this would use much more sophisticated models
  const predictedDemand: { [partId: number]: number } = {};
  let totalPredictedDemand = 0;
  let totalPredictedDemandPrevious = 0;
  let totalRevenueOpportunity = 0;
  let totalRevenueOpportunityPrevious = 0;
  
  // Create a map of part prices for easy lookup
  const priceMap: { [partId: number]: number } = {};
  partPrices.forEach(pp => {
    priceMap[pp.part_id] = pp.retail_price;
  });
  
  // Use a simplified model for now
  parts.forEach(part => {
    // Calculate demand based on vehicle populations and failure rates
    const vehicleTypeCount = regionVehicles
      .filter(rv => rv.type_id === part.type_id)
      .reduce((sum, rv) => sum + rv.registration_count, 0);
    
    // Simplified prediction based on vehicle count and time period
    const baselineDemand = vehicleTypeCount * 0.05 * (timeFrameDays / 180);
    
    // Add some randomness for variation
    const currentPrediction = Math.max(1, Math.round(baselineDemand * (0.8 + Math.random() * 0.4)));
    const previousPrediction = Math.max(1, Math.round(baselineDemand * (0.8 + Math.random() * 0.4)));
    
    predictedDemand[part.part_id] = currentPrediction;
    
    // Add to totals
    totalPredictedDemand += currentPrediction;
    totalPredictedDemandPrevious += previousPrediction;
    
    // Calculate revenue opportunity
    const partPrice = priceMap[part.part_id] || 50; // Default price if not found
    totalRevenueOpportunity += currentPrediction * partPrice;
    totalRevenueOpportunityPrevious += previousPrediction * partPrice;
  });
  
  // Calculate parts coverage ratio
  let totalInventory = 0;
  Object.values(mockInventory).forEach(qty => {
    totalInventory += qty;
  });
  
  const coverageRatio = totalInventory / totalPredictedDemand;
  const coverageRatioPrevious = totalInventory / totalPredictedDemandPrevious;
  
  // Calculate critical stocking needs
  let criticalCount = 0;
  let criticalItems = 0;
  
  parts.forEach(part => {
    const demand = predictedDemand[part.part_id] || 0;
    const inventory = mockInventory[part.part_id] || 0;
    
    // If demand > inventory by a significant margin, it's critical
    if (demand > 0 && inventory < demand * 0.5) {
      criticalCount++;
      
      // If it's a high-demand part, it's a critical item
      if (demand > 10) {
        criticalItems++;
      }
    }
  });
  
  // Return the metrics
  return {
    predictedDemandUnits: totalPredictedDemand,
    predictedDemandUnitsPrevious: totalPredictedDemandPrevious,
    revenueOpportunity: totalRevenueOpportunity,
    revenueOpportunityPrevious: totalRevenueOpportunityPrevious,
    partsCoverageRatio: coverageRatio * 100, // Convert to percentage
    partsCoverageRatioPrevious: coverageRatioPrevious * 100,
    criticalStockingNeeds: criticalCount,
    criticalItems: criticalItems
  };
}

// -----------------------------------------------------
// STOCKING RECOMMENDATIONS
// -----------------------------------------------------

/**
 * Generate stocking recommendations for the selected filters
 */
export async function generateStockingRecommendations(
  timeFrame: TimeFrame,
  stateId: number | null,
  countyId: number | null
): Promise<PartStockRecommendation[]> {
  try {
    console.log(`Generating stocking recommendations for timeFrame=${timeFrame}, stateId=${stateId}, countyId=${countyId}`);
    
    // Load all necessary data
    const [
      regions,
      parts,
      vehicles,
      vehicleTypes,
      regionVehicleTypes,
      failures,
      partPrices
    ] = await Promise.all([
      loadRegions(),
      loadParts(),
      loadVehicles(),
      loadVehicleTypes(),
      loadRegionVehicleTypes(),
      loadFailures(),
      loadPartPrices()
    ]);
    
    console.log(`Loaded data: ${parts.length} parts, ${vehicles.length} vehicles, ${failures.length} failures, ${partPrices.length} part prices`);
    
    // Filter regions by state and county
    const filteredRegions = filterRegions(regions, stateId, countyId);
    console.log(`Filtered to ${filteredRegions.length} regions based on stateId=${stateId}, countyId=${countyId}`);
    
    // Get region vehicles
    const regionVehicles = getRegionVehicles(
      regionVehicleTypes, 
      regions, 
      stateId, 
      countyId
    );
    console.log(`Found ${regionVehicles.length} vehicle registrations in the filtered regions`);
    
    // Calculate part failure rates
    const failureRatesByPart = calculatePartFailureRates(
      failures, 
      parts, 
      vehicles as any, // Type cast as needed
      vehicleTypes, 
      regionVehicles
    );
    
    // Convert timeFrame to days for calculations
    const timeFrameDays = timeFrameToDays(timeFrame);
    console.log(`Using time frame of ${timeFrameDays} days for calculations`);
    
    // Create price maps for easy lookup
    const retailPriceMap: {[partId: number]: number} = {};
    const wholesalePriceMap: {[partId: number]: number} = {};
    partPrices.forEach(pp => {
      retailPriceMap[pp.part_id] = pp.retail_price;
      wholesalePriceMap[pp.part_id] = pp.wholesale_price;
    });
    
    // Generate recommendations
    const recommendations: PartStockRecommendation[] = [];
    
    // Process each part
    parts.forEach(part => {
      // Calculate predicted demand based on vehicle populations in the region
      const vehicleCount = regionVehicles
        .filter(rv => rv.type_id === part.type_id)
        .reduce((sum, rv) => sum + rv.registration_count, 0);
      
      // Get failure rate for this part
      const failureRate = failureRatesByPart[part.part_id] || 0.01;
      
      // Adjust demand for the time period
      // For 6 months, we use the failure rate directly
      // For other time periods, we scale proportionally
      const timeScalingFactor = timeFrameDays / 180; // Base time period is 6 months (180 days)
      const baselineDemand = vehicleCount * failureRate;
      const predictedDemand = Math.round(baselineDemand * timeScalingFactor);
      
      // Skip parts with no predicted demand in this region/timeframe
      if (predictedDemand <= 0) {
        return;
      }
      
      // Mock current inventory - would come from real inventory system
      // In a real system, this would be constant regardless of timeframe/region
      const currentInventory = Math.round(
        Math.max(10, predictedDemand * (0.5 + (Math.random() * 0.7)))
      );
      
      // Calculate recommended stock level with safety factor
      const safetyFactor = 1.2; // 20% safety stock
      const recommendedStock = Math.ceil(predictedDemand * safetyFactor);
      
      // Calculate revenue opportunity
      // This is (retail - wholesale) * (predicted demand - current inventory)
      // If current inventory exceeds predicted demand, revenue opportunity is 0
      const retailPrice = retailPriceMap[part.part_id] || 100;
      const wholesalePrice = wholesalePriceMap[part.part_id] || 80;
      const stockGap = Math.max(0, predictedDemand - currentInventory);
      const revenueOpportunity = stockGap * (retailPrice - wholesalePrice);
      
      // Determine status based on inventory vs demand
      let status: 'Critical' | 'Low' | 'Adequate' | 'Overstock';
      if (currentInventory < 0.6 * predictedDemand) {
        status = 'Critical';
      } else if (currentInventory < 0.9 * predictedDemand) {
        status = 'Low';
      } else if (currentInventory < 1.2 * predictedDemand) {
        status = 'Adequate';
      } else {
        status = 'Overstock';
      }
      
      // Add to recommendations
      recommendations.push({
        partNumber: part.part_number,
        partName: part.part_name,
        currentStock: currentInventory,
        recommendedStock: recommendedStock,
        status,
        estimatedDemand: predictedDemand,
        revenueOpportunity,
        isCritical: status === 'Critical',
        stockingTrend: predictedDemand > currentInventory ? 1 : predictedDemand < currentInventory ? -1 : 0,
        demandTrend: 1 // Default to increasing trend for now
      });
    });
    
    console.log(`Generated ${recommendations.length} stocking recommendations`);
    
    // Sort by estimated demand (highest first)
    return recommendations.sort((a, b) => b.estimatedDemand - a.estimatedDemand);
  } catch (error) {
    console.error('Error generating stocking recommendations:', error);
    throw error;
  }
}

// Get real stocking recommendations
export async function getRealStockingRecommendations(
  stateId: number | null = null,
  countyId: number | null = null
): Promise<PartStockRecommendation[]> {
  try {
    // Load demand forecast data
    const demandForecast = await loadDemandForecast();
    
    // Transform demand forecast into stocking recommendations
    const recommendations: PartStockRecommendation[] = demandForecast.map(df => {
      // Calculate revenue opportunity (retail - wholesale) * (recommended - current)
      const stockDifference = Math.max(0, df.recommended_stock - df.current_stock);
      const revenueOpportunity = stockDifference * (df.retail_price - df.wholesale_price);
      
      // Determine status based on stock levels
      let status: 'Critical' | 'Low' | 'Adequate' | 'Overstock';
      if (df.current_stock < 0.6 * df.expected_demand) {
        status = 'Critical';
      } else if (df.current_stock < 0.9 * df.expected_demand) {
        status = 'Low';
      } else if (df.current_stock < 1.2 * df.expected_demand) {
        status = 'Adequate';
      } else {
        status = 'Overstock';
      }
      
      return {
        partNumber: df.part_number,
        partName: df.part_name,
        currentStock: df.current_stock,
        recommendedStock: df.recommended_stock,
        status,
        estimatedDemand: df.expected_demand,
        revenueOpportunity,
        isCritical: status === 'Critical',
        stockingTrend: df.current_stock < df.recommended_stock ? 1 : df.current_stock > df.recommended_stock ? -1 : 0,
        demandTrend: convertTrendToNumeric(df.demand_trend)
      };
    });
    
    return recommendations;
  } catch (error) {
    console.error('Error fetching stocking recommendations:', error);
    return [];
  }
}

// -----------------------------------------------------
// MARKET INSIGHTS
// -----------------------------------------------------

/**
 * Generate market insights for the selected filters
 */
export async function generateMarketInsights(
  timeFrame: TimeFrame,
  stateId: number | null,
  countyId: number | null
): Promise<MarketInsight[]> {
  // Load required data
  const [
    regions,
    parts,
    vehicleTypes,
    regionVehicleTypes,
    failures,
    partPrices
  ] = await Promise.all([
    loadRegions(),
    loadParts(),
    loadVehicleTypes(),
    loadRegionVehicleTypes(),
    loadFailures(),
    loadPartPrices()
  ]);
  
  // Implementation similar to stocking recommendations but focused on:
  // - Market trends
  // - Profit opportunities
  // - Competitive analysis
  
  // Simplified implementation for now
  const insights: MarketInsight[] = [];
  
  // Create a price lookup
  const priceMap: { [partId: number]: number } = {};
  partPrices.forEach(pp => {
    priceMap[pp.part_id] = pp.retail_price;
  });
  
  // Generate insights for top parts
  const stockingRecs = await generateStockingRecommendations(
    timeFrame,
    stateId,
    countyId
  );
  
  // Take top 20 parts by demand
  const topParts = stockingRecs
    .sort((a, b) => b.estimatedDemand - a.estimatedDemand)
    .slice(0, 20);
  
  // Generate insights
  topParts.forEach(part => {
    // Use mock pricing data as needed
    const price = 50 + Math.random() * 150; // Mock price
    const costBasis = price * 0.6; // Assume 40% markup
    const margin = price - costBasis;
    const profitMargin = margin / price;
    const trend = Math.random() > 0.5 ? 'increasing' : 'decreasing';
    
    insights.push({
      type: 'profit',
      title: `Margin Opportunity: ${part.partName}`,
      description: `Components show ${profitMargin.toFixed(2)}% higher margins than category average.`,
      value: `+${(profitMargin * 100).toFixed(2)}% margin`,
      sentiment: 'positive'
    });
  });
  
  return insights;
}

// -----------------------------------------------------
// PUBLIC API
// -----------------------------------------------------

/**
 * Main function to get all data needed for the distributor dashboard
 */
export const getDistributorDashboardData = async (
  timeFrame: TimeFrame,
  stateId: number | null,
  countyId: number | null
): Promise<DistributorDashboardData> => {
  try {
    // Get metrics data
    const metrics = await calculateDashboardMetrics(timeFrame, stateId, countyId);
    
    // Get stocking recommendations with proper filtering
    const stockingRecommendations = await generateStockingRecommendations(timeFrame, stateId, countyId);
    
    // Get market insights
    const marketInsights = await generateMarketInsights(timeFrame, stateId, countyId);
    
    // Get vehicle location data - use simplified version for debugging
    const vehicleData = await getVehiclesByLocationSimple();
    
    console.log(`Generated dashboard data with ${stockingRecommendations.length} stocking recommendations based on timeFrame=${timeFrame}, stateId=${stateId}, countyId=${countyId}`);
    
    return {
      metrics,
      stockingRecommendations,
      marketInsights,
      vehicleData
    };
  } catch (error) {
    console.error('Error fetching distributor dashboard data:', error);
    throw error;
  }
};

// Get vehicles by location data - using detailed CSV
export async function getVehiclesByLocationDetailed(): Promise<VehicleLocationData[]> {
  try {
    // Load vehicle makes data from region_vehicle_makes.csv
    const vehicleMakes = await loadRegionVehicleMakes();
    
    console.log(`Loaded ${vehicleMakes.length} vehicle make entries from region_vehicle_makes.csv`);
    
    // Create a map to aggregate by make/model/year
    const vehicleMap = new Map<string, VehicleLocationData>();
    
    // Process all entries from the CSV
    vehicleMakes.forEach(entry => {
      const key = `${entry.make}|${entry.model}|${entry.year}`;
      
      if (!vehicleMap.has(key)) {
        vehicleMap.set(key, {
          make: entry.make,
          model: entry.model,
          year: entry.year,
          estimatedMileage: calculateEstimatedMileageSimple(entry.year),
          registrations: 0,
          trend: 0 // We'll calculate this later
        });
      }
      
      // Add to registration count
      const vehicle = vehicleMap.get(key)!;
      vehicle.registrations += entry.registration_count;
    });
    
    // Calculate trends and generate final array
    const vehicleData = Array.from(vehicleMap.values());
    
    // Calculate trends based on year_recorded for each make/model/year
    vehicleMakes.forEach(entry => {
      const key = `${entry.make}|${entry.model}|${entry.year}`;
      const vehicle = vehicleMap.get(key);
      
      if (vehicle && entry.year_recorded === 2023) {
        // Find previous year data for the same make/model/year
        const prevYearEntry = vehicleMakes.find(ve => 
          ve.make === entry.make && 
          ve.model === entry.model && 
          ve.year === entry.year && 
          ve.year_recorded === 2022
        );
        
        if (prevYearEntry) {
          const diff = entry.registration_count - prevYearEntry.registration_count;
          vehicle.trend = diff > 0 ? 1 : diff < 0 ? -1 : 0;
        }
      }
    });
    
    // Sort by estimated mileage
    const sortedData = vehicleData
      .filter(v => v.registrations > 0)
      .sort((a, b) => b.estimatedMileage - a.estimatedMileage);
    
    console.log(`Found ${sortedData.length} unique vehicles to display`);
    
    return sortedData;
  } catch (error) {
    console.error('Error in detailed vehicle location data function:', error);
    return [];
  }
}

// Calculate estimated mileage based on year (simplified method)
function calculateEstimatedMileageSimple(year: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  // Assume average of 12K miles per year
  const baseMileage = age * 12000;
  // Add some randomness
  return Math.round(baseMileage * (0.8 + Math.random() * 0.4));
}

// Get vehicles by location data - simplified version
export async function getVehiclesByLocationSimple(): Promise<VehicleLocationData[]> {
  // Use the detailed function instead
  return getVehiclesByLocationDetailed();
  
  /* Original implementation commented out
  try {
    // Load all required data
    const vehicleTypes = await loadVehicleTypes();
    const vehicles = await loadVehicles();
    const regionVehicleTypes = await loadRegionVehicleTypes();
    
    console.log(`Loaded data for simple method: ${vehicleTypes.length} vehicle types, ${vehicles.length} vehicles, ${regionVehicleTypes.length} region vehicle type entries`);
    
    // Create a map to track registrations by type_id
    const registrationsByType: Record<number, number> = {};
    const typeHasRegistrations: Record<number, boolean> = {};
    
    // Simply sum all registrations by type_id across all regions and years
    regionVehicleTypes.forEach(entry => {
      if (!registrationsByType[entry.type_id]) {
        registrationsByType[entry.type_id] = 0;
        typeHasRegistrations[entry.type_id] = false;
      }
      
      // Log the first few entries to see what's in the data
      if (Object.keys(registrationsByType).length < 5) {
        console.log(`Type ${entry.type_id} in region ${entry.region_id}, year ${entry.year_recorded}: ${entry.registration_count} registrations`);
      }
      
      registrationsByType[entry.type_id] += entry.registration_count;
      
      if (entry.registration_count > 0) {
        typeHasRegistrations[entry.type_id] = true;
      }
    });
    
    // Count how many types have non-zero registrations
    const typesWithRegistrations = Object.values(typeHasRegistrations).filter(Boolean).length;
    console.log(`Found ${typesWithRegistrations} vehicle types with non-zero registrations`);
    
    // Transform vehicle types into the VehicleLocationData format
    const vehicleData: VehicleLocationData[] = vehicleTypes.map(vt => {
      const regCount = registrationsByType[vt.type_id] || 0;
      
      if (regCount > 0) {
        console.log(`Vehicle type ${vt.type_id} (${vt.make} ${vt.model} ${vt.year}) has ${regCount} total registrations`);
      }
      
      return {
        make: vt.make,
        model: vt.model,
        year: vt.year,
        estimatedMileage: calculateEstimatedMileage(vt, vehicles),
        registrations: regCount,
        trend: getRegistrationTrend(vt, regionVehicleTypes)
      };
    });
    
    // Filter and sort
    const filteredData = vehicleData
      .filter(v => v.registrations > 0)
      .sort((a, b) => b.estimatedMileage - a.estimatedMileage);
    
    console.log(`Simplified method found ${filteredData.length} vehicles with registrations to display`);
    
    return filteredData;
  } catch (error) {
    console.error('Error in simplified vehicle location data function:', error);
    return [];
  }
  */
}

export default {
  loadRegions,
  loadVehicleTypes,
  loadVehicles,
  loadRegionVehicleTypes,
  loadParts,
  loadComponents,
  loadFailures,
  loadPartPrices,
  loadDemandForecast,
  filterRegions,
  timeFrameToDays,
  getRegionVehicles,
  calculatePartFailureRates,
  calculateDashboardMetrics,
  generateStockingRecommendations,
  getRealStockingRecommendations,
  generateMarketInsights,
  getVehiclesByLocationSimple,
  getVehiclesByLocationDetailed,
  getDistributorDashboardData
}; 