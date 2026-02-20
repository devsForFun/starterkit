import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type Unit = 'ms' | 's' | 'm' | 'h' | 'd';
type Duration = `${number} ${Unit}` | `${number}${Unit}`;

// Default response when rate limiting is not available
const defaultRateLimitResponse = {
  success: true,
  pending: Promise.resolve(),
  limit: 999,
  remaining: 999,
  reset: Date.now() + 1000,
};

// Check if Upstash environment variables are configured
function isUpstashConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// A function to create a ratelimiter instance with a given configuration
export function createRateLimiter(requests: number, duration: Duration) {
  // During development or if Upstash is not configured, skip rate limiting
  if (process.env.NODE_ENV === 'development' || !isUpstashConfigured()) {
    if (!isUpstashConfigured() && process.env.NODE_ENV === 'production') {
      console.warn('[RateLimit] Upstash not configured - rate limiting disabled');
    }
    return {
      limit: async () => defaultRateLimitResponse,
    };
  }

  // Create the actual rate limiter
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, duration),
    analytics: true,
    prefix: `@clndr/ratelimit/${requests}-requests/${duration.replace(' ', '')}`,
  });

  // Return a wrapper that fails gracefully
  return {
    limit: async (identifier: string) => {
      try {
        return await ratelimit.limit(identifier);
      } catch (error) {
        console.error('[RateLimit] Failed to check rate limit, allowing request:', error);
        // Fail open - allow the request if rate limiting fails
        return defaultRateLimitResponse;
      }
    },
  };
}
