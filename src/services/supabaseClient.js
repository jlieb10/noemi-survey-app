/**
 * Supabase client configuration and initialization.
 * 
 * Creates a Supabase client instance using environment variables.
 * If environment variables are missing, logs an error and exports null.
 * 
 * @module supabaseClient
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

/**
 * Supabase client instance or null if configuration is missing.
 * Auth session persistence is disabled for this application.
 * 
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = url && anon 
  ? createClient(url, anon, { auth: { persistSession: false } }) 
  : null;
