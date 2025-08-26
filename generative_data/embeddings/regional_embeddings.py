#!/usr/bin/env python3
"""
Generate embeddings for regions data
"""

import os
import numpy as np
import json
from dotenv import load_dotenv
import openai
from supabase import create_client

# Load environment variables
load_dotenv()

# OpenAI settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_ENCODING = "cl100k_base"
EMBEDDING_DIMENSIONS = 1536  # Dimensions for text-embedding-3-small

# Initialize OpenAI client
openai.api_key = OPENAI_API_KEY

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_region_description(region, region_vehicles_data=None, regions_by_id=None):
    """Generate a rich description for a region based on its characteristics"""
    region_type = region['type']
    name = region['name']
    population = region['population']
    
    # Calculate total registrations and most recent year
    total_registrations = 0
    recent_total = 0
    top_vehicles = []
    
    if region_vehicles_data:
        registrations = [rv for rv in region_vehicles_data if rv['region_id'] == region['region_id']]
        total_registrations = sum(r['total_registrations'] for r in registrations)
        recent_registrations = [r for r in registrations if r['year'] >= 2021]
        recent_total = sum(r['total_registrations'] for r in recent_registrations) if recent_registrations else 0
        
        # Get top vehicle makes
        make_counts = {}
        for r in registrations:
            make = r['make']
            if make in make_counts:
                make_counts[make] += r['total_registrations']
            else:
                make_counts[make] = r['total_registrations']
        
        top_makes = sorted(make_counts.items(), key=lambda x: x[1], reverse=True)[:5] if make_counts else []
        
    # Generate description based on region type, population, and vehicle data
    if region_type == 'state':
        description = f"{name} is a state with a population of {population:,} people. "
        
        # Add geographic context based on name
        if name == "California":
            description += "Located on the west coast, it has diverse geography including coastal areas, mountains, and deserts. "
        elif name == "Texas":
            description += "Located in the southern United States, it features diverse landscapes from plains to hill country and coastal regions. "
        elif name == "New York":
            description += "Located in the northeastern United States with diverse geography including mountains, lakes, and coastal areas. "
        elif name == "Florida":
            description += "Located in the southeastern United States with extensive coastline and subtropical climate. "
        elif name == "Virginia":
            description += "Located on the east coast with diverse geography from coastal plains to mountains. "
            
        # Add vehicle registration details
        if total_registrations > 0:
            vehicles_per_capita = total_registrations / population
            description += f"The state has approximately {total_registrations:,} registered vehicles, or about {vehicles_per_capita:.2f} vehicles per person. "
            
            if top_makes:
                top_makes_str = ", ".join([f"{make}" for make, _ in top_makes[:3]])
                description += f"The most popular vehicle manufacturers are {top_makes_str}. "
                
            if recent_total > 0 and len(registrations) > 0:
                growth_rate = (recent_total / total_registrations) - (len(recent_registrations) / len(registrations))
                if growth_rate > 0.05:
                    description += "Vehicle registrations have been growing rapidly in recent years. "
                elif growth_rate > 0:
                    description += "Vehicle registrations have been steadily increasing. "
                else:
                    description += "Vehicle registration growth has been flat or declining slightly. "
                
    else:  # County
        # Get parent state information
        parent_state = "Unknown"
        if region['parent_region_id'] is not None and regions_by_id is not None:
            parent_state = regions_by_id.get(region['parent_region_id'], "Unknown")
                
        if parent_state == "Unknown":
            # Try to get it directly
            try:
                parent_response = supabase.table('regions').select('name').eq('region_id', region['parent_region_id']).execute()
                if parent_response.data:
                    parent_state = parent_response.data[0]['name']
            except:
                pass
        
        description = f"{name} is a county in {parent_state} with a population of {population:,} people. "
        
        # Add vehicle registration details
        if total_registrations > 0:
            vehicles_per_capita = total_registrations / population
            description += f"The county has approximately {total_registrations:,} registered vehicles, or about {vehicles_per_capita:.2f} vehicles per person. "
            
            if top_makes:
                description += f"Popular vehicle makes in the area include {', '.join([make for make, _ in top_makes[:3]])}. "
                
            # Add some local flavor based on vehicle preferences
            luxury_makes = ['BMW', 'Mercedes', 'Audi', 'Lexus']
            truck_makes = ['Ford', 'Chevrolet', 'GMC', 'Ram']
            
            luxury_count = sum(count for make, count in make_counts.items() if make in luxury_makes) if make_counts else 0
            truck_count = sum(count for make, count in make_counts.items() if make in truck_makes) if make_counts else 0
            
            if luxury_count > truck_count and luxury_count > total_registrations * 0.2:
                description += "The area has a high concentration of luxury vehicles. "
            elif truck_count > luxury_count and truck_count > total_registrations * 0.2:
                description += "The area has a higher than average number of trucks and utility vehicles. "
    
    return description

def get_embedding(text, model=EMBEDDING_MODEL):
    """Get embedding for a single text using OpenAI's embedding model"""
    try:
        response = openai.embeddings.create(input=[text], model=model)
        return response.data[0].embedding
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def batch_get_embeddings(texts, model=EMBEDDING_MODEL, batch_size=100, retry_limit=3):
    """
    Get embeddings for a batch of texts, with retry logic
    """
    all_embeddings = []
    
    # Process in batches to avoid API limits
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i+batch_size]
        
        # Retry logic
        retries = 0
        while retries < retry_limit:
            try:
                response = openai.embeddings.create(
                    input=batch_texts,
                    model=model
                )
                batch_embeddings = [embedding.embedding for embedding in response.data]
                all_embeddings.extend(batch_embeddings)
                print(f"Processed batch {i//batch_size + 1}/{(len(texts) + batch_size - 1)//batch_size}")
                break
            except Exception as e:
                retries += 1
                print(f"Error in batch {i//batch_size + 1}, retry {retries}/{retry_limit}: {e}")
                if retries == retry_limit:
                    # If all retries failed, use zero embeddings as placeholder
                    print(f"Using zero embeddings for batch {i//batch_size + 1} after all retries failed")
                    zero_embeddings = [[0.0] * EMBEDDING_DIMENSIONS for _ in range(len(batch_texts))]
                    all_embeddings.extend(zero_embeddings)
    
    return all_embeddings

def get_aggregated_vehicle_data(supabase):
    """
    Fetch aggregated vehicle registration data for all regions
    """
    try:
        # First get all region data (with names)
        regions_response = supabase.table('regions').select('region_id, name').execute()
        regions_by_id = {r['region_id']: r['name'] for r in regions_response.data}
        
        # Then get vehicle data
        response = supabase.table('region_vehicle_types').select('region_id, registration_count, year_recorded, vehicle_types(make, model)').execute()
        
        # Process the response
        aggregated_data = []
        for item in response.data:
            if 'vehicle_types' not in item or item['vehicle_types'] is None:
                continue
                
            aggregated_data.append({
                'region_id': item['region_id'],
                'region_name': regions_by_id.get(item['region_id'], "Unknown"),
                'make': item['vehicle_types']['make'],
                'model': item['vehicle_types']['model'],
                'year': item['year_recorded'],
                'total_registrations': item['registration_count']
            })
        
        return aggregated_data, regions_by_id
    except Exception as e:
        print(f"Error fetching vehicle data: {e}")
        return [], {}

def process_region_embeddings(supabase):
    """Process regions and generate embeddings"""
    print("Processing region embeddings...")
    
    # Fetch all regions
    response = supabase.table('regions').select('*').execute()
    regions = response.data
    
    if not regions:
        print("No regions found!")
        return
    
    # Fetch aggregated vehicle data
    vehicle_data, regions_by_id = get_aggregated_vehicle_data(supabase)
    
    # Generate descriptions for all regions
    print("Generating region descriptions...")
    descriptions = []
    region_ids = []
    
    for region in regions:
        description = generate_region_description(region, vehicle_data, regions_by_id)
        descriptions.append(description)
        region_ids.append(region['region_id'])
        print(f"Generated description for {region['name']} ({region['type']})")
    
    # Generate embeddings in batches
    print("Generating embeddings...")
    embeddings = batch_get_embeddings(descriptions)
    
    # Prepare data for insertion
    print("Preparing data for insertion...")
    insert_data = []
    for i, (region_id, description, embedding) in enumerate(zip(region_ids, descriptions, embeddings)):
        insert_data.append({
            'region_id': region_id,
            'embedding_model': EMBEDDING_MODEL,
            'embedding': embedding,
            'description': description
        })
    
    # Insert in batches to avoid API limits
    batch_size = 50
    for i in range(0, len(insert_data), batch_size):
        batch = insert_data[i:i+batch_size]
        try:
            supabase.table('region_embeddings').insert(batch).execute()
            print(f"Inserted batch {i//batch_size + 1}/{(len(insert_data) + batch_size - 1)//batch_size}")
        except Exception as e:
            print(f"Error inserting batch {i//batch_size + 1}: {e}")
    
    print(f"Completed processing {len(regions)} region embeddings")

def check_embedding_table(supabase):
    """Check if the region_embeddings table has data"""
    try:
        response = supabase.table('region_embeddings').select('count', count='exact').execute()
        count = response.count
        print(f"region_embeddings table contains {count} rows")
        return count
    except Exception as e:
        print(f"Error checking region_embeddings table: {e}")
        return 0

def main():
    """Main function"""
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in environment variables")
        return
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Supabase credentials not found in environment variables")
        return
    
    # Check if table already has data
    count = check_embedding_table(supabase)
    if count > 0:
        print(f"Warning: region_embeddings table already contains {count} rows")
        confirm = input("Do you want to continue and potentially add duplicate data? (y/n): ")
        if confirm.lower() != 'y':
            print("Operation cancelled")
            return
    
    # Process region embeddings
    process_region_embeddings(supabase)

if __name__ == "__main__":
    main()
