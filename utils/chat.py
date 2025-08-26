"""
Chat utility functions for the Auto Parts Assistant.
"""

import os
import json
import time
import asyncio
from openai import OpenAI
from utils.database import connect_to_supabase
from utils.chat_system_prompt import SYSTEM_PROMPT, RETRIEVAL_PROMPT
from dotenv import load_dotenv

# Make sure environment variables are loaded
load_dotenv()

# Get API key from .env file
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Cache for previous conversations
conversation_history = {}

# Cache for embeddings to avoid redundant API calls
# Structure: {normalized_text: {"embedding": [...], "timestamp": time.time()}}
embedding_cache = {}
# Cache expiration time in seconds (1 hour)
EMBEDDING_CACHE_EXPIRY = 3600

# Cache for context results to avoid redundant vector searches
# Structure: {query_type: {"context": "...", "timestamp": time.time()}}
context_cache = {}
# Context cache expiration time in seconds (5 minutes)
CONTEXT_CACHE_EXPIRY = 300

def normalize_text_for_cache(text):
    """Normalize text for caching purposes by removing extra whitespace and lowercasing."""
    return " ".join(text.lower().split())

def get_embedding(text, model="text-embedding-3-small"):
    """Get embedding for a text using OpenAI's API with caching."""
    try:
        # Replace newlines with spaces
        text = text.replace("\n", " ")
        
        # Normalize text for cache lookup
        normalized_text = normalize_text_for_cache(text)
        
        # Check if we have a valid cached embedding
        current_time = time.time()
        if normalized_text in embedding_cache:
            cache_entry = embedding_cache[normalized_text]
            # Check if the cache entry is still valid
            if current_time - cache_entry["timestamp"] < EMBEDDING_CACHE_EXPIRY:
                print(f"Using cached embedding for: {normalized_text[:30]}...")
                return cache_entry["embedding"]
            else:
                print(f"Cached embedding expired for: {normalized_text[:30]}...")
        
        print(f"Generating new embedding for: {normalized_text[:30]}...")
        response = client.embeddings.create(
            input=[text],
            model=model
        )
        
        # Get the embedding vector
        embedding = response.data[0].embedding
        
        # Cache the embedding
        embedding_cache[normalized_text] = {
            "embedding": embedding,
            "timestamp": current_time
        }
        
        # Clean up old cache entries if cache is getting too large
        if len(embedding_cache) > 100:  # Arbitrary limit
            clean_embedding_cache()
            
        return embedding
    except Exception as e:
        print(f"Error getting embedding: {str(e)}")
        return None

def clean_embedding_cache():
    """Remove expired entries from the embedding cache."""
    current_time = time.time()
    expired_keys = [
        key for key, value in embedding_cache.items()
        if current_time - value["timestamp"] > EMBEDDING_CACHE_EXPIRY
    ]
    
    for key in expired_keys:
        del embedding_cache[key]
    
    print(f"Cleaned {len(expired_keys)} expired entries from embedding cache.")

def get_cached_context(query_type_key):
    """Get cached context if available and not expired."""
    if query_type_key in context_cache:
        cache_entry = context_cache[query_type_key]
        current_time = time.time()
        if current_time - cache_entry["timestamp"] < CONTEXT_CACHE_EXPIRY:
            print(f"Using cached context for query type: {query_type_key}")
            return cache_entry["context"]
    return None

def cache_context(query_type_key, context):
    """Cache context for a query type."""
    context_cache[query_type_key] = {
        "context": context,
        "timestamp": time.time()
    }
    
    # Clean up old cache entries if cache is getting too large
    if len(context_cache) > 50:  # Arbitrary limit
        clean_context_cache()

def clean_context_cache():
    """Remove expired entries from the context cache."""
    current_time = time.time()
    expired_keys = [
        key for key, value in context_cache.items()
        if current_time - value["timestamp"] > CONTEXT_CACHE_EXPIRY
    ]
    
    for key in expired_keys:
        del context_cache[key]
    
    print(f"Cleaned {len(expired_keys)} expired entries from context cache.")

async def run_vector_search(supabase, function_name, query_embedding, threshold=0.4, count=3):
    """Run a vector search against a specific Supabase RPC function."""
    try:
        response = supabase.rpc(
            function_name,
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': count
            }
        ).execute()
        return response
    except Exception as e:
        print(f"Error in {function_name}: {str(e)}")
        return None

def search_database_for_context(query, session_id, supabase):
    """
    Search the database for relevant context based on the query.
    
    Args:
        query (str): User's query
        session_id (str): Session identifier
        supabase: Supabase client
        
    Returns:
        str: Relevant context for the RAG prompt
    """
    try:
        print(f"\n=== DIAGNOSTIC SEARCH LOG ===")
        print(f"Processing query: '{query}'")
        
        # TIER 1: Check for simple greetings or basic queries that don't need context
        simple_greetings = ["hi", "hello", "hey", "greetings", "howdy", "what's up", "sup"]
        if query.lower().strip() in simple_greetings or len(query.split()) <= 2:
            print("Detected simple greeting or short query - skipping vector search")
            return "This is a simple greeting or short query. No specific automotive context needed."
        
        # Get embedding for query
        query_embedding = get_embedding(query)
        if not query_embedding:
            print("[ERROR] Failed to generate embedding for query")
            return ""
        
        # TIER 2: Detect query type to determine which stores to search
        query_type = detect_query_type(query)
        print(f"Detected query types: {query_type}")
        
        # Create a cache key based on query type
        query_type_key = "+".join(sorted(query_type))
        
        # Check if we have cached context for this query type
        cached_context = get_cached_context(query_type_key)
        if cached_context:
            return cached_context
        
        context_parts = []
        
        # TIER 3: Selective vector search based on query type
        # Determine which searches to run based on query type
        searches_to_run = []
        
        # Search for relevant parts only if query is about parts
        if 'part' in query_type or 'mechanic' in query_type:
            searches_to_run.append(('match_parts', 'parts_response'))
        
        # Search for relevant components only if query is about components
        if 'component' in query_type or 'mechanic' in query_type:
            searches_to_run.append(('match_components', 'components_response'))
        
        # Search for relevant vehicle types only if query mentions vehicles
        if 'vehicle' in query_type or 'make' in query_type or 'model' in query_type:
            searches_to_run.append(('match_vehicle_types', 'vehicle_types_response'))
        
        # For pricing queries, search part prices
        if 'pricing' in query_type or 'cost' in query_type:
            searches_to_run.append(('match_part_prices', 'part_prices_response'))
        
        # For symptom/diagnostic queries, search failure descriptions
        if 'diagnostic' in query_type or 'symptom' in query_type or 'problem' in query_type:
            searches_to_run.append(('match_failure_descriptions', 'failures_response'))
        
        # For documentation queries, search documentation
        if 'documentation' in query_type or is_documentation_query(query):
            searches_to_run.append(('match_documentation', 'documentation_response'))
        
        # Run all searches in parallel using asyncio
        search_results = {}
        
        # Create event loop for asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Create tasks for all searches
        tasks = []
        for function_name, result_key in searches_to_run:
            task = run_vector_search(supabase, function_name, query_embedding)
            tasks.append((result_key, task))
        
        # Run all tasks in parallel and collect results
        for result_key, task in tasks:
            try:
                search_results[result_key] = loop.run_until_complete(task)
            except Exception as e:
                print(f"Error running {result_key}: {str(e)}")
                search_results[result_key] = None
        
        # Close the event loop
        loop.close()
        
        # Process results and build context
        # For mechanic/diagnostic queries, prioritize failures and part prices
        if 'mechanic' in query_type or 'diagnostic' in query_type or 'symptom' in query_type:
            # Add failures first (if available)
            failures_response = search_results.get('failures_response')
            if failures_response and hasattr(failures_response, 'data') and failures_response.data:
                # Group failures by component for better organization
                failures_by_component = {}
                for failure in failures_response.data:
                    component_name = failure.get('component_name', 'Unknown Component')
                    if component_name not in failures_by_component:
                        failures_by_component[component_name] = []
                    failures_by_component[component_name].append(failure)
                
                if not failures_by_component:
                    context_parts.append("Potential Issues: None found")
                else:
                    context_parts.append("Potential Issues:")
                    for component_name, failures in failures_by_component.items():
                        context_parts.append(f"- {component_name}:")
                        for failure in failures:
                            description = failure.get('description', 'Unknown issue')
                            context_parts.append(f"  • {description}")
            
            # Add part prices with highest priority
            part_prices_response = search_results.get('part_prices_response')
            if part_prices_response and hasattr(part_prices_response, 'data') and part_prices_response.data:
                # Group parts by part name for better organization
                parts_by_name = {}
                for price in part_prices_response.data:
                    part_name = price.get('part_name', 'Unknown Part')
                    if part_name not in parts_by_name:
                        parts_by_name[part_name] = []
                    parts_by_name[part_name].append(price)
                
                if not parts_by_name:
                    context_parts.append("\nRelevant Parts with Pricing: None found")
                else:
                    context_parts.append("\nRelevant Parts with Pricing:")
                    for part_name, prices in parts_by_name.items():
                        context_parts.append(f"- {part_name}:")
                        # Sort by price (lower first)
                        prices.sort(key=lambda x: x.get('price', 0))
                        for price in prices:
                            formatted_price = f"${price.get('price', 0):.2f}"
                            context_parts.append(f"  • Price: {formatted_price}")
                        part_description = prices[0].get('description', '')
                        if part_description:
                            context_parts.append(f"  Description: {part_description}")
        
        # Add parts if available and not already covered by part prices
        parts_response = search_results.get('parts_response')
        part_prices_response = search_results.get('part_prices_response')
        if parts_response and hasattr(parts_response, 'data') and parts_response.data and not (part_prices_response and hasattr(part_prices_response, 'data') and part_prices_response.data):
            context_parts.append("\nRelevant Parts:")
            for part in parts_response.data:
                context_parts.append(f"- {part.get('part_name', 'Unknown')} (Part #{part.get('part_number', 'N/A')}): {part.get('description', 'No description')}")
        
        # Add components
        components_response = search_results.get('components_response')
        if components_response and hasattr(components_response, 'data') and components_response.data:
            context_parts.append("\nRelevant Components:")
            for component in components_response.data:
                context_parts.append(f"- {component.get('component_name', 'Unknown')}: {component.get('description', 'No description')}")
        
        # Add vehicle types
        vehicle_types_response = search_results.get('vehicle_types_response')
        if vehicle_types_response and hasattr(vehicle_types_response, 'data') and vehicle_types_response.data:
            context_parts.append("\nRelevant Vehicle Types:")
            for vehicle in vehicle_types_response.data:
                context_parts.append(f"- {vehicle.get('year', 'N/A')} {vehicle.get('make', 'N/A')} {vehicle.get('model', 'N/A')}")
        
        # Add documentation for documentation queries
        documentation_response = search_results.get('documentation_response')
        if documentation_response and hasattr(documentation_response, 'data') and documentation_response.data:
            context_parts.append("\nRelevant Documentation:")
            for doc in documentation_response.data:
                context_parts.append(f"- {doc.get('section_title', 'Unknown Section')}:\n{doc.get('content', 'No content')}")
        
        # At the end of the function, cache the context
        context = "\n".join(context_parts)
        cache_context(query_type_key, context)
        
        return context
    
    except Exception as e:
        print(f"Error searching database: {str(e)}")
        return ""

def detect_query_type(query):
    """
    Detect the type of query to determine which vector stores to search.
    
    Args:
        query (str): User's query
        
    Returns:
        list: List of query types
    """
    query_lower = query.lower()
    query_types = []
    
    # Check for mechanic-related queries
    mechanic_terms = [
        'car', 'vehicle', 'auto', 'automotive', 'engine', 'transmission', 'brake',
        'suspension', 'steering', 'exhaust', 'catalytic', 'muffler', 'radiator',
        'alternator', 'battery', 'starter', 'ignition', 'spark plug', 'fuel', 'oil',
        'filter', 'coolant', 'fluid', 'tire', 'wheel', 'axle', 'drive', 'drive shaft',
        'cv joint', 'bearing', 'sensor', 'computer', 'ecu', 'ecm', 'make', 'model', 'year',
        'honda', 'toyota', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi',
        'volkswagen', 'hyundai', 'kia', 'mazda', 'lexus', 'acura', 'infiniti',
        'repair', 'replace', 'fix', 'service', 'maintain', 'maintenance'
    ]
    
    for term in mechanic_terms:
        if term in query_lower:
            query_types.append('mechanic')
            break
    
    # Check for diagnostic/symptom queries
    symptom_terms = extract_symptom_terms(query)
    if symptom_terms and symptom_terms[0] != 'common':
        query_types.append('diagnostic')
        query_types.append('symptom')
    
    # Check for pricing queries
    price_terms = ['price', 'cost', 'expensive', 'cheap', 'affordable', 'premium', 
                  'economy', 'standard', 'oem', 'aftermarket', 'quality', '$', 'dollar']
    
    for term in price_terms:
        if term in query_lower:
            query_types.append('pricing')
            break
    
    # Check for part-specific queries
    part_terms = extract_search_terms(query)
    if part_terms:
        query_types.append('part')
        
    # Check for documentation queries
    if is_documentation_query(query):
        query_types.append('documentation')
    
    # Default to documentation if no other types detected
    if not query_types:
        query_types.append('documentation')
    
    return query_types

def is_documentation_query(query):
    """
    Determine if the query is about documentation/technical aspects.
    
    Args:
        query (str): User's query
        
    Returns:
        bool: True if documentation query, False otherwise
    """
    query_lower = query.lower()
    
    # Keywords that indicate a documentation query
    documentation_terms = [
        'how does', 'how do you', 'how is', 'why is', 'what is', 'explain', 
        'documentation', 'technical', 'design', 'architecture', 'implement', 
        'algorithm', 'code', 'function', 'feature', 'capability', 'api',
        'database', 'schema', 'sql', 'vector', 'embedding', 'prediction', 
        'machine learning', 'ml', 'ai', 'artificial intelligence', 'develop',
        'system', 'application', 'app', 'project', 'framework', 'methodology',
        'approach', 'strategy', 'infrastructure', 'backend', 'frontend', 'ui',
        'interface'
    ]
    
    for term in documentation_terms:
        if term in query_lower:
            # Exception: if clearly automotive and not talking about the system
            if ('car' in query_lower or 'vehicle' in query_lower) and not any(tech in query_lower for tech in ['system', 'algorithm', 'database', 'application', 'software']):
                return False
            return True
    
    return False

def generate_chat_response(message, session_id, supabase):
    """
    Generate a response to a user message using OpenAI.
    
    Args:
        message (str): User's message
        session_id (str): Session identifier
        supabase: Supabase client
        
    Returns:
        str: AI assistant's response
    """
    try:
        # Initialize history for this session if it doesn't exist
        if session_id not in conversation_history:
            conversation_history[session_id] = []
        
        # Get relevant context from database
        context = search_database_for_context(message, session_id, supabase)
        
        # Prepare messages for OpenAI
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": "Use simple formatting in your responses: use ** for bold text, * for italic text, and line breaks for paragraphs."}
        ]
        
        # Add conversation history (limit to last 10 exchanges)
        for msg in conversation_history[session_id][-10:]:
            messages.append(msg)
        
        # Add retrieval context if available
        if context:
            retrieval_prompt = RETRIEVAL_PROMPT.format(context=context)
            messages.append({"role": "system", "content": retrieval_prompt})
        
        # Add user message
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using a more reliable model
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        
        # Extract response text
        response_text = response.choices[0].message.content
        
        # Update conversation history
        conversation_history[session_id].append({"role": "user", "content": message})
        conversation_history[session_id].append({"role": "assistant", "content": response_text})
        
        return response_text
    
    except Exception as e:
        print(f"Error generating chat response: {str(e)}")
        return "I'm sorry, I encountered an error while processing your request. Please try again later."

def extract_search_terms(query):
    """
    Extract important search terms from a query for direct text search.
    
    Args:
        query (str): User's query
        
    Returns:
        list: List of important search terms
    """
    # Common part terms to extract
    part_terms = [
        'brake pad', 'brake pads', 'brakes', 'rotor', 'rotors', 
        'alternator', 'battery', 'oil filter', 'air filter', 'cabin filter',
        'spark plug', 'spark plugs', 'fuel pump', 'water pump', 'radiator', 
        'thermostat', 'timing belt', 'timing chain', 'serpentine belt',
        'suspension', 'strut', 'struts', 'shock', 'shocks', 'tie rod',
        'ball joint', 'control arm', 'wheel bearing', 'axle', 'cv joint',
        'starter', 'starter motor', 'ignition coil', 'ignition', 'distributor',
        'transmission', 'clutch', 'flywheel', 'catalytic converter', 'muffler',
        'exhaust', 'oxygen sensor', 'o2 sensor', 'mass air flow', 'maf sensor',
        'fuel injector', 'injector', 'hose', 'belt', 'pulley', 'gasket',
        'head gasket', 'valve', 'sensor', 'switch', 'relay', 'fuse', 'bulb',
        'headlight', 'tail light', 'brake light', 'wiper', 'wiper blade'
    ]
    
    # Quality descriptors
    quality_terms = ['premium', 'standard', 'economy', 'oem', 'aftermarket', 'performance']
    
    # Identify car make/models
    car_models = ['honda', 'toyota', 'ford', 'chevrolet', 'chevy', 'nissan', 'hyundai',
                  'kia', 'bmw', 'mercedes', 'audi', 'volkswagen', 'vw', 'subaru', 'mazda',
                  'lexus', 'acura', 'infiniti', 'jeep', 'dodge', 'ram', 'chrysler', 'fiat',
                  'civic', 'accord', 'cr-v', 'crv', 'pilot', 'camry', 'corolla', 'rav4', 
                  'highlander', 'f-150', 'focus', 'escape', 'explorer', 'silverado', 'malibu',
                  'equinox', 'altima', 'sentra', 'rogue', 'elantra', 'sonata', 'tucson', 
                  'soul', 'forte', 'sorento', '3-series', 'c-class', 'a4', 'jetta', 'passat',
                  'outback', 'forester', 'impreza', 'cx-5', 'mazda3', 'es', 'rx', 'tlx', 'mdx',
                  'q50', 'q60', 'wrangler', 'grand cherokee', 'ram 1500', 'charger', 'challenger']
    
    query_lower = query.lower()
    found_terms = []
    
    # Find part terms
    for part in part_terms:
        if part in query_lower:
            found_terms.append(part)
            break  # Only get the first part match
    
    # Find quality descriptors
    for quality in quality_terms:
        if quality in query_lower:
            found_terms.append(quality)
            break  # Only get the first quality match
    
    # Find car models
    for model in car_models:
        if model in query_lower:
            found_terms.append(model)
    
    # Find years (4 digit numbers between 1990 and current year)
    import re
    year_matches = re.findall(r'\b(19[9][0-9]|20[0-2][0-9])\b', query_lower)
    if year_matches:
        found_terms.append(year_matches[0])
    
    return found_terms 

def extract_symptom_terms(query):
    """
    Extract symptom terms from a query for direct text search of failures.
    
    Args:
        query (str): User's query
        
    Returns:
        list: List of symptom terms
    """
    # Common symptom terms to extract
    symptom_terms = [
        'noise', 'grinding', 'squeaking', 'squealing', 'rattling', 'knocking',
        'clunking', 'vibration', 'shaking', 'wobbling', 'pull', 'pulling',
        'drift', 'drifting', 'leak', 'leaking', 'smoke', 'smoking', 'smell',
        'burning', 'overheating', 'overheat', 'hot', 'cold', 'misfire',
        'stall', 'stalling', 'rough idle', 'idle', 'hesitation', 'surge',
        'surging', 'sputter', 'sputtering', 'hard start', 'no start', 'won\'t start',
        'check engine', 'check engine light', 'warning light', 'dashboard light',
        'abs light', 'traction control', 'brake light', 'oil light', 'battery light',
        'power loss', 'lose power', 'poor acceleration', 'slow acceleration',
        'poor fuel economy', 'gas mileage', 'mpg', 'fuel consumption',
        'transmission slip', 'slipping', 'hard shift', 'delayed shift', 'no shift',
        'jerk', 'jerking', 'jump', 'jumping', 'buck', 'bucking', 'backfire',
        'pulsate', 'pulsating', 'spongy', 'soft', 'hard', 'pedal', 'steering'
    ]
    
    # Vehicle system terms
    system_terms = [
        'brake', 'brakes', 'brake system', 'brake pedal', 'steering', 
        'steering wheel', 'suspension', 'engine', 'transmission', 'clutch',
        'exhaust', 'catalytic converter', 'muffler', 'electrical', 'battery',
        'alternator', 'starter', 'ignition', 'cooling', 'radiator', 'thermostat',
        'water pump', 'heater', 'ac', 'air conditioning', 'fuel', 'fuel system',
        'fuel pump', 'fuel injector', 'filter', 'air filter', 'oil filter',
        'cabin filter', 'fuel filter', 'fluid', 'oil', 'coolant', 'transmission fluid',
        'brake fluid', 'power steering fluid', 'tire', 'tires', 'wheel', 'wheels'
    ]
    
    query_lower = query.lower()
    found_terms = []
    
    # Find symptom terms
    for symptom in symptom_terms:
        if symptom in query_lower:
            found_terms.append(symptom)
    
    # Find system terms
    for system in system_terms:
        if system in query_lower:
            found_terms.append(system)
    
    # If no terms found, add generic one to return some results
    if not found_terms:
        found_terms.append('common')
    
    return found_terms 