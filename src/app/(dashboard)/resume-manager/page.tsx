'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { resolveSessionUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/dashboard/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'
import { Upload, FileText, Trash2, Download, Eye, Loader2, Mail, Sparkles } from 'lucide-react'
import { canPerformAction } from '@/lib/plans/usage-tracking'
import { AIResumeBuilder } from '@/components/ui/ai-resume-builder'
import { AICoverLetterBuilder } from '@/components/ui/ai-cover-letter-builder'

interface Resume {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  is_active: boolean
  created_at: string
}

interface CoverLetter {
  id: string
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  is_active: boolean
  created_at: string
}

export default function ResumeManagerPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(true) // Track if data is still loading
  const [uploading, setUploading] = useState(false)
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [currentPlan, setCurrentPlan] = useState('Free')
  const [showAIResumeBuilder, setShowAIResumeBuilder] = useState(false)
  const [showAICoverLetterBuilder, setShowAICoverLetterBuilder] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Safety timeout - only as last resort, should never hit this
        const safetyTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('Resume manager safety timeout - showing page anyway')
            setLoading(false)
          }
        }, 3000) // 3 second safety net

        // Resolve the session (retries briefly to ride out a transient null).
        const user = await resolveSessionUser(supabase)

        if (!mounted || !user) {
          // Middleware gates this route; a null here is transient. Don't
          // self-redirect to login (it loops). Just stop loading.
          clearTimeout(safetyTimeout)
          setLoading(false)
          return
        }

        // CRITICAL: Show page immediately after auth - don't wait for data!
        clearTimeout(safetyTimeout)
        setLoading(false) // Page can render now
        setDataLoading(true) // But data is still loading

        // Now load all data in background (non-blocking)
        ;(async () => {
          try {
            // Fetch resumes and cover letters in parallel
            const [resumesResult, coverLettersResult] = await Promise.all([
              supabase
                .from('resumes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false }),
              supabase
                .from('cover_letters')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            ])

            if (!mounted) return

            // Update state with fetched data
            if (resumesResult.data) {
              setResumes(resumesResult.data)
            }
            if (resumesResult.error) {
              console.warn('Error fetching resumes:', resumesResult.error)
              setError(resumesResult.error.message)
            }

            if (coverLettersResult.data) {
              setCoverLetters(coverLettersResult.data)
            }
            if (coverLettersResult.error) {
              console.warn('Error fetching cover letters:', coverLettersResult.error)
            }

            // Mark data loading as complete
            setDataLoading(false)

            // Fetch user plan in background (optional, non-critical)
            try {
              const { data: planData, error: planError } = await (supabase as any)
                .from('user_plans')
                .select('plan_type')
                .eq('user_id', user.id)
                .maybeSingle()
              
              if (mounted && planData && !planError) {
                setCurrentPlan(planData.plan_type || 'Free')
              }
            } catch (planErr) {
              // Non-critical, just log it
              console.warn('Failed to fetch user plan:', planErr)
            }
          } catch (dataErr) {
            console.error('Error loading resume data:', dataErr)
            if (mounted) {
              setError('Failed to load some data. Please refresh.')
              setDataLoading(false) // Stop showing loading even on error
            }
          }
        })()
      } catch (err) {
        if (mounted) {
          setError('Failed to authenticate')
          setLoading(false)
        }
        console.error('Error in resume manager:', err)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [supabase])

  const fetchResumes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        setResumes(data || [])
      }
    } catch (err) {
      setError('Failed to fetch resumes')
    }
  }

  const fetchCoverLetters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching cover letters:', error)
      } else {
        setCoverLetters(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch cover letters:', err)
    }
  }

  const fetchAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    // Fetch both in parallel
    await Promise.all([fetchResumes(), fetchCoverLetters()])
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type - support more document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ]
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && (!fileExt || !allowedExtensions.includes(`.${fileExt}`))) {
      setError('Please upload a PDF, Word document (.doc, .docx), text file (.txt), RTF (.rtf), or OpenDocument (.odt)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user can upload resume
      const { allowed, reason } = await canPerformAction(user.id, 'resumeUpload')
      
      if (!allowed) {
        setUpgradeMessage(reason || '')
        setShowUpgradePrompt(true)
        setUploading(false)
        return
      }

      // Upload file via API route
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to upload resume')
        return
      }

      // Refresh resumes list and clear file input
      await fetchResumes()
      if (event.target) {
        event.target.value = '' // Clear file input
      }
    } catch (err) {
      setError('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return

    try {
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId)

      if (error) {
        setError(error.message)
      } else {
        await fetchResumes()
      }
    } catch (err) {
      setError('Failed to delete resume')
    }
  }

  const handleSetActive = async (resumeId: string) => {
    try {
      // First, set all resumes to inactive
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('resumes')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Then set the selected one as active
      const { error } = await supabase
        .from('resumes')
        .update({ is_active: true })
        .eq('id', resumeId)

      if (error) {
        setError(error.message)
      } else {
        await fetchResumes()
      }
    } catch (err) {
      setError('Failed to update resume status')
    }
  }

  const handleCoverLetterUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type - support more document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ]
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && (!fileExt || !allowedExtensions.includes(`.${fileExt}`))) {
      setError('Please upload a PDF, Word document (.doc, .docx), text file (.txt), RTF (.rtf), or OpenDocument (.odt)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploadingCoverLetter(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/cover-letters/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to upload cover letter')
        return
      }

      // Refresh cover letters list
      await fetchCoverLetters()
    } catch (err) {
      setError('Failed to upload cover letter')
    } finally {
      setUploadingCoverLetter(false)
    }
  }

  const handleDeleteCoverLetter = async (coverLetterId: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch(`/api/cover-letters/${coverLetterId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete cover letter')
        return
      }

      await fetchCoverLetters()
    } catch (err) {
      setError('Failed to delete cover letter')
    }
  }

  const handleSetActiveCoverLetter = async (coverLetterId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // First, set all cover letters to inactive
      await supabase
        .from('cover_letters')
        .update({ is_active: false })
        .eq('user_id', user.id)

      // Then set the selected one as active
      const { error } = await supabase
        .from('cover_letters')
        .update({ is_active: true })
        .eq('id', coverLetterId)

      if (error) {
        setError(error.message)
      } else {
        await fetchCoverLetters()
      }
    } catch (err) {
      setError('Failed to update cover letter status')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading resumes...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Documents"
          title="Resume & cover letter manager"
          subtitle="Upload and manage your resumes and cover letters for job applications."
          className="mb-8"
        />

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload New Resume
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowAIResumeBuilder(true)}
                className="flex items-center gap-2"
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                AI Builder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.05]">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
                disabled={uploading}
              />
              <label
                htmlFor="resume-upload"
                className="flex cursor-pointer flex-col items-center gap-3"
              >
                {uploading ? (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </span>
                    <p className="text-sm text-text/60">Uploading resume…</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-6 w-6 stroke-[1.5]" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-text">
                        Drag &amp; drop or <span className="text-primary">browse</span>
                      </p>
                      <p className="mt-1 text-sm text-text/55">Supported formats: PDF, DOCX (max 5MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Resumes List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Your Resumes ({resumes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resumes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resumes uploaded yet</p>
                <p className="text-sm text-gray-500">Upload your first resume to get started with AI-powered job matching</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5 stroke-[1.5]" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-text">{resume.file_name}</h3>
                          {resume.is_active && (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-text/55">
                          <span>{formatFileSize(resume.file_size)}</span>
                          <span>{new Date(resume.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(resume.file_url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(resume.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!resume.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(resume.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cover Letters Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Upload New Cover Letter
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowAICoverLetterBuilder(true)}
                className="flex items-center gap-2"
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                AI Builder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/[0.03] p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/[0.05]">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCoverLetterUpload}
                className="hidden"
                id="cover-letter-upload"
                disabled={uploadingCoverLetter}
              />
              <label
                htmlFor="cover-letter-upload"
                className="flex cursor-pointer flex-col items-center gap-3"
              >
                {uploadingCoverLetter ? (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </span>
                    <p className="text-sm text-text/60">Uploading cover letter…</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-6 w-6 stroke-[1.5]" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-text">
                        Drag &amp; drop or <span className="text-primary">browse</span>
                      </p>
                      <p className="mt-1 text-sm text-text/55">Supported formats: PDF, DOCX (max 5MB)</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Cover Letters List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Your Cover Letters ({coverLetters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coverLetters.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No cover letters uploaded yet</p>
                <p className="text-sm text-gray-500">Upload your first cover letter to use in job applications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {coverLetters.map((coverLetter) => (
                  <div
                    key={coverLetter.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Mail className="h-5 w-5 stroke-[1.5]" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-text">{coverLetter.file_name}</h3>
                          {coverLetter.is_active && (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-text/55">
                          <span>{formatFileSize(coverLetter.file_size)}</span>
                          <span>{new Date(coverLetter.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(coverLetter.file_url, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(coverLetter.file_url, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {!coverLetter.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActiveCoverLetter(coverLetter.id)}
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCoverLetter(coverLetter.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title="Upgrade Your Plan"
        message={upgradeMessage}
        feature="Resume Uploads"
        currentPlan={currentPlan}
      />

      {/* AI Resume Builder Modal */}
      {showAIResumeBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <AIResumeBuilder
              jobDescription=""
              onClose={() => setShowAIResumeBuilder(false)}
            />
          </div>
        </div>
      )}

      {/* AI Cover Letter Builder Modal */}
      {showAICoverLetterBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <AICoverLetterBuilder
              onClose={() => setShowAICoverLetterBuilder(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
