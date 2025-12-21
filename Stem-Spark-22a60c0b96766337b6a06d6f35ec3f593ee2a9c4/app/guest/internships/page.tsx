"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Calendar, MapPin, Users, Clock, Search, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { BrandedImage } from "@/components/branded-image"

interface Internship {
  id: string
  title: string
  description: string
  company: string
  location: string
  duration: string
  requirements: string
  application_deadline: string
  start_date: string
  end_date: string
  max_participants: number
  current_participants: number
  status: string
}

export default function GuestInternshipsPage() {
  const [internships, setInternships] = useState<Internship[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInternships()
  }, [])

  const loadInternships = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("internships")
        .select("*")
        .eq("status", "active")
        .order("application_deadline", { ascending: true })
        .limit(10) // Limit for guest users

      if (error) {
        console.error("Error loading internships:", error)
        return
      }

      setInternships(data || [])
    } catch (error) {
      console.error("Error loading internships:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInternships = internships.filter(
    (internship) =>
      internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading internships...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 brand-text-gradient">STEM Internships</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing internship opportunities to gain real-world experience in STEM fields
          </p>
        </div>

        {/* Login Required Message */}
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
            to apply for internships.
          </AlertDescription>
        </Alert>

        <div className="max-w-4xl mx-auto mt-8">
          <BrandedImage
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
            alt="Students participating in STEM internships"
            width={800}
            height={300}
            className="rounded-2xl shadow-xl"
            showBranding={true}
            brandingPosition="bottom-left"
          />
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8 mt-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search internships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Internships Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredInternships.map((internship) => {
            const isDeadlinePassed = new Date(internship.application_deadline) < new Date()
            const isFull = internship.current_participants >= internship.max_participants

            return (
              <Card key={internship.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{internship.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Building2 className="w-4 h-4" />
                        {internship.company}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {internship.location}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-3">{internship.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Duration: {internship.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>Deadline: {formatDate(internship.application_deadline)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>
                        {internship.current_participants}/{internship.max_participants} participants
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => window.location.href = "/login"}
                  >
                    Login to Apply
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredInternships.length === 0 && (
          <div className="text-center py-12">
            <Logo width={80} height={80} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-500 text-lg">No internships found.</p>
          </div>
        )}
      </div>
    </div>
  )
}

