# Admin Functionality Setup

This document describes how to set up admin functionality for viewing all rides across all dates.

## Important Security Note

**Admin permissions are ALWAYS validated on the backend.** The frontend never decides admin permissions - even if someone modifies the browser code, they cannot gain admin access without the database confirming their admin status.

## Database Setup

### 1. Add Admin Column

Run the migration to add the `is_admin` column to the users table:

```sql
-- Run migrations/005_add_admin_column.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
```

### 2. Set Your User as Admin

Run the migration to set your user as admin (update the email in the migration file first):

```sql
-- Run migrations/006_set_user_as_admin.sql
-- IMPORTANT: Update the email address in this file to your actual email
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

Or run directly in Supabase SQL Editor:

```sql
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'noamshochat@gmail.com';
```

## API Routes

The admin functionality uses backend API routes that validate admin status:

- `/api/admin/check` - Checks if a user is an admin (validates in database)
- `/api/admin/rides` - Returns all rides (only if user is confirmed admin in database)

### Important: Deployment Platform

**GitHub Pages Limitation**: GitHub Pages only serves static files and does NOT support API routes. The admin API routes (`/api/admin/*`) will not work on GitHub Pages.

**Solutions:**

1. **Deploy to Vercel** (Recommended for Next.js with API routes)
   - Vercel supports Next.js API routes out of the box
   - Simply connect your GitHub repository to Vercel
   - API routes will work automatically

2. **Use Supabase RLS Policies** (Alternative)
   - Configure Row Level Security policies in Supabase
   - Policies can check `is_admin` column
   - Client-side calls will be automatically filtered by Supabase

3. **Use Supabase Edge Functions** (Alternative)
   - Create Edge Functions that validate admin status
   - Call Edge Functions from the frontend

## How It Works

### Frontend Flow

1. User logs in
2. Frontend calls `/api/admin/check` with userId
3. Backend queries database to check `is_admin` column
4. Backend returns admin status
5. If admin, frontend calls `/api/admin/rides` with userId
6. Backend validates admin status again before returning all rides

### Backend Validation

Every admin endpoint:
1. Receives userId from frontend
2. Queries database: `SELECT is_admin FROM users WHERE id = userId`
3. Only proceeds if `is_admin = TRUE` in database
4. Returns 403 Unauthorized if not admin

### Security Guarantees

- ✅ Admin status is stored in database (`is_admin` column)
- ✅ Every admin request validates status in database
- ✅ Frontend cannot bypass backend validation
- ✅ Even if frontend code is modified, admin access requires database confirmation
- ✅ API routes return 403 if user is not admin

## Testing

1. Set your user as admin in the database
2. Log in to the application
3. Navigate to Driver Dashboard
4. You should see:
   - "ADMIN MODE" badge next to the title
   - "Viewing all rides from all drivers" subtitle
   - All rides from all drivers, not just your own
   - Driver name shown for rides you didn't create

## Troubleshooting

### Admin mode not showing

1. Verify your user has `is_admin = TRUE` in database:
   ```sql
   SELECT id, name, email, is_admin FROM users WHERE email = 'your-email@example.com';
   ```

2. Check browser console for API errors
3. Verify API routes are accessible (if deployed to Vercel)

### API routes not working

- If deployed to GitHub Pages: API routes won't work. Deploy to Vercel instead.
- If deployed to Vercel: Check Vercel function logs for errors
- Verify Supabase credentials are set in environment variables

