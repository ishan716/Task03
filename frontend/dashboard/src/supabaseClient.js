// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

import { createClient } from '@supabase/supabase-js'  // Supabase client library

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================
// Initialize Supabase client with project credentials
// These credentials are for frontend (anonymous) access only

/**
 * Supabase Project URL
 * Unique URL for your Supabase project instance
 * Used to connect to your backend database
 */
const supabaseUrl = 'https://nvpknwtppuejrffaswlh.supabase.co'

/**
 * Supabase Anonymous Key
 * Public API key for frontend authentication
 * Allows unauthenticated read/write operations based on Row Level Security policies
 * WARNING: This key is visible in client-side code and should be treated as public
 */
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cGtud3RwcHVlanJmZmFzd2xoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1NzY0OTAsImV4cCI6MjA3MjE1MjQ5MH0.6acQrRjS5RUXOF9j3TqZ0ikj6oVzA71opR5gIa6NFsQ'

// ============================================================================
// CREATE SUPABASE CLIENT
// ============================================================================

/**
 * Initialize Supabase Client
 * Creates a client instance for frontend database operations
 * Used for real-time data sync, authentication, and database queries
 * @type {SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================================
// END OF FILE
// ============================================================================