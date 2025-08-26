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
