#!/usr/bin/env python3
"""
Failure Prediction Script for Automotive Components

This script loads trained models and predicts the probability of component failures
for a given vehicle based on its make, model, year, and mileage.
"""

import os
import pickle
import argparse
import pandas as pd
from dotenv import load_dotenv
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

def get_parts_for_vehicle_component(supabase, make, model, year, component_name):
    """
    Get parts for a specific vehicle type and component.
    
    Args:
        supabase: Supabase client
        make (str): Vehicle make
        model (str): Vehicle model
        year (int): Vehicle year
        component_name (str): Component name
        
    Returns:
        list: List of parts
    """
    try:
        # Get vehicle type ID
        vehicle_type_response = supabase.table('vehicle_types').select('type_id').eq('make', make).eq('model', model).eq('year', year).execute()
        
        if not vehicle_type_response.data:
            print(f"No vehicle type found for {year} {make} {model}")
            return []
        
        type_id = vehicle_type_response.data[0]['type_id']
        
        # Get component ID
        component_response = supabase.table('components').select('component_id').eq('component_name', component_name).execute()
        
        if not component_response.data:
            print(f"No component found with name '{component_name}'")
            return []
        
        component_id = component_response.data[0]['component_id']
        
        # Get parts
        parts_response = supabase.table('parts').select('*').eq('type_id', type_id).eq('component_id', component_id).execute()
        
        return parts_response.data
    
    except Exception as e:
        print(f"Error getting parts: {str(e)}")
        return []

def predict_vehicle_failures(supabase, models, vehicle_data, threshold=0.1):
    """
    Predict component failures for a vehicle.
    
    Args:
        supabase: Supabase client
        models (dict): Dictionary of component models
        vehicle_data (dict): Vehicle data (make, model, year, mileage)
        threshold (float): Probability threshold for recommendations
        
    Returns:
        list: List of component predictions with parts
    """
    make = vehicle_data['make']
    model = vehicle_data['model']
    year = vehicle_data['year']
    
    predictions = []
    
    for component_name, model in models.items():
        # Predict failure probability
        prob = model.predict_proba(pd.DataFrame([vehicle_data]))[0][1]
        
        # Get parts for this component if probability is above threshold
        parts = []
        if prob >= threshold:
            parts = get_parts_for_vehicle_component(supabase, make, model, year, component_name)
        
        predictions.append({
            'component': component_name,
            'probability': prob,
            'parts': parts
        })
    
    # Sort by probability (highest first)
    predictions.sort(key=lambda x: x['probability'], reverse=True)
    
    return predictions

def main():
    """Main function to predict component failures."""
    
    parser = argparse.ArgumentParser(description='Predict component failures for a vehicle')
    parser.add_argument('--make', type=str, required=True, help='Vehicle make')
    parser.add_argument('--model', type=str, required=True, help='Vehicle model')
    parser.add_argument('--year', type=int, required=True, help='Vehicle year')
    parser.add_argument('--mileage', type=int, required=True, help='Vehicle mileage')
    parser.add_argument('--threshold', type=float, default=0.1, help='Probability threshold for recommendations')
    
    args = parser.parse_args()
    
    # Create vehicle data dictionary
    vehicle_data = {
        'make': args.make,
        'model': args.model,
        'year': args.year,
        'mileage': args.mileage
    }
    
    print(f"Predicting failures for: {args.year} {args.make} {args.model} with {args.mileage} miles")
    
    # Load models
    print("\nLoading component models...")
    models = load_models()
    
    if not models:
        print("No models found. Please run train_failure_models.py first.")
        return 1
    
    # Connect to Supabase
    print("\nConnecting to Supabase...")
    supabase = connect_to_supabase()
    print("Connection successful!")
    
    # Predict failures
    print("\nPredicting component failures...")
    predictions = predict_vehicle_failures(supabase, models, vehicle_data, args.threshold)
    
    # Display results
    print("\n=== Failure Predictions ===")
    print(f"Vehicle: {args.year} {args.make} {args.model}")
    print(f"Mileage: {args.mileage} miles")
    print(f"Threshold: {args.threshold:.1%}")
    print("\nComponent Failure Probabilities:")
    
    for pred in predictions:
        component = pred['component']
        prob = pred['probability']
        parts = pred['parts']
        
        print(f"\n{component}: {prob:.2%}")
        
        if prob >= args.threshold:
            if parts:
                print("  Recommended Parts:")
                for part in parts:
                    print(f"  - {part['part_name']} (Part #: {part['part_number']})")
            else:
                print("  No specific parts found for this vehicle and component")
    
    return 0

if __name__ == "__main__":
    exit(main()) 