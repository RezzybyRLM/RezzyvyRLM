'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, X, Trash2, Loader2, Save, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const EXPERIENCE_LEVELS = ['Entry', 'Mid-Level', 'Senior', 'Executive']
const INDUSTRIES = [
  'Software/Technology',
  'Construction',
  'Healthcare',
  'Education',
  'Finance',
  'Marketing',
  'Sales',
  'Manufacturing',
  'Retail',
  'Hospitality',
  'Other'
]

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Project Management',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management',
  'Customer Service', 'Sales', 'Marketing', 'Data Analysis', 'Microsoft Office',
  'AutoCAD', 'Welding', 'Construction', 'Nursing', 'Teaching', 'Accounting'
]

interface Education {
  degree: string
  school: string
  year: string
  field_of_study: string
}

interface Certification {
  name: string
  issuer: string
  date_earned: string
  expiry_date?: string
}

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  const profileId = params.id as string
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableResumes, setAvailableResumes] = useState<Array<{ id: string; file_name: string }>>([])

  const [formData, setFormData] = useState({
    profile_name: '',
    job_title: '',
    job_role: '',
    industry: '',
    experience_level: '',
    years_of_experience: '',
    skills: [] as string[],
    summary: '',
    resume_id: '',
  })
  const [education, setEducation] = useState<Education[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [showEducationForm, setShowEducationForm] = useState(false)
  const [showCertificationForm, setShowCertificationForm] = useState(false)
  const [newEducation, setNewEducation] = useState<Education>({
    degree: '',
    school: '',
    year: '',
    field_of_study: ''
  })
  const [newCertification, setNewCertification] = useState<Certification>({
    name: '',
    issuer: '',
    date_earned: '',
    expiry_date: ''
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', profileId)
          .eq('user_id', user.id)
          .single()

        if (profileError || !profile) {
          setError('Profile not found')
          setLoading(false)
          return
        }

        // Set form data
        setFormData({
          profile_name: profile.profile_name,
          job_title: profile.job_title || '',
          job_role: profile.job_role || '',
          industry: profile.industry || '',
          experience_level: profile.experience_level || '',
          years_of_experience: profile.years_of_experience?.toString() || '',
          skills: profile.skills || [],
          summary: profile.summary || '',
          resume_id: '',
        })

        // Set education and certifications
        if (profile.education) {
          setEducation(Array.isArray(profile.education) ? profile.education : [])
        }
        if (profile.certifications) {
          setCertifications(Array.isArray(profile.certifications) ? profile.certifications : [])
        }

        // Fetch linked resume
        const { data: resumeLink } = await supabase
          .from('profile_resumes')
          .select('resume_id')
          .eq('profile_id', profileId)
          .eq('is_primary', true)
          .single()

        if (resumeLink) {
          setFormData(prev => ({ ...prev, resume_id: resumeLink.resume_id }))
        }

        // Fetch available resumes
        const { data: resumes } = await supabase
          .from('resumes')
          .select('id, file_name')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (resumes) {
          setAvailableResumes(resumes)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    if (profileId) {
      fetchProfile()
    }
  }, [profileId, router, supabase])

  const handleAddSkill = () => {
    const skill = skillInput.trim()
    if (skill && !formData.skills.includes(skill)) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skill]
      })
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    })
  }

  const handleAddEducation = () => {
    if (newEducation.degree && newEducation.school && newEducation.year) {
      setEducation([...education, { ...newEducation }])
      setNewEducation({ degree: '', school: '', year: '', field_of_study: '' })
      setShowEducationForm(false)
    }
  }

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const handleAddCertification = () => {
    if (newCertification.name && newCertification.issuer && newCertification.date_earned) {
      setCertifications([...certifications, { ...newCertification }])
      setNewCertification({ name: '', issuer: '', date_earned: '', expiry_date: '' })
      setShowCertificationForm(false)
    }
  }

  const handleRemoveCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!formData.profile_name.trim()) {
      setError('Profile name is required')
      return
    }
    if (!formData.job_title.trim()) {
      setError('Job title is required')
      return
    }
    if (!formData.industry) {
      setError('Industry is required')
      return
    }
    if (!formData.experience_level) {
      setError('Experience level is required')
      return
    }
    if (formData.skills.length < 3) {
      setError('Please add at least 3 skills')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
          education: education.length > 0 ? education : null,
          certifications: certifications.length > 0 ? certifications : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        return
      }

      router.push('/profiles')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSetDefault = async () => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/set-active`, {
        method: 'PATCH',
      })

      const data = await response.json()
      if (data.success) {
        router.push('/profiles')
      } else {
        alert(data.error || 'Failed to set as default')
      }
    } catch (error) {
      console.error('Error setting default:', error)
      alert('Failed to set as default')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        router.push('/profiles')
      } else {
        alert(data.error || 'Failed to delete profile')
      }
    } catch (error) {
      console.error('Error deleting profile:', error)
      alert('Failed to delete profile')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error && !formData.profile_name) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profiles">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/profiles">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600">Update your professional profile information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSetDefault}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Set as Default
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Reuse the same form structure as new profile page */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.profile_name}
                onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                placeholder="e.g., Software Engineer Profile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title/Role <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value, job_role: e.target.value })}
                placeholder="e.g., Software Engineer, Construction Worker"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EXPERIENCE_LEVELS.map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, experience_level: level })}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                      formData.experience_level === level
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Years of Experience
              </label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })}
                placeholder="e.g., 5"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Skills <span className="text-red-500">*</span> (at least 3)
            </h3>
            
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                placeholder="Type a skill and press Enter"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddSkill} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.filter(skill => 
                !formData.skills.includes(skill) && 
                skill.toLowerCase().includes(skillInput.toLowerCase())
              ).slice(0, 5).map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, skills: [...formData.skills, skill] })
                    setSkillInput('')
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  + {skill}
                </button>
              ))}
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-primary/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Education (Optional)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEducationForm(!showEducationForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Education
              </Button>
            </div>

            {showEducationForm && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <Input
                  placeholder="Degree (e.g., Bachelor's, Master's)"
                  value={newEducation.degree}
                  onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                />
                <Input
                  placeholder="School Name"
                  value={newEducation.school}
                  onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Year"
                    value={newEducation.year}
                    onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                  />
                  <Input
                    placeholder="Field of Study (optional)"
                    value={newEducation.field_of_study}
                    onChange={(e) => setNewEducation({ ...newEducation, field_of_study: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddEducation} size="sm">
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowEducationForm(false)
                      setNewEducation({ degree: '', school: '', year: '', field_of_study: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {education.map((edu, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{edu.degree} in {edu.field_of_study || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{edu.school} - {edu.year}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveEducation(index)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Certifications (Optional) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Certifications (Optional)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCertificationForm(!showCertificationForm)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Certification
              </Button>
            </div>

            {showCertificationForm && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <Input
                  placeholder="Certification Name"
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                />
                <Input
                  placeholder="Issuing Organization"
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    placeholder="Date Earned"
                    value={newCertification.date_earned}
                    onChange={(e) => setNewCertification({ ...newCertification, date_earned: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="Expiry Date (optional)"
                    value={newCertification.expiry_date}
                    onChange={(e) => setNewCertification({ ...newCertification, expiry_date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddCertification} size="sm">
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCertificationForm(false)
                      setNewCertification({ name: '', issuer: '', date_earned: '', expiry_date: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-gray-600">{cert.issuer} - {cert.date_earned}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCertification(index)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Professional Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Summary (Optional)
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of your experience and goals"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.summary.length}/500 characters
            </p>
          </div>

          {/* Resume Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link Resume
            </label>
            <select
              value={formData.resume_id}
              onChange={(e) => setFormData({ ...formData, resume_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a resume</option>
              {availableResumes.map(resume => (
                <option key={resume.id} value={resume.id}>{resume.file_name}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" asChild>
              <Link href="/profiles">Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={saving} size="lg">
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
  )
}

