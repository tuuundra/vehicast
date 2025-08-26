#!/usr/bin/env python3
"""
Utility functions for time-based component failure predictions.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timezone

def convert_numpy_types(obj):
    """
    Recursively convert NumPy types to Python native types for JSON serialization.
    
    Args:
        obj: Object to convert (can be dict, list, or NumPy type)
        
    Returns:
        Object with NumPy types converted to Python native types
    """
    if isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return convert_numpy_types(obj.tolist())
    elif hasattr(obj, 'item'):
        return obj.item()
    else:
        return obj

def get_mileage_accumulation_rate(vehicle_data, supabase=None):
    """
    Get the monthly mileage accumulation rate for a vehicle.
    Now uses the stored rate from the database if available.
    
    Args:
        vehicle_data: Dictionary containing vehicle information
        supabase: Supabase client instance (optional)
        
    Returns:
        Monthly mileage accumulation rate (miles per month)
    """
    # If we have a vehicle ID, try to get the stored rate from the database
    if supabase is not None and 'vehicle_id' in vehicle_data:
        try:
            # Query the vehicles table for this specific vehicle
            response = supabase.table('vehicles').select('estimated_monthly_accumulation').eq('vehicle_id', vehicle_data['vehicle_id']).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]['estimated_monthly_accumulation']
        except Exception as e:
            print(f"Error retrieving mileage rate from database: {str(e)}")
    
    # Fallback to the original logic if we can't get it from the database
    # This handles cases where we're predicting for a vehicle not in our database
    vehicle_type = f"{vehicle_data.get('make', '')} {vehicle_data.get('model', '')}"
    
    if 'truck' in vehicle_type.lower() or 'f-150' in vehicle_type.lower():
        return 2500  # Commercial trucks
    elif 'sprinter' in vehicle_type.lower() or 'transit' in vehicle_type.lower():
        return 3000  # Delivery vans
    elif ('camry' in vehicle_type.lower() or 'accord' in vehicle_type.lower()) and vehicle_data.get('mileage', 0) > 50000:
        return 2000  # Likely rideshare vehicles
    elif 'corolla' in vehicle_type.lower() or 'civic' in vehicle_type.lower():
        return 1200  # Efficient commuters
    elif 'bmw' in vehicle_type.lower() or 'mercedes' in vehicle_type.lower():
        return 800   # Luxury vehicles driven less
    else:
        return 1000  # Default for sedans and other vehicles

def estimate_future_mileage(vehicle_data, months_ahead, supabase=None):
    """
    Estimate future mileage based on current mileage, time since last update,
    and monthly accumulation rate.
    
    Args:
        vehicle_data: Dictionary containing vehicle information
        months_ahead: Number of months to project into the future
        supabase: Optional Supabase client instance
        
    Returns:
        Estimated future mileage
    """
    current_mileage = vehicle_data['mileage']
    
    # Calculate effective current mileage based on time since last update
    if supabase is not None and 'vehicle_id' in vehicle_data:
        try:
            # Get the last update timestamp for this vehicle
            response = supabase.table('vehicles').select('mileage, last_update').eq('vehicle_id', vehicle_data['vehicle_id']).execute()
            
            if response.data and len(response.data) > 0:
                db_vehicle = response.data[0]
                last_update = db_vehicle['last_update']
                
                # Calculate months since last update
                last_update_date = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
                current_date = datetime.now(timezone.utc)
                months_since_update = (current_date - last_update_date).days / 30.0  # Approximate
                
                if months_since_update > 0:
                    # Get the monthly rate
                    monthly_rate = get_mileage_accumulation_rate(vehicle_data, supabase)
                    
                    # Update the current mileage based on time passed
                    current_mileage = db_vehicle['mileage'] + (monthly_rate * months_since_update)
                    
                    # Update the vehicle_data dictionary for other functions
                    vehicle_data['mileage'] = current_mileage
        except Exception as e:
            print(f"Error calculating effective current mileage: {str(e)}")
    
    # Calculate future mileage
    monthly_rate = get_mileage_accumulation_rate(vehicle_data, supabase)
    future_mileage = current_mileage + (monthly_rate * months_ahead)
    
    return future_mileage

def calculate_failure_probability_at_mileage(model, vehicle_data, target_mileage):
    """
    Calculate failure probability at a specific mileage.
    
    Args:
        model: Trained model for a component
        vehicle_data: Dictionary with vehicle information
        target_mileage: Target mileage to predict for
        
    Returns:
        Failure probability at the target mileage
    """
    # Create a copy with the target mileage
    future_vehicle = vehicle_data.copy()
    future_vehicle['mileage'] = target_mileage
    
    # Predict failure probability
    try:
        prob = model.predict_proba(pd.DataFrame([future_vehicle]))[0][1]
        return prob
    except Exception as e:
        print(f"Error predicting at mileage {target_mileage}: {str(e)}")
        return 0.0

def predict_failure_timeline(models, vehicle_data, time_windows=[3, 6, 12, 24], supabase=None):
    """
    Predict component failure probabilities across multiple time windows.
    
    Args:
        models: Dictionary of trained models by component name
        vehicle_data: Dictionary containing vehicle information
        time_windows: List of time windows in months
        supabase: Optional Supabase client instance
        
    Returns:
        Dictionary of predictions by component and time window
    """
    timeline_predictions = {}
    
    for component_name, model in models.items():
        timeline_predictions[component_name] = {}
        
        for months in time_windows:
            # Estimate future mileage at this time point
            future_mileage = estimate_future_mileage(vehicle_data, months, supabase)
            
            # Calculate failure probability at that mileage
            prob = calculate_failure_probability_at_mileage(model, vehicle_data, future_mileage)
            
            # Store the prediction
            timeline_predictions[component_name][f"{months} months"] = {
                "probability": prob,
                "projected_mileage": future_mileage
            }
    
    return timeline_predictions

def calculate_cumulative_failure_timeline(models, vehicle_data, time_windows=[3, 6, 12, 24], supabase=None):
    """
    Calculate cumulative failure probabilities over specified time windows.
    
    Args:
        models: Dictionary of trained models by component name
        vehicle_data: Dictionary containing vehicle information
        time_windows: List of time windows in months
        supabase: Optional Supabase client instance
        
    Returns:
        Dictionary of cumulative predictions by component and time window
    """
    # First get the point probabilities
    point_predictions = predict_failure_timeline(models, vehicle_data, time_windows, supabase)
    cumulative_predictions = {}
    
    for component_name, predictions in point_predictions.items():
        cumulative_predictions[component_name] = {}
        
        # Sort time windows by month value
        sorted_windows = sorted(predictions.keys(), key=lambda x: int(x.split()[0]))
        
        # Calculate cumulative probability for each time window
        cumulative_prob = 0
        for window in sorted_windows:
            point_prob = predictions[window]["probability"]
            
            # Calculate conditional probability given survival so far
            conditional_prob = point_prob / (1 - cumulative_prob) if cumulative_prob < 1 else 0
            
            # Update cumulative probability
            cumulative_prob = cumulative_prob + (1 - cumulative_prob) * conditional_prob
            
            # Store the cumulative prediction
            cumulative_predictions[component_name][window] = {
                "probability": cumulative_prob,
                "projected_mileage": predictions[window]["projected_mileage"]
            }
    
    return cumulative_predictions 