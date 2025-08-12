import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = url && anon ? createClient(url, anon, { auth: { persistSession: false } }) : null;

/**
 * Configuration for API endpoints when supabase client is not available
 */
export const apiConfig = {
  baseUrl: url ? `${url}/rest/v1` : '',
  endpoints: {
    swipes: '/swipes',
    participants: '/participants'
  }
};
