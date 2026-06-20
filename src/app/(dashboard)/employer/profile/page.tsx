'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Globe,
  Upload,
  Save,
  Edit,
  Eye,
  Loader2,
  X,
  CheckCircle2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const easeOut = [0.22, 1, 0.36, 1] as const

const labelClass = 'mb-1 block text-sm font-medium text-text/70'
const fieldClass =
  'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-text/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:bg-background/60 disabled:text-text/70'

interface CompanyProfile {
  id: string
  name: string
  description: string
  website: string
  logoUrl: string
  industry: string
  size: string
  foundedYear: string
  location: string
  contactEmail: string
  contactPhone: string
  socialLinks: {
    linkedin?: string
    twitter?: string
    facebook?: string
  }
  benefits: string[]
  culture: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>({
    id: '',
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    industry: '',
    size: '',
    foundedYear: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    socialLinks: {},
    benefits: [],
    culture: '',
    isVerified: false,
    createdAt: '',
    updatedAt: '',
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get company - for MVP, get first company or create one
        const { data: companies } = await supabase
          .from('companies')
          .select('*')
          .limit(1)

        if (companies && companies.length > 0) {
          const company = companies[0]
          setProfile({
            id: company.id,
            name: company.name,
            description: company.description || '',
            website: company.website || '',
            logoUrl: company.logo_url || '',
            industry: company.industry || '',
            size: company.size || '',
            foundedYear: '',
            location: company.location || '',
            contactEmail: '',
            contactPhone: '',
            socialLinks: {},
            benefits: [],
            culture: '',
            isVerified: false,
            createdAt: company.created_at || '',
            updatedAt: company.updated_at || '',
          })
        }
      } catch (error) {
        console.error('Error fetching company profile:', error)
        setError('Failed to load company profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [supabase])

  const handleInputChange = (field: keyof CompanyProfile, value: string | string[]) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialLinkChange = (platform: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save profile')
        return
      }

      if (!profile.name.trim()) {
        setError('Company name is required')
        return
      }

      // Update or create company
      if (profile.id) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            name: profile.name,
            description: profile.description,
            website: profile.website,
            logo_url: profile.logoUrl,
            industry: profile.industry,
            size: profile.size,
            location: profile.location,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (updateError) {
          setError(updateError.message)
          return
        }
      } else {
        // Create new company
        const { data: newCompany, error: createError } = await supabase
          .from('companies')
          .insert({
            name: profile.name,
            description: profile.description,
            website: profile.website,
            logo_url: profile.logoUrl,
            industry: profile.industry,
            size: profile.size,
            location: profile.location,
          })
          .select()
          .single()

        if (createError) {
          setError(createError.message)
          return
        }

        if (newCompany) {
          setProfile({ ...profile, id: newCompany.id })
        }
      }

      setIsEditing(false)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setError(error.message || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo size must be less than 2MB')
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to upload logo')
        return
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `logos/${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        setError(uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName)

      // Update profile with logo URL
      setProfile({ ...profile, logoUrl: publicUrl })

      // If company exists, update logo in database
      if (profile.id) {
        await supabase
          .from('companies')
          .update({ logo_url: publicUrl })
          .eq('id', profile.id)
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      setError(error.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  // Real profile completeness — fraction of key fields actually filled in.
  const completeness = useMemo(() => {
    const fields = [
      profile.name,
      profile.description,
      profile.website,
      profile.industry,
      profile.size,
      profile.location,
      profile.logoUrl,
    ]
    const filled = fields.filter(f => f && f.toString().trim().length > 0).length
    return { filled, total: fields.length, pct: Math.round((filled / fields.length) * 100) }
  }, [profile])

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
      {error && (
        <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm font-medium text-accent">{error}</p>
        </div>
      )}

      {/* Command header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> Hiring command center
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-text md:text-[1.75rem]">Company profile</h1>
          <p className="mt-1 text-sm text-text/55">Your company brand — what candidates see on every listing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Hide preview' : 'Preview'}
          </Button>
          {!isEditing ? (
            <Button className="bg-primary text-white hover:bg-primary-600" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-border" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button className="bg-primary text-white hover:bg-primary-600" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text">Basic information</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Company name *</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <select
                    value={profile.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    disabled={!isEditing}
                    className={fieldClass}
                  >
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Education">Education</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Company size</label>
                  <select
                    value={profile.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    disabled={!isEditing}
                    className={fieldClass}
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <Input
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Company description *</label>
                <textarea
                  value={profile.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Describe your company, mission, and what makes it unique…"
                  className={cn(fieldClass, 'h-32 resize-none')}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text">Online presence</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Website</label>
                <Input
                  value={profile.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://company.com"
                />
              </div>
              <div>
                <label className={labelClass}>LinkedIn</label>
                <Input
                  value={profile.socialLinks.linkedin || ''}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text">Culture</h2>
            <div className="mt-4">
              <label className={labelClass}>Company culture</label>
              <textarea
                value={profile.culture}
                onChange={(e) => handleInputChange('culture', e.target.value)}
                disabled={!isEditing}
                placeholder="Describe your company culture, values, and work environment…"
                className={cn(fieldClass, 'h-32 resize-none')}
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Logo */}
          <section className="rounded-2xl border border-border bg-white p-6 text-center shadow-card">
            <h2 className="text-left text-lg font-semibold text-text">Company logo</h2>
            <div className="mx-auto mt-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
              {profile.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt="Company logo" className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-text/30" />
              )}
            </div>
            {isEditing && (
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploadingLogo}
                />
                <Button variant="outline" className="border-border" asChild disabled={uploadingLogo}>
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    {uploadingLogo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploadingLogo ? 'Uploading…' : 'Upload logo'}
                  </label>
                </Button>
                {profile.logoUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProfile({ ...profile, logoUrl: '' })}
                    className="mt-2 text-accent hover:bg-accent/10 hover:text-accent"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-text/45">Recommended: 200×200px, PNG or JPG</p>
          </section>

          {/* Real completeness meter (replaces fabricated stats) */}
          <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">Profile completeness</h2>
              <span className="text-lg font-bold tabular-nums text-secondary">{completeness.pct}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary/10">
              <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${completeness.pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-text/55">
              {completeness.filled} of {completeness.total} key fields complete. Complete profiles earn more candidate trust.
            </p>
            {profile.isVerified && (
              <Badge className="mt-3 bg-success/10 text-success">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
              </Badge>
            )}
          </section>

          {/* Live preview */}
          {previewMode && (
            <section className="rounded-2xl border border-border bg-white p-6 shadow-card">
              <h2 className="text-lg font-semibold text-text">Candidate-facing preview</h2>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text">{profile.name || 'Company name'}</h3>
                  {profile.isVerified && <Badge className="bg-success/10 text-success">Verified</Badge>}
                </div>
                <p className="text-sm text-text/55">
                  {[profile.industry, profile.size && `${profile.size} employees`].filter(Boolean).join(' • ') || 'Industry • size'}
                </p>
                {profile.location && <p className="text-sm text-text/55">{profile.location}</p>}
                {profile.description && <p className="line-clamp-3 text-sm text-text/70">{profile.description}</p>}
                {profile.website && (
                  <div className="flex items-center gap-2 text-sm text-text/50">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{profile.website}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  )
}
