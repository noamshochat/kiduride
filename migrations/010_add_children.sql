-- Add children and link them to their parents
-- Based on parent-child relationships provided
-- This migration will create children and link them to existing parents by matching names

-- ============================================
-- Step 1: Create children entries
-- ============================================

-- אפרת כהן (has two parents: אסף כהן and איילת כהן)
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_efrat_cohen', 'אפרת', 'כהן')
ON CONFLICT (id) DO NOTHING;

-- עומר שוחט (has one parent: נועם שוחט)
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_omer_shochat', 'עומר', 'שוחט')
ON CONFLICT (id) DO NOTHING;

-- נועה איפרגן (has one parent: שרון איפרגן)
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_noa_ifragan', 'נועה', 'איפרגן')
ON CONFLICT (id) DO NOTHING;

-- איל בינשטוק (has two parents: מירב בינשטוק and גיל בינשטוק)
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_eyal_binshtok', 'איל', 'בינשטוק')
ON CONFLICT (id) DO NOTHING;

-- מעין ויצנר (has two parents: אופיר ויצנר and שרית ויצנר)
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_maayan_vitzner', 'מעין', 'ויצנר')
ON CONFLICT (id) DO NOTHING;

-- נועה זגורסקי (has two parents: קטיה זגורסקי and משה זגורסקי)
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_noa_zagorski', 'נועה', 'זגורסקי')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 2: Link children to their parents
-- Using parent names to find user IDs
-- ============================================

-- אפרת כהן - אסף כהן
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_efrat_cohen', id
FROM users
WHERE name = 'אסף כהן'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- אפרת כהן - איילת כהן
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_efrat_cohen', id
FROM users
WHERE name = 'איילת כהן'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- עומר שוחט - נועם שוחט
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_omer_shochat', id
FROM users
WHERE name = 'נועם שוחט'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- נועה איפרגן - שרון איפרגן
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_noa_ifragan', id
FROM users
WHERE name = 'שרון איפרגן'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- איל בינשטוק - מירב בינשטוק
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_eyal_binshtok', id
FROM users
WHERE name = 'מירב בינשטוק'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- איל בינשטוק - גיל בינשטוק
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_eyal_binshtok', id
FROM users
WHERE name = 'גיל בינשטוק'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- מעין ויצנר - אופיר ויצנר
-- Note: This will only insert if אופיר ויצנר exists in users table
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_maayan_vitzner', id
FROM users
WHERE name = 'אופיר ויצנר'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- מעין ויצנר - שרית ויצנר
-- Note: This will only insert if שרית ויצנר exists in users table
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_maayan_vitzner', id
FROM users
WHERE name = 'שרית ויצנר'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- נועה זגורסקי - קטיה זגורסקי
-- Note: This will only insert if קטיה זגורסקי exists in users table
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_noa_zagorski', id
FROM users
WHERE name = 'קטיה זגורסקי'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- נועה זגורסקי - משה זגורסקי
-- Note: This will only insert if משה זגורסקי exists in users table
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_noa_zagorski', id
FROM users
WHERE name = 'משה זגורסקי'
ON CONFLICT (child_id, parent_id) DO NOTHING;

-- ============================================
-- Verification Query (uncomment to run)
-- ============================================
-- This query shows all children with their linked parents
-- 
-- SELECT 
--     c.id as child_id,
--     c.first_name || ' ' || COALESCE(c.last_name, '') as child_name,
--     array_agg(u.name ORDER BY u.name) as parents,
--     array_agg(u.id ORDER BY u.name) as parent_ids
-- FROM children c
-- LEFT JOIN child_parents cp ON c.id = cp.child_id
-- LEFT JOIN users u ON cp.parent_id = u.id
-- WHERE c.id IN (
--     'child_efrat_cohen',
--     'child_omer_shochat',
--     'child_noa_ifragan',
--     'child_eyal_binshtok',
--     'child_maayan_vitzner',
--     'child_noa_zagorski'
-- )
-- GROUP BY c.id, c.first_name, c.last_name
-- ORDER BY c.first_name, c.last_name;
