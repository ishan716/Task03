// backend/db.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();  // load .env variables

// Use service role key for server-side operations
const supabase = createClient(     //this is used to create a superbase client
  process.env.SUPABASE_URL,        // and this client uses for interact backend with database
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;

