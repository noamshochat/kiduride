-- Add new user: הדר נגר
-- Email: Tamared17@gmail.com
-- Phone: 0506477077
-- Child: איתן נגר
-- This migration adds the user, creates the child, and links them together
-- Safe to run multiple times - uses ON CONFLICT DO NOTHING

-- ============================================
-- Step 1: Add the user
-- ============================================
INSERT INTO users (id, name, email, phone, child_name) VALUES
    ('10', 'הדר נגר', 'tamared17@gmail.com', '0506477077', 'איתן')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 2: Create the child entry
-- ============================================
INSERT INTO children (id, first_name, last_name) VALUES
    ('child_eitan_nagar', 'איתן', 'נגר')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 3: Link the child to the parent
-- ============================================
INSERT INTO child_parents (child_id, parent_id)
SELECT 'child_eitan_nagar', id
FROM users
WHERE name = 'הדר נגר'
ON CONFLICT (child_id, parent_id) DO NOTHING;

