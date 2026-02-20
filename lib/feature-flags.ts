/**
 * Feature Flags Configuration
 *
 * Environment variable-based feature flags for controlling authentication access.
 * All client-side flags use NEXT_PUBLIC_ prefix, server-side flags are private.
 */

// Client-side flags (available in browser)

/**
 * Master switch for auth pages.
 * When disabled, all auth pages show "Registrations closed" message.
 */
export const isAuthEnabled = () => process.env.NEXT_PUBLIC_AUTH_ENABLED === '1';

/**
 * Toggle for email+password authentication on the LOGIN page.
 * When disabled, email/password form is hidden but Google sign-in remains.
 */
export const isLoginEmailAuthEnabled = () => process.env.NEXT_PUBLIC_LOGIN_EMAIL_AUTH_ENABLED === '1';

/**
 * Toggle for email+password authentication on the REGISTER page.
 * When disabled, registration form is hidden but Google sign-in remains.
 */
export const isRegisterEmailAuthEnabled = () => process.env.NEXT_PUBLIC_REGISTER_EMAIL_AUTH_ENABLED === '1';

/**
 * Toggle for forgot password page.
 * When disabled, the forgot password page shows access denied.
 */
export const isForgotPasswordEnabled = () => process.env.NEXT_PUBLIC_FORGOT_PASSWORD_ENABLED === '1';

/**
 * Toggle for reset password page.
 * When disabled, the reset password page shows access denied.
 */
export const isResetPasswordEnabled = () => process.env.NEXT_PUBLIC_RESET_PASSWORD_ENABLED === '1';

// Server-side flags (not exposed to browser)

/**
 * Allow new user creation via Google OAuth.
 * When disabled, only existing users can sign in with Google.
 */
export const isGoogleSignupAllowed = () => process.env.AUTH_ALLOW_GOOGLE_SIGNUP === '1';

