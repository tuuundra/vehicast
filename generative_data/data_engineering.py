#!/usr/bin/env python3
"""
Data Engineering Script for Automotive Parts Prediction & Inventory Optimization

This script uploads the generated CSV data to Supabase for further analysis and model training.
It implements Step 2 of the project plan: Data Engineering with Supabase.
"""

import argparse
import os
import pandas as pd
from utils.database import connect_to_supabase, create_tables, load_data_from_csv, upload_data_to_supabase, sample_query


def main():
    """Main function to upload data to Supabase."""
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Upload automotive data to Supabase')
    parser.add_argument('--data_dir', type=str, default='data', 
                        help='Directory containing the CSV data files')
    parser.add_argument('--skip_confirm', action='store_true',
                        help='Skip confirmation before uploading data')
    parser.add_argument('--test_mode', action='store_true',
                        help='Run in test mode - only load data, skip Supabase connection')
    args = parser.parse_args()

    # Display header
    print("======== Automotive Data Engineering ========")
    print(f"Reading data from: {args.data_dir}")
    if not args.test_mode:
        print("Target: Supabase database")
    else:
        print("Mode: Test (Data loading only)")
    print("===========================================")

    try:
        # Load data from CSV files
        print("\nLoading data from CSV files...")
        data_dict = load_data_from_csv(args.data_dir)
        
        # Summarize data to be uploaded
        total_records = sum(len(df) for df in data_dict.values())
        print(f"\nTotal records: {total_records}")
        for table_name, df in data_dict.items():
            print(f"  - {table_name}: {len(df)} records")
            # Print sample data (first 3 rows)
            if not df.empty:
                print("    Sample data:")
                sample = df.head(3).to_string(index=False)
                for line in sample.split('\n'):
                    print(f"      {line}")
        
        # Stop here if in test mode
        if args.test_mode:
            print("\nTest mode: Data loaded successfully!")
            print("To upload to Supabase:")
            print("1. Create a Supabase account and project")
            print("2. Update your .env file with real credentials")
            print("3. Run this script without the --test_mode flag")
            return 0
            
        # Connect to Supabase
        print("\nConnecting to Supabase...")
        supabase = connect_to_supabase()
        print("Connection successful!")
        
        # Print table creation instructions
        print("\nTable Creation Instructions:")
        create_tables(supabase)
        
        # Confirm upload if not skipped
        proceed = True
        if not args.skip_confirm:
            confirmation = input("\nReady to upload data to Supabase. Proceed? (y/n): ")
            proceed = confirmation.lower() == 'y'
        
        # Upload data if confirmed
        if proceed:
            print("\nUploading data to Supabase...")
            upload_data_to_supabase(supabase, data_dict)
            print("\nData upload completed!")
            
            # Run sample queries
            print("\nRunning sample queries...")
            sample_query(supabase)
        else:
            print("\nUpload canceled.")
            
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("\nPlease check your Supabase credentials in the .env file and ensure you have internet connectivity.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 