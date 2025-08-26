#!/usr/bin/env python3
"""
Script to execute SQL statements directly in Supabase
"""

import os
import sys
import argparse
from utils.database import connect_to_supabase

def read_sql_file(file_path):
    """Read SQL file and return its contents."""
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading SQL file: {str(e)}")
        return None

def execute_sql_directly(supabase, sql):
    """Execute SQL statements directly in Supabase."""
    try:
        # Split SQL into individual statements
        statements = sql.split(';')
        
        # Execute each statement
        for statement in statements:
            # Skip empty statements
            if statement.strip():
                print(f"Executing SQL statement: {statement[:100]}...")
                
                # Execute the SQL statement directly
                response = supabase.postgrest.rpc('run_query', {'query': statement}).execute()
                
                if hasattr(response, 'error') and response.error:
                    print(f"Error executing SQL: {response.error}")
                else:
                    print("SQL statement executed successfully")
        
        return True
    except Exception as e:
        print(f"Error executing SQL: {str(e)}")
        return False

def main():
    """Main function to execute SQL files."""
    parser = argparse.ArgumentParser(description='Execute SQL files in Supabase')
    parser.add_argument('file', type=str, help='Path to SQL file')
    
    args = parser.parse_args()
    
    # Check if file exists
    if not os.path.exists(args.file):
        print(f"Error: File {args.file} does not exist")
        return 1
    
    # Read SQL file
    sql = read_sql_file(args.file)
    if not sql:
        return 1
    
    # Connect to Supabase
    print("Connecting to Supabase...")
    try:
        supabase = connect_to_supabase()
        print("Connection successful!")
    except Exception as e:
        print(f"Error connecting to Supabase: {str(e)}")
        return 1
    
    # Execute SQL
    print(f"Executing SQL file: {args.file}")
    if execute_sql_directly(supabase, sql):
        print("SQL file executed successfully")
        return 0
    else:
        print("Error executing SQL file")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 