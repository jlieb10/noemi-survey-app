/* global process */
import { createClient } from '@supabase/supabase-js';

// Attempt to read configuration from both Vite and Node environments.
// In some contexts (tests, server-side), `import.meta.env` may be
// undefined, so we fall back to `process.env`.
const url =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) ||
  '';

const anonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) ||
  '';

// Only create the client if configuration is provided. This prevents
// confusing "Invalid API key" errors when env vars are missing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

if (!supabase) {
  console.warn('Supabase credentials are missing; data will not be persisted.');
}
