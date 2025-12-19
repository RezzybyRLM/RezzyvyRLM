# Authentication System Setup

## Overview
The authentication system has been rebuilt from scratch using Supabase Auth with a 5-day session timeout configuration.

## Session Timeout Configuration

### Cookie Expiration (Already Configured)
The application code has been configured to set cookie expiration to 5 days (432,000 seconds) in:
- `src/middleware.ts`
- `src/lib/supabase/server.ts`

### Supabase Dashboard Configuration (Required)
To complete the 5-day session timeout setup, you need to configure the following in your Supabase Dashboard:

1. **JWT Expiration Time**:
   - Go to: [Auth Settings](https://supabase.com/dashboard/project/_/settings/auth)
   - Navigate to "Advanced Settings"
   - Set "JWT expiry time" to `432000` seconds (5 days)
   - Note: The default is 3600 seconds (1 hour)

2. **Time-box User Sessions** (Optional but Recommended):
   - In the same Auth Settings page
   - Set "Time-box user sessions" to `432000` seconds (5 days)
   - This ensures sessions expire after 5 days regardless of activity
`-
3. **Inactivity Timeout** (Optional):
   - Set "Inactivity timeout" to `432000` seconds (5 days)
   - This will expire sessions after 5 days of inactivity

## How It Works

1. **Session Persistence**: 
   - Sessions are stored in cookies with a 5-day expiration
   - The middleware automatically refreshes sessions on each request
   - Sessions persist across page reloads

2. **Authentication Flow**:
   - Login: `/auth/login`
   - Register: `/auth/register`
   - Forgot Password: `/auth/forgot-password`
   - Callback: `/auth/callback` (handles OAuth and email verification)

3. **Protected Routes**:
   - All routes under `/dashboard`, `/profile`, `/resume-manager`, etc. are protected
   - Unauthenticated users are redirected to `/auth/login`
   - Authenticated users accessing auth pages are redirected to `/dashboard`

## Testing

To verify the authentication system works correctly:

1. **Login Flow**:
   - Navigate to `/auth/login`
   - Enter credentials and sign in
   - Should redirect to `/dashboard`

2. **Session Persistence**:
   - After logging in, reload the page
   - Session should persist and user should remain logged in

3. **Session Timeout**:
   - After 5 days, the session should expire
   - User will need to log in again

## Notes

- The session timeout is managed by Supabase Auth on the server side
- Cookie expiration is set to match the session timeout for consistency
- The middleware handles session refresh automatically
- All authentication uses PKCE flow for security

