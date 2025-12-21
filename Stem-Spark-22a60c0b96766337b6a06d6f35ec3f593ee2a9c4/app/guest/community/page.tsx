"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Logo } from "@/components/logo"
import { BrandedImage } from "@/components/branded-image"
import { 
  MessageSquare, 
  Users, 
  Hash, 
  Lock, 
  Loader2,
  Calendar,
  TrendingUp
} from "lucide-react"
import Link from "next/link"

interface Channel {
  id: string
  name: string
  description: string
  type: string
  member_count: number
  created_at: string
}

export default function GuestCommunityPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      setIsLoading(true)
      // Guest users can only see public channels
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("type", "general")
        .order("created_at", { ascending: false })
        .limit(10) // Limit for guest users

      if (error) {
        console.error("Error loading channels:", error)
        return
      }

      setChannels(data || [])
    } catch (error) {
      console.error("Error loading channels:", error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <p className="text-lg text-gray-600">Loading community...</p>
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
            Community Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with students, teachers, and parents in our vibrant STEM community
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
            to join the community and participate in discussions.
          </AlertDescription>
        </Alert>

        {/* Hero Image */}
        <div className="max-w-4xl mx-auto mb-8">
          <BrandedImage
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
            alt="Community at STEM Spark Academy"
            width={800}
            height={300}
            className="rounded-2xl shadow-xl"
            showBranding={true}
            brandingPosition="bottom-left"
          />
        </div>

        {/* Channels Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {channels.map((channel) => (
            <Card key={channel.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{channel.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{channel.member_count} members</span>
                    </div>
                    <Badge variant="outline">{channel.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Created {formatDate(channel.created_at)}</span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => window.location.href = "/login"}
                  >
                    Login to Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {channels.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No public channels available.</p>
            <p className="text-sm text-gray-400 mt-2">Sign in to see all community channels</p>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Community Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <h3 className="font-semibold mb-2">Discussion Channels</h3>
                <p className="text-sm text-gray-600">Join topic-based discussions and share ideas</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                <h3 className="font-semibold mb-2">Connect with Peers</h3>
                <p className="text-sm text-gray-600">Network with students, teachers, and mentors</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h3 className="font-semibold mb-2">Stay Updated</h3>
                <p className="text-sm text-gray-600">Get the latest news and announcements</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

