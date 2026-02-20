# Rate Limiting with Supabase

A reusable, database-backed rate limiting solution using Supabase PostgreSQL — no external services or API keys required. It follows the **shadcn philosophy** — files you own and can customize freely.

## Overview

This approach stores rate limit entries directly in your Supabase database using a `rate_limit_entries` table and PostgreSQL functions. It's a great alternative to Redis-based solutions (like Upstash) when you want to keep your infrastructure minimal.

**How it works:**

1. Each failed/tracked attempt is recorded as a row in `rate_limit_entries`
2. `check_rate_limit()` counts recent attempts within a sliding time window
3. If the count exceeds the configured maximum, the request is denied
4. Old entries are automatically cleaned up via a scheduled function

## Files

| File | Purpose |
|------|---------|
| `lib/ratelimit-supabase.ts` | TypeScript client with `checkRateLimit()`, `recordRateLimitAttempt()`, and `getClientIp()` helpers |

## Setup

### 1. Create the database migration

Use the Supabase CLI to generate a new migration file:

```bash
supabase migration new create_rate_limit_infrastructure
```

This creates a new `.sql` file inside `supabase/migrations/`. Open the generated file and paste the following SQL:

```sql
-- ============================================================================
-- 1. Create reusable rate limiting infrastructure
-- ============================================================================
-- Rate limit entries table (designed to be reusable across projects)
CREATE TABLE rate_limit_entries (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,        -- e.g., IP address, user ID
  action_key TEXT NOT NULL,        -- e.g., "access_code_validation", "login_attempt"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient rate limit checks
CREATE INDEX idx_rate_limit_lookup ON rate_limit_entries(identifier, action_key, created_at DESC);

-- Cleanup old rate limit entries (run periodically via cron or scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_entries()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_entries 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check rate limit (reusable)
-- Returns TRUE if the action is ALLOWED, FALSE if rate limited
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action_key TEXT,
  p_max_attempts INT,
  p_window_seconds INT
)
RETURNS TABLE(allowed BOOLEAN, current_count INT, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Count attempts in the current window
  SELECT COUNT(*)::INT INTO v_count
  FROM rate_limit_entries
  WHERE identifier = p_identifier
    AND action_key = p_action_key
    AND created_at >= v_window_start;
  
  -- Return result
  allowed := v_count < p_max_attempts;
  current_count := v_count;
  reset_at := v_window_start + (p_window_seconds || ' seconds')::INTERVAL;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a rate limit attempt
CREATE OR REPLACE FUNCTION record_rate_limit_attempt(
  p_identifier TEXT,
  p_action_key TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO rate_limit_entries (identifier, action_key)
  VALUES (p_identifier, p_action_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. RLS for rate_limit_entries (service role only)
-- ============================================================================
ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;

-- No direct user access - only through functions
-- Functions are SECURITY DEFINER so they run with owner privileges

-- ============================================================================
-- 3. Comments for documentation
-- ============================================================================
COMMENT ON TABLE rate_limit_entries IS 'Reusable rate limiting table - tracks attempts per identifier/action';
COMMENT ON FUNCTION check_rate_limit IS 'Check if an action is rate limited. Returns allowed status and reset time.';
COMMENT ON FUNCTION record_rate_limit_attempt IS 'Record a failed attempt for rate limiting purposes.';
```

### 2. Apply the migration

**Local development:**

```bash
supabase db reset
```

**Production (linked project):**

```bash
supabase db push
```

### 3. You're done

The TypeScript client (`lib/ratelimit-supabase.ts`) is already in the project. No packages to install.

> **Note:** Rate limiting is automatically **skipped in development** (`NODE_ENV === 'development'`), so you won't be blocked during local testing.

## Usage

### Checking and recording rate limits

Use `checkRateLimit()` and `recordRateLimitAttempt()` in any **server action** or **API route**:

```typescript
import {
  checkRateLimit,
  recordRateLimitAttempt,
  getClientIp,
} from "@/lib/ratelimit-supabase";
import { headers } from "next/headers";

export async function someServerAction(formData: FormData) {
  const headersList = await headers();
  const clientIp = getClientIp(headersList);

  // Check if the user is rate limited
  const { allowed, remaining, resetAt } = await checkRateLimit(
    clientIp,
    "login_attempt",  // a unique key for this action
    5,                 // max 5 attempts
    3600               // per hour (in seconds)
  );

  if (!allowed) {
    return {
      error: `Too many attempts. Try again after ${resetAt.toLocaleTimeString()}.`,
    };
  }

  // ... perform the action ...

  // If the attempt fails, record it
  if (!success) {
    await recordRateLimitAttempt(clientIp, "login_attempt");
  }
}
```

### Getting the client IP

The `getClientIp()` helper extracts the client's IP address from request headers. It checks `x-forwarded-for` and `x-real-ip` headers (common with reverse proxies and Vercel), falling back to `'unknown'`.

```typescript
import { getClientIp } from "@/lib/ratelimit-supabase";
import { headers } from "next/headers";

const headersList = await headers();
const clientIp = getClientIp(headersList);
```

## API Reference

### `checkRateLimit(identifier, actionKey, maxAttempts, windowSeconds)`

Checks whether an action should be allowed or rate limited.

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Unique identifier — typically an IP address or user ID |
| `actionKey` | `string` | A key identifying the action (e.g., `"login_attempt"`, `"api_request"`) |
| `maxAttempts` | `number` | Maximum number of attempts allowed within the window |
| `windowSeconds` | `number` | Sliding window duration in seconds |

**Returns:** `Promise<RateLimitResult>`

```typescript
interface RateLimitResult {
  allowed: boolean;   // true if the action is allowed
  remaining: number;  // how many attempts are left
  resetAt: Date;      // when the current window resets
}
```

### `recordRateLimitAttempt(identifier, actionKey)`

Records a failed attempt. Call this **only when the action fails** (e.g., wrong password, invalid code).

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Same identifier used in `checkRateLimit()` |
| `actionKey` | `string` | Same action key used in `checkRateLimit()` |

### `getClientIp(headers)`

Extracts the client IP from request headers.

| Parameter | Type | Description |
|-----------|------|-------------|
| `headers` | `Headers` | The request `Headers` object (from `next/headers`) |

**Returns:** `string` — the IP address, or `'unknown'` if not found.

## Behavior Notes

- **Fails open** — if the database call errors out, requests are **allowed** through (not blocked). This prevents rate limiting infrastructure issues from taking down your app.
- **Skipped in development** — all rate limit checks return `allowed: true` when `NODE_ENV === 'development'`.
- **SECURITY DEFINER functions** — the PostgreSQL functions run with owner privileges, so no RLS policies need to grant direct access to the `rate_limit_entries` table.

## Cleanup

Old entries are cleaned up by the `cleanup_old_rate_limit_entries()` function, which deletes records older than 24 hours. You can schedule this using:

- **Supabase Cron (pg_cron):** Set up a recurring job in the Supabase dashboard under **Database → Extensions → pg_cron**
- **External cron:** Call the function via a scheduled API route or external cron service

Example pg_cron setup (run in the SQL Editor):

```sql
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',  -- every hour
  $$SELECT cleanup_old_rate_limit_entries()$$
);
```

## Customization

Since you own the code, customize freely:

- **Change the cleanup interval** — edit the `'24 hours'` interval in `cleanup_old_rate_limit_entries()` to suit your needs
- **Add per-user rate limiting** — pass a user ID instead of (or in addition to) the client IP as the `identifier`
- **Combine action keys** — use hierarchical keys like `"api:create_post"` or `"auth:login"` for organized rate limiting
- **Adjust fail-open behavior** — if you prefer to **fail closed** (block on error), modify the `catch` blocks in `ratelimit-supabase.ts`

## Adding to a new project

To use this in another project:

1. Copy `lib/ratelimit-supabase.ts` into your project's `lib/` directory
2. Create the database migration using `supabase migration new` and paste the SQL from [Step 1](#1-create-the-database-migration)
3. Apply the migration with `supabase db reset` (local) or `supabase db push` (production)
4. Ensure your project has the Supabase client utility at `utils/supabase/server.ts`