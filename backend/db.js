// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================

const { createClient } = require('@supabase/supabase-js');  // Supabase client library
require('dotenv').config();                                 // Load environment variables from .env file

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================
// Initializes Supabase client for server-side database operations

/**
 * Creates a Supabase client instance using service role credentials
 * Service role key provides elevated permissions for backend operations
 * Used for all database queries, inserts, updates, and deletes
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: The Supabase project URL
 *   Unique URL for your Supabase project instance
 *   Format: https://projectid.supabase.co
 * 
 * - SUPABASE_SERVICE_KEY: Service role key for server-side access
 *   Private key with full database access (keep secure - never expose to client)
 *   Used only in backend code for privileged operations
 */
const supabase = createClient(
  process.env.SUPABASE_URL,              // Supabase project URL
  process.env.SUPABASE_SERVICE_KEY       // Service role API key
);

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export the configured Supabase client for use across backend modules
 * This instance can be imported and used in any backend file to:
 * - Query database tables
 * - Insert, update, and delete records
 * - Perform real-time subscriptions
 * - Access other Supabase services
 * 
 * Usage Example:
 * const supabase = require('./db');
 * const { data, error } = await supabase.from('events').select('*');
 */
module.exports = supabase;

// ============================================================================
// END OF FILE
// ============================================================================

