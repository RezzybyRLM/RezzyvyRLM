'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, CheckCircle, X, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  profile_name: string
  job_title: string
  industry: string | null
  is_default: boolean
  is_active: boolean
}

interface ProfileSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (profileId: string) => void
  jobTitle?: string
  companyName?: string
}

export function ProfileSelector({ isOpen, onClose, onSelect, jobTitle, companyName }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchProfiles()
    }
  }, [isOpen])

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, profile_name, job_title, industry, is_default, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching profiles:', error)
      } else {
        setProfiles(data || [])
        // Auto-select default profile if available
        const defaultProfile = data?.find(p => p.is_default)
        if (defaultProfile) {
          setSelectedProfile(defaultProfile.id)
        }
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (selectedProfile) {
      onSelect(selectedProfile)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">Select Profile for Application</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {jobTitle && companyName && (
            <p className="text-sm text-gray-600 mt-2">
              Applying to: <span className="font-semibold">{jobTitle}</span> at <span className="font-semibold">{companyName}</span>
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No active profiles found.</p>
              <Button asChild>
                <a href="/profiles/new">Create a Profile</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Select which professional profile you want to use for this application:
              </p>
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedProfile === profile.id
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{profile.profile_name}</h3>
                          {profile.is_default && (
                            <Badge className="bg-primary text-white">Default</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="h-4 w-4" />
                          <span>{profile.job_title}</span>
                        </div>
                        {profile.industry && (
                          <p className="text-sm text-gray-500 mt-1">{profile.industry}</p>
                        )}
                      </div>
                      {selectedProfile === profile.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedProfile}
                  className="btn-primary"
                >
                  Use This Profile
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

