import { FeatureCollection } from '../types/map';

// Mock data for regions
const mockRegions = [
  { region_id: 1, name: 'California', type: 'state', parent_region_id: null },
  { region_id: 2, name: 'Texas', type: 'state', parent_region_id: null },
  { region_id: 3, name: 'New York', type: 'state', parent_region_id: null },
  { region_id: 4, name: 'Florida', type: 'state', parent_region_id: null },
  { region_id: 5, name: 'Los Angeles County', type: 'county', parent_region_id: 1 },
  { region_id: 6, name: 'Harris County', type: 'county', parent_region_id: 2 },
  { region_id: 7, name: 'Kings County', type: 'county', parent_region_id: 3 },
  { region_id: 8, name: 'Miami-Dade County', type: 'county', parent_region_id: 4 },
];

// Mock data for demand forecast
const mockDemandForecast = {
  time_window: '6 months',
  total_demand: 15000,
  total_stock: 12000,
  potential_revenue: 750000,
  parts: [
    {
      part_id: 1,
      part_name: 'Brake Pads',
      part_number: 'BP-2023-A',
      component_name: 'Braking System',
      vehicle_type: 'Sedan',
      expected_demand: 3500,
      recommended_stock: 2800
    },
    {
      part_id: 2,
      part_name: 'Oil Filter',
      part_number: 'OF-2023-B',
      component_name: 'Engine',
      vehicle_type: 'SUV',
      expected_demand: 2800,
      recommended_stock: 2240
    },
    {
      part_id: 3,
      part_name: 'Spark Plugs',
      part_number: 'SP-2023-C',
      component_name: 'Ignition System',
      vehicle_type: 'Truck',
      expected_demand: 2200,
      recommended_stock: 1760
    },
    {
      part_id: 4,
      part_name: 'Air Filter',
      part_number: 'AF-2023-D',
      component_name: 'Air Intake',
      vehicle_type: 'Sedan',
      expected_demand: 1800,
      recommended_stock: 1440
    },
    {
      part_id: 5,
      part_name: 'Battery',
      part_number: 'BT-2023-E',
      component_name: 'Electrical System',
      vehicle_type: 'SUV',
      expected_demand: 1500,
      recommended_stock: 1200
    }
  ]
};

// Mock data for regional demand (heatmap)
const mockRegionalDemand: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { intensity: 0.9, city: "Los Angeles", state: "CA" }, geometry: { type: 'Point', coordinates: [-118.2437, 34.0522] } },
    { type: 'Feature', properties: { intensity: 0.8, city: "Houston", state: "TX" }, geometry: { type: 'Point', coordinates: [-95.3698, 29.7604] } },
    { type: 'Feature', properties: { intensity: 0.7, city: "New York", state: "NY" }, geometry: { type: 'Point', coordinates: [-74.0060, 40.7128] } },
    { type: 'Feature', properties: { intensity: 0.6, city: "Miami", state: "FL" }, geometry: { type: 'Point', coordinates: [-80.1918, 25.7617] } },
  ]
};

/**
 * Get static regions data
 * @returns Promise with regions data
 */
export const getStaticRegions = async () => {
  console.log('Fetching static regions data (placeholder)');
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockRegions;
};

/**
 * Get static demand forecast data
 * @param timeWindow Time window for forecast
 * @param regionId Optional region ID to filter by
 * @returns Promise with demand forecast data
 */
export const getStaticDemandForecast = async (timeWindow: string, regionId?: string | number) => {
  console.log(`Fetching static demand forecast for ${timeWindow} and region ${regionId || 'all'} (placeholder)`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Adjust data based on time window
  const timeMultiplier = 
    timeWindow === '7 days' ? 0.25 :
    timeWindow === '1 month' ? 0.5 :
    timeWindow === '3 months' ? 0.75 : 1;
  
  // Create a copy of the mock data and adjust values
  const result = JSON.parse(JSON.stringify(mockDemandForecast));
  result.time_window = timeWindow;
  result.total_demand = Math.round(result.total_demand * timeMultiplier);
  result.total_stock = Math.round(result.total_stock * timeMultiplier);
  result.potential_revenue = Math.round(result.potential_revenue * timeMultiplier);
  
  // Adjust part demand values
  result.parts.forEach((part: any) => {
    part.expected_demand = Math.round(part.expected_demand * timeMultiplier);
    part.recommended_stock = Math.round(part.recommended_stock * timeMultiplier);
  });
  
  return result;
};

/**
 * Get static regional demand data for heatmap
 * @param timeWindow Time window for forecast
 * @param partId Optional part ID to filter by
 * @param regionId Optional region ID to filter by
 * @returns Promise with regional demand data
 */
export const getStaticRegionalDemandData = async (
  timeWindow: string, 
  partId?: number, 
  regionId?: string | number
) => {
  console.log(`Fetching static regional demand for ${timeWindow}, part ${partId || 'all'}, region ${regionId || 'all'} (placeholder)`);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return mockRegionalDemand;
};

/**
 * Clear the static data cache
 */
export const clearStaticDataCache = () => {
  console.log('Clearing static data cache (placeholder)');
}; 