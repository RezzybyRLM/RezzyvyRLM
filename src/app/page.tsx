'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Star, Users, Zap, Target, CheckCircle, ArrowRight, Play, Quote } from 'lucide-react'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const params = new URLSearchParams()
      params.set('q', searchQuery.trim())
      if (location.trim()) params.set('location', location.trim())
      window.location.href = `/jobs?${params.toString()}`
    }
  }

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'AI-Powered Matching',
      description: 'Our AI analyzes job descriptions and matches them with your skills and experience.'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Interview Pro',
      description: 'Practice interviews with AI-powered voice coaching to boost your confidence.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Smart Job Alerts',
      description: 'Get personalized job recommendations delivered to your inbox daily.'
    }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Software Engineer',
      content: 'Rezzy helped me land my dream job at a top tech company. The AI interview practice was a game-changer!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Marketing Manager',
      content: 'The job matching algorithm is incredible. It found opportunities I never would have discovered on my own.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Data Analyst',
      content: 'The resume optimization feature helped me get 3x more interview calls. Highly recommended!',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Find Your Dream Job + 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">
                  Prepare with AI
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                The powerful tool to streamline your employment search. We support, empower, 
                and free your time so you can live your life while actively pursuing your next career move.
              </p>
            </div>

            {/* Search Bar */}
            <div className={`max-w-3xl mx-auto mb-12 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <form onSubmit={handleSearch} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Job title, keywords, or company"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-primary transition-all duration-300 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-hover:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-12 h-14 text-lg border-2 border-gray-200 focus:border-primary transition-all duration-300 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full mt-6 h-14 text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 rounded-xl group">
                  <Search className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Search Jobs
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="text-center group">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary group-hover:scale-110 transition-transform duration-300">10K+</div>
                <div className="text-gray-600 font-medium">Jobs Available</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary group-hover:scale-110 transition-transform duration-300">500+</div>
                <div className="text-gray-600 font-medium">Companies</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary group-hover:scale-110 transition-transform duration-300">95%</div>
                <div className="text-gray-600 font-medium">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Rezzy</span>?
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              We're not just another job board. We're your AI-powered career partner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 border-0 bg-gradient-to-br from-white to-gray-50/50">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Users <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Say</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600">
              Join thousands of successful job seekers who found their dream jobs with Rezzy.
            </p>
          </div>

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
                          <div className="flex items-center justify-center mb-6">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-6 w-6 text-yellow-400 fill-current mx-1" />
                            ))}
                          </div>
                          <p className="text-xl md:text-2xl text-gray-700 mb-8 italic leading-relaxed">
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
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of job seekers who are already using AI to advance their careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold rounded-xl hover:scale-105 transition-all duration-300 group" asChild>
              <Link href="/auth/register">
                <Play className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-primary rounded-xl hover:scale-105 transition-all duration-300 group" asChild>
              <Link href="/interview-pro">
                <Target className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Try Interview Pro
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Top Companies</span>
            </h3>
            <p className="text-lg text-gray-600">
              Our job listings include opportunities from leading companies worldwide.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
            {['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix'].map((company, index) => (
              <div key={company} className="text-center group">
                <div className="text-xl font-bold text-gray-400 group-hover:text-primary transition-colors duration-300 group-hover:scale-110 transform">
                  {company}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
