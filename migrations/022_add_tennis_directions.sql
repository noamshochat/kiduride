-- Add tennis camp directions: 'to-tennis-center' and 'back-home'
-- This migration updates the CHECK constraint on the rides table and RLS policies

-- ============================================
-- Update rides table CHECK constraint
-- ============================================

-- Drop the old CHECK constraint on direction column
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the CHECK constraint on the direction column
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'rides'::regclass
    AND contype = 'c'
    AND conkey::text = (
        SELECT array_agg(attnum)::text 
        FROM pg_attribute 
        WHERE attrelid = 'rides'::regclass 
        AND attname = 'direction'
    )
    LIMIT 1;
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE rides DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

-- Add new CHECK constraint that includes tennis directions
ALTER TABLE rides 
ADD CONSTRAINT rides_direction_check 
CHECK (direction IN ('to-school', 'from-school', 'to-train-station', 'to-tennis-center', 'back-home'));

-- ============================================
-- Update RLS policies to include tennis directions
-- ============================================

-- Drop existing policies that check direction
DROP POLICY IF EXISTS "Rides can be created with valid data" ON rides;
DROP POLICY IF EXISTS "Rides can be updated with valid data" ON rides;

-- Recreate INSERT policy with updated direction check
CREATE POLICY "Rides can be created with valid data"
ON rides
FOR INSERT
WITH CHECK (
    -- Required fields
    driver_id IS NOT NULL
    AND driver_name IS NOT NULL
    AND driver_name != ''
    AND date IS NOT NULL
    AND direction IN ('to-school', 'from-school', 'to-train-station', 'to-tennis-center', 'back-home')
    AND total_seats > 0
    AND available_seats >= 0
    AND available_seats <= total_seats
    AND pickup_address IS NOT NULL
    AND pickup_address != ''
    -- Date must be today or future
    AND is_future_or_today_ride(date)
    -- Driver must exist
    AND user_exists(driver_id)
);

-- Recreate UPDATE policy with updated direction check
CREATE POLICY "Rides can be updated with valid data"
ON rides
FOR UPDATE
USING (true)
WITH CHECK (
    -- Can't remove required fields
    driver_id IS NOT NULL
    AND driver_name IS NOT NULL
    AND driver_name != ''
    AND date IS NOT NULL
    AND direction IN ('to-school', 'from-school', 'to-train-station', 'to-tennis-center', 'back-home')
    AND total_seats > 0
    AND available_seats >= 0
    AND available_seats <= total_seats
    AND pickup_address IS NOT NULL
    AND pickup_address != ''
    -- Date validation
    AND is_future_or_today_ride(date)
);

