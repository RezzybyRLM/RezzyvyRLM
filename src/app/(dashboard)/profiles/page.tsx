'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Briefcase,
  Award,
  GraduationCap,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  profile_name: string
  job_title: string
  job_role: string | null
  industry: string | null
  experience_level: string | null
  years_of_experience: number | null
  skills: string[] | null
  summary: string | null
  education: any[] | null
  certifications: any[] | null
  is_active: boolean
  is_default: boolean
  created_at: string
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching profiles:', error)
      } else {
        setProfiles(data || [])
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (profileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Set all profiles to not default
      await supabase
        .from('user_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Set selected profile as default
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_default: true })
        .eq('id', profileId)
        .eq('user_id', user.id)

      if (error) {
        alert('Failed to set default profile')
        return
      }

      await fetchProfiles()
    } catch (error) {
      console.error('Error setting default profile:', error)
      alert('Failed to set default profile')
    }
  }

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return
    }

    setDeleting(profileId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if it's the default profile
      const profile = profiles.find(p => p.id === profileId)
      if (profile?.is_default) {
        alert('Cannot delete the default profile. Please set another profile as default first.')
        setDeleting(null)
        return
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id)

      if (error) {
        alert('Failed to delete profile')
        return
      }

      await fetchProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profiles</h1>
          <p className="text-gray-600">Manage your professional profiles for different job roles</p>
        </div>
        <Button asChild>
          <Link href="/profiles/new">
            <Plus className="h-4 w-4 mr-2" />
            Create New Profile
          </Link>
        </Button>
      </div>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first profile to start applying to jobs tailored to your skills and experience.
            </p>
            <Button asChild>
              <Link href="/profiles/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{profile.profile_name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {profile.is_default && (
                        <Badge className="bg-primary text-white">Default</Badge>
                      )}
                      {profile.is_active && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{profile.job_title}</p>
                    {profile.industry && (
                      <p className="text-xs text-gray-600">{profile.industry}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    {profile.experience_level && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {profile.experience_level}
                      </span>
                    )}
                    {profile.years_of_experience !== null && (
                      <span>{profile.years_of_experience} years</span>
                    )}
                  </div>

                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {profile.skills.slice(0, 3).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {profile.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{profile.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {profile.education && profile.education.length > 0 && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {profile.education.length} education
                      </span>
                    )}
                    {profile.certifications && profile.certifications.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        {profile.certifications.length} certifications
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/profiles/${profile.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    {!profile.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(profile.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {!profile.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(profile.id)}
                        disabled={deleting === profile.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deleting === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

