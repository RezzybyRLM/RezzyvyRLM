'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Play, Pause, RotateCcw, Volume2, VolumeX, Loader2 } from 'lucide-react'

interface InterviewSession {
  id: string
  jobRole: string
  questions: string[]
  currentQuestionIndex: number
  responses: string[]
  feedback: string[]
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
  
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<any>(null)

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

  const speakQuestion = (question: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)

      synthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
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

  const handleSpeechResult = async (transcript: string) => {
    if (!session) return

    setIsProcessing(true)

    try {
      // Analyze the response using AI
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
      
      if (data.success) {
        const updatedSession = {
          ...session,
          responses: [...session.responses, transcript],
          feedback: [...session.feedback, data.feedback],
          currentQuestionIndex: session.currentQuestionIndex + 1,
        }

        setSession(updatedSession)

        // Speak the feedback
        if (data.feedback) {
          speakQuestion(data.feedback)
        }

        // Move to next question or end session
        if (updatedSession.currentQuestionIndex < updatedSession.questions.length) {
          setTimeout(() => {
            speakQuestion(updatedSession.questions[updatedSession.currentQuestionIndex])
          }, 3000)
        } else {
          // End session
          setTimeout(() => {
            speakQuestion('Great job! You have completed the interview. Here is your overall feedback: ' + data.feedback)
            setSession({ ...updatedSession, isActive: false })
          }, 3000)
        }
      } else {
        setError(data.error || 'Failed to analyze response')
      }
    } catch (err) {
      setError('Failed to process your response')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetSession = () => {
    setSession(null)
    setSelectedRole('')
    setError(null)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
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
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

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
                  <Button variant="outline" onClick={resetSession}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    End Session
                  </Button>
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
    </div>
  )
}
