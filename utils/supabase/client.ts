import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components and browser context
 * Uses Supabase's new asymmetric JWT signing keys system for secure authentication
 *
 * @returns {SupabaseClient} A configured Supabase client instance
 * @throws {Error} If required environment variables are missing
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required',
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      // Automatically refresh authentication tokens before they expire
      autoRefreshToken: true,
      // Persist the session to browser storage
      persistSession: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
    },
  });
}
