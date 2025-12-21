"use client"

import React, { useEffect } from 'react';

interface GlobalPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const GlobalPageWrapper: React.FC<GlobalPageWrapperProps> = ({ 
  children, 
  className = '' 
}) => {
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    // Reset scroll position on route change
    const handleRouteChange = () => {
      window.scrollTo(0, 0);
    };
    
    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <div className={`min-h-screen ${className}`}>
      {children}
    </div>
  );
};

// Hook for ensuring pages load at top
export const usePageTop = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
};

// Hook for smooth scrolling to top
export const useSmoothScrollToTop = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };
  
  return scrollToTop;
};
