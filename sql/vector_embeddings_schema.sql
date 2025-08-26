-- Vector Embeddings Schema for Automotive Algorithm Project
-- This script creates tables for storing vector embeddings for semantic search and LLM integration

-- Enable the vector extension if using pgvector (uncomment if you're using pgvector)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Vehicle Type Embeddings
CREATE TABLE IF NOT EXISTS vehicle_type_embeddings (
    id SERIAL PRIMARY KEY,
    type_id INTEGER NOT NULL REFERENCES vehicle_types(type_id) ON DELETE CASCADE,
    embedding_model VARCHAR(50) NOT NULL, -- e.g., 'text-embedding-3-small'
    embedding JSONB NOT NULL, -- Store as JSONB for flexibility, can be changed to vector type if using pgvector
    description TEXT NOT NULL, -- The text that was embedded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type_id, embedding_model) -- Only one embedding per model per vehicle type
);

-- Component Embeddings
CREATE TABLE IF NOT EXISTS component_embeddings (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES components(component_id) ON DELETE CASCADE,
    embedding_model VARCHAR(50) NOT NULL,
    embedding JSONB NOT NULL,
    description TEXT NOT NULL, -- The text that was embedded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(component_id, embedding_model)
);

-- Part Embeddings (may already exist in your schema)
CREATE TABLE IF NOT EXISTS part_embeddings (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(part_id) ON DELETE CASCADE,
    embedding_model VARCHAR(50) NOT NULL,
    embedding JSONB NOT NULL,
    description TEXT NOT NULL, -- The text that was embedded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(part_id, embedding_model)
);

-- Vehicle Embeddings (for specific vehicle instances)
CREATE TABLE IF NOT EXISTS vehicle_embeddings (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
    embedding_model VARCHAR(50) NOT NULL,
    embedding JSONB NOT NULL,
    description TEXT NOT NULL, -- The text that was embedded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vehicle_id, embedding_model)
);

-- Failure Description Embeddings
CREATE TABLE IF NOT EXISTS failure_description_embeddings (
    id SERIAL PRIMARY KEY,
    component_id INTEGER NOT NULL REFERENCES components(component_id) ON DELETE CASCADE,
    symptom_description TEXT NOT NULL, -- Description of the failure symptom
    embedding_model VARCHAR(50) NOT NULL,
    embedding JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- If using pgvector, create appropriate indexes (uncomment if using pgvector)
-- CREATE INDEX ON vehicle_type_embeddings USING ivfflat (embedding vector_cosine_ops);
-- CREATE INDEX ON component_embeddings USING ivfflat (embedding vector_cosine_ops);
-- CREATE INDEX ON part_embeddings USING ivfflat (embedding vector_cosine_ops);
-- CREATE INDEX ON vehicle_embeddings USING ivfflat (embedding vector_cosine_ops);
-- CREATE INDEX ON failure_description_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create a helper function to search across all embedding tables
-- This is a placeholder - the actual implementation would depend on your specific needs
CREATE OR REPLACE FUNCTION search_all_entities(
    query_embedding JSONB,
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
) RETURNS TABLE (
    entity_type TEXT,
    entity_id INTEGER,
    description TEXT,
    similarity FLOAT
) AS $$
BEGIN
    -- This is a simplified example that would need to be adapted based on
    -- whether you're using pgvector or another method for similarity calculation
    RETURN QUERY (
        -- Search vehicle types
        SELECT 
            'vehicle_type' AS entity_type,
            vte.type_id AS entity_id,
            vte.description,
            0.0 AS similarity -- Replace with actual similarity calculation
        FROM 
            vehicle_type_embeddings vte
        WHERE 0.0 >= similarity_threshold -- Replace with actual similarity calculation
        
        UNION ALL
        
        -- Search components
        SELECT 
            'component' AS entity_type,
            ce.component_id AS entity_id,
            ce.description,
            0.0 AS similarity -- Replace with actual similarity calculation
        FROM 
            component_embeddings ce
        WHERE 0.0 >= similarity_threshold -- Replace with actual similarity calculation
        
        UNION ALL
        
        -- Search parts
        SELECT 
            'part' AS entity_type,
            pe.part_id AS entity_id,
            pe.description,
            0.0 AS similarity -- Replace with actual similarity calculation
        FROM 
            part_embeddings pe
        WHERE 0.0 >= similarity_threshold -- Replace with actual similarity calculation
        
        UNION ALL
        
        -- Search vehicles
        SELECT 
            'vehicle' AS entity_type,
            ve.vehicle_id AS entity_id,
            ve.description,
            0.0 AS similarity -- Replace with actual similarity calculation
        FROM 
            vehicle_embeddings ve
        WHERE 0.0 >= similarity_threshold -- Replace with actual similarity calculation
        
        UNION ALL
        
        -- Search failure descriptions
        SELECT 
            'failure' AS entity_type,
            fde.component_id AS entity_id,
            fde.symptom_description AS description,
            0.0 AS similarity -- Replace with actual similarity calculation
        FROM 
            failure_description_embeddings fde
        WHERE 0.0 >= similarity_threshold -- Replace with actual similarity calculation
        
        ORDER BY similarity DESC
        LIMIT max_results
    );
END;
$$ LANGUAGE plpgsql;

-- Comments on usage:
-- 1. If using pgvector, uncomment the CREATE EXTENSION and INDEX lines
-- 2. The similarity calculation in the search_all_entities function needs to be 
--    implemented based on your vector similarity approach
-- 3. The JSONB type for embeddings can be changed to vector type if using pgvector 