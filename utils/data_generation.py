"""
Data generation utilities for simulating vehicle data, parts, and failure rates.
"""

import pandas as pd
import numpy as np
import random
import os
from typing import Dict, List, Tuple, Optional


def generate_vehicle_types(n_types: int = 50) -> pd.DataFrame:
    """
    Generate simulated vehicle types (make, model, year combinations).
    
    Args:
        n_types: Number of vehicle types to generate
        
    Returns:
        DataFrame with vehicle type information
    """
    # Common vehicle makes and models
    makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'BMW', 'Mercedes', 'Audi']
    models_by_make = {
        'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey'],
        'Ford': ['F-150', 'Escape', 'Explorer', 'Focus', 'Mustang'],
        'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Suburban'],
        'Nissan': ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Frontier'],
        'Hyundai': ['Elantra', 'Santa Fe', 'Tucson', 'Sonata', 'Kona'],
        'Kia': ['Sportage', 'Sorento', 'Forte', 'Soul', 'Telluride'],
        'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series'],
        'Mercedes': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class'],
        'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3']
    }
    
    # Generate random combinations
    types_data = []
    type_id = 1
    
    # Ensure we generate at least n_types
    while len(types_data) < n_types:
        make = random.choice(makes)
        model = random.choice(models_by_make[make])
        year = random.randint(2005, 2023)
        
        # Add some randomness to avoid duplicates
        if random.random() < 0.7:  # 70% chance to add this combination
            types_data.append({
                'type_id': type_id,
                'make': make,
                'model': model,
                'year': year
            })
            type_id += 1
    
    return pd.DataFrame(types_data)


def generate_vehicles(vehicle_types: pd.DataFrame, n_vehicles: int = 10000) -> pd.DataFrame:
    """
    Generate simulated vehicles with mileage based on vehicle types.
    
    Args:
        vehicle_types: DataFrame of vehicle types
        n_vehicles: Number of vehicles to generate
        
    Returns:
        DataFrame with vehicle information
    """
    vehicles_data = []
    
    for i in range(1, n_vehicles + 1):
        # Randomly select a vehicle type
        type_row = vehicle_types.sample(1).iloc[0]
        type_id = type_row['type_id']
        year = type_row['year']
        
        # Calculate age of the vehicle
        current_year = 2023
        age = current_year - year
        
        # Generate mileage based on age (with some randomness)
        # Assuming average 12,000 miles per year
        base_mileage = age * 12000
        mileage = int(max(1000, np.random.normal(base_mileage, base_mileage * 0.2)))
        
        vehicles_data.append({
            'vehicle_id': i,
            'type_id': type_id,
            'mileage': mileage
        })
    
    return pd.DataFrame(vehicles_data)


def generate_components() -> pd.DataFrame:
    """
    Generate common vehicle components.
    
    Returns:
        DataFrame with component information
    """
    components_data = [
        {'component_id': 1, 'component_name': 'brakes'},
        {'component_id': 2, 'component_name': 'batteries'},
        {'component_id': 3, 'component_name': 'alternators'},
        {'component_id': 4, 'component_name': 'spark plugs'},
        {'component_id': 5, 'component_name': 'tires'},
        {'component_id': 6, 'component_name': 'oil filters'},
        {'component_id': 7, 'component_name': 'air filters'},
        {'component_id': 8, 'component_name': 'starters'},
        {'component_id': 9, 'component_name': 'water pumps'},
        {'component_id': 10, 'component_name': 'fuel pumps'}
    ]
    
    return pd.DataFrame(components_data)


def generate_parts(vehicle_types: pd.DataFrame, components: pd.DataFrame) -> pd.DataFrame:
    """
    Generate parts that fit specific vehicle types for specific components.
    
    Args:
        vehicle_types: DataFrame of vehicle types
        components: DataFrame of components
        
    Returns:
        DataFrame with parts information
    """
    parts_data = []
    part_id = 1
    
    # For each component
    for _, component in components.iterrows():
        component_id = component['component_id']
        component_name = component['component_name']
        
        # For a subset of vehicle types (we don't need a part for every vehicle-component combo)
        for _, vtype in vehicle_types.sample(min(len(vehicle_types), 30)).iterrows():
            type_id = vtype['type_id']
            make = vtype['make']
            model = vtype['model']
            year = vtype['year']
            
            # Generate a part name and number
            part_name = f"{component_name.title()} for {make} {model} {year}"
            part_number = f"{make[:2].upper()}{model[:2].upper()}{year % 100}{component_id:02d}{random.randint(100, 999)}"
            
            parts_data.append({
                'part_id': part_id,
                'part_name': part_name,
                'part_number': part_number,
                'type_id': type_id,
                'component_id': component_id
            })
            part_id += 1
    
    return pd.DataFrame(parts_data)


def calculate_failure_probability(mileage: int, component_id: int) -> float:
    """
    Calculate failure probability based on mileage and component type.
    
    Args:
        mileage: Vehicle mileage
        component_id: Component ID
        
    Returns:
        Failure probability between 0 and 1
    """
    # Define thresholds and base probabilities for each component
    thresholds = {
        1: 60000,    # brakes
        2: 50000,    # batteries
        3: 100000,   # alternators
        4: 80000,    # spark plugs
        5: 40000,    # tires
        6: 5000,     # oil filters
        7: 15000,    # air filters
        8: 150000,   # starters
        9: 90000,    # water pumps
        10: 100000   # fuel pumps
    }
    
    base_rates = {
        1: 0.15,     # brakes
        2: 0.20,     # batteries
        3: 0.05,     # alternators
        4: 0.10,     # spark plugs
        5: 0.25,     # tires
        6: 0.30,     # oil filters
        7: 0.15,     # air filters
        8: 0.03,     # starters
        9: 0.07,     # water pumps
        10: 0.05     # fuel pumps
    }
    
    threshold = thresholds.get(component_id, 50000)
    base_rate = base_rates.get(component_id, 0.10)
    
    # Logistic function to model probability
    # As mileage approaches threshold, probability approaches base_rate
    # After threshold, probability increases more rapidly
    k = 5 / threshold  # Steepness factor
    x0 = threshold     # Midpoint
    
    prob = base_rate / (1 + np.exp(-k * (mileage - x0)))
    
    # Add some randomness
    prob = min(0.95, max(0.01, prob * (1 + random.uniform(-0.2, 0.2))))
    
    return prob


def generate_failure_data(vehicles: pd.DataFrame, components: pd.DataFrame) -> pd.DataFrame:
    """
    Generate simulated failure probabilities for vehicle-component pairs.
    
    Args:
        vehicles: DataFrame of vehicles
        components: DataFrame of components
        
    Returns:
        DataFrame with failure probabilities
    """
    failures_data = []
    
    for _, vehicle in vehicles.iterrows():
        vehicle_id = vehicle['vehicle_id']
        mileage = vehicle['mileage']
        
        for _, component in components.iterrows():
            component_id = component['component_id']
            
            # Calculate failure probability
            failure_rate = calculate_failure_probability(mileage, component_id)
            
            failures_data.append({
                'vehicle_id': vehicle_id,
                'component_id': component_id,
                'failure_rate': failure_rate
            })
    
    return pd.DataFrame(failures_data)


def generate_all_data(n_types: int = 50, n_vehicles: int = 10000) -> Dict[str, pd.DataFrame]:
    """
    Generate all simulated data tables.
    
    Args:
        n_types: Number of vehicle types to generate
        n_vehicles: Number of vehicles to generate
        
    Returns:
        Dictionary of DataFrames
    """
    print("Generating vehicle types...")
    vehicle_types = generate_vehicle_types(n_types)
    
    print("Generating vehicles...")
    vehicles = generate_vehicles(vehicle_types, n_vehicles)
    
    print("Generating components...")
    components = generate_components()
    
    print("Generating parts...")
    parts = generate_parts(vehicle_types, components)
    
    print("Generating failure data...")
    failures = generate_failure_data(vehicles, components)
    
    return {
        'vehicle_types': vehicle_types,
        'vehicles': vehicles,
        'components': components,
        'parts': parts,
        'failures': failures
    }


def save_data(data_dict: Dict[str, pd.DataFrame], output_dir: str = 'data') -> None:
    """
    Save all DataFrames to CSV files.
    
    Args:
        data_dict: Dictionary of DataFrames
        output_dir: Directory to save files
    """
    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save each DataFrame to a CSV file
    for name, df in data_dict.items():
        file_path = os.path.join(output_dir, f"{name}.csv")
        df.to_csv(file_path, index=False)
        print(f"Saved {len(df)} rows to {file_path}")


if __name__ == "__main__":
    # Generate and save data when script is run directly
    data = generate_all_data(n_types=50, n_vehicles=10000)
    save_data(data, 'data') 