#!/usr/bin/env python3
"""
Part Price Embedding Generation Script for Automotive Algorithm Project

This script generates embeddings for part prices using OpenAI's API
and stores them in the Supabase database for semantic search capabilities.
"""

import os
import sys
import time
import pandas as pd
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv

# Add the project root directory to Python path to import utils
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
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


def process_part_price_embeddings(supabase):
    """Process and store embeddings for part prices."""
    print("Processing embeddings for part prices...")
    
    # First, we need to get the descriptions to embed
    try:
        # Try using the run_query function first
        query = """
        SELECT 
            pp.price_id,
            p.part_id,
            p.part_name,
            p.part_number,
            c.component_name,
            pp.base_price,
            pp.wholesale_price,
            pp.retail_price,
            pp.manufacturer_suggested_price,
            pp.currency
        FROM 
            part_prices pp
            JOIN parts p ON pp.part_id = p.part_id
            JOIN components c ON p.component_id = c.component_id
        WHERE 
            pp.is_current = TRUE
        """
        
        try:
            # Try with run_query function
            response = supabase.rpc('run_query', {'query': query}).execute()
            part_prices = response.data
        except Exception as e:
            print(f"Error using run_query function: {str(e)}")
            print("Falling back to direct query approach...")
            
            # Fallback: Get data from each table separately and join in Python
            pp_response = supabase.table('part_prices').select('*').eq('is_current', True).execute()
            parts_response = supabase.table('parts').select('*').execute()
            components_response = supabase.table('components').select('*').execute()
            
            # Convert to dictionaries for faster lookup
            parts_dict = {p['part_id']: p for p in parts_response.data}
            components_dict = {c['component_id']: c for c in components_response.data}
            
            # Join the data manually
            part_prices = []
            for pp in pp_response.data:
                part = parts_dict.get(pp['part_id'])
                if part:
                    component = components_dict.get(part['component_id'])
                    if component:
                        # Combine data into a single record
                        record = {
                            'price_id': pp['price_id'],
                            'part_id': pp['part_id'],
                            'part_name': part['part_name'],
                            'part_number': part['part_number'],
                            'component_name': component['component_name'],
                            'base_price': pp['base_price'],
                            'wholesale_price': pp['wholesale_price'],
                            'retail_price': pp['retail_price'],
                            'manufacturer_suggested_price': pp['manufacturer_suggested_price'],
                            'currency': pp['currency']
                        }
                        part_prices.append(record)
        
        if not part_prices:
            print("No part prices found in the database")
            return 0
        
        # Generate descriptions for embedding
        descriptions = []
        price_ids = []
        
        for pp in part_prices:
            # Create a rich description that includes pricing information
            description = f"Part: {pp['part_name']} (Part Number: {pp['part_number']}). "
            description += f"Component type: {pp['component_name']}. "
            description += f"Base price: ${pp['base_price']:.2f}. "
            description += f"Wholesale price: ${pp['wholesale_price']:.2f}. "
            description += f"Retail price: ${pp['retail_price']:.2f}. "
            description += f"MSRP: ${pp['manufacturer_suggested_price']:.2f}. "
            description += f"Currency: {pp['currency']}."
            
            descriptions.append(description)
            price_ids.append(pp['price_id'])
        
        print(f"Generated {len(descriptions)} descriptions for part prices")
        
        # Get embeddings for the descriptions
        print(f"Generating embeddings for {len(descriptions)} part price descriptions...")
        embeddings = batch_get_embeddings(descriptions)
        
        # Prepare data for insertion
        embedding_data = []
        for i, (price_id, description, embedding) in enumerate(zip(price_ids, descriptions, embeddings)):
            if embedding:
                embedding_data.append({
                    "price_id": price_id,
                    "embedding_model": EMBEDDING_MODEL,
                    "embedding": embedding,
                    "description": description
                })
            else:
                print(f"Skipping part price {price_id} due to missing embedding")
        
        # Insert embeddings in batches to avoid timeout
        batch_size = 50
        for i in range(0, len(embedding_data), batch_size):
            batch = embedding_data[i:i+batch_size]
            try:
                # Check for existing embeddings and delete them first
                price_ids_batch = [item["price_id"] for item in batch]
                supabase.table('part_price_embeddings').delete().in_('price_id', price_ids_batch).execute()
                
                # Insert new embeddings
                supabase.table('part_price_embeddings').insert(batch).execute()
                print(f"Inserted batch {i//batch_size + 1}/{(len(embedding_data)-1)//batch_size + 1}")
            except Exception as e:
                print(f"Error inserting batch {i//batch_size + 1}: {str(e)}")
        
        print(f"Inserted {len(embedding_data)} part price embeddings")
        return len(embedding_data)
        
    except Exception as e:
        print(f"Error in process_part_price_embeddings: {str(e)}")
        return 0


def check_embedding_tables(supabase):
    """Check if part_price_embeddings table exists."""
    print("\nChecking part_price_embeddings table...")
    
    try:
        # Check if table exists
        table_response = supabase.table('part_price_embeddings').select('id').limit(1).execute()
        
        if hasattr(table_response, 'error') and table_response.error:
            print(f"Error checking part_price_embeddings table: {table_response.error}")
            print("Table may not exist or may not have the correct structure.")
            return False
        
        print("Part price embeddings table exists and is accessible.")
        return True
    
    except Exception as e:
        print(f"Error checking part_price_embeddings table: {str(e)}")
        print("Please ensure the part_price_embeddings table is created with the vector extension.")
        return False


def main():
    """Main function to generate and store part price embeddings."""
    
    print("======== Automotive Part Price Embedding Generation ========")
    print("Connecting to Supabase...")
    
    try:
        # Connect to Supabase
        supabase = connect_to_supabase()
        print("Connection successful!")
        
        # Check if embedding table exists
        if not check_embedding_tables(supabase):
            print("\nPart price embeddings table needs to be created first.")
            print("Please run the SQL commands in create_part_prices.sql in your Supabase SQL editor.")
            print("Then run this script again.")
            return 1
        
        # Process embeddings for part prices
        count = process_part_price_embeddings(supabase)
        
        # Summary
        print("\n======== Embedding Generation Summary ========")
        print(f"Part Price Embeddings: {count}")
        
        print("\nPart price embedding generation and storage complete!")
        print("You can now use these embeddings for semantic search and similarity matching.")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 