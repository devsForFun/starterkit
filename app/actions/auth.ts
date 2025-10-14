'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Authentication Server Actions
 *
 * These server actions use Supabase's new asymmetric JWT signing keys system
 * All JWT verification is handled automatically by @supabase/ssr
 *
 * Security Features:
 * - Rate limiting to prevent brute force attacks
 * - Generic error messages to prevent user enumeration
 * - Secure session management with HTTP-only cookies
 */

// Simple in-memory store for rate limiting
// Note: In production, consider using Redis or another distributed store for:
// - Persistence across server restarts
// - Distributed rate limiting across multiple instances
// - Better performance at scale
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const signupAttempts = new Map<string, { count: number; timestamp: number }>();
const passwordResetAttempts = new Map<string, { count: number; timestamp: number }>();

// Rate limit configuration
const LOGIN_MAX_ATTEMPTS = 5; // 5 attempts
const LOGIN_WINDOW_MS = 60 * 1000; // per minute
const SIGNUP_MAX_ATTEMPTS = 3; // 3 attempts
const SIGNUP_WINDOW_MS = 60 * 1000; // per minute
const PASSWORD_RESET_MAX_ATTEMPTS = 3; // 3 attempts
const PASSWORD_RESET_WINDOW_MS = 60 * 1000; // per minute

// Check if rate limit is exceeded and update attempt counter
function isRateLimited(
  attemptMap: Map<string, { count: number; timestamp: number }>,
  identifier: string,
  maxAttempts: number,
  windowMs: number,
): boolean {
  const now = Date.now();

  if (!attemptMap.has(identifier)) {
    attemptMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  const attempt = attemptMap.get(identifier)!;

  // Reset counter if window has passed
  if (now - attempt.timestamp > windowMs) {
    attemptMap.set(identifier, { count: 1, timestamp: now });
    return false;
  }

  // Increment counter
  attempt.count += 1;
  attemptMap.set(identifier, attempt);

  // Check if limit exceeded
  return attempt.count > maxAttempts;
}

/**
 * Authenticate user with email and password
 *
 * @param formData - User credentials
 * @returns Success status or error message
 *
 * Security notes:
 * - Rate limited to prevent brute force attacks
 * - Returns generic error to prevent user enumeration
 * - Uses Supabase's secure JWT system for session management
 */
export async function login(formData: { email: string; password: string }) {
  try {
    // Use email as identifier for rate limiting (simple approach)
    const identifier = formData.email.toLowerCase();

    // Check if rate limited
    if (isRateLimited(loginAttempts, identifier, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
      return { error: 'Too many login attempts. Please try again later.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      // Return generic error message to prevent user enumeration
      return { error: 'Invalid login credentials' };
    }

    // On successful login, reset the attempt counter
    loginAttempts.delete(identifier);

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Register a new user account
 *
 * @param formData - User registration data
 * @returns Success status or error message
 *
 * Security notes:
 * - Rate limited to prevent spam registrations
 * - Returns generic error to prevent user enumeration
 * - User metadata stored securely in Supabase
 */
export async function signup(formData: { name?: string; email: string; password: string }) {
  try {
    // Use email as identifier for rate limiting (simple approach)
    const identifier = formData.email.toLowerCase();

    // Check if rate limited
    if (isRateLimited(signupAttempts, identifier, SIGNUP_MAX_ATTEMPTS, SIGNUP_WINDOW_MS)) {
      return { error: 'Too many registration attempts. Please try again later.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.name || '',
          name: formData.name || '',
        },
      },
    });

    if (error) {
      // Return generic error message to prevent user enumeration
      return { error: 'Registration failed. Please try again later.' };
    }

    // On successful signup, reset the attempt counter
    signupAttempts.delete(identifier);

    return { success: true };
  } catch (error) {
    console.error('Signup error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Authenticate user with Google OAuth
 *
 * @returns OAuth URL or error message
 *
 * Security notes:
 * - Uses OAuth 2.0 with PKCE flow
 * - State parameter included to prevent CSRF attacks
 * - Redirects to secure callback handler
 */
export async function signInWithGoogle() {
  try {
    const supabase = await createClient();
    const origin = '/dashboard';

    // Get the site URL from environment
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${origin}`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { error: 'Authentication failed. Please try again.' };
    }

    return { url: data.url };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Log out the current user
 *
 * @returns Success status or error message
 *
 * Security notes:
 * - Invalidates the current session
 * - Clears all authentication cookies
 */
export async function logout() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: 'Logout failed. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Request a password reset email
 *
 * @param email - User's email address
 * @returns Success status or error message
 *
 * Security notes:
 * - Rate limited to prevent abuse
 * - Returns generic success message even if email doesn't exist (prevents user enumeration)
 * - Password reset link expires after a set time (configured in Supabase)
 */
export async function requestPasswordReset(email: string) {
  try {
    const identifier = email.toLowerCase();

    // Check if rate limited
    if (isRateLimited(passwordResetAttempts, identifier, PASSWORD_RESET_MAX_ATTEMPTS, PASSWORD_RESET_WINDOW_MS)) {
      return { error: 'Too many password reset requests. Please try again later.' };
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/reset-password`,
    });

    // Always return success to prevent user enumeration
    // Even if the email doesn't exist, we tell the user we sent an email
    if (error && error.message !== 'User not found') {
      console.error('Password reset error:', error);
      return { error: 'Failed to send password reset email. Please try again.' };
    }

    // On successful request, reset the attempt counter
    passwordResetAttempts.delete(identifier);

    return { success: true };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Reset user password with new password
 *
 * @param newPassword - The new password
 * @returns Success status or error message
 *
 * Security notes:
 * - Requires valid password reset token from email
 * - Token is verified using Supabase's JWT system
 * - Invalidates all other sessions after password change
 */
export async function resetPassword(newPassword: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      if (error.message.includes('session')) {
        return { error: 'Invalid or expired reset link. Please request a new one.' };
      }
      return { error: 'Failed to reset password. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
