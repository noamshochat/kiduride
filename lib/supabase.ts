import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase configuration - Hardcoded for GitHub Pages deployment
const supabaseUrl = 'https://valyxhfuehnmmhhhvrsk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbHl4aGZ1ZWhubW1oaGh2cnNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMTgxODgsImV4cCI6MjA3ODg5NDE4OH0.BCDmdZbPCUCu8lMQMsw02YHBl7zB1U0ftuksC-ib74Y'

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

