'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * OAuth Callback Redirect Component
 * 
 * Handles the case where OAuth providers redirect to the root URL (/)
 * with a code parameter, instead of directly to /api/callback.
 * This ensures the OAuth flow works correctly in production.
 */
export function OAuthCallbackRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            // OAuth callback detected - redirect to the callback handler
            // Preserve all query parameters (code, next, etc.)
            const params = new URLSearchParams(searchParams.toString());
            router.replace(`/api/callback?${params.toString()}`);
        }
    }, [searchParams, router]);

    return null; // This component doesn't render anything
}
