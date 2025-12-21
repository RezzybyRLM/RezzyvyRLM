"use client"

import React from "react"
import { MobilePageWrapper } from "../../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../../components/MobileLayout"
import { Play, Clock, Star, Download, Share2, Bookmark, Eye } from "lucide-react"

export default function MobileVideosPage() {
  const videoCategories = [
    { name: "STEM Fundamentals", count: 24, color: "blue" },
    { name: "Advanced Mathematics", count: 18, color: "green" },
    { name: "Computer Science", count: 32, color: "purple" },
    { name: "Engineering", count: 15, color: "orange" },
    { name: "Physics", count: 22, color: "red" },
    { name: "Chemistry", count: 19, color: "indigo" },
  ]

  const featuredVideos = [
    {
      id: 1,
      title: "Introduction to Quantum Computing",
      duration: "12:34",
      views: "2.4K",
      rating: 4.8,
      thumbnail: "/api/placeholder/300/200",
      category: "Computer Science"
    },
    {
      id: 2,
      title: "Calculus Made Simple",
      duration: "18:22",
      views: "1.8K",
      rating: 4.9,
      thumbnail: "/api/placeholder/300/200",
      category: "Advanced Mathematics"
    },
    {
      id: 3,
      title: "The Future of Renewable Energy",
      duration: "15:45",
      views: "3.1K",
      rating: 4.7,
      thumbnail: "/api/placeholder/300/200",
      category: "Engineering"
    },
    {
      id: 4,
      title: "Understanding DNA Structure",
      duration: "20:18",
      views: "1.5K",
      rating: 4.6,
      thumbnail: "/api/placeholder/300/200",
      category: "Chemistry"
    }
  ]

  return (
    <MobilePageWrapper>
      {/* Hero Section */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h1" color="default" align="center" className="mb-4">
            Video Learning Library
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Access thousands of STEM videos, tutorials, and educational content
          </MobileText>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search videos, topics, or instructors..."
              className="w-full px-4 py-3 pl-12 bg-white/90 backdrop-blur-sm border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Play className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Video Categories */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Browse by Category
          </MobileText>
          
          <MobileGrid cols={2} gap="md">
            {videoCategories.map((category, index) => (
              <MobileCard key={index} variant="elevated" interactive>
                <div className="text-center p-4">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-${category.color}-100 flex items-center justify-center`}>
                    <Play className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <MobileText variant="h4" color="primary" className="mb-1">
                    {category.name}
                  </MobileText>
                  <MobileText variant="caption" color="muted">
                    {category.count} videos
                  </MobileText>
                </div>
              </MobileCard>
            ))}
          </MobileGrid>
        </MobileContainer>
      </MobileSection>

      {/* Featured Videos */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Featured Videos
          </MobileText>
          
          <div className="space-y-4">
            {featuredVideos.map((video) => (
              <MobileCard key={video.id} variant="elevated" interactive>
                <div className="flex space-x-4">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <div className="w-24 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  
                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <MobileText variant="h4" color="primary" className="mb-1 truncate">
                      {video.title}
                    </MobileText>
                    <MobileText variant="caption" color="muted" className="mb-2">
                      {video.category}
                    </MobileText>
                    
                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{video.views}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{video.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Quick Actions */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Quick Actions
          </MobileText>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <MobileButton variant="primary" fullWidth>
              <Play className="w-4 h-4 mr-2" />
              Watch Latest
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Bookmark className="w-4 h-4 mr-2" />
              My Playlist
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Clock className="w-4 h-4 mr-2" />
              Continue Learning
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Star className="w-4 h-4 mr-2" />
              Favorites
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Start Learning Today
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Join thousands of students already learning with our video library
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Browse All Videos
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              Create Account
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}
