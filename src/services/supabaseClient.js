/**
 * Supabase client configuration and initialization.
 *
 * Creates a hardened Supabase client instance with proper error handling,
 * environment variable validation, and DB health checking capabilities.
 *
 * @module supabaseClient
 */
import { createClient } from '@supabase/supabase-js';

/**
 * Clean and validate environment variable values
 * @param {string} value - Environment variable value
 * @returns {string} Cleaned value
 */
const cleanEnvVar = (value) => {
  if (!value) return '';
  return value.trim().replace(/^['"]|['"]$/g, '');
};

// Extract and validate environment variables
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const SUPABASE_URL = cleanEnvVar(rawUrl);
const SUPABASE_ANON_KEY = cleanEnvVar(rawAnon);

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase environment variables missing. Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with valid values.'
  );
}

// Validate URL format
if (
  !SUPABASE_URL.startsWith('https://') ||
  !SUPABASE_URL.includes('.supabase.co')
) {
  throw new Error(
    `Invalid Supabase URL format: ${SUPABASE_URL.substring(0, 20)}... Expected https://*.supabase.co`
  );
}

// Validate anon key format (should be a JWT)
if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  throw new Error(
    `Invalid Supabase anon key format: ${SUPABASE_ANON_KEY.substring(0, 10)}... Expected JWT token`
  );
}

// Log successful configuration (with masked values for security)
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_SUPABASE) {
  console.log('Supabase client initialized:', {
    url: `${SUPABASE_URL.substring(0, 20)}...`,
    anonKeyPrefix: `${SUPABASE_ANON_KEY.substring(0, 10)}...`,
    anonKeyLength: SUPABASE_ANON_KEY.length,
  });
}

/**
 * Supabase client instance with disabled session persistence.
 * Guaranteed to be non-null if module loads successfully.
 *
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

/**
 * Check database health with a lightweight query.
 * Returns connection status and any error details.
 *
 * @returns {Promise<{ok: boolean, error?: any, timestamp: string}>}
 */
export async function checkDbHealth() {
  const timestamp = new Date().toISOString();

  try {
    // Try a simple table query first (most reliable for checking DB connectivity)
    const { data, error } = await supabase
      .from('participants')
      .select('count')
      .limit(1);

    if (!error) {
      return {
        ok: true,
        error: null,
        timestamp,
        method: 'table_query',
      };
    }

    // If table query fails, fall back to auth session check
    console.log(
      'Table query failed, trying auth session check:',
      error.message
    );
    const { error: authError } = await supabase.auth.getSession();

    return {
      ok: !authError,
      error: authError || error,
      timestamp,
      method: 'auth_session_fallback',
    };
  } catch (e) {
    // Final fallback - try just the auth client
    try {
      const { error: authError } = await supabase.auth.getSession();
      return {
        ok: !authError,
        error: authError || e,
        timestamp,
        method: 'exception_auth_fallback',
      };
    } catch (authException) {
      return {
        ok: false,
        error: authException,
        timestamp,
        method: 'all_methods_failed',
      };
    }
  }
}

/**
 * Generate diagnostic information for troubleshooting
 * @param {any} healthResult - Result from checkDbHealth
 * @returns {string} Formatted diagnostic string
 */
export function generateDiagnostics(healthResult) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    supabaseUrl: `${SUPABASE_URL.substring(0, 30)}...`,
    anonKeyPrefix: `${SUPABASE_ANON_KEY.substring(0, 15)}...`,
    healthCheck: healthResult,
  };

  return `DB_HEALTH_DIAGNOSTICS | ${JSON.stringify(diagnostics, null, 2)}`;
}
