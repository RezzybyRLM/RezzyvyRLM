'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Navigation, 
  Filter, 
  List, 
  Map,
  Clock,
  DollarSign,
  ExternalLink,
  Star
} from 'lucide-react'
import { locationService, LocationData, JobLocation } from '@/lib/location/service'
import LocationPicker from '@/components/ui/location-picker'

interface GeoJobManagerProps {
  jobs: JobLocation[]
  onJobsFiltered: (filteredJobs: JobLocation[]) => void
  userLocation?: LocationData
}

export default function GeoJobManager({
  jobs,
  onJobsFiltered,
  userLocation
}: GeoJobManagerProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(userLocation || null)
  const [searchLocation, setSearchLocation] = useState('')
  const [maxDistance, setMaxDistance] = useState(50)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [filteredJobs, setFilteredJobs] = useState<JobLocation[]>(jobs)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)

  useEffect(() => {
    // Load stored location on mount
    const storedLocation = locationService.getStoredLocation()
    if (storedLocation) {
      setCurrentLocation(storedLocation)
      setSearchLocation(storedLocation.formattedAddress)
    }
  }, [])

  useEffect(() => {
    filterJobs()
  }, [jobs, currentLocation, searchLocation, maxDistance])

  const filterJobs = () => {
    let filtered = [...jobs]

    if (currentLocation) {
      filtered = locationService.filterJobsByLocation(filtered, currentLocation, maxDistance)
    } else if (searchLocation) {
      // Filter by location string if no coordinates available
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
        job.location.toLowerCase().includes('remote')
      )
    }

    setFilteredJobs(filtered)
    onJobsFiltered(filtered)
  }

  const handleLocationDetected = (location: LocationData) => {
    setCurrentLocation(location)
    setSearchLocation(location.formattedAddress)
  }

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true)
    try {
      const location = await locationService.getCurrentLocation()
      if (location) {
        setCurrentLocation(location)
        setSearchLocation(location.formattedAddress)
        locationService.storeLocation(location)
      }
    } catch (error) {
      console.error('Location detection failed:', error)
    } finally {
      setIsDetectingLocation(false)
    }
  }

  const getDistanceBadge = (job: JobLocation) => {
    if (job.distance !== undefined) {
      return (
        <Badge variant="outline" className="text-xs">
          <Navigation className="h-3 w-3 mr-1" />
          {job.distance} mi
        </Badge>
      )
    }
    return null
  }

  const getLocationTypeBadge = (job: JobLocation) => {
    const location = job.location.toLowerCase()
    if (location.includes('remote')) {
      return <Badge className="bg-green-100 text-green-800">Remote</Badge>
    } else if (location.includes('hybrid')) {
      return <Badge className="bg-blue-100 text-blue-800">Hybrid</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">On-site</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Location Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Distance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <LocationPicker
                value={searchLocation}
                onChange={setSearchLocation}
                onLocationDetected={handleLocationDetected}
                placeholder="Enter location or use current location"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="whitespace-nowrap"
            >
              {isDetectingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Detecting...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use My Location
                </>
              )}
            </Button>
          </div>

          {currentLocation && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>Searching within {maxDistance} miles of {currentLocation.formattedAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Max distance:</label>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={10}>10 miles</option>
                  <option value={25}>25 miles</option>
                  <option value={50}>50 miles</option>
                  <option value={100}>100 miles</option>
                  <option value={200}>200 miles</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredJobs.length} jobs found
          </h3>
          {currentLocation && (
            <Badge variant="outline">
              <Navigation className="h-3 w-3 mr-1" />
              Location-based
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      {job.source === 'premium' && (
                        <Badge className="bg-primary text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {getLocationTypeBadge(job)}
                      {getDistanceBadge(job)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{job.company}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {job.description || 'No description available'}
                    </p>
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    <Button asChild>
                      <a
                        href={job.applyUrl}
                        target={job.source === 'indeed' ? '_blank' : '_self'}
                        rel={job.source === 'indeed' ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-1"
                      >
                        {job.source === 'indeed' ? (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Apply on Indeed
                          </>
                        ) : (
                          'Apply Now'
                        )}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Map View Placeholder */}
      {viewMode === 'map' && (
        <Card>
          <CardContent className="p-12 text-center">
            <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map View</h3>
            <p className="text-gray-600 mb-4">
              Interactive map showing job locations would be integrated here.
            </p>
            <p className="text-sm text-gray-500">
              Consider integrating with Google Maps or Mapbox for full functionality.
            </p>
          </CardContent>
        </Card>
      )}

      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found in this area</h3>
            <p className="text-gray-600 mb-4">
              Try expanding your search radius or searching in a different location.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => setMaxDistance(100)}>
                Expand to 100 miles
              </Button>
              <Button variant="outline" onClick={() => setSearchLocation('Remote')}>
                Search Remote Jobs
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Location Search Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Use precise locations</p>
            <p>Enter specific cities like "San Francisco, CA" for better results.</p>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Try different distances</p>
            <p>Start with 25 miles and expand if you need more options.</p>
          </div>
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Include remote options</p>
            <p>Many jobs offer remote or hybrid work arrangements.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
