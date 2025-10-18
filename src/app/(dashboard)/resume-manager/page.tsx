'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Trash2, Download, Eye, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Resume {
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
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      fetchResumes()
    }

    getUser()
  }, [router, supabase])

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
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document')
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

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file)

      if (uploadError) {
        setError(uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // Save resume record to database
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          file_type: file.type,
          is_active: true,
        })

      if (dbError) {
        setError(dbError.message)
        return
      }

      // Refresh resumes list
      await fetchResumes()
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Manager</h1>
          <p className="text-gray-600">Upload and manage your resumes for AI-powered job matching</p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Upload New Resume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                className="cursor-pointer flex flex-col items-center space-y-4"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-gray-600">Uploading resume...</p>
                  </>
                ) : (
                  <>
                    <Plus className="h-12 w-12 text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Upload your resume</p>
                      <p className="text-sm text-gray-600">PDF or Word document, max 5MB</p>
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
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-medium text-gray-900">{resume.file_name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{formatFileSize(resume.file_size)}</span>
                          <span>{new Date(resume.created_at).toLocaleDateString()}</span>
                          {resume.is_active && (
                            <Badge variant="default">Active</Badge>
                          )}
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
      </div>
    </div>
  )
}
