-- Automotive Parts Prediction & Inventory Optimization
-- Supabase Database Schema

-- Create vehicle_types table
CREATE TABLE IF NOT EXISTS vehicle_types (
    type_id SERIAL PRIMARY KEY,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    UNIQUE(make, model, year)
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    vehicle_id SERIAL PRIMARY KEY,
    type_id INT REFERENCES vehicle_types(type_id),
    mileage INT NOT NULL
);

-- Create components table
CREATE TABLE IF NOT EXISTS components (
    component_id SERIAL PRIMARY KEY,
    component_name VARCHAR(50) UNIQUE NOT NULL
);

-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
    part_id SERIAL PRIMARY KEY,
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(50) UNIQUE NOT NULL,
    type_id INT REFERENCES vehicle_types(type_id),
    component_id INT REFERENCES components(component_id)
);

-- Create failures table
CREATE TABLE IF NOT EXISTS failures (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(vehicle_id),
    component_id INT REFERENCES components(component_id),
    failure_rate FLOAT NOT NULL,
    UNIQUE(vehicle_id, component_id)
);

-- Create part_embeddings table for semantic search
CREATE TABLE IF NOT EXISTS part_embeddings (
    id SERIAL PRIMARY KEY,
    part_id INT REFERENCES parts(part_id) UNIQUE,
    embedding JSONB NOT NULL
); 