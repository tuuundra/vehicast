#!/usr/bin/env python3
"""
WebSocket Server for Real-time Chat with OpenAI API

This server handles WebSocket connections from clients and relays messages
to/from the OpenAI Realtime API.
"""

import asyncio
import websockets
import json
import logging
import os
import ssl
import uuid
import redis
from utils.openai_realtime import OpenAIRealtimeClient
from utils.chat import get_embedding, search_database_for_context
from utils.database import connect_to_supabase
from utils.chat_system_prompt import SYSTEM_PROMPT, RETRIEVAL_PROMPT
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Connect to Redis for session data (if available)
try:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url)
    redis_available = True
    logger.info("Connected to Redis for session storage")
except (ImportError, Exception) as e:
    redis_available = False
    logger.warning(f"Redis not available: {e}, will use in-memory session storage")

# In-memory session storage as fallback
session_storage = {}

# Connect to Supabase
supabase = connect_to_supabase()

# Track active connections
clients = {}

async def store_session_data(session_id, key, value):
    """Store session data in Redis or fallback to in-memory storage"""
    if redis_available:
        try:
            redis_client.hset(f"session:{session_id}", key, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Redis error: {e}")
            
    # Fallback to in-memory storage
    if session_id not in session_storage:
        session_storage[session_id] = {}
    session_storage[session_id][key] = value
    return True

async def get_session_data(session_id, key):
    """Get session data from Redis or fallback to in-memory storage"""
    if redis_available:
        try:
            data = redis_client.hget(f"session:{session_id}", key)
            if data:
                return json.loads(data)
        except Exception as e:
            logger.error(f"Redis error: {e}")
    
    # Fallback to in-memory storage
    if session_id in session_storage and key in session_storage[session_id]:
        return session_storage[session_id][key]
    
    return None

async def handle_client_message(websocket, client_id):
    """Handle messages from the client"""
    try:
        async for message in websocket:
            data = json.loads(message)
            logger.info(f"Received message from client {client_id}: {data.get('type', 'unknown')}")
            
            if data.get('type') == 'message':
                # Extract message and session
                user_message = data.get('message', '')
                session_id = data.get('session_id', '')
                
                if not user_message:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'No message provided'
                    }))
                    continue
                
                # Check if we have a valid session
                if not session_id:
                    session_id = str(uuid.uuid4())
                    await websocket.send(json.dumps({
                        'type': 'session_created',
                        'session_id': session_id
                    }))
                
                # Get context from database
                context = await get_session_data(session_id, 'context')
                if not context:
                    # If no context in session, generate it
                    context = search_database_for_context(user_message, session_id, supabase)
                    await store_session_data(session_id, 'context', context)
                
                # Create realtime client for this message
                openai_client = OpenAIRealtimeClient()
                
                # Update system prompt with context
                if context:
                    retrieval_prompt = RETRIEVAL_PROMPT.format(context=context)
                    system_prompt = f"{SYSTEM_PROMPT}\n\n{retrieval_prompt}"
                else:
                    system_prompt = SYSTEM_PROMPT
                    
                # The client doesn't have session_config anymore, we'll pass the system prompt when sending the message
                # Setup callbacks with the correct event types from the new client
                async def on_delta(event):
                    """Handle delta messages from OpenAI"""
                    delta = event.get('delta', '')
                    buffer = event.get('buffer', '')
                    await websocket.send(json.dumps({
                        'type': 'delta',
                        'delta': delta,
                        'buffer': buffer
                    }))
                
                async def on_complete(event):
                    """Handle completion messages from OpenAI"""
                    message = event.get('message', '')
                    await websocket.send(json.dumps({
                        'type': 'complete',
                        'message': message
                    }))
                
                async def on_error(event):
                    """Handle error messages from OpenAI"""
                    message = event.get('message', '')
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': message
                    }))
                
                # Register callbacks with the correct event types
                openai_client.register_callback("delta", on_delta)
                openai_client.register_callback("complete", on_complete)
                openai_client.register_callback("error", on_error)
                
                # Save the client for cleanup
                clients[client_id] = openai_client
                
                # Connect to OpenAI and send message
                logger.info(f"Connecting to OpenAI for client {client_id}")
                if await openai_client.connect():
                    # Send acknowledgment to client
                    await websocket.send(json.dumps({
                        'type': 'connected',
                        'message': 'Connected to OpenAI'
                    }))
                    
                    # We need to implement a way to pass the system prompt
                    # For now, let's modify the util/openai_realtime.py file to add this capability
                    # As a workaround, we'll prepend the system instructions to the user message
                    formatted_message = f"[SYSTEM INSTRUCTIONS: {system_prompt}]\n\nUSER QUERY: {user_message}"
                    
                    # Send message to OpenAI
                    await openai_client.send_message(formatted_message)
                    
                    # Start receiving events
                    await openai_client.receive_events()
                else:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Failed to connect to OpenAI'
                    }))
            
            elif data.get('type') == 'message_with_history':
                # Extract message, history, and session
                user_message = data.get('message', '')
                message_history = data.get('history', [])
                session_id = data.get('session_id', '')
                
                logger.info(f"Received message with history. Session: {session_id}, History length: {len(message_history)}")
                
                if not user_message:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'No message provided'
                    }))
                    continue
                
                # Check if we have a valid session
                if not session_id:
                    session_id = str(uuid.uuid4())
                    await websocket.send(json.dumps({
                        'type': 'session_created',
                        'session_id': session_id
                    }))
                
                # Get context from database
                context = await get_session_data(session_id, 'context')
                if not context:
                    # If no context in session, generate it
                    context = search_database_for_context(user_message, session_id, supabase)
                    await store_session_data(session_id, 'context', context)
                
                # Create realtime client for this message
                openai_client = OpenAIRealtimeClient()
                
                # Update system prompt with context
                if context:
                    retrieval_prompt = RETRIEVAL_PROMPT.format(context=context)
                    system_prompt = f"{SYSTEM_PROMPT}\n\n{retrieval_prompt}"
                else:
                    system_prompt = SYSTEM_PROMPT
                
                # Setup callbacks with the correct event types from the new client
                async def on_delta(event):
                    """Handle delta messages from OpenAI"""
                    delta = event.get('delta', '')
                    buffer = event.get('buffer', '')
                    await websocket.send(json.dumps({
                        'type': 'delta',
                        'delta': delta,
                        'buffer': buffer
                    }))
                
                async def on_complete(event):
                    """Handle completion messages from OpenAI"""
                    message = event.get('message', '')
                    await websocket.send(json.dumps({
                        'type': 'complete',
                        'message': message
                    }))
                
                async def on_error(event):
                    """Handle error messages from OpenAI"""
                    message = event.get('message', '')
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': message
                    }))
                
                # Register callbacks with the correct event types
                openai_client.register_callback("delta", on_delta)
                openai_client.register_callback("complete", on_complete)
                openai_client.register_callback("error", on_error)
                
                # Save the client for cleanup
                clients[client_id] = openai_client
                
                # Connect to OpenAI and send message
                logger.info(f"Connecting to OpenAI for client {client_id}")
                if await openai_client.connect():
                    # Send acknowledgment to client
                    await websocket.send(json.dumps({
                        'type': 'connected',
                        'message': 'Connected to OpenAI'
                    }))
                    
                    # Format message with system instructions
                    formatted_message = f"[SYSTEM INSTRUCTIONS: {system_prompt}]\n\nUSER QUERY: {user_message}"
                    
                    # Send message to OpenAI with history
                    await openai_client.send_message_with_history(formatted_message, message_history)
                    
                    # Start receiving events
                    await openai_client.receive_events()
                else:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Failed to connect to OpenAI'
                    }))
            
            elif data.get('type') == 'ping':
                # Respond to ping with pong
                await websocket.send(json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp', 0)
                }))
    
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Error handling client message: {e}")
    finally:
        # Clean up
        if client_id in clients:
            openai_client = clients[client_id]
            await openai_client.close()
            del clients[client_id]
            logger.info(f"Cleaned up client {client_id}")

async def handle_websocket(websocket):
    """Handle a websocket connection"""
    client_id = str(uuid.uuid4())
    logger.info(f"New client connected: {client_id}")
    
    # Send welcome message
    await websocket.send(json.dumps({
        'type': 'connected',
        'client_id': client_id,
        'message': 'Connected to WebSocket server'
    }))
    
    try:
        await handle_client_message(websocket, client_id)
    except Exception as e:
        logger.error(f"Error handling client {client_id}: {e}")
    finally:
        logger.info(f"Connection closed for client {client_id}")

async def main():
    """Start the WebSocket server"""
    host = os.getenv("WS_HOST", "0.0.0.0")
    # For Render.com compatibility - use PORT if available, otherwise use WEBSOCKET_PORT or default to 8765
    port = int(os.getenv("PORT", os.getenv("WEBSOCKET_PORT", 8765)))
    
    logger.info(f"Starting WebSocket server on {host}:{port}")
    
    # Create SSL context if certificates are provided
    ssl_context = None
    cert_file = os.getenv("SSL_CERT_FILE")
    key_file = os.getenv("SSL_KEY_FILE")
    
    if cert_file and key_file and os.path.exists(cert_file) and os.path.exists(key_file):
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(cert_file, key_file)
        logger.info("SSL context created")
    
    # Set up CORS origins
    cors_origin = os.getenv("CORS_ORIGIN", "https://vehicast-frontend.onrender.com")
    # For local development, use the FRONTEND_PORT from .env if available
    local_frontend_port = os.getenv("FRONTEND_PORT", "3001")
    origins = [
        cors_origin,
        f"http://localhost:{local_frontend_port}"
    ]
    
    # Start server with CORS
    async with websockets.serve(
        handle_websocket, 
        host, 
        port, 
        ssl=ssl_context,
        origins=origins
    ):
        logger.info("WebSocket server started")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server shutting down")
    except Exception as e:
        logger.error(f"Server error: {e}")
        raise 