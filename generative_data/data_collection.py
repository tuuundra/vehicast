#!/usr/bin/env python3
"""
Data Collection Script for Automotive Parts Prediction & Inventory Optimization

This script simulates vehicle registration data, component failures, and parts fitment
to create a dataset for the prediction and optimization system.
"""

import argparse
import os
import pandas as pd
from utils.data_generation import generate_all_data, save_data


def main():
    """Main function to run data collection and generation."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Generate simulated vehicle and parts data')
    parser.add_argument('--n_types', type=int, default=50, 
                        help='Number of vehicle types (make-model-year combinations) to generate')
    parser.add_argument('--n_vehicles', type=int, default=10000, 
                        help='Number of vehicles to generate')
    parser.add_argument('--output_dir', type=str, default='data', 
                        help='Directory to save the generated data')
    args = parser.parse_args()

    # Display summary of what will be generated
    print("======== Automotive Data Generation ========")
    print(f"Generating {args.n_types} vehicle types and {args.n_vehicles} vehicles")
    print(f"Output will be saved to: {args.output_dir}")
    print("===========================================")

    # Generate all data
    data_dict = generate_all_data(n_types=args.n_types, n_vehicles=args.n_vehicles)

    # Print summary statistics
    for name, df in data_dict.items():
        print(f"\nSummary of {name} dataset:")
        print(f"  - Shape: {df.shape}")
        print(f"  - Columns: {', '.join(df.columns)}")
        
        # Print specific info based on data type
        if name == 'vehicle_types':
            make_counts = df['make'].value_counts()
            print(f"  - Makes count: {dict(make_counts.head(3))}")
            print(f"  - Year range: {df['year'].min()} to {df['year'].max()}")
        
        elif name == 'vehicles':
            print(f"  - Mileage stats: min={df['mileage'].min()}, max={df['mileage'].max()}, mean={df['mileage'].mean():.1f}")
        
        elif name == 'failures':
            print(f"  - Failure rate stats: min={df['failure_rate'].min():.3f}, max={df['failure_rate'].max():.3f}, mean={df['failure_rate'].mean():.3f}")

    # Save all data to CSV files
    save_data(data_dict, args.output_dir)

    print("\nData generation completed successfully!")


if __name__ == "__main__":
    main() 