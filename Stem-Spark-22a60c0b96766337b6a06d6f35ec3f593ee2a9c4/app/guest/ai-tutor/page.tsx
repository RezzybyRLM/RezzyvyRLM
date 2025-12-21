"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"
import { BrandedImage } from "@/components/branded-image"
import { 
  Bot, 
  Lock, 
  Brain,
  Clock,
  Star,
  Sparkles,
  MessageSquare,
  Send,
  BookOpen,
  Target,
  Lightbulb,
  Zap
} from "lucide-react"
import Link from "next/link"

interface DemoMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export default function GuestAITutorPage() {
  const [showDemo, setShowDemo] = useState(false)
  const [demoMessages] = useState<DemoMessage[]>([
    {
      id: '1',
      content: 'Can you explain how quadratic equations work?',
      sender: 'user',
      timestamp: new Date(Date.now() - 120000)
    },
    {
      id: '2',
      content: 'A quadratic equation is a polynomial equation of degree 2, typically written in the form ax² + bx + c = 0, where a, b, and c are constants and a ≠ 0.\n\nThe solutions to a quadratic equation can be found using the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a\n\nThe term b² - 4ac is called the discriminant. If it\'s positive, there are two real solutions; if zero, one real solution; if negative, two complex solutions.\n\nWould you like me to explain any specific part in more detail?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 90000)
    },
    {
      id: '3',
      content: 'Can you give me an example?',
      sender: 'user',
      timestamp: new Date(Date.now() - 60000)
    },
    {
      id: '4',
      content: 'Sure! Let\'s solve x² - 5x + 6 = 0\n\nUsing the quadratic formula:\na = 1, b = -5, c = 6\n\nx = (5 ± √(25 - 24)) / 2\nx = (5 ± 1) / 2\n\nSo we have:\nx = (5 + 1) / 2 = 3\nx = (5 - 1) / 2 = 2\n\nThe solutions are x = 2 and x = 3.\n\nYou can verify by plugging these back into the original equation!',
      sender: 'ai',
      timestamp: new Date(Date.now() - 30000)
    }
  ])

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
            <Link href="/signup">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Tutor
              <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent ml-2">
                Assistant
              </span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              Get personalized help with STEM subjects from our AI tutor. Ask questions, get explanations, and learn at your own pace.
            </p>
          </div>
        </div>

        {/* Login Prompt */}
        <Alert className="mb-8 max-w-2xl mx-auto border-blue-200 bg-blue-50/10 backdrop-blur-sm">
          <Lock className="h-4 w-4 text-blue-300" />
          <AlertDescription className="text-blue-100">
            You're viewing as a guest.{" "}
            <Link href="/login" className="underline font-medium text-blue-300 hover:text-blue-200">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="underline font-medium text-blue-300 hover:text-blue-200">
              create an account
            </Link>{" "}
            to access the AI tutor and start learning.
          </AlertDescription>
        </Alert>

        {/* Demo Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-white flex items-center">
                  <MessageSquare className="w-6 h-6 mr-2" />
                  AI Tutor Demo
                </CardTitle>
                <Button
                  onClick={() => setShowDemo(!showDemo)}
                  variant="outline"
                  className="border-blue-400 text-blue-200 hover:bg-blue-500/20 hover:text-white hover:border-blue-300"
                >
                  {showDemo ? 'Hide Demo' : 'Try Demo'}
                </Button>
              </div>
            </CardHeader>
            
            {showDemo && (
              <CardContent className="p-0">
                {/* Demo Chat Interface */}
                <div className="h-[500px] flex flex-col">
                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-blue-900/20 to-purple-900/20">
                    {demoMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-4 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white/10 text-blue-100 border border-white/20'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`flex items-center mt-2 text-xs opacity-70 ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Demo Input Area */}
                  <div className="p-6 border-t border-white/20 bg-white/5">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Try asking a question... (Demo mode - Sign up to chat with AI)"
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 focus:border-blue-400 focus:ring-blue-400/20 resize-none cursor-not-allowed"
                          rows={3}
                          disabled
                        />
                      </div>
                      <Button
                        disabled
                        className="bg-gradient-to-r from-blue-500/50 to-purple-600/50 text-white/50 px-6 self-end cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-blue-200/70 mt-2 text-center">
                      This is a demo. Sign up to chat with our AI tutor!
                    </p>
                  </div>
                </div>
              </CardContent>
            )}

            {!showDemo && (
              <CardContent className="p-8">
                <div className="text-center">
                  <Bot className="w-16 h-16 mx-auto mb-4 text-blue-300 opacity-50" />
                  <p className="text-lg font-medium text-white mb-2">Experience the AI Tutor</p>
                  <p className="text-blue-200 mb-6">Click "Try Demo" to see how our AI tutor works with sample conversations</p>
                  <Button
                    onClick={() => setShowDemo(true)}
                    className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !text-white border-0"
                    style={{ background: 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))', color: 'white' }}
                  >
                    Try Demo
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Subject Selection Demo */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-6">Available Subjects</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: "math", name: "Mathematics", icon: Target, description: "Algebra, Geometry, Calculus" },
              { id: "science", name: "Science", icon: Lightbulb, description: "Physics, Chemistry, Biology" },
              { id: "programming", name: "Programming", icon: Zap, description: "Python, JavaScript, Web Dev" },
              { id: "engineering", name: "Engineering", icon: Brain, description: "Mechanical, Electrical, Civil" }
            ].map((subject) => {
              const Icon = subject.icon
              return (
                <Card key={subject.id} className="backdrop-blur-md bg-white/10 border-white/20 shadow-xl rounded-xl overflow-hidden hover:bg-white/15 transition-all">
                  <CardContent className="p-4 text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{subject.name}</h3>
                    <p className="text-xs text-blue-200">{subject.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Why Choose Our AI Tutor?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Personalized Learning</h3>
                <p className="text-blue-200">Adapts to your learning style and pace for optimal understanding</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">24/7 Availability</h3>
                <p className="text-blue-200">Get help whenever you need it, day or night</p>
              </CardContent>
            </Card>
            
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl overflow-hidden text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Expert Knowledge</h3>
                <p className="text-blue-200">Access to comprehensive STEM knowledge and explanations</p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="mt-12 text-center">
            <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl">
              <CardContent className="p-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Learning?</h3>
                <p className="text-blue-200 mb-6">
                  Sign up now to access our AI tutor and get personalized help with your STEM studies.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/signup">
                    <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                      Sign Up Free
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="border-blue-400 text-blue-200 hover:bg-blue-500/20 hover:text-white hover:border-blue-300">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

