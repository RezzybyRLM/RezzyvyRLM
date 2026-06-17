'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  MapPin, 
  Save, 
  Loader2, 
  Plus, 
  Edit, 
  Briefcase, 
  Award, 
  GraduationCap, 
  CheckCircle, 
  Trash2,
  Shield,
  Clock,
  TrendingUp,
  Phone,
  Camera,
  X
} from 'lucide-react'
import Image from 'next/image'
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
    phone_number: '',
    avatar_url: '',
    preferences: {},
  })
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
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
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const getUser = async () => {
      try {
        setLoading(true)
        
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.error('Profile load timeout')
            setLoading(false)
          }
        }, 10000)

        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user

        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
          return
        }

        if (!user) {
          if (mounted) {
            if (timeoutId) clearTimeout(timeoutId)
            router.replace(`/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
            setLoading(false)
          }
          return
        }

        if (timeoutId) clearTimeout(timeoutId)
        setUser(user)

        const [profileResult, profilesResult] = await Promise.all([
          supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single(),
          supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
        ])

        if (!mounted) {
          setLoading(false)
          return
        }

        if (mounted) {
          if (profileResult.data) {
            setProfile({
              full_name: profileResult.data.full_name || '',
              email: profileResult.data.email || user.email || '',
              location: profileResult.data.location || '',
              phone_number: profileResult.data.phone_number || '',
              avatar_url: profileResult.data.avatar_url || '',
              preferences: profileResult.data.preferences || {},
            })
            if (profileResult.data.avatar_url) {
              setAvatarPreview(profileResult.data.avatar_url)
            }
          } else {
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

          if (profilesResult.data) {
            setUserProfiles(profilesResult.data)
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    getUser()

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [router, supabase])

  const handleSetDefaultProfile = async (profileId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_profiles')
        .update({ is_default: false })
        .eq('user_id', user.id)

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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB')
      return
    }

    setUploadingAvatar(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to upload avatar')
        return
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      // Try user-assets bucket first, fallback to public bucket
      let uploadData, uploadError, bucketName = 'user-assets'
      
      const uploadResult = await supabase.storage
        .from('user-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      uploadData = uploadResult.data
      uploadError = uploadResult.error

      // If user-assets doesn't exist, try avatars bucket
      if (uploadError && uploadError.message.includes('Bucket not found')) {
        bucketName = 'avatars'
        const fallbackResult = await supabase.storage
          .from('avatars')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        uploadData = fallbackResult.data
        uploadError = fallbackResult.error
      }

      if (uploadError) {
        setError(uploadError.message || 'Failed to upload avatar. Please try again.')
        return
      }

      if (!uploadData) {
        setError('Upload failed. Please try again.')
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path)

      // Update profile with avatar URL
      setProfile({ ...profile, avatar_url: publicUrl })
      setAvatarPreview(publicUrl)

      // Update in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        setError('Failed to save avatar URL')
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      setError(error.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
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
    setSuccess(false)

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          location: profile.location,
          phone_number: profile.phone_number,
          avatar_url: profile.avatar_url,
          preferences: profile.preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        setIsEditing(false)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and professional profiles</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-fadeIn">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-lg p-4 animate-fadeIn">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-sm font-medium text-green-800">Profile updated successfully!</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card className="card-professional">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  {!isEditing && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="hover:bg-primary hover:text-white transition-colors"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Profile Picture Section */}
                <div className="flex items-center gap-6 pb-6 border-b">
                  <div className="relative">
                    {avatarPreview ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                        <img
                          src={avatarPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-gray-200">
                        <User className="h-12 w-12 text-primary" />
                      </div>
                    )}
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Picture</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload a profile picture to help others recognize you
                    </p>
                    {isEditing && (
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingAvatar}
                            asChild
                          >
                            <span>
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Camera className="mr-2 h-4 w-4" />
                                  {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                                </>
                              )}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                            disabled={uploadingAvatar}
                          />
                        </label>
                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAvatarPreview(null)
                              setProfile({ ...profile, avatar_url: '' })
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                      <Input
                        type="text"
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="Enter your full name"
                        disabled={!isEditing}
                        className="!pl-12 !pr-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        placeholder="Enter your email"
                        disabled={!isEditing}
                        className="!pl-12 !pr-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                      <Input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        placeholder="City, State or Remote"
                        disabled={!isEditing}
                        className="!pl-12 !pr-4"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none z-10" />
                      <Input
                        type="tel"
                        value={profile.phone_number}
                        onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        disabled={!isEditing}
                        className="!pl-12 !pr-4"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">For contact information only</p>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false)
                        setError(null)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      className="btn-primary"
                    >
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info Card */}
            <Card className="card-professional">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Member since</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Account type</span>
                    </div>
                    <Badge className="bg-primary-100 text-primary-700 border-0">Free</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Email verified</span>
                    </div>
                    <Badge 
                      className={user?.email_confirmed_at ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}
                    >
                      {user?.email_confirmed_at ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Professional Profiles Section */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                Professional Profiles
              </h2>
              <p className="text-gray-600">Create and manage different profiles for different job roles</p>
            </div>
            <Button 
              asChild 
              className="btn-primary"
            >
              <Link href="/profiles/new">
                <Plus className="mr-2 h-4 w-4" />
                Create New Profile
              </Link>
            </Button>
          </div>

          {userProfiles.length === 0 ? (
            <Card className="card-professional">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-6">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No profiles yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create your first professional profile to start applying to jobs tailored to your skills and experience.
                </p>
                <Button 
                  asChild 
                  className="btn-primary"
                >
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
                <Card 
                  key={userProfile.id} 
                  className="card-professional hover:shadow-xl transition-shadow"
                >
                  <CardHeader className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                          {userProfile.profile_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {userProfile.is_default && (
                            <Badge className="bg-primary text-white border-0">
                              Default
                            </Badge>
                          )}
                          {userProfile.is_active && (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-base font-semibold text-gray-900 mb-1">{userProfile.job_title}</p>
                        {userProfile.industry && (
                          <p className="text-sm text-gray-600">{userProfile.industry}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {userProfile.experience_level && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="h-4 w-4" />
                            {userProfile.experience_level}
                          </span>
                        )}
                        {userProfile.years_of_experience !== null && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {userProfile.years_of_experience} years
                          </span>
                        )}
                      </div>

                      {userProfile.skills && userProfile.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {userProfile.skills.slice(0, 3).map((skill, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-primary-50 text-primary-700 border-primary-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {userProfile.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                                +{userProfile.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t">
                        {userProfile.education && Array.isArray(userProfile.education) && userProfile.education.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {userProfile.education.length} education
                          </span>
                        )}
                        {userProfile.certifications && Array.isArray(userProfile.certifications) && userProfile.certifications.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5" />
                            {userProfile.certifications.length} certifications
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 hover:bg-primary hover:text-white transition-colors"
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
                            className="hover:bg-green-50 hover:border-green-300 transition-colors"
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
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
