'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Users, Target, CheckCircle, Star, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function ResumeServicesPage() {
  const services = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Resume Writing',
      description: 'Professional resume writing tailored to your industry and career level',
      features: ['ATS Optimization', 'Industry-Specific Formatting', 'Keyword Optimization', 'Professional Templates'],
      price: 'Starting at $150',
      popular: true
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Cover Letter Writing',
      description: 'Compelling cover letters that complement your resume and showcase your personality',
      features: ['Customized Content', 'Company Research', 'Professional Tone', 'Multiple Versions'],
      price: 'Starting at $75',
      popular: false
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: 'LinkedIn Profile Optimization',
      description: 'Transform your LinkedIn profile into a powerful career tool',
      features: ['Profile Optimization', 'Headline Writing', 'Summary Creation', 'Keyword Integration'],
      price: 'Starting at $99',
      popular: false
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Interview Coaching',
      description: 'One-on-one coaching to help you ace your next interview',
      features: ['Mock Interviews', 'Question Preparation', 'Confidence Building', 'Follow-up Guidance'],
      price: 'Starting at $150/session',
      popular: false
    }
  ]

  const packages = [
    {
      name: 'Essential Package',
      price: '$200',
      description: 'Perfect for entry-level professionals',
      features: [
        'One-on-One Consultation (20 min)',
        'Professional Resume',
        'Cover Letter',
        'Bio',
        'Unlimited Revisions (14 days)',
        'VCard QR Code'
      ],
      popular: false
    },
    {
      name: 'Accelerated Package',
      price: '$300/month',
      description: 'Ideal for mid-level professionals',
      features: [
        'One-on-One Consultation (30 min)',
        'Professional Resume',
        'Cover Letter',
        'Bio',
        'Reference List',
        'Thank You Letter (3 options)',
        'Additional Resume',
        'Unlimited Revisions (14 days)',
        'VCard QR Code'
      ],
      popular: true
    },
    {
      name: 'Definitive Package',
      price: '$500/month',
      description: 'Complete career solution for executives',
      features: [
        'One-on-One Consultation (1 hour)',
        'Professional Resume',
        'Cover Letter',
        'Bio',
        'Reference List',
        'Thank You Letter (3 options)',
        'Additional Resume',
        'LinkedIn Optimization',
        'Career Interview Coaching',
        'Unlimited Revisions (14 days)',
        'VCard QR Code'
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Resume Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional resume writing and career services to help you land your dream job
          </p>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className={`hover:shadow-lg transition-all duration-300 hover:-translate-y-2 ${service.popular ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="text-center">
                  {service.popular && (
                    <Badge className="mb-2 bg-primary text-white">Most Popular</Badge>
                  )}
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <ul className="space-y-2 mb-4">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="text-2xl font-bold text-primary mb-4">{service.price}</div>
                  <Button className="w-full" asChild>
                    <Link href="/cart">Add to Cart</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Packages Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Service Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <Card key={index} className={`text-center hover:shadow-xl transition-all duration-500 hover:-translate-y-4 hover:scale-105 ${pkg.popular ? 'border-2 border-primary shadow-xl ring-2 ring-primary/20' : 'border-0 hover:border-primary/20'}`}>
                <CardHeader className="pb-4">
                  {pkg.popular && (
                    <Badge className="mb-4 bg-primary text-white animate-pulse">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {pkg.price}
                  </div>
                  <p className="text-gray-600">{pkg.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full transition-all duration-300 hover:scale-105 ${pkg.popular ? 'bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl' : 'bg-gray-900 hover:bg-gray-800 shadow-lg hover:shadow-xl'}`}
                    asChild
                  >
                    <Link href="/cart">Choose Package</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose Our Resume Services?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Expert Writers</h3>
              <p className="text-gray-600">Our certified resume writers have years of experience across various industries</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
              <p className="text-gray-600">Get your resume back within 3-5 business days with unlimited revisions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <DollarSign className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Money-Back Guarantee</h3>
              <p className="text-gray-600">100% satisfaction guarantee or your money back within 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
