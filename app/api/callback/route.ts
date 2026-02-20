import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isGoogleSignupAllowed } from '@/lib/feature-flags';

/**
 * OAuth Callback Handler
 *
 * Handles the OAuth callback from providers like Google.
 * Exchanges the authorization code for a session and creates
 * user profile if it doesn't exist (and signups are allowed).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  console.log('[OAuth Callback] Received callback with code:', code ? 'present' : 'missing');

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('[OAuth Callback] Session exchange error:', sessionError);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'Authentication failed');
      return NextResponse.redirect(loginUrl);
    }

    if (sessionData?.user) {
      console.log('[OAuth Callback] User authenticated:', sessionData.user.email);

      // Check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', sessionData.user.id)
        .single();

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist - this is a new user
        console.log('[OAuth Callback] New user detected:', sessionData.user.email);

        // Check if new signups via Google are allowed
        if (!isGoogleSignupAllowed()) {
          console.log('[OAuth Callback] Google signups disabled, rejecting new user');

          // Sign out the user since they shouldn't have been created
          await supabase.auth.signOut();

          const loginUrl = new URL('/login', origin);
          loginUrl.searchParams.set('error', 'New registrations are currently closed. Please contact the administrator.');
          return NextResponse.redirect(loginUrl);
        }

        // Signups allowed - create the profile
        console.log('[OAuth Callback] Creating user profile for:', sessionData.user.email);

        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: sessionData.user.id,
          email: sessionData.user.email,
          full_name: sessionData.user.user_metadata?.full_name || sessionData.user.user_metadata?.name || '',
          username: null, // Will be set later by the user
          avatar_url: sessionData.user.user_metadata?.avatar_url || null,
        });

        if (insertError) {
          console.error('[OAuth Callback] Profile creation error:', insertError);
        } else {
          console.log('[OAuth Callback] User profile created successfully');
        }
      } else if (profile) {
        console.log('[OAuth Callback] User profile already exists');
      } else if (profileError) {
        console.error('[OAuth Callback] Profile lookup error:', profileError);
      }

      // Successful authentication - redirect to the next URL or dashboard
      const redirectUrl = new URL(next, origin);
      console.log('[OAuth Callback] Redirecting to:', redirectUrl.toString());
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there's an error or no code, redirect to login with error
  console.log('[OAuth Callback] No code or user, redirecting to login');
  const loginUrl = new URL('/login', origin);
  loginUrl.searchParams.set('error', 'Authentication failed');
  return NextResponse.redirect(loginUrl);
}
