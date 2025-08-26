-- Insert regions data
COPY regions(name, type, parent_region_id, population, latitude, longitude) FROM stdin WITH CSV HEADER;
\copy regions(name, type, parent_region_id, population, latitude, longitude) FROM 'regions.csv' WITH CSV HEADER;

-- Insert region_vehicle_types data
COPY region_vehicle_types(region_id, type_id, registration_count, year_recorded) FROM stdin WITH CSV HEADER;
\copy region_vehicle_types(region_id, type_id, registration_count, year_recorded) FROM 'region_vehicle_types.csv' WITH CSV HEADER;
