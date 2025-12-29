# Authentication System Setup

## Overview
The authentication system has been rebuilt from scratch using Supabase Auth with a 14-day (2-week) session timeout configuration.

## Session Timeout Configuration

### Cookie Expiration (Already Configured)
The application code has been configured to set cookie expiration to 14 days (1,209,600 seconds) in:
- `src/middleware.ts`
- `src/lib/supabase/server.ts`

### Supabase Dashboard Configuration (Required)
To complete the 14-day session timeout setup, you need to configure the following in your Supabase Dashboard:

1. **JWT Expiration Time**:
   - Go to: [Auth Settings](https://supabase.com/dashboard/project/_/settings/auth)
   - Navigate to "Advanced Settings"
   - Set "JWT expiry time" to `1209600` seconds (14 days)
   - Note: The default is 3600 seconds (1 hour)

2. **Time-box User Sessions** (Optional but Recommended):
   - In the same Auth Settings page
   - Set "Time-box user sessions" to `1209600` seconds (14 days)
   - This ensures sessions expire after 14 days regardless of activity

3. **Inactivity Timeout** (Optional):
   - Set "Inactivity timeout" to `1209600` seconds (14 days)
   - This will expire sessions after 14 days of inactivity

## How It Works

1. **Session Persistence**: 
   - Sessions are stored in cookies with a 14-day expiration
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
   - After 14 days, the session should expire
   - User will need to log in again

## JWT Secret Configuration

If you need the JWT secret for server-side JWT verification:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** (gear icon in the sidebar)
4. Click on **API** in the settings menu (you'll see "API Keys" section)
5. Scroll down to find **JWT Settings** section
6. Look for **JWT Secret** - it will be a long base64-encoded string (64+ characters)
7. Click **Reveal** or **Copy** to get your JWT secret
8. Add it to your `.env.local` file as `SUPABASE_JWT_SECRET`

**Note**: 
- The JWT secret is only needed if you're doing custom JWT verification on the server
- For most applications using Supabase's built-in auth, this is **optional** and not required
- The JWT secret is a long base64 string, NOT a UUID format
- If you can't find it or don't need it, you can skip this configuration

## Notes

- The session timeout is managed by Supabase Auth on the server side
- Cookie expiration is set to match the session timeout for consistency
- The middleware handles session refresh automatically
- All authentication uses PKCE flow for security

