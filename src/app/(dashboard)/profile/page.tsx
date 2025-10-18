'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, MapPin, Calendar, Save, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    location: '',
    preferences: {},
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || '',
          email: profileData.email || user.email || '',
          location: profileData.location || '',
          preferences: profileData.preferences || {},
        })
      } else {
        // Create profile if it doesn't exist
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          })

        if (error) {
          console.error('Error creating profile:', error)
        }
      }

      setLoading(false)
    }

    getUser()
  }, [router, supabase])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          location: profile.location,
          preferences: profile.preferences,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        setError(error.message)
      } else {
        // Show success message
        setError(null)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto container-padding section-padding">
        <div className="mb-8">
          <h1 className="text-responsive-xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-responsive-md text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="input-professional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="input-professional pl-10"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="input-professional pl-10"
                      placeholder="City, State or Remote"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={handleSignOut} className="btn-secondary">
                    Sign Out
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <div className="space-y-6">
            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account type</span>
                    <Badge variant="outline">Free</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email verified</span>
                    <Badge variant={user?.email_confirmed_at ? 'default' : 'destructive'}>
                      {user?.email_confirmed_at ? 'Verified' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-professional">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start btn-secondary">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Interview Sessions
                </Button>
                <Button variant="outline" className="w-full justify-start btn-secondary">
                  <MapPin className="mr-2 h-4 w-4" />
                  Manage Job Alerts
                </Button>
                <Button variant="outline" className="w-full justify-start btn-secondary">
                  <User className="mr-2 h-4 w-4" />
                  Resume Manager
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
