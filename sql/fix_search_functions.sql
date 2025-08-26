-- Fix for match_documentation function
DO $$
BEGIN
    -- Drop the function if it exists
    DROP FUNCTION IF EXISTS public.match_documentation(vector, float, int);
    
    -- Create the function with the correct return type
    CREATE OR REPLACE FUNCTION public.match_documentation(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        chunk_id integer,  -- Changed from bigint to integer to match original
        section_title text,
        content text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;
END
$$;

-- Fix for all other functions
DO $$
BEGIN
    -- 1. ensure_single_current_price - Modify in place without dropping due to trigger dependency
    CREATE OR REPLACE FUNCTION public.ensure_single_current_price()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
        IF NEW.is_current = TRUE THEN
            UPDATE part_prices 
            SET is_current = FALSE 
            WHERE part_id = NEW.part_id 
              AND price_id != NEW.price_id 
              AND is_current = TRUE;
        END IF;
        RETURN NEW;
    END;
    $FUNCTION$;

    -- 2. match_components
    DROP FUNCTION IF EXISTS public.match_components(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.match_components(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        id bigint,
        component_id bigint,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;

    -- 3. match_failure_descriptions
    DROP FUNCTION IF EXISTS public.match_failure_descriptions(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.match_failure_descriptions(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        id bigint,
        component_id bigint,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
        RETURN QUERY
        SELECT
            fde.id::bigint,
            fde.component_id::bigint,
            fde.symptom_description as description,
            1 - (fde.embedding <=> query_embedding) AS similarity
        FROM failure_description_embeddings fde
        WHERE 1 - (fde.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
    END;
    $FUNCTION$;

    -- 4. match_part_prices
    DROP FUNCTION IF EXISTS public.match_part_prices(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.match_part_prices(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        id bigint,
        price_id bigint,
        part_id bigint,
        part_name text,
        price float,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;

    -- 5. match_parts
    DROP FUNCTION IF EXISTS public.match_parts(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.match_parts(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        id bigint,
        part_id bigint,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
        RETURN QUERY
        SELECT
            pe.id::bigint,
            pe.part_id::bigint,
            'Part description' as description, -- Placeholder since part_embeddings might not have description
            1 - (pe.embedding <=> query_embedding) AS similarity
        FROM part_embeddings pe
        WHERE 1 - (pe.embedding <=> query_embedding) > match_threshold
        ORDER BY similarity DESC
        LIMIT match_count;
    END;
    $FUNCTION$;

    -- 6. match_vehicle_types
    DROP FUNCTION IF EXISTS public.match_vehicle_types(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.match_vehicle_types(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        id bigint,
        type_id bigint,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;

    -- 7. match_vehicles
    DROP FUNCTION IF EXISTS public.match_vehicles(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.match_vehicles(query_embedding vector, match_threshold float, match_count int)
    RETURNS TABLE (
        id bigint,
        vehicle_id bigint,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;

    -- 8. run_query
    DROP FUNCTION IF EXISTS public.run_query(text);
    
    CREATE OR REPLACE FUNCTION public.run_query(query text)
    RETURNS SETOF record
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
        RETURN QUERY EXECUTE query;
    END;
    $FUNCTION$;

    -- 9. search_all_entities
    DROP FUNCTION IF EXISTS public.search_all_entities(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.search_all_entities(
        query_embedding vector, 
        similarity_threshold float, 
        max_results int
    )
    RETURNS TABLE (
        entity_type text,
        entity_id bigint,
        description text,
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;

    -- 10. search_all_entities_with_prices
    DROP FUNCTION IF EXISTS public.search_all_entities_with_prices(vector, float, int);
    
    CREATE OR REPLACE FUNCTION public.search_all_entities_with_prices(
        query_embedding vector, 
        similarity_threshold float, 
        max_results int
    )
    RETURNS TABLE (
        entity_type text,
        entity_id bigint,
        description text,
        price decimal(10,2),
        similarity float
    )
    LANGUAGE plpgsql
    AS $FUNCTION$
    BEGIN
        -- Set explicit search path
        SET search_path = "$user", public;
        
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
    $FUNCTION$;
END
$$;