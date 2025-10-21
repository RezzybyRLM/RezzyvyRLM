import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Youtube, Instagram, Mail, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </Link>
            <p className="text-gray-300 mb-4 max-w-md">
              The powerful tool to streamline your employment search. We support, empower, 
              and free your time so you can live your life while actively pursuing your next career move.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/RezzybyRLM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/RezzybyRLM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/RezzybyRLM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/RezzybyRLM"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs" className="text-gray-300 hover:text-white transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link href="/companies" className="text-gray-300 hover:text-white transition-colors">
                  Companies
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* AI Tools */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">AI Tools</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/interview-pro" className="text-gray-300 hover:text-white transition-colors">
                  Interview Pro
                </Link>
              </li>
              <li>
                <Link href="/resume-optimizer" className="text-gray-300 hover:text-white transition-colors">
                  Resume Optimizer
                </Link>
              </li>
              <li>
                <Link href="/job-alerts" className="text-gray-300 hover:text-white transition-colors">
                  Smart Job Alerts
                </Link>
              </li>
              <li>
                <Link href="/donate" className="text-gray-300 hover:text-white transition-colors">
                  Support Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              © 2024 Rezzy. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-300 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-4 text-xs text-gray-400 text-center">
            Jobs sourced from Indeed.com - we are not affiliated with Indeed. 
            Apply buttons redirect to Indeed's website.
          </div>
        </div>
      </div>
    </footer>
  )
}
