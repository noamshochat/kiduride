-- Add RLS policies for children and child_parents tables
-- These tables were created but RLS policies were missing, preventing access

-- ============================================
-- Enable RLS on children and child_parents tables (if not already enabled)
-- ============================================
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_parents ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Drop existing policies if they exist (to avoid conflicts)
-- ============================================
DROP POLICY IF EXISTS "Children are viewable by everyone" ON children;
DROP POLICY IF EXISTS "Child parents are viewable by everyone" ON child_parents;
DROP POLICY IF EXISTS "Children can be created" ON children;
DROP POLICY IF EXISTS "Child parents can be created" ON child_parents;

-- ============================================
-- RLS Policies for children table
-- ============================================

-- Policy: Anyone can read children (needed for search/autocomplete)
CREATE POLICY "Children are viewable by everyone"
  ON children
  FOR SELECT
  USING (true);

-- Policy: Allow creating children (for admin/migration scripts)
CREATE POLICY "Children can be created"
  ON children
  FOR INSERT
  WITH CHECK (
    first_name IS NOT NULL 
    AND first_name != ''
  );

-- Policy: Allow updating children (for admin)
CREATE POLICY "Children can be updated"
  ON children
  FOR UPDATE
  USING (true)
  WITH CHECK (
    first_name IS NOT NULL 
    AND first_name != ''
    AND id = OLD.id
  );

-- Policy: Allow deleting children (for admin)
CREATE POLICY "Children can be deleted"
  ON children
  FOR DELETE
  USING (true);

-- ============================================
-- RLS Policies for child_parents table
-- ============================================

-- Policy: Anyone can read child-parent relationships (needed for displaying parents)
CREATE POLICY "Child parents are viewable by everyone"
  ON child_parents
  FOR SELECT
  USING (true);

-- Policy: Allow creating child-parent relationships (for admin/migration scripts)
CREATE POLICY "Child parents can be created"
  ON child_parents
  FOR INSERT
  WITH CHECK (
    child_id IS NOT NULL
    AND parent_id IS NOT NULL
  );

-- Policy: Allow deleting child-parent relationships (for admin)
CREATE POLICY "Child parents can be deleted"
  ON child_parents
  FOR DELETE
  USING (true);

