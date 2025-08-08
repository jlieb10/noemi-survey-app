import { createClient } from '@supabase/supabase-js';

// Create a Supabase client using environment variables. When no values
// are provided (for example during local development), the client will
// still be defined but calls will fail unless you add your own keys.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
