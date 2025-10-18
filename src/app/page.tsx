'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowRight, Play, Quote, FileText, Briefcase, MessageSquare, QrCode, Linkedin, Send, CheckCircle, ShoppingCart, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addToCart } from '@/lib/cart/actions'
import { submitContactForm } from '@/lib/contact/actions'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Skeleton } from '@/components/ui/skeleton-loader'

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    // Auto-rotate hero slides (logo and text)
    const heroInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2)
    }, 10000)

    return () => {
      clearInterval(testimonialInterval)
      clearInterval(heroInterval)
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleAddToCart = async (packageName: string, packageType: string, price: number) => {
    if (!user) {
      window.location.href = '/auth/login?redirectTo=/'
      return
    }

    setAddingToCart(packageType)
    try {
      await addToCart({
        package_name: packageName,
        package_type: packageType,
        price: price
      })
      // You could add a toast notification here
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
        setContactMessage({ type: 'success', text: 'Message sent successfully! We\'ll get back to you soon.' })
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
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'RESUME | COVER LETTER | BIO',
      description: 'Customizable resumes, cover letters, and bios. Includes: formatting, editing, test layout, and design that resume tracking systems may miss. Available in both MS Word and PDF Documents.'
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: 'EASY CUSTOMIZABLE TEMPLATES',
      description: 'Choose from a library of customizable design templates that stand out and get you noticed.'
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'CAREER | INTERVIEW COACHING',
      description: 'Sit down with a qualified career coach to empower you to present your best self throughout your employment process and career choices.'
    },
    {
      icon: <QrCode className="h-8 w-8" />,
      title: 'VCARD PLUS QR CODE',
      description: 'A virtual electronic representation of resume, cover letter, and bio with a dedicated landing page.'
    },
    {
      icon: <Linkedin className="h-8 w-8" />,
      title: 'LINKEDIN PROFILE OPTIMIZATION',
      description: 'Optimize and update your LinkedIn profile content.'
    },
    {
      icon: <Send className="h-8 w-8" />,
      title: 'APPLICATION PROCESSING SERVICES',
      description: 'With our RezzyMeUp package, our qualified team will do the applying for you. No more repetitive monotony of filling in online application forms.'
    }
  ]

  const testimonials = [
    {
      name: 'KYRNDRA D.',
      role: 'United States Postal Service',
      content: 'I was pressed for time to update my cover letter. Rezzy delivered exceptional service while providing tips to help me the next time I am in a pinch.'
    },
    {
      name: 'CAROLYN M.',
      role: 'Associate Director',
      content: 'I am very impressed with Rezzy, especially how its customer service ensures the right packages and à la carte products are suggested based on professional credentials and positions being sought.'
    },
    {
      name: 'RACHELLE O.',
      role: 'Behavioral Health',
      content: 'I was in the market to update my resume and cover letter due to desiring a career change. I have been out of the job field for so long that I did not know where to begin. I came across a very relatable Rezzy explainer video that piqued my interest. I decided to use their resume and cover letter services, and shortly after reviewing the other services offered, I decided to use Rezzy career search, Easy Apply, and Website Apply due to not having adequate time to work a full-time position and look for career opportunities. As a result, I received three different recruiter companies offering direct placement if all goes well with the interview process. I have set in motion to use Rezzy for interview and coaching service to give myself a better chance at nailing these interviews. Thank you for saving me time and rebuilding my confidence.'
    }
  ]

  const pricingPlans = [
    {
      name: 'Essential Package',
      price: '$200',
      interval: '',
      features: [
        'One-on-One Consultation with Our Resume Writer (Email or zoom call 20 min)',
        'One Page Resume (Career, Federal, and Curriculum Vitae)',
        'One Page Bio',
        'Cover Letter',
        'Unlimited Revisions for 14 Days',
        'VcardplusQRcode'
      ],
      featured: false,
      link: 'https://rezzybyrlm.com/product/rezzyme/'
    },
    {
      name: 'Definitive Package',
      price: '$500',
      interval: '/ month',
      features: [
        'One-on-One Consultation with Our Resume Writer (Email or Zoom call 1hr)',
        'One Page Resume (Career, Federal, and Curriculum Vitae)',
        'One Page Bio',
        'Cover Letter',
        'Unlimited Revisions for 14 Days',
        'VcardplusQRcode',
        'Reference List',
        'Thank You Letter (3 Options)',
        'One Additional Resume',
        'LinkedIn Optimization',
        'Career Interview Coaching'
      ],
      featured: true,
      link: 'https://rezzybyrlm.com/product/rezzy-definitive/'
    },
    {
      name: 'Accelerated Package',
      price: '$300',
      interval: '/ month',
      features: [
        'One-on-One Consultation with Our Resume Writer (Email or Zoom call 30 minutes)',
        'One Page Resume (Career, Federal, and Curriculum Vitae)',
        'One Page Bio',
        'Cover Letter',
        'Unlimited Revisions for 14 Days',
        'VcardplusQRcode',
        'Reference List',
        'Thank You Letter (3 Options)',
        'One Additional Resume'
      ],
      featured: false,
      link: 'https://rezzybyrlm.com/product/rezzy-accelerated/'
    }
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 min-h-screen flex items-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233b82f6%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Sliding Hero Content */}
              <div className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
                {/* Logo Slide */}
                <div 
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-in-out ${
                    currentSlide === 0 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-full'
                  }`}
                >
                  <img 
                    src="/logo.png" 
                    alt="Rezzy Logo" 
                    className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain"
                  />
                </div>

                {/* Text Slide */}
                <div 
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
                    currentSlide === 1 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-full'
                  }`}
                >
                  <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-primary mb-6 leading-tight tracking-tight">
                    DYNAMIC | POWERFUL
                  </h1>
                  
                  {/* Decorative Line */}
                  <div className="w-32 h-2 bg-gradient-to-r from-primary to-primary-dark mx-auto mb-8 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Subheading */}
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-600 mb-12 max-w-5xl mx-auto leading-relaxed font-light italic">
                Not just another resume service! We support, empower, and free your time so you can live your life while still actively pursuing your next career move.
              </p>
              
              {/* CTA Button */}
              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 px-12 text-xl font-bold rounded-2xl hover:scale-110 transition-all duration-500 group border-3 border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white shadow-xl hover:shadow-2xl"
                asChild
              >
                <Link href="#services">
                  LEARN MORE
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Main Services Section */}
      <section id="services" className="section-padding bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto container-padding">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-6">
              Rezzy, The Powerful Tool to Streamline Your Employment Search!
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
            <p className="text-responsive-md text-gray-600 max-w-4xl mx-auto italic">
              We are not just another resume service; we support, empower, and free your time so you can live your life while still actively pursuing your next career move.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left Column - Features */}
            <div className="lg:col-span-1 space-y-12">
              {features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group hover:bg-white/50 p-4 rounded-lg transition-all duration-300 animate-fadeInUp" style={{ animationDelay: `${index * 0.2}s` }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Column - Main Image */}
            <div className="lg:col-span-1 flex justify-center">
              <div className="relative w-full max-w-md animate-float">
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 text-center card-elevated">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">EMPOWERED</h3>
                  <p className="text-gray-600">Your career journey starts here</p>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="lg:col-span-1 space-y-12">
              {features.slice(3, 6).map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group hover:bg-white/50 p-4 rounded-lg transition-all duration-300 animate-fadeInUp" style={{ animationDelay: `${(index + 3) * 0.2}s` }}>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Professional Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%233b82f6%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M50%200L100%2050L50%20100L0%2050z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto container-padding relative">
          {/* Testimonial Slider */}
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group card-glass">
                      <CardContent className="pt-8 pb-8 px-8">
                        <div className="text-center">
                          <Quote className="h-12 w-12 text-primary/20 mx-auto mb-6 animate-pulse" />
                          <p className="text-lg md:text-xl text-gray-700 mb-8 italic leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                            "{testimonial.content}"
                          </p>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors duration-300">{testimonial.name}</div>
                              <div className="text-gray-600">{testimonial.role}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-4">
              <button
                onClick={() => setCurrentTestimonial((prev) => prev === 0 ? testimonials.length - 1 : prev - 1)}
                className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <ArrowRight className="h-5 w-5 text-primary rotate-180" />
              </button>
              
              {/* Testimonial Indicators */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'bg-primary scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentTestimonial((prev) => prev === testimonials.length - 1 ? 0 : prev + 1)}
                className="w-10 h-10 bg-primary/10 hover:bg-primary/20 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <ArrowRight className="h-5 w-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="section-padding bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90"></div>
        
        <div className="max-w-5xl mx-auto container-padding text-center relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column */}
            <div className="text-left md:text-left">
              <h2 className="text-responsive-xl font-bold text-white mb-6 leading-tight">
                CHECK OUT OUR REZZY PACKAGES
              </h2>
              <p className="text-responsive-md text-white/90 mb-6">
                Essential Package | Accelerated Package | Definitive Package
              </p>
            </div>
            
            {/* Right Column */}
            <div className="flex justify-center md:justify-end">
              <Button 
                size="lg" 
                variant="secondary" 
                className="h-14 px-8 text-lg font-semibold rounded-xl hover:scale-105 transition-all duration-300 group bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl"
                asChild
              >
                <Link href="#pricing">
                  <Play className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  ORDER NOW
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-6">
              Why Choose Us
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
            <p className="text-responsive-md text-gray-600 max-w-3xl mx-auto italic">
              Rezzy has an inside and unique perspective on the hiring process with a proven and extensive selection of services and tools that put you ahead of the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-600 mb-6 italic">
                We are committed to outstanding quality in all that we offer. Our professionalism is backed by multiple industry experience and a genuine desire to see all our clients succeed. We provide each client with their own personal certified resume writer with lightning-fast turnaround times.
              </p>
              <p className="text-lg text-gray-600 mb-8 italic">
                Our customized and tailored packages work for you and provide results.
              </p>
              
              {/* Progress Bars */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Essential Package</span>
                    <span className="text-sm font-bold text-primary">97%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill animate-progressFill"
                      style={{'--progress-width': '97%'} as React.CSSProperties}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Accelerated Package</span>
                    <span className="text-sm font-bold text-primary">90%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill animate-progressFill"
                      style={{'--progress-width': '90%'} as React.CSSProperties}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Definitive Package</span>
                    <span className="text-sm font-bold text-primary">85%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill animate-progressFill"
                      style={{'--progress-width': '85%'} as React.CSSProperties}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 card-elevated">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success Rates</h3>
                <p className="text-gray-600">Proven results across all our packages</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section id="pricing" className="section-padding bg-gray-50">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-6">
              Pricing Plans
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
            <p className="text-responsive-md text-gray-600 max-w-3xl mx-auto italic">
              Rezzy offers a variety of packages so our clients can pick and choose what best fits their needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`text-center hover:shadow-2xl transition-all duration-500 group hover:-translate-y-4 hover:scale-105 card-professional ${plan.featured ? 'border-2 border-primary shadow-xl ring-2 ring-primary/20' : 'border-0 hover:border-primary/20'}`}>
                <CardHeader className="pb-4">
                  {plan.featured && (
                    <Badge className="mb-4 bg-primary text-white animate-pulse">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">{plan.name}</CardTitle>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                    {plan.price}
                    <span className="text-lg text-gray-500">{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button 
                      className={`w-full transition-all duration-300 hover:scale-105 ${plan.featured ? 'bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl' : 'bg-gray-900 hover:bg-gray-800 shadow-lg hover:shadow-xl'}`}
                      onClick={() => handleAddToCart(plan.name, plan.name.toLowerCase().replace(' package', ''), parseInt(plan.price.replace('$', '')))}
                      disabled={addingToCart === plan.name.toLowerCase().replace(' package', '')}
                    >
                      {addingToCart === plan.name.toLowerCase().replace(' package', '') ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          ADD TO CART
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      asChild
                    >
                      <Link href={plan.link} target="_blank" rel="noopener noreferrer">
                        VIEW PACKAGE
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-responsive-xl font-bold text-gray-900 mb-6">
              Contact Us
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-2xl card-elevated">
              <CardContent className="p-8">
                {contactMessage && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    contactMessage.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {contactMessage.text}
                  </div>
                )}
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name (required)
                      </label>
                      <Input 
                        type="text" 
                        className="input-professional"
                        placeholder="Enter your name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email (required)
                      </label>
                      <Input 
                        type="email" 
                        className="input-professional"
                        placeholder="Enter your email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <Input 
                      type="text" 
                      className="input-professional"
                      placeholder="Enter subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message
                    </label>
                    <textarea 
                      className="input-professional h-32 resize-none"
                      placeholder="Enter your message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="btn-primary w-full h-12 text-lg"
                    disabled={isSubmittingContact}
                  >
                    {isSubmittingContact ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        SEND
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Social Links */}
            <div className="text-center md:text-left">
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex justify-center md:justify-start space-x-4">
                <a 
                  href="https://www.facebook.com/rezzybyrlm/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <span className="text-white">📘</span>
                </a>
                <a 
                  href="https://www.instagram.com/rezzybyrlm/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <span className="text-white">📷</span>
                </a>
                <a 
                  href="https://twitter.com/RezzybyRLM" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <span className="text-white">🐦</span>
                </a>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Menu</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-gray-300 hover:text-white transition-colors">Home</Link>
                <Link href="/resume-services" className="block text-gray-300 hover:text-white transition-colors">Resume Services</Link>
                <Link href="/about-us" className="block text-gray-300 hover:text-white transition-colors">About Us</Link>
                <Link href="/contact-us" className="block text-gray-300 hover:text-white transition-colors">Contact Us</Link>
                <Link href="/cart" className="block text-gray-300 hover:text-white transition-colors">Cart</Link>
              </div>
            </div>

            {/* Cart */}
            <div className="text-center md:text-right">
              <h3 className="text-lg font-semibold mb-4">Cart</h3>
              <p className="text-gray-300">Your cart is empty</p>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              Copyright © 2021-2022 Rezzy by RLM, LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}