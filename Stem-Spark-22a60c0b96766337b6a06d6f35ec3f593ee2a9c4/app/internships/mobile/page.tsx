"use client"

import React from "react"
import { MobilePageWrapper } from "../../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../../components/MobileLayout"
import { Briefcase, MapPin, Clock, DollarSign, Building, Users, Star, Bookmark, Share2, Calendar } from "lucide-react"

export default function MobileInternshipsPage() {
  const internshipCategories = [
    { name: "Software Engineering", count: 45, color: "blue" },
    { name: "Data Science", count: 32, color: "green" },
    { name: "Mechanical Engineering", count: 28, color: "orange" },
    { name: "Biotechnology", count: 19, color: "purple" },
    { name: "Electrical Engineering", count: 36, color: "red" },
    { name: "Research & Development", count: 22, color: "indigo" },
  ]

  const featuredInternships = [
    {
      id: 1,
      title: "Software Engineering Intern",
      company: "TechCorp Solutions",
      location: "San Francisco, CA",
      duration: "3 months",
      salary: "$25/hour",
      type: "Full-time",
      rating: 4.8,
      applicants: 156,
      deadline: "2024-03-15"
    },
    {
      id: 2,
      title: "Data Science Research Intern",
      company: "AI Research Institute",
      location: "Boston, MA",
      duration: "6 months",
      salary: "$30/hour",
      type: "Full-time",
      rating: 4.9,
      applicants: 89,
      deadline: "2024-04-01"
    },
    {
      id: 3,
      title: "Mechanical Engineering Intern",
      company: "Green Energy Corp",
      location: "Austin, TX",
      duration: "4 months",
      salary: "$22/hour",
      type: "Full-time",
      rating: 4.7,
      applicants: 203,
      deadline: "2024-03-30"
    },
    {
      id: 4,
      title: "Biotechnology Lab Intern",
      company: "BioTech Innovations",
      location: "San Diego, CA",
      duration: "5 months",
      salary: "$28/hour",
      type: "Full-time",
      rating: 4.6,
      applicants: 134,
      deadline: "2024-04-15"
    }
  ]

  return (
    <MobilePageWrapper>
      {/* Hero Section */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h1" color="default" align="center" className="mb-4">
            STEM Internships
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Discover amazing opportunities to gain real-world experience in STEM fields
          </MobileText>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search internships, companies, or locations..."
              className="w-full px-4 py-3 pl-12 bg-white/90 backdrop-blur-sm border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Briefcase className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Internship Categories */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Browse by Field
          </MobileText>
          
          <MobileGrid cols={2} gap="md">
            {internshipCategories.map((category, index) => (
              <MobileCard key={index} variant="elevated" interactive>
                <div className="text-center p-4">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-${category.color}-100 flex items-center justify-center`}>
                    <Briefcase className={`w-6 h-6 text-${category.color}-600`} />
                  </div>
                  <MobileText variant="h4" color="primary" className="mb-1">
                    {category.name}
                  </MobileText>
                  <MobileText variant="caption" color="muted">
                    {category.count} positions
                  </MobileText>
                </div>
              </MobileCard>
            ))}
          </MobileGrid>
        </MobileContainer>
      </MobileSection>

      {/* Featured Internships */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Featured Opportunities
          </MobileText>
          
          <div className="space-y-4">
            {featuredInternships.map((internship) => (
              <MobileCard key={internship.id} variant="elevated" interactive>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <MobileText variant="h4" color="primary" className="mb-1 truncate">
                        {internship.title}
                      </MobileText>
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="w-4 h-4 text-gray-500" />
                        <MobileText variant="caption" color="muted" className="truncate">
                          {internship.company}
                        </MobileText>
                      </div>
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
                  
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 truncate">{internship.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{internship.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{internship.salary}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">{internship.type}</span>
                    </div>
                  </div>
                  
                  {/* Stats and Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{internship.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{internship.applicants} applicants</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <MobileButton size="sm" variant="outline">
                        View Details
                      </MobileButton>
                      <MobileButton size="sm" variant="primary">
                        Apply Now
                      </MobileButton>
                    </div>
                  </div>
                  
                  {/* Deadline Warning */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-orange-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Application deadline: {internship.deadline}
                      </span>
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Quick Filters */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Quick Filters
          </MobileText>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <MobileButton variant="outline" fullWidth>
              <MapPin className="w-4 h-4 mr-2" />
              Remote Only
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Clock className="w-4 h-4 mr-2" />
              Summer 2024
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <DollarSign className="w-4 h-4 mr-2" />
              Paid Only
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Star className="w-4 h-4 mr-2" />
              Top Rated
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Application Tips */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Application Tips
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Make your application stand out with these expert tips
          </MobileText>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <MobileText variant="body" color="muted">
                Tailor your resume and cover letter to each specific internship
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <MobileText variant="body" color="muted">
                Highlight relevant projects, coursework, and technical skills
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <MobileText variant="body" color="muted">
                Apply early and follow up with companies after submission
              </MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Ready to Apply?
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Create your profile and start applying to amazing STEM internships
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Browse All Internships
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              Create Profile
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}
