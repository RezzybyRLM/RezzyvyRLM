'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Calendar,
  Upload,
  Save,
  Edit,
  Eye,
  Link as LinkIcon,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react'

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
    id: '1',
    name: 'TechCorp Inc.',
    description: 'We are a leading technology company focused on innovation and growth.',
    website: 'https://techcorp.com',
    logoUrl: '',
    industry: 'Technology',
    size: '51-200',
    foundedYear: '2015',
    location: 'San Francisco, CA',
    contactEmail: 'careers@techcorp.com',
    contactPhone: '+1 (555) 123-4567',
    socialLinks: {
      linkedin: 'https://linkedin.com/company/techcorp',
      twitter: 'https://twitter.com/techcorp',
    },
    benefits: ['Health Insurance', '401k Matching', 'Remote Work', 'Professional Development'],
    culture: 'We foster a collaborative and inclusive environment where innovation thrives.',
    isVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

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
    try {
      // TODO: Implement save functionality
      console.log('Saving profile:', profile)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Implement logo upload to Supabase Storage
      console.log('Uploading logo:', file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
          <p className="text-gray-600">Manage your company information and branding</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <Input
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={profile.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Size
                  </label>
                  <select
                    value={profile.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Founded Year
                  </label>
                  <Input
                    type="number"
                    value={profile.foundedYear}
                    onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                    disabled={!isEditing}
                    placeholder="2020"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Description *
                </label>
                <textarea
                  value={profile.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Describe your company, mission, and what makes it unique..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 h-32 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <Input
                    value={profile.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    value={profile.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    value={profile.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    disabled={!isEditing}
                    placeholder="careers@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <Input
                    value={profile.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <Input
                    value={profile.socialLinks.linkedin || ''}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <Input
                    value={profile.socialLinks.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://twitter.com/yourcompany"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Culture & Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>Company Culture & Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Culture
                </label>
                <textarea
                  value={profile.culture}
                  onChange={(e) => handleInputChange('culture', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Describe your company culture, values, and work environment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50 h-32 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benefits & Perks
                </label>
                <div className="space-y-2">
                  {profile.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={benefit}
                        onChange={(e) => {
                          const newBenefits = [...profile.benefits]
                          newBenefits[index] = e.target.value
                          handleInputChange('benefits', newBenefits)
                        }}
                        disabled={!isEditing}
                        placeholder="Enter benefit"
                      />
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newBenefits = profile.benefits.filter((_, i) => i !== index)
                            handleInputChange('benefits', newBenefits)
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newBenefits = [...profile.benefits, '']
                        handleInputChange('benefits', newBenefits)
                      }}
                    >
                      Add Benefit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt="Company logo" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <Building2 className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button variant="outline" asChild>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Logo
                      </label>
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 200x200px, PNG or JPG
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Preview */}
          {previewMode && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                    {profile.isVerified && (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{profile.industry} • {profile.size} employees</p>
                  <p className="text-sm text-gray-600">{profile.location}</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{profile.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Globe className="h-3 w-3" />
                    <span>{profile.website}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile Views</span>
                <span className="font-medium">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jobs Posted</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Applications Received</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile Completion</span>
                <span className="font-medium text-green-600">95%</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Complete your profile</p>
                <p>Companies with complete profiles get 3x more applications.</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Add your logo</p>
                <p>Branded profiles stand out and build trust with candidates.</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Describe your culture</p>
                <p>Help candidates understand what it's like to work at your company.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
