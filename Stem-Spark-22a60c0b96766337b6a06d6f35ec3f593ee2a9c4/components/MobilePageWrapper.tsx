"use client"

import React, { useEffect, useState } from 'react';
import { MobileNavigation } from './MobileNavigation';

interface MobilePageWrapperProps {
  children: React.ReactNode;
  className?: string;
  showNavigation?: boolean;
}

export const MobilePageWrapper: React.FC<MobilePageWrapperProps> = ({ 
  children, 
  className = '',
  showNavigation = true 
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Check if device is mobile
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile version
  if (isMobile) {
    return (
      <div className={`min-h-screen bg-white relative overflow-x-hidden ${className}`}>
        {/* Mobile mode indicator - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-0 left-0 right-0 z-[60] bg-green-500 text-white text-xs text-center py-1 font-mono">
            📱 MOBILE MODE ACTIVE - Screen: {screenWidth}px
          </div>
        )}
        
        {/* Mobile-optimized navigation */}
        {showNavigation && <MobileNavigation />}
        
        {/* Main Content - Mobile-first layout */}
        <main className="pt-0">
          {children}
        </main>
      </div>
    );
  }

  // Desktop version
  return (
    <div className={`min-h-screen bg-white relative overflow-x-hidden ${className}`}>
      {/* Desktop mode indicator - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-blue-500 text-white text-xs text-center py-1 font-mono">
          🖥️ DESKTOP MODE ACTIVE - Screen: {screenWidth}px
        </div>
      )}
      
      {/* Main Content */}
      <main className="pt-0">
        {children}
      </main>
    </div>
  );
};

// Hook for scroll to top functionality
export const useScrollToTop = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
};

// Hook for mobile detection
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, screenWidth };
};
