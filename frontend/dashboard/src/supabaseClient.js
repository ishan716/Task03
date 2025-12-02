// Replace the entire supabaseClient.js file with this:

import { createClient } from '@supabase/supabase-js'

// Your Supabase credentials
const supabaseUrl = 'https://nvpknwtppuejrffaswlh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cGtud3RwcHVlanJmZmFzd2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzY0OTAsImV4cCI6MjA3MjE1MjQ5MH0.6acQrRjS5RUXOF9j3TqZ0ikj6oVzA71opR5gIa6NFsQ'

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  }
})

// IMPORTANT: Remove the hardcoded backend URL
// Your frontend should use relative paths for API calls
export const BACKEND_URL = '/api' // This will be handled by Vercel rewrites