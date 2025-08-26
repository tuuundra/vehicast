-- STEP 1: Import regions data
-- Go to Supabase Dashboard > Table Editor > regions > Import Data
-- Upload regions.csv file

-- STEP 2: Import vehicle registrations data
-- First, create a temporary table to hold the data

CREATE TABLE temp_region_vehicle_makes (
  region_id INTEGER NOT NULL,
  make VARCHAR NOT NULL,
  model VARCHAR NOT NULL,
  year INTEGER NOT NULL,
  registration_count INTEGER NOT NULL,
  year_recorded INTEGER NOT NULL
);

-- Go to Supabase Dashboard > Table Editor > temp_region_vehicle_makes > Import Data
-- Upload region_vehicle_makes.csv file

-- STEP 3: Join with vehicle_types to get type_id and insert into region_vehicle_types

INSERT INTO region_vehicle_types (region_id, type_id, registration_count, year_recorded)
SELECT 
  r.region_id,
  v.type_id,
  r.registration_count,
  r.year_recorded
FROM 
  temp_region_vehicle_makes r
  JOIN vehicle_types v ON 
    r.make = v.make AND
    r.model = v.model AND
    r.year = v.year;

-- STEP 4: Clean up
DROP TABLE temp_region_vehicle_makes;
