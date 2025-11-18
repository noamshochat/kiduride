# Database Migrations

This directory contains SQL migration scripts for setting up and updating the KiduRide database.

## Migration Files

### 001_initial_schema.sql
Creates the initial database schema with tables:
- `users` - User accounts
- `rides` - Ride information
- `passengers` - Passenger assignments

**Run this first** when setting up a new database.

### 002_insert_default_users.sql
Inserts the initial set of default users for testing.

**Run this after** creating the schema.

### 003_enable_rls.sql
Enables Row Level Security (RLS) on all tables and creates security policies.

**Run this immediately after** creating tables for security.

### 004_add_new_user.sql
Adds a new user (שרון איפרגן) to the database.

**Run this** if you need to add the new user to an existing database.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file you want to run
4. Copy the entire SQL script
5. Paste into SQL Editor and click **Run**

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## Migration Best Practices

1. **Run migrations in order**: Always run migrations in numerical order (001, 002, 003, etc.)

2. **Idempotent migrations**: All migrations use `ON CONFLICT DO NOTHING` or similar patterns, so they're safe to run multiple times

3. **Adding new users**: When adding new users, create a new migration file (e.g., `005_add_another_user.sql`) instead of modifying existing ones

4. **Testing**: Test migrations on a development database before running on production

5. **Backup**: Always backup your database before running migrations in production

## Adding New Users

To add a new user:

1. Create a new migration file: `00X_add_new_user.sql` (where X is the next number)
2. Use this template:

```sql
-- Add new user: [User Name]
INSERT INTO users (id, name, email, phone, child_name) VALUES
    ('[unique_id]', '[Name]', '[email]', '[phone]', '[child_name]')
ON CONFLICT (id) DO NOTHING;
```

3. Make sure the `id` is unique and doesn't conflict with existing users
4. Run the migration in Supabase SQL Editor

## Troubleshooting

### "duplicate key value violates unique constraint"
- Check that the user ID doesn't already exist
- The `ON CONFLICT DO NOTHING` clause should prevent this, but double-check your IDs

### "relation does not exist"
- Make sure you've run `001_initial_schema.sql` first
- Check that table names match exactly (case-sensitive)

### "permission denied"
- Check that RLS policies allow the operation
- Verify you're using the correct Supabase credentials

