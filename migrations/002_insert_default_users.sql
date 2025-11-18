-- Insert default users for testing
-- This matches the default users in lib/demo-data.ts

-- Note: These INSERT statements explicitly provide simple string IDs ('1', '2', '3', etc.)
-- to match the existing demo data format in the codebase (lib/demo-data.ts).
-- 
-- The database schema defines 'id' as UUID type, but we're overriding it here with simple strings
-- for compatibility with the existing demo data.
--
-- In production, you have two options:
-- 1. Let the database auto-generate UUIDs (remove 'id' from INSERT and let DEFAULT uuid_generate_v4() work)
-- 2. Generate UUIDs yourself and use them in the INSERT statements
--
-- Using UUIDs is better for production because:
-- - They're globally unique (no collisions across databases/servers)
-- - They don't reveal information about record count or creation order
-- - They're more secure (harder to guess/iterate through)

INSERT INTO users (id, name, email, phone, child_name) VALUES
    ('1', 'נועם שוחט', 'noamshochat@gmail.com', '0586084212', 'עומר'),
    ('2', 'אסף כהן', 'asaf@example.com', '1111111111', 'אפרת'),
    ('3', 'מירב בינשטוק', 'meravike@example.com', '1111111111', 'איל'),
    ('4', 'גיל בינשטוק', 'gil@example.com', '1111111111', 'איל'),
    ('5', 'איילת כהן', 'ayelet@example.com', '1111111111', 'אפרת'),
    ('6', 'שרון איפרגן', 'sharoni81@gmail.com', '0523412569', 'נועה')
ON CONFLICT (id) DO NOTHING;