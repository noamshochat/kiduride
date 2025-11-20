-- Fix child ID from child_eil_binshtok to child_eyal_binshtok
-- This script updates the child ID in all related tables
-- Strategy: Create new child entry, update foreign keys, then delete old entry

DO $$
BEGIN
    -- Check if old ID exists
    IF EXISTS (SELECT 1 FROM children WHERE id = 'child_eil_binshtok') THEN
        -- Check if new ID already exists
        IF EXISTS (SELECT 1 FROM children WHERE id = 'child_eyal_binshtok') THEN
            RAISE NOTICE 'Child ID child_eyal_binshtok already exists. Skipping update.';
        ELSE
            -- Step 1: Create new child entry with correct ID (copy data from old)
            INSERT INTO children (id, first_name, last_name, created_at, updated_at)
            SELECT 'child_eyal_binshtok', first_name, last_name, created_at, updated_at
            FROM children
            WHERE id = 'child_eil_binshtok';
            
            -- Step 2: Update child_parents table (foreign key references)
            UPDATE child_parents
            SET child_id = 'child_eyal_binshtok'
            WHERE child_id = 'child_eil_binshtok';
            
            -- Step 3: Update passengers table (if any passengers reference this child)
            UPDATE passengers
            SET child_id = 'child_eyal_binshtok'
            WHERE child_id = 'child_eil_binshtok';
            
            -- Step 4: Delete old child entry (now safe since no foreign keys reference it)
            DELETE FROM children
            WHERE id = 'child_eil_binshtok';
            
            RAISE NOTICE 'Successfully updated child ID from child_eil_binshtok to child_eyal_binshtok';
        END IF;
    ELSE
        RAISE NOTICE 'Child ID child_eil_binshtok not found. Nothing to update.';
    END IF;
END $$;

-- Verification query (uncomment to check)
-- SELECT id, first_name, last_name FROM children WHERE id IN ('child_eil_binshtok', 'child_eyal_binshtok');
-- SELECT child_id, parent_id FROM child_parents WHERE child_id IN ('child_eil_binshtok', 'child_eyal_binshtok');
-- SELECT id, child_id, child_name FROM passengers WHERE child_id IN ('child_eil_binshtok', 'child_eyal_binshtok');

