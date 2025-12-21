"use client"

import React, { useState, useEffect } from "react"
import { Logo } from "../components/logo"
import { FloatingElements } from "../components/FloatingElements"
import { HeroSection } from "../components/HeroSection"
import { MobileHeroSection } from "../components/MobileHeroSection"
import { ResponsiveNavigation } from "../components/ResponsiveNavigation"
import { StatsSection } from "../components/StatsSection"
import { InternshipGallery } from "../components/InternshipGallery"
import { FeaturesSection } from "../components/FeaturesSection"
import { CTASection } from "../components/CTASection"
import { VideoModal } from "../components/VideoModal"
import { useMobileDetection } from "../components/MobilePageWrapper"

export default function HomePage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { isMobile } = useMobileDetection()

  // Mobile version
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white relative overflow-x-hidden">
        {/* Mobile-optimized navigation */}
        <ResponsiveNavigation />

        {/* Main Content - Mobile-first layout */}
        <main className="pt-0">
          {/* Custom mobile hero section */}
          <MobileHeroSection onWatchDemo={() => setIsVideoModalOpen(true)} />

          {/* Mobile-optimized sections */}
          <div className="px-4 sm:px-6">
            <StatsSection />
            <InternshipGallery />
            <FeaturesSection />
            <CTASection />
          </div>
        </main>

        {/* Video Modal */}
        <VideoModal
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
        />
      </div>
    )
  }

  // Desktop version
  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden">
      <FloatingElements />

      {/* Enhanced Navigation Bar */}
      <ResponsiveNavigation />

      {/* Main Content */}
      <main className="pt-20">
        <HeroSection onWatchDemo={() => setIsVideoModalOpen(true)} />
        <StatsSection />
        <InternshipGallery />
        <FeaturesSection />
        <CTASection />
      </main>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </div>
  )
}
