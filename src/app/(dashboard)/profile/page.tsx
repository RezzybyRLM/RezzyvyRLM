'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, MapPin, Calendar, Save, Loader2, Plus, Edit, Briefcase, Award, GraduationCap, CheckCircle, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
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

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    location: '',
    preferences: {},
  })
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const fetchUserProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching profiles:', error)
      } else {
        setUserProfiles(data || [])
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || '',
          location: profileData.location || '',
          preferences: profileData.preferences || {},
        })
      } else {
        // Create profile if it doesn't exist
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          })

        if (error) {
          console.error('Error creating profile:', error)
        }
      }

      setLoading(false)
    }

    getUser()
    fetchUserProfiles()
  }, [router, supabase])

  const handleSetDefaultProfile = async (profileId: string) => {
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
        setError('Failed to set default profile')
        return
      }

      await fetchUserProfiles()
    } catch (error) {
      console.error('Error setting default profile:', error)
      setError('Failed to set default profile')
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return
    }

    setDeletingProfile(profileId)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if it's the default profile
      const profile = userProfiles.find(p => p.id === profileId)
      if (profile?.is_default) {
        setError('Cannot delete the default profile. Please set another profile as default first.')
        setDeletingProfile(null)
        return
      }

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id)

      if (error) {
        setError('Failed to delete profile')
        return
      }

      await fetchUserProfiles()
    } catch (error) {
      console.error('Error deleting profile:', error)
      setError('Failed to delete profile')
    } finally {
      setDeletingProfile(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          location: profile.location,
          preferences: profile.preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setError(error.message)
      } else {
        // Show success message
        setError(null)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto container-padding section-padding">
        <div className="mb-8">
          <h1 className="text-responsive-xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-responsive-md text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="input-professional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input-professional pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="input-professional pl-10"
                      placeholder="City, State or Remote"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={handleSignOut} className="btn-secondary">
                    Sign Out
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <div className="space-y-6">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account type</span>
                    <Badge variant="outline">Free</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email verified</span>
                    <Badge variant={user?.email_confirmed_at ? 'default' : 'destructive'}>
                      {user?.email_confirmed_at ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start btn-secondary" asChild>
                  <Link href="/interview-pro">
                    <Calendar className="mr-2 h-4 w-4" />
                    View Interview Sessions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start btn-secondary" asChild>
                  <Link href="/job-alerts">
                    <MapPin className="mr-2 h-4 w-4" />
                    Manage Job Alerts
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start btn-secondary" asChild>
                  <Link href="/resume-manager">
                    <User className="mr-2 h-4 w-4" />
                    Resume Manager
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Multiple Profiles Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-responsive-xl font-bold text-gray-900">My Professional Profiles</h2>
              <p className="text-responsive-md text-gray-600">Create and manage different profiles for different job roles</p>
            </div>
            <Button asChild className="btn-primary">
              <Link href="/profiles/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Profile
              </Link>
            </Button>
          </div>

          {userProfiles.length === 0 ? (
            <Card className="card-professional">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first professional profile to start applying to jobs tailored to your skills and experience.
                </p>
                <Button asChild className="btn-primary">
                  <Link href="/profiles/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProfiles.map((userProfile) => (
                <Card key={userProfile.id} className="card-professional hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{userProfile.profile_name}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {userProfile.is_default && (
                            <Badge className="bg-primary text-white">Default</Badge>
                          )}
                          {userProfile.is_active && (
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
                        <p className="text-sm font-medium text-gray-900">{userProfile.job_title}</p>
                        {userProfile.industry && (
                          <p className="text-xs text-gray-600">{userProfile.industry}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        {userProfile.experience_level && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {userProfile.experience_level}
                          </span>
                        )}
                        {userProfile.years_of_experience !== null && (
                          <span>{userProfile.years_of_experience} years</span>
                        )}
                      </div>

                      {userProfile.skills && userProfile.skills.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {userProfile.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {userProfile.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{userProfile.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {userProfile.education && Array.isArray(userProfile.education) && userProfile.education.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {userProfile.education.length} education
                          </span>
                        )}
                        {userProfile.certifications && Array.isArray(userProfile.certifications) && userProfile.certifications.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {userProfile.certifications.length} certifications
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
                          <Link href={`/profiles/${userProfile.id}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        {!userProfile.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultProfile(userProfile.id)}
                            title="Set as default"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {!userProfile.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProfile(userProfile.id)}
                            disabled={deletingProfile === userProfile.id}
                            className="text-red-600 hover:text-red-700"
                            title="Delete profile"
                          >
                            {deletingProfile === userProfile.id ? (
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
      </div>
    </div>
  )
}
