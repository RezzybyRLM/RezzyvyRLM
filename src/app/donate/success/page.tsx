'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Heart, Users, Code, Server } from 'lucide-react'

function DonationSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [donationAmount, setDonationAmount] = useState<string>('')

  useEffect(() => {
    // In a real app, you'd fetch the session details from Stripe
    // For now, we'll show a generic success message
    setDonationAmount('$25') // Default amount
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You for Your Donation!
          </h1>
          <p className="text-xl text-gray-600">
            Your support helps us keep AI-powered career tools free for job seekers worldwide.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Donation Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount</span>
                <span className="font-semibold text-lg">{donationAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm">{sessionId || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Free Access</h4>
                  <p className="text-sm text-gray-600">
                    Helps us maintain free access to AI tools for job seekers
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Code className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AI Development</h4>
                  <p className="text-sm text-gray-600">
                    Funds improvements to our AI-powered career tools
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Server className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Infrastructure</h4>
                  <p className="text-sm text-gray-600">
                    Keeps our servers running and job data fresh
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Community</h4>
                  <p className="text-sm text-gray-600">
                    Supports our mission to democratize career advancement
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            We'll send you a receipt via email shortly. Thank you for supporting our mission!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/jobs">Find Jobs</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/interview-pro">Try Interview Pro</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Questions about your donation? Contact us at{' '}
            <a href="mailto:support@rezzybyrlm.com" className="text-primary hover:underline">
              support@rezzybyrlm.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  )
}
