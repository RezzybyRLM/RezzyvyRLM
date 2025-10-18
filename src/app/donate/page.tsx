'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, Coffee, Server, Code, Users, Loader2 } from 'lucide-react'

const DONATION_AMOUNTS = [
  { amount: 500, label: '$5', description: 'Buy us a coffee', icon: Coffee },
  { amount: 1000, label: '$10', description: 'Help us maintain servers', icon: Server },
  { amount: 2500, label: '$25', description: 'Support AI development', icon: Code },
  { amount: 5000, label: '$50', description: 'Keep tools free for job seekers', icon: Users },
]

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDonation = async () => {
    const amount = selectedAmount || parseInt(customAmount) * 100 // Convert to cents
    
    if (!amount || amount < 100) {
      setError('Please select or enter a valid donation amount (minimum $1)')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          donorName: donorName.trim() || undefined,
          donorEmail: donorEmail.trim() || undefined,
          type: 'donation',
        }),
      })

      const data = await response.json()

      if (data.success && data.sessionUrl) {
        window.location.href = data.sessionUrl
      } else {
        setError(data.error || 'Failed to create donation session')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Support Rezzy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Help us keep AI-powered career tools free for job seekers worldwide. 
            Your donation directly supports our mission to democratize career advancement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Make a Donation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Preset Amounts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose an amount
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DONATION_AMOUNTS.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.amount}
                        onClick={() => {
                          setSelectedAmount(option.amount)
                          setCustomAmount('')
                        }}
                        className={`p-4 border rounded-lg text-left transition-colors ${
                          selectedAmount === option.amount
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <Icon className="h-5 w-5 text-primary mr-2" />
                          <span className="font-semibold text-lg">{option.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter a custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value)
                      setSelectedAmount(null)
                    }}
                    className="pl-8"
                    min="1"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Donor Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your name (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your email (optional)
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleDonation}
                disabled={loading || (!selectedAmount && !customAmount)}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    Donate Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Impact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Keep Tools Free</h4>
                      <p className="text-sm text-gray-600">
                        Help us maintain free access to AI-powered career tools for job seekers
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Code className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Improve AI Features</h4>
                      <p className="text-sm text-gray-600">
                        Fund development of better resume matching and interview coaching
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Server className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Maintain Infrastructure</h4>
                      <p className="text-sm text-gray-600">
                        Keep our servers running and job data fresh
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Donate?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Rezzy is built to help job seekers find their dream careers. We believe 
                    everyone deserves access to powerful AI tools, regardless of their financial situation.
                  </p>
                  <p className="text-sm text-gray-600">
                    Your donation helps us:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Keep all basic features free forever</li>
                    <li>• Improve our AI algorithms</li>
                    <li>• Add new career tools</li>
                    <li>• Maintain reliable service</li>
                    <li>• Support our development team</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="text-center">
                  <Badge variant="featured" className="mb-3">
                    Tax Deductible
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Rezzy is a mission-driven platform. Donations may be tax-deductible 
                    depending on your location and tax situation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
