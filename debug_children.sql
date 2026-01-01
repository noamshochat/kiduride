-- Debug query to check children "גיא" and "עמית"
-- Run this in Supabase SQL Editor

-- Check if children exist and their activity registration
SELECT 
    id,
    first_name,
    last_name,
    is_registered_kidu,
    is_registered_tennis,
    created_at,
    updated_at
FROM children
WHERE first_name LIKE '%גיא%' 
   OR first_name LIKE '%עמית%'
   OR last_name LIKE '%גיא%'
   OR last_name LIKE '%עמית%'
ORDER BY first_name;

-- Also check all children with tennis registration
SELECT 
    id,
    first_name,
    last_name,
    is_registered_kidu,
    is_registered_tennis,
    CASE 
        WHEN is_registered_tennis = true THEN 'TRUE (boolean)'
        WHEN is_registered_tennis = false THEN 'FALSE (boolean)'
        WHEN is_registered_tennis IS NULL THEN 'NULL'
        ELSE 'UNKNOWN: ' || is_registered_tennis::text
    END as tennis_status,
    pg_typeof(is_registered_tennis) as tennis_type
FROM children
WHERE is_registered_tennis = true
ORDER BY first_name;

-- Check exact values for debugging
SELECT 
    id,
    first_name,
    last_name,
    is_registered_kidu,
    is_registered_tennis,
    pg_typeof(is_registered_kidu) as kidu_type,
    pg_typeof(is_registered_tennis) as tennis_type,
    is_registered_kidu::text as kidu_text,
    is_registered_tennis::text as tennis_text
FROM children
ORDER BY first_name;

