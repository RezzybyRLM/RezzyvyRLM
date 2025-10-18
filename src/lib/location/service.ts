export interface LocationData {
  latitude: number
  longitude: number
  city: string
  state: string
  country: string
  formattedAddress: string
  accuracy: number
}

export interface JobLocation {
  id: string
  title: string
  company: string
  location: string
  latitude?: number
  longitude?: number
  distance?: number
  applyUrl: string
  salary?: string
  source: 'indeed' | 'premium'
}

export class LocationService {
  private static instance: LocationService
  private userLocation: LocationData | null = null
  private watchId: number | null = null

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
  }

  async requestLocationPermission(): Promise<boolean> {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser')
      return false
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: '', // Will be populated by reverse geocoding
            state: '',
            country: '',
            formattedAddress: '',
            accuracy: position.coords.accuracy,
          }
          resolve(true)
        },
        (error) => {
          console.error('Error getting location:', error)
          resolve(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      )
    })
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    if (this.userLocation) {
      return this.userLocation
    }

    const hasPermission = await this.requestLocationPermission()
    if (hasPermission && this.userLocation) {
      // Reverse geocode to get city/state info
      await this.reverseGeocode(this.userLocation.latitude, this.userLocation.longitude)
    }

    return this.userLocation
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<LocationData | null> {
    try {
      // Using a free reverse geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }

      const data = await response.json()
      
      if (this.userLocation) {
        this.userLocation.city = data.city || data.locality || ''
        this.userLocation.state = data.principalSubdivision || ''
        this.userLocation.country = data.countryName || ''
        this.userLocation.formattedAddress = `${data.city || data.locality}, ${data.principalSubdivision}`
      }

      return this.userLocation
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    return Math.round(distance * 10) / 10 // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  async geocodeAddress(address: string): Promise<LocationData | null> {
    try {
      // Using a free geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/forward-geocode-client?query=${encodeURIComponent(address)}&localityLanguage=en`
      )
      
      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        return {
          latitude: result.latitude,
          longitude: result.longitude,
          city: result.locality || '',
          state: result.principalSubdivision || '',
          country: result.countryName || '',
          formattedAddress: result.formattedAddress || address,
          accuracy: 100, // Default accuracy for geocoded addresses
        }
      }

      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  filterJobsByLocation(
    jobs: JobLocation[], 
    userLocation: LocationData, 
    maxDistance: number = 50
  ): JobLocation[] {
    return jobs
      .map(job => {
        if (job.latitude && job.longitude) {
          const distance = this.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            job.latitude,
            job.longitude
          )
          return { ...job, distance }
        }
        return job
      })
      .filter(job => {
        if (job.distance !== undefined) {
          return job.distance <= maxDistance
        }
        // If no coordinates, check if location string contains user's city
        return job.location.toLowerCase().includes(userLocation.city.toLowerCase()) ||
               job.location.toLowerCase().includes('remote')
      })
      .sort((a, b) => {
        // Sort by distance (if available) or alphabetically
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance
        }
        return a.title.localeCompare(b.title)
      })
  }

  getLocationSuggestions(query: string): string[] {
    // Common location suggestions
    const commonLocations = [
      'San Francisco, CA',
      'New York, NY',
      'Los Angeles, CA',
      'Chicago, IL',
      'Austin, TX',
      'Seattle, WA',
      'Boston, MA',
      'Denver, CO',
      'Remote',
      'Hybrid',
      'On-site',
    ]

    return commonLocations.filter(location =>
      location.toLowerCase().includes(query.toLowerCase())
    )
  }

  startLocationTracking(callback: (location: LocationData) => void): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported')
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: '',
          state: '',
          country: '',
          formattedAddress: '',
          accuracy: position.coords.accuracy,
        }

        await this.reverseGeocode(location.latitude, location.longitude)
        callback(location)
      },
      (error) => {
        console.error('Location tracking error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }

  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  getStoredLocation(): LocationData | null {
    try {
      const stored = localStorage.getItem('userLocation')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error reading stored location:', error)
    }
    return null
  }

  storeLocation(location: LocationData): void {
    try {
      localStorage.setItem('userLocation', JSON.stringify(location))
    } catch (error) {
      console.error('Error storing location:', error)
    }
  }

  clearStoredLocation(): void {
    try {
      localStorage.removeItem('userLocation')
    } catch (error) {
      console.error('Error clearing stored location:', error)
    }
  }
}

export const locationService = LocationService.getInstance()
