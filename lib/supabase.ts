import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration - Hardcoded for GitHub Pages deployment
const supabaseUrl = 'https://valyxhfuehnmmhhhvrsk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbHl4aGZ1ZWhubW1oaGh2cnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTgxODgsImV4cCI6MjA3ODg5NDE4OH0.BCDmdZbPCUCu8lMQMsw02YHBl7zB1U0ftuksC-ib74Y'

// Service role key for admin operations (bypasses RLS)
// This should be stored in environment variables in production
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create Supabase client with anon key (subject to RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Create Supabase admin client with service role key (bypasses RLS)
// Only use this in server-side API routes for admin operations
export const supabaseAdmin: SupabaseClient = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback to regular client if service role key not available

