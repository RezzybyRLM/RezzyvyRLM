'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Target, Award, Heart, CheckCircle, Star } from 'lucide-react'
import Link from 'next/link'

export default function AboutUsPage() {
  const teamMembers = [
    {
      name: 'Sarah Johnson',
      role: 'Lead Resume Writer',
      experience: '8+ years',
      specialties: ['Executive Resumes', 'Tech Industry', 'Healthcare'],
      image: '👩‍💼'
    },
    {
      name: 'Michael Chen',
      role: 'Career Coach',
      experience: '10+ years',
      specialties: ['Interview Prep', 'Career Transition', 'Leadership Development'],
      image: '👨‍💼'
    },
    {
      name: 'Emily Rodriguez',
      role: 'LinkedIn Specialist',
      experience: '6+ years',
      specialties: ['Profile Optimization', 'Personal Branding', 'Networking'],
      image: '👩‍💻'
    }
  ]

  const values = [
    {
      icon: <Heart className="h-8 w-8" />,
      title: 'Client-First Approach',
      description: 'We prioritize your success and satisfaction above all else'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Quality Excellence',
      description: 'Every resume is crafted with attention to detail and industry expertise'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Personalized Service',
      description: 'One-on-one consultations ensure your unique story is told effectively'
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'Results-Driven',
      description: 'Our focus is on helping you land interviews and advance your career'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Resumes Written' },
    { number: '95%', label: 'Client Satisfaction' },
    { number: '85%', label: 'Interview Rate' },
    { number: '5+', label: 'Years Experience' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Us
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're passionate about helping professionals advance their careers through exceptional resume writing and career services
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-0">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
                At Rezzy, we believe that every professional deserves a resume that truly represents their value and potential. 
                Our mission is to empower job seekers with compelling, ATS-optimized resumes and comprehensive career services 
                that open doors to new opportunities and career advancement.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="text-6xl mb-4">{member.image}</div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <div className="text-primary font-semibold">{member.role}</div>
                  <div className="text-sm text-gray-600">{member.experience} experience</div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Specialties:</h4>
                    {member.specialties.map((specialty, specialtyIndex) => (
                      <div key={specialtyIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {specialty}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                    {value.icon}
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                  <div className="space-y-4 text-gray-700">
                    <p>
                      Founded in 2019, Rezzy began as a small team of career professionals who recognized 
                      the gap between talented job seekers and their dream opportunities. We saw too many 
                      qualified candidates struggling to get noticed due to poorly crafted resumes.
                    </p>
                    <p>
                      Today, we've helped over 10,000 professionals across various industries land their 
                      dream jobs. Our certified resume writers and career coaches bring decades of 
                      combined experience in HR, recruiting, and career development.
                    </p>
                    <p>
                      We're proud to be more than just a resume service – we're your career partners, 
                      committed to your long-term success and professional growth.
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-8">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Growing Together</h3>
                    <p className="text-gray-600">Your success is our success</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-br from-primary to-secondary text-white border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to Advance Your Career?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let us help you create a resume that opens doors to new opportunities
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/resume-services">View Our Services</Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                  <Link href="/contact-us">Get Started</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
