#!/usr/bin/env python3
"""
Documentation Processing Script

This script processes the project documentation, creates embeddings,
and stores them in Supabase for RAG-powered chat assistance.
"""

import os
import sys
from utils.documentation_embeddings import process_documentation
from utils.database import connect_to_supabase

def main():
    """Main function to process documentation and generate embeddings."""
    
    print("======== Documentation Processing for RAG ========")
    
    # Check if documentation file exists
    doc_path = 'project_documentation.txt'
    if not os.path.exists(doc_path):
        print(f"Error: Documentation file {doc_path} not found")
        return 1
    
    # Connect to Supabase
    print("Connecting to Supabase...")
    try:
        supabase = connect_to_supabase()
        print("Connection successful!")
    except Exception as e:
        print(f"Error connecting to Supabase: {str(e)}")
        return 1
    
    # Process documentation
    print(f"Processing documentation from {doc_path}...")
    num_chunks = process_documentation(supabase, doc_path)
    
    if num_chunks > 0:
        print(f"\nSuccess! Processed {num_chunks} documentation chunks")
        print("The chat assistant can now answer questions about the project implementation")
        print("\nTry asking questions like:")
        print("- How does the time-based prediction system work?")
        print("- What is the database schema for the project?")
        print("- How are vector embeddings used in the system?")
        print("- What machine learning models are used for failure prediction?")
        return 0
    else:
        print("Failed to process documentation")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 