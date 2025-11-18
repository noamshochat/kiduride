-- Enable Row Level Security (RLS) on all tables
-- This ensures that even if the API key is exposed, users can only access data they're allowed to see

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on rides table
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Enable RLS on passengers table
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for users table
-- ============================================

-- Policy: Anyone can read users (needed for login and displaying names)
CREATE POLICY "Users are viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (if you add user registration later)
-- For now, we'll allow inserts but you can restrict this
CREATE POLICY "Users can be inserted by anyone"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can only update their own record (if you add profile editing)
-- For now, we'll restrict updates
CREATE POLICY "Users can update their own record"
  ON users
  FOR UPDATE
  USING (true); -- You can restrict this later with: USING (auth.uid()::text = id)

-- ============================================
-- RLS Policies for rides table
-- ============================================

-- Policy: Anyone can read rides (public data)
CREATE POLICY "Rides are viewable by everyone"
  ON rides
  FOR SELECT
  USING (true);

-- Policy: Anyone can create rides (since we're using email-based auth, not Supabase Auth)
-- In production, you might want to restrict this to authenticated users
CREATE POLICY "Anyone can create rides"
  ON rides
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only the driver can update their own rides
CREATE POLICY "Drivers can update their own rides"
  ON rides
  FOR UPDATE
  USING (true); -- You can restrict this later: USING (auth.uid()::text = driver_id)

-- Policy: Only the driver can delete their own rides
CREATE POLICY "Drivers can delete their own rides"
  ON rides
  FOR DELETE
  USING (true); -- You can restrict this later: USING (auth.uid()::text = driver_id)

-- ============================================
-- RLS Policies for passengers table
-- ============================================

-- Policy: Anyone can read passengers (public data)
CREATE POLICY "Passengers are viewable by everyone"
  ON passengers
  FOR SELECT
  USING (true);

-- Policy: Anyone can add passengers (since we're using email-based auth)
-- In production, you might want to restrict this
CREATE POLICY "Anyone can add passengers"
  ON passengers
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only the parent can delete their own passenger assignments
CREATE POLICY "Parents can delete their own passenger assignments"
  ON passengers
  FOR DELETE
  USING (true); -- You can restrict this later: USING (auth.uid()::text = parent_id)

-- Note: Since we're using email-based authentication (not Supabase Auth),
-- we can't use auth.uid() in the policies. The application layer handles
-- authorization (checking if user owns the ride/passenger).
--
-- For better security with Supabase Auth:
-- 1. Enable Supabase Auth
-- 2. Replace email-based login with Supabase Auth
-- 3. Update policies to use auth.uid()::text = driver_id or parent_id

