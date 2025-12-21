"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"
import { BrandedImage } from "@/components/branded-image"
import { 
  BookOpen, 
  GraduationCap, 
  Lock, 
  Loader2,
  Clock,
  Target,
  Search
} from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  duration_hours: number
  instructor_id: string
  instructor_name?: string
  thumbnail_url?: string
  learning_objectives?: string[]
}

export default function GuestLearningPathPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setIsLoading(true)
      // Guest users can only see active courses
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12) // Limit for guest users

      if (error) {
        console.error("Error loading courses:", error)
        return
      }

      const coursesWithInstructor = (data || []).map(course => ({
        ...course,
        instructor_name: course.instructor?.full_name || "Unknown Instructor"
      }))

      setCourses(coursesWithInstructor)
    } catch (error) {
      console.error("Error loading courses:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo width={120} height={60} variant="nav" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Home</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 brand-text-gradient">
            Learning Path
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover structured learning paths and courses to advance your STEM education
          </p>
        </div>

        {/* Login Prompt */}
        <Alert className="mb-6 max-w-2xl mx-auto border-blue-200 bg-blue-50">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-blue-700">
            You're viewing as a guest.{" "}
            <Link href="/login" className="underline font-medium">
              Sign in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="underline font-medium">
              create an account
            </Link>{" "}
            to enroll in courses and track your progress.
          </AlertDescription>
        </Alert>

        {/* Hero Image */}
        <div className="max-w-4xl mx-auto mb-8">
          <BrandedImage
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
            alt="Learning paths at STEM Spark Academy"
            width={800}
            height={300}
            className="rounded-2xl shadow-xl"
            showBranding={true}
            brandingPosition="bottom-left"
          />
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              {course.thumbnail_url && (
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.learning_objectives && course.learning_objectives.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        Learning Objectives:
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {course.learning_objectives.slice(0, 2).map((objective, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-1">•</span>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{course.instructor_name}</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration_hours}h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{course.difficulty_level}</Badge>
                    <Button
                      size="sm"
                      onClick={() => window.location.href = "/login"}
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Login to Enroll
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No courses found.</p>
            <p className="text-sm text-gray-400 mt-2">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
}

