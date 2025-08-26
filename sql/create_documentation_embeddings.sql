-- Create documentation embeddings table for RAG
-- This table stores chunks of project documentation with vector embeddings for semantic search

-- Create the table if it doesn't exist
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