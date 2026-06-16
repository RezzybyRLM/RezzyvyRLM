import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Youtube, Instagram } from 'lucide-react'

const COLUMNS = [
  {
    title: 'For Job Seekers',
    links: [
      { href: '/jobs', label: 'Find Jobs' },
      { href: '/companies', label: 'Companies' },
      { href: '/resume-optimizer', label: 'Resume Optimizer' },
      { href: '/plans', label: 'Pricing' },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/resume-services', label: 'Resume Services' },
      { href: '/interview-pro', label: 'Interview Pro' },
      { href: '/job-alerts', label: 'Smart Job Alerts' },
      { href: '/donate', label: 'Support Us' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about-us', label: 'About Us' },
      { href: '/contact-us', label: 'Contact' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
]

const SOCIALS = [
  { href: 'https://facebook.com/rezzybyrlm', label: 'Facebook', Icon: Facebook },
  { href: 'https://twitter.com/RezzybyRLM', label: 'Twitter', Icon: Twitter },
  { href: 'https://youtube.com/RezzybyRLM', label: 'YouTube', Icon: Youtube },
  { href: 'https://instagram.com/rezzybyrlm', label: 'Instagram', Icon: Instagram },
]

export function Footer() {
  return (
    <footer className="bg-secondary-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.png" alt="Rezzy" width={40} height={40} className="object-contain" />
              <span className="text-xl font-extrabold text-white">Rezzy</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              The powerful tool to streamline your employment search. We support, empower,
              and free your time so you can pursue your next career move.
            </p>
            <div className="flex gap-3 mt-5">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-200 hover:bg-primary-500 hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 mt-10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Rezzy by RLM, LLC. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500 text-center">
            Jobs sourced from third-party providers including Indeed.com — we are not affiliated with Indeed. Apply links may redirect to external sites.
          </p>
        </div>
      </div>
    </footer>
  )
}
