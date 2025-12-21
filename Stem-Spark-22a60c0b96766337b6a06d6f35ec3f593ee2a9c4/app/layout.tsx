import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stem-Spark - Empowering Future Innovators",
  description: "Join the next generation of technology leaders through cutting-edge STEM education, hands-on learning experiences, and real-world applications.",
  keywords: ["STEM", "education", "technology", "innovation", "learning", "academy"],
  authors: [{ name: "Novakinetix Academy" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Prevent zoom on iOS */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {/* Mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        
        {/* Client-side script for scroll-to-top functionality */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Scroll to top when page loads
              if (typeof window !== 'undefined') {
                window.scrollTo(0, 0);
                
                // Reset scroll position on route change
                const handleRouteChange = () => {
                  window.scrollTo(0, 0);
                };
                
                // Listen for route changes
                window.addEventListener('popstate', handleRouteChange);
                
                // Also scroll to top on initial load
                window.addEventListener('load', () => {
                  window.scrollTo(0, 0);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
