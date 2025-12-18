'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function ResumeOptimizerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleGetStarted = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login?redirectTo=/resume-optimizer')
      return
    }
    router.push('/resume-manager')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Resume Optimizer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Optimize your resume to get past ATS systems and land more interviews
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              How It Works
            </CardTitle>
            <CardDescription>
              Our AI-powered resume optimizer analyzes your resume and provides actionable improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Upload Your Resume</h3>
                  <p className="text-gray-600 text-sm">
                    Upload your current resume in PDF, Word, or text format
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Our AI analyzes your resume for ATS compatibility, keywords, and formatting
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Get Recommendations</h3>
                  <p className="text-gray-600 text-sm">
                    Receive detailed suggestions to improve your resume's effectiveness
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleGetStarted}
            size="lg"
            className="px-8"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Started
              </>
            )}
          </Button>
          <p className="mt-4 text-sm text-gray-600">
            Already have a resume?{' '}
            <Link href="/resume-manager" className="text-primary hover:underline">
              Go to Resume Manager
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

