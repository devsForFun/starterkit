import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client for operations that bypass RLS policies
 * Use this ONLY for:
 * - API key verification
 * - System-level operations
 * - Email queue processing
 * 
 * IMPORTANT: Never expose this client to the browser
 * Only use in Server Actions and API Routes
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(
            'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for admin client',
        );
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
