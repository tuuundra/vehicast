-- Disable Row-Level Security (RLS) for all tables
-- Run this in the Supabase SQL Editor before uploading data

-- Disable RLS for vehicle_types
ALTER TABLE vehicle_types DISABLE ROW LEVEL SECURITY;

-- Disable RLS for vehicles
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Disable RLS for components
ALTER TABLE components DISABLE ROW LEVEL SECURITY;

-- Disable RLS for parts
ALTER TABLE parts DISABLE ROW LEVEL SECURITY;

-- Disable RLS for failures
ALTER TABLE failures DISABLE ROW LEVEL SECURITY;

-- Disable RLS for embedding tables
ALTER TABLE vehicle_type_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE component_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE part_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_embeddings DISABLE ROW LEVEL SECURITY;
ALTER TABLE failure_description_embeddings DISABLE ROW LEVEL SECURITY;

-- Confirm RLS status
SELECT 
    tablename, 
    rowsecurity 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public'; 