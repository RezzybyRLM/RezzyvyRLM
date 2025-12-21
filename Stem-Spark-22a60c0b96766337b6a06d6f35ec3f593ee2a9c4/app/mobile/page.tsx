"use client"

import React, { useState } from "react"
import { MobilePageWrapper } from "../../components/MobilePageWrapper"
import { MobileHeroSection } from "../../components/MobileHeroSection"
import { StatsSection } from "../../components/StatsSection"
import { InternshipGallery } from "../../components/InternshipGallery"
import { FeaturesSection } from "../../components/FeaturesSection"
import { CTASection } from "../../components/CTASection"
import { VideoModal } from "../../components/VideoModal"

export default function MobileHomePage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <MobilePageWrapper>
      {/* Custom mobile hero section */}
      <MobileHeroSection onWatchDemo={() => setIsVideoModalOpen(true)} />
      
      {/* Mobile-optimized sections */}
      <div className="px-4 sm:px-6">
        <StatsSection />
        <InternshipGallery />
        <FeaturesSection />
        <CTASection />
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />
    </MobilePageWrapper>
  )
}
