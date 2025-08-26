-- Vector search function for querying across all entity types
-- This function uses pgvector's cosine similarity operator (<=>)
-- to find the most similar entities across all embedding tables

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

-- Example usage:
-- SELECT * FROM search_all_entities(
--     '[0.1, 0.2, ..., 0.3]'::vector(1536),
--     0.7,
--     10
-- );

-- Notes:
-- 1. The query_embedding parameter should be a vector of the same dimension as your stored embeddings
-- 2. The similarity_threshold parameter (0.0 to 1.0) filters results by similarity score
-- 3. The max_results parameter limits the total number of results returned
-- 4. The function returns entity_type, entity_id, description, and similarity score
-- 5. The similarity score is calculated as 1 - cosine distance (higher is more similar) 