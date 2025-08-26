-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- For tables that don't have data yet, we can simply alter the column type
-- For tables with existing data, we need a more complex conversion

-- Update vehicle_type_embeddings
ALTER TABLE vehicle_type_embeddings 
  ALTER COLUMN embedding TYPE vector(1536) USING (embedding::text::vector(1536));
CREATE INDEX ON vehicle_type_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Update component_embeddings
ALTER TABLE component_embeddings 
  ALTER COLUMN embedding TYPE vector(1536) USING (embedding::text::vector(1536));
CREATE INDEX ON component_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Update part_embeddings
-- If this table already has data in JSONB format, we need to handle it carefully
-- First, check if there's data
DO $$
DECLARE
    row_count integer;
BEGIN
    SELECT COUNT(*) INTO row_count FROM part_embeddings;
    
    IF row_count > 0 THEN
        -- If there's data, we need to create a new column, convert the data, and then rename
        ALTER TABLE part_embeddings ADD COLUMN embedding_vector vector(1536);
        
        -- Update the new column with converted values
        -- This assumes the JSONB is an array that can be converted to text and then to vector
        UPDATE part_embeddings SET embedding_vector = embedding::text::vector(1536);
        
        -- Drop the old column and rename the new one
        ALTER TABLE part_embeddings DROP COLUMN embedding;
        ALTER TABLE part_embeddings RENAME COLUMN embedding_vector TO embedding;
    ELSE
        -- If no data, simply alter the column type
        ALTER TABLE part_embeddings ALTER COLUMN embedding TYPE vector(1536) USING (embedding::text::vector(1536));
    END IF;
END $$;

CREATE INDEX ON part_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Update vehicle_embeddings
ALTER TABLE vehicle_embeddings 
  ALTER COLUMN embedding TYPE vector(1536) USING (embedding::text::vector(1536));
CREATE INDEX ON vehicle_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Update failure_description_embeddings
ALTER TABLE failure_description_embeddings 
  ALTER COLUMN embedding TYPE vector(1536) USING (embedding::text::vector(1536));
CREATE INDEX ON failure_description_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Update the search function to use vector operations
CREATE OR REPLACE FUNCTION search_all_entities(
    query_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
) RETURNS TABLE (
    entity_type TEXT,
    entity_id INTEGER,
    description TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY (
        -- Search vehicle types
        SELECT 
            'vehicle_type' AS entity_type,
            vte.type_id AS entity_id,
            vte.description,
            1 - (vte.embedding <=> query_embedding) AS similarity
        FROM 
            vehicle_type_embeddings vte
        WHERE 1 - (vte.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search components
        SELECT 
            'component' AS entity_type,
            ce.component_id AS entity_id,
            ce.description,
            1 - (ce.embedding <=> query_embedding) AS similarity
        FROM 
            component_embeddings ce
        WHERE 1 - (ce.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search parts
        SELECT 
            'part' AS entity_type,
            pe.part_id AS entity_id,
            pe.description,
            1 - (pe.embedding <=> query_embedding) AS similarity
        FROM 
            part_embeddings pe
        WHERE 1 - (pe.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search vehicles
        SELECT 
            'vehicle' AS entity_type,
            ve.vehicle_id AS entity_id,
            ve.description,
            1 - (ve.embedding <=> query_embedding) AS similarity
        FROM 
            vehicle_embeddings ve
        WHERE 1 - (ve.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search failure descriptions
        SELECT 
            'failure' AS entity_type,
            fde.component_id AS entity_id,
            fde.symptom_description AS description,
            1 - (fde.embedding <=> query_embedding) AS similarity
        FROM 
            failure_description_embeddings fde
        WHERE 1 - (fde.embedding <=> query_embedding) >= similarity_threshold
        
        ORDER BY similarity DESC
        LIMIT max_results
    );
END;
$$ LANGUAGE plpgsql; 