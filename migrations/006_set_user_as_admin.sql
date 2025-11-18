-- Set the user with email 'noamshochat@gmail.com' as admin
-- IMPORTANT: Replace this email with your actual email address

UPDATE users 
SET is_admin = TRUE 
WHERE email = 'noamshochat@gmail.com';

-- Verify the update
SELECT id, name, email, is_admin 
FROM users 
WHERE email = 'noamshochat@gmail.com';

