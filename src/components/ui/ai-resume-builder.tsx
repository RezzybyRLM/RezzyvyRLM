'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  Loader2, 
  Download, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Wand2,
  Copy
} from 'lucide-react'
import { generateResumeSuggestions } from '@/lib/ai/helpers'

interface AIResumeBuilderProps {
  jobDescription?: string
  onClose?: () => void
}

export function AIResumeBuilder({ jobDescription = '', onClose }: AIResumeBuilderProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    achievements: '',
  })
  const [generatedResume, setGeneratedResume] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    if (!formData.name || !formData.summary) {
      setError('Please fill in at least your name and professional summary')
      return
    }

    setLoading(true)
    setError(null)
    setStep('generating')

    try {
      // Generate suggestions first
      const suggestionsResult = await generateResumeSuggestions(
        jobDescription || 'General job application',
        formData.summary
      )
      
      setSuggestions(suggestionsResult.text)
      setUsedFallback(suggestionsResult.usedFallback)

      // Generate resume content
      const resumeContent = generateResumeContent(formData, suggestionsResult.text)
      setGeneratedResume(resumeContent)
      setStep('result')
    } catch (err: any) {
      setError(err.message || 'Failed to generate resume')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const generateResumeContent = (data: typeof formData, suggestions: string): string => {
    return `RESUME

${data.name.toUpperCase()}
${data.email} | ${data.phone} | ${data.location}

PROFESSIONAL SUMMARY
${data.summary}

${data.experience ? `EXPERIENCE\n${data.experience}` : ''}

${data.education ? `EDUCATION\n${data.education}` : ''}

${data.skills ? `SKILLS\n${data.skills}` : ''}

${data.achievements ? `KEY ACHIEVEMENTS\n${data.achievements}` : ''}

---
Generated with AI assistance. Review and customize before submitting.`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResume)
    alert('Resume copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([generatedResume], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.name.replace(/\s+/g, '_')}_Resume.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (step === 'generating') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-12 text-center">
          <div className="animate-pulse mb-6">
            <Sparkles className="h-16 w-16 text-primary mx-auto animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Resume</h3>
          <p className="text-gray-600 mb-4">Our AI is crafting a professional resume tailored to your needs...</p>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          {usedFallback && (
            <p className="text-sm text-amber-600 mt-4">
              Using template-based generation (AI service temporarily unavailable)
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (step === 'result') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your AI-Generated Resume
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} type="button">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          {usedFallback && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>Generated using template (AI service unavailable)</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {suggestions && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-semibold text-primary-900 mb-2 flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                AI Suggestions
              </h4>
              <pre className="text-sm text-primary-800 whitespace-pre-wrap font-sans">{suggestions}</pre>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Generated Resume</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} type="button">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} type="button">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-4 rounded border max-h-96 overflow-y-auto">
              {generatedResume}
            </pre>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep('input')} variant="outline" type="button">
              Edit & Regenerate
            </Button>
            <Button onClick={handleDownload} className="flex-1" type="button">
              <Download className="mr-2 h-4 w-4" />
              Download Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Resume Builder
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} type="button">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Fill in your information and our AI will generate a professional resume for you
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="City, State"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="summary">Professional Summary *</Label>
          <Textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => handleInputChange('summary', e.target.value)}
            placeholder="Brief professional summary highlighting your experience and key skills..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="experience">Work Experience</Label>
          <Textarea
            id="experience"
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            placeholder="List your work experience with dates, company names, and key responsibilities..."
            rows={6}
          />
        </div>

        <div>
          <Label htmlFor="education">Education</Label>
          <Textarea
            id="education"
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
            placeholder="List your educational background..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="skills">Skills</Label>
          <Textarea
            id="skills"
            value={formData.skills}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            placeholder="List your key skills (comma-separated or one per line)..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="achievements">Key Achievements</Label>
          <Textarea
            id="achievements"
            value={formData.achievements}
            onChange={(e) => handleInputChange('achievements', e.target.value)}
            placeholder="Highlight your major achievements, awards, or certifications..."
            rows={3}
          />
        </div>

        {jobDescription && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <Label className="text-primary-900 font-semibold">Job Description (for customization)</Label>
            <p className="text-sm text-primary-800 mt-2 line-clamp-3">{jobDescription}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {onClose && (
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
          )}
          <Button onClick={handleGenerate} className="flex-1" disabled={loading} type="button">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Resume
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

