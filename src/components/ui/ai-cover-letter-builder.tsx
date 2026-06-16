'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Sparkles, 
  Loader2, 
  Download, 
  Mail, 
  X, 
  AlertCircle,
  Wand2,
  Copy
} from 'lucide-react'
import { generateCoverLetter } from '@/lib/ai/helpers'

interface AICoverLetterBuilderProps {
  jobTitle?: string
  companyName?: string
  jobDescription?: string
  onClose?: () => void
  onGenerated?: (letter: string) => void
}

export function AICoverLetterBuilder({ 
  jobTitle = '', 
  companyName = '', 
  jobDescription = '',
  onClose,
  onGenerated
}: AICoverLetterBuilderProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    jobTitle: jobTitle,
    companyName: companyName,
    experience: '',
    skills: '',
    motivation: '',
  })
  const [generatedLetter, setGeneratedLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    if (!formData.name || !formData.jobTitle || !formData.companyName) {
      setError('Please fill in at least your name, job title, and company name')
      return
    }

    setLoading(true)
    setError(null)
    setStep('generating')

    try {
      const result = await generateCoverLetter(
        formData.jobTitle,
        formData.companyName,
        jobDescription || 'General position',
        {
          name: formData.name,
          experience: formData.experience,
          skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        }
      )
      
      setGeneratedLetter(result.text)
      setUsedFallback(result.usedFallback)
      setStep('result')
      // Call onGenerated callback if provided
      if (onGenerated) {
        onGenerated(result.text)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter)
    alert('Cover letter copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Cover_Letter_${formData.companyName.replace(/\s+/g, '_')}.txt`
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Cover Letter</h3>
          <p className="text-gray-600 mb-4">Our AI is crafting a personalized cover letter...</p>
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
              Your AI-Generated Cover Letter
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
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Generated Cover Letter</h4>
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
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-white p-4 rounded border max-h-96 overflow-y-auto">
              {generatedLetter}
            </pre>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep('input')} variant="outline" type="button">
              Edit & Regenerate
            </Button>
            <Button onClick={handleDownload} className="flex-1" type="button">
              <Download className="mr-2 h-4 w-4" />
              Download Cover Letter
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
            AI Cover Letter Builder
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} type="button">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Fill in your information and our AI will generate a professional cover letter
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
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <Label htmlFor="email">Your Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john@example.com"
            />
          </div>
          <div>
            <Label htmlFor="jobTitle">Job Title *</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange('jobTitle', e.target.value)}
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="Tech Company Inc."
            />
          </div>
        </div>

        {jobDescription && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <Label className="text-primary-900 font-semibold">Job Description</Label>
            <p className="text-sm text-primary-800 mt-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {jobDescription}
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="experience">Your Relevant Experience</Label>
          <Textarea
            id="experience"
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            placeholder="Describe your relevant work experience, projects, or achievements..."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="skills">Key Skills</Label>
          <Textarea
            id="skills"
            value={formData.skills}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            placeholder="List your key skills relevant to this position (comma-separated)..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="motivation">Why You're Interested</Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => handleInputChange('motivation', e.target.value)}
            placeholder="What draws you to this position and company? (Optional but recommended)..."
            rows={3}
          />
        </div>

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
                Generate Cover Letter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

