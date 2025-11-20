-- Fix parents for מעין ויצנר - ensure both אופיר ויצנר and שרית ויצנר are linked
-- This script ensures both parents are linked (adds missing ones, doesn't remove existing)

-- Add אופיר ויצנר as parent (if exists and not already linked)
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_maayan_vitzner', id
FROM users
WHERE name = 'אופיר ויצנר'
  AND NOT EXISTS (
    SELECT 1 FROM child_parents 
    WHERE child_id = 'child_maayan_vitzner' 
    AND parent_id = users.id
  )
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- Add שרית ויצנר as parent (if exists and not already linked)
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_maayan_vitzner', id
FROM users
WHERE name = 'שרית ויצנר'
  AND NOT EXISTS (
    SELECT 1 FROM child_parents 
    WHERE child_id = 'child_maayan_vitzner' 
    AND parent_id = users.id
  )
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- Verification query (uncomment to check)
-- SELECT 
--     c.first_name || ' ' || COALESCE(c.last_name, '') as child_name,
--     u.name as parent_name
-- FROM children c
-- JOIN child_parents cp ON c.id = cp.child_id
-- JOIN users u ON cp.parent_id = u.id
-- WHERE c.id = 'child_maayan_vitzner';

