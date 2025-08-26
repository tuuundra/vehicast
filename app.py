#!/usr/bin/env python3
"""
Flask Application for Automotive Parts Prediction & Inventory Optimization

This application provides interfaces for:
1. Distributors - View parts demand and stock recommendations
2. Shops - Predict component failures and search for parts
3. Chat Assistant - Answer questions about the system with RAG capabilities
"""

import os
import pickle
import pandas as pd
import numpy as np
import json
import uuid
import random
import asyncio
from flask import Flask, render_template, request, jsonify, session, make_response
from flask_cors import CORS
from dotenv import load_dotenv
from utils.time_predictions import convert_numpy_types, predict_failure_timeline
from utils.database import connect_to_supabase
from utils.chat import generate_chat_response, search_database_for_context
from utils.openai_realtime import OpenAIRealtimeClient
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(24))

# Enable CORS for the frontend domain
cors_origin = os.getenv("CORS_ORIGIN", "https://vehicast-frontend.onrender.com")
# For local development, use the FRONTEND_PORT from .env if available
local_frontend_port = os.getenv("FRONTEND_PORT", "3001")
CORS(app, origins=[cors_origin, f"http://localhost:{local_frontend_port}"])

# Directory where models are stored
MODELS_DIR = 'models'

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Embedding model to use
EMBEDDING_MODEL = "text-embedding-3-small"

# Connect to Supabase
supabase = connect_to_supabase()

# Global variable to store the cached inventory value
CACHED_TOTAL_INVENTORY = None

# Load trained models
def load_models():
    """Load all trained component models."""
    models = {}
    
    # Check if models directory exists
    if not os.path.exists(MODELS_DIR):
        print(f"Error: Models directory '{MODELS_DIR}' not found.")
        return models
    
    # Load each model file
    for filename in os.listdir(MODELS_DIR):
        if filename.endswith('_model.pkl'):
            component_name = filename.replace('_model.pkl', '').replace('_', ' ')
            model_path = os.path.join(MODELS_DIR, filename)
            
            try:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                    models[component_name] = model
                    print(f"Loaded model for {component_name}")
            except Exception as e:
                print(f"Error loading model for {component_name}: {str(e)}")
    
    return models

# Load models at startup
models = load_models()

# Get embedding for text
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

# Search for parts
def search_parts(query, threshold=0.5, limit=5):
    """Search for parts using semantic similarity."""
    try:
        # Get embedding for the query
        query_embedding = get_embedding(query)
        if not query_embedding:
            return []
        
        # Call the match function in Supabase
        response = supabase.rpc(
            'match_parts',
            {
                'query_embedding': query_embedding,
                'match_threshold': threshold,
                'match_count': limit
            }
        ).execute()
        
        return response.data
    except Exception as e:
        print(f"Error searching parts: {str(e)}")
        return []

# Get parts for a vehicle component
def get_parts_for_vehicle_component(make, model, year, component_name):
    """Get parts for a specific vehicle type and component."""
    try:
        # Get vehicle type ID
        vehicle_type_response = supabase.table('vehicle_types').select('type_id').eq('make', make).eq('model', model).eq('year', year).execute()
        
        if not vehicle_type_response.data:
            return []
        
        type_id = vehicle_type_response.data[0]['type_id']
        
        # Get component ID
        component_response = supabase.table('components').select('component_id').eq('component_name', component_name).execute()
        
        if not component_response.data:
            return []
        
        component_id = component_response.data[0]['component_id']
        
        # Get parts
        parts_response = supabase.table('parts').select('*').eq('type_id', type_id).eq('component_id', component_id).execute()
        
        return parts_response.data
    
    except Exception as e:
        print(f"Error getting parts: {str(e)}")
        return []

# Predict component failures for a vehicle
def predict_vehicle_failures(vehicle_data, threshold=0.1):
    """Predict component failures for a vehicle."""
    make = vehicle_data.get('make', '')
    model = vehicle_data.get('model', '')
    year = vehicle_data.get('year', 2020)
    
    predictions = []
    
    for component_name, component_model in models.items():
        # Predict failure probability
        try:
            # Create a DataFrame with the vehicle data
            vehicle_df = pd.DataFrame([vehicle_data])
            
            # Ensure all required columns exist
            required_columns = component_model.feature_names_in_
            for col in required_columns:
                if col not in vehicle_df.columns:
                    vehicle_df[col] = 0  # Default value for missing features
            
            # Make prediction
            prob = component_model.predict_proba(vehicle_df)[0][1]
            
            # Get parts for this component if probability is above threshold
            parts = []
            if prob >= threshold and make and model and year:
                parts = get_parts_for_vehicle_component(make, model, year, component_name)
            
            predictions.append({
                'component': component_name,
                'probability': prob,
                'parts': parts
            })
        except Exception as e:
            print(f"Error predicting for {component_name}: {str(e)}")
            predictions.append({
                'component': component_name,
                'probability': 0,
                'parts': []
            })
    
    # Sort by probability (highest first)
    predictions.sort(key=lambda x: x['probability'], reverse=True)
    
    return predictions

# Load demand forecast
def load_demand_forecast():
    """Load demand forecast from CSV file or generate sample data if file not found."""
    try:
        csv_path = os.path.abspath('demand_forecast.csv')
        print(f"Looking for demand forecast CSV at: {csv_path}")
        print(f"File exists: {os.path.exists(csv_path)}")
        
        if os.path.exists(csv_path):
            print(f"Loading demand forecast from CSV: {csv_path}")
            df = pd.read_csv(csv_path)
            print(f"Loaded {len(df)} rows from CSV")
            return df
        else:
            print("Demand forecast CSV not found, generating sample data")
            # Set a fixed seed for random number generation to ensure consistent values
            random.seed(42)
            
            # Generate sample data
            sample_data = []
            
            # Sample vehicle types
            vehicle_types = [
                "Toyota Camry 2018", 
                "Honda Accord 2020", 
                "Ford F-150 2019", 
                "Nissan Altima 2021", 
                "Chevrolet Malibu 2017",
                "BMW 3 Series 2019",
                "Audi A4 2020",
                "Tesla Model 3 2021",
                "Hyundai Sonata 2018",
                "Kia Optima 2019"
            ]
            
            # Sample components
            components = [
                "Braking System", 
                "Engine", 
                "Transmission", 
                "Suspension", 
                "Electrical System",
                "Cooling System",
                "Fuel System",
                "Exhaust System",
                "HVAC System",
                "Steering System"
            ]
            
            # Sample parts for each component
            part_types = {
                "Braking System": ["Brake Pads", "Brake Rotors", "Brake Calipers", "Brake Lines"],
                "Engine": ["Oil Filter", "Spark Plugs", "Air Filter", "Timing Belt"],
                "Transmission": ["Transmission Fluid", "Clutch Kit", "Torque Converter", "Gear Set"],
                "Suspension": ["Shock Absorbers", "Struts", "Control Arms", "Sway Bar Links"],
                "Electrical System": ["Battery", "Alternator", "Starter Motor", "Ignition Coil"],
                "Cooling System": ["Radiator", "Water Pump", "Thermostat", "Coolant Reservoir"],
                "Fuel System": ["Fuel Pump", "Fuel Filter", "Fuel Injectors", "Fuel Pressure Regulator"],
                "Exhaust System": ["Catalytic Converter", "Muffler", "Exhaust Pipe", "O2 Sensor"],
                "HVAC System": ["AC Compressor", "Heater Core", "Blower Motor", "Evaporator"],
                "Steering System": ["Power Steering Pump", "Steering Rack", "Tie Rod Ends", "Steering Column"]
            }
            
            # Generate 50 sample parts with realistic data
            part_id = 1
            for vehicle_type in vehicle_types:
                for component in random.sample(components, 5):  # Each vehicle type needs parts from 5 random components
                    for part_type in random.sample(part_types[component], 2):  # 2 random parts per component
                        # Generate realistic demand and stock numbers
                        expected_demand = random.randint(50, 500)
                        recommended_stock = int(expected_demand * random.uniform(0.8, 1.2))  # Stock is roughly based on demand
                        
                        # Generate realistic price based on component type
                        base_price = 0
                        if component == "Braking System":
                            base_price = random.uniform(45.0, 115.0)
                        elif component == "Engine":
                            base_price = random.uniform(75.0, 225.0)
                        elif component == "Transmission":
                            base_price = random.uniform(120.0, 300.0)
                        elif component == "Suspension":
                            base_price = random.uniform(80.0, 400.0)
                        elif component == "Electrical System":
                            base_price = random.uniform(40.0, 200.0)
                        elif component == "Cooling System":
                            base_price = random.uniform(50.0, 150.0)
                        elif component == "Fuel System":
                            base_price = random.uniform(60.0, 180.0)
                        elif component == "Exhaust System":
                            base_price = random.uniform(100.0, 300.0)
                        elif component == "HVAC System":
                            base_price = random.uniform(80.0, 250.0)
                        elif component == "Steering System":
                            base_price = random.uniform(70.0, 220.0)
                        else:
                            base_price = random.uniform(50.0, 150.0)
                        
                        # Calculate different price points
                        wholesale_price = base_price * 1.2  # 20% markup
                        retail_price = base_price * 1.5     # 50% markup
                        msrp = base_price * 2.0             # 100% markup
                        
                        # Create part entry
                        part = {
                            "part_id": part_id,
                            "part_name": f"{part_type} - {vehicle_type}",
                            "part_number": f"P{part_id:04d}-{random.randint(1000, 9999)}",
                            "component_name": component,
                            "vehicle_type": vehicle_type,
                            "expected_demand": expected_demand,
                            "recommended_stock": recommended_stock,
                            "base_price": round(base_price, 2),
                            "wholesale_price": round(wholesale_price, 2),
                            "retail_price": round(retail_price, 2),
                            "msrp": round(msrp, 2)
                        }
                        
                        sample_data.append(part)
                        part_id += 1
            
            return pd.DataFrame(sample_data)
    except Exception as e:
        print(f"Error loading demand forecast: {str(e)}")
        return pd.DataFrame()

# Load regional demand data from CSV
def load_regional_demand():
    """Load regional demand data from CSV file or return empty DataFrame if file not found."""
    try:
        # Try both relative and absolute paths
        csv_path = os.path.abspath('generative_data/regional_demand.csv')
        print(f"Looking for regional demand CSV at: {csv_path}")
        print(f"File exists: {os.path.exists(csv_path)}")
        
        if not os.path.exists(csv_path):
            # Try alternative path
            csv_path = os.path.join(os.path.dirname(__file__), 'generative_data', 'regional_demand.csv')
            print(f"Trying alternative path: {csv_path}")
            print(f"File exists: {os.path.exists(csv_path)}")
        
        if os.path.exists(csv_path):
            print(f"Loading regional demand from CSV: {csv_path}")
            df = pd.read_csv(csv_path)
            print(f"Loaded {len(df)} rows from CSV")
            return df
        else:
            print("Regional demand CSV not found")
            # Check if we have the CSV generation script and run it
            script_path = os.path.abspath('generate_regional_data.py')
            if os.path.exists(script_path):
                print(f"Found generation script at {script_path}, attempting to run it")
                import subprocess
                result = subprocess.run(['python', script_path], capture_output=True, text=True)
                print(f"Generation script output: {result.stdout}")
                print(f"Generation script errors: {result.stderr}")
                
                # Check if file was created
                if os.path.exists(csv_path):
                    print(f"CSV successfully generated, loading it now")
                    df = pd.read_csv(csv_path)
                    print(f"Loaded {len(df)} rows from CSV")
                    return df
            
            print("Could not generate or find the regional demand data")
            return pd.DataFrame()
    except Exception as e:
        print(f"Error loading regional demand: {str(e)}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame()

# Routes
@app.route('/')
def home():
    """Home page."""
    return render_template('home.html')

@app.route('/distributor')
def distributor():
    """Distributor interface."""
    # Load demand forecast
    demand_df = load_demand_forecast()
    
    if demand_df.empty:
        return render_template('distributor.html', has_data=False)
    
    # Get top parts
    top_parts = demand_df.head(20).to_dict('records')
    
    # Calculate totals
    total_demand = demand_df['expected_demand'].sum()
    total_stock = demand_df['recommended_stock'].sum()
    
    return render_template('distributor.html', 
                          has_data=True,
                          parts=top_parts, 
                          total_demand=total_demand,
                          total_stock=total_stock)

@app.route('/shop')
def shop():
    """Shop interface."""
    return render_template('shop.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    """API endpoint for predicting component failures."""
    data = request.json
    
    # Create vehicle data with default values for missing fields
    vehicle_data = {
        'make': data.get('make', ''),
        'model': data.get('model', ''),
        'year': int(data.get('year', 2020)) if data.get('year') else 2020,
        'mileage': int(data.get('mileage', 50000)) if data.get('mileage') else 50000
    }
    
    # Validate that at least one field has a value
    if not any([data.get('make'), data.get('model'), data.get('year'), data.get('mileage')]):
        return jsonify({'error': 'At least one vehicle field is required'}), 400
    
    # Get threshold
    threshold = float(data.get('threshold', 0.1))
    
    # Predict failures
    predictions = predict_vehicle_failures(vehicle_data, threshold)
    
    # Convert NumPy types to Python native types
    predictions = convert_numpy_types(predictions)
    
    return jsonify(predictions)

@app.route('/api/predict_timeline', methods=['POST'])
def predict_timeline():
    try:
        # Get data from request
        data = request.json
        
        # Extract vehicle data
        vehicle_data = {
            'make': data.get('make'),
            'model': data.get('model'),
            'year': data.get('year'),
            'mileage': data.get('mileage')
        }
        
        # If a vehicle ID was provided, add it to the vehicle data
        if 'vehicle_id' in data:
            vehicle_data['vehicle_id'] = data['vehicle_id']
        
        # Get time windows (default to 3, 6, 12, 24 months)
        time_windows = data.get('time_windows', [3, 6, 12, 24])
        
        # Get prediction type (default to cumulative)
        prediction_type = data.get('prediction_type', 'cumulative')
        
        # Get threshold (default to 0.1)
        threshold = data.get('threshold', 0.1)
        
        # Connect to Supabase
        supabase = connect_to_supabase()
        
        # Calculate timeline predictions
        if prediction_type == 'cumulative':
            timeline_predictions = calculate_cumulative_failure_timeline(models, vehicle_data, time_windows, supabase)
        else:
            timeline_predictions = predict_failure_timeline(models, vehicle_data, time_windows, supabase)
        
        # Add parts for components above threshold
        for component_name, predictions in timeline_predictions.items():
            for time_window, prediction in predictions.items():
                if prediction['probability'] >= threshold:
                    # Find parts for this component
                    parts = get_parts_for_vehicle_component(
                        vehicle_data['make'], 
                        vehicle_data['model'], 
                        vehicle_data['year'], 
                        component_name
                    )
                    prediction['parts'] = parts
        
        # Return JSON response
        return jsonify(timeline_predictions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/search', methods=['POST'])
def search():
    """API endpoint for searching parts."""
    data = request.json
    
    # Validate input
    if 'query' not in data:
        return jsonify({'error': 'Missing required field: query'}), 400
    
    # Get parameters
    query = data['query']
    threshold = float(data.get('threshold', 0.5))
    limit = int(data.get('limit', 5))
    
    # Search parts
    results = search_parts(query, threshold, limit)
    
    return jsonify(results)

@app.route('/api/demand', methods=['GET'])
def get_demand():
    """API endpoint for getting demand forecasts by time window."""
    global CACHED_TOTAL_INVENTORY
    
    print("\n--- GET /api/demand ---")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request remote addr: {request.remote_addr}")
    print(f"Request method: {request.method}")
    print(f"Request args: {dict(request.args)}")
    
    # Get time window from query parameter (default to 6 months)
    time_window = request.args.get('time_window', '6 months')
    print(f"Requested time window: {time_window}")
    
    # Extract the number and unit from the time window string
    try:
        parts = time_window.split()
        if len(parts) >= 2:
            time_value = int(parts[0])
            time_unit = parts[1].lower()
            
            # Convert to days for consistent calculation
            if time_unit == 'days' or time_unit == 'day':
                days = time_value
            elif time_unit == 'months' or time_unit == 'month':
                days = time_value * 30  # Approximate days in a month
            else:
                # Default to 6 months if unit not recognized
                days = 180
        else:
            # Default to 6 months if format is incorrect
            days = 180
        
        print(f"Converted time window to {days} days")
    except (ValueError, IndexError):
        # Default to 6 months if parsing fails
        days = 180
        print(f"Failed to parse time window, using default: {days} days")
    
    # Load demand forecast
    demand_df = load_demand_forecast()
    
    if demand_df.empty:
        print("No demand data found, returning empty response")
        response = jsonify({
            'time_window': time_window,
            'parts': [],
            'total_demand': 0,
            'total_stock': 0
        })
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    
    print(f"Loaded demand data with {len(demand_df)} rows")
    
    # Calculate the total inventory value only once and cache it
    if CACHED_TOTAL_INVENTORY is None:
        CACHED_TOTAL_INVENTORY = int(demand_df['recommended_stock'].sum())
        print(f"Calculated and cached total inventory: {CACHED_TOTAL_INVENTORY}")
    else:
        print(f"Using cached total inventory: {CACHED_TOTAL_INVENTORY}")
    
    # Create a copy of the DataFrame to avoid modifying the original
    scaled_df = demand_df.copy()
    
    # Base forecast is for 6 months (180 days), scale to the requested time window
    # Calculate scaling factor based on the ratio of requested days to base days (180)
    base_days = 180  # 6 months
    scaling_factor = days / base_days
    print(f"Scaling factor: {scaling_factor} (requested {days} days / base {base_days} days)")
    
    # Only scale the expected demand values - inventory remains constant
    scaled_df['expected_demand'] = (scaled_df['expected_demand'] * scaling_factor).round().astype(int)
    
    # Ensure we don't have negative values after scaling
    scaled_df['expected_demand'] = scaled_df['expected_demand'].clip(lower=0)
    
    # Sort by the scaled expected demand and take top parts
    top_parts_df = scaled_df.sort_values(by='expected_demand', ascending=False).head(20)
    
    # Calculate total demand from the scaled data for the selected top parts
    total_demand = scaled_df['expected_demand'].sum()
    
    # Calculate potential revenue based on actual part prices
    # Multiply each part's expected demand by its retail price
    potential_revenue = 0
    if 'retail_price' in scaled_df.columns:
        potential_revenue = (scaled_df['expected_demand'] * scaled_df['retail_price']).sum()
    else:
        # Fallback to a simple calculation if retail price is not available
        potential_revenue = total_demand * 50  # Assume average price of $50
    
    # Convert DataFrame to dict
    top_parts = top_parts_df.to_dict('records')
    print(f"Returning top {len(top_parts)} parts")
    
    # Create response data
    response_data = {
        'time_window': time_window,
        'parts': top_parts,
        'total_demand': total_demand,
        'total_stock': CACHED_TOTAL_INVENTORY,  # Using the cached total inventory value
        'potential_revenue': round(potential_revenue, 2)  # Include the calculated potential revenue
    }
    
    # Convert NumPy types to Python native types
    response_data = convert_numpy_types(response_data)
    
    # Create response
    response = jsonify(response_data)
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
    
    return response

@app.route('/api/regional_demand', methods=['GET'])
def get_regional_demand():
    """API endpoint for getting regional demand data for heatmap visualization."""
    print("\n--- GET /api/regional_demand ---")
    print(f"Request args: {dict(request.args)}")
    print(f"Request headers: {dict(request.headers)}")
    
    # Get parameters
    time_window = request.args.get('time_window', '6 months')
    part_id = request.args.get('part_id')
    
    print(f"Requested time window: {time_window}")
    if part_id:
        print(f"Requested part_id: {part_id}")
        try:
            part_id = int(part_id)
        except ValueError:
            print(f"Invalid part_id: {part_id}")
            part_id = None
    
    # Load regional demand data
    regional_df = load_regional_demand()
    
    if regional_df.empty:
        print("No regional demand data found, returning empty response")
        response = jsonify({
            'success': False,
            'error': 'No regional demand data available',
            'features': []
        })
        # Add CORS headers
        return _add_cors_headers(response)
    
    # Filter by part_id if provided
    if part_id:
        regional_df = regional_df[regional_df['part_id'] == part_id]
        print(f"Filtered to {len(regional_df)} rows for part_id {part_id}")
    
    # Convert to GeoJSON format for the heatmap
    features = []
    for _, row in regional_df.iterrows():
        feature = {
            'type': 'Feature',
            'properties': {
                'intensity': float(row['demand_intensity']),
                'city': row['city'],
                'state': row['state'],
                'part_name': row['part_name'],
                'component_name': row['component_name']
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [float(row['longitude']), float(row['latitude'])]
            }
        }
        features.append(feature)
    
    print(f"Returning {len(features)} GeoJSON features")
    
    response = jsonify({
        'success': True,
        'features': features
    })
    
    # Add CORS headers
    return _add_cors_headers(response)

# Helper function to add CORS headers
def _add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Chat routes
@app.route('/chat-frame')
def chat_frame():
    """Render the chat interface in an iframe."""
    # Generate a session ID if not present
    if 'chat_session_id' not in session:
        session['chat_session_id'] = str(uuid.uuid4())
    
    return render_template('chat.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """API endpoint for chat interactions."""
    # Get message from request
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    message = data['message']
    
    # Get or create session ID
    if 'chat_session_id' not in session:
        session['chat_session_id'] = str(uuid.uuid4())
    
    session_id = session['chat_session_id']
    
    # Generate response
    response = generate_chat_response(message, session_id, supabase)
    
    return jsonify({'response': response})

@app.route('/api/chat/realtime', methods=['POST'])
def chat_realtime():
    """API endpoint for setting up a realtime chat session"""
    data = request.json
    if not data or 'message' not in data:
        return jsonify({'error': 'No message provided'}), 400
    
    message = data['message']
    
    # Get or create session ID
    if 'chat_session_id' not in session:
        session['chat_session_id'] = str(uuid.uuid4())
    
    session_id = session['chat_session_id']
    
    # First get context from database (reusing existing function)
    context = search_database_for_context(message, session_id, supabase)
    
    # Get WebSocket server URL from environment variable in production, or construct it in development
    if 'WEBSOCKET_SERVICE_URL' in os.environ:
        # Use complete URL from environment variable (for production)
        websocket_url = os.environ.get('WEBSOCKET_SERVICE_URL')
    else:
        # Fallback for local development
        websocket_host = os.environ.get('WS_HOST', request.host.split(':')[0])
        websocket_port = os.environ.get('WS_PORT', '8765')
        websocket_protocol = 'wss' if request.is_secure else 'ws'
        websocket_url = f"{websocket_protocol}://{websocket_host}:{websocket_port}"
    
    # Create a client for the OpenAI Realtime API that can be used on the client side
    response = {
        'session_id': session_id,
        'status': 'configured',
        'message': 'Realtime session configured. Use WebSocket to connect.',
        'context': bool(context),  # Just indicate if context was found
        'websocket_url': websocket_url  # Add WebSocket URL to response
    }
    
    # Store context in session for use by websocket handler
    session['context'] = context
    
    return jsonify(response)

@app.before_request
def handle_preflight():
    """Handle preflight OPTIONS requests for CORS."""
    if request.method == "OPTIONS":
        print(f"Handling OPTIONS preflight request from {request.remote_addr}")
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return response

if __name__ == '__main__':
    port = int(os.getenv("FLASK_PORT", 5001))  # Use FLASK_PORT from .env, fallback to 5001
    app.run(debug=os.getenv("FLASK_ENV") == "development", host="0.0.0.0", port=port) 