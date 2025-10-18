'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Bell, 
  MapPin, 
  Calendar,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react'

interface JobAlert {
  id: string
  search_query: string
  location: string
  frequency: 'daily' | 'weekly'
  is_active: boolean
  last_sent_at: string | null
  created_at: string
}

export default function JobAlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAlert, setNewAlert] = useState({
    search_query: '',
    location: '',
    frequency: 'daily' as 'daily' | 'weekly',
  })

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      // TODO: Implement real API call to fetch user's job alerts
      // Mock data for now
      const mockAlerts: JobAlert[] = [
        {
          id: '1',
          search_query: 'Software Engineer',
          location: 'San Francisco, CA',
          frequency: 'daily',
          is_active: true,
          last_sent_at: '2024-01-15T09:00:00Z',
          created_at: '2024-01-10T10:00:00Z',
        },
        {
          id: '2',
          search_query: 'Product Manager',
          location: 'Remote',
          frequency: 'weekly',
          is_active: true,
          last_sent_at: '2024-01-14T09:00:00Z',
          created_at: '2024-01-08T14:30:00Z',
        },
        {
          id: '3',
          search_query: 'UX Designer',
          location: 'New York, NY',
          frequency: 'daily',
          is_active: false,
          last_sent_at: '2024-01-12T09:00:00Z',
          created_at: '2024-01-05T16:45:00Z',
        },
      ]
      
      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Error fetching job alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newAlert.search_query.trim()) {
      alert('Please enter a job title or keywords')
      return
    }

    try {
      // TODO: Implement real API call to create job alert
      const alertData: JobAlert = {
        id: Date.now().toString(),
        search_query: newAlert.search_query,
        location: newAlert.location,
        frequency: newAlert.frequency,
        is_active: true,
        last_sent_at: null,
        created_at: new Date().toISOString(),
      }
      
      setAlerts(prev => [alertData, ...prev])
      setNewAlert({ search_query: '', location: '', frequency: 'daily' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating job alert:', error)
      alert('Failed to create job alert. Please try again.')
    }
  }

  const handleToggleAlert = async (alertId: string) => {
    try {
      // TODO: Implement real API call to toggle alert status
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_active: !alert.is_active }
          : alert
      ))
    } catch (error) {
      console.error('Error toggling job alert:', error)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this job alert?')) {
      return
    }

    try {
      // TODO: Implement real API call to delete job alert
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (error) {
      console.error('Error deleting job alert:', error)
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    return frequency === 'daily' 
      ? <Badge className="bg-blue-100 text-blue-800">Daily</Badge>
      : <Badge className="bg-green-100 text-green-800">Weekly</Badge>
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <XCircle className="h-4 w-4 text-red-500" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Alerts</h1>
          <p className="text-gray-600">Get notified when new jobs match your criteria</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Job Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title or Keywords *
                  </label>
                  <Input
                    value={newAlert.search_query}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, search_query: e.target.value }))}
                    placeholder="e.g., Software Engineer, Product Manager"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <Input
                    value={newAlert.location}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., San Francisco, CA or Remote"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={newAlert.frequency}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, frequency: e.target.value as 'daily' | 'weekly' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit">
                  <Bell className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{alert.search_query}</h3>
                    {getFrequencyBadge(alert.frequency)}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(alert.is_active)}
                      <span className="text-sm text-gray-600 capitalize">
                        {alert.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.location || 'Anywhere'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                    {alert.last_sent_at && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Last sent {new Date(alert.last_sent_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>
                      {alert.frequency === 'daily' 
                        ? 'You\'ll receive daily emails with new job matches.'
                        : 'You\'ll receive weekly emails with new job matches.'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleAlert(alert.id)}
                  >
                    {alert.is_active ? 'Pause' : 'Activate'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {alerts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job alerts yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first job alert to get notified about new opportunities.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Better Job Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Use specific keywords</p>
            <p>Instead of "developer", try "React Developer" or "Full Stack Engineer" for more targeted results.</p>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Include location preferences</p>
            <p>Specify cities or "Remote" to get relevant job matches.</p>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Choose the right frequency</p>
            <p>Daily alerts for urgent searches, weekly for broader monitoring.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
