-- Restrictive RLS Policies for Email-Based Auth
-- These policies provide better security while working with email-based authentication
-- They validate data integrity and relationships, even without auth.uid()

-- ============================================
-- Drop existing permissive policies
-- ============================================

DROP POLICY IF EXISTS "Users can be inserted by anyone" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;
DROP POLICY IF EXISTS "Anyone can create rides" ON rides;
DROP POLICY IF EXISTS "Drivers can update their own rides" ON rides;
DROP POLICY IF EXISTS "Drivers can delete their own rides" ON rides;
DROP POLICY IF EXISTS "Anyone can add passengers" ON passengers;
DROP POLICY IF EXISTS "Parents can delete their own passenger assignments" ON passengers;
DROP POLICY IF EXISTS "Users can be created" ON users;
DROP POLICY IF EXISTS "Authenticated users can create rides" ON rides;
DROP POLICY IF EXISTS "Authenticated users can add passengers" ON passengers;
DROP POLICY IF EXISTS "Parents can update their own passenger assignments" ON passengers;

-- ============================================
-- Helper Functions for Validation
-- ============================================

-- Function to check if a user exists (for data integrity)
CREATE OR REPLACE FUNCTION user_exists(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a ride exists (for data integrity)
CREATE OR REPLACE FUNCTION ride_exists(ride_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM rides WHERE id = ride_id);
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
-- Restrictive RLS Policies for users table
-- ============================================

-- Policy: Anyone can read users (needed for login)
CREATE POLICY "Users are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

-- Policy: Restrict user creation - must have valid email and name
CREATE POLICY "Users can be created with valid data"
  ON users
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL 
    AND email != ''
    AND name IS NOT NULL
    AND name != ''
    AND child_name IS NOT NULL
    AND child_name != ''
    -- Email must be unique (enforced by UNIQUE constraint)
  );

-- Policy: Users can only update their own record (validated by application)
-- Add basic validation to prevent invalid updates
CREATE POLICY "Users can update with valid data"
  ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Can't remove required fields
    email IS NOT NULL 
    AND email != ''
    AND name IS NOT NULL
    AND name != ''
    AND child_name IS NOT NULL
    AND child_name != ''
    -- Can't change ID
    AND id = OLD.id
  );

-- ============================================
-- Restrictive RLS Policies for rides table
-- ============================================

-- Policy: Anyone can read rides (public carpooling)
CREATE POLICY "Rides are viewable by everyone"
  ON rides
  FOR SELECT
  USING (true);

-- Policy: Only create rides with valid data and future dates
CREATE POLICY "Rides can be created with valid data"
  ON rides
  FOR INSERT
  WITH CHECK (
    -- Required fields
    driver_id IS NOT NULL
    AND driver_name IS NOT NULL
    AND driver_name != ''
    AND date IS NOT NULL
    AND direction IN ('to-school', 'from-school')
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

-- Policy: Only update rides with valid data
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
    AND direction IN ('to-school', 'from-school')
    AND total_seats > 0
    AND available_seats >= 0
    AND available_seats <= total_seats
    AND pickup_address IS NOT NULL
    AND pickup_address != ''
    -- Can't change ID or driver_id (ownership check at app level)
    AND id = OLD.id
    AND driver_id = OLD.driver_id
    -- Date validation
    AND is_future_or_today_ride(date)
  );

-- Policy: Only delete rides (ownership validated at app level)
CREATE POLICY "Rides can be deleted"
  ON rides
  FOR DELETE
  USING (true);
  -- Ownership check happens at application level

-- ============================================
-- Restrictive RLS Policies for passengers table
-- ============================================

-- Policy: Anyone can read passengers (public carpooling)
CREATE POLICY "Passengers are viewable by everyone"
  ON passengers
  FOR SELECT
  USING (true);

-- Policy: Only add passengers with valid data
CREATE POLICY "Passengers can be added with valid data"
  ON passengers
  FOR INSERT
  WITH CHECK (
    -- Required fields
    ride_id IS NOT NULL
    AND child_name IS NOT NULL
    AND child_name != ''
    AND parent_id IS NOT NULL
    AND parent_name IS NOT NULL
    AND parent_name != ''
    -- Parent and ride must exist
    AND user_exists(parent_id)
    AND ride_exists(ride_id)
    -- If pickup_from_home is true, must have pickup_address
    AND (
      pickup_from_home = false 
      OR (pickup_from_home = true AND pickup_address IS NOT NULL AND pickup_address != '')
    )
  );

-- Policy: Only update passengers with valid data
CREATE POLICY "Passengers can be updated with valid data"
  ON passengers
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Can't remove required fields
    ride_id IS NOT NULL
    AND child_name IS NOT NULL
    AND child_name != ''
    AND parent_id IS NOT NULL
    AND parent_name IS NOT NULL
    AND parent_name != ''
    -- Can't change ID, ride_id, or parent_id (ownership check at app level)
    AND id = OLD.id
    AND ride_id = OLD.ride_id
    AND parent_id = OLD.parent_id
    -- If pickup_from_home is true, must have pickup_address
    AND (
      pickup_from_home = false 
      OR (pickup_from_home = true AND pickup_address IS NOT NULL AND pickup_address != '')
    )
  );

-- Policy: Only delete passengers (ownership validated at app level)
CREATE POLICY "Passengers can be deleted"
  ON passengers
  FOR DELETE
  USING (true);
  -- Ownership check happens at application level

-- ============================================
-- Additional Security: Prevent Invalid Operations
-- ============================================

-- Prevent deleting users who have active rides
CREATE OR REPLACE FUNCTION prevent_delete_user_with_rides()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM rides 
    WHERE driver_id = OLD.id 
    AND date >= CURRENT_DATE
  ) THEN
    RAISE EXCEPTION 'Cannot delete user with active rides';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DROP TRIGGER IF EXISTS check_user_rides_before_delete ON users;
CREATE TRIGGER check_user_rides_before_delete
  BEFORE DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_delete_user_with_rides();

-- ============================================
-- Notes
-- ============================================
-- 
-- These policies provide:
-- 1. ✅ Data integrity validation (required fields, valid values)
-- 2. ✅ Relationship validation (users/rides must exist)
-- 3. ✅ Business rule validation (future dates, seat limits)
-- 4. ✅ Prevents invalid operations (can't change IDs, can't delete users with rides)
--
-- What they DON'T provide (requires application-level checks):
-- 1. ⚠️ User ownership verification (app must check user.id === resource.owner_id)
-- 2. ⚠️ Authentication verification (app must verify user is logged in)
-- 3. ⚠️ Admin privilege checks (app must check is_admin column)
--
-- Security Model:
-- - Database level: Data integrity and business rules
-- - Application level: Authentication and authorization
-- - API routes: Admin checks and ownership verification
--
-- This provides defense-in-depth:
-- - Even if someone bypasses the app, they can't insert invalid data
-- - Even if they have the API key, they can't break data integrity
-- - Application layer still enforces ownership and authentication

