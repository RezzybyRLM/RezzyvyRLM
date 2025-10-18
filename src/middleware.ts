import { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['en', 'es', 'fr', 'de']
const defaultLocale = 'en'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
})

export default function middleware(request: NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(es|fr|de)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
}
