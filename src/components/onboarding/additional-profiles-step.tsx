'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileCreationStep } from './profile-creation-step'

interface Profile {
  id: string
  profile_name: string
  job_title: string
  industry: string
  skills_count: number
  education_count: number
  certifications_count: number
}

interface AdditionalProfilesStepProps {
  onContinue: () => void
  onBack: () => void
  existingProfiles: Profile[]
  availableResumes: Array<{ id: string; file_name: string }>
  onCreateProfile: (profileData: any) => Promise<void>
  onUpdateProfile: (profileId: string, profileData: any) => Promise<void>
  onDeleteProfile: (profileId: string) => Promise<void>
}

export function AdditionalProfilesStep({
  onContinue,
  onBack,
  existingProfiles,
  availableResumes,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile
}: AdditionalProfilesStepProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState<string | null>(null)

  const handleCreateProfile = async (profileData: any) => {
    await onCreateProfile(profileData)
    setShowCreateForm(false)
  }

  const handleEditProfile = async (profileId: string, profileData: any) => {
    await onUpdateProfile(profileId, profileData)
    setEditingProfile(null)
  }

  if (showCreateForm) {
    return (
      <div>
        <div className="mb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowCreateForm(false)}
          >
            ← Back to Profiles
          </Button>
        </div>
        <ProfileCreationStep
          onContinue={handleCreateProfile}
          onBack={() => setShowCreateForm(false)}
          availableResumes={availableResumes}
          isFirstProfile={false}
        />
      </div>
    )
  }

  if (editingProfile) {
    const profile = existingProfiles.find(p => p.id === editingProfile)
    if (!profile) {
      setEditingProfile(null)
      return null
    }

    return (
      <div>
        <div className="mb-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditingProfile(null)}
          >
            ← Back to Profiles
          </Button>
        </div>
        <ProfileCreationStep
          onContinue={(data) => handleEditProfile(editingProfile, data)}
          onBack={() => setEditingProfile(null)}
          availableResumes={availableResumes}
          isFirstProfile={false}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create More Profiles for Different Roles?
        </h2>
        <p className="text-gray-600">
          Many job seekers apply for different types of positions. Create separate profiles to tailor your applications.
        </p>
      </div>

      {/* Existing profiles */}
      {existingProfiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Profiles</h3>
          <div className="grid gap-4">
            {existingProfiles.map((profile) => (
              <div
                key={profile.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{profile.profile_name}</h4>
                      {profile.id === existingProfiles[0]?.id && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {profile.job_title} • {profile.industry}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>{profile.skills_count} skills</span>
                      {profile.education_count > 0 && (
                        <span>{profile.education_count} education</span>
                      )}
                      {profile.certifications_count > 0 && (
                        <span>{profile.certifications_count} certifications</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingProfile(profile.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {profile.id !== existingProfiles[0]?.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteProfile(profile.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create new profile button */}
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={() => setShowCreateForm(true)}
          size="lg"
          className="w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Another Profile
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center">
        You can always add more profiles later
      </p>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue} size="lg">
          I'm Done
        </Button>
      </div>
    </div>
  )
}

