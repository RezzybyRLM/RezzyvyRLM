'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'
import { Mic, MicOff, Play, Pause, RotateCcw, Volume2, VolumeX, Loader2, Save } from 'lucide-react'
import { geminiVoiceService, VOICE_PROFILES, VoiceProfile, SUPPORTED_LANGUAGES } from '@/lib/voice/gemini-voice'
import { createClient } from '@/lib/supabase/client'
import { canPerformAction } from '@/lib/plans/usage-tracking'

interface InterviewSession {
  id: string
  jobRole: string
  questions: string[]
  currentQuestionIndex: number
  responses: string[]
  feedback: string[]
  aiResponses: string[]
  conversationHistory: Array<{ role: 'user' | 'ai', content: string }>
  isActive: boolean
  startTime: Date | null
}

export default function InterviewProPage() {
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfile>(VOICE_PROFILES[0])
  const [useGeminiVoice, setUseGeminiVoice] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [currentPlan, setCurrentPlan] = useState('Free')
  const [isSaving, setIsSaving] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const supabase = createClient()

  const jobRoles = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist',
    'Marketing Manager',
    'Sales Representative',
    'UX Designer',
    'Project Manager',
    'Business Analyst',
  ]

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          handleSpeechResult(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
          setError('Speech recognition failed. Please try again.')
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      } else {
        setError('Speech recognition is not supported in this browser.')
      }

      // Check browser compatibility for TTS
      const browserInfo = geminiVoiceService.getBrowserInfo()
      console.log('Browser TTS Support:', browserInfo)
      
      // Get supported languages
      const supportedLanguages = geminiVoiceService.getSupportedLanguages()
      console.log('Supported languages:', supportedLanguages)
      
      if (!browserInfo.supported) {
        setError('Text-to-speech is not supported in this browser. Please use Chrome, Edge, Safari, or Firefox.')
      }

      // Listen for speech synthesis end events
      const handleSpeechEnd = () => {
        setIsSpeaking(false)
      }

      if ('speechSynthesis' in window) {
        window.speechSynthesis.addEventListener('end', handleSpeechEnd)
      }

      return () => {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.removeEventListener('end', handleSpeechEnd)
        }
      }
    }
  }, [])

  const startNewSession = async () => {
    if (!selectedRole) {
      setError('Please select a job role')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Generate interview questions using AI
      const response = await fetch('/api/ai/interview/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobRole: selectedRole,
          experienceLevel: 'mid',
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        const newSession: InterviewSession = {
          id: Date.now().toString(),
          jobRole: selectedRole,
          questions: data.questions,
          currentQuestionIndex: 0,
          responses: [],
          feedback: [],
          aiResponses: [],
          conversationHistory: [],
          isActive: true,
          startTime: new Date(),
        }
        
        setSession(newSession)
        speakQuestion(newSession.questions[0])
      } else {
        setError(data.error || 'Failed to generate questions')
      }
    } catch (err) {
      setError('Failed to start interview session')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSpeechResult = async (transcript: string) => {
    if (!session) return

    setIsProcessing(true)

    try {
      // Add user's response to conversation history
      const updatedConversationHistory = [
        ...session.conversationHistory,
        { role: 'user' as const, content: transcript }
      ]

      // Build conversation context for Gemini
      const conversationContext = `
Job Role: ${session.jobRole}
Current Question: ${session.questions[session.currentQuestionIndex]}
Previous responses: ${session.responses.join(' | ')}
Conversation so far:
${updatedConversationHistory.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}
`

      // Use Gemini to generate conversational response
      let aiResponse = ''
      if (useGeminiVoice) {
        aiResponse = await geminiVoiceService.generateAndSpeakResponse(transcript, conversationContext)
      } else {
        // Fallback: analyze response using existing API
        const response = await fetch('/api/ai/interview/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: session.questions[session.currentQuestionIndex],
            answer: transcript,
            jobRole: session.jobRole,
          }),
        })

        const data = await response.json()
        if (data.success && data.feedback) {
          aiResponse = data.feedback
          speakQuestion(data.feedback)
        }
      }

      // Add AI response to conversation history
      const finalConversationHistory = [
        ...updatedConversationHistory,
        { role: 'ai' as const, content: aiResponse }
      ]

      const updatedSession = {
        ...session,
        responses: [...session.responses, transcript],
        aiResponses: [...session.aiResponses, aiResponse],
        conversationHistory: finalConversationHistory,
        currentQuestionIndex: session.currentQuestionIndex + 1,
      }

      setSession(updatedSession)

      // Move to next question or end session
      if (updatedSession.currentQuestionIndex < updatedSession.questions.length) {
        setTimeout(() => {
          speakQuestion(updatedSession.questions[updatedSession.currentQuestionIndex])
        }, 3000)
      } else {
        // End session with AI-generated closing
        setTimeout(async () => {
          const closingMessage = "Great job! You have completed the interview. Thank you for your time and thoughtful responses."
          if (useGeminiVoice) {
            await geminiVoiceService.speakWithGemini(closingMessage, 'Interview closing')
          } else {
            speakQuestion(closingMessage)
          }
          setSession({ ...updatedSession, isActive: false })
        }, 3000)
      }
    } catch (err) {
      console.error('Error processing speech:', err)
      setError('Failed to process your response')
    } finally {
      setIsProcessing(false)
    }
  }

  const saveSession = async () => {
    if (!session) return

    setIsSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save sessions')
        setIsSaving(false)
        return
      }

      // Check if user can save interview session
      const { allowed, reason } = await canPerformAction(user.id, 'aiInterview')
      
      if (!allowed) {
        setUpgradeMessage(reason || '')
        setShowUpgradePrompt(true)
        setIsSaving(false)
        return
      }

      // Calculate duration
      const duration = session.startTime 
        ? Math.floor((new Date().getTime() - session.startTime.getTime()) / 1000)
        : 0

      // Save to database
      const { error: saveError } = await (supabase as any)
        .from('interview_sessions')
        .insert({
          user_id: user.id,
          job_role: session.jobRole,
          duration: duration,
          questions: session.questions,
          feedback: session.aiResponses,
          session_data: {
            responses: session.responses,
            conversationHistory: session.conversationHistory,
          },
        })

      if (saveError) {
        console.error('Error saving session:', saveError)
        setError('Failed to save session')
      } else {
        alert('Interview session saved successfully!')
        resetSession()
      }
    } catch (err) {
      console.error('Error saving session:', err)
      setError('Failed to save session')
    } finally {
      setIsSaving(false)
    }
  }

  const resetSession = async () => {
    setSession(null)
    setSelectedRole('')
    setError(null)
    geminiVoiceService.stop()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  // Load user plan on mount and check access
  useEffect(() => {
    const loadPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Not logged in, redirect to login
        window.location.href = '/auth/login?redirectTo=/interview-pro'
        return
      }

      const { data: plan } = await (supabase as any)
        .from('user_plans')
        .select('plan_type')
        .eq('user_id', user.id)
        .single()

      if (!plan) {
        // No plan, redirect to plans page
        window.location.href = '/plans?redirectTo=/interview-pro'
        return
      }

      setCurrentPlan(plan.plan_type || 'Free')
    }
    loadPlan()
  }, [supabase])

  const stopSpeaking = () => {
    geminiVoiceService.stop()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  const speakQuestion = async (question: string) => {
    setIsSpeaking(true)
    
    try {
      if (useGeminiVoice) {
        // Use Gemini-powered voice with selected profile
        geminiVoiceService.setVoiceProfile(selectedVoiceProfile)
        await geminiVoiceService.speakWithGemini(question, 'Interview question')
      } else {
        // Fallback to browser TTS
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(question)
          utterance.rate = selectedVoiceProfile.rate
          utterance.pitch = selectedVoiceProfile.pitch
          utterance.volume = selectedVoiceProfile.volume

          utterance.onstart = () => setIsSpeaking(true)
          utterance.onend = () => setIsSpeaking(false)

          window.speechSynthesis.speak(utterance)
        }
      }
    } catch (error) {
      console.error('Error speaking:', error)
      setIsSpeaking(false)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Pro</h1>
          <p className="text-gray-600">Practice interviews with AI-powered voice coaching</p>
        </div>

        {!session ? (
          /* Setup Phase */
          <Card>
            <CardHeader>
              <CardTitle>Start Your AI Interview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <p className="text-sm text-gray-800">{error}</p>
                </div>
              )}

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value)
                    geminiVoiceService.setLanguage(e.target.value)
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  The AI will speak in your selected language
                </p>
              </div>

              {/* Voice Profile Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Voice Profile
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {VOICE_PROFILES.map((profile) => (
                    <button
                      key={profile.name}
                      onClick={() => setSelectedVoiceProfile(profile)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedVoiceProfile.name === profile.name
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{profile.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{profile.description}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center">
                  <input
                    type="checkbox"
                    id="useGeminiVoice"
                    checked={useGeminiVoice}
                    onChange={(e) => setUseGeminiVoice(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="useGeminiVoice" className="text-sm text-gray-700">
                    Use Gemini AI for enhanced natural speech
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Job Role
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {jobRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        selectedRole === role
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">{role}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI will ask you interview questions for your selected role</li>
                  <li>• Speak your answers naturally - AI will listen and analyze</li>
                  <li>• Get instant feedback and tips for improvement</li>
                  <li>• Practice until you're confident for real interviews</li>
                </ul>
              </div>

              <Button
                onClick={startNewSession}
                disabled={!selectedRole || isProcessing}
                size="lg"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  'Start Interview'
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Interview Phase */
          <div className="space-y-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {session.jobRole}
                    </Badge>
                    Interview in Progress
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="default" 
                      onClick={saveSession}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Session
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={resetSession}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      End Session
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Question {session.currentQuestionIndex + 1} of {session.questions.length}</span>
                  <span>Progress: {Math.round(((session.currentQuestionIndex + 1) / session.questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((session.currentQuestionIndex + 1) / session.questions.length) * 100}%`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Current Question */}
            {session.isActive && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-900 mb-4">
                    {session.questions[session.currentQuestionIndex]}
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessing}
                      variant={isListening ? 'destructive' : 'default'}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="mr-2 h-4 w-4" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-4 w-4" />
                          Start Speaking
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={isSpeaking ? stopSpeaking : () => speakQuestion(session.questions[session.currentQuestionIndex])}
                      variant="outline"
                    >
                      {isSpeaking ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Stop Speaking
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Repeat Question
                        </>
                      )}
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="mt-4 flex items-center text-gray-600">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing your response...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Responses and Feedback */}
            {session.responses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Responses & Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {session.responses.map((response, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Question {index + 1}: {session.questions[index]}
                        </h4>
                        <p className="text-gray-700 mb-2">
                          <strong>Your Answer:</strong> {response}
                        </p>
                        {session.feedback[index] && (
                          <div className="bg-green-50 border border-green-200 rounded p-3">
                            <p className="text-sm text-green-800">
                              <strong>AI Feedback:</strong> {session.feedback[index]}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        title="Upgrade Your Plan"
        message={upgradeMessage}
        feature="AI Interview Sessions"
        currentPlan={currentPlan}
      />
    </div>
  )
}
