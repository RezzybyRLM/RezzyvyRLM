"use client"

import React from "react"
import { MobilePageWrapper } from "../../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../../components/MobileLayout"
import { BookOpen, Target, Award, Clock, CheckCircle, Play, Lock, Star, TrendingUp, Users } from "lucide-react"

export default function MobileLearningPathPage() {
  const learningPaths = [
    {
      id: 1,
      title: "Computer Science Fundamentals",
      description: "Master the basics of programming and computer science",
      duration: "6 months",
      difficulty: "Beginner",
      progress: 75,
      enrolled: 1247,
      rating: 4.8,
      modules: 12,
      completed: 9,
      isUnlocked: true
    },
    {
      id: 2,
      title: "Advanced Mathematics",
      description: "Deep dive into calculus, linear algebra, and statistics",
      duration: "8 months",
      difficulty: "Advanced",
      progress: 45,
      enrolled: 892,
      rating: 4.9,
      modules: 16,
      completed: 7,
      isUnlocked: true
    },
    {
      id: 3,
      title: "Engineering Principles",
      description: "Learn mechanical, electrical, and civil engineering basics",
      duration: "10 months",
      difficulty: "Intermediate",
      progress: 30,
      enrolled: 567,
      rating: 4.7,
      modules: 14,
      completed: 4,
      isUnlocked: true
    },
    {
      id: 4,
      title: "Data Science & AI",
      description: "Explore machine learning, data analysis, and AI applications",
      duration: "12 months",
      difficulty: "Advanced",
      progress: 0,
      enrolled: 234,
      rating: 4.6,
      modules: 18,
      completed: 0,
      isUnlocked: false
    }
  ]

  const currentModule = {
    title: "Introduction to Python Programming",
    path: "Computer Science Fundamentals",
    progress: 75,
    nextLesson: "Variables and Data Types",
    estimatedTime: "45 minutes"
  }

  const recommendedCourses = [
    {
      id: 1,
      title: "Web Development Basics",
      instructor: "Dr. Sarah Chen",
      duration: "4 weeks",
      rating: 4.8,
      students: 2341,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: 2,
      title: "Machine Learning Introduction",
      instructor: "Prof. Mike Rodriguez",
      duration: "6 weeks",
      rating: 4.9,
      students: 1892,
      thumbnail: "/api/placeholder/300/200"
    },
    {
      id: 3,
      title: "Robotics Fundamentals",
      instructor: "Dr. Emily Watson",
      duration: "8 weeks",
      rating: 4.7,
      students: 1456,
      thumbnail: "/api/placeholder/300/200"
    }
  ]

  return (
    <MobilePageWrapper>
      {/* Hero Section */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h1" color="default" align="center" className="mb-4">
            Learning Paths
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Structured learning journeys designed to take you from beginner to expert
          </MobileText>
          
          {/* Progress Overview */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="text-center">
              <MobileText variant="h3" color="default" className="mb-2">
                Overall Progress
              </MobileText>
              <div className="w-24 h-24 mx-auto mb-3 relative">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">75%</span>
                </div>
              </div>
              <MobileText variant="caption" color="muted">
                3 of 4 paths in progress
              </MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Current Module */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Continue Learning
          </MobileText>
          
          <MobileCard variant="elevated" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <MobileText variant="h4" color="primary" className="mb-1">
                    {currentModule.title}
                  </MobileText>
                  <MobileText variant="caption" color="muted">
                    {currentModule.path}
                  </MobileText>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{currentModule.progress}%</div>
                  <MobileText variant="caption" color="muted">Complete</MobileText>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentModule.progress}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">Next: {currentModule.nextLesson}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-700">{currentModule.estimatedTime}</span>
                </div>
              </div>
              
              <MobileButton variant="primary" fullWidth>
                Continue Learning
              </MobileButton>
            </div>
          </MobileCard>
        </MobileContainer>
      </MobileSection>

      {/* Learning Paths */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Your Learning Paths
          </MobileText>
          
          <div className="space-y-4">
            {learningPaths.map((path) => (
              <MobileCard key={path.id} variant="elevated" interactive>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <MobileText variant="h4" color="primary" className="truncate">
                          {path.title}
                        </MobileText>
                        {!path.isUnlocked && (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <MobileText variant="body" color="muted" className="mb-2">
                        {path.description}
                      </MobileText>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{path.progress}%</div>
                        <MobileText variant="caption" color="muted">Complete</MobileText>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${path.progress}%` }}
                    ></div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{path.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{path.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{path.completed}/{path.modules} modules</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{path.enrolled} students</span>
                    </div>
                  </div>
                  
                  {/* Rating and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-700">{path.rating}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      {path.isUnlocked ? (
                        <>
                          <MobileButton size="sm" variant="outline">
                            View Details
                          </MobileButton>
                          <MobileButton size="sm" variant="primary">
                            Continue
                          </MobileButton>
                        </>
                      ) : (
                        <MobileButton size="sm" variant="outline">
                          Unlock Path
                        </MobileButton>
                      )}
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Recommended Courses */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Recommended for You
          </MobileText>
          
          <div className="space-y-4">
            {recommendedCourses.map((course) => (
              <MobileCard key={course.id} variant="elevated" interactive>
                <div className="flex space-x-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-gray-400" />
                  </div>
                  
                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <MobileText variant="h4" color="primary" className="mb-1 truncate">
                      {course.title}
                    </MobileText>
                    <MobileText variant="caption" color="muted" className="mb-2">
                      by {course.instructor}
                    </MobileText>
                    
                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{course.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{course.students}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="flex items-center">
                    <MobileButton size="sm" variant="primary">
                      Enroll
                    </MobileButton>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Learning Tips */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Learning Tips
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Maximize your learning potential with these strategies
          </MobileText>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <MobileText variant="body" color="muted">
                Study consistently - even 30 minutes daily is better than 4 hours once a week
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <MobileText variant="body" color="muted">
                Practice hands-on projects to reinforce theoretical knowledge
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <MobileText variant="body" color="muted">
                Join study groups and collaborate with peers for better understanding
              </MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Ready to Start Learning?
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Choose your path and begin your STEM journey today
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Browse All Paths
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              Get Personalized Recommendations
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}
