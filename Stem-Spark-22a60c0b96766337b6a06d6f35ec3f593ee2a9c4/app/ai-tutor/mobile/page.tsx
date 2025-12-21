"use client"

import React, { useState } from "react"
import { MobilePageWrapper } from "../../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../../components/MobileLayout"
import { Bot, MessageSquare, Brain, Zap, BookOpen, Target, Clock, Star, Send, Mic, Paperclip, Smile } from "lucide-react"

export default function MobileAITutorPage() {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)

  const tutorSubjects = [
    { name: "Mathematics", icon: "🧮", topics: ["Calculus", "Algebra", "Statistics"], color: "blue" },
    { name: "Physics", icon: "⚡", topics: ["Mechanics", "Thermodynamics", "Quantum"], color: "green" },
    { name: "Computer Science", icon: "💻", topics: ["Programming", "Algorithms", "Data Structures"], color: "purple" },
    { name: "Chemistry", icon: "🧪", topics: ["Organic", "Inorganic", "Biochemistry"], color: "orange" },
    { name: "Biology", icon: "🧬", topics: ["Genetics", "Ecology", "Microbiology"], color: "red" },
    { name: "Engineering", icon: "⚙️", topics: ["Mechanical", "Electrical", "Civil"], color: "indigo" },
  ]

  const recentSessions = [
    {
      id: 1,
      subject: "Calculus",
      topic: "Integration by Parts",
      duration: "25 minutes",
      rating: 5,
      date: "Today"
    },
    {
      id: 2,
      subject: "Python Programming",
      topic: "Object-Oriented Programming",
      duration: "40 minutes",
      rating: 4,
      date: "Yesterday"
    },
    {
      id: 3,
      subject: "Physics",
      topic: "Newton's Laws of Motion",
      duration: "30 minutes",
      rating: 5,
      date: "2 days ago"
    }
  ]

  const quickQuestions = [
    "Explain quantum computing in simple terms",
    "Help me solve this calculus problem",
    "What are the best practices for React hooks?",
    "How does machine learning work?",
    "Explain the concept of entropy",
    "Help me understand recursion"
  ]

  return (
    <MobilePageWrapper>
      {/* Hero Section */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="lg" centered>
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <MobileText variant="h1" color="default" align="center" className="mb-4">
              AI Tutor
            </MobileText>
            <MobileText variant="body" color="muted" align="center" className="mb-6">
              Your personal AI-powered learning companion for all STEM subjects
            </MobileText>
          </div>
          
          {/* Quick Start */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <MobileText variant="h3" color="default" align="center" className="mb-3">
              Start Learning
            </MobileText>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/90 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Subject Categories */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Choose Your Subject
          </MobileText>
          
          <MobileGrid cols={2} gap="md">
            {tutorSubjects.map((subject, index) => (
              <MobileCard key={index} variant="elevated" interactive>
                <div className="text-center p-4">
                  <div className="text-3xl mb-3">{subject.icon}</div>
                  <MobileText variant="h4" color="primary" className="mb-2">
                    {subject.name}
                  </MobileText>
                  <div className="space-y-1">
                    {subject.topics.map((topic, topicIndex) => (
                      <MobileText key={topicIndex} variant="caption" color="muted">
                        {topic}
                      </MobileText>
                    ))}
                  </div>
                </div>
              </MobileCard>
            ))}
          </MobileGrid>
        </MobileContainer>
      </MobileSection>

      {/* Quick Questions */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Quick Questions
          </MobileText>
          
          <div className="grid grid-cols-1 gap-3">
            {quickQuestions.map((question, index) => (
              <MobileCard key={index} variant="default" interactive>
                <button className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <MobileText variant="body" color="default" className="flex-1">
                      {question}
                    </MobileText>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Recent Sessions */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Recent Sessions
          </MobileText>
          
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <MobileCard key={session.id} variant="elevated" interactive>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <MobileText variant="h4" color="primary" className="mb-1 truncate">
                        {session.topic}
                      </MobileText>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{session.subject}</span>
                        <span>•</span>
                        <span>{session.duration}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-700">{session.rating}</span>
                    </div>
                    <MobileButton size="sm" variant="outline">
                      Continue
                    </MobileButton>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* AI Features */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            AI-Powered Features
          </MobileText>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/20 rounded-lg">
              <Brain className="w-8 h-8 mx-auto mb-2 text-white" />
              <MobileText variant="h4" color="default" className="mb-1">
                Adaptive Learning
              </MobileText>
              <MobileText variant="caption" color="muted">
                Tailors explanations to your level
              </MobileText>
            </div>
            
            <div className="text-center p-4 bg-white/20 rounded-lg">
              <Zap className="w-8 h-8 mx-auto mb-2 text-white" />
              <MobileText variant="h4" color="default" className="mb-1">
                Instant Help
              </MobileText>
              <MobileText variant="caption" color="muted">
                24/7 availability
              </MobileText>
            </div>
            
            <div className="text-center p-4 bg-white/20 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-white" />
              <MobileText variant="h4" color="default" className="mb-1">
                Personalized
              </MobileText>
              <MobileText variant="caption" color="muted">
                Remembers your progress
              </MobileText>
            </div>
            
            <div className="text-center p-4 bg-white/20 rounded-lg">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-white" />
              <MobileText variant="h4" color="default" className="mb-1">
                Interactive
              </MobileText>
              <MobileText variant="caption" color="muted">
                Ask follow-up questions
              </MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Chat Interface */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Start a Conversation
          </MobileText>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <MobileText variant="body" color="default">
                Hi! I'm your AI tutor. What would you like to learn today?
              </MobileText>
            </div>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                  <Mic className="w-4 h-4" />
                </button>
                <button className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors">
                    <Smile className="w-3 h-3 inline mr-1" />
                    Math Help
                  </button>
                  <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors">
                    <Smile className="w-3 h-3 inline mr-1" />
                    Code Review
                  </button>
                </div>
                
                <MobileButton variant="primary" size="sm">
                  Send Message
                </MobileButton>
              </div>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Ready to Learn?
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Start your personalized learning journey with AI assistance
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Start Learning
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              View Tutorial
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}

// Add missing ArrowRight component
const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
)
