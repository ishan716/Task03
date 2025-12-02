// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { createClient } from '@supabase/supabase-js'

// ============================================================================
// SUPABASE CONFIGURATION FROM ENVIRONMENT VARIABLES
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// ============================================================================
// BACKEND URL CONFIGURATION
// ============================================================================

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://event-manager-app-jade.vercel.app'

// ============================================================================
// CREATE SUPABASE CLIENT
// ============================================================================

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
  }
})

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 Supabase configured with URL:', supabaseUrl)
  console.log('🔧 Backend URL:', BACKEND_URL)
}