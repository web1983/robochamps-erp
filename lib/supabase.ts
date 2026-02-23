import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Note: Supabase supports both legacy format (eyJ...) and new format (sb_publishable_.../sb_secret_...)
// Both formats work with the Supabase client - use whichever you have in your dashboard

// Client-side key (safe to expose in browser - restricted by RLS policies)
// Accepts both: legacy "anon public" key OR new "publishable" key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Client-side Supabase client (using anon/publishable key - safe to expose)
// Currently not used, but kept for potential future client-side operations
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client (uses service role/secret key - MUST be kept secret!)
// This is what we use for file uploads - it bypasses RLS and has full access
// Accepts both: legacy "service_role" key OR new "secret" key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                                process.env.SUPABASE_SECRET_KEY || '';

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('Supabase credentials not configured. File uploads will not work.');
}
