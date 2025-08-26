#!/usr/bin/env python3
"""
Database utilities for connecting to Supabase and managing data.
"""

import os
import pandas as pd
from typing import Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client


def connect_to_supabase() -> Client:
    """
    Connect to Supabase using environment variables.
    
    Returns:
        Supabase client
    """
    # Load environment variables if not already loaded
    load_dotenv(override=True)
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not found in environment variables. "
                         "Please set SUPABASE_URL and SUPABASE_KEY.")
    
    # Create Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    return supabase


def get_supabase_client() -> Client:
    """
    Get a Supabase client instance (singleton pattern).
    This function is used to ensure we're reusing the same client instance
    across the application to avoid connection overhead.
    
    Returns:
        Supabase client
    """
    # Use a global variable to store the client instance
    global _supabase_client
    
    # If the client doesn't exist yet, create it
    if '_supabase_client' not in globals() or _supabase_client is None:
        _supabase_client = connect_to_supabase()
    
    return _supabase_client


def execute_query(supabase: Client, query: str, params: dict = None) -> dict:
    """
    Execute a SQL query on Supabase using the rpc function.
    
    Args:
        supabase: Supabase client
        query: SQL query to execute
        params: Parameters for the query
        
    Returns:
        Query results
    """
    # Supabase-py doesn't provide direct SQL execution via the client
    # We need to create a stored procedure in Supabase and call it via rpc
    
    if params is None:
        params = {}
    
    try:
        # Call the execute_sql stored procedure
        response = supabase.rpc('execute_sql', {'sql_query': query, 'params': params}).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error executing query: {response.error}")
            return {'error': response.error, 'data': None}
        
        return {'error': None, 'data': response.data}
    
    except Exception as e:
        print(f"Error executing query: {str(e)}")
        return {'error': str(e), 'data': None}


def create_tables(supabase: Client) -> None:
    """
    Display instructions for creating tables in Supabase database.
    
    Args:
        supabase: Supabase client
    """
    # Note: Supabase-py doesn't provide direct SQL execution via the client
    # Users need to execute the SQL statements through the Supabase dashboard
    
    print("To create the necessary tables in your Supabase database:")
    print("1. Open your Supabase project dashboard")
    print("2. Navigate to the SQL Editor")
    print("3. Load and execute the SQL statements from the supabase_schema.sql file")
    print("   - This file contains all table definitions for the project")
    print("4. Once tables are created, you can proceed with data upload")


def upload_data_to_supabase(supabase: Client, data_dict: Dict[str, pd.DataFrame]) -> None:
    """
    Upload data to Supabase tables.
    
    Args:
        supabase: Supabase client
        data_dict: Dictionary of DataFrames to upload
    """
    # Convert DataFrames to lists of dictionaries for Supabase
    for table_name, df in data_dict.items():
        data_list = df.to_dict(orient='records')
        
        print(f"Uploading {len(data_list)} records to {table_name} table...")
        
        # Insert data using upsert to handle duplicates
        response = supabase.table(table_name).upsert(data_list).execute()
        
        # Check for errors
        if hasattr(response, 'error') and response.error:
            print(f"Error uploading to {table_name}: {response.error}")
        else:
            print(f"Successfully uploaded data to {table_name}")


def load_data_from_csv(data_dir: str = 'data') -> Dict[str, pd.DataFrame]:
    """
    Load data from CSV files.
    
    Args:
        data_dir: Directory containing CSV files
        
    Returns:
        Dictionary of DataFrames
    """
    data_dict = {}
    expected_files = ['vehicle_types.csv', 'vehicles.csv', 'components.csv', 'parts.csv', 'failures.csv']
    
    for file_name in expected_files:
        file_path = os.path.join(data_dir, file_name)
        if os.path.exists(file_path):
            # Extract table name from file name
            table_name = os.path.splitext(file_name)[0]
            data_dict[table_name] = pd.read_csv(file_path)
            print(f"Loaded {table_name} data: {len(data_dict[table_name])} records")
        else:
            print(f"Warning: File not found: {file_path}")
    
    return data_dict


def sample_query(supabase: Client) -> None:
    """
    Run sample queries to demonstrate Supabase functionality.
    
    Args:
        supabase: Supabase client
    """
    # Example query for shops: Get parts for a specific vehicle type and component
    print("\nSample Query for Shops:")
    print("Parts for Ford F-150 brakes:")
    
    # First query to get the type_id
    type_query = supabase.table('vehicle_types').select('type_id').eq('make', 'Ford').eq('model', 'F-150').execute()
    
    if hasattr(type_query, 'data') and type_query.data:
        type_id = type_query.data[0]['type_id']
        
        # Then query to get the component_id
        comp_query = supabase.table('components').select('component_id').eq('component_name', 'brakes').execute()
        
        if hasattr(comp_query, 'data') and comp_query.data:
            component_id = comp_query.data[0]['component_id']
            
            # Finally query to get the parts
            parts_query = supabase.table('parts').select('part_name, part_number').eq('type_id', type_id).eq('component_id', component_id).execute()
            
            if hasattr(parts_query, 'data') and parts_query.data:
                for part in parts_query.data:
                    print(f"  - {part['part_name']} (Part #: {part['part_number']})")
            else:
                print("  No parts found for this combination")
    
    # Example query for distributors: Count vehicles by part
    print("\nSample Query for Distributors:")
    print("Vehicle counts by part (top 5):")
    
    # This is a complex query in PostgreSQL:
    # SELECT p.part_name, COUNT(v.vehicle_id)
    # FROM parts p
    # JOIN vehicle_types vt ON p.type_id = vt.type_id
    # JOIN vehicles v ON v.type_id = vt.type_id
    # GROUP BY p.part_name
    # LIMIT 5;
    
    # For Supabase REST API, we'd need to break this down or use a stored procedure
    # For demonstration, we'll just show the concept
    print("  (Query would retrieve vehicle counts per part)")
    print("  Note: Complex join queries are better performed with direct SQL or server-side functions")


if __name__ == "__main__":
    # When script is run directly, load data and upload to Supabase
    supabase = connect_to_supabase()
    data_dict = load_data_from_csv()
    
    # Prompt user before uploading
    print("\nReady to upload data to Supabase.")
    confirmation = input("Do you want to proceed? (y/n): ")
    
    if confirmation.lower() == 'y':
        upload_data_to_supabase(supabase, data_dict)
        sample_query(supabase)
    else:
        print("Upload canceled.") 