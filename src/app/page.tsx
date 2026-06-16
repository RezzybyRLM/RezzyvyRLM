'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users, ArrowRight, Quote, FileText, Briefcase, MessageSquare, QrCode, Linkedin,
  Send, CheckCircle, ShoppingCart, Loader2, Search, MapPin, Star, Building2,
  Sparkles, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart/actions'
import { submitContactForm } from '@/lib/contact/actions'
import { ScrollAnimate } from '@/components/ui/scroll-animate'
import { PageLoader } from '@/components/ui/page-loader'
import { CountUp } from '@/components/ui/count-up'

const POPULAR_SEARCHES = ['Remote', 'Software Engineer', 'Nurse', 'Marketing', 'Customer Service', 'Data Analyst']

const STATS = [
  { to: 25000, suffix: '+', label: 'Open jobs', icon: <Briefcase className="h-5 w-5" /> },
  { to: 1200, suffix: '+', label: 'Companies hiring', icon: <Building2 className="h-5 w-5" /> },
  { to: 50, suffix: 'k+', label: 'Resumes optimized', icon: <FileText className="h-5 w-5" /> },
  { to: 4.9, suffix: '/5', decimals: 1, label: 'Client rating', icon: <Star className="h-5 w-5" /> },
]

const TRUSTED_LOGOS = ['Stripe', 'Notion', 'Shopify', 'HubSpot', 'DoorDash', 'Figma', 'Airbnb', 'Slack', 'Spotify', 'Uber']

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(testimonialInterval)
  }, [])

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
      <div className="bg-background">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
          {/* Sweeping spotlight glow (premium hero look) */}
          <div className="pointer-events-none absolute left-1/2 -top-40 h-[34rem] w-[60rem] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.55),rgba(255,255,255,0)_60%)] blur-2xl animate-glow" />
          {/* Animated ambient blobs */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-blob" />
          <div className="pointer-events-none absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '3s' }} />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary-300/20 blur-3xl animate-blob" style={{ animationDelay: '6s' }} />
          {/* Subtle grid */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] bg-[size:46px_46px]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: copy + search */}
              <div className="text-white">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-sm font-medium backdrop-blur-sm animate-fadeInUp" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
                  <Sparkles className="h-4 w-4" /> AI-powered job search & career tools
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight animate-fadeInUp" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  Find a job that <span className="text-shine">works for you</span>
                </h1>
                <p className="mt-5 text-lg text-white/90 max-w-xl animate-fadeInUp" style={{ animationDelay: '220ms', animationFillMode: 'both' }}>
                  Search thousands of openings, get your resume optimized, and prepare with AI — all in one place. We support, empower, and free your time.
                </p>

                {/* Search card */}
                <form onSubmit={handleJobSearch} className="mt-8 bg-white rounded-2xl shadow-card-hover p-3 sm:p-2.5 flex flex-col sm:flex-row gap-2.5 animate-fadeInUp" style={{ animationDelay: '340ms', animationFillMode: 'both' }}>
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
                  <Button type="submit" size="lg" className="h-12 sm:w-auto w-full">
                    <Search className="h-5 w-5 sm:mr-2" />
                    <span>Find Jobs</span>
                  </Button>
                </form>

                {/* Popular searches */}
                <div className="mt-5 flex flex-wrap items-center gap-2 text-sm animate-fadeInUp" style={{ animationDelay: '460ms', animationFillMode: 'both' }}>
                  <span className="text-white/80">Popular:</span>
                  {POPULAR_SEARCHES.map((term) => (
                    <Link
                      key={term}
                      href={`/jobs?q=${encodeURIComponent(term)}`}
                      className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors backdrop-blur-sm"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right: image */}
              <div className="hidden lg:block">
                <div className="relative animate-floatY">
                  <div className="absolute -inset-4 bg-white/10 rounded-3xl blur-2xl" />
                  <Image
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=80&auto=format&fit=crop"
                    alt="Professionals collaborating"
                    width={720}
                    height={560}
                    className="relative rounded-3xl shadow-2xl object-cover w-full h-[460px]"
                    priority
                  />
                  {/* Floating card */}
                  <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card-hover p-4 flex items-center gap-3 max-w-[230px] animate-scaleIn">
                    <span className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                      <TrendingUp className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">3 interviews</p>
                      <p className="text-xs text-gray-500">landed this week with Rezzy</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ STATS BAND ============ */}
        <section className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                    {stat.icon}
                  </span>
                  <div>
                    <CountUp
                      to={stat.to}
                      suffix={stat.suffix}
                      decimals={stat.decimals ?? 0}
                      className="block text-xl sm:text-2xl font-extrabold text-gray-900"
                    />
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TRUSTED LOGO MARQUEE ============ */}
        <section className="bg-white py-8 border-b border-border overflow-hidden">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">
            Trusted by talent landing roles at
          </p>
          <div className="marquee-mask relative">
            <div className="flex w-max animate-marquee items-center gap-12 pr-12">
              {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="text-xl md:text-2xl font-bold tracking-tight text-gray-400 hover:text-primary-600 transition-colors whitespace-nowrap select-none"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============ SERVICES ============ */}
        <section id="services" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">What we do</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
                  Everything you need to land the role
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Rezzy is the powerful tool to streamline your employment search — from a standout resume to interview-ready confidence.
                </p>
              </div>
            </ScrollAnimate>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <ScrollAnimate key={index} animation="fadeInUp" delay={index * 80}>
                  <Card className="h-full group hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-6">
                      <span className="inline-flex w-12 h-12 rounded-xl bg-primary-50 items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
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

        {/* ============ WHY CHOOSE US ============ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <ScrollAnimate animation="slideInLeft">
                <div className="relative">
                  <Image
                    src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=900&q=80&auto=format&fit=crop"
                    alt="Career coaching session"
                    width={720}
                    height={540}
                    className="rounded-2xl shadow-card object-cover w-full h-[420px]"
                  />
                  <div className="absolute -bottom-5 -right-5 bg-secondary text-white rounded-2xl shadow-card-hover p-5 max-w-[200px]">
                    <p className="text-3xl font-extrabold">97%</p>
                    <p className="text-sm text-white/80">client satisfaction across our packages</p>
                  </div>
                </div>
              </ScrollAnimate>

              <ScrollAnimate animation="slideInRight" delay={150}>
                <div>
                  <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Why choose Rezzy</span>
                  <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
                    An insider's edge on the hiring process
                  </h2>
                  <p className="mt-4 text-gray-600 leading-relaxed">
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
                          <span className="text-sm font-medium text-gray-700">{bar.label}</span>
                          <span className="text-sm font-bold text-primary-600">{bar.value}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${bar.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollAnimate>
            </div>
          </div>
        </section>

        {/* ============ PRICING ============ */}
        <section id="pricing" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollAnimate animation="fadeInUp">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Pricing</span>
                <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">Pick the package that fits you</h2>
                <p className="mt-4 text-lg text-gray-600">Choose and combine what best fits your needs — every plan is tailored to deliver results.</p>
              </div>
            </ScrollAnimate>

            <div className="grid gap-6 lg:grid-cols-3 items-start">
              {pricingPlans.map((plan, index) => (
                <ScrollAnimate key={index} animation="fadeInUp" delay={index * 100}>
                  <Card className={`relative h-full flex flex-col ${plan.featured ? 'ring-2 ring-primary-500 shadow-card-hover lg:-translate-y-3' : ''}`}>
                    {plan.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                        MOST POPULAR
                      </span>
                    )}
                    <CardHeader className="text-center pt-8 pb-4">
                      <CardTitle className="text-xl font-bold text-gray-900">{plan.name}</CardTitle>
                      <div className="mt-2 text-4xl font-extrabold text-primary-600">
                        {plan.price}
                        {plan.interval && <span className="text-base font-medium text-gray-400">{plan.interval}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
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
                          variant={plan.featured ? 'default' : 'secondary'}
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
                    </CardContent>
                  </Card>
                </ScrollAnimate>
              ))}
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Testimonials</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">What our clients say</h2>
            </div>

            <div className="relative">
              <Card className="bg-primary-50/40 border-primary-100">
                <CardContent className="p-8 md:p-12 text-center">
                  <Quote className="h-10 w-10 text-primary-300 mx-auto mb-6" />
                  <p className="text-lg md:text-xl text-gray-700 italic leading-relaxed min-h-[120px]">
                    "{testimonials[currentTestimonial].content}"
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <span className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      <Users className="h-6 w-6" />
                    </span>
                    <div className="text-left">
                      <div className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</div>
                      <div className="text-sm text-gray-500">{testimonials[currentTestimonial].role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                  className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentTestimonial(i)}
                      aria-label={`Testimonial ${i + 1}`}
                      className={`h-2.5 rounded-full transition-all ${i === currentTestimonial ? 'w-7 bg-primary-500' : 'w-2.5 bg-gray-300 hover:bg-gray-400'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                  className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CTA ============ */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-12 md:px-12 md:py-16 text-center">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_45%)]" />
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">Ready to accelerate your career?</h2>
                <p className="mt-3 text-lg text-white/90 max-w-2xl mx-auto">Browse jobs, optimize your resume, and let Rezzy do the heavy lifting.</p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-white/90" asChild>
                    <Link href="/jobs"><Search className="mr-2 h-5 w-5" /> Browse jobs</Link>
                  </Button>
                  <Button size="lg" className="bg-secondary text-white hover:bg-secondary-600" asChild>
                    <Link href="#pricing">View packages <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ CONTACT ============ */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-primary-600 font-semibold uppercase tracking-wide text-sm">Get in touch</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">Contact us</h2>
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
