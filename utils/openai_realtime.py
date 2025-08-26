#!/usr/bin/env python3
"""
OpenAI WebSocket Realtime Client for Chat Streaming

This module provides a client for interacting with OpenAI's text completions API
via WebSockets for real-time streaming of responses.
"""

import json
import asyncio
import logging
import os
import uuid
from openai import OpenAI
from typing import Callable, Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OpenAIRealtimeClient:
    """Client for interacting with OpenAI's API via WebSockets for realtime streaming"""
    
    def __init__(self, api_key=None):
        # WebSocket Configuration
        self.client_id = str(uuid.uuid4())
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY env var or pass as parameter.")
        
        # OpenAI client
        self.client = OpenAI(api_key=self.api_key)
        
        # Event handling
        self.event_handlers = {
            "delta": [],      # For content chunks
            "complete": [],   # For completed response
            "error": []       # For error handling
        }
        
        # Keep track of streaming state
        self.is_streaming = False
        self.message_buffer = ""
        self.message_id = None

        logger.info(f"OpenAI Realtime Client initialized (ID: {self.client_id})")
    
    def register_callback(self, event_type, callback):
        """Register a callback for a specific event type"""
        if event_type not in self.event_handlers:
            raise ValueError(f"Unknown event type: {event_type}. Must be one of: {list(self.event_handlers.keys())}")
        
        self.event_handlers[event_type].append(callback)
        return self
    
    async def connect(self):
        """Initialize the connection to OpenAI API"""
        # For the WebSocket implementation, we don't need to establish a persistent connection
        # since the OpenAI Python SDK handles the connection management
        logger.info(f"Connection ready for client {self.client_id}")
        return True
    
    async def send_event(self, event):
        """
        Process an event by dispatching it to registered handlers
        
        Args:
            event (dict): The event to process
        """
        event_type = event.get("type")
        
        if event_type not in self.event_handlers:
            logger.warning(f"No handlers for event type: {event_type}")
            return
        
        for handler in self.event_handlers[event_type]:
            try:
                await handler(event)
            except Exception as e:
                logger.error(f"Error in event handler for {event_type}: {e}")
    
    async def send_message(self, text):
        """
        Send a message to OpenAI API and stream the response
        
        Args:
            text (str): The message to send
        """
        if self.is_streaming:
            logger.warning("Already streaming a response. Please wait for completion or call close().")
            return
        
        self.is_streaming = True
        self.message_buffer = ""
        self.message_id = str(uuid.uuid4())
        
        try:
            # Check if the message contains system instructions
            system_prompt = "You are a helpful automotive expert assistant."
            user_message = text
            
            # Parse out system instructions if provided in the formatted message
            if text.startswith("[SYSTEM INSTRUCTIONS:"):
                parts = text.split("\n\nUSER QUERY:", 1)
                if len(parts) == 2:
                    system_part = parts[0]
                    user_message = parts[1].strip()
                    
                    # Extract system instructions
                    system_prompt = system_part.replace("[SYSTEM INSTRUCTIONS:", "").replace("]", "").strip()
                    logger.info(f"Using custom system prompt: {system_prompt[:50]}...")
            
            # Create a streaming response from OpenAI
            stream = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using the latest model for best results
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                stream=True
            )
            
            # Process chunks as they arrive
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    self.message_buffer += content
                    
                    # Send delta event
                    await self.send_event({
                        "type": "delta",
                        "delta": content,
                        "buffer": self.message_buffer
                    })
            
            # Send completion event
            await self.send_event({
                "type": "complete",
                "message": self.message_buffer
            })
            
        except Exception as e:
            logger.error(f"Error streaming response: {e}")
            
            # Send error event
            await self.send_event({
                "type": "error",
                "message": f"Error: {str(e)}"
            })
            
        finally:
            self.is_streaming = False
    
    async def send_message_with_history(self, text, message_history):
        """
        Send a message to OpenAI API with conversation history and stream the response
        
        Args:
            text (str): The message to send (formatted with system instructions)
            message_history (list): Message history to include
        """
        if self.is_streaming:
            logger.warning("Already streaming a response. Please wait for completion or call close().")
            return
        
        self.is_streaming = True
        self.message_buffer = ""
        self.message_id = str(uuid.uuid4())
        
        try:
            # Check if the message contains system instructions
            system_prompt = "You are a helpful automotive expert assistant."
            user_message = text
            
            # Parse out system instructions if provided in the formatted message
            if text.startswith("[SYSTEM INSTRUCTIONS:"):
                parts = text.split("\n\nUSER QUERY:", 1)
                if len(parts) == 2:
                    system_part = parts[0]
                    user_message = parts[1].strip()
                    
                    # Extract system instructions
                    system_prompt = system_part.replace("[SYSTEM INSTRUCTIONS:", "").replace("]", "").strip()
                    logger.info(f"Using custom system prompt: {system_prompt[:50]}...")
            
            # Create messages array for OpenAI
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add message history if provided
            if message_history and len(message_history) > 0:
                # Log message history for debugging
                logger.info(f"Received message history with {len(message_history)} messages")
                
                # Check if the last message in history is the current user message
                current_message_in_history = False
                if message_history[-1]["role"] == "user" and message_history[-1]["content"] == user_message:
                    current_message_in_history = True
                    logger.info("Current message already in history")
                
                # Validate history format
                valid_history = []
                for msg in message_history:
                    if isinstance(msg, dict) and "role" in msg and "content" in msg:
                        if msg["role"] in ["user", "assistant", "system"]:
                            valid_history.append(msg)
                        else:
                            logger.warning(f"Invalid role in message: {msg['role']}")
                    else:
                        logger.warning(f"Invalid message format in history: {msg}")
                
                # Use validated history
                messages.extend(valid_history)
                
                # If current message not in history, add it
                if not current_message_in_history:
                    messages.append({"role": "user", "content": user_message})
            else:
                # No history, just add the current message
                messages.append({"role": "user", "content": user_message})
            
            # Log the conversation history being sent
            logger.info(f"Sending conversation with {len(messages)} messages to OpenAI")
            
            # Create a streaming response from OpenAI
            stream = self.client.chat.completions.create(
                model="gpt-4o",  # Using the latest model for best results
                messages=messages,
                stream=True
            )
            
            # Process chunks as they arrive
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    self.message_buffer += content
                    
                    # Send delta event
                    await self.send_event({
                        "type": "delta",
                        "delta": content,
                        "buffer": self.message_buffer
                    })
            
            # Send completion event
            await self.send_event({
                "type": "complete",
                "message": self.message_buffer
            })
            
        except Exception as e:
            logger.error(f"Error streaming response: {e}")
            
            # Send error event
            await self.send_event({
                "type": "error",
                "message": f"Error: {str(e)}"
            })
            
        finally:
            self.is_streaming = False
    
    async def receive_events(self):
        """
        Placeholder for receiving events from the client
        For the OpenAI implementation, this is handled through the streaming API
        """
        pass
    
    async def handle_event(self, event):
        """
        Handle incoming events from the client
        
        Args:
            event (dict): The event to handle
        """
        event_type = event.get("type")
        
        if event_type == "message":
            # Client sent a message, process it and generate a response
            message = event.get("text", "")
            if message:
                await self.send_message(message)
            else:
                await self.send_event({
                    "type": "error",
                    "message": "Empty message received"
                })
        
        elif event_type == "ping":
            # Respond to ping with pong
            await self.send_event({
                "type": "pong",
                "timestamp": event.get("timestamp", 0)
            })
        
        else:
            logger.warning(f"Unknown event type: {event_type}")
    
    async def close(self):
        """Close the connection gracefully"""
        self.is_streaming = False
        logger.info(f"Connection closed for client {self.client_id}")
        return True

async def create_streaming_response(user_message, on_delta=None, on_complete=None, on_error=None):
    """
    Create a streaming response for a user message
    
    Args:
        user_message (str): The user's message
        on_delta (callable): Callback for content chunks
        on_complete (callable): Callback for completed response
        on_error (callable): Callback for errors
    
    Returns:
        OpenAIRealtimeClient: The client instance
    """
    try:
        client = OpenAIRealtimeClient()
        
        # Register callbacks if provided
        if on_delta:
            client.register_callback("delta", on_delta)
        
        if on_complete:
            client.register_callback("complete", on_complete)
        
        if on_error:
            client.register_callback("error", on_error)
        
        # Connect to OpenAI
        await client.connect()
        
        # Send message to initiate streaming
        await client.send_message(user_message)
        
        return client
    
    except Exception as e:
        logger.error(f"Error creating streaming response: {e}")
        if on_error:
            await on_error({"type": "error", "message": str(e)})
        raise 