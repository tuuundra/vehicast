import csv
import random
import os
from datetime import datetime

# Create output directory if it doesn't exist
output_dir = 'data'
os.makedirs(output_dir, exist_ok=True)

# ---- STEP 1: Generate Regions Data ----

# States data: state_name, population, lat, lng
states = [
    ("Virginia", 8535519, 37.7693, -78.1700),
    ("California", 39538223, 36.7783, -119.4179),
    ("Texas", 29145505, 31.9686, -99.9018),
    ("New York", 20201249, 40.7128, -74.0060),
    ("Florida", 21538187, 27.6648, -81.5158),
]

# Counties data by state
counties = {
    "Virginia": [
        ("Fairfax County", 1147532, 38.8462, -77.3064),
        ("Virginia Beach", 449974, 36.8529, -75.9780),
        ("Loudoun County", 413538, 39.0768, -77.6536),
        ("Henrico County", 330818, 37.5407, -77.3920),
        ("Norfolk County", 242803, 36.8508, -76.2859),
    ],
    "California": [
        ("Los Angeles County", 10014009, 34.0522, -118.2437),
        ("San Diego County", 3298634, 32.7157, -117.1611),
        ("Orange County", 3168044, 33.7175, -117.8311),
        ("Riverside County", 2418185, 33.9533, -117.3961),
        ("San Bernardino County", 2181654, 34.1083, -117.2898),
    ],
    "Texas": [
        ("Harris County", 4713325, 29.7752, -95.3103),
        ("Dallas County", 2635516, 32.7767, -96.7970),
        ("Tarrant County", 2102515, 32.7732, -97.2918),
        ("Bexar County", 2003554, 29.4241, -98.4936),
        ("Travis County", 1290188, 30.3372, -97.7911),
    ],
    "New York": [
        ("Kings County", 2736074, 40.6501, -73.9496),
        ("Queens County", 2405464, 40.7282, -73.7949),
        ("New York County", 1694251, 40.7831, -73.9712),
        ("Suffolk County", 1526345, 40.9849, -72.6151),
        ("Bronx County", 1472654, 40.8448, -73.8648),
    ],
    "Florida": [
        ("Miami-Dade County", 2716940, 25.7617, -80.1918),
        ("Broward County", 1952778, 26.1901, -80.3659),
        ("Palm Beach County", 1496770, 26.7056, -80.0364),
        ("Hillsborough County", 1471968, 27.9904, -82.3018),
        ("Orange County", 1393452, 28.5383, -81.3792),
    ],
}

# Generate regions CSV
with open(os.path.join(output_dir, 'regions.csv'), 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["name", "type", "parent_region_id", "population", "latitude", "longitude"])
    
    # Write states (parent_region_id will be NULL)
    state_id_map = {}
    for i, (name, pop, lat, lng) in enumerate(states, 1):
        writer.writerow([name, "state", "", pop, lat, lng])
        state_id_map[name] = i
    
    # Write counties with their parent state IDs
    for state_name in state_id_map:
        state_id = state_id_map[state_name]
        for name, pop, lat, lng in counties[state_name]:
            writer.writerow([name, "county", state_id, pop, lat, lng])

print(f"Generated regions data in {os.path.join(output_dir, 'regions.csv')}")

# ---- STEP 2: Get vehicle types information ----

# Sample vehicle types: make, model, year (no ID to avoid foreign key issues)
vehicle_types = []
makes = ["Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes", "Audi", "Kia", "Hyundai"]
models = {
    "Toyota": ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma"],
    "Honda": ["Civic", "Accord", "CR-V", "Pilot", "Odyssey"],
    "Ford": ["F-150", "Explorer", "Escape", "Mustang", "Edge"],
    "Chevrolet": ["Silverado", "Equinox", "Malibu", "Traverse", "Tahoe"],
    "Nissan": ["Altima", "Rogue", "Sentra", "Pathfinder", "Frontier"],
    "BMW": ["3 Series", "5 Series", "X3", "X5", "7 Series"],
    "Mercedes": ["C-Class", "E-Class", "GLC", "GLE", "S-Class"],
    "Audi": ["A4", "Q5", "A6", "Q7", "A3"],
    "Kia": ["Sorento", "Soul", "Forte", "Sportage", "Telluride"],
    "Hyundai": ["Elantra", "Santa Fe", "Tucson", "Sonata", "Palisade"]
}
years = list(range(2010, 2024))

# Generate a list of vehicle types (make, model, year)
for make in makes:
    for model in models[make]:
        for year in random.sample(years, 3):  # Pick 3 random years for each model
            vehicle_types.append((make, model, year))

# ---- STEP 3: Generate Vehicle Registration Data ----

def generate_registration_count(region_type, region_population, vehicle_make, vehicle_model, vehicle_year, region_name=None, parent_region_id=None, state_id_map=None):
    """Generate realistic registration counts based on region and vehicle characteristics"""
    # Base count as percentage of population (more cars in more populous areas)
    base_percentage = random.uniform(0.0005, 0.002)
    base_count = int(region_population * base_percentage)
    
    # Adjustments based on vehicle attributes
    # Newer vehicles are more common
    year_factor = (vehicle_year - 2009) / 15  # 0 to 1 scale, higher for newer vehicles
    
    # Different makes have different popularity by region
    # This is where domain knowledge would be applied
    make_popularity = {
        "Toyota": {"California": 1.3, "New York": 1.2, "Florida": 1.1, "Texas": 0.9, "Virginia": 1.0},
        "Honda": {"California": 1.4, "New York": 1.2, "Florida": 1.0, "Texas": 0.8, "Virginia": 1.1},
        "Ford": {"California": 0.8, "New York": 0.7, "Florida": 0.9, "Texas": 1.5, "Virginia": 1.0},
        "Chevrolet": {"California": 0.7, "New York": 0.8, "Florida": 0.9, "Texas": 1.4, "Virginia": 1.1},
        "Nissan": {"California": 1.1, "New York": 1.2, "Florida": 1.0, "Texas": 0.9, "Virginia": 1.0},
        "BMW": {"California": 1.5, "New York": 1.3, "Florida": 1.4, "Texas": 0.7, "Virginia": 0.9},
        "Mercedes": {"California": 1.4, "New York": 1.4, "Florida": 1.3, "Texas": 0.8, "Virginia": 0.9},
        "Audi": {"California": 1.3, "New York": 1.2, "Florida": 1.1, "Texas": 0.7, "Virginia": 0.8},
        "Kia": {"California": 1.0, "New York": 1.1, "Florida": 1.0, "Texas": 0.9, "Virginia": 1.1},
        "Hyundai": {"California": 1.0, "New York": 1.1, "Florida": 1.0, "Texas": 0.9, "Virginia": 1.1},
    }
    
    # Get the state name for this region
    state_name = None
    if region_type == "state":
        # If this is a state, region_name is already the state name
        state_name = region_name
    elif parent_region_id is not None and state_id_map is not None:
        # For counties, find the parent state using parent_region_id
        for s, id_val in state_id_map.items():
            if id_val == parent_region_id:
                state_name = s
                break
    
    # Default state if we couldn't determine it
    if not state_name:
        state_name = "Virginia"  # Default to Virginia
    
    # Apply make popularity factor
    make_factor = make_popularity.get(vehicle_make, {}).get(state_name, 1.0)
    
    # Apply adjustments
    adjusted_count = int(base_count * (0.5 + year_factor) * make_factor)
    
    # Add some random variation
    final_count = max(1, adjusted_count + random.randint(-50, 50))
    
    return final_count

# Create CSV for vehicle registrations with make, model, year instead of type_id
with open(os.path.join(output_dir, 'region_vehicle_makes.csv'), 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(["region_id", "make", "model", "year", "registration_count", "year_recorded"])
    
    # Generate data for multiple years to show trends
    registration_years = range(2018, 2024)  # 2018 to 2023
    
    # Generate registrations for each region and vehicle type
    region_id = 1  # Start with ID 1 for first state
    for state_name, state_pop, _, _ in states:
        # Add registrations for the state level
        for make, model, year in vehicle_types:
            # Base count for this vehicle type
            base_count = generate_registration_count("state", state_pop, make, model, year, region_name=state_name, state_id_map=state_id_map)
            
            # Generate data for each year with realistic trends
            for reg_year in registration_years:
                # Apply trends:
                # 1. Newer vehicles increase in registrations over time
                # 2. Older vehicles decrease in registrations over time
                # 3. Add some randomness
                
                # Calculate age factor: newer vehicles grow more in recent years
                vehicle_age = reg_year - year
                
                if vehicle_age < 0:
                    # Vehicle not yet manufactured in this registration year
                    continue
                
                # Age decay factor (older vehicles have fewer registrations in recent years)
                age_factor = max(0.5, 1.0 - (vehicle_age * 0.05))
                
                # Year trend factor (more recent years have more registrations overall)
                year_trend = 0.95 + ((reg_year - 2018) * 0.01)
                
                # Calculate adjusted count with some randomness
                year_count = int(base_count * age_factor * year_trend * random.uniform(0.9, 1.1))
                
                # Ensure minimum count
                year_count = max(1, year_count)
                
                writer.writerow([region_id, make, model, year, year_count, reg_year])
        
        # Move to the next region ID
        region_id += 1
    
    # Now add county registrations
    for state_name in counties:
        state_id = state_id_map[state_name]
        for county_name, county_pop, _, _ in counties[state_name]:
            for make, model, year in vehicle_types:
                # Base count for this vehicle type
                base_count = generate_registration_count("county", county_pop, make, model, year, region_name=county_name, parent_region_id=state_id, state_id_map=state_id_map)
                
                # Generate data for each year with realistic trends
                for reg_year in registration_years:
                    # Calculate age factor: newer vehicles grow more in recent years
                    vehicle_age = reg_year - year
                    
                    if vehicle_age < 0:
                        # Vehicle not yet manufactured in this registration year
                        continue
                    
                    # Age decay factor
                    age_factor = max(0.5, 1.0 - (vehicle_age * 0.05))
                    
                    # Year trend factor
                    year_trend = 0.95 + ((reg_year - 2018) * 0.01)
                    
                    # Regional variance (some regions adopt new vehicles faster)
                    regional_variance = random.uniform(0.9, 1.1)
                    
                    # Calculate adjusted count
                    year_count = int(base_count * age_factor * year_trend * regional_variance)
                    
                    # Ensure minimum count
                    year_count = max(1, year_count)
                    
                    writer.writerow([region_id, make, model, year, year_count, reg_year])
            
            # Move to the next region ID
            region_id += 1

print(f"Generated vehicle registration data in {os.path.join(output_dir, 'region_vehicle_makes.csv')}")

# Generate script to import the data into Supabase
with open(os.path.join(output_dir, 'import_instructions.sql'), 'w') as file:
    file.write("-- STEP 1: Import regions data\n")
    file.write("-- Go to Supabase Dashboard > Table Editor > regions > Import Data\n")
    file.write("-- Upload regions.csv file\n\n")
    
    file.write("-- STEP 2: Import vehicle registrations data\n")
    file.write("-- First, create a temporary table to hold the data\n\n")
    
    file.write("CREATE TABLE temp_region_vehicle_makes (\n")
    file.write("  region_id INTEGER NOT NULL,\n")
    file.write("  make VARCHAR NOT NULL,\n")
    file.write("  model VARCHAR NOT NULL,\n")
    file.write("  year INTEGER NOT NULL,\n")
    file.write("  registration_count INTEGER NOT NULL,\n")
    file.write("  year_recorded INTEGER NOT NULL\n")
    file.write(");\n\n")
    
    file.write("-- Go to Supabase Dashboard > Table Editor > temp_region_vehicle_makes > Import Data\n")
    file.write("-- Upload region_vehicle_makes.csv file\n\n")
    
    file.write("-- STEP 3: Join with vehicle_types to get type_id and insert into region_vehicle_types\n\n")
    
    file.write("INSERT INTO region_vehicle_types (region_id, type_id, registration_count, year_recorded)\n")
    file.write("SELECT \n")
    file.write("  r.region_id,\n")
    file.write("  v.type_id,\n")
    file.write("  r.registration_count,\n")
    file.write("  r.year_recorded\n")
    file.write("FROM \n")
    file.write("  temp_region_vehicle_makes r\n")
    file.write("  JOIN vehicle_types v ON \n")
    file.write("    r.make = v.make AND\n")
    file.write("    r.model = v.model AND\n")
    file.write("    r.year = v.year;\n\n")
    
    file.write("-- STEP 4: Clean up\n")
    file.write("DROP TABLE temp_region_vehicle_makes;\n")

print(f"Generated SQL instructions in {os.path.join(output_dir, 'import_instructions.sql')}")
