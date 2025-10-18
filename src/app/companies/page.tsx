'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Building2, MapPin, Users, Star } from 'lucide-react'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  logo_url?: string
  website?: string
  description?: string
  location?: string
  industry?: string
  size?: string
  rating?: number
  job_count?: number
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockCompanies: Company[] = [
      {
        id: '1',
        name: 'Google',
        logo_url: '/logos/google.png',
        website: 'https://google.com',
        description: 'A multinational technology company specializing in Internet-related services and products.',
        location: 'Mountain View, CA',
        industry: 'Technology',
        size: '100,000+',
        rating: 4.5,
        job_count: 150
      },
      {
        id: '2',
        name: 'Microsoft',
        logo_url: '/logos/microsoft.png',
        website: 'https://microsoft.com',
        description: 'A multinational technology corporation that develops, manufactures, licenses, supports and sells computer software.',
        location: 'Redmond, WA',
        industry: 'Technology',
        size: '100,000+',
        rating: 4.3,
        job_count: 120
      },
      {
        id: '3',
        name: 'Apple',
        logo_url: '/logos/apple.png',
        website: 'https://apple.com',
        description: 'A multinational technology company that designs, develops, and sells consumer electronics.',
        location: 'Cupertino, CA',
        industry: 'Technology',
        size: '50,000+',
        rating: 4.4,
        job_count: 80
      }
    ]
    
    setTimeout(() => {
      setCompanies(mockCompanies)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Top Companies
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover amazing companies and find your next career opportunity
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {company.location}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {company.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary">{company.industry}</Badge>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    {company.size}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-sm font-medium">{company.rating}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {company.job_count} jobs
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/jobs?company=${company.name}`}>
                      View Jobs
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={company.website || '#'} target="_blank">
                      Visit Website
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No companies found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
