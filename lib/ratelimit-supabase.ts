/**
 * Supabase-based Rate Limiter
 *
 * A reusable rate limiting utility that uses Supabase as the backend.
 * Designed to be portable across projects with the same tech stack.
 *
 * Prerequisites:
 * - Run the migration that creates `rate_limit_entries` table and functions
 * - Functions: check_rate_limit, record_rate_limit_attempt
 *
 * Usage:
 * ```typescript
 * import { checkRateLimit, recordRateLimitAttempt } from '@/lib/ratelimit-supabase';
 *
 * // In a server action or API route:
 * const { allowed, remaining, resetAt } = await checkRateLimit(
 *   clientIp,
 *   'access_code_validation',
 *   3,    // max 3 attempts
 *   3600  // per hour (3600 seconds)
 * );
 *
 * if (!allowed) {
 *   return { error: 'Too many attempts. Try again later.', resetAt };
 * }
 *
 * // If the attempt fails, record it
 * if (!isValidAttempt) {
 *   await recordRateLimitAttempt(clientIp, 'access_code_validation');
 * }
 * ```
 */

import { createClient } from '@/utils/supabase/server';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
}

/**
 * Check if an action is rate limited
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param actionKey - Action being rate limited (e.g., "access_code_validation")
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowSeconds - Time window in seconds
 * @returns Object with allowed status, remaining attempts, and reset time
 */
export async function checkRateLimit(
    identifier: string,
    actionKey: string,
    maxAttempts: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    // In development, skip rate limiting
    if (process.env.NODE_ENV === 'development') {
        return {
            allowed: true,
            remaining: maxAttempts,
            resetAt: new Date(Date.now() + windowSeconds * 1000),
        };
    }

    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('check_rate_limit', {
            p_identifier: identifier,
            p_action_key: actionKey,
            p_max_attempts: maxAttempts,
            p_window_seconds: windowSeconds,
        });

        if (error) {
            console.error('Rate limit check error:', error);
            // Fail open - allow the request if rate limiting fails
            return {
                allowed: true,
                remaining: maxAttempts,
                resetAt: new Date(Date.now() + windowSeconds * 1000),
            };
        }

        const result = data?.[0] || { allowed: true, current_count: 0, reset_at: new Date() };

        return {
            allowed: result.allowed,
            remaining: Math.max(0, maxAttempts - result.current_count),
            resetAt: new Date(result.reset_at),
        };
    } catch (error) {
        console.error('Rate limit check error:', error);
        // Fail open
        return {
            allowed: true,
            remaining: maxAttempts,
            resetAt: new Date(Date.now() + windowSeconds * 1000),
        };
    }
}

/**
 * Record a rate limit attempt (call this when an attempt fails)
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param actionKey - Action being rate limited (e.g., "access_code_validation")
 */
export async function recordRateLimitAttempt(
    identifier: string,
    actionKey: string
): Promise<void> {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
        return;
    }

    try {
        const supabase = await createClient();

        const { error } = await supabase.rpc('record_rate_limit_attempt', {
            p_identifier: identifier,
            p_action_key: actionKey,
        });

        if (error) {
            console.error('Record rate limit attempt error:', error);
        }
    } catch (error) {
        console.error('Record rate limit attempt error:', error);
    }
}

/**
 * Get client IP address from request headers
 * Works with Next.js API routes and Server Actions
 *
 * @param headers - Request headers object
 * @returns IP address string
 */
export function getClientIp(headers: Headers): string {
    // Check common headers for IP address
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a generic identifier
    return 'unknown';
}
