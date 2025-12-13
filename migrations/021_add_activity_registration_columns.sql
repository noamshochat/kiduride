-- Add activity registration columns to users table
-- This migration adds is_registered_kidu and is_registered_tennis columns
-- to track which activities each user is registered for

-- Add the new columns with default value false
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_registered_kidu BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_registered_tennis BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN users.is_registered_kidu IS 'Whether the user is registered for Kidumathematics activity';
COMMENT ON COLUMN users.is_registered_tennis IS 'Whether the user is registered for Tennis Hanuka Camp activity';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_registered_kidu ON users(is_registered_kidu) WHERE is_registered_kidu = true;
CREATE INDEX IF NOT EXISTS idx_users_registered_tennis ON users(is_registered_tennis) WHERE is_registered_tennis = true;

