-- Add new user: שרון איפרגן
-- This migration only adds the new user, skipping existing ones
-- Safe to run multiple times - uses ON CONFLICT DO NOTHING

INSERT INTO users (id, name, email, phone, child_name) VALUES
    ('6', 'שרון איפרגן', 'sharoni81@gmail.com', '0523412569', 'נועה')
ON CONFLICT (id) DO NOTHING;

-- Note: If you need to add more users in the future, create a new migration file
-- following this pattern. Each migration should have a unique number (005, 006, etc.)

