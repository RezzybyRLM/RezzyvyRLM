'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProgressIndicator } from '@/components/onboarding/progress-indicator'
import { ResumeUploadStep } from '@/components/onboarding/resume-upload-step'
import { ProfileCreationStep } from '@/components/onboarding/profile-creation-step'
import { AdditionalProfilesStep } from '@/components/onboarding/additional-profiles-step'
import { CompletionStep } from '@/components/onboarding/completion-step'
import { Loader2 } from 'lucide-react'

interface Resume {
  id: string
  file_name: string
  file_size: number
  file_type: string
  file_url: string
}

interface Profile {
  id: string
  profile_name: string
  job_title: string
  industry: string
  skills: string[]
  education: any[]
  certifications: any[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [uploadedResumeIds, setUploadedResumeIds] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login?redirectTo=/onboarding')
          return
        }

        // Get onboarding status
        const statusResponse = await fetch('/api/onboarding/status')
        const statusData = await statusResponse.json()
        
        if (statusData.success && statusData.status.completed) {
          router.push(redirectTo)
          return
        }

        // Get saved step
        const savedStep = statusData.status?.step || 1
        setCurrentStep(savedStep)

        // Load existing resumes
        const { data: resumesData } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (resumesData) {
          setResumes(resumesData)
          setUploadedResumeIds(resumesData.map(r => r.id))
        }

        // Load existing profiles
        const profilesResponse = await fetch('/api/onboarding/profiles')
        const profilesData = await profilesResponse.json()
        if (profilesData.success) {
          setProfiles(profilesData.profiles || [])
        }
      } catch (error) {
        console.error('Error loading onboarding data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOnboardingData()
  }, [router, supabase, redirectTo])

  const updateStep = async (step: number) => {
    setCurrentStep(step)
    await fetch('/api/onboarding/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
  }

  const handleResumeUploadContinue = (resumeIds: string[]) => {
    setUploadedResumeIds(resumeIds)
    updateStep(2)
  }

  const handleProfileCreate = async (profileData: any) => {
    try {
      const response = await fetch('/api/onboarding/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          created_during_onboarding: true,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setProfiles([...profiles, data.profile])
        
        // If first profile, move to step 3
        if (profiles.length === 0) {
          updateStep(3)
        }
      } else {
        throw new Error(data.error || 'Failed to create profile')
      }
    } catch (error) {
      console.error('Error creating profile:', error)
      alert('Failed to create profile. Please try again.')
    }
  }

  const handleProfileUpdate = async (profileId: string, profileData: any) => {
    try {
      const response = await fetch('/api/onboarding/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profileId,
          ...profileData,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setProfiles(profiles.map(p => p.id === profileId ? data.profile : p))
      } else {
        throw new Error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const handleProfileDelete = async (profileId: string) => {
    try {
      const response = await fetch(`/api/onboarding/profiles?id=${profileId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        setProfiles(profiles.filter(p => p.id !== profileId))
      } else {
        throw new Error(data.error || 'Failed to delete profile')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile. Please try again.')
    }
  }

  const handleAdditionalProfilesContinue = () => {
    updateStep(4)
  }

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      })

      const data = await response.json()
      if (data.success) {
        router.push(redirectTo)
      } else {
        throw new Error(data.error || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Failed to complete onboarding. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    )
  }

  const availableResumes = resumes.map(r => ({ id: r.id, file_name: r.file_name }))
  const totalSkills = profiles.reduce((sum, p) => sum + (p.skills?.length || 0), 0)
  const totalCertifications = profiles.reduce((sum, p) => sum + (p.certifications?.length || 0), 0)
  const totalEducation = profiles.reduce((sum, p) => sum + (p.education?.length || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProgressIndicator currentStep={currentStep} totalSteps={4} />

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          {currentStep === 1 && (
            <ResumeUploadStep
              onContinue={handleResumeUploadContinue}
              uploadedResumes={resumes}
            />
          )}

          {currentStep === 2 && (
            <ProfileCreationStep
              onContinue={handleProfileCreate}
              onBack={() => updateStep(1)}
              availableResumes={availableResumes}
              isFirstProfile={true}
            />
          )}

          {currentStep === 3 && (
            <AdditionalProfilesStep
              onContinue={handleAdditionalProfilesContinue}
              onBack={() => updateStep(2)}
              existingProfiles={profiles.map(p => ({
                id: p.id,
                profile_name: p.profile_name,
                job_title: p.job_title,
                industry: p.industry,
                skills_count: p.skills?.length || 0,
                education_count: p.education?.length || 0,
                certifications_count: p.certifications?.length || 0,
              }))}
              availableResumes={availableResumes}
              onCreateProfile={handleProfileCreate}
              onUpdateProfile={handleProfileUpdate}
              onDeleteProfile={handleProfileDelete}
            />
          )}

          {currentStep === 4 && (
            <CompletionStep
              resumesCount={resumes.length}
              profilesCount={profiles.length}
              totalSkills={totalSkills}
              totalCertifications={totalCertifications}
              totalEducation={totalEducation}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>
    </div>
  )
}

