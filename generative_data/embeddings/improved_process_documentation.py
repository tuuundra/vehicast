#!/usr/bin/env python3
"""
Improved Documentation Processing Script

This script processes the project documentation with enhanced error handling,
rate limiting, and progress tracking.
"""

import os
import sys
import time
import json
import traceback
from datetime import datetime
from utils.database import connect_to_supabase
from dotenv import load_dotenv
from openai import OpenAI, RateLimitError

# Load environment variables with override to ensure .env values take precedence
load_dotenv(override=True)

# Get OpenAI API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("Error: OPENAI_API_KEY not found in environment variables")
    sys.exit(1)

# Initialize OpenAI client with timeout
client = OpenAI(api_key=api_key, timeout=60.0)  # 60 second timeout

# Embedding model to use
EMBEDDING_MODEL = "text-embedding-3-small"

# Progress tracking file
PROGRESS_FILE = "embedding_progress.json"

def log_message(message, level="INFO"):
    """Log a message with timestamp."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def save_progress(processed_chunks):
    """Save progress to a file."""
    try:
        with open(PROGRESS_FILE, 'w') as f:
            json.dump({"processed_chunks": processed_chunks}, f)
        log_message(f"Progress saved: {len(processed_chunks)} chunks processed")
    except Exception as e:
        log_message(f"Error saving progress: {str(e)}", "ERROR")

def load_progress():
    """Load progress from a file."""
    if not os.path.exists(PROGRESS_FILE):
        return []
    
    try:
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
            log_message(f"Progress loaded: {len(data.get('processed_chunks', []))} chunks previously processed")
            return data.get('processed_chunks', [])
    except Exception as e:
        log_message(f"Error loading progress: {str(e)}", "ERROR")
        return []

def get_embedding_with_retry(text, max_retries=5, backoff_factor=2):
    """Get embedding for a text using OpenAI's API with retry logic."""
    retries = 0
    while retries <= max_retries:
        try:
            # Replace newlines with spaces
            text = text.replace("\n", " ")
            
            log_message(f"Requesting embedding (attempt {retries+1}/{max_retries+1})...")
            start_time = time.time()
            
            response = client.embeddings.create(
                input=[text],
                model=EMBEDDING_MODEL
            )
            
            elapsed = time.time() - start_time
            log_message(f"Embedding received in {elapsed:.2f} seconds")
            
            # Return the embedding vector
            return response.data[0].embedding
        except RateLimitError:
            wait_time = backoff_factor ** retries
            log_message(f"Rate limit exceeded. Waiting {wait_time} seconds...", "WARNING")
            time.sleep(wait_time)
            retries += 1
        except Exception as e:
            log_message(f"Error getting embedding: {str(e)}", "ERROR")
            log_message(traceback.format_exc(), "DEBUG")
            
            # If we've hit a timeout or connection error, wait longer
            if "timeout" in str(e).lower() or "connection" in str(e).lower():
                wait_time = 30 + (backoff_factor ** retries)
                log_message(f"Connection issue detected. Waiting {wait_time} seconds...", "WARNING")
                time.sleep(wait_time)
            
            retries += 1
    
    log_message(f"Failed to get embedding after {max_retries} retries", "ERROR")
    return None

def chunk_documentation(doc_path, chunk_size=1000, overlap=200):
    """Split documentation into overlapping chunks."""
    try:
        # Read documentation file
        with open(doc_path, 'r') as f:
            content = f.read()
        
        log_message(f"Read documentation file: {len(content)} characters")
        
        # Split content into chunks
        chunks = []
        
        # Get total length
        total_len = len(content)
        
        # Create chunks with overlap
        for i in range(0, total_len, chunk_size - overlap):
            # Get chunk
            chunk_end = min(i + chunk_size, total_len)
            chunk = content[i:chunk_end]
            
            # Extract section title if possible
            section_match = chunk.split("\n", 1)[0] if "\n" in chunk else chunk[:50]
            section_title = section_match.strip("# ")[:100]  # Limit title length
            
            # Add chunk with metadata
            chunks.append({
                'chunk_id': len(chunks) + 1,
                'content': chunk,
                'section_title': section_title,
                'start_char': i,
                'end_char': chunk_end
            })
            
            # Stop if we've reached the end
            if chunk_end == total_len:
                break
        
        log_message(f"Created {len(chunks)} chunks")
        return chunks
    
    except Exception as e:
        log_message(f"Error chunking documentation: {str(e)}", "ERROR")
        log_message(traceback.format_exc(), "DEBUG")
        return []

def get_processed_chunks(supabase):
    """Get list of chunk IDs that have already been processed."""
    try:
        log_message("Fetching processed chunks from database...")
        response = supabase.table('documentation_embeddings').select('chunk_id').execute()
        if hasattr(response, 'data'):
            chunk_ids = [item['chunk_id'] for item in response.data]
            log_message(f"Found {len(chunk_ids)} chunks in database")
            return chunk_ids
        return []
    except Exception as e:
        log_message(f"Error getting processed chunks: {str(e)}", "ERROR")
        log_message(traceback.format_exc(), "DEBUG")
        return []

def process_documentation(supabase, doc_path='project_documentation.txt'):
    """Process documentation file and store embeddings in Supabase."""
    # Check if table exists
    try:
        supabase.table('documentation_embeddings').select('chunk_id').limit(1).execute()
        log_message("Documentation embeddings table exists")
    except Exception as e:
        log_message(f"Error checking table: {str(e)}", "ERROR")
        log_message("Documentation embeddings table doesn't exist. Please run the SQL script first.")
        return 0
    
    # Chunk documentation
    log_message(f"Chunking documentation from {doc_path}...")
    chunks = chunk_documentation(doc_path)
    
    if not chunks:
        log_message("No chunks generated", "ERROR")
        return 0
    
    log_message(f"Generated {len(chunks)} chunks")
    
    # Get already processed chunks from database
    db_processed_chunks = get_processed_chunks(supabase)
    
    # Get locally saved progress
    local_processed_chunks = load_progress()
    
    # Combine both sources of processed chunks
    processed_chunk_ids = list(set(db_processed_chunks + local_processed_chunks))
    log_message(f"Found {len(processed_chunk_ids)} already processed chunks")
    
    # Filter out already processed chunks
    chunks_to_process = [chunk for chunk in chunks if chunk['chunk_id'] not in processed_chunk_ids]
    log_message(f"Processing {len(chunks_to_process)} new chunks")
    
    # Process each chunk
    successful_chunks = 0
    for i, chunk in enumerate(chunks_to_process):
        chunk_id = chunk['chunk_id']
        log_message(f"Processing chunk {chunk_id} ({i+1}/{len(chunks_to_process)})...")
        
        try:
            # Generate embedding with retry logic
            embedding = get_embedding_with_retry(chunk['content'])
            
            if not embedding:
                log_message(f"Failed to generate embedding for chunk {chunk_id}", "ERROR")
                continue
            
            # Store in Supabase
            log_message(f"Storing chunk {chunk_id} in database...")
            response = supabase.table('documentation_embeddings').insert({
                'chunk_id': chunk_id,
                'section_title': chunk['section_title'],
                'content': chunk['content'],
                'embedding': embedding,
                'embedding_model': EMBEDDING_MODEL
            }).execute()
            
            if hasattr(response, 'error') and response.error:
                log_message(f"Error storing chunk {chunk_id}: {response.error}", "ERROR")
            else:
                successful_chunks += 1
                processed_chunk_ids.append(chunk_id)
                save_progress(processed_chunk_ids)
                log_message(f"Successfully stored chunk {chunk_id}")
        except Exception as e:
            log_message(f"Exception processing chunk {chunk_id}: {str(e)}", "ERROR")
            log_message(traceback.format_exc(), "DEBUG")
        
        # Add a delay between API calls to avoid rate limits
        delay = 1.0  # Increased delay to 1 second
        log_message(f"Waiting {delay} seconds before next chunk...")
        time.sleep(delay)
    
    total_processed = len(db_processed_chunks) + successful_chunks
    log_message(f"Processed {successful_chunks} new chunks")
    log_message(f"Total chunks in database: {total_processed}/{len(chunks)}")
    return successful_chunks

def main():
    """Main function to process documentation and generate embeddings."""
    
    log_message("======== Improved Documentation Processing for RAG ========")
    
    # Check if documentation file exists
    doc_path = 'project_documentation.txt'
    if not os.path.exists(doc_path):
        log_message(f"Error: Documentation file {doc_path} not found", "ERROR")
        return 1
    
    # Connect to Supabase
    log_message("Connecting to Supabase...")
    try:
        supabase = connect_to_supabase()
        log_message("Connection successful!")
    except Exception as e:
        log_message(f"Error connecting to Supabase: {str(e)}", "ERROR")
        log_message(traceback.format_exc(), "DEBUG")
        return 1
    
    # Process documentation
    log_message(f"Processing documentation from {doc_path}...")
    num_chunks = process_documentation(supabase, doc_path)
    
    if num_chunks > 0:
        log_message(f"\nSuccess! Processed {num_chunks} new documentation chunks")
        log_message("The chat assistant can now answer questions about the project implementation")
        log_message("\nTry asking questions like:")
        log_message("- How does the time-based prediction system work?")
        log_message("- What is the database schema for the project?")
        log_message("- How are vector embeddings used in the system?")
        log_message("- What machine learning models are used for failure prediction?")
        return 0
    else:
        log_message("No new chunks were processed", "WARNING")
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log_message("Process interrupted by user", "WARNING")
        sys.exit(130)
    except Exception as e:
        log_message(f"Unhandled exception: {str(e)}", "ERROR")
        log_message(traceback.format_exc(), "DEBUG")
        sys.exit(1) 