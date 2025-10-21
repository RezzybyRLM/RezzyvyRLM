'use client'

import { useState } from 'react'
import { X, Zap, TrendingUp, Shield } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import Link from 'next/link'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  feature: string
  currentPlan: string
  onUpgrade?: () => void
}

export function UpgradePrompt({
  isOpen,
  onClose,
  title,
  message,
  feature,
  currentPlan,
  onUpgrade,
}: UpgradePromptProps) {
  if (!isOpen) return null

  const plans = [
    {
      name: 'Basic',
      price: '$9.99',
      interval: '/month',
      features: ['50 Job Searches', '20 Applications', '100 Bookmarks', '10 AI Matches'],
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$19.99',
      interval: '/month',
      features: ['200 Job Searches', '100 Applications', '500 Bookmarks', '50 AI Matches'],
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      interval: '',
      features: ['Unlimited Everything', 'Priority Support', 'Advanced Analytics'],
      highlight: false,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <p className="text-sm text-gray-600">Current Plan: <Badge>{currentPlan}</Badge></p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700">{message}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upgrade to unlock <span className="text-blue-600">{feature}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${plan.highlight ? 'border-blue-500 border-2 shadow-lg' : ''}`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white">Recommended</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      onClick={onUpgrade}
                    >
                      Choose {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>All plans include secure payment and 30-day money-back guarantee</span>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button asChild className="flex-1">
              <Link href="/donate">View Pricing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

