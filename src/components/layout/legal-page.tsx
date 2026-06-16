import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface LegalSection {
  heading: string
  body: string[]
}

interface LegalPageProps {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <nav className="flex items-center gap-1.5 text-sm text-white/80 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-white/80 text-sm">Last updated: {updated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="bg-white rounded-2xl shadow-card border border-border p-6 md:p-10">
          <p className="text-gray-600 leading-relaxed text-lg">{intro}</p>
          <div className="mt-8 space-y-8">
            {sections.map((section, i) => (
              <section key={i}>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {i + 1}. {section.heading}
                </h2>
                {section.body.map((para, j) => (
                  <p key={j} className="text-gray-600 leading-relaxed mb-3 last:mb-0">
                    {para}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-border text-sm text-gray-500">
            Questions about this policy?{' '}
            <Link href="/contact-us" className="text-primary-600 font-medium hover:underline">
              Contact us
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  )
}
