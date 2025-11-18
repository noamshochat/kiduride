-- Add is_admin column to users table
-- This column determines if a user has admin privileges

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- Comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Whether the user has admin privileges. Admin users can see all rides across all dates.';

