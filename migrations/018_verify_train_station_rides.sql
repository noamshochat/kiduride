-- Diagnostic query to check for train station rides
-- Run this in Supabase SQL Editor to see if any 'to-train-station' rides exist

SELECT 
    id,
    driver_id,
    driver_name,
    date,
    direction,
    pickup_address,
    pickup_time,
    total_seats,
    available_seats,
    created_at
FROM rides
WHERE direction = 'to-train-station'
ORDER BY created_at DESC;

-- Also check what directions exist in the database
SELECT 
    direction,
    COUNT(*) as count
FROM rides
GROUP BY direction
ORDER BY direction;

-- Check the current CHECK constraint on the direction column
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'rides'::regclass
AND contype = 'c'
AND conkey::text = (
    SELECT array_agg(attnum)::text 
    FROM pg_attribute 
    WHERE attrelid = 'rides'::regclass 
    AND attname = 'direction'
);

