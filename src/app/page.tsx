'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Star, Users, Zap, Target, CheckCircle, ArrowRight, Play, Quote, FileText, Briefcase, MessageSquare, QrCode, Linkedin, Send, Menu, X } from 'lucide-react'

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

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
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center group">
                <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110">
                  <Image
                    src="/logo.png"
                    alt="Rezzy Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="text-2xl font-bold text-primary">Rezzy</div>';
                      }
                    }}
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-primary transition-colors font-medium">
                HOME
              </Link>
              <Link href="/resume-services" className="text-gray-700 hover:text-primary transition-colors">
                Resume Services
              </Link>
              <Link href="/about-us" className="text-gray-700 hover:text-primary transition-colors">
                About Us
              </Link>
              <Link href="/contact-us" className="text-gray-700 hover:text-primary transition-colors">
                Contact Us
              </Link>
              <Link href="/cart" className="text-gray-700 hover:text-primary transition-colors">
                Cart
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
                <Link
                  href="/"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  HOME
                </Link>
                <Link
                  href="/resume-services"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Resume Services
                </Link>
                <Link
                  href="/about-us"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About Us
                </Link>
                <Link
                  href="/contact-us"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact Us
                </Link>
                <Link
                  href="/cart"
                  className="block px-3 py-2 text-gray-700 hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cart
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Rezzy, The Powerful Tool to Streamline Your Employment Search!
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed italic">
                We are not just another resume service; we support, empower, and free your time so you can live your life while still actively pursuing your next career move.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left Column - Features */}
            <div className="lg:col-span-1 space-y-12">
              {features.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Column - Main Image */}
            <div className="lg:col-span-1 flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8 text-center">
                  <div className="text-6xl mb-4">💼</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">EMPOWERED</h3>
                  <p className="text-gray-600">Your career journey starts here</p>
                </div>
              </div>
            </div>

            {/* Right Column - Features */}
            <div className="lg:col-span-1 space-y-12">
              {features.slice(3, 6).map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Testimonial Slider */}
          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-300">
                      <CardContent className="pt-8 pb-8 px-8">
                        <div className="text-center">
                          <Quote className="h-12 w-12 text-primary/20 mx-auto mb-6" />
                          <p className="text-lg md:text-xl text-gray-700 mb-8 italic leading-relaxed">
                            "{testimonial.content}"
                          </p>
                          <div className="flex items-center justify-center space-x-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                              <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
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
            
            {/* Testimonial Indicators */}
            <div className="flex justify-center mt-8 space-x-2">
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
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            CHECK OUT OUR REZZY PACKAGES
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Essential Package | Accelerated Package | Definitive Package
          </p>
          <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold rounded-xl hover:scale-105 transition-all duration-300 group" asChild>
            <Link href="https://rezzybyrlm.com/products-and-services/">
              <Play className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              ORDER NOW
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Us
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto italic">
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{width: '97%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Accelerated Package</span>
                    <span className="text-sm font-bold text-primary">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Definitive Package</span>
                    <span className="text-sm font-bold text-primary">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success Rates</h3>
                <p className="text-gray-600">Proven results across all our packages</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pricing Plans
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto italic">
              Rezzy offers a variety of packages so our clients can pick and choose what best fits their needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`text-center hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 ${plan.featured ? 'border-2 border-primary shadow-xl' : 'border-0'}`}>
                <CardHeader className="pb-4">
                  {plan.featured && (
                    <Badge className="mb-4 bg-primary text-white">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {plan.price}
                    <span className="text-lg text-gray-500">{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.featured ? 'bg-primary hover:bg-primary/90' : 'bg-gray-900 hover:bg-gray-800'}`}
                    asChild
                  >
                    <Link href={plan.link} target="_blank" rel="noopener noreferrer">
                      VIEW PACKAGE
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contact Us
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-6 rounded-full"></div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="shadow-2xl">
              <CardContent className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name (required)
                      </label>
                      <Input 
                        type="text" 
                        className="w-full"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email (required)
                      </label>
                      <Input 
                        type="email" 
                        className="w-full"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <Input 
                      type="text" 
                      className="w-full"
                      placeholder="Enter subject"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message
                    </label>
                    <textarea 
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter your message"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                    <Send className="mr-2 h-5 w-5" />
                    SEND
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <Link href="/" className="block text-gray-300 hover:text-white transition-colors">HOME</Link>
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