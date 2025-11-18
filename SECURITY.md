# Security Guide for KiduRide

## Understanding Supabase API Keys

### The Anon Key is Public by Design

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is **meant to be public** and exposed in the browser. This is the intended design of Supabase.

**Why is this safe?**
- The anon key has limited permissions
- Security comes from **Row Level Security (RLS)** policies, not from hiding the key
- RLS policies control what data users can read/write, regardless of who has the key

### Key Types

1. **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Public, can be exposed in browser
   - Limited by RLS policies
   - Used for client-side operations

2. **Service Role Key** (Keep Secret!)
   - **NEVER expose this in the browser**
   - Bypasses RLS policies
   - Only use in server-side code (API routes)
   - Store in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix)

## Current Security Setup

### What We Have Now

✅ **RLS Enabled**: Row Level Security is enabled on all tables  
✅ **Public Read Access**: Anyone can read rides and passengers (intended for public carpooling)  
✅ **Application-Level Authorization**: The app checks ownership before allowing updates/deletes  

### What's Protected

- **Users table**: Public read (needed for login), restricted writes
- **Rides table**: Public read, anyone can create (you can restrict this)
- **Passengers table**: Public read, anyone can add (you can restrict this)

## Recommended Security Improvements

### Option 1: Enable RLS Policies (Recommended First Step)

Run the migration script to enable RLS:

```sql
-- Run migrations/003_enable_rls.sql in Supabase SQL Editor
```

This enables Row Level Security but keeps policies permissive for now (since we're using email-based auth).

### Option 2: Move Sensitive Operations to API Routes

For extra security, move write operations to server-side API routes:

**Current (Client-side):**
```typescript
// Client directly calls Supabase
await supabaseDb.createRide(ride)
```

**More Secure (Server-side):**
```typescript
// Client calls API route
await fetch('/api/rides', { method: 'POST', body: JSON.stringify(ride) })
// API route validates and calls Supabase
```

**Benefits:**
- API key never exposed to client
- Server can validate requests
- Can add rate limiting
- Can add additional authorization checks

### Option 3: Implement Supabase Auth (Best Long-term Solution)

Replace email-based authentication with Supabase Auth:

1. **Enable Supabase Auth** in your project
2. **Update RLS policies** to use `auth.uid()`:
   ```sql
   CREATE POLICY "Drivers can delete their own rides"
     ON rides
     FOR DELETE
     USING (auth.uid()::text = driver_id);
   ```
3. **Update authentication** to use Supabase Auth instead of email lookup
4. **Benefits**:
   - Built-in authentication
   - Better RLS policy support
   - User sessions managed by Supabase
   - More secure overall

## Immediate Actions

### 1. Enable RLS (Do This Now)

1. Go to Supabase Dashboard → SQL Editor
2. Run `migrations/003_enable_rls.sql`
3. This adds basic protection even with the public key

### 2. Review Your Policies

After enabling RLS, review the policies in `migrations/003_enable_rls.sql` and adjust based on your needs:

- **Too permissive?** Restrict INSERT/UPDATE/DELETE policies
- **Need user-specific access?** Implement Supabase Auth first

### 3. Monitor Your Database

- Check Supabase Dashboard → Logs for suspicious activity
- Set up alerts for unusual query patterns
- Review access logs regularly

## Best Practices

1. ✅ **Never commit `.env.local`** to git (already in `.gitignore`)
2. ✅ **Use RLS policies** to control data access
3. ✅ **Validate on server-side** for critical operations
4. ✅ **Use service role key** only in API routes (server-side)
5. ✅ **Keep anon key public** - it's designed to be public
6. ✅ **Monitor your database** for unusual activity

## FAQ

**Q: Should I hide the anon key?**  
A: No, it's designed to be public. Security comes from RLS policies.

**Q: Can someone abuse the anon key?**  
A: They can only do what your RLS policies allow. With proper policies, abuse is limited.

**Q: What if someone deletes all my data?**  
A: With RLS enabled and proper policies, they can only delete what they're allowed to. Also:
- Enable backups in Supabase
- Set up database backups
- Monitor for suspicious activity

**Q: Should I use the service role key in the browser?**  
A: **NEVER!** The service role key bypasses all security. Only use it in server-side code.

## Next Steps

1. ✅ Run `migrations/003_enable_rls.sql` to enable RLS
2. ⏭️ Review and adjust RLS policies based on your needs
3. ⏭️ Consider moving write operations to API routes for extra security
4. ⏭️ Consider implementing Supabase Auth for better security long-term

