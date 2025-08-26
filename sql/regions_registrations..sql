-- Table for geographic regions (hierarchical)
CREATE TABLE regions (
  region_id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('country', 'state', 'county', 'city')),
  parent_region_id INTEGER REFERENCES regions(region_id),
  population INTEGER,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster hierarchical queries
CREATE INDEX idx_regions_parent ON regions(parent_region_id);

-- Table for vehicle type registrations by region
CREATE TABLE region_vehicle_types (
  id SERIAL PRIMARY KEY,
  region_id INTEGER REFERENCES regions(region_id) NOT NULL,
  type_id INTEGER REFERENCES vehicle_types(type_id) NOT NULL,
  registration_count INTEGER NOT NULL,
  year_recorded INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create a unique constraint to prevent duplicate entries for the same region/vehicle type/year
  UNIQUE(region_id, type_id, year_recorded)
);

-- Create indexes for faster filtering and aggregation
CREATE INDEX idx_region_vehicle_types_region ON region_vehicle_types(region_id);
CREATE INDEX idx_region_vehicle_types_type ON region_vehicle_types(type_id);

-- Table for region embeddings (for semantic search)
CREATE TABLE region_embeddings (
  id SERIAL PRIMARY KEY,
  region_id INTEGER REFERENCES regions(region_id) NOT NULL,
  embedding_model VARCHAR,
  embedding VECTOR,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
