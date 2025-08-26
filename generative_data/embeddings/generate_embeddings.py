#!/usr/bin/env python3
"""
Embedding Generation Script for Automotive Parts Prediction & Inventory Optimization

This script generates embeddings for entity descriptions using OpenAI's API
and stores them in the Supabase database for semantic search capabilities.
"""

import os
import time
import pandas as pd
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
from utils.database import connect_to_supabase

# Load environment variables
load_dotenv()

# Get OpenAI API key and ensure it's properly formatted
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Remove any whitespace or quotes that might have been added
api_key = api_key.strip().strip('"\'')

print(f"Using OpenAI API Key: {api_key[:7]}...{api_key[-5:]}")

# Initialize OpenAI client with the cleaned API key
client = OpenAI(api_key=api_key)

# Embedding model to use
EMBEDDING_MODEL = "text-embedding-3-small"


def get_embedding(text, model=EMBEDDING_MODEL):
    """Get embedding for a text using OpenAI's API."""
    try:
        # Replace newlines with spaces
        text = text.replace("\n", " ")
        
        response = client.embeddings.create(
            input=[text],
            model=model
        )
        
        # Return the embedding vector
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return None


def batch_get_embeddings(texts, model=EMBEDDING_MODEL, batch_size=100, retry_limit=3):
    """Get embeddings for a batch of texts with rate limiting and retries."""
    all_embeddings = []
    
    # Process in batches to avoid rate limits
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        retry_count = 0
        
        while retry_count < retry_limit:
            try:
                # Replace newlines with spaces
                cleaned_batch = [text.replace("\n", " ") for text in batch]
                
                response = client.embeddings.create(
                    input=cleaned_batch,
                    model=model
                )
                
                # Extract embeddings from response
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # Add a small delay to avoid rate limits
                if i + batch_size < len(texts):
                    time.sleep(0.5)
                
                break  # Success, exit retry loop
                
            except Exception as e:
                retry_count += 1
                print(f"Error in batch {i//batch_size + 1}, retry {retry_count}: {str(e)}")
                
                if retry_count >= retry_limit:
                    print(f"Failed to get embeddings for batch {i//batch_size + 1} after {retry_limit} retries")
                    # Add None values for this batch
                    all_embeddings.extend([None] * len(batch))
                else:
                    # Exponential backoff
                    time.sleep(2 ** retry_count)
    
    return all_embeddings


def process_vehicle_type_embeddings(supabase):
    """Process and store embeddings for vehicle types."""
    print("\nProcessing vehicle type embeddings...")
    
    # Load descriptions from CSV
    df = pd.read_csv('data/descriptions/vehicle_type_descriptions.csv')
    
    if df.empty:
        print("No vehicle type descriptions found")
        return 0
    
    # Get embeddings for all descriptions
    print(f"Generating embeddings for {len(df)} vehicle type descriptions...")
    embeddings = batch_get_embeddings(df['description'].tolist())
    
    # Add embeddings to dataframe
    df['embedding'] = embeddings
    
    # Filter out any rows with None embeddings
    df = df.dropna(subset=['embedding'])
    
    # Upload embeddings to Supabase
    print(f"Uploading {len(df)} vehicle type embeddings to Supabase...")
    
    try:
        # Prepare data for upload
        upload_data = []
        for _, row in df.iterrows():
            upload_data.append({
                'type_id': row['type_id'],
                'description': row['description'],
                'embedding': row['embedding'],
                'embedding_model': EMBEDDING_MODEL
            })
        
        # Upload in batches to avoid payload size issues
        batch_size = 50
        for i in range(0, len(upload_data), batch_size):
            batch = upload_data[i:i+batch_size]
            response = supabase.table('vehicle_type_embeddings').upsert(batch).execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error uploading batch {i//batch_size + 1}: {response.error}")
            
            # Add a small delay between batches
            if i + batch_size < len(upload_data):
                time.sleep(0.5)
        
        print(f"Successfully uploaded {len(df)} vehicle type embeddings")
        return len(df)
    
    except Exception as e:
        print(f"Error uploading vehicle type embeddings: {str(e)}")
        return 0


def process_component_embeddings(supabase):
    """Process and store embeddings for components."""
    print("\nProcessing component embeddings...")
    
    # Load descriptions from CSV
    df = pd.read_csv('data/descriptions/component_descriptions.csv')
    
    if df.empty:
        print("No component descriptions found")
        return 0
    
    # Get embeddings for all descriptions
    print(f"Generating embeddings for {len(df)} component descriptions...")
    embeddings = batch_get_embeddings(df['description'].tolist())
    
    # Add embeddings to dataframe
    df['embedding'] = embeddings
    
    # Filter out any rows with None embeddings
    df = df.dropna(subset=['embedding'])
    
    # Upload embeddings to Supabase
    print(f"Uploading {len(df)} component embeddings to Supabase...")
    
    try:
        # Prepare data for upload
        upload_data = []
        for _, row in df.iterrows():
            upload_data.append({
                'component_id': row['component_id'],
                'description': row['description'],
                'embedding': row['embedding'],
                'embedding_model': EMBEDDING_MODEL
            })
        
        # Upload in batches
        batch_size = 50
        for i in range(0, len(upload_data), batch_size):
            batch = upload_data[i:i+batch_size]
            response = supabase.table('component_embeddings').upsert(batch).execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error uploading batch {i//batch_size + 1}: {response.error}")
            
            # Add a small delay between batches
            if i + batch_size < len(upload_data):
                time.sleep(0.5)
        
        print(f"Successfully uploaded {len(df)} component embeddings")
        return len(df)
    
    except Exception as e:
        print(f"Error uploading component embeddings: {str(e)}")
        return 0


def process_part_embeddings(supabase):
    """Process and store embeddings for parts."""
    print("\nProcessing part embeddings...")
    
    # Load descriptions from CSV
    df = pd.read_csv('data/descriptions/part_descriptions.csv')
    
    if df.empty:
        print("No part descriptions found")
        return 0
    
    # Get embeddings for all descriptions
    print(f"Generating embeddings for {len(df)} part descriptions...")
    embeddings = batch_get_embeddings(df['description'].tolist())
    
    # Add embeddings to dataframe
    df['embedding'] = embeddings
    
    # Filter out any rows with None embeddings
    df = df.dropna(subset=['embedding'])
    
    # Upload embeddings to Supabase
    print(f"Uploading {len(df)} part embeddings to Supabase...")
    
    try:
        # Prepare data for upload - note: part_embeddings table might have different schema
        upload_data = []
        for _, row in df.iterrows():
            upload_data.append({
                'part_id': row['part_id'],
                'embedding': row['embedding']
                # No description or embedding_model columns in this table based on schema
            })
        
        # Upload in batches
        batch_size = 50
        for i in range(0, len(upload_data), batch_size):
            batch = upload_data[i:i+batch_size]
            response = supabase.table('part_embeddings').upsert(batch).execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error uploading batch {i//batch_size + 1}: {response.error}")
            
            # Add a small delay between batches
            if i + batch_size < len(upload_data):
                time.sleep(0.5)
        
        print(f"Successfully uploaded {len(df)} part embeddings")
        return len(df)
    
    except Exception as e:
        print(f"Error uploading part embeddings: {str(e)}")
        return 0


def process_vehicle_embeddings(supabase):
    """Process and store embeddings for vehicles."""
    print("\nProcessing vehicle embeddings...")
    
    # Load descriptions from CSV
    df = pd.read_csv('data/descriptions/vehicle_descriptions.csv')
    
    if df.empty:
        print("No vehicle descriptions found")
        return 0
    
    # Get embeddings for all descriptions
    print(f"Generating embeddings for {len(df)} vehicle descriptions...")
    embeddings = batch_get_embeddings(df['description'].tolist())
    
    # Add embeddings to dataframe
    df['embedding'] = embeddings
    
    # Filter out any rows with None embeddings
    df = df.dropna(subset=['embedding'])
    
    # Upload embeddings to Supabase
    print(f"Uploading {len(df)} vehicle embeddings to Supabase...")
    
    try:
        # Prepare data for upload
        upload_data = []
        for _, row in df.iterrows():
            upload_data.append({
                'vehicle_id': row['vehicle_id'],
                'description': row['description'],
                'embedding': row['embedding'],
                'embedding_model': EMBEDDING_MODEL
            })
        
        # Upload in batches
        batch_size = 50
        for i in range(0, len(upload_data), batch_size):
            batch = upload_data[i:i+batch_size]
            response = supabase.table('vehicle_embeddings').upsert(batch).execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error uploading batch {i//batch_size + 1}: {response.error}")
            
            # Add a small delay between batches
            if i + batch_size < len(upload_data):
                time.sleep(0.5)
        
        print(f"Successfully uploaded {len(df)} vehicle embeddings")
        return len(df)
    
    except Exception as e:
        print(f"Error uploading vehicle embeddings: {str(e)}")
        return 0


def process_failure_embeddings(supabase):
    """Process and store embeddings for failure descriptions."""
    print("\nProcessing failure description embeddings...")
    
    # Load descriptions from CSV
    df = pd.read_csv('data/descriptions/failure_descriptions.csv')
    
    if df.empty:
        print("No failure descriptions found")
        return 0
    
    # Get embeddings for all descriptions
    print(f"Generating embeddings for {len(df)} failure descriptions...")
    embeddings = batch_get_embeddings(df['symptom_description'].tolist())
    
    # Add embeddings to dataframe
    df['embedding'] = embeddings
    
    # Filter out any rows with None embeddings
    df = df.dropna(subset=['embedding'])
    
    # Upload embeddings to Supabase
    print(f"Uploading {len(df)} failure description embeddings to Supabase...")
    
    try:
        # Prepare data for upload
        upload_data = []
        for _, row in df.iterrows():
            upload_data.append({
                'component_id': row['component_id'],
                'symptom_description': row['symptom_description'],
                'embedding': row['embedding'],
                'embedding_model': EMBEDDING_MODEL
            })
        
        # Upload in batches
        batch_size = 50
        for i in range(0, len(upload_data), batch_size):
            batch = upload_data[i:i+batch_size]
            response = supabase.table('failure_description_embeddings').upsert(batch).execute()
            
            if hasattr(response, 'error') and response.error:
                print(f"Error uploading batch {i//batch_size + 1}: {response.error}")
            
            # Add a small delay between batches
            if i + batch_size < len(upload_data):
                time.sleep(0.5)
        
        print(f"Successfully uploaded {len(df)} failure description embeddings")
        return len(df)
    
    except Exception as e:
        print(f"Error uploading failure description embeddings: {str(e)}")
        return 0


def check_embedding_tables(supabase):
    """Check if embedding tables exist and have the vector extension."""
    print("\nChecking embedding tables...")
    
    # Check if the vector extension is installed
    try:
        # Check if tables exist
        tables_response = supabase.table('vehicle_type_embeddings').select('id').limit(1).execute()
        
        if hasattr(tables_response, 'error') and tables_response.error:
            print(f"Error checking vehicle_type_embeddings table: {tables_response.error}")
            print("Tables may not exist or may not have the correct structure.")
            return False
        
        print("Embedding tables exist and are accessible.")
        return True
    
    except Exception as e:
        print(f"Error checking embedding tables: {str(e)}")
        print("Please ensure the embedding tables are created with the vector extension.")
        return False


def main():
    """Main function to generate and store embeddings."""
    
    print("======== Automotive Embedding Generation ========")
    print("Connecting to Supabase...")
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        print("Connection successful!")
        
        # Check if embedding tables exist
        if not check_embedding_tables(supabase):
            print("\nEmbedding tables need to be created first.")
            print("Please run the SQL commands in create_embedding_tables.sql in your Supabase SQL editor.")
            print("Then run this script again.")
            return 1
        
        # Process embeddings for each entity type
        vt_count = process_vehicle_type_embeddings(supabase)
        comp_count = process_component_embeddings(supabase)
        part_count = process_part_embeddings(supabase)
        vehicle_count = process_vehicle_embeddings(supabase)
        failure_count = process_failure_embeddings(supabase)
        
        # Summary
        print("\n======== Embedding Generation Summary ========")
        print(f"Vehicle Type Embeddings: {vt_count}")
        print(f"Component Embeddings: {comp_count}")
        print(f"Part Embeddings: {part_count}")
        print(f"Vehicle Embeddings: {vehicle_count}")
        print(f"Failure Description Embeddings: {failure_count}")
        print(f"Total Embeddings: {vt_count + comp_count + part_count + vehicle_count + failure_count}")
        
        print("\nEmbedding generation and storage complete!")
        print("You can now use these embeddings for semantic search and similarity matching.")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 