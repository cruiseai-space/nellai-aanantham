const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a client for user operations (using anon key if available)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || supabaseServiceKey;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseAdmin };
