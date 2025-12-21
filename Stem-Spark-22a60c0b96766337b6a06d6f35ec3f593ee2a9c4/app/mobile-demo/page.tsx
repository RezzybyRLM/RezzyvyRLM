"use client"

import React, { useState } from "react"
import { MobilePageWrapper } from "../../components/MobilePageWrapper"
import { MobileLayout, MobileSection, MobileContainer, MobileGrid, MobileCard, MobileButton, MobileText } from "../../components/MobileLayout"
import { MobileHeroSection } from "../../components/MobileHeroSection"

export default function MobileDemoPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <MobilePageWrapper>
      {/* Hero Section Demo */}
      <MobileHeroSection onWatchDemo={() => setIsVideoModalOpen(true)} />
      
      {/* Component Showcase */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h1" color="primary" align="center" className="mb-8">
            Mobile Components Showcase
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-12">
            Explore all the mobile-optimized components and their variations
          </MobileText>
        </MobileContainer>
      </MobileSection>

      {/* Layout Components Demo */}
      <MobileSection background="gray" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-8">
            Layout Components
          </MobileText>
          
          <MobileGrid cols={2} gap="lg">
            <MobileCard variant="elevated" interactive>
              <MobileText variant="h3" color="primary">MobileLayout</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Responsive container with configurable padding and max-width options
              </MobileText>
            </MobileCard>
            
            <MobileCard variant="elevated" interactive>
              <MobileText variant="h3" color="primary">MobileSection</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Section wrapper with background options and responsive padding
              </MobileText>
            </MobileCard>
            
            <MobileCard variant="elevated" interactive>
              <MobileText variant="h3" color="primary">MobileContainer</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Centered container with size options and centering control
              </MobileText>
            </MobileCard>
            
            <MobileCard variant="elevated" interactive>
              <MobileText variant="h3" color="primary">MobileGrid</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Responsive grid system with configurable columns and gaps
              </MobileText>
            </MobileCard>
          </MobileGrid>
        </MobileContainer>
      </MobileSection>

      {/* Button Components Demo */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-8">
            Button Components
          </MobileText>
          
          <MobileGrid cols={1} gap="md">
            <div className="space-y-4">
              <MobileText variant="h4" color="muted">Primary Buttons</MobileText>
              <div className="flex flex-wrap gap-4">
                <MobileButton size="sm">Small</MobileButton>
                <MobileButton size="md">Medium</MobileButton>
                <MobileButton size="lg">Large</MobileButton>
              </div>
            </div>
            
            <div className="space-y-4">
              <MobileText variant="h4" color="muted">Button Variants</MobileText>
              <div className="flex flex-wrap gap-4">
                <MobileButton variant="primary">Primary</MobileButton>
                <MobileButton variant="secondary">Secondary</MobileButton>
                <MobileButton variant="outline">Outline</MobileButton>
                <MobileButton variant="ghost">Ghost</MobileButton>
              </div>
            </div>
            
            <div className="space-y-4">
              <MobileText variant="h4" color="muted">Full Width Buttons</MobileText>
              <MobileButton fullWidth>Full Width Button</MobileButton>
            </div>
            
            <div className="space-y-4">
              <MobileText variant="h4" color="muted">Loading State</MobileText>
              <MobileButton loading>Loading Button</MobileButton>
            </div>
          </MobileGrid>
        </MobileContainer>
      </MobileSection>

      {/* Card Components Demo */}
      <MobileSection background="blue" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-8">
            Card Components
          </MobileText>
          
          <MobileGrid cols={2} gap="lg">
            <MobileCard variant="default" interactive>
              <MobileText variant="h4" color="primary">Default Card</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Standard card with border and hover effects
              </MobileText>
            </MobileCard>
            
            <MobileCard variant="elevated" interactive>
              <MobileText variant="h4" color="primary">Elevated Card</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Card with shadow and enhanced hover effects
              </MobileText>
            </MobileCard>
            
            <MobileCard variant="outlined" interactive>
              <MobileText variant="h4" color="primary">Outlined Card</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Card with prominent border styling
              </MobileText>
            </MobileCard>
            
            <MobileCard variant="filled" interactive>
              <MobileText variant="h4" color="primary">Filled Card</MobileText>
              <MobileText variant="body" color="muted" className="mt-2">
                Card with background fill and subtle styling
              </MobileText>
            </MobileCard>
          </MobileGrid>
        </MobileContainer>
      </MobileSection>

      {/* Typography Demo */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="default" align="center" className="mb-8">
            Typography System
          </MobileText>
          
          <div className="space-y-6">
            <div>
              <MobileText variant="h1" color="primary">Heading 1</MobileText>
              <MobileText variant="caption" color="muted">Large, bold heading for main titles</MobileText>
            </div>
            
            <div>
              <MobileText variant="h2" color="default">Heading 2</MobileText>
              <MobileText variant="caption" color="muted">Medium heading for section titles</MobileText>
            </div>
            
            <div>
              <MobileText variant="h3" color="secondary">Heading 3</MobileText>
              <MobileText variant="caption" color="muted">Small heading for subsections</MobileText>
            </div>
            
            <div>
              <MobileText variant="body" color="default">Body text for main content</MobileText>
              <MobileText variant="caption" color="muted">Standard body text with good readability</MobileText>
            </div>
            
            <div>
              <MobileText variant="caption" color="muted">Caption text for small details</MobileText>
            </div>
            
            <div>
              <MobileText variant="label" color="primary">Label text for form elements</MobileText>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Responsive Grid Demo */}
      <MobileSection background="gradient" padding="large">
        <MobileContainer size="xl">
          <MobileText variant="h2" color="default" align="center" className="mb-8">
            Responsive Grid System
          </MobileText>
          
          <div className="space-y-8">
            <div>
              <MobileText variant="h4" color="muted" className="mb-4">1 Column (Mobile)</MobileText>
              <MobileGrid cols={1} gap="md">
                {[1, 2, 3].map((i) => (
                  <MobileCard key={i} variant="default">
                    <MobileText variant="h4" color="primary">Grid Item {i}</MobileText>
                    <MobileText variant="body" color="muted">Single column layout on mobile</MobileText>
                  </MobileCard>
                ))}
              </MobileGrid>
            </div>
            
            <div>
              <MobileText variant="h4" color="muted" className="mb-4">2 Columns (Tablet+)</MobileText>
              <MobileGrid cols={2} gap="md">
                {[1, 2, 3, 4].map((i) => (
                  <MobileCard key={i} variant="elevated">
                    <MobileText variant="h4" color="primary">Grid Item {i}</MobileText>
                    <MobileText variant="body" color="muted">Two column layout on tablet and up</MobileText>
                  </MobileCard>
                ))}
              </MobileGrid>
            </div>
            
            <div>
              <MobileText variant="h4" color="muted" className="mb-4">3 Columns (Desktop+)</MobileText>
              <MobileGrid cols={3} gap="md">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <MobileCard key={i} variant="outlined">
                    <MobileText variant="h4" color="primary">Grid Item {i}</MobileText>
                    <MobileText variant="body" color="muted">Three column layout on desktop</MobileText>
                  </MobileCard>
                ))}
              </MobileGrid>
            </div>
          </div>
        </MobileContainer>
      </MobileSection>

      {/* Call to Action */}
      <MobileSection background="white" padding="large">
        <MobileContainer size="lg" centered>
          <MobileText variant="h2" color="primary" align="center" className="mb-4">
            Ready to Use Mobile Components?
          </MobileText>
          <MobileText variant="body" color="muted" align="center" className="mb-8">
            All components are fully responsive and optimized for mobile devices
          </MobileText>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton size="lg" variant="primary">
              Get Started
            </MobileButton>
            <MobileButton size="lg" variant="outline">
              Learn More
            </MobileButton>
          </div>
        </MobileContainer>
      </MobileSection>
    </MobilePageWrapper>
  )
}
