'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Edit,
  Trash2,
  User,
  Briefcase,
  Award,
  GraduationCap,
  CheckCircle,
  Star,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

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

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    let timeoutId: NodeJS.Timeout | null = null
    try {
      setLoading(true)

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        console.error('Profiles fetch timeout')
        setLoading(false)
      }, 10000) // 10 second timeout

      const user = await resolveSessionUser(supabase)
      if (!user) {
        // Middleware gates this route; a null here is transient. Don't
        // self-redirect to login (it loops). Just stop loading.
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (timeoutId) clearTimeout(timeoutId)

      if (error) {
        console.error('Error fetching profiles:', error)
        setProfiles([])
      } else {
        setProfiles(data || [])
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
      setProfiles([])
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.1] via-white to-white p-6 shadow-card sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            <User className="h-3 w-3" /> Profiles
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">My profiles</h1>
          <p className="mt-1 text-sm text-text/55">Tailor a profile for each kind of role you apply to.</p>
        </div>
        <Button asChild className="bg-primary text-white hover:bg-primary-600">
          <Link href="/profiles/new">
            <Plus className="mr-2 h-4 w-4" />
            Create new profile
          </Link>
        </Button>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-text">No profiles yet</h3>
          <p className="mb-4 text-sm text-text/55">
            Create your first profile to start applying to jobs tailored to your skills and experience.
          </p>
          <Button asChild className="bg-primary text-white hover:bg-primary-600">
            <Link href="/profiles/new">
              <Plus className="mr-2 h-4 w-4" />
              Create your first profile
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: easeOut, delay: Math.min(i * 0.04, 0.3) }}
              className={cn(
                'flex flex-col rounded-2xl border bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover',
                profile.is_default ? 'border-primary/40 ring-1 ring-primary/15' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-text">{profile.profile_name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-text/70">{profile.job_title}</p>
                  {profile.industry && <p className="text-xs text-text/50">{profile.industry}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {profile.is_default && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                      <Star className="h-3 w-3" /> Default
                    </span>
                  )}
                  {profile.is_active && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">Active</span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text/55">
                {profile.experience_level && (
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{profile.experience_level}</span>
                )}
                {profile.years_of_experience !== null && <span>{profile.years_of_experience} yrs</span>}
                {profile.education && profile.education.length > 0 && (
                  <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{profile.education.length}</span>
                )}
                {profile.certifications && profile.certifications.length > 0 && (
                  <span className="inline-flex items-center gap-1"><Award className="h-3.5 w-3.5" />{profile.certifications.length}</span>
                )}
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/65">{skill}</span>
                  ))}
                  {profile.skills.length > 4 && (
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-text/50">+{profile.skills.length - 4}</span>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-4">
                <Button variant="outline" size="sm" className="flex-1 border-border" asChild>
                  <Link href={`/profiles/${profile.id}`}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                {!profile.is_default && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(profile.id)}
                    className="rounded-lg p-2 text-text/50 transition-colors hover:bg-primary/10 hover:text-primary"
                    aria-label="Set as default"
                    title="Set as default"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
                {!profile.is_default && (
                  <button
                    type="button"
                    onClick={() => handleDelete(profile.id)}
                    disabled={deleting === profile.id}
                    className="rounded-lg p-2 text-text/50 transition-colors hover:bg-accent/10 hover:text-accent"
                    aria-label="Delete profile"
                  >
                    {deleting === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
