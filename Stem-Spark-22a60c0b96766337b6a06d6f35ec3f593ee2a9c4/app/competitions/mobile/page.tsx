"use client"

import React, { useState } from "react"
import { MobilePageWrapper } from "../../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../../components/MobileLayout"
import { Trophy, Calendar, Users, Award, Star, Clock, MapPin, Target, TrendingUp, Filter, Search, Bookmark, Share2 } from "lucide-react"

export default function MobileCompetitionsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const competitionCategories = [
    { id: "all", name: "All", count: 24, color: "gray" },
    { id: "hackathon", name: "Hackathons", count: 8, color: "blue" },
    { id: "robotics", name: "Robotics", count: 6, color: "green" },
    { id: "math", name: "Mathematics", count: 5, color: "purple" },
    { id: "science", name: "Science Fair", count: 4, color: "orange" },
    { id: "engineering", name: "Engineering", count: 3, color: "red" }
  ]

  const featuredCompetitions = [
    {
      id: 1,
      title: "AI Innovation Challenge 2024",
      category: "hackathon",
      description: "Build the next breakthrough AI application",
      prize: "$50,000",
      participants: 1247,
      deadline: "2024-04-15",
      difficulty: "Advanced",
      location: "Virtual + San Francisco",
      rating: 4.9,
      isFeatured: true,
      tags: ["AI/ML", "Innovation", "High Prize"]
    },
    {
      id: 2,
      title: "Robotics Design Competition",
      category: "robotics",
      description: "Design and build autonomous robots for real-world challenges",
      prize: "$25,000",
      participants: 892,
      deadline: "2024-05-01",
      difficulty: "Intermediate",
      location: "Boston, MA",
      rating: 4.8,
      isFeatured: true,
      tags: ["Robotics", "Hardware", "Autonomous"]
    },
    {
      id: 3,
      title: "Mathematical Olympiad",
      category: "math",
      description: "Solve complex mathematical problems and prove theorems",
      prize: "$15,000",
      participants: 567,
      deadline: "2024-03-30",
      difficulty: "Advanced",
      location: "Virtual",
      rating: 4.7,
      isFeatured: true,
      tags: ["Mathematics", "Problem Solving", "Academic"]
    }
  ]

  const upcomingCompetitions = [
    {
      id: 4,
      title: "Web Development Sprint",
      category: "hackathon",
      description: "Build modern web applications in 48 hours",
      prize: "$10,000",
      participants: 234,
      deadline: "2024-06-15",
      difficulty: "Beginner",
      location: "Virtual",
      rating: 4.6,
      tags: ["Web Dev", "Full-Stack", "Beginner Friendly"]
    },
    {
      id: 5,
      title: "Environmental Science Project",
      category: "science",
      description: "Create solutions for environmental challenges",
      prize: "$8,000",
      participants: 189,
      deadline: "2024-07-01",
      difficulty: "Intermediate",
      location: "Virtual + Washington DC",
      rating: 4.5,
      tags: ["Environment", "Sustainability", "Research"]
    },
    {
      id: 6,
      title: "Circuit Design Challenge",
      category: "engineering",
      description: "Design efficient electronic circuits",
      prize: "$12,000",
      participants: 156,
      deadline: "2024-05-20",
      difficulty: "Intermediate",
      location: "Austin, TX",
      rating: 4.4,
      tags: ["Electronics", "Circuit Design", "Hardware"]
    }
  ]

  const filteredCompetitions = [...featuredCompetitions, ...upcomingCompetitions].filter(comp => {
    const matchesCategory = selectedCategory === "all" || comp.category === selectedCategory
    const matchesSearch = comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         comp.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner": return "bg-green-100 text-green-700"
      case "intermediate": return "bg-yellow-100 text-yellow-700"
      case "advanced": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getCategoryColor = (category: string) => {
    const cat = competitionCategories.find(c => c.id === category)
    if (!cat) return "bg-gray-100 text-gray-700"
    
    switch (cat.color) {
      case "blue": return "bg-blue-100 text-blue-700"
      case "green": return "bg-green-100 text-green-700"
      case "purple": return "bg-purple-100 text-purple-700"
      case "orange": return "bg-orange-100 text-orange-700"
      case "red": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <MobilePageWrapper>
      {/* Hero Section */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="lg" centered>
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <MobileText variant="h1" color="default" align="center" className="mb-4">
              STEM Competitions
            </MobileText>
            <MobileText variant="body" color="muted" align="center">
              Compete, innovate, and win amazing prizes
            </MobileText>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/90 backdrop-blur-sm border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Category Filters */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <div className="flex items-center justify-between mb-6">
            <MobileText variant="h2" color="default">
              Categories
            </MobileText>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Filter className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {competitionCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Featured Competitions */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Featured Competitions
          </MobileText>
          
          <div className="space-y-4">
            {featuredCompetitions.map((competition) => (
              <MobileCard key={competition.id} variant="elevated" interactive>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(competition.category)}`}>
                          {competitionCategories.find(c => c.id === competition.category)?.name}
                        </span>
                        {competition.isFeatured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <MobileText variant="h4" color="primary" className="mb-2">
                        {competition.title}
                      </MobileText>
                      <MobileText variant="body" color="muted" className="mb-3">
                        {competition.description}
                      </MobileText>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Prize and Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700 font-medium">{competition.prize}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700">{competition.participants} participants</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="text-gray-700 truncate">{competition.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(competition.difficulty)}`}>
                        {competition.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {competition.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Actions and Deadline */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{competition.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Deadline: {competition.deadline}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <MobileButton size="sm" variant="outline">
                        View Details
                      </MobileButton>
                      <MobileButton size="sm" variant="primary">
                        Join Now
                      </MobileButton>
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Upcoming Competitions */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Upcoming Competitions
          </MobileText>
          
          <div className="space-y-4">
            {upcomingCompetitions.map((competition) => (
              <MobileCard key={competition.id} variant="elevated" interactive>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(competition.category)}`}>
                        {competitionCategories.find(c => c.id === competition.category)?.name}
                      </span>
                      <MobileText variant="h4" color="primary" className="mb-1">
                        {competition.title}
                      </MobileText>
                      <MobileText variant="body" color="muted" className="mb-2">
                        {competition.description}
                      </MobileText>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{competition.prize}</div>
                      <div className="text-gray-500">Prize</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{competition.participants}</div>
                      <div className="text-gray-500">Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-purple-600">{competition.rating}</div>
                      <div className="text-gray-500">Rating</div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Deadline: {competition.deadline}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <MobileButton size="sm" variant="outline">
                        Details
                      </MobileButton>
                      <MobileButton size="sm" variant="primary">
                        Register
                      </MobileButton>
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Competition Tips */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Tips for Success
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Maximize your chances of winning with these strategies
          </MobileText>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <MobileText variant="body" color="muted">
                Start early and plan your project thoroughly before coding
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <MobileText variant="body" color="muted">
                Focus on solving real problems with innovative solutions
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <MobileText variant="body" color="muted">
                Practice presenting your work clearly and confidently
              </MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Ready to Compete?
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Join thousands of students competing in STEM challenges
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Browse All Competitions
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              Get Notifications
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}
