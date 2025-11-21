'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, FileText, User, Award, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface CompletionStepProps {
  resumesCount: number
  profilesCount: number
  totalSkills: number
  totalCertifications: number
  totalEducation: number
  onComplete: () => Promise<void>
}

export function CompletionStep({
  resumesCount,
  profilesCount,
  totalSkills,
  totalCertifications,
  totalEducation,
  onComplete
}: CompletionStepProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setShowConfetti(true)
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await onComplete()
      // Redirect will happen in parent component
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto text-center">
      {/* Success animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">You're All Set!</h2>
        <p className="text-gray-600">
          Your profile is ready. Let's start finding your dream job.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What You've Created</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center">
            <FileText className="w-8 h-8 text-primary mb-2" />
            <p className="text-2xl font-bold text-gray-900">{resumesCount}</p>
            <p className="text-xs text-gray-600">Resume{resumesCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-center">
            <User className="w-8 h-8 text-primary mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profilesCount}</p>
            <p className="text-xs text-gray-600">Profile{profilesCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-center">
            <Award className="w-8 h-8 text-primary mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalSkills}</p>
            <p className="text-xs text-gray-600">Skill{totalSkills !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex flex-col items-center">
            <GraduationCap className="w-8 h-8 text-primary mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {totalCertifications + totalEducation}
            </p>
            <p className="text-xs text-gray-600">Credential{(totalCertifications + totalEducation) !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Next?</h3>
        <div className="space-y-2 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Start Browsing Jobs</p>
              <p className="text-sm text-gray-600">Search and apply to jobs that match your profiles</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Complete Your Profile</p>
              <p className="text-sm text-gray-600">Add more details to make your profile stand out</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">Explore Features</p>
              <p className="text-sm text-gray-600">Try Interview Pro, Job Alerts, and more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete button */}
      <div className="pt-4">
        <Button
          onClick={handleComplete}
          disabled={completing}
          size="lg"
          className="w-full md:w-auto min-w-[200px]"
        >
          {completing ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Completing...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>

      {/* Skip link */}
      <p className="text-sm text-gray-500">
        <button
          type="button"
          onClick={handleComplete}
          className="text-primary hover:underline"
        >
          Skip for now
        </button>
        {' '}and complete later from your profile
      </p>
    </div>
  )
}

