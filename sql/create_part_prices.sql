-- Create Part Prices Tables and Embeddings for Automotive Algorithm Project
-- This script creates tables for storing pricing information for parts and vector embeddings for semantic search

-- Enable the vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Part Prices Table
CREATE TABLE IF NOT EXISTS part_prices (
    price_id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(part_id) ON DELETE CASCADE,
    base_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    retail_price DECIMAL(10,2),
    manufacturer_suggested_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a unique constraint to ensure only one current price per part
CREATE UNIQUE INDEX idx_unique_current_price ON part_prices (part_id) WHERE is_current = TRUE;

-- Create a trigger to ensure only one current price per part
CREATE OR REPLACE FUNCTION ensure_single_current_price()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        UPDATE part_prices 
        SET is_current = FALSE 
        WHERE part_id = NEW.part_id 
          AND price_id != NEW.price_id 
          AND is_current = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_current_price_trigger
BEFORE INSERT OR UPDATE ON part_prices
FOR EACH ROW
EXECUTE FUNCTION ensure_single_current_price();

-- Part Price Embeddings Table
CREATE TABLE IF NOT EXISTS part_price_embeddings (
    id SERIAL PRIMARY KEY,
    price_id INTEGER NOT NULL REFERENCES part_prices(price_id) ON DELETE CASCADE,
    embedding_model VARCHAR(50) NOT NULL, -- e.g., 'text-embedding-3-small'
    embedding vector(1536) NOT NULL,
    description TEXT NOT NULL, -- The text that was embedded (includes price and part information)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create appropriate indexes for vector search
CREATE INDEX ON part_price_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create a function to search part prices by semantic similarity
CREATE OR REPLACE FUNCTION match_part_prices(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    id BIGINT,
    price_id BIGINT,
    part_id BIGINT,
    part_name TEXT,
    quality TEXT,
    price DECIMAL(10,2),
    description TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ppe.id::BIGINT,
        ppe.price_id::BIGINT,
        pp.part_id::BIGINT,
        p.part_name::TEXT,
        pp.quality::TEXT,
        pp.retail_price AS price,
        ppe.description::TEXT,
        (1 - (ppe.embedding <=> query_embedding))::FLOAT AS similarity
    FROM 
        part_price_embeddings ppe
        JOIN part_prices pp ON ppe.price_id = pp.price_id
        JOIN parts p ON pp.part_id = p.part_id
    WHERE 
        1 - (ppe.embedding <=> query_embedding) > match_threshold
        AND pp.is_current = TRUE
    ORDER BY 
        similarity DESC
    LIMIT match_count;
END;
$$;

-- Update the search_all_entities function to include part prices
CREATE OR REPLACE FUNCTION search_all_entities_with_prices(
    query_embedding vector(1536),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
) RETURNS TABLE (
    entity_type TEXT,
    entity_id INTEGER,
    description TEXT,
    price DECIMAL(10,2),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY (
        -- Search vehicle types (no price)
        SELECT 
            'vehicle_type' AS entity_type,
            vte.type_id AS entity_id,
            vte.description,
            NULL::DECIMAL(10,2) AS price,
            1 - (vte.embedding <=> query_embedding) AS similarity
        FROM 
            vehicle_type_embeddings vte
        WHERE 1 - (vte.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search components (no price)
        SELECT 
            'component' AS entity_type,
            ce.component_id AS entity_id,
            ce.description,
            NULL::DECIMAL(10,2) AS price,
            1 - (ce.embedding <=> query_embedding) AS similarity
        FROM 
            component_embeddings ce
        WHERE 1 - (ce.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search parts with prices
        SELECT 
            'part' AS entity_type,
            pp.part_id AS entity_id,
            ppe.description,
            pp.retail_price AS price,
            1 - (ppe.embedding <=> query_embedding) AS similarity
        FROM 
            part_price_embeddings ppe
            JOIN part_prices pp ON ppe.price_id = pp.price_id
        WHERE 
            1 - (ppe.embedding <=> query_embedding) >= similarity_threshold
            AND pp.is_current = TRUE
        
        UNION ALL
        
        -- Search vehicles (no price)
        SELECT 
            'vehicle' AS entity_type,
            ve.vehicle_id AS entity_id,
            ve.description,
            NULL::DECIMAL(10,2) AS price,
            1 - (ve.embedding <=> query_embedding) AS similarity
        FROM 
            vehicle_embeddings ve
        WHERE 1 - (ve.embedding <=> query_embedding) >= similarity_threshold
        
        UNION ALL
        
        -- Search failure descriptions (no price)
        SELECT 
            'failure' AS entity_type,
            fde.component_id AS entity_id,
            fde.symptom_description AS description,
            NULL::DECIMAL(10,2) AS price,
            1 - (fde.embedding <=> query_embedding) AS similarity
        FROM 
            failure_description_embeddings fde
        WHERE 1 - (fde.embedding <=> query_embedding) >= similarity_threshold
        
        ORDER BY similarity DESC
        LIMIT max_results
    );
END;
$$ LANGUAGE plpgsql;

-- Create an index on part_id in part_prices for efficient retrieval
CREATE INDEX idx_part_prices_part_id ON part_prices(part_id);

-- Create an index on part_id and is_current for efficient current price lookup
CREATE INDEX idx_part_prices_current ON part_prices(part_id, is_current) WHERE is_current = TRUE;

-- Comments on usage:
-- 1. First insert base pricing data into part_prices table
-- 2. Generate embeddings for parts with their prices and add to part_price_embeddings
-- 3. Use match_part_prices function for semantic search of parts with prices
-- 4. Use search_all_entities_with_prices for cross-entity search including prices 