import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Disable turbopack for production builds (Vercel compatibility)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Optimize images for Vercel
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Vercel optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Ensure proper static file handling
  trailingSlash: false,
  // Fix workspace root detection
  outputFileTracingRoot: __dirname,
}

export default nextConfig