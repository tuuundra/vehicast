-- SQL script to add estimated_monthly_accumulation to vehicles table
-- and update values based on vehicle types

-- Step 1: Add the new columns to the vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS estimated_monthly_accumulation INTEGER DEFAULT 1000;

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update the values based on vehicle types
UPDATE vehicles v
SET estimated_monthly_accumulation = 
    CASE 
        -- Commercial vehicles
        WHEN vt.make IN ('Ford', 'Chevrolet', 'RAM') AND vt.model IN ('F-150', 'Silverado', '1500') THEN 2500
        -- Delivery vehicles
        WHEN vt.make IN ('Mercedes', 'Ford') AND vt.model IN ('Sprinter', 'Transit') THEN 3000
        -- Rideshare vehicles
        WHEN vt.make IN ('Toyota', 'Honda') AND vt.model IN ('Camry', 'Accord') AND v.mileage > 50000 THEN 2000
        -- Efficient commuters
        WHEN vt.make IN ('Toyota', 'Honda', 'Hyundai') AND vt.model IN ('Corolla', 'Civic', 'Elantra') THEN 1200
        -- Luxury vehicles (driven less)
        WHEN vt.make IN ('BMW', 'Mercedes', 'Audi') THEN 800
        -- SUVs
        WHEN vt.make IN ('Toyota', 'Honda', 'Ford') AND vt.model IN ('RAV4', 'CR-V', 'Escape') THEN 1300
        -- Default for sedans and other vehicles
        ELSE 1000
    END
FROM vehicle_types vt
WHERE v.type_id = vt.type_id;

-- Step 3: Verify the update
SELECT 
    vt.make, 
    vt.model, 
    v.mileage, 
    v.estimated_monthly_accumulation,
    v.last_update
FROM 
    vehicles v
JOIN 
    vehicle_types vt ON v.type_id = vt.type_id
LIMIT 20; 