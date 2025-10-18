'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Star, Users, Zap, Target, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('')

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
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Your Dream Job + 
              <span className="text-primary"> Prepare with AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The powerful tool to streamline your employment search. We support, empower, 
              and free your time so you can live your life while actively pursuing your next career move.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Job title, keywords, or company"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="text"
                        placeholder="Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-10 h-12 text-lg"
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full mt-4 h-12 text-lg">
                  Search Jobs
                </Button>
              </form>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-gray-600">Jobs Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-gray-600">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">95%</div>
                <div className="text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Rezzy?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're not just another job board. We're your AI-powered career partner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of successful job seekers who found their dream jobs with Rezzy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of job seekers who are already using AI to advance their careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/interview-pro">Try Interview Pro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Company Logos */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Trusted by Top Companies
            </h3>
            <p className="text-gray-600">
              Our job listings include opportunities from leading companies worldwide.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-60">
            {['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix'].map((company) => (
              <div key={company} className="text-center">
                <div className="text-lg font-semibold text-gray-400">{company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
