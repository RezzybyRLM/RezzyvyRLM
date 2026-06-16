'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  ArrowRight, FileText, Briefcase, MessageSquare, QrCode, Linkedin,
  Send, CheckCircle, ShoppingCart, Loader2, Search, MapPin, Star, Building2,
  Sparkles, TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart/actions'
import { submitContactForm } from '@/lib/contact/actions'
import dynamic from 'next/dynamic'
import { ScrollAnimate } from '@/components/ui/scroll-animate'
import { PageLoader } from '@/components/ui/page-loader'
import { CountUp } from '@/components/ui/count-up'
import { Magnetic } from '@/components/ui/magnetic'
import { CursorGlowCard } from '@/components/ui/cursor-glow-card'
import { JobShowcase } from '@/components/home/job-showcase'

// Continuous, page-wide WebGL backdrop — heavy + browser-only, lazy with SSR off for Core Web Vitals.
const SiteBackdrop = dynamic(() => import('@/components/home/site-backdrop'), {
  ssr: false,
  loading: () => null,
})

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

  // Scroll-driven parallax (premium "scene moves as you scroll" feel)
  const { scrollY } = useScroll()
  const heroImageY = useTransform(scrollY, [0, 700], [0, -70])
  const heroCardY = useTransform(scrollY, [0, 700], [0, 40])

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
    { icon: <FileText className="h-6 w-6" />, title: 'Resume, Cover Letter & Bio', description: 'Customizable resumes, cover letters, and bios with formatting and design built to pass applicant tracking systems. Delivered in MS Word and PDF.' },
    { icon: <Briefcase className="h-6 w-6" />, title: 'Customizable Templates', description: 'Choose from a library of professional, customizable design templates that stand out and get you noticed.' },
    { icon: <MessageSquare className="h-6 w-6" />, title: 'Career & Interview Coaching', description: 'Sit down with a qualified career coach to present your best self throughout your employment process and career choices.' },
    { icon: <QrCode className="h-6 w-6" />, title: 'vCard + QR Code', description: 'A virtual electronic representation of your resume, cover letter, and bio with a dedicated landing page.' },
    { icon: <Linkedin className="h-6 w-6" />, title: 'LinkedIn Optimization', description: 'Optimize and update your LinkedIn profile content to attract recruiters and opportunities.' },
    { icon: <Send className="h-6 w-6" />, title: 'Application Processing', description: 'With our RezzyMeUp package, our team applies for you — no more repetitive online application forms.' },
  ]

  const testimonials = [
    { name: 'Kyrndra D.', role: 'United States Postal Service', content: 'I was pressed for time to update my cover letter. Rezzy delivered exceptional service while providing tips to help me the next time I am in a pinch.' },
    { name: 'Carolyn M.', role: 'Associate Director', content: 'I am very impressed with Rezzy, especially how its customer service ensures the right packages and à la carte products are suggested based on professional credentials and positions being sought.' },
    { name: 'Rachelle O.', role: 'Behavioral Health', content: 'I came across a relatable Rezzy explainer video that piqued my interest. After using their resume and cover letter services, I received offers from three recruiter companies. Thank you for saving me time and rebuilding my confidence.' },
  ]

  const pricingPlans = [
    { name: 'Essential Package', price: '$200', interval: '', features: ['One-on-One Consultation (Email or Zoom, 20 min)', 'One Page Resume (Career, Federal, CV)', 'One Page Bio', 'Cover Letter', 'Unlimited Revisions for 14 Days', 'vCard + QR Code'], featured: false, link: 'https://rezzybyrlm.com/product/rezzyme/' },
    { name: 'Definitive Package', price: '$500', interval: '', features: ['One-on-One Consultation (Email or Zoom, 1hr)', 'One Page Resume (Career, Federal, CV)', 'One Page Bio', 'Cover Letter', 'Unlimited Revisions for 14 Days', 'vCard + QR Code', 'Reference List', 'Thank You Letter (3 Options)', 'One Additional Resume', 'LinkedIn Optimization', 'Career Interview Coaching'], featured: true, link: 'https://rezzybyrlm.com/product/rezzy-definitive/' },
    { name: 'Accelerated Package', price: '$300', interval: '', features: ['One-on-One Consultation (Email or Zoom, 30 min)', 'One Page Resume (Career, Federal, CV)', 'One Page Bio', 'Cover Letter', 'Unlimited Revisions for 14 Days', 'vCard + QR Code', 'Reference List', 'Thank You Letter (3 Options)', 'One Additional Resume'], featured: false, link: 'https://rezzybyrlm.com/product/rezzy-accelerated/' },
  ]

  return (
    <PageLoader>
      <div className="relative isolate min-h-screen bg-[#0A0A0A] text-white">
        {/* ---- Continuous full-page WebGL backdrop (fixed, behind everything) ---- */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <SiteBackdrop />
        </div>
        {/* Fixed ambient radial glows + base wash so depth flows the full page */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(60rem 40rem at 78% 8%, rgba(255,107,107,0.16), transparent 60%), radial-gradient(50rem 40rem at 12% 60%, rgba(211,47,42,0.12), transparent 60%), radial-gradient(60rem 50rem at 60% 100%, rgba(255,132,117,0.10), transparent 60%)',
          }}
        />
        {/* CSS particle fallback grid (renders even before/without WebGL) */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] bg-[size:54px_54px]" />

        {/* ============ HERO ============ */}
        <section className="relative z-10 isolate overflow-hidden">
          {/* Left-side contrast wash — keeps hero copy WCAG AA over the canvas */}
          <div className="pointer-events-none absolute inset-0 -z-[1] bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: copy + search — CSS staggered reveal (resilient; always ends visible) */}
              <div className="text-white">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-sm font-medium text-white/90 animate-fadeInUp" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
                  <Sparkles className="h-4 w-4 text-primary-300" /> AI-powered job search & career tools
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight">
                  {['Find', 'a', 'job', 'that'].map((w, i) => (
                    <span key={w} className="word-up inline-block" style={{ animationDelay: `${0.2 + i * 0.08}s`, marginRight: '0.25em' }}>{w}</span>
                  ))}
                  {['works', 'for', 'you'].map((w, i) => (
                    <span key={w} className="word-up text-shine inline-block" style={{ animationDelay: `${0.52 + i * 0.08}s`, marginRight: '0.25em' }}>{w}</span>
                  ))}
                </h1>
                <p className="mt-5 text-lg text-white/70 max-w-xl leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.32s', animationFillMode: 'both' }}>
                  Search thousands of openings, get your resume optimized, and prepare with AI — all in one place. We support, empower, and free your time.
                </p>

                {/* Search card */}
                <form onSubmit={handleJobSearch} className="mt-8 glass-panel-light rounded-2xl p-3 sm:p-2.5 flex flex-col sm:flex-row gap-2.5 animate-fadeInUp" style={{ animationDelay: '0.44s', animationFillMode: 'both' }}>
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Job title or keyword"
                      className="w-full h-12 pl-11 pr-3 rounded-xl bg-transparent text-gray-900 placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 text-base"
                    />
                  </div>
                  <div className="relative flex-1 sm:border-l sm:border-gray-200/70">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      placeholder="City, state, or remote"
                      className="w-full h-12 pl-11 pr-3 rounded-xl bg-transparent text-gray-900 placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 text-base"
                    />
                  </div>
                  <Magnetic strength={0.4} className="sm:w-auto w-full">
                    <Button type="submit" size="lg" className="btn-shimmer h-12 w-full transition-transform duration-300 ease-expo">
                      <Search className="h-5 w-5 sm:mr-2" />
                      <span>Find Jobs</span>
                    </Button>
                  </Magnetic>
                </form>

                {/* Popular searches */}
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm animate-fadeInUp" style={{ animationDelay: '0.56s', animationFillMode: 'both' }}>
                  <span className="text-white/55">Popular:</span>
                  {POPULAR_SEARCHES.map((term) => (
                    <Link
                      key={term}
                      href={`/jobs?q=${encodeURIComponent(term)}`}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 text-white/90 transition-colors duration-300 ease-expo backdrop-blur-sm"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: image + floating glass card */}
              <div className="hidden lg:block">
                <motion.div
                  style={{ y: heroImageY }}
                  className="relative animate-scaleIn"
                >
                  <div className="absolute -inset-6 bg-primary-500/25 rounded-[2rem] blur-3xl" />
                  <Image
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80&auto=format&fit=crop"
                    alt="Professionals collaborating"
                    width={720}
                    height={560}
                    className="relative rounded-3xl border border-white/10 shadow-2xl object-cover w-full h-[460px]"
                    priority
                  />
                  {/* Floating glassmorphism card (parallax outer, float inner) */}
                  <motion.div style={{ y: heroCardY }} className="absolute -bottom-6 -left-6 max-w-[230px]">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="glass-panel rounded-2xl p-4 flex items-center gap-3"
                    >
                      <span className="w-11 h-11 rounded-full bg-primary-500/30 border border-white/20 flex items-center justify-center text-white">
                        <TrendingUp className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-white">3 interviews</p>
                        <p className="text-xs text-white/70">landed this week with Rezzy</p>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ STATS BAND ============ */}
        <section className="relative z-10 border-y border-white/10 bg-white/[0.03] backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-primary-500/15 border border-white/10 flex items-center justify-center text-primary-300 flex-shrink-0">
                    {stat.icon}
                  </span>
                  <div>
                    <CountUp
                      to={stat.to}
                      suffix={stat.suffix}
                      decimals={stat.decimals ?? 0}
                      className="block text-xl sm:text-2xl font-extrabold text-white"
                    />
                    <div className="text-sm text-white/55">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUSTED LOGO MARQUEE ============ */}
        <section className="relative z-10 py-9 border-b border-white/10 overflow-hidden">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-white/40 mb-6">
            Trusted by talent landing roles at
          </p>
          <div className="marquee-mask relative">
            <div className="ticker-track items-center gap-12 pr-12">
              {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="text-xl md:text-2xl font-bold tracking-tight text-white/35 hover:text-primary-300 transition-colors whitespace-nowrap select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SERVICES ============ */}
        <section id="services" className="relative z-10 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-primary-300 font-semibold uppercase tracking-[0.18em] text-xs">What we do</span>
                <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                  Everything you need to land the role
                </h2>
                <p className="mt-4 text-lg text-white/60">
                  Rezzy is the powerful tool to streamline your employment search — from a standout resume to interview-ready confidence.
                </p>
              </div>
            </ScrollAnimate>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <ScrollAnimate key={index} animation="fadeInUp" delay={index * 80}>
                  <CursorGlowCard className="h-full transition-transform duration-300 ease-expo hover:-translate-y-1.5 hover:border-primary-400/40">
                    <div className="p-6">
                      <span className="icon-spin inline-flex w-12 h-12 rounded-xl bg-primary-500/15 border border-white/10 items-center justify-center text-primary-300 group-hover:text-white group-hover:bg-primary-500/30 transition-colors">
                        {feature.icon}
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-white">{feature.title}</h3>
                      <p className="mt-2 text-white/60 leading-relaxed text-[15px]">{feature.description}</p>
                    </div>
                  </CursorGlowCard>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ WHY CHOOSE US ============ */}
        <section className="relative z-10 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ScrollAnimate animation="slideInLeft">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary-500/15 rounded-[2rem] blur-3xl" />
                  <Image
                    src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=900&q=80&auto=format&fit=crop"
                    alt="Career coaching session"
                    width={720}
                    height={540}
                    className="relative rounded-2xl border border-white/10 shadow-2xl object-cover w-full h-[420px]"
                  />
                  <div className="absolute -bottom-5 -right-5 glass-panel rounded-2xl p-5 max-w-[200px]">
                    <p className="text-3xl font-extrabold text-white">97%</p>
                    <p className="text-sm text-white/70">client satisfaction across our packages</p>
                  </div>
                </div>
              </ScrollAnimate>

              <ScrollAnimate animation="slideInRight" delay={150}>
                <div>
                  <span className="text-primary-300 font-semibold uppercase tracking-[0.18em] text-xs">Why choose Rezzy</span>
                  <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">
                    An insider's edge on the hiring process
                  </h2>
                  <p className="mt-4 text-white/60 leading-relaxed">
                    We are committed to outstanding quality in everything we offer. Our professionalism is backed by years of industry experience and a genuine desire to see every client succeed — with a personal certified resume writer and lightning-fast turnaround.
                  </p>
                  <div className="mt-8 space-y-5">
                    {[
                      { label: 'Essential Package', value: 97 },
                      { label: 'Accelerated Package', value: 90 },
                      { label: 'Definitive Package', value: 85 },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-medium text-white/80">{bar.label}</span>
                          <span className="text-sm font-bold text-primary-300">{bar.value}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600" style={{ width: `${bar.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollAnimate>
            </div>
          </div>
        </section>

        {/* ============ CINEMATIC SHOWCASE ============ */}
        <section className="relative z-10 overflow-hidden py-20 md:py-28">
          {/* Sweeping coral glow arc (ZYRO-style, on brand) */}
          <div className="pointer-events-none absolute left-1/2 -top-24 h-[28rem] w-[58rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,107,107,0.4),rgba(255,107,107,0)_62%)] blur-3xl animate-glow" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-block text-primary-300 font-semibold uppercase tracking-[0.2em] text-xs"
            >
              The Rezzy experience
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-3 text-4xl md:text-6xl font-extrabold tracking-tight text-white"
            >
              Everything in one place
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-4 max-w-2xl mx-auto text-white/70 text-lg"
            >
              Search jobs, track applications, optimize your resume, and prep for interviews — in one beautifully simple workspace.
            </motion.p>

            {/* Browser-frame product mockup that scales in on scroll */}
            <motion.div
              initial={{ opacity: 0, y: 70, scale: 0.93 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12 mx-auto max-w-4xl"
            >
              <div className="rounded-2xl border border-white/10 bg-white shadow-2xl overflow-hidden text-left">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 border-b border-gray-200">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  <div className="ml-3 flex-1 max-w-xs h-6 rounded-md bg-white border border-gray-200 flex items-center px-3 text-[11px] text-gray-400">
                    rezzy.us/jobs
                  </div>
                </div>
                {/* Mock job board UI */}
                <div className="bg-background p-5 sm:p-6">
                  {/* search bar */}
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10"
            >
              <Button size="lg" className="bg-white text-secondary-900 hover:bg-white/90" asChild>
                <Link href="/jobs"><Search className="mr-2 h-5 w-5" /> Explore the job board</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section className="relative z-10 py-20 md:py-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <span className="text-primary-300 font-semibold uppercase tracking-[0.18em] text-xs">How it works</span>
                <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">From search to hired in 3 steps</h2>
              </div>
            </ScrollAnimate>

            <div className="relative grid gap-10 md:grid-cols-3">
              {/* Animated connecting line (desktop) */}
              <div className="hidden md:block pointer-events-none absolute left-[16.6%] right-[16.6%] top-9 h-px">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  style={{ originX: 0 }}
                  className="h-full w-full bg-gradient-to-r from-primary-500/0 via-primary-500/60 to-primary-500/0"
                />
              </div>

              {[
                { icon: <Search className="h-6 w-6" />, title: 'Search', desc: 'Browse 25,000+ openings or let our AI match you to roles that fit your profile.' },
                { icon: <Send className="h-6 w-6" />, title: 'Apply', desc: 'Optimize your resume, generate tailored cover letters, and apply in a few clicks.' },
                { icon: <CheckCircle className="h-6 w-6" />, title: 'Get Hired', desc: 'Prep with AI mock interviews and track every application to the offer stage.' },
              ].map((step, i) => (
                <ScrollAnimate key={step.title} animation="fadeInUp" delay={i * 140}>
                  <div className="relative text-center">
                    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl glass-panel text-primary-300">
                        {step.icon}
                      </span>
                      <span className="absolute -top-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-bold shadow-lg">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-white/60 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                  </div>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section id="pricing" className="relative z-10 py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-primary-300 font-semibold uppercase tracking-[0.18em] text-xs">Pricing</span>
                <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">Pick the package that fits you</h2>
                <p className="mt-4 text-lg text-white/60">Choose and combine what best fits your needs — every plan is tailored to deliver results.</p>
              </div>
            </ScrollAnimate>

            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {pricingPlans.map((plan, index) => (
                <ScrollAnimate key={index} animation="fadeInUp" delay={index * 100}>
                  <CursorGlowCard
                    glow={420}
                    className={`h-full flex flex-col transition-transform duration-300 ease-expo hover:-translate-y-2 ${plan.featured ? 'pulse-glow lg:-translate-y-3 lg:scale-[1.05]' : ''}`}
                  >
                    {plan.featured && (
                      <span className="absolute top-4 right-4 bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wide">
                        MOST POPULAR
                      </span>
                    )}
                    <div className="text-center pt-8 pb-4 px-6">
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <div className="mt-2 text-4xl font-extrabold text-white">
                        {plan.price}
                        {plan.interval && <span className="text-base font-medium text-white/40">{plan.interval}</span>}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col px-6 pb-6">
                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feature, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm text-white/70">
                            <CheckCircle className="h-5 w-5 text-primary-400 flex-shrink-0 mt-0.5" />
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
                        <Button variant="ghost" className="w-full text-white/70 hover:bg-white/10 hover:text-white" asChild>
                          <Link href={plan.link} target="_blank" rel="noopener noreferrer">View details</Link>
                        </Button>
                      </div>
                    </div>
                  </CursorGlowCard>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS (auto-scroll carousel) ============ */}
        <section className="relative z-10 py-20 md:py-28 overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-primary-300 font-semibold uppercase tracking-[0.18em] text-xs">Testimonials</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">What our clients say</h2>
            </div>
          </div>

          <div className="marquee-mask relative">
            <div className="ticker-track gap-6 pr-6" style={{ animationDuration: '46s' }}>
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="glass-panel rounded-2xl p-6 w-[340px] sm:w-[400px] shrink-0">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-primary-400 text-primary-400" />
                    ))}
                  </div>
                  <p className="text-white/80 leading-relaxed text-[15px] line-clamp-5">"{t.content}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-primary-500/80 flex items-center justify-center text-white font-bold">
                      {t.name.charAt(0)}
                    </span>
                    <div>
                      <div className="font-semibold text-white text-sm">{t.name}</div>
                      <div className="text-xs text-white/55">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="relative z-10 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120808] px-6 py-14 md:px-12 md:py-20 text-center shadow-[0_20px_80px_rgba(232,96,74,0.25)]">
              {/* Slow-moving gradient mesh */}
              <div className="mesh-bg pointer-events-none absolute inset-0 opacity-70" />
              <div className="pointer-events-none absolute inset-0 bg-[#0A0A0A]/30" />
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">Your next job is one search away</h2>
                <p className="mt-3 text-lg text-white/80 max-w-2xl mx-auto">Browse jobs, optimize your resume, and let Rezzy do the heavy lifting.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Magnetic strength={0.3} className="sm:w-auto w-full">
                    <Button size="lg" className="btn-shimmer w-full bg-white text-primary-700 hover:bg-white/90" asChild>
                      <Link href="/auth/register">Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
                    </Button>
                  </Magnetic>
                  <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10" asChild>
                    <Link href="/jobs"><Search className="mr-2 h-5 w-5" /> Browse jobs</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CONTACT ============ */}
        <section className="relative z-10 py-20 md:py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-primary-300 font-semibold uppercase tracking-[0.18em] text-xs">Get in touch</span>
              <h2 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight text-white">Contact us</h2>
              <p className="mt-3 text-white/60">Have a question? We usually reply within one business day.</p>
            </div>

            <div className="glass-panel rounded-2xl p-6 md:p-8">
              {contactMessage && (
                <div className={`mb-6 p-4 rounded-lg text-sm ${contactMessage.type === 'success' ? 'bg-green-500/15 text-green-200 border border-green-400/30' : 'bg-red-500/15 text-red-200 border border-red-400/30'}`}>
                  {contactMessage.text}
                </div>
              )}
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Your name *</label>
                    <input type="text" className="input-dark" placeholder="Jane Doe" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1.5">Your email *</label>
                    <input type="email" className="input-dark" placeholder="jane@example.com" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Subject</label>
                  <input type="text" className="input-dark" placeholder="How can we help?" value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1.5">Message *</label>
                  <textarea className="input-dark h-32 resize-none" placeholder="Tell us a bit about what you need…" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmittingContact}>
                  {isSubmittingContact ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending…</>) : (<><Send className="mr-2 h-5 w-5" /> Send message</>)}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </PageLoader>
  )
}
