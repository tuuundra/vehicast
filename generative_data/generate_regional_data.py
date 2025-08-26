#!/usr/bin/env python3
"""
Generate regional demand data for heatmap visualization

This script creates synthetic regional demand data based on the existing demand_forecast.csv,
distributing parts across various cities with appropriate demand intensity values.
"""

import os
import pandas as pd
import random
import numpy as np

# Ensure output directory exists
os.makedirs('generative_data', exist_ok=True)

# US major cities with approximate lat/long
cities = [
    {"city": "New York", "state": "NY", "lat": 40.7128, "lng": -74.0060},
    {"city": "Los Angeles", "state": "CA", "lat": 34.0522, "lng": -118.2437},
    {"city": "Chicago", "state": "IL", "lat": 41.8781, "lng": -87.6298},
    {"city": "Houston", "state": "TX", "lat": 29.7604, "lng": -95.3698},
    {"city": "Phoenix", "state": "AZ", "lat": 33.4484, "lng": -112.0740},
    {"city": "Philadelphia", "state": "PA", "lat": 39.9526, "lng": -75.1652},
    {"city": "San Antonio", "state": "TX", "lat": 29.4241, "lng": -98.4936},
    {"city": "San Diego", "state": "CA", "lat": 32.7157, "lng": -117.1611},
    {"city": "Dallas", "state": "TX", "lat": 32.7767, "lng": -96.7970},
    {"city": "San Jose", "state": "CA", "lat": 37.3382, "lng": -121.8863},
    {"city": "Austin", "state": "TX", "lat": 30.2672, "lng": -97.7431},
    {"city": "Jacksonville", "state": "FL", "lat": 30.3322, "lng": -81.6557},
    {"city": "Denver", "state": "CO", "lat": 39.7392, "lng": -104.9903},
    {"city": "Seattle", "state": "WA", "lat": 47.6062, "lng": -122.3321},
    {"city": "Boston", "state": "MA", "lat": 42.3601, "lng": -71.0589},
    {"city": "Portland", "state": "OR", "lat": 45.5051, "lng": -122.6750},
    {"city": "Las Vegas", "state": "NV", "lat": 36.1699, "lng": -115.1398},
    {"city": "Detroit", "state": "MI", "lat": 42.3314, "lng": -83.0458},
    {"city": "Atlanta", "state": "GA", "lat": 33.7490, "lng": -84.3880},
    {"city": "Miami", "state": "FL", "lat": 25.7617, "lng": -80.1918}
]

def main():
    """Generate regional demand data CSV"""
    print("Generating regional demand data...")
    
    # Load existing demand forecast
    demand_path = 'generative_data/demand_forecast.csv'
    if not os.path.exists(demand_path):
        print(f"Error: Demand forecast file not found at {demand_path}")
        return 1
        
    df = pd.read_csv(demand_path)
    print(f"Loaded {len(df)} parts from demand forecast")
    
    # Create regional demand data
    regional_data = []
    for _, row in df.iterrows():
        # Assign more cities to higher demand parts
        base_cities = 3
        extra_cities = min(4, int((row['expected_demand'] / 150)))
        num_cities = base_cities + extra_cities
        num_cities = min(num_cities, len(cities))
        
        selected_cities = random.sample(cities, num_cities)
        
        for city in selected_cities:
            # Generate demand intensity as a fraction of expected demand
            # Higher demand parts will have higher intensity in more regions
            base_intensity = 0.3
            demand_factor = min(0.7, (row['expected_demand'] / 500) * 0.7)
            random_factor = random.uniform(0.8, 1.2)
            intensity = min(1.0, base_intensity + demand_factor * random_factor)
            
            regional_data.append({
                'part_id': row['part_id'],
                'part_name': row['part_name'],
                'component_name': row['component_name'],
                'city': city['city'],
                'state': city['state'],
                'latitude': city['lat'],
                'longitude': city['lng'],
                'demand_intensity': round(intensity, 2)
            })

    # Create and save the regional demand CSV
    regional_df = pd.DataFrame(regional_data)
    output_path = 'generative_data/regional_demand.csv'
    regional_df.to_csv(output_path, index=False)
    print(f"Created regional demand data with {len(regional_df)} entries")
    print(f"Saved to {output_path}")
    
    return 0

if __name__ == "__main__":
    exit(main()) 