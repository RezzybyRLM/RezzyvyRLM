'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Phone,
  Camera,
  Star,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

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

        const user = await resolveSessionUser(supabase)

        if (!mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
          return
        }

        if (!user) {
          // Middleware gates this route; a null here is transient. Don't
          // self-redirect to login (it loops). Just stop loading.
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
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
  }, [supabase])

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'N/A'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <Shield className="h-5 w-5 shrink-0 text-accent" />
          <p className="text-sm font-medium text-accent">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-success" />
          <p className="text-sm font-medium text-success">Profile updated successfully!</p>
        </div>
      )}

      {/* Identity hero */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.12] via-white to-white p-6 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative shrink-0">
            {avatarPreview ? (
              <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-primary/10 shadow-card">
                <User className="h-12 w-12 text-primary" />
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-2 text-white shadow-lg transition-colors hover:bg-primary-600">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
              </label>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Account
            </p>
            <h1 className="truncate text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">
              {profile.full_name || 'Your profile'}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/55">
              {profile.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{profile.email}</span>}
              {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.location}</span>}
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />Member since {memberSince}</span>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" className="shrink-0 border-border" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit profile
            </Button>
          )}
        </div>
        {isEditing && (
          <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-4">
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" className="border-border" disabled={uploadingAvatar} asChild>
                <span>
                  {uploadingAvatar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</> : <><Camera className="mr-2 h-4 w-4" />{avatarPreview ? 'Change picture' : 'Upload picture'}</>}
                </span>
              </Button>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
            </label>
            {avatarPreview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setAvatarPreview(null); setProfile({ ...profile, avatar_url: '' }) }}
                className="text-accent hover:bg-accent/10 hover:text-accent"
              >
                <X className="mr-1 h-4 w-4" /> Remove
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal information */}
        <section className="rounded-2xl border border-border bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
            <User className="h-5 w-5 text-primary" /> Personal information
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-text/70">Full name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text/40" />
                <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} placeholder="Enter your full name" disabled={!isEditing} className="!pl-11" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text/70">Email address</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text/40" />
                <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="Enter your email" disabled={!isEditing} className="!pl-11" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text/70">Location</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text/40" />
                <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} placeholder="City, State or Remote" disabled={!isEditing} className="!pl-11" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-text/70">Phone number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text/40" />
                <Input type="tel" value={profile.phone_number} onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })} placeholder="+1 (555) 123-4567" disabled={!isEditing} className="!pl-11" />
              </div>
              <p className="mt-1 text-xs text-text/45">For contact information only</p>
            </div>
          </div>
          {isEditing && (
            <div className="mt-5 flex justify-end gap-3 border-t border-border/70 pt-5">
              <Button variant="outline" className="border-border" onClick={() => { setIsEditing(false); setError(null) }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-primary text-white hover:bg-primary-600">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : <><Save className="mr-2 h-4 w-4" />Save changes</>}
              </Button>
            </div>
          )}
        </section>

        {/* Account status */}
        <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
            <Shield className="h-5 w-5 text-primary" /> Account status
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-background/70 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-text/60"><Clock className="h-4 w-4 text-text/45" />Member since</span>
              <span className="text-sm font-semibold text-text">{memberSince}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-background/70 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-text/60"><Star className="h-4 w-4 text-text/45" />Account type</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Free</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-background/70 p-3">
              <span className="inline-flex items-center gap-2 text-sm text-text/60"><Shield className="h-4 w-4 text-text/45" />Email verified</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', user?.email_confirmed_at ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent')}>
                {user?.email_confirmed_at ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Professional profiles */}
      <div>
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-text">
              <Briefcase className="h-5 w-5 text-primary" /> Professional profiles
            </h2>
            <p className="mt-0.5 text-sm text-text/55">Create and manage different profiles for different job roles.</p>
          </div>
          <Button asChild className="bg-primary text-white hover:bg-primary-600">
            <Link href="/profiles/new">
              <Plus className="mr-2 h-4 w-4" /> Create new profile
            </Link>
          </Button>
        </div>

        {userProfiles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-text">No profiles yet</h3>
            <p className="mx-auto mb-4 max-w-md text-sm text-text/55">
              Create your first professional profile to start applying to jobs tailored to your skills and experience.
            </p>
            <Button asChild className="bg-primary text-white hover:bg-primary-600">
              <Link href="/profiles/new">
                <Plus className="mr-2 h-4 w-4" /> Create your first profile
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {userProfiles.map((userProfile) => (
              <div
                key={userProfile.id}
                className={cn(
                  'flex flex-col rounded-2xl border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover',
                  userProfile.is_default ? 'border-primary/40 ring-1 ring-primary/15' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-text">{userProfile.profile_name}</h3>
                    <p className="mt-0.5 text-sm font-medium text-text/70">{userProfile.job_title}</p>
                    {userProfile.industry && <p className="text-xs text-text/50">{userProfile.industry}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {userProfile.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        <Star className="h-3 w-3" /> Default
                      </span>
                    )}
                    {userProfile.is_active && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">Active</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text/55">
                  {userProfile.experience_level && (
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{userProfile.experience_level}</span>
                  )}
                  {userProfile.years_of_experience !== null && <span>{userProfile.years_of_experience} yrs</span>}
                  {userProfile.education && Array.isArray(userProfile.education) && userProfile.education.length > 0 && (
                    <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{userProfile.education.length}</span>
                  )}
                  {userProfile.certifications && Array.isArray(userProfile.certifications) && userProfile.certifications.length > 0 && (
                    <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" />{userProfile.certifications.length}</span>
                  )}
                </div>

                {userProfile.skills && userProfile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {userProfile.skills.slice(0, 4).map((skill, index) => (
                      <span key={index} className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/65">{skill}</span>
                    ))}
                    {userProfile.skills.length > 4 && (
                      <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/50">+{userProfile.skills.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-4">
                  <Button variant="outline" size="sm" className="flex-1 border-border" asChild>
                    <Link href={`/profiles/${userProfile.id}`}>
                      <Edit className="mr-1 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  {!userProfile.is_default && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultProfile(userProfile.id)}
                      title="Set as default"
                      className="rounded-lg p-2 text-text/50 transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  {!userProfile.is_default && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(userProfile.id)}
                      disabled={deletingProfile === userProfile.id}
                      title="Delete profile"
                      className="rounded-lg p-2 text-text/50 transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      {deletingProfile === userProfile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
