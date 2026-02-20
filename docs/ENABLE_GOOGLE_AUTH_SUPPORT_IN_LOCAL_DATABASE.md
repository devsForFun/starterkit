# Enable Google Auth Support in Local Database

## Problem

Currently, the local Supabase database does not support Google OAuth.

## Solution

To enable Google OAuth support, you need to add the following to the `supabase/config.toml` file:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
# DO NOT commit your OAuth provider secret to git. Use environment variable substitution instead:
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
# Overrides the default auth redirectUrl.
redirect_uri = ""
# If enabled, the nonce check will be skipped. Required for local sign in with Google auth.
skip_nonce_check = true
```

and have the following environment variables set in `.env.local`:

```bash
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="your-client-id"
export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="your-secret"
```