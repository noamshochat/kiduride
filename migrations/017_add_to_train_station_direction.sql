-- Add 'to-train-station' as a valid direction value
-- This migration updates the CHECK constraint on the rides table and RLS policies

-- ============================================
-- Ensure helper functions exist (from migration 008)
-- ============================================

-- Function to check if a user exists (for data integrity)
CREATE OR REPLACE FUNCTION user_exists(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate ride is not in the past
CREATE OR REPLACE FUNCTION is_future_or_today_ride(ride_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN ride_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Update rides table CHECK constraint
-- ============================================

-- Drop the old CHECK constraint on direction column
-- PostgreSQL auto-generates constraint names, so we find and drop it
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

-- Add new CHECK constraint that includes 'to-train-station'
ALTER TABLE rides 
ADD CONSTRAINT rides_direction_check 
CHECK (direction IN ('to-school', 'from-school', 'to-train-station'));

-- ============================================
-- Update RLS policies to include 'to-train-station'
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
    AND direction IN ('to-school', 'from-school', 'to-train-station')
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
-- Note: OLD is not available in RLS policies, so we validate data integrity only
-- Ownership checks are done at the application level
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
    AND direction IN ('to-school', 'from-school', 'to-train-station')
    AND total_seats > 0
    AND available_seats >= 0
    AND available_seats <= total_seats
    AND pickup_address IS NOT NULL
    AND pickup_address != ''
    -- Date validation
    AND is_future_or_today_ride(date)
    -- Note: ID and driver_id changes are prevented at application level
);

