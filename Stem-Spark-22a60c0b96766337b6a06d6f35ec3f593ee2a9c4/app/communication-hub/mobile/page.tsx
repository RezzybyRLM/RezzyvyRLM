"use client"

import React from "react"
import { MobilePageWrapper } from "../../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../../components/MobileLayout"
import { MessageSquare, Users, Hash, Bell, Search, Plus, Video, Phone, MoreHorizontal, Star, Clock } from "lucide-react"

export default function MobileCommunicationHubPage() {
  const channels = [
    { name: "General Discussion", members: 1247, unread: 3, type: "public" },
    { name: "Homework Help", members: 892, unread: 0, type: "public" },
    { name: "Project Collaboration", members: 456, unread: 7, type: "public" },
    { name: "Study Groups", members: 234, unread: 1, type: "public" },
    { name: "Career Advice", members: 567, unread: 0, type: "public" },
    { name: "Tech News", members: 789, unread: 2, type: "public" },
  ]

  const recentMessages = [
    {
      id: 1,
      user: "Sarah Chen",
      avatar: "/api/placeholder/40/40",
      message: "Has anyone worked with the new React 18 features?",
      time: "2 min ago",
      channel: "General Discussion",
      unread: true
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      avatar: "/api/placeholder/40/40",
      message: "I need help with calculus integration by parts...",
      time: "15 min ago",
      channel: "Homework Help",
      unread: false
    },
    {
      id: 3,
      user: "Emily Watson",
      avatar: "/api/placeholder/40/40",
      message: "Great session today! Thanks everyone for the help.",
      time: "1 hour ago",
      channel: "Study Groups",
      unread: false
    },
    {
      id: 4,
      user: "Alex Thompson",
      avatar: "/api/placeholder/40/40",
      message: "Anyone interested in forming a robotics team?",
      time: "2 hours ago",
      channel: "Project Collaboration",
      unread: true
    }
  ]

  const onlineUsers = [
    { name: "Sarah Chen", status: "online", avatar: "/api/placeholder/40/40" },
    { name: "Mike Rodriguez", status: "online", avatar: "/api/placeholder/40/40" },
    { name: "Emily Watson", status: "away", avatar: "/api/placeholder/40/40" },
    { name: "Alex Thompson", status: "online", avatar: "/api/placeholder/40/40" },
    { name: "David Kim", status: "online", avatar: "/api/placeholder/40/40" },
    { name: "Lisa Park", status: "offline", avatar: "/api/placeholder/40/40" }
  ]

  return (
    <MobilePageWrapper>
      {/* Hero Section */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h1" color="default" align="center" className="mb-4">
            Communication Hub
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Connect, collaborate, and learn with fellow STEM students
          </MobileText>
          
          {/* Search Bar */}
          <div className="relative w-full max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search messages, users, or channels..."
              className="w-full px-4 py-3 pl-12 bg-white/90 backdrop-blur-sm border-2 border-white/30 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Quick Actions */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-6">
            Quick Actions
          </MobileText>
          
          <div className="grid grid-cols-2 gap-4">
            <MobileButton variant="primary" fullWidth>
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Hash className="w-4 h-4 mr-2" />
              Join Channel
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Video className="w-4 h-4 mr-2" />
              Start Call
            </MobileButton>
            <MobileButton variant="outline" fullWidth>
              <Users className="w-4 h-4 mr-2" />
              Create Group
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Channels */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <div className="flex items-center justify-between mb-6">
            <MobileText variant="h2" color="default">
              Channels
            </MobileText>
            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {channels.map((channel) => (
              <MobileCard key={channel.name} variant="elevated" interactive>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Hash className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <MobileText variant="h4" color="primary" className="mb-1">
                        {channel.name}
                      </MobileText>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{channel.members} members</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          channel.type === 'public' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {channel.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {channel.unread > 0 && (
                      <div className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {channel.unread}
                      </div>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Recent Messages */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Recent Messages
          </MobileText>
          
          <div className="space-y-3">
            {recentMessages.map((message) => (
              <MobileCard key={message.id} variant="elevated" interactive>
                <div className="flex items-start space-x-3 p-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <MobileText variant="h4" color="primary" className="truncate">
                        {message.user}
                      </MobileText>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{message.time}</span>
                        {message.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    <MobileText variant="body" color="muted" className="mb-2">
                      {message.message}
                    </MobileText>
                    
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Hash className="w-3 h-3" />
                      <span>{message.channel}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Online Users */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" className="mb-6">
            Online Now
          </MobileText>
          
          <div className="grid grid-cols-2 gap-3">
            {onlineUsers.map((user) => (
              <MobileCard key={user.name} variant="default" interactive>
                <div className="flex items-center space-x-3 p-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <MobileText variant="caption" color="primary" className="truncate">
                      {user.name}
                    </MobileText>
                    <MobileText variant="caption" color="muted" className="capitalize">
                      {user.status}
                    </MobileText>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Communication Tips */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Communication Tips
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Make the most of your interactions with these helpful guidelines
          </MobileText>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <MobileText variant="body" color="muted">
                Be respectful and inclusive in all conversations
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <MobileText variant="body" color="muted">
                Use appropriate channels for different types of discussions
              </MobileText>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <MobileText variant="body" color="muted">
                Share knowledge and help others learn and grow
              </MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-4">
            Start Connecting
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-6">
            Join the conversation and build meaningful connections
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Join Community
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              View Guidelines
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}
