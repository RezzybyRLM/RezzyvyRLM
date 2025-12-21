"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"
import { 
  UserPlus, 
  GraduationCap, 
  Star, 
  Clock, 
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

interface MentorFormData {
  fullName: string
  email: string
  phone: string
  subject: string
  experience: string
  qualifications: string
  availability: string
  motivation: string
}

export default function MentorApplicationPage() {
  const [formData, setFormData] = useState<MentorFormData>({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    experience: "",
    qualifications: "",
    availability: "",
    motivation: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      if (authUser) {
        // Pre-fill email if user is logged in
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          setFormData(prev => ({
            ...prev,
            email: profile.email || "",
            fullName: profile.full_name || ""
          }))
        }
      }
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/mentor-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setMessage({
        type: 'success',
        text: 'Thank you! Your mentor application has been submitted successfully. We will review it and get back to you soon.'
      })

      // Reset form
      setFormData({
        fullName: user?.user_metadata?.full_name || "",
        email: user?.email || "",
        phone: "",
        subject: "",
        experience: "",
        qualifications: "",
        availability: "",
        motivation: ""
      })
    } catch (error: any) {
      console.error('Error submitting mentor application:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to submit application. Please try again later.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 relative overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo width={120} height={60} variant="nav" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                Home
              </Button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Become a Mentor
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Share your expertise and help students learn. Apply to become an AI Tutor mentor today!
            </p>
          </div>

          {/* Benefits Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Make an Impact</h3>
                <p className="text-blue-200 text-sm">Help shape the next generation of STEM professionals</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Flexible Schedule</h3>
                <p className="text-blue-200 text-sm">Work on your own time and set your availability</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Grow Your Skills</h3>
                <p className="text-blue-200 text-sm">Enhance your teaching and communication abilities</p>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <GraduationCap className="w-8 h-8 mr-3" />
                  Mentor Application Form
                </h2>
                <p className="text-blue-200">
                  Fill out the form below to apply as a mentor for our AI Tutor program.
                </p>
              </div>

              {message && (
                <Alert className={`mb-6 ${
                  message.type === 'success' 
                    ? 'bg-green-500/20 border-green-400 text-green-100' 
                    : 'bg-red-500/20 border-red-400 text-red-100'
                } border`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName" className="text-white mb-2 block">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white mb-2 block">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone" className="text-white mb-2 block">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-white mb-2 block">Subject Area *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400"
                      placeholder="Mathematics, Science, Programming, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="experience" className="text-white mb-2 block">Years of Experience *</Label>
                  <Textarea
                    id="experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    required
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 resize-none"
                    placeholder="Describe your teaching/mentoring experience, including years of experience, types of students you've worked with, and any notable achievements..."
                  />
                </div>

                <div>
                  <Label htmlFor="qualifications" className="text-white mb-2 block">Qualifications *</Label>
                  <Textarea
                    id="qualifications"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    required
                    rows={4}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 resize-none"
                    placeholder="List your degrees, certifications, achievements, and any relevant professional qualifications..."
                  />
                </div>

                <div>
                  <Label htmlFor="availability" className="text-white mb-2 block">Availability *</Label>
                  <Textarea
                    id="availability"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    required
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 resize-none"
                    placeholder="Hours per week, preferred times, timezone, and any scheduling constraints..."
                  />
                </div>

                <div>
                  <Label htmlFor="motivation" className="text-white mb-2 block">Why do you want to be a mentor? *</Label>
                  <Textarea
                    id="motivation"
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    required
                    rows={5}
                    className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 resize-none"
                    placeholder="Tell us about your passion for teaching and mentoring. What motivates you to help students? What do you hope to achieve as a mentor?"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white flex-1 py-6 text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                  <Link href="/">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/20 py-6"
                    >
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

