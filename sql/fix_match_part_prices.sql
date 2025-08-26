-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS match_part_prices;

-- Create the corrected function with proper data types and schema alignment
CREATE OR REPLACE FUNCTION match_part_prices(
    query_embedding vector,
    match_threshold double precision DEFAULT 0.7,
    match_count integer DEFAULT 10
)
RETURNS TABLE(
    id integer,
    price_id integer,
    part_id integer,
    part_name text,
    price numeric,
    description text,
    similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ppe.id,
        ppe.price_id,
        pp.part_id,
        p.part_name::text,
        pp.retail_price AS price,
        ppe.description,
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