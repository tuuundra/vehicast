#!/usr/bin/env python3
"""
Documentation Embeddings Generator

This script processes the project documentation, splits it into chunks,
and generates embeddings for each chunk to enable semantic search.
"""

import os
import re
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from utils.database import connect_to_supabase

# Load environment variables with override to ensure .env values take precedence
load_dotenv(override=True)

# Get OpenAI API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Initialize OpenAI client
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

def chunk_documentation(doc_path, chunk_size=1000, overlap=200):
    """
    Split documentation into overlapping chunks.
    
    Args:
        doc_path (str): Path to documentation file
        chunk_size (int): Size of each chunk in characters
        overlap (int): Overlap between chunks in characters
        
    Returns:
        list: List of document chunks with metadata
    """
    try:
        # Read documentation file
        with open(doc_path, 'r') as f:
            content = f.read()
        
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
            section_match = re.search(r'#+\s+(.+)', chunk)
            section_title = section_match.group(1) if section_match else "Documentation Section"
            
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
        
        return chunks
    
    except Exception as e:
        print(f"Error chunking documentation: {str(e)}")
        return []

def create_documentation_table(supabase):
    """
    Create documentation embeddings table in Supabase if it doesn't exist.
    
    Args:
        supabase: Supabase client
        
    Returns:
        bool: Success status
    """
    try:
        # Check if table exists
        response = supabase.table('documentation_embeddings').select('chunk_id').limit(1).execute()
        
        # If we get here, table exists
        print("Documentation embeddings table already exists")
        return True
    
    except Exception:
        # Table doesn't exist, create it
        print("Creating documentation embeddings table...")
        
        # SQL to create table
        sql = """
        CREATE TABLE IF NOT EXISTS documentation_embeddings (
            chunk_id SERIAL PRIMARY KEY,
            section_title TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding VECTOR(1536),
            embedding_model TEXT NOT NULL
        );
        
        -- Create index for vector similarity search
        CREATE INDEX IF NOT EXISTS documentation_embeddings_embedding_idx 
        ON documentation_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        
        -- Create function for matching documentation
        CREATE OR REPLACE FUNCTION match_documentation(
            query_embedding VECTOR(1536),
            match_threshold FLOAT,
            match_count INT
        )
        RETURNS TABLE (
            chunk_id INT,
            section_title TEXT,
            content TEXT,
            similarity FLOAT
        )
        LANGUAGE plpgsql
        AS $$
        BEGIN
            RETURN QUERY
            SELECT
                d.chunk_id,
                d.section_title,
                d.content,
                1 - (d.embedding <=> query_embedding) AS similarity
            FROM
                documentation_embeddings d
            WHERE
                1 - (d.embedding <=> query_embedding) > match_threshold
            ORDER BY
                d.embedding <=> query_embedding
            LIMIT match_count;
        END;
        $$;
        """
        
        # Execute SQL
        response = supabase.rpc('run_query', {'query': sql}).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error creating table: {response.error}")
            return False
        
        print("Documentation embeddings table created successfully")
        return True

def process_documentation(supabase, doc_path='project_documentation.txt'):
    """
    Process documentation file and store embeddings in Supabase.
    
    Args:
        supabase: Supabase client
        doc_path (str): Path to documentation file
        
    Returns:
        int: Number of chunks processed
    """
    # Create table if it doesn't exist
    if not create_documentation_table(supabase):
        return 0
    
    # Chunk documentation
    print(f"Chunking documentation from {doc_path}...")
    chunks = chunk_documentation(doc_path)
    
    if not chunks:
        print("No chunks generated")
        return 0
    
    print(f"Generated {len(chunks)} chunks")
    
    # Generate embeddings and store in Supabase
    print("Generating embeddings and storing in Supabase...")
    
    # Clear existing embeddings
    supabase.table('documentation_embeddings').delete().neq('chunk_id', 0).execute()
    
    # Process each chunk
    for chunk in chunks:
        # Generate embedding
        embedding = get_embedding(chunk['content'])
        
        if not embedding:
            print(f"Failed to generate embedding for chunk {chunk['chunk_id']}")
            continue
        
        # Store in Supabase
        response = supabase.table('documentation_embeddings').insert({
            'section_title': chunk['section_title'],
            'content': chunk['content'],
            'embedding': embedding,
            'embedding_model': EMBEDDING_MODEL
        }).execute()
        
        if hasattr(response, 'error') and response.error:
            print(f"Error storing chunk {chunk['chunk_id']}: {response.error}")
    
    print(f"Processed {len(chunks)} documentation chunks")
    return len(chunks)

def main():
    """Main function to process documentation and generate embeddings."""
    
    print("======== Documentation Embeddings Generator ========")
    
    # Connect to Supabase
    print("Connecting to Supabase...")
    supabase = connect_to_supabase()
    print("Connection successful!")
    
    # Process documentation
    doc_path = 'project_documentation.txt'
    if not os.path.exists(doc_path):
        print(f"Error: Documentation file {doc_path} not found")
        return 1
    
    # Process documentation
    num_chunks = process_documentation(supabase, doc_path)
    
    if num_chunks > 0:
        print(f"Successfully processed {num_chunks} documentation chunks")
        print("Documentation embeddings are now ready for RAG")
        return 0
    else:
        print("Failed to process documentation")
        return 1

if __name__ == "__main__":
    exit(main()) 