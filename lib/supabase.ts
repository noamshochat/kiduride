import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we have valid credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey && 
  supabaseUrl.startsWith('https://') && 
  supabaseUrl.includes('.supabase.co')

// For static export builds, provide valid placeholder values if env vars are missing
// These need to pass Supabase's URL validation but won't work at runtime
// Using a valid Supabase URL format that will pass validation
const buildTimeUrl = supabaseUrl || 'https://xxxxxxxxxxxxxxxxxxxxx.supabase.co'
// Using a properly formatted JWT (Supabase validates JWT structure)
// This is a minimal valid JWT that will pass format validation
const buildTimeKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

if (!hasValidCredentials) {
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
  // Use actual values if available, otherwise use placeholders for build
  const urlToUse = hasValidCredentials ? supabaseUrl : buildTimeUrl
  const keyToUse = hasValidCredentials ? supabaseAnonKey : buildTimeKey
  supabaseInstance = createClient(urlToUse, keyToUse)
} catch (error) {
  // If client creation fails, try with the most basic valid format
  console.error('Failed to create Supabase client:', error)
  try {
    // Last resort: use a known valid format
    supabaseInstance = createClient(
      'https://xxxxxxxxxxxxxxxxxxxxx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    )
  } catch (fallbackError) {
    // If even this fails, we're in trouble, but at least log it
    console.error('Failed to create fallback Supabase client:', fallbackError)
    // Create a dummy client that will fail at runtime
    supabaseInstance = createClient('https://dummy.supabase.co', 'dummy-key')
  }
}

export const supabase: SupabaseClient = supabaseInstance!

