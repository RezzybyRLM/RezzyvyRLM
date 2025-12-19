import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ConditionalLayout } from '@/components/layout/conditional-layout'
import { Analytics } from '@vercel/analytics/react'
import { createClient } from '@/lib/supabase/server'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

// Helper function to safely create URL
function getMetadataBase(): URL {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    // Ensure URL has protocol
    if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
      return new URL(`https://${siteUrl}`)
    }
    return new URL(siteUrl)
  } catch {
    return new URL('http://localhost:3000')
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: 'Rezzy - AI-Powered Job Aggregator',
  description: 'Find your dream job and prepare with AI-powered career tools. Streamline your employment search with Indeed integration and personalized career coaching.',
  keywords: ['jobs', 'career', 'AI', 'resume', 'interview', 'Indeed', 'employment'],
  authors: [{ name: 'Rezzy Team' }],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Rezzy - AI-Powered Job Aggregator',
    description: 'Find your dream job and prepare with AI-powered career tools.',
    type: 'website',
    locale: 'en_US',
    images: ['/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rezzy - AI-Powered Job Aggregator',
    description: 'Find your dream job and prepare with AI-powered career tools.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <head>
        {/* Suppress CORS errors from third-party scripts */}
        <Script
          id="suppress-cors-errors"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress CORS errors from third-party scripts (like feedback.js)
              const originalFetch = window.fetch;
              window.fetch = function(...args) {
                return originalFetch.apply(this, args).catch(error => {
                  // Silently handle CORS errors from third-party scripts
                  if (error.message && error.message.includes('Failed to fetch')) {
                    console.debug('Suppressed CORS error from third-party script');
                    return Promise.reject(error);
                  }
                  throw error;
                });
              };
              
              // Suppress unhandled promise rejections from third-party scripts
              window.addEventListener('unhandledrejection', function(event) {
                const error = event.reason;
                if (error && (
                  error.message?.includes('Failed to fetch') ||
                  error.message?.includes('ERR_ABORTED') ||
                  error.message?.includes('CORS') ||
                  error.stack?.includes('feedback.js')
                )) {
                  console.debug('Suppressed unhandled rejection from third-party script:', error.message);
                  event.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ConditionalLayout user={user}>
          {children}
        </ConditionalLayout>
        <Analytics />
      </body>
    </html>
  )
}
