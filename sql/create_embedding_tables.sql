-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Vehicle Type Embeddings
CREATE TABLE IF NOT EXISTS vehicle_type_embeddings (
    id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES vehicle_types(type_id),
    description TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Component Embeddings
CREATE TABLE IF NOT EXISTS component_embeddings (
    id SERIAL PRIMARY KEY,
    component_id INTEGER REFERENCES components(component_id),
    description TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Part Embeddings
CREATE TABLE IF NOT EXISTS part_embeddings (
    id SERIAL PRIMARY KEY,
    part_id INTEGER REFERENCES parts(part_id),
    description TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle Embeddings
CREATE TABLE IF NOT EXISTS vehicle_embeddings (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(vehicle_id),
    description TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Failure Description Embeddings
CREATE TABLE IF NOT EXISTS failure_description_embeddings (
    id SERIAL PRIMARY KEY,
    component_id INTEGER REFERENCES components(component_id),
    description TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search functions for each embedding table
CREATE OR REPLACE FUNCTION match_vehicle_types(query_embedding vector(1536), match_threshold float, match_count int)
RETURNS TABLE(
    id bigint,
    type_id bigint,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        vte.id::bigint,
        vte.type_id::bigint,
        vte.description,
        1 - (vte.embedding <=> query_embedding) AS similarity
    FROM vehicle_type_embeddings vte
    WHERE 1 - (vte.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_components(query_embedding vector(1536), match_threshold float, match_count int)
RETURNS TABLE(
    id bigint,
    component_id bigint,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id::bigint,
        ce.component_id::bigint,
        ce.description,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM component_embeddings ce
    WHERE 1 - (ce.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_parts(query_embedding vector(1536), match_threshold float, match_count int)
RETURNS TABLE(
    id bigint,
    part_id bigint,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.id::bigint,
        pe.part_id::bigint,
        pe.description,
        1 - (pe.embedding <=> query_embedding) AS similarity
    FROM part_embeddings pe
    WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_vehicles(query_embedding vector(1536), match_threshold float, match_count int)
RETURNS TABLE(
    id bigint,
    vehicle_id bigint,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ve.id::bigint,
        ve.vehicle_id::bigint,
        ve.description,
        1 - (ve.embedding <=> query_embedding) AS similarity
    FROM vehicle_embeddings ve
    WHERE 1 - (ve.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION match_failure_descriptions(query_embedding vector(1536), match_threshold float, match_count int)
RETURNS TABLE(
    id bigint,
    component_id bigint,
    description text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        fde.id::bigint,
        fde.component_id::bigint,
        fde.description,
        1 - (fde.embedding <=> query_embedding) AS similarity
    FROM failure_description_embeddings fde
    WHERE 1 - (fde.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;

-- Create a function to run arbitrary SQL queries (if needed)
CREATE OR REPLACE FUNCTION run_query(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$; 