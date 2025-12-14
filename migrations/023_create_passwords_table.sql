-- Create passwords table for backoffice access
-- This table will store encrypted passwords for users
-- In the future, this table will hold all user passwords

-- ============================================
-- Table: passwords
-- ============================================
CREATE TABLE IF NOT EXISTS passwords (
    id TEXT PRIMARY KEY DEFAULT 'pwd_' || to_char(EXTRACT(EPOCH FROM NOW())::bigint, 'FM999999999999999999') || '_' || substr(md5(random()::text), 1, 8),
    user_identifier VARCHAR(255) UNIQUE NOT NULL, -- Email or username to identify the user
    encrypted_password TEXT NOT NULL, -- Password encrypted using ASCII shift (each char + 1)
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for passwords
CREATE INDEX IF NOT EXISTS idx_passwords_user_identifier ON passwords(user_identifier);

-- Insert initial password for backoffice access
-- Password: Butcher_1979
-- Encrypted: Cvudifs`2:8: (each character shifted by +1 in ASCII)
INSERT INTO passwords (user_identifier, encrypted_password)
VALUES ('noamshochat@gmail.com', 'Cvudifs`2:8:')
ON CONFLICT (user_identifier) DO NOTHING;

