import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Analytics } from '@vercel/analytics/react'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  )
}
