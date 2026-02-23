import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Note: The anon key is safe to expose in the browser - it's designed for this purpose
// It's restricted by Row Level Security (RLS) policies in Supabase
// However, we're not using it in this app since we use service role key for server-side operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (using anon key - safe to expose)
// Currently not used, but kept for potential future client-side operations
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side Supabase client (uses service role key - MUST be kept secret!)
// This is what we use for file uploads - it bypasses RLS and has full access
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
