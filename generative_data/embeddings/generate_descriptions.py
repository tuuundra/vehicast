#!/usr/bin/env python3
"""
Description Generation Script for Automotive Parts Prediction & Inventory Optimization

This script generates rich text descriptions for entities in the database,
which will be used to create embeddings for semantic search.
"""

import os
import pandas as pd
from utils.database import connect_to_supabase


def generate_vehicle_type_descriptions(supabase):
    """Generate descriptions for vehicle types."""
    print("Generating descriptions for vehicle types...")
    
    # Fetch all vehicle types
    response = supabase.table('vehicle_types').select('*').execute()
    vehicle_types = response.data
    
    descriptions = []
    for vt in vehicle_types:
        # Create a rich description
        description = f"{vt['year']} {vt['make']} {vt['model']} - A {vt['make']} vehicle manufactured in {vt['year']}."
        
        descriptions.append({
            'type_id': vt['type_id'],
            'description': description
        })
    
    print(f"Generated {len(descriptions)} vehicle type descriptions")
    return descriptions


def generate_component_descriptions(supabase):
    """Generate descriptions for components."""
    print("Generating descriptions for components...")
    
    # Fetch all components
    response = supabase.table('components').select('*').execute()
    components = response.data
    
    # Component descriptions with more detail
    component_details = {
        'brakes': 'Braking system including brake pads, rotors, and calipers that slow or stop the vehicle.',
        'batteries': 'Electrical storage system that provides power to start the engine and run vehicle electronics.',
        'alternators': 'Charging system component that generates electricity to recharge the battery and power electrical systems.',
        'spark plugs': 'Ignition system components that create the spark to ignite fuel in the engine cylinders.',
        'tires': 'Rubber components that provide traction and cushioning between the vehicle and the road.',
        'oil filters': 'Engine component that removes contaminants from engine oil to protect the engine.',
        'air filters': 'Component that cleans air entering the engine to prevent damage from particles.',
        'fuel pumps': 'Component that delivers fuel from the tank to the engine at the proper pressure.',
        'radiators': 'Cooling system component that dissipates heat from engine coolant.',
        'starters': 'Electrical motor that initiates engine operation when the vehicle is started.'
    }
    
    descriptions = []
    for comp in components:
        component_name = comp['component_name'].lower()
        # Use detailed description if available, otherwise create a generic one
        if component_name in component_details:
            description = component_details[component_name]
        else:
            description = f"Automotive {comp['component_name']} component for vehicle operation and maintenance."
        
        descriptions.append({
            'component_id': comp['component_id'],
            'description': description
        })
    
    print(f"Generated {len(descriptions)} component descriptions")
    return descriptions


def generate_part_descriptions(supabase):
    """Generate descriptions for parts."""
    print("Generating descriptions for parts...")
    
    # Fetch all parts
    parts_response = supabase.table('parts').select('*').execute()
    parts = parts_response.data
    
    # Fetch all vehicle types for lookup
    vt_response = supabase.table('vehicle_types').select('*').execute()
    vehicle_types = {vt['type_id']: vt for vt in vt_response.data}
    
    # Fetch all components for lookup
    comp_response = supabase.table('components').select('*').execute()
    components = {comp['component_id']: comp for comp in comp_response.data}
    
    descriptions = []
    for part in parts:
        # Get related vehicle type and component
        vt = vehicle_types.get(part['type_id'], {})
        comp = components.get(part['component_id'], {})
        
        # Create a rich description
        description = f"{part['part_name']} (Part #{part['part_number']}) - A {comp.get('component_name', 'unknown')} component "
        description += f"designed for {vt.get('year', 'N/A')} {vt.get('make', 'N/A')} {vt.get('model', 'N/A')}. "
        description += f"This part ensures optimal performance of the vehicle's {comp.get('component_name', 'unknown')} system."
        
        descriptions.append({
            'part_id': part['part_id'],
            'description': description
        })
    
    print(f"Generated {len(descriptions)} part descriptions")
    return descriptions


def generate_vehicle_descriptions(supabase):
    """Generate descriptions for individual vehicles."""
    print("Generating descriptions for vehicles...")
    
    # Fetch all vehicles
    vehicles_response = supabase.table('vehicles').select('*').execute()
    vehicles = vehicles_response.data
    
    # Fetch all vehicle types for lookup
    vt_response = supabase.table('vehicle_types').select('*').execute()
    vehicle_types = {vt['type_id']: vt for vt in vt_response.data}
    
    descriptions = []
    for vehicle in vehicles:
        # Get related vehicle type
        vt = vehicle_types.get(vehicle['type_id'], {})
        
        # Categorize mileage
        mileage = vehicle['mileage']
        if mileage < 30000:
            mileage_desc = "low mileage"
        elif mileage < 70000:
            mileage_desc = "moderate mileage"
        elif mileage < 120000:
            mileage_desc = "high mileage"
        else:
            mileage_desc = "very high mileage"
        
        # Create a rich description
        description = f"{vt.get('year', 'N/A')} {vt.get('make', 'N/A')} {vt.get('model', 'N/A')} with {mileage} miles. "
        description += f"This is a {mileage_desc} vehicle that may require maintenance appropriate for its age and usage."
        
        descriptions.append({
            'vehicle_id': vehicle['vehicle_id'],
            'description': description
        })
    
    print(f"Generated {len(descriptions)} vehicle descriptions")
    return descriptions


def generate_failure_descriptions(supabase):
    """Generate descriptions for failure symptoms."""
    print("Generating descriptions for failure symptoms...")
    
    # Component-specific failure symptoms
    failure_symptoms = {
        'brakes': [
            "Grinding noise when braking, reduced stopping power, and vibration in the brake pedal.",
            "Squealing or squeaking sounds when applying brakes, especially at low speeds.",
            "Soft or spongy brake pedal feel, requiring more distance to stop the vehicle.",
            "Vehicle pulling to one side when braking, indicating uneven brake wear or hydraulic issues."
        ],
        'batteries': [
            "Difficulty starting the vehicle, especially in cold weather, with slow cranking of the engine.",
            "Electrical systems showing intermittent functionality, including dimming headlights.",
            "Battery warning light illuminated on the dashboard, indicating charging system issues.",
            "Corrosion visible on battery terminals, potentially causing poor electrical connections."
        ],
        'alternators': [
            "Battery warning light on dashboard, combined with dimming headlights during operation.",
            "Vehicle stalling unexpectedly or difficulty starting after being run for a period.",
            "Whining or grinding noise from the front of the engine, indicating bearing failure.",
            "Electrical accessories functioning poorly, especially when multiple systems are in use."
        ],
        'spark plugs': [
            "Engine misfiring, rough idling, or hesitation during acceleration.",
            "Decreased fuel efficiency and power, especially during acceleration.",
            "Difficulty starting the engine, particularly in cold or damp conditions.",
            "Check engine light illuminated, often accompanied by diagnostic codes for cylinder misfires."
        ],
        'tires': [
            "Uneven tire wear patterns, indicating alignment or suspension issues.",
            "Vibration felt through the steering wheel, especially at highway speeds.",
            "Reduced traction in wet conditions, increasing stopping distance.",
            "Visible damage to tire sidewalls or tread, including bulges, cuts, or excessive wear."
        ],
        'oil filters': [
            "Decreased engine performance and power, especially under load.",
            "Engine oil appearing dirty shortly after an oil change.",
            "Metallic sounds from the engine, indicating potential internal damage.",
            "Check engine light illuminated, potentially with oil pressure warning indicators."
        ],
        'air filters': [
            "Reduced fuel economy and engine performance, especially during acceleration.",
            "Black smoke from the exhaust, indicating improper air-fuel mixture.",
            "Engine running rough or hesitating when accelerating.",
            "Unusual engine sounds, particularly during changes in throttle position."
        ],
        'fuel pumps': [
            "Engine sputtering at high speeds or under stress, indicating fuel delivery issues.",
            "Difficulty starting the vehicle, with extended cranking before the engine fires.",
            "Loss of power when accelerating or climbing hills, especially under load.",
            "Whining noise from the rear of the vehicle, where the fuel tank is located."
        ],
        'radiators': [
            "Engine overheating, especially in hot weather or during extended operation.",
            "Sweet smell (from ethylene glycol) inside or around the vehicle.",
            "Visible coolant leaks under the vehicle, often with a green, orange, or pink color.",
            "White smoke from the exhaust, potentially indicating coolant entering the combustion chamber."
        ],
        'starters': [
            "Clicking sound when turning the key, but engine fails to crank.",
            "Grinding noise during starting, indicating gear engagement issues.",
            "Starter continuing to run after the engine has started (starter drive not disengaging).",
            "Intermittent starting issues, where the starter works occasionally but not consistently."
        ]
    }
    
    # Fetch all components
    response = supabase.table('components').select('*').execute()
    components = response.data
    
    descriptions = []
    for comp in components:
        component_name = comp['component_name'].lower()
        
        # Get symptoms for this component, or use generic ones
        if component_name in failure_symptoms:
            symptoms = failure_symptoms[component_name]
        else:
            symptoms = [
                f"Unusual noises or performance issues related to the {component_name} system.",
                f"Warning indicators on dashboard related to {component_name} functionality.",
                f"Visible damage or wear to {component_name} components during inspection.",
                f"Intermittent operation or failure of the {component_name} system."
            ]
        
        # Create multiple descriptions for each component
        for symptom in symptoms:
            descriptions.append({
                'component_id': comp['component_id'],
                'symptom_description': symptom
            })
    
    print(f"Generated {len(descriptions)} failure symptom descriptions")
    return descriptions


def main():
    """Main function to generate and store descriptions."""
    
    print("======== Automotive Description Generation ========")
    print("Connecting to Supabase...")
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        print("Connection successful!")
        
        # Generate descriptions for each entity type
        vehicle_type_descriptions = generate_vehicle_type_descriptions(supabase)
        component_descriptions = generate_component_descriptions(supabase)
        part_descriptions = generate_part_descriptions(supabase)
        vehicle_descriptions = generate_vehicle_descriptions(supabase)
        failure_descriptions = generate_failure_descriptions(supabase)
        
        # Save descriptions to CSV files for review (optional)
        print("\nSaving descriptions to CSV files...")
        os.makedirs('data/descriptions', exist_ok=True)
        
        pd.DataFrame(vehicle_type_descriptions).to_csv('data/descriptions/vehicle_type_descriptions.csv', index=False)
        pd.DataFrame(component_descriptions).to_csv('data/descriptions/component_descriptions.csv', index=False)
        pd.DataFrame(part_descriptions).to_csv('data/descriptions/part_descriptions.csv', index=False)
        pd.DataFrame(vehicle_descriptions).to_csv('data/descriptions/vehicle_descriptions.csv', index=False)
        pd.DataFrame(failure_descriptions).to_csv('data/descriptions/failure_descriptions.csv', index=False)
        
        print("Descriptions saved to data/descriptions/ directory")
        print("\nNext step: Generate embeddings using these descriptions")
        print("Run generate_embeddings.py to create and store embeddings")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 