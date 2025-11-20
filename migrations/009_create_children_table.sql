-- Create children table and many-to-many relationship with parents
-- This migration adds support for registered children with multiple parents

-- ============================================
-- Table: children
-- ============================================
CREATE TABLE IF NOT EXISTS children (
    id TEXT PRIMARY KEY DEFAULT 'child_' || to_char(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999999999999999') || '_' || substr(md5(random()::text), 1, 8),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for children
CREATE INDEX IF NOT EXISTS idx_children_first_name ON children(first_name);
CREATE INDEX IF NOT EXISTS idx_children_last_name ON children(last_name);
CREATE INDEX IF NOT EXISTS idx_children_name_search ON children USING gin(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')));

-- ============================================
-- Table: child_parents (junction table for many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS child_parents (
    child_id TEXT NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    parent_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (child_id, parent_id)
);

-- Indexes for child_parents
CREATE INDEX IF NOT EXISTS idx_child_parents_child_id ON child_parents(child_id);
CREATE INDEX IF NOT EXISTS idx_child_parents_parent_id ON child_parents(parent_id);

-- ============================================
-- Update passengers table to make child_id more useful
-- ============================================
-- Note: child_id is already nullable, which is good for backward compatibility
-- We'll keep child_name for now but encourage using child_id

-- Add index on child_id for better performance
CREATE INDEX IF NOT EXISTS idx_passengers_child_id ON passengers(child_id) WHERE child_id IS NOT NULL;

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE children IS 'Stores registered children with first and last names';
COMMENT ON TABLE child_parents IS 'Junction table linking children to their parents (many-to-many relationship)';
COMMENT ON COLUMN children.first_name IS 'Child first name (required)';
COMMENT ON COLUMN children.last_name IS 'Child last name (optional)';
COMMENT ON COLUMN child_parents.child_id IS 'Reference to child';
COMMENT ON COLUMN child_parents.parent_id IS 'Reference to parent user';

