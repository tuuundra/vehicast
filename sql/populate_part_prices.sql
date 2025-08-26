-- Populate Part Prices Table with Realistic Pricing
-- This script inserts sample pricing data for all parts based on their component type

-- First, let's set different price ranges for different component types
DO $$
DECLARE
    part_rec RECORD;
    base_price DECIMAL(10,2);
    wholesale_markup DECIMAL(5,2) := 1.20; -- 20% markup from base price
    retail_markup DECIMAL(5,2) := 1.50;    -- 50% markup from base price
    msrp_markup DECIMAL(5,2) := 2.00;      -- 100% markup from base price
    price_variation DECIMAL(5,2);
BEGIN
    -- Loop through all parts
    FOR part_rec IN SELECT p.part_id, p.part_name, p.component_id, c.component_name 
                    FROM parts p 
                    JOIN components c ON p.component_id = c.component_id
    LOOP
        -- Set base price ranges by component type (realistic pricing based on typical automotive parts)
        CASE part_rec.component_id
            WHEN 1 THEN -- brakes
                base_price := 45.00 + (random() * 70.00);  -- $45-$115
            WHEN 2 THEN -- batteries
                base_price := 75.00 + (random() * 150.00); -- $75-$225
            WHEN 3 THEN -- alternators
                base_price := 120.00 + (random() * 180.00); -- $120-$300
            WHEN 4 THEN -- spark plugs
                base_price := 3.00 + (random() * 17.00);   -- $3-$20 (often sold in sets)
            WHEN 5 THEN -- tires
                base_price := 80.00 + (random() * 320.00); -- $80-$400
            WHEN 6 THEN -- oil filters
                base_price := 5.00 + (random() * 25.00);   -- $5-$30
            WHEN 7 THEN -- air filters
                base_price := 10.00 + (random() * 40.00);  -- $10-$50
            WHEN 8 THEN -- starters
                base_price := 100.00 + (random() * 200.00); -- $100-$300
            WHEN 9 THEN -- water pumps
                base_price := 40.00 + (random() * 160.00); -- $40-$200
            WHEN 10 THEN -- fuel pumps
                base_price := 50.00 + (random() * 250.00); -- $50-$300
            ELSE
                base_price := 25.00 + (random() * 75.00);  -- $25-$100 default
        END CASE;
        
        -- Add some randomization to markups to simulate market variations (±5%)
        price_variation := 0.95 + (random() * 0.10);
        
        -- Round prices to two decimal places
        base_price := ROUND(base_price::numeric, 2);
        
        -- Insert the pricing record
        INSERT INTO part_prices (
            part_id, 
            base_price, 
            wholesale_price, 
            retail_price, 
            manufacturer_suggested_price, 
            currency,
            effective_date,
            is_current
        ) VALUES (
            part_rec.part_id,
            base_price,
            ROUND((base_price * wholesale_markup * price_variation)::numeric, 2),
            ROUND((base_price * retail_markup * price_variation)::numeric, 2),
            ROUND((base_price * msrp_markup * price_variation)::numeric, 2),
            'USD',
            CURRENT_TIMESTAMP,
            TRUE
        );
        
    END LOOP;
END $$;

-- Create sample descriptions for part price embeddings
-- In a real implementation, these would be generated with more detailed information
-- about the part, pricing tiers, and compatibility, then embedded using an LLM API

INSERT INTO part_price_embeddings (
    price_id,
    embedding_model,
    embedding,
    description
)
SELECT 
    pp.price_id,
    'text-embedding-3-small',
    -- In a real implementation, this would be replaced with actual embeddings
    -- This is just a placeholder vector with 1536 dimensions (all zeros)
    array_fill(0::float, ARRAY[1536])::vector(1536),
    -- Generate descriptive text that would be used to create the embeddings
    'Part: ' || p.part_name || 
    '. Component type: ' || c.component_name || 
    '. Base price: $' || pp.base_price || 
    '. Retail price: $' || pp.retail_price || 
    '. MSRP: $' || pp.manufacturer_suggested_price || '.'
FROM 
    part_prices pp
    JOIN parts p ON pp.part_id = p.part_id
    JOIN components c ON p.component_id = c.component_id
WHERE 
    pp.is_current = TRUE;

-- Comments on next steps:
-- 1. In a real implementation, you would replace the placeholder embeddings
--    with actual vector embeddings generated via an LLM API
-- 2. The descriptions would be more detailed, including information about
--    compatibility, features, and warranty to improve semantic search
-- 3. Pricing data would be regularly updated with expiration_date set and
--    new records created with is_current = TRUE 