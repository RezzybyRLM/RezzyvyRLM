'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Navigation, 
  Search, 
  X, 
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { locationService, LocationData } from '@/lib/location/service'

interface LocationPickerProps {
  value: string
  onChange: (location: string) => void
  onLocationDetected?: (location: LocationData) => void
  placeholder?: string
  className?: string
}

export default function LocationPicker({
  value,
  onChange,
  onLocationDetected,
  placeholder = "Enter location or use current location",
  className = ""
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState<string | null>(null)
  const [detectedLocation, setDetectedLocation] = useState<LocationData | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load stored location on mount
    const storedLocation = locationService.getStoredLocation()
    if (storedLocation) {
      setDetectedLocation(storedLocation)
      if (!value) {
        onChange(storedLocation.formattedAddress)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue)
    
    if (inputValue.length > 1) {
      const newSuggestions = locationService.getLocationSuggestions(inputValue)
      setSuggestions(newSuggestions)
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleDetectLocation = async () => {
    setIsDetecting(true)
    setDetectionError(null)

    try {
      const location = await locationService.getCurrentLocation()
      
      if (location) {
        setDetectedLocation(location)
        onChange(location.formattedAddress)
        locationService.storeLocation(location)
        onLocationDetected?.(location)
        setIsOpen(false)
      } else {
        setDetectionError('Unable to detect your location. Please check your browser permissions.')
      }
    } catch (error) {
      console.error('Location detection error:', error)
      setDetectionError('Failed to detect location. Please try again or enter manually.')
    } finally {
      setIsDetecting(false)
    }
  }

  const handleClearLocation = () => {
    onChange('')
    setDetectedLocation(null)
    locationService.clearStoredLocation()
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLocation}
              className="h-8 w-8 p-0 mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="h-8 w-8 p-0"
            title="Use current location"
          >
            {isDetecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Detection Error */}
      {detectionError && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{detectionError}</span>
        </div>
      )}

      {/* Detected Location Info */}
      {detectedLocation && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <Check className="h-4 w-4" />
          <span>Using your current location: {detectedLocation.formattedAddress}</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            <div className="py-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <MapPin className="h-3 w-3 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Location Badges */}
      {!value && (
        <div className="mt-2 flex flex-wrap gap-2">
          {['Remote', 'San Francisco, CA', 'New York, NY', 'Austin, TX'].map((location) => (
            <Badge
              key={location}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-white"
              onClick={() => handleSuggestionClick(location)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {location}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
