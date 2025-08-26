#!/usr/bin/env python3
"""
Predictive Modeling for Component Failure Prediction

This script trains logistic regression models to predict the probability of
component failures based on vehicle details (make, model, year, mileage).
"""

import os
import pickle
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from utils.database import connect_to_supabase

# Load environment variables
load_dotenv()

# Directory to save models
MODELS_DIR = 'models'
os.makedirs(MODELS_DIR, exist_ok=True)

def fetch_training_data(supabase):
    """
    Fetch training data from Supabase.
    
    Returns:
        tuple: (vehicles_df, failures_df)
    """
    print("Fetching vehicle data...")
    
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
    
    # Fetch failures data
    print("Fetching failure data...")
    failures_response = supabase.table('failures').select('*').execute()
    failures_df = pd.DataFrame(failures_response.data)
    
    print(f"Fetched {len(failures_df)} failure records")
    
    return vehicles_df, failures_df, components_df

def prepare_component_data(vehicles_df, failures_df, component_id):
    """
    Prepare training data for a specific component.
    
    Args:
        vehicles_df (DataFrame): Vehicle data
        failures_df (DataFrame): Failure data
        component_id (int): ID of the component to model
        
    Returns:
        tuple: (X, y) features and target
    """
    # Filter failures for this component
    component_failures = failures_df[failures_df['component_id'] == component_id]
    
    # Create target variable (1 for failed, 0 for not failed)
    # Start with all vehicles not failed
    vehicles_df['failed'] = 0
    
    # Mark vehicles that have failures for this component
    failed_vehicle_ids = component_failures['vehicle_id'].unique()
    vehicles_df.loc[vehicles_df['vehicle_id'].isin(failed_vehicle_ids), 'failed'] = 1
    
    # Features: make, model, year, mileage
    X = vehicles_df[['make', 'model', 'year', 'mileage']]
    y = vehicles_df['failed']
    
    return X, y

def train_component_model(X, y, component_name):
    """
    Train a logistic regression model for a component.
    
    Args:
        X (DataFrame): Features
        y (Series): Target
        component_name (str): Name of the component
        
    Returns:
        Pipeline: Trained model pipeline
    """
    print(f"Training model for {component_name}...")
    
    # Define categorical and numerical features
    categorical_features = ['make', 'model']
    numerical_features = ['year', 'mileage']
    
    # Create preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
            ('num', 'passthrough', numerical_features)
        ])
    
    # Create model pipeline
    model = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(max_iter=1000, class_weight='balanced'))
    ])
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    print(f"Model performance for {component_name}:")
    print(f"  Accuracy: {accuracy:.4f}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall: {recall:.4f}")
    print(f"  F1 Score: {f1:.4f}")
    
    # Save model
    model_path = os.path.join(MODELS_DIR, f"{component_name.replace(' ', '_')}_model.pkl")
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to {model_path}")
    
    return model

def predict_failure_probability(model, vehicle_data):
    """
    Predict failure probability for a vehicle.
    
    Args:
        model (Pipeline): Trained model
        vehicle_data (dict): Vehicle data (make, model, year, mileage)
        
    Returns:
        float: Failure probability
    """
    # Convert to DataFrame
    vehicle_df = pd.DataFrame([vehicle_data])
    
    # Predict probability
    prob = model.predict_proba(vehicle_df)[0][1]
    
    return prob

def main():
    """Main function to train component failure models."""
    
    # Connect to Supabase
    print("Connecting to Supabase...")
    supabase = connect_to_supabase()
    print("Connection successful!")
    
    # Fetch training data
    vehicles_df, failures_df, components_df = fetch_training_data(supabase)
    
    # Train a model for each component
    models = {}
    for _, component in components_df.iterrows():
        component_id = component['component_id']
        component_name = component['component_name']
        
        # Prepare data for this component
        X, y = prepare_component_data(vehicles_df, failures_df, component_id)
        
        # Train model
        model = train_component_model(X, y, component_name)
        models[component_name] = model
    
    print("\nAll models trained successfully!")
    
    # Test predictions for a sample vehicle
    print("\nTesting predictions for a sample vehicle:")
    sample_vehicle = {
        'make': 'Toyota',
        'model': 'Camry',
        'year': 2010,
        'mileage': 120000
    }
    
    print(f"Sample vehicle: {sample_vehicle}")
    print("Predicted failure probabilities:")
    
    for component_name, model in models.items():
        prob = predict_failure_probability(model, sample_vehicle)
        print(f"  {component_name}: {prob:.2%}")

if __name__ == "__main__":
    main() 