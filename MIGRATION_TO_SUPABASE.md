# Migration from Google Sheets to Supabase

## Why Migrate?

1. **Quota Limits**: Google Sheets API has strict rate limits (60 requests/minute) - you're hitting these limits
2. **Performance**: Google Sheets is slow for real-time applications
3. **Reliability**: Proper database is more reliable for production apps

## Step 1: Set Up Supabase

1. Go to https://supabase.com
2. Sign up for free account
3. Create a new project:
   - Name: `kiduride` (or any name)
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait 2-3 minutes for project to initialize
5. Go to Project Settings > API
6. Copy:
   - Project URL
   - `anon` `public` key (we'll use this)

## Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 3: Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 4: Database Schema

We'll create these tables:
- `rides` - stores ride information
- `passengers` - stores passenger assignments
- `users` - stores user information (optional, can keep in localStorage for now)

## Benefits After Migration

✅ **No quota limits** (within free tier: 500MB database, 2GB bandwidth)  
✅ **Fast queries** (PostgreSQL is optimized for this)  
✅ **Real-time updates** (optional, can add later)  
✅ **Better error handling**  
✅ **Scalable** (can upgrade when needed)  

## Migration Steps

The code will be updated to:
1. Use Supabase client instead of Google Sheets API
2. Keep the same interface so frontend doesn't need changes
3. Much faster response times
4. No quota issues

