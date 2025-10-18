'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Users, Target, Zap, CheckCircle, Star } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const stats = [
    { label: 'Jobs Posted', value: '10,000+' },
    { label: 'Companies', value: '500+' },
    { label: 'Success Stories', value: '2,500+' },
    { label: 'Countries', value: '50+' }
  ]

  const values = [
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: 'Empathy First',
      description: 'We understand the challenges of job searching and are here to support you every step of the way.'
    },
    {
      icon: <Target className="h-8 w-8 text-blue-500" />,
      title: 'Precision Matching',
      description: 'Our AI-powered algorithms ensure you find the perfect job match based on your skills and preferences.'
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: 'Innovation',
      description: 'We continuously innovate to provide cutting-edge tools that give you a competitive edge.'
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: 'Community',
      description: 'Join a community of job seekers who support and inspire each other to achieve their career goals.'
    }
  ]

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: '/team/sarah.jpg',
      bio: 'Former Google engineer with 10+ years in tech recruitment.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: '/team/michael.jpg',
      bio: 'AI specialist with expertise in machine learning and natural language processing.'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Head of Product',
      image: '/team/emily.jpg',
      bio: 'Product strategist focused on user experience and career development tools.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              About <span className="text-primary">Rezzy</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              We're revolutionizing the job search experience by combining AI-powered matching 
              with personalized career development tools to help you land your dream job.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                To democratize access to career opportunities by leveraging AI technology 
                to connect talented individuals with their ideal roles, while providing 
                the tools and support needed to excel in today's competitive job market.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                We believe that everyone deserves to find meaningful work that aligns 
                with their passions, skills, and career aspirations.
              </p>
              <Button size="lg" asChild>
                <Link href="/auth/register">Join Our Mission</Link>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold">AI Matching</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Quality Jobs</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Community</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Fast Results</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600">
              The passionate people behind Rezzy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-gray-500" />
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <Badge variant="secondary">{member.role}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.bio}</p>
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
            Join thousands of job seekers who are already using Rezzy to advance their careers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
