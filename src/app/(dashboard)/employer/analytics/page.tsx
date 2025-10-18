'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye, 
  MousePointer, 
  Users, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalClicks: number
  totalApplications: number
  conversionRate: number
  averageViewsPerJob: number
  topPerformingJobs: Array<{
    id: string
    title: string
    views: number
    clicks: number
    applications: number
    conversionRate: number
  }>
  viewsOverTime: Array<{
    date: string
    views: number
    clicks: number
  }>
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [selectedJob, setSelectedJob] = useState<string>('all')

  useEffect(() => {
    // TODO: Fetch real analytics data from Supabase
    // Mock data for now
    const mockData: AnalyticsData = {
      totalViews: 1247,
      totalClicks: 89,
      totalApplications: 23,
      conversionRate: 25.8,
      averageViewsPerJob: 156,
      topPerformingJobs: [
        {
          id: '1',
          title: 'Senior Software Engineer',
          views: 234,
          clicks: 18,
          applications: 8,
          conversionRate: 44.4,
        },
        {
          id: '2',
          title: 'Product Manager',
          views: 189,
          clicks: 12,
          applications: 5,
          conversionRate: 41.7,
        },
        {
          id: '3',
          title: 'UX Designer',
          views: 156,
          clicks: 8,
          applications: 3,
          conversionRate: 37.5,
        },
      ],
      viewsOverTime: [
        { date: '2024-01-01', views: 45, clicks: 3 },
        { date: '2024-01-02', views: 52, clicks: 4 },
        { date: '2024-01-03', views: 38, clicks: 2 },
        { date: '2024-01-04', views: 61, clicks: 5 },
        { date: '2024-01-05', views: 48, clicks: 3 },
        { date: '2024-01-06', views: 55, clicks: 4 },
        { date: '2024-01-07', views: 42, clicks: 2 },
      ],
      revenue: {
        total: 297,
        thisMonth: 147,
        lastMonth: 150,
        growth: -2.0,
      },
    }
    
    setAnalyticsData(mockData)
    setLoading(false)
  }, [dateRange, selectedJob])

  const handleRefresh = () => {
    setLoading(true)
    // TODO: Implement refresh functionality
    setTimeout(() => setLoading(false), 1000)
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
        <p className="text-gray-600">Start posting jobs to see your analytics here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your job posting performance and ROI</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +15% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +3.2% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">${analyticsData.revenue.total}</div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">${analyticsData.revenue.thisMonth}</div>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${analyticsData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsData.revenue.growth >= 0 ? '+' : ''}{analyticsData.revenue.growth}%
              </div>
              <p className="text-sm text-gray-600">vs Last Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topPerformingJobs.map((job, index) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointer className="h-3 w-3" />
                        {job.clicks} clicks
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {job.applications} applications
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">{job.conversionRate}%</div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Integration with Chart.js or similar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPerformingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{job.title}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${(job.views / analyticsData.topPerformingJobs[0].views) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{job.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Strong Performance</h4>
              <p className="text-sm text-green-700">
                Your job postings are performing 15% above average. Consider increasing your budget for featured placements.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">High View-to-Click Ratio</h4>
              <p className="text-sm text-blue-700">
                Your job titles are attracting attention. Consider optimizing descriptions to improve conversion rates.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
            <Calendar className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900">Peak Performance Times</h4>
              <p className="text-sm text-yellow-700">
                Your jobs get the most views on Tuesdays and Wednesdays. Consider timing your new postings accordingly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
