-- Verification query to check children and their parents
-- Run this after migrations 009, 010, and 011 to verify everything is set up correctly

-- Show all children with their linked parents
SELECT 
    c.id as child_id,
    c.first_name || ' ' || COALESCE(c.last_name, '') as child_name,
    array_agg(u.name ORDER BY u.name) as parents,
    array_agg(u.phone ORDER BY u.name) as parent_phones,
    COUNT(cp.parent_id) as parent_count
FROM children c
LEFT JOIN child_parents cp ON c.id = cp.child_id
LEFT JOIN users u ON cp.parent_id = u.id
GROUP BY c.id, c.first_name, c.last_name
ORDER BY c.first_name, c.last_name;

-- Check for children without parents (should be none if migration worked)
SELECT 
    c.id,
    c.first_name || ' ' || COALESCE(c.last_name, '') as child_name
FROM children c
LEFT JOIN child_parents cp ON c.id = cp.child_id
WHERE cp.child_id IS NULL;

-- Check for parents that should be linked but aren't
-- (This checks if any of the expected parents from migration 010 are missing)
SELECT 
    u.name as parent_name,
    u.id as parent_id
FROM users u
WHERE u.name IN (
    'אסף כהן',
    'איילת כהן',
    'נועם שוחט',
    'שרון איפרגן',
    'מירב בינשטוק',
    'גיל בינשטוק'
)
AND NOT EXISTS (
    SELECT 1 FROM child_parents cp WHERE cp.parent_id = u.id
);

