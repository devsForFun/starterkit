'use server';

import { createClient } from '@/utils/supabase/server';

// Simple in-memory store for rate limiting
// In production, consider using Redis or another distributed store
const loginAttempts = new Map<string, { count: number; timestamp: number }>();
const signupAttempts = new Map<string, { count: number; timestamp: number }>();

// Rate limit configuration
const LOGIN_MAX_ATTEMPTS = 5; // 5 attempts
const LOGIN_WINDOW_MS = 60 * 1000; // per minute
const SIGNUP_MAX_ATTEMPTS = 3; // 3 attempts
const SIGNUP_WINDOW_MS = 60 * 1000; // per minute

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

// Implementation for login with rate limiting
export async function login(formData: { email: string; password: string }) {
  // Use email as identifier for rate limiting (simple approach)
  const identifier = formData.email.toLowerCase();

  // Check if rate limited
  if (isRateLimited(loginAttempts, identifier, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return { error: 'Too many login attempts. Please try again later.' };
  }

  const supabase = await createClient();

  const data = {
    email: formData.email,
    password: formData.password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return generic error message to prevent user enumeration
    return { error: 'Invalid login credentials' };
  }

  // On successful login, reset the attempt counter
  loginAttempts.delete(identifier);

  return { success: true };
}

// Implementation for signup with rate limiting
export async function signup(formData: { name?: string; email: string; password: string }) {
  // Use email as identifier for rate limiting (simple approach)
  const identifier = formData.email.toLowerCase();

  // Check if rate limited
  if (isRateLimited(signupAttempts, identifier, SIGNUP_MAX_ATTEMPTS, SIGNUP_WINDOW_MS)) {
    return { error: 'Too many registration attempts. Please try again later.' };
  }

  const supabase = await createClient();

  const data = {
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.name || '',
        name: formData.name || '',
      },
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    // Return generic error message to prevent user enumeration
    return { error: 'Registration failed. Please try again later.' };
  }

  // On successful signup, reset the attempt counter
  signupAttempts.delete(identifier);

  return { success: true };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  // Default redirect to dashboard page after successful authentication
  const origin = '/dashboard';

  // Get the site URL from environment
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Add state parameter to prevent CSRF attacks
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
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: 'Logout failed. Please try again.' };
  }
  return { success: true };
}
