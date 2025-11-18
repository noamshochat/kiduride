import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// For static export builds, provide valid placeholder values if env vars are missing
// These won't work at runtime but will prevent build errors during static generation
// Using a valid Supabase URL format: https://[project-ref].supabase.co
const buildTimeUrl = supabaseUrl || 'https://placeholder-build.supabase.co'
// Using a valid JWT format (minimal valid JWT structure)
const buildTimeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJidWlsZC10aW1lLXBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24ifQ.build-placeholder-key'

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    // Server-side/build time: just warn, use placeholders
    console.warn('Supabase URL or Anon Key not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.')
  } else {
    // Client-side: warn but continue (will fail at runtime if actually used)
    console.warn('Supabase URL or Anon Key not configured. The app may not work correctly.')
  }
}

// Create Supabase client
// During build, this will use placeholders if env vars are missing
// At runtime in the browser, it will use the actual values from environment variables
// Note: For static export, env vars are baked into the build, so they must be set during build
let supabaseInstance: SupabaseClient | null = null

try {
  supabaseInstance = createClient(buildTimeUrl, buildTimeKey)
} catch (error) {
  // If client creation fails, create a minimal client that will fail gracefully at runtime
  console.error('Failed to create Supabase client:', error)
  // Fallback: create with minimal valid values
  supabaseInstance = createClient('https://placeholder.supabase.co', 'placeholder-key')
}

export const supabase: SupabaseClient = supabaseInstance!

