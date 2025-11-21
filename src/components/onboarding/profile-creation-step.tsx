'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

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

interface ProfileCreationStepProps {
  onContinue: (profileData: any) => void
  onBack: () => void
  availableResumes: Array<{ id: string; file_name: string }>
  isFirstProfile?: boolean
}

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

export function ProfileCreationStep({
  onContinue,
  onBack,
  availableResumes,
  isFirstProfile = true
}: ProfileCreationStepProps) {
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
  const [errors, setErrors] = useState<Record<string, string>>({})
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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.profile_name.trim()) {
      newErrors.profile_name = 'Profile name is required'
    }
    if (!formData.job_title.trim()) {
      newErrors.job_title = 'Job title is required'
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required'
    }
    if (!formData.experience_level) {
      newErrors.experience_level = 'Experience level is required'
    }
    if (formData.skills.length < 3) {
      newErrors.skills = 'Please add at least 3 skills'
    }
    if (!formData.resume_id) {
      newErrors.resume_id = 'Please select a resume'
    }
    if (formData.summary && formData.summary.length < 50) {
      newErrors.summary = 'Summary must be at least 50 characters'
    }
    if (formData.summary && formData.summary.length > 500) {
      newErrors.summary = 'Summary must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

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

  const handleSubmit = () => {
    if (!validate()) {
      return
    }

    onContinue({
      ...formData,
      years_of_experience: formData.years_of_experience ? parseInt(formData.years_of_experience) : null,
      education: education.length > 0 ? education : null,
      certifications: certifications.length > 0 ? certifications : null,
      is_default: isFirstProfile,
      is_active: true
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Professional Profile</h2>
        <p className="text-gray-600">This helps us match you with the right jobs</p>
      </div>

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
            className={errors.profile_name ? 'border-red-500' : ''}
          />
          {errors.profile_name && (
            <p className="text-xs text-red-500 mt-1">{errors.profile_name}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Give this profile a name to identify it</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Title/Role <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            placeholder="e.g., Software Engineer, Construction Worker"
            className={errors.job_title ? 'border-red-500' : ''}
          />
          {errors.job_title && (
            <p className="text-xs text-red-500 mt-1">{errors.job_title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md ${errors.industry ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select an industry</option>
            {INDUSTRIES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-xs text-red-500 mt-1">{errors.industry}</p>
          )}
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
          {errors.experience_level && (
            <p className="text-xs text-red-500 mt-1">{errors.experience_level}</p>
          )}
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

        {/* Suggested skills */}
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

        {/* Selected skills */}
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
        {errors.skills && (
          <p className="text-xs text-red-500">{errors.skills}</p>
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
          className={`w-full px-3 py-2 border rounded-md ${errors.summary ? 'border-red-500' : 'border-gray-300'}`}
          maxLength={500}
        />
        <div className="flex justify-between mt-1">
          {errors.summary && (
            <p className="text-xs text-red-500">{errors.summary}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.summary.length}/500 characters
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-1">50-500 characters recommended</p>
      </div>

      {/* Resume Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Link Resume <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.resume_id}
          onChange={(e) => setFormData({ ...formData, resume_id: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md ${errors.resume_id ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select a resume</option>
          {availableResumes.map(resume => (
            <option key={resume.id} value={resume.id}>{resume.file_name}</option>
          ))}
        </select>
        {errors.resume_id && (
          <p className="text-xs text-red-500 mt-1">{errors.resume_id}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">Which resume best matches this profile?</p>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleSubmit} size="lg">
          Save & Continue
        </Button>
      </div>
    </div>
  )
}

