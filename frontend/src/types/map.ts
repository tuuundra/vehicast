/**
 * Type definitions for map-related data
 */

/**
 * GeoJSON Feature Collection type for map data
 */
export type FeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      intensity: number;
      city?: string;
      state?: string;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  }>;
};

/**
 * Region type for geographic regions
 */
export interface Region {
  region_id: number;
  name: string;
  type: 'state' | 'county' | 'city';
  parent_region_id: number | null;
}

/**
 * Part type for automotive parts
 */
export interface Part {
  part_id: number;
  part_name: string;
  part_number: string;
  component_name: string;
  vehicle_type: string;
  expected_demand: number;
  recommended_stock: number;
}

/**
 * Demand data type for forecasts
 */
export interface DemandData {
  time_window: string;
  parts: Part[];
  total_demand: number;
  total_stock: number;
  potential_revenue: number;
} 