#!/usr/bin/env python3
"""
Semantic Search Script for Automotive Parts Prediction & Inventory Optimization

This script provides functionality to perform semantic searches across different
entity types using the embeddings stored in Supabase.
"""

import os
import argparse
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from utils.database import connect_to_supabase
from tabulate import tabulate

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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


def search_vehicle_types(supabase, query, threshold=0.7, limit=5):
    """Search for vehicle types using semantic similarity."""
    print(f"\nSearching for vehicle types similar to: '{query}'")
    
    # Get embedding for the query
    query_embedding = get_embedding(query)
    if not query_embedding:
        print("Failed to generate embedding for the query")
        return None
    
    # Call the match function in Supabase
    try:
        response = supabase.rpc(
            'match_vehicle_types',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching vehicle types: {response.error}")
            return None
        
        results = response.data
        
        if not results:
            print("No matching vehicle types found")
            return None
        
        # Get additional details for each vehicle type
        type_ids = [result['type_id'] for result in results]
        
        # Fetch vehicle type details directly
        details_response = supabase.table('vehicle_types').select('*').in_('type_id', type_ids).execute()
        
        if hasattr(details_response, 'error') and details_response.error:
            print(f"Error fetching vehicle type details: {details_response.error}")
            return results
        
        # Create a lookup dictionary for details
        details_dict = {item['type_id']: item for item in details_response.data}
        
        # Combine results with details
        for result in results:
            type_id = result['type_id']
            if type_id in details_dict:
                result.update(details_dict[type_id])
        
        return results
    
    except Exception as e:
        print(f"Error searching vehicle types: {str(e)}")
        return None


def search_components(supabase, query, threshold=0.7, limit=5):
    """Search for components using semantic similarity."""
    print(f"\nSearching for components similar to: '{query}'")
    
    # Get embedding for the query
    query_embedding = get_embedding(query)
    if not query_embedding:
        print("Failed to generate embedding for the query")
        return None
    
    # Call the match function in Supabase
    try:
        response = supabase.rpc(
            'match_components',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching components: {response.error}")
            return None
        
        results = response.data
        
        if not results:
            print("No matching components found")
            return None
        
        # Get additional details for each component
        component_ids = [result['component_id'] for result in results]
        
        # Fetch component details directly
        details_response = supabase.table('components').select('*').in_('component_id', component_ids).execute()
        
        if hasattr(details_response, 'error') and details_response.error:
            print(f"Error fetching component details: {details_response.error}")
            return results
        
        # Create a lookup dictionary for details
        details_dict = {item['component_id']: item for item in details_response.data}
        
        # Combine results with details
        for result in results:
            component_id = result['component_id']
            if component_id in details_dict:
                result.update(details_dict[component_id])
        
        return results
    
    except Exception as e:
        print(f"Error searching components: {str(e)}")
        return None


def search_parts(supabase, query, threshold=0.7, limit=5):
    """Search for parts using semantic similarity."""
    print(f"\nSearching for parts similar to: '{query}'")
    
    # Get embedding for the query
    query_embedding = get_embedding(query)
    if not query_embedding:
        print("Failed to generate embedding for the query")
        return None
    
    # Call the match function in Supabase
    try:
        response = supabase.rpc(
            'match_parts',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching parts: {response.error}")
            return None
        
        results = response.data
        
        if not results:
            print("No matching parts found")
            return None
        
        # Get additional details for each part
        part_ids = [result['part_id'] for result in results]
        
        # Fetch part details directly
        parts_response = supabase.table('parts').select('*').in_('part_id', part_ids).execute()
        
        if hasattr(parts_response, 'error') and parts_response.error:
            print(f"Error fetching part details: {parts_response.error}")
            return results
        
        # Create a lookup dictionary for parts
        parts_dict = {item['part_id']: item for item in parts_response.data}
        
        # Get component and vehicle type details for enrichment
        component_ids = list(set(parts_dict[part_id]['component_id'] for part_id in parts_dict))
        type_ids = list(set(parts_dict[part_id]['type_id'] for part_id in parts_dict))
        
        # Fetch component details
        components_response = supabase.table('components').select('*').in_('component_id', component_ids).execute()
        components_dict = {item['component_id']: item for item in components_response.data}
        
        # Fetch vehicle type details
        vehicle_types_response = supabase.table('vehicle_types').select('*').in_('type_id', type_ids).execute()
        vehicle_types_dict = {item['type_id']: item for item in vehicle_types_response.data}
        
        # Combine results with details
        for result in results:
            part_id = result['part_id']
            if part_id in parts_dict:
                part = parts_dict[part_id]
                result.update(part)
                
                # Add component details
                if part['component_id'] in components_dict:
                    result['component_name'] = components_dict[part['component_id']]['component_name']
                
                # Add vehicle type details
                if part['type_id'] in vehicle_types_dict:
                    vt = vehicle_types_dict[part['type_id']]
                    result.update({
                        'make': vt['make'],
                        'model': vt['model'],
                        'year': vt['year']
                    })
        
        return results
    
    except Exception as e:
        print(f"Error searching parts: {str(e)}")
        return None


def search_vehicles(supabase, query, threshold=0.7, limit=5):
    """Search for vehicles using semantic similarity."""
    print(f"\nSearching for vehicles similar to: '{query}'")
    
    # Get embedding for the query
    query_embedding = get_embedding(query)
    if not query_embedding:
        print("Failed to generate embedding for the query")
        return None
    
    # Call the match function in Supabase
    try:
        response = supabase.rpc(
            'match_vehicles',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching vehicles: {response.error}")
            return None
        
        results = response.data
        
        if not results:
            print("No matching vehicles found")
            return None
        
        # Get additional details for each vehicle
        vehicle_ids = [result['vehicle_id'] for result in results]
        
        # Fetch vehicle details directly
        vehicles_response = supabase.table('vehicles').select('*').in_('vehicle_id', vehicle_ids).execute()
        
        if hasattr(vehicles_response, 'error') and vehicles_response.error:
            print(f"Error fetching vehicle details: {vehicles_response.error}")
            return results
        
        # Create a lookup dictionary for vehicles
        vehicles_dict = {item['vehicle_id']: item for item in vehicles_response.data}
        
        # Get vehicle type details for enrichment
        type_ids = list(set(vehicles_dict[vehicle_id]['type_id'] for vehicle_id in vehicles_dict))
        
        # Fetch vehicle type details
        vehicle_types_response = supabase.table('vehicle_types').select('*').in_('type_id', type_ids).execute()
        vehicle_types_dict = {item['type_id']: item for item in vehicle_types_response.data}
        
        # Combine results with details
        for result in results:
            vehicle_id = result['vehicle_id']
            if vehicle_id in vehicles_dict:
                vehicle = vehicles_dict[vehicle_id]
                result.update(vehicle)
                
                # Add vehicle type details
                if vehicle['type_id'] in vehicle_types_dict:
                    vt = vehicle_types_dict[vehicle['type_id']]
                    result.update({
                        'make': vt['make'],
                        'model': vt['model'],
                        'year': vt['year']
                    })
        
        return results
    
    except Exception as e:
        print(f"Error searching vehicles: {str(e)}")
        return None


def search_failure_descriptions(supabase, query, threshold=0.7, limit=5):
    """Search for failure descriptions using semantic similarity."""
    print(f"\nSearching for failure descriptions similar to: '{query}'")
    
    # Get embedding for the query
    query_embedding = get_embedding(query)
    if not query_embedding:
        print("Failed to generate embedding for the query")
        return None
    
    # Call the match function in Supabase
    try:
        response = supabase.rpc(
            'match_failure_descriptions',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching failure descriptions: {response.error}")
            return None
        
        results = response.data
        
        if not results:
            print("No matching failure descriptions found")
            return None
        
        # Get additional details for each component
        component_ids = [result['component_id'] for result in results]
        
        # Fetch component details directly
        components_response = supabase.table('components').select('*').in_('component_id', component_ids).execute()
        
        if hasattr(components_response, 'error') and components_response.error:
            print(f"Error fetching component details: {components_response.error}")
            return results
        
        # Create a lookup dictionary for details
        components_dict = {item['component_id']: item for item in components_response.data}
        
        # Combine results with details
        for result in results:
            component_id = result['component_id']
            if component_id in components_dict:
                result['component_name'] = components_dict[component_id]['component_name']
        
        return results
    
    except Exception as e:
        print(f"Error searching failure descriptions: {str(e)}")
        return None


def search_part_prices(supabase, query, threshold=0.7, limit=5):
    """Search for part prices using semantic similarity."""
    print(f"\nSearching for part prices similar to: '{query}'")
    
    # Get embedding for the query
    query_embedding = get_embedding(query)
    if not query_embedding:
        print("Failed to generate embedding for the query")
        return None
    
    # Call the match function in Supabase
    try:
        response = supabase.rpc(
            'match_part_prices',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error searching part prices: {response.error}")
            return None
        
        results = response.data
        
        if not results:
            print("No matching part prices found")
            return None
        
        # Get additional details for each part
        part_ids = list(set([result['part_id'] for result in results]))
        
        # Fetch part details directly
        parts_response = supabase.table('parts').select('*').in_('part_id', part_ids).execute()
        
        if hasattr(parts_response, 'error') and parts_response.error:
            print(f"Error fetching part details: {parts_response.error}")
            return results
        
        # Create a lookup dictionary for parts
        parts_dict = {item['part_id']: item for item in parts_response.data}
        
        # Get component details for enrichment
        component_ids = list(set([parts_dict[part_id]['component_id'] for part_id in parts_dict if part_id in parts_dict]))
        
        # Fetch component details
        components_response = supabase.table('components').select('*').in_('component_id', component_ids).execute()
        components_dict = {item['component_id']: item for item in components_response.data}
        
        # Combine results with details
        for result in results:
            part_id = result['part_id']
            if part_id in parts_dict:
                part = parts_dict[part_id]
                result.update({
                    'part_name': part['part_name'],
                    'part_number': part['part_number'],
                    'description': part.get('description', '')
                })
                
                # Add component details
                if part['component_id'] in components_dict:
                    result['component_name'] = components_dict[part['component_id']]['component_name']
        
        return results
    
    except Exception as e:
        print(f"Error searching part prices: {str(e)}")
        return None


def display_results(results, entity_type):
    """Display search results in a formatted table."""
    if not results:
        return
    
    # Define columns to display based on entity type
    if entity_type == 'vehicle_types':
        headers = ['Type ID', 'Make', 'Model', 'Year', 'Similarity']
        rows = [[r['type_id'], r.get('make', 'N/A'), r.get('model', 'N/A'), 
                r.get('year', 'N/A'), f"{r['similarity']:.4f}"] for r in results]
    
    elif entity_type == 'components':
        headers = ['Component ID', 'Component Name', 'Similarity']
        rows = [[r['component_id'], r.get('component_name', 'N/A'), 
                f"{r['similarity']:.4f}"] for r in results]
    
    elif entity_type == 'parts':
        headers = ['Part ID', 'Part Name', 'Part Number', 'Component', 'Vehicle', 'Similarity']
        rows = [[r['part_id'], r.get('part_name', 'N/A'), r.get('part_number', 'N/A'),
                r.get('component_name', 'N/A'), 
                f"{r.get('year', 'N/A')} {r.get('make', 'N/A')} {r.get('model', 'N/A')}",
                f"{r['similarity']:.4f}"] for r in results]
    
    elif entity_type == 'part_prices':
        headers = ['Price ID', 'Part Name', 'Quality', 'Price', 'Component', 'Similarity']
        rows = [[r['price_id'], r.get('part_name', 'N/A'), 
                r.get('quality', 'N/A'), f"${r.get('price', 'N/A'):.2f}",
                r.get('component_name', 'N/A'),
                f"{r['similarity']:.4f}"] for r in results]
    
    elif entity_type == 'vehicles':
        headers = ['Vehicle ID', 'Make', 'Model', 'Year', 'Mileage', 'Similarity']
        rows = [[r['vehicle_id'], r.get('make', 'N/A'), r.get('model', 'N/A'),
                r.get('year', 'N/A'), r.get('mileage', 'N/A'),
                f"{r['similarity']:.4f}"] for r in results]
    
    elif entity_type == 'failures':
        headers = ['ID', 'Component', 'Description', 'Similarity']
        rows = [[r['id'], r.get('component_name', 'N/A'), r['description'],
                f"{r['similarity']:.4f}"] for r in results]
    
    else:
        headers = ['ID', 'Description', 'Similarity']
        rows = [[r.get('id', 'N/A'), r.get('description', 'N/A'),
                f"{r['similarity']:.4f}"] for r in results]
    
    # Print table
    print("\nSearch Results:")
    print(tabulate(rows, headers=headers, tablefmt="grid"))


def main():
    """Main function to perform semantic search."""
    
    parser = argparse.ArgumentParser(description='Perform semantic search on automotive data')
    parser.add_argument('query', type=str, help='The search query')
    parser.add_argument('--entity', '-e', type=str, default='all',
                        choices=['all', 'vehicle_types', 'components', 'parts', 'vehicles', 'failures', 'part_prices'],
                        help='Entity type to search (default: all)')
    parser.add_argument('--threshold', '-t', type=float, default=0.7,
                        help='Similarity threshold (0.0 to 1.0, default: 0.7)')
    parser.add_argument('--limit', '-l', type=int, default=5,
                        help='Maximum number of results to return (default: 5)')
    
    args = parser.parse_args()
    
    print("======== Automotive Semantic Search ========")
    print(f"Query: '{args.query}'")
    print(f"Entity Type: {args.entity}")
    print(f"Threshold: {args.threshold}")
    print(f"Limit: {args.limit}")
    
    try:
        # Connect to Supabase
        print("\nConnecting to Supabase...")
        supabase = connect_to_supabase()
        print("Connection successful!")
        
        # Perform search based on entity type
        if args.entity == 'all' or args.entity == 'vehicle_types':
            results = search_vehicle_types(supabase, args.query, args.threshold, args.limit)
            if results:
                display_results(results, 'vehicle_types')
        
        if args.entity == 'all' or args.entity == 'components':
            results = search_components(supabase, args.query, args.threshold, args.limit)
            if results:
                display_results(results, 'components')
        
        if args.entity == 'all' or args.entity == 'parts':
            results = search_parts(supabase, args.query, args.threshold, args.limit)
            if results:
                display_results(results, 'parts')
        
        if args.entity == 'all' or args.entity == 'vehicles':
            results = search_vehicles(supabase, args.query, args.threshold, args.limit)
            if results:
                display_results(results, 'vehicles')
        
        if args.entity == 'all' or args.entity == 'failures':
            results = search_failure_descriptions(supabase, args.query, args.threshold, args.limit)
            if results:
                display_results(results, 'failures')
        
        if args.entity == 'all' or args.entity == 'part_prices':
            results = search_part_prices(supabase, args.query, args.threshold, args.limit)
            if results:
                display_results(results, 'part_prices')
        
        print("\nSearch complete!")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 