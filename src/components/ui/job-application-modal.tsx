'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X, Loader2, CheckCircle, AlertCircle, FileText, Mail, Phone } from 'lucide-react'
import { ProfileSelector } from './profile-selector'
import { createClient } from '@/lib/supabase/client'

interface JobApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id: string
    title: string
    company: {
      name: string
    } | null
    contact_email: string | null
    contact_phone: string | null
    application_instructions: string | null
  }
  onSuccess?: () => void
}

export function JobApplicationModal({ isOpen, onClose, job, onSuccess }: JobApplicationModalProps) {
  const [step, setStep] = useState<'profile' | 'details' | 'review'>('profile')
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Application form fields
  const [formData, setFormData] = useState({
    coverLetter: '',
    notes: '',
    availability: '',
    expectedSalary: '',
    additionalInfo: '',
  })

  const supabase = createClient()

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setStep('profile')
      setSelectedProfileId(null)
      setFormData({
        coverLetter: '',
        notes: '',
        availability: '',
        expectedSalary: '',
        additionalInfo: '',
      })
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId)
    setStep('details')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!selectedProfileId) {
      setError('Please select a profile')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('You must be logged in to apply')
      }

      // Prepare application data
      const applicationData = {
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company?.name || 'Unknown Company',
        applicationUrl: job.contact_email ? `mailto:${job.contact_email}` : '#',
        jobSource: 'premium' as const,
        profileId: selectedProfileId,
        notes: formData.notes || formData.coverLetter || null,
        metadata: {
          profile_id: selectedProfileId,
          cover_letter: formData.coverLetter,
          availability: formData.availability,
          expected_salary: formData.expectedSalary,
          additional_info: formData.additionalInfo,
        },
      }

      const response = await fetch('/api/jobs/mark-applied', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresUpgrade) {
          throw new Error(data.error || 'Upgrade required to submit applications')
        }
        throw new Error(data.error || 'Failed to submit application')
      }

      setSuccess(true)
      
      // If there's an email, open it
      if (job.contact_email) {
        setTimeout(() => {
          window.location.href = `mailto:${job.contact_email}?subject=Application for ${job.title}&body=${encodeURIComponent(
            formData.coverLetter || `I am interested in applying for the ${job.title} position.`
          )}`
        }, 1000)
      }

      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError(err.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Profile Selector Modal */}
      {step === 'profile' && (
        <ProfileSelector
          isOpen={isOpen && step === 'profile'}
          onClose={onClose}
          onSelect={handleProfileSelect}
          jobTitle={job.title}
          companyName={job.company?.name || undefined}
        />
      )}

      {/* Application Details Modal */}
      {step === 'details' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Apply for Position</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {job.title} at {job.company?.name || 'Company'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} type="button">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span>Application submitted successfully! Opening email client...</span>
                  </div>
                </div>
              )}

              {/* Cover Letter */}
              <div>
                <Label htmlFor="coverLetter" className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4" />
                  Cover Letter (Optional)
                </Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Write a brief cover letter explaining why you're a good fit for this position..."
                  value={formData.coverLetter}
                  onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be included in your application email
                </p>
              </div>

              {/* Availability */}
              <div>
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  placeholder="e.g., Available immediately, 2 weeks notice, etc."
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                />
              </div>

              {/* Expected Salary */}
              <div>
                <Label htmlFor="expectedSalary">Expected Salary (Optional)</Label>
                <Input
                  id="expectedSalary"
                  placeholder="e.g., $50,000 - $70,000"
                  value={formData.expectedSalary}
                  onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
                />
              </div>

              {/* Additional Information */}
              <div>
                <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any additional information you'd like to include..."
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <Label htmlFor="notes">Internal Notes (Private - for your reference only)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this application for your own reference..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Application Instructions */}
              {job.application_instructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Application Instructions</h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">{job.application_instructions}</p>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  {job.contact_email && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${job.contact_email}`} className="text-primary hover:underline">
                        {job.contact_email}
                      </a>
                    </div>
                  )}
                  {job.contact_phone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${job.contact_phone}`} className="text-primary hover:underline">
                        {job.contact_phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep('profile')} disabled={loading} type="button">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || success}
                  className="btn-primary"
                  type="button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submitted!
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

