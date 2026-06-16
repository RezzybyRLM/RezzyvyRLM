'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight, FileText, Briefcase, MessageSquare, QrCode, Linkedin,
  Send, CheckCircle, ShoppingCart, Loader2, Search, MapPin, Star, Building2,
  Sparkles, TrendingUp, ShieldCheck, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart/actions'
import { submitContactForm } from '@/lib/contact/actions'
import { ScrollAnimate } from '@/components/ui/scroll-animate'
import { PageLoader } from '@/components/ui/page-loader'
import { CountUp } from '@/components/ui/count-up'
import { Magnetic } from '@/components/ui/magnetic'
import { JobShowcase } from '@/components/home/job-showcase'

const POPULAR_SEARCHES = ['Remote', 'Software Engineer', 'Nurse', 'Marketing', 'Customer Service', 'Data Analyst']

const STATS = [
  { to: 25000, suffix: '+', label: 'Open jobs', icon: <Briefcase className="h-5 w-5" /> },
  { to: 1200, suffix: '+', label: 'Companies hiring', icon: <Building2 className="h-5 w-5" /> },
  { to: 50, suffix: 'k+', label: 'Resumes optimized', icon: <FileText className="h-5 w-5" /> },
  { to: 4.9, suffix: '/5', decimals: 1, label: 'Client rating', icon: <Star className="h-5 w-5" /> },
]

const TRUSTED_LOGOS = ['Stripe', 'Notion', 'Shopify', 'HubSpot', 'DoorDash', 'Figma', 'Airbnb', 'Slack', 'Spotify', 'Uber']

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  // Subtle scroll parallax on the hero imagery (kept gentle + professional)
  const { scrollY } = useScroll()
  const heroImageY = useTransform(scrollY, [0, 600], [0, -48])
  const heroCardY = useTransform(scrollY, [0, 600], [0, 28])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleJobSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    if (searchLocation.trim()) params.set('location', searchLocation.trim())
    window.location.href = `/jobs${params.toString() ? `?${params.toString()}` : ''}`
  }

  const handleAddToCart = async (packageName: string, packageType: string, price: number) => {
    if (!user) {
      window.location.href = '/auth/login?redirectTo=/'
      return
    }
    setAddingToCart(packageType)
    try {
      await addToCart({ package_name: packageName, package_type: packageType, price })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(null)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingContact(true)
    setContactMessage(null)
    try {
      const result = await submitContactForm(contactForm)
      if (result.success) {
        setContactMessage({ type: 'success', text: "Message sent successfully! We'll get back to you soon." })
        setContactForm({ name: '', email: '', subject: '', message: '' })
      } else {
        setContactMessage({ type: 'error', text: result.error || 'Failed to send message. Please try again.' })
      }
    } catch (error) {
      setContactMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmittingContact(false)
    }
  }

  const features = [
    { icon: <FileText className="h-6 w-6" />, title: 'Resume, Cover Letter & Bio', description: 'Customizable resumes, cover letters, and bios with formatting built to pass applicant tracking systems. Delivered in MS Word and PDF.' },
    { icon: <Briefcase className="h-6 w-6" />, title: 'Customizable Templates', description: 'Choose from a library of professional, customizable design templates that stand out and get you noticed.' },
    { icon: <MessageSquare className="h-6 w-6" />, title: 'Career & Interview Coaching', description: 'Sit down with a qualified career coach to present your best self throughout your employment process and career choices.' },
    { icon: <QrCode className="h-6 w-6" />, title: 'vCard + QR Code', description: 'A virtual electronic representation of your resume, cover letter, and bio with a dedicated landing page.' },
    { icon: <Linkedin className="h-6 w-6" />, title: 'LinkedIn Optimization', description: 'Optimize and update your LinkedIn profile content to attract recruiters and opportunities.' },
    { icon: <Send className="h-6 w-6" />, title: 'Application Processing', description: 'With our RezzyMeUp package, our team applies for you — no more repetitive online application forms.' },
  ]

  const testimonials = [
    { name: 'Kyrndra D.', role: 'United States Postal Service', content: 'I was pressed for time to update my cover letter. Rezzy delivered exceptional service while providing tips to help me the next time I am in a pinch.' },
    { name: 'Carolyn M.', role: 'Associate Director', content: 'I am very impressed with Rezzy, especially how its customer service ensures the right packages and à la carte products are suggested based on professional credentials and positions being sought.' },
    { name: 'Rachelle O.', role: 'Behavioral Health', content: 'After using their resume and cover letter services, I received offers from three recruiter companies. Thank you for saving me time and rebuilding my confidence.' },
    { name: 'Marcus T.', role: 'Operations Manager', content: 'The interview coaching was a game changer. I walked into every conversation prepared and confident — and landed the role I wanted.' },
  ]

  const pricingPlans = [
    { name: 'Essential Package', price: '$200', interval: '', features: ['One-on-One Consultation (Email or Zoom, 20 min)', 'One Page Resume (Career, Federal, CV)', 'One Page Bio', 'Cover Letter', 'Unlimited Revisions for 14 Days', 'vCard + QR Code'], featured: false, link: 'https://rezzybyrlm.com/product/rezzyme/' },
    { name: 'Definitive Package', price: '$500', interval: '', features: ['One-on-One Consultation (Email or Zoom, 1hr)', 'One Page Resume (Career, Federal, CV)', 'One Page Bio', 'Cover Letter', 'Unlimited Revisions for 14 Days', 'vCard + QR Code', 'Reference List', 'Thank You Letter (3 Options)', 'One Additional Resume', 'LinkedIn Optimization', 'Career Interview Coaching'], featured: true, link: 'https://rezzybyrlm.com/product/rezzy-definitive/' },
    { name: 'Accelerated Package', price: '$300', interval: '', features: ['One-on-One Consultation (Email or Zoom, 30 min)', 'One Page Resume (Career, Federal, CV)', 'One Page Bio', 'Cover Letter', 'Unlimited Revisions for 14 Days', 'vCard + QR Code', 'Reference List', 'Thank You Letter (3 Options)', 'One Additional Resume'], featured: false, link: 'https://rezzybyrlm.com/product/rezzy-accelerated/' },
  ]

  const steps = [
    { icon: <Search className="h-6 w-6" />, title: 'Search', desc: 'Browse 25,000+ openings or let our AI match you to roles that fit your profile.' },
    { icon: <Send className="h-6 w-6" />, title: 'Apply', desc: 'Optimize your resume, generate tailored cover letters, and apply in a few clicks.' },
    { icon: <CheckCircle className="h-6 w-6" />, title: 'Get Hired', desc: 'Prep with AI mock interviews and track every application to the offer stage.' },
  ]

  return (
    <PageLoader>
      <div className="bg-background">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-white">
          {/* soft warm ambient glow (light + professional, not flashy) */}
          <div className="pointer-events-none absolute -top-32 right-0 h-[32rem] w-[32rem] rounded-full bg-primary-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-primary-100/50 blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: copy + search */}
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-border shadow-sm text-sm font-medium text-gray-700 animate-fadeInUp" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
                  <Sparkles className="h-4 w-4 text-primary-500" /> AI-powered job search &amp; career tools
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-gray-900 animate-fadeInUp" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
                  Find a job that <span className="text-primary-600">works for you</span>
                </h1>
                <p className="mt-5 text-lg text-gray-600 max-w-xl leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.27s', animationFillMode: 'both' }}>
                  Search thousands of openings, get your resume optimized, and prepare with AI — all in one place. We support, empower, and free your time.
                </p>

                {/* Search card */}
                <form onSubmit={handleJobSearch} className="mt-8 bg-white rounded-2xl shadow-card-hover border border-border p-3 sm:p-2.5 flex flex-col sm:flex-row gap-2.5 animate-fadeInUp" style={{ animationDelay: '0.39s', animationFillMode: 'both' }}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Job title or keyword"
                      className="w-full h-12 pl-11 pr-3 rounded-xl text-gray-900 placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 text-base"
                    />
                  </div>
                  <div className="relative flex-1 sm:border-l sm:border-gray-200">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="City, state, or remote"
                      className="w-full h-12 pl-11 pr-3 rounded-xl text-gray-900 placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 text-base"
                    />
                  </div>
                  <Magnetic strength={0.35} className="sm:w-auto w-full">
                    <Button type="submit" size="lg" className="btn-shimmer h-12 w-full">
                      <Search className="h-5 w-5 sm:mr-2" />
                      <span>Find Jobs</span>
                    </Button>
                  </Magnetic>
                </form>

                {/* Popular searches */}
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm animate-fadeInUp" style={{ animationDelay: '0.51s', animationFillMode: 'both' }}>
                  <span className="text-gray-500">Popular:</span>
                  {POPULAR_SEARCHES.map((term) => (
                    <Link
                      key={term}
                      href={`/jobs?q=${encodeURIComponent(term)}`}
                      className="px-3 py-1 rounded-full bg-white border border-border text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      {term}
                    </Link>
                  ))}
                </div>

                {/* Trust line */}
                <div className="mt-7 flex items-center gap-3 text-sm text-gray-500 animate-fadeInUp" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span><span className="font-semibold text-gray-900">4.9/5</span> from 2,000+ job seekers</span>
                </div>
              </div>

              {/* Right: image + floating stat card */}
              <div className="hidden lg:block">
                <motion.div style={{ y: heroImageY }} className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80&auto=format&fit=crop"
                    alt="Professionals collaborating"
                    width={720}
                    height={560}
                    className="rounded-3xl shadow-card-hover object-cover w-full h-[460px]"
                    priority
                  />
                  <motion.div style={{ y: heroCardY }} className="absolute -bottom-6 -left-6 max-w-[230px]">
                    <div className="bg-white rounded-2xl shadow-card-hover border border-border p-4 flex items-center gap-3 animate-floatY">
                      <span className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                        <TrendingUp className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">3 interviews</p>
                        <p className="text-xs text-gray-500">landed this week with Rezzy</p>
                      </div>
                    </div>
                  </motion.div>
                  {/* secondary floating chip */}
                  <div className="absolute -top-5 right-6 bg-white rounded-xl shadow-card border border-border px-3 py-2 flex items-center gap-2 animate-floatY" style={{ animationDelay: '1.2s' }}>
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span className="text-xs font-medium text-gray-700">ATS-optimized</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ STATS BAND ============ */}
        <section className="bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                    {stat.icon}
                  </span>
                  <div>
                    <CountUp to={stat.to} suffix={stat.suffix} decimals={stat.decimals ?? 0} className="block text-xl sm:text-2xl font-extrabold text-gray-900" />
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUSTED LOGO MARQUEE ============ */}
        <section className="bg-white py-9 border-b border-border overflow-hidden">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">
            Trusted by talent landing roles at
          </p>
          <div className="marquee-mask relative">
            <div className="ticker-track items-center gap-12 pr-12">
              {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((name, i) => (
                <span key={`${name}-${i}`} className="text-xl md:text-2xl font-bold tracking-tight text-gray-300 hover:text-primary-500 transition-colors whitespace-nowrap select-none">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FEATURES ============ */}
        <section id="services" className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">What we do</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Everything you need to land the role</h2>
                <p className="mt-4 text-lg text-gray-600">Rezzy is the powerful tool to streamline your employment search — from a standout resume to interview-ready confidence.</p>
              </div>
            </ScrollAnimate>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <ScrollAnimate key={index} animation="fadeInUp" delay={index * 70}>
                  <Card className="group h-full hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-200 transition-all duration-300">
                    <CardContent className="p-6">
                      <span className="icon-spin inline-flex w-12 h-12 rounded-xl bg-primary-50 items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                        {feature.icon}
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-gray-900">{feature.title}</h3>
                      <p className="mt-2 text-gray-600 leading-relaxed text-[15px]">{feature.description}</p>
                    </CardContent>
                  </Card>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRODUCT SHOWCASE ============ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <ScrollAnimate animation="fadeInUp">
              <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">The Rezzy workspace</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Everything in one place</h2>
              <p className="mt-4 max-w-2xl mx-auto text-gray-600 text-lg">Search jobs, track applications, optimize your resume, and prep for interviews — in one simple workspace.</p>
            </ScrollAnimate>

            <ScrollAnimate animation="scaleIn" delay={120}>
              <div className="mt-12 mx-auto max-w-4xl">
                <div className="rounded-2xl border border-border bg-white shadow-card-hover overflow-hidden text-left">
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-border">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                    <div className="ml-3 flex-1 max-w-xs h-6 rounded-md bg-white border border-border flex items-center px-3 text-[11px] text-gray-400">
                      rezzy.us/jobs
                    </div>
                  </div>
                  <div className="bg-background p-5 sm:p-6">
                    <div className="flex gap-2 mb-4">
                      <div className="flex-1 h-10 rounded-lg bg-white border border-border flex items-center px-3">
                        <Search className="h-4 w-4 text-gray-300 mr-2" />
                        <div className="h-2.5 w-32 rounded bg-gray-200" />
                      </div>
                      <div className="h-10 w-24 rounded-lg bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">Find jobs</div>
                    </div>
                    <JobShowcase />
                  </div>
                </div>
              </div>
            </ScrollAnimate>

            <ScrollAnimate animation="fadeInUp" delay={200}>
              <div className="mt-10">
                <Button size="lg" asChild>
                  <Link href="/jobs"><Search className="mr-2 h-5 w-5" /> Explore the job board</Link>
                </Button>
              </div>
            </ScrollAnimate>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">How it works</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">From search to hired in 3 steps</h2>
              </div>
            </ScrollAnimate>

            <div className="relative grid gap-10 md:grid-cols-3">
              <div className="hidden md:block pointer-events-none absolute left-[16.6%] right-[16.6%] top-8 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
              {steps.map((step, i) => (
                <ScrollAnimate key={step.title} animation="fadeInUp" delay={i * 120}>
                  <div className="relative text-center">
                    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-border shadow-card text-primary-600">
                        {step.icon}
                      </span>
                      <span className="absolute -top-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold shadow">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-gray-600 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </div>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Pricing</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Simple, transparent pricing</h2>
                <p className="mt-4 text-lg text-gray-600">Choose and combine what best fits your needs — every plan is tailored to deliver results.</p>
              </div>
            </ScrollAnimate>

            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {pricingPlans.map((plan, index) => (
                <ScrollAnimate key={index} animation="fadeInUp" delay={index * 100}>
                  <Card className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-card-hover ${plan.featured ? 'ring-2 ring-primary-500 shadow-card-hover lg:-translate-y-3' : ''}`}>
                    {plan.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                        MOST POPULAR
                      </span>
                    )}
                    <div className="text-center pt-8 pb-4 px-6">
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-2 text-4xl font-extrabold text-primary-600">
                        {plan.price}
                        {plan.interval && <span className="text-base font-medium text-gray-400">{plan.interval}</span>}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col px-6 pb-6">
                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-600">
                            <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="space-y-2.5">
                        <Button
                          className="w-full"
                          variant={plan.featured ? 'default' : 'soft'}
                          onClick={() => handleAddToCart(plan.name, plan.name.toLowerCase().replace(' package', ''), parseInt(plan.price.replace('$', '')))}
                          disabled={addingToCart === plan.name.toLowerCase().replace(' package', '')}
                        >
                          {addingToCart === plan.name.toLowerCase().replace(' package', '') ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding…</>
                          ) : (
                            <><ShoppingCart className="mr-2 h-4 w-4" /> Add to cart</>
                          )}
                        </Button>
                        <Button variant="ghost" className="w-full" asChild>
                          <Link href={plan.link} target="_blank" rel="noopener noreferrer">View details</Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS (auto-scroll carousel) ============ */}
        <section className="py-16 md:py-24 bg-background overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Testimonials</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">What our clients say</h2>
            </div>
          </div>
          <div className="marquee-mask relative">
            <div className="ticker-track gap-6 pr-6" style={{ animationDuration: '48s' }}>
              {[...testimonials, ...testimonials].map((t, i) => (
                <Card key={i} className="w-[340px] sm:w-[400px] shrink-0">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 leading-relaxed text-[15px] line-clamp-5">&ldquo;{t.content}&rdquo;</p>
                    <div className="mt-5 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">{t.name.charAt(0)}</span>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                        <div className="text-xs text-gray-500">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-14 md:px-12 md:py-16 text-center shadow-card-hover">
              <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Your next job is one search away</h2>
                <p className="mt-3 text-lg text-white/90 max-w-2xl mx-auto">Browse jobs, optimize your resume, and let Rezzy do the heavy lifting.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Magnetic strength={0.3} className="sm:w-auto w-full">
                    <Button size="lg" className="btn-shimmer w-full bg-white text-primary-700 hover:bg-white/90" asChild>
                      <Link href="/auth/register">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  </Magnetic>
                  <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" asChild>
                    <Link href="/jobs"><Search className="mr-2 h-5 w-5" /> Browse jobs</Link>
                  </Button>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/80">
                  <Clock className="h-4 w-4" /> Free to start · No credit card required
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CONTACT ============ */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Get in touch</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Contact us</h2>
              <p className="mt-3 text-gray-600">Have a question? We usually reply within one business day.</p>
            </div>

            <Card>
              <CardContent className="p-6 md:p-8">
                {contactMessage && (
                  <div className={`mb-6 p-4 rounded-lg text-sm ${contactMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {contactMessage.text}
                  </div>
                )}
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your name *</label>
                      <input type="text" className="input-professional" placeholder="Jane Doe" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Your email *</label>
                      <input type="email" className="input-professional" placeholder="jane@example.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                    <input type="text" className="input-professional" placeholder="How can we help?" value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                    <textarea className="input-professional h-32 resize-none" placeholder="Tell us a bit about what you need…" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmittingContact}>
                    {isSubmittingContact ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending…</>) : (<><Send className="mr-2 h-5 w-5" /> Send message</>)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </PageLoader>
  )
}
