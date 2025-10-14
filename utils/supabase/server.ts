import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase server client for use in Server Components, Server Actions, and Route Handlers
 * Uses Supabase's new asymmetric JWT signing keys system for secure authentication
 *
 * @returns {Promise<SupabaseClient>} A configured Supabase client instance
 * @throws {Error} If required environment variables are missing
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required',
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              // Secure cookie options for production
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored if middleware is handling session refresh.
        }
      },
    },
    auth: {
      // Automatically refresh authentication tokens before they expire
      autoRefreshToken: true,
      // Persist the session to cookies
      persistSession: true,
      // Detect session from URL (for OAuth callbacks)
      detectSessionInUrl: true,
    },
  });
}
