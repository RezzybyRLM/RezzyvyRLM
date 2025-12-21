import React from 'react';
import { Logo } from './logo';
import { GraduationCap, Play, ArrowRight, Sparkles, Rocket, Target } from 'lucide-react';
import Link from 'next/link';

interface MobileHeroSectionProps {
  onWatchDemo: () => void;
}

export const MobileHeroSection: React.FC<MobileHeroSectionProps> = ({ onWatchDemo }) => {
  return (
    <section className="relative h-32 sm:h-80 md:h-72 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 overflow-hidden">
      {/* Mobile-optimized background with subtle patterns */}
      <div className="absolute inset-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/90 via-purple-600/85 to-indigo-800/90"></div>
        
        {/* Mobile-optimized floating elements */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
        
        {/* Mobile-optimized geometric patterns - Fixed positioning to prevent swapping */}
        <div className="absolute top-6 right-4 w-6 h-6 sm:top-20 sm:right-4 sm:w-16 sm:h-16 border border-white/10 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-12 left-6 w-4 h-4 sm:bottom-40 sm:left-6 sm:w-12 sm:h-12 border border-white/10 rotate-45 animate-pulse"></div>
        <div className="absolute top-1/8 left-8 w-3 h-3 sm:top-1/3 sm:left-8 sm:w-8 sm:h-8 border border-white/10 rounded-full animate-bounce"></div>
      </div>

      {/* Mobile-first content layout - Much more compact for vertical phones */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-3 sm:px-4 pt-2 sm:pt-8 pb-1 sm:pb-4">
        
        {/* Mobile-optimized logo section - Much smaller for vertical */}
        <div className="mb-1 sm:mb-3 flex justify-center w-full">
          <div className="relative">
            {/* Glow effect optimized for mobile */}
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl opacity-40 animate-pulse"></div>
            <Logo variant="mega" className="relative z-10 w-8 h-8 sm:w-20 sm:h-20 md:w-24 md:h-24 drop-shadow-2xl" />
          </div>
        </div>

        {/* Mobile-optimized main heading - Much more compact for vertical */}
        <div className="text-center mb-1 sm:mb-3 w-full">
          <h1 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white mb-0.5 sm:mb-2">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              Novakinetix
            </span>
          </h1>
          <h2 className="text-xs sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight text-white">
            <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">
              Academy
            </span>
          </h2>
        </div>

        {/* Mobile-optimized tagline - Much more compact for vertical */}
        <p className="text-xs sm:text-base md:text-lg lg:text-xl font-semibold mb-1 sm:mb-2 text-center text-blue-100 leading-tight px-2 w-full">
          Empowering Future{' '}
          <span className="text-yellow-300 font-bold">Innovators</span>
        </p>

        {/* Mobile-optimized description - Hidden on vertical phones to save space */}
        <p className="text-xs sm:text-sm md:text-base lg:text-lg text-blue-100 text-center mb-2 sm:mb-4 max-w-xs sm:max-w-sm md:max-w-md leading-relaxed px-2 hidden sm:block w-full">
          Join the next generation of technology leaders through cutting-edge STEM education, 
          hands-on learning experiences, and real-world applications.
        </p>

        {/* Mobile-optimized feature highlights - Much more compact for vertical */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-2 sm:mb-4 w-full max-w-xs sm:max-w-sm">
          <div className="flex flex-col items-center justify-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-2 border border-white/20 min-w-0">
            <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-300 flex-shrink-0" />
            <span className="text-xs text-white font-medium text-center truncate">Innovation</span>
          </div>
          <div className="flex flex-col items-center justify-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-2 border border-white/20 min-w-0">
            <Rocket className="w-2 h-2 sm:w-3 sm:h-3 text-green-300 flex-shrink-0" />
            <span className="text-xs text-white font-medium text-center truncate">Growth</span>
          </div>
          <div className="flex flex-col items-center justify-center space-y-0.5 bg-white/10 backdrop-blur-sm rounded-lg p-1 sm:p-2 border border-white/20 min-w-0">
            <Target className="w-2 h-2 sm:w-3 sm:h-3 text-red-300 flex-shrink-0" />
            <span className="text-xs text-white font-medium text-center truncate">Success</span>
          </div>
        </div>

        {/* Mobile-optimized call-to-action buttons - Much more compact for vertical */}
        <div className="flex flex-col space-y-1 sm:space-y-2 w-full max-w-xs sm:max-w-sm">
          {/* Primary CTA - Much more compact for vertical */}
          <Link href="/signup" className="w-full">
            <button className="group relative w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 transform active:scale-95 min-h-[28px] sm:min-h-[40px]">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-lg blur opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-1 sm:space-x-2 h-full">
                <GraduationCap className="w-2 h-2 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Start Your Journey</span>
                <ArrowRight className="w-1.5 h-1.5 sm:w-3 sm:h-3 group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" />
              </div>
            </button>
          </Link>

          {/* Secondary CTA - Much more compact for vertical */}
          <button
            onClick={onWatchDemo}
            className="w-full bg-white/15 backdrop-blur-sm border-2 border-white/30 text-white font-semibold px-2 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-white/25 transition-all duration-300 hover:scale-105 transform active:scale-95 min-h-[28px] sm:min-h-[40px]"
          >
            <div className="flex items-center justify-center space-x-1 sm:space-x-2 h-full">
              <Play className="w-2 h-2 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Watch Demo</span>
            </div>
          </button>
        </div>

        {/* Mobile-optimized social proof - Much more compact for vertical */}
        <div className="mt-1 sm:mt-4 text-center w-full">
          <p className="text-xs text-blue-200 mb-0.5">Trusted by students worldwide</p>
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 w-full">
            <div className="text-center min-w-0 flex-1">
              <div className="text-xs font-bold text-white">500+</div>
              <div className="text-xs text-blue-200 truncate">Students</div>
            </div>
            <div className="w-px h-2 sm:h-6 bg-white/20 flex-shrink-0"></div>
            <div className="text-center min-w-0 flex-1">
              <div className="text-xs font-bold text-white">50+</div>
              <div className="text-xs text-blue-200 truncate">Programs</div>
            </div>
            <div className="w-px h-2 sm:h-6 bg-white/20 flex-shrink-0"></div>
            <div className="text-center min-w-0 flex-1">
              <div className="text-xs font-bold text-white">95%</div>
              <div className="text-xs text-blue-200 truncate">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
