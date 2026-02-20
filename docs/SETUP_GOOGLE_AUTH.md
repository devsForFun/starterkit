# Setup Google Auth

## Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Go to "APIs & Services" -> "Credentials"
4. Click "Create Credentials" -> "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/callback/google`
7. Copy the Client ID and Client Secret
8. Add them to your `.env.local` file:
   ```env
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your-client-id
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=your-client-secret
   ```
9. Ensure you have followed the steps in [ENABLE_GOOGLE_AUTH_SUPPORT_IN_LOCAL_DATABASE.md](./ENABLE_GOOGLE_AUTH_SUPPORT_IN_LOCAL_DATABASE.md)
10. Restart your local Supabase instance:
    ```bash
    supabase stop
    supabase start
    ```
