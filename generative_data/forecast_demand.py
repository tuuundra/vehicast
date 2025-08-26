#!/usr/bin/env python3
"""
Demand Forecasting for Inventory Optimization

This script aggregates failure predictions to forecast parts demand and
recommend stock levels for distributors.
"""

import os
import pickle
import argparse
import pandas as pd
import numpy as np
from dotenv import load_dotenv
from tabulate import tabulate
from utils.database import connect_to_supabase

# Load environment variables
load_dotenv()

# Directory where models are stored
MODELS_DIR = 'models'

def load_models():
    """
    Load all trained component models.
    
    Returns:
        dict: Dictionary of component models
    """
    models = {}
    
    # Check if models directory exists
    if not os.path.exists(MODELS_DIR):
        print(f"Error: Models directory '{MODELS_DIR}' not found.")
        return models
    
    # Load each model file
    for filename in os.listdir(MODELS_DIR):
        if filename.endswith('_model.pkl'):
            component_name = filename.replace('_model.pkl', '').replace('_', ' ')
            model_path = os.path.join(MODELS_DIR, filename)
            
            try:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                    models[component_name] = model
                    print(f"Loaded model for {component_name}")
            except Exception as e:
                print(f"Error loading model for {component_name}: {str(e)}")
    
    return models

def fetch_data(supabase, region=None):
    """
    Fetch data from Supabase.
    
    Args:
        supabase: Supabase client
        region (str, optional): Region to filter by
        
    Returns:
        tuple: (vehicles_df, parts_df, components_df)
    """
    print("Fetching data from Supabase...")
    
    # Fetch vehicles with their type information
    vehicles_response = supabase.table('vehicles').select('*').execute()
    vehicles_df = pd.DataFrame(vehicles_response.data)
    
    # Fetch vehicle types
    vehicle_types_response = supabase.table('vehicle_types').select('*').execute()
    vehicle_types_df = pd.DataFrame(vehicle_types_response.data)
    
    # Merge vehicles with their type information
    vehicles_df = vehicles_df.merge(vehicle_types_df, on='type_id')
    
    print(f"Fetched {len(vehicles_df)} vehicles")
    
    # Fetch components
    components_response = supabase.table('components').select('*').execute()
    components_df = pd.DataFrame(components_response.data)
    
    print(f"Fetched {len(components_df)} components")
    
    # Fetch parts
    parts_response = supabase.table('parts').select('*').execute()
    parts_df = pd.DataFrame(parts_response.data)
    
    print(f"Fetched {len(parts_df)} parts")
    
    # Merge parts with vehicle types and components
    parts_df = parts_df.merge(vehicle_types_df, on='type_id')
    parts_df = parts_df.merge(components_df, on='component_id')
    
    return vehicles_df, parts_df, components_df

def predict_failures(models, vehicles_df):
    """
    Predict failures for all vehicles.
    
    Args:
        models (dict): Dictionary of component models
        vehicles_df (DataFrame): Vehicle data
        
    Returns:
        dict: Dictionary of component failure predictions
    """
    print("Predicting failures for all vehicles...")
    
    # Initialize predictions dictionary
    predictions = {component: [] for component in models.keys()}
    
    # Predict for each vehicle
    for _, vehicle in vehicles_df.iterrows():
        vehicle_data = {
            'make': vehicle['make'],
            'model': vehicle['model'],
            'year': vehicle['year'],
            'mileage': vehicle['mileage']
        }
        
        # Predict for each component
        for component_name, model in models.items():
            try:
                # Predict failure probability
                prob = model.predict_proba(pd.DataFrame([vehicle_data]))[0][1]
                
                # Store prediction
                predictions[component_name].append({
                    'vehicle_id': vehicle['vehicle_id'],
                    'type_id': vehicle['type_id'],
                    'probability': prob
                })
            except Exception as e:
                print(f"Error predicting for {component_name}, vehicle {vehicle['vehicle_id']}: {str(e)}")
    
    return predictions

def calculate_demand(predictions, parts_df):
    """
    Calculate demand for each part.
    
    Args:
        predictions (dict): Dictionary of component failure predictions
        parts_df (DataFrame): Parts data
        
    Returns:
        DataFrame: Demand forecast
    """
    print("Calculating demand for each part...")
    
    # Initialize results
    results = []
    
    # Group parts by component
    parts_by_component = parts_df.groupby('component_name')
    
    # Calculate demand for each component
    for component_name, component_predictions in predictions.items():
        if component_name not in parts_by_component.groups:
            print(f"Warning: No parts found for component '{component_name}'")
            continue
        
        # Get parts for this component
        component_parts = parts_by_component.get_group(component_name)
        
        # Group predictions by vehicle type
        pred_df = pd.DataFrame(component_predictions)
        pred_by_type = pred_df.groupby('type_id')
        
        # Calculate demand for each part
        for _, part in component_parts.iterrows():
            type_id = part['type_id']
            
            # Skip if no vehicles of this type
            if type_id not in pred_by_type.groups:
                continue
            
            # Get predictions for this vehicle type
            type_predictions = pred_by_type.get_group(type_id)
            
            # Calculate expected failures (sum of probabilities)
            expected_failures = type_predictions['probability'].sum()
            
            # Calculate recommended stock (add 20% buffer)
            recommended_stock = int(np.ceil(expected_failures * 1.2))
            
            # Add to results
            results.append({
                'part_id': part['part_id'],
                'part_name': part['part_name'],
                'part_number': part['part_number'],
                'component_name': component_name,
                'vehicle_type': f"{part['year']} {part['make']} {part['model']}",
                'expected_demand': int(np.ceil(expected_failures)),
                'recommended_stock': recommended_stock
            })
    
    # Convert to DataFrame
    results_df = pd.DataFrame(results)
    
    # Sort by expected demand (highest first)
    if not results_df.empty:
        results_df = results_df.sort_values('expected_demand', ascending=False)
    
    return results_df

def main():
    """Main function to forecast demand and recommend stock levels."""
    
    parser = argparse.ArgumentParser(description='Forecast parts demand and recommend stock levels')
    parser.add_argument('--region', type=str, help='Region to filter by (optional)')
    parser.add_argument('--output', type=str, help='Output CSV file (optional)')
    parser.add_argument('--top', type=int, default=20, help='Number of top parts to display (default: 20)')
    
    args = parser.parse_args()
    
    # Load models
    print("Loading component models...")
    models = load_models()
    
    if not models:
        print("No models found. Please run train_failure_models.py first.")
        return 1
    
    # Connect to Supabase
    print("\nConnecting to Supabase...")
    supabase = connect_to_supabase()
    print("Connection successful!")
    
    # Fetch data
    vehicles_df, parts_df, components_df = fetch_data(supabase, args.region)
    
    # Predict failures
    predictions = predict_failures(models, vehicles_df)
    
    # Calculate demand
    demand_df = calculate_demand(predictions, parts_df)
    
    if demand_df.empty:
        print("\nNo demand forecast generated. Check that you have vehicles and parts in the database.")
        return 1
    
    # Display results
    print("\n=== Demand Forecast and Stock Recommendations ===")
    
    if args.region:
        print(f"Region: {args.region}")
    
    # Display top parts
    top_parts = demand_df.head(args.top)
    
    # Format table
    table_data = top_parts[['part_name', 'part_number', 'component_name', 'vehicle_type', 'expected_demand', 'recommended_stock']].values.tolist()
    headers = ['Part Name', 'Part Number', 'Component', 'Vehicle Type', 'Expected Demand', 'Recommended Stock']
    
    print("\nTop Parts by Demand:")
    print(tabulate(table_data, headers=headers, tablefmt='grid'))
    
    # Calculate totals
    total_demand = demand_df['expected_demand'].sum()
    total_stock = demand_df['recommended_stock'].sum()
    
    print(f"\nTotal Expected Demand: {total_demand} units")
    print(f"Total Recommended Stock: {total_stock} units")
    
    # Save to CSV if requested
    if args.output:
        demand_df.to_csv(args.output, index=False)
        print(f"\nDemand forecast saved to {args.output}")
    
    return 0

if __name__ == "__main__":
    exit(main()) 