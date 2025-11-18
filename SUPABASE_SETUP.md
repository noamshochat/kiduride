# Supabase Setup Instructions

## 1. Environment Variables

The Supabase credentials have been added to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## 2. Database Setup

You need to run the migration scripts in your Supabase project to create the tables.

**Important:** The schema uses `TEXT` for IDs (not UUID) to match the existing demo data format. This allows you to use simple IDs like '1', '2', '3' for users and 'r1234567890', 'p1234567890' for rides and passengers.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://valyxhfuehnmmhhhvrsk.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Run migrations in order:
   - **001_initial_schema.sql** - Creates tables (run first)
   - **002_insert_default_users.sql** - Inserts initial users
   - **003_enable_rls.sql** - Enables security (IMPORTANT!)
   - **004_add_new_user.sql** - Adds new user (if needed)

   For each migration:
   - Open the file
   - Copy the entire SQL script
   - Paste into SQL Editor and click **Run**

**Note:** If you've already run `002_insert_default_users.sql` and just need to add the new user, you can skip to `004_add_new_user.sql` instead.

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

## 3. Verify Tables Created

After running the migrations, verify the tables exist:

1. Go to **Table Editor** in Supabase dashboard
2. You should see three tables:
   - `users` - with columns: id, name, email, phone, child_name, created_at, updated_at
   - `rides` - with columns: id, driver_id, driver_name, date, direction, total_seats, available_seats, pickup_address, notes, created_at, updated_at
   - `passengers` - with columns: id, ride_id, child_id, child_name, parent_id, parent_name, pickup_from_home, pickup_address, created_at, updated_at

## 4. Row Level Security (RLS) - **IMPORTANT FOR SECURITY**

**You should enable RLS immediately after creating the tables!**

The Supabase anon key is public by design, but security comes from RLS policies. Run the RLS migration:

1. Go to **SQL Editor** in Supabase dashboard
2. Open `migrations/003_enable_rls.sql`
3. Copy and run the entire script

This will:
- Enable RLS on all tables
- Create policies that allow public reads (needed for the app)
- Restrict writes appropriately

**See `SECURITY.md` for detailed security information and best practices.**

## 5. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try creating a ride in Driver Mode
3. Try assigning a child to a ride in Parent Mode
4. Check the Supabase dashboard to see the data being created

## Troubleshooting

### Error: "relation does not exist"
- Make sure you've run the migration scripts in Supabase
- Check that table names match exactly (case-sensitive)

### Error: "permission denied"
- Check that RLS is disabled (for now) or that policies are set correctly
- Verify your API key has the correct permissions

### Error: "invalid input syntax for type uuid"
- Make sure you're using UUID format for IDs, or update the schema to use TEXT/VARCHAR for IDs

## Next Steps

- [ ] Run the migration scripts in Supabase
- [ ] Test creating rides
- [ ] Test adding passengers
- [ ] Verify data appears in Supabase dashboard
- [ ] (Optional) Set up Row Level Security policies
- [ ] (Optional) Set up Supabase Auth for user authentication

