/**
 * Database Configuration Module
 * Initializes and exports a Supabase client for server-side database operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

/**
 * Creates a Supabase client instance using service role credentials
 * Service role key provides elevated permissions for backend operations
 * 
 * Environment Variables Required:
 * - SUPABASE_URL: The Supabase project URL
 * - SUPABASE_SERVICE_KEY: Service role key for server-side access
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Export the configured Supabase client for use across backend modules
 */
module.exports = supabase;

