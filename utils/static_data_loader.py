import os
import json
import csv
import pandas as pd
from typing import Dict, List, Optional, Any, Union
import logging
import random

logger = logging.getLogger(__name__)

# Path to static data folder
STATIC_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static_data')

# Cache for loaded data
_data_cache = {}

def get_static_data_path(filename: str) -> str:
    """
    Get the full path to a static data file.
    
    Args:
        filename: The name of the file (with extension)
        
    Returns:
        The full path to the file
    """
    return os.path.join(STATIC_DATA_DIR, filename)

def load_csv_data(filename: str, use_cache: bool = True) -> List[Dict]:
    """
    Load data from a CSV file into a list of dictionaries.
    
    Args:
        filename: The name of the CSV file
        use_cache: Whether to use cached data if available
        
    Returns:
        A list of dictionaries with the data
    """
    cache_key = f"csv_{filename}"
    if use_cache and cache_key in _data_cache:
        logger.debug(f"Using cached data for {filename}")
        return _data_cache[cache_key]
    
    file_path = get_static_data_path(filename)
    logger.info(f"Loading CSV data from {file_path}")
    
    try:
        data = []
        with open(file_path, 'r', encoding='utf-8') as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                # Convert numeric values from strings to proper types
                for key, value in row.items():
                    try:
                        if value == '':
                            row[key] = None
                        elif '.' in value:
                            row[key] = float(value)
                        else:
                            row[key] = int(value)
                    except (ValueError, TypeError):
                        # Keep as string if conversion fails
                        pass
                data.append(row)
        
        if use_cache:
            _data_cache[cache_key] = data
        
        logger.info(f"Loaded {len(data)} rows from {filename}")
        return data
    except Exception as e:
        logger.error(f"Error loading {filename}: {str(e)}")
        return []

def load_json_data(filename: str, use_cache: bool = True) -> Any:
    """
    Load data from a JSON file.
    
    Args:
        filename: The name of the JSON file
        use_cache: Whether to use cached data if available
        
    Returns:
        The parsed JSON data
    """
    cache_key = f"json_{filename}"
    if use_cache and cache_key in _data_cache:
        logger.debug(f"Using cached data for {filename}")
        return _data_cache[cache_key]
    
    file_path = get_static_data_path(filename)
    logger.info(f"Loading JSON data from {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if use_cache:
            _data_cache[cache_key] = data
        
        return data
    except Exception as e:
        logger.error(f"Error loading {filename}: {str(e)}")
        return None

def get_regions(region_type: Optional[str] = None, parent_region_id: Optional[int] = None) -> List[Dict]:
    """
    Get region data filtered by type and/or parent region ID.
    
    Args:
        region_type: Optional filter for region type (e.g., 'state', 'county')
        parent_region_id: Optional filter for parent region ID
        
    Returns:
        List of filtered region dictionaries
    """
    regions = load_csv_data('regions.csv')
    
    # Apply filters
    if region_type:
        regions = [r for r in regions if r['type'] == region_type]
    
    if parent_region_id is not None:
        # Convert to float for comparison since CSV might have loaded it as float
        parent_id_float = float(parent_region_id)
        regions = [r for r in regions if r.get('parent_region_id') == parent_id_float]
    
    return regions

def get_region_by_id(region_id: int) -> Optional[Dict]:
    """
    Get a specific region by ID.
    
    Args:
        region_id: The region ID to find
        
    Returns:
        The region dictionary or None if not found
    """
    regions = load_csv_data('regions.csv')
    for region in regions:
        if region['region_id'] == region_id:
            return region
    return None

def get_region_vehicle_types(region_id: Optional[int] = None, year: Optional[int] = None) -> List[Dict]:
    """
    Get vehicle registration data filtered by region ID and/or year.
    
    Args:
        region_id: Optional filter for region ID
        year: Optional filter for year recorded
        
    Returns:
        List of filtered vehicle registration dictionaries
    """
    data = load_csv_data('region_vehicle_types.csv')
    
    # Apply filters
    if region_id is not None:
        data = [d for d in data if d['region_id'] == region_id]
    
    if year is not None:
        data = [d for d in data if d['year_recorded'] == year]
    
    return data

def get_latest_vehicle_data_year() -> int:
    """
    Get the most recent year available in the vehicle registration data.
    
    Returns:
        The latest year as an integer
    """
    data = load_csv_data('region_vehicle_types.csv')
    years = [d['year_recorded'] for d in data if 'year_recorded' in d]
    return max(years) if years else 2023  # Fallback to 2023 if no data

def get_failures() -> List[Dict]:
    """
    Get all failure data.
    
    Returns:
        List of failure dictionaries
    """
    return load_csv_data('failures.csv')

def get_average_failure_rate() -> float:
    """
    Calculate the average failure rate across all components.
    
    Returns:
        The average failure rate as a float
    """
    failures = load_csv_data('failures.csv')
    failure_rates = [f['failure_rate'] for f in failures if 'failure_rate' in f]
    return sum(failure_rates) / len(failure_rates) if failure_rates else 0.05  # Default to 5% if no data

def get_regional_demand() -> Dict:
    """
    Get pre-calculated regional demand data.
    
    Returns:
        GeoJSON feature collection with regional demand data
    """
    return load_json_data('regional_demand.json')

def get_demand_forecast() -> List[Dict]:
    """
    Get demand forecast data from static files.
    
    Returns:
        List of dictionaries with demand forecast data
    """
    return load_csv_data('demand_forecast.csv')

def get_demand_forecast_for_region(region_id: int) -> List[Dict]:
    """
    Get demand forecast data for a specific region.
    This is a simulated function since the actual data doesn't include region-specific demand yet.
    
    Args:
        region_id: The region ID to get data for
        
    Returns:
        List of dictionaries with region-specific demand forecast data
    """
    # Load base demand data
    demand_data = get_demand_forecast()
    
    # Get the region to use for scaling
    region = get_region_by_id(region_id)
    region_name = region.get('name', 'Unknown') if region else 'Unknown'
    
    logger.info(f"Simulating demand forecast for region: {region_name} (ID: {region_id})")
    
    # Seed random number generator with region_id for consistency
    random.seed(region_id)
    
    # Apply region-specific scaling (this is a simulation - would be replaced with actual data)
    region_factor = random.uniform(0.2, 0.5)
    
    # Apply the scaling factor to each item's expected demand
    for item in demand_data:
        if 'expected_demand' in item:
            item['expected_demand'] = int(item['expected_demand'] * region_factor)
    
    logger.info(f"Applied region adjustment factor: {region_factor:.2f}")
    return demand_data

def clear_cache():
    """
    Clear the data cache.
    """
    global _data_cache
    _data_cache = {}
    logger.info("Static data cache cleared")

def test_static_data_loading():
    """Simple test function to verify the static data loading works"""
    print("Testing static data loading...")
    
    # Test regions
    regions = get_regions(region_type='state')
    print(f"Loaded {len(regions)} states")
    if regions:
        print(f"First state: {regions[0]['name']}")
    
    # Test region vehicle types
    latest_year = get_latest_vehicle_data_year()
    print(f"Latest vehicle data year: {latest_year}")
    
    # Test failures
    avg_rate = get_average_failure_rate()
    print(f"Average failure rate: {avg_rate:.2%}")
    
    # Test regional demand
    demand = get_regional_demand()
    if demand:
        print(f"Regional demand has {len(demand.get('features', []))} regions")
    else:
        print("No regional demand data available")
    
    print("Static data loading test complete")

if __name__ == "__main__":
    # Configure logging to console
    logging.basicConfig(level=logging.INFO, 
                        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Run test
    test_static_data_loading() 