import React, { useState, useEffect } from 'react';
import { Logo } from './logo';
import { Menu, X, LogIn, Play, GraduationCap, Users, MessageSquare, Calendar, Trophy, Briefcase, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

export const MobileNavigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();

    // Check if guest mode is active
    const guestModeActive = sessionStorage.getItem('guestMode') === 'true';
    setGuestMode(guestModeActive);

    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGuestMode = () => {
    setGuestMode(true);
    sessionStorage.setItem('guestMode', 'true');
    setIsMenuOpen(false);
  };

  const handleGuestLogout = () => {
    setGuestMode(false);
    sessionStorage.removeItem('guestMode');
    setIsMenuOpen(false);
  };

  const handleGuestFeature = (feature: string) => {
    if (!guestMode) {
      handleGuestMode();
    }
    window.location.href = `/guest/${feature}`;
    setIsMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo variant="nav" />
          </Link>

          {/* Mobile menu button */}
          <button
            className={`p-2 rounded-lg transition-colors ${
              isScrolled 
                ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-100' 
                : 'text-white hover:text-blue-200 hover:bg-white/10'
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300">
            <div className="flex flex-col h-full">
              {/* Menu header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Core Navigation */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</h3>
                  <Link
                    href="/videos"
                    className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Play className="w-5 h-5" />
                    <span className="font-medium">Videos</span>
                  </Link>
                  <Link
                    href="/internships"
                    className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Briefcase className="w-5 h-5" />
                    <span className="font-medium">Internships</span>
                  </Link>
                  <Link
                    href="/communication-hub"
                    className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-medium">Community</span>
                  </Link>
                  <Link
                    href="/learning-path"
                    className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span className="font-medium">Learning</span>
                  </Link>
                  <Link
                    href="/ai-tutor"
                    className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Users className="w-5 h-5" />
                    <span className="font-medium">AI Tutor</span>
                  </Link>
                </div>

                {/* Guest Features */}
                {guestMode && (
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Try Features</h3>
                    <button
                      onClick={() => handleGuestFeature('dashboard')}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Student Dashboard</span>
                    </button>
                    <button
                      onClick={() => handleGuestFeature('tutoring')}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-green-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Tutoring Sessions</span>
                    </button>
                    <button
                      onClick={() => handleGuestFeature('messaging')}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-purple-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Messaging System</span>
                    </button>
                    <button
                      onClick={() => handleGuestFeature('calendar')}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-orange-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Calendar & Events</span>
                    </button>
                    <button
                      onClick={() => handleGuestFeature('competitions')}
                      className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-yellow-50 rounded-lg transition-colors border border-gray-200"
                    >
                      <Trophy className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium">Competitions</span>
                    </button>
                  </div>
                )}

                {/* Authentication */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  {guestMode ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <span className="text-xs text-blue-700 bg-blue-100 px-3 py-2 rounded-full font-medium">
                          Guest Mode Active
                        </span>
                      </div>
                      <button
                        onClick={handleGuestLogout}
                        className="w-full border border-red-300 text-red-600 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors font-medium"
                      >
                        Exit Guest Mode
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href="/login" className="block">
                        <button className="w-full flex items-center justify-center space-x-2 border border-blue-600 text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                          <LogIn className="w-4 h-4" />
                          <span>Sign In</span>
                        </button>
                      </Link>
                      <button
                        onClick={handleGuestMode}
                        className="w-full border border-gray-300 text-gray-600 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Try as Guest
                      </button>
                      <Link href="/signup" className="block">
                        <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg">
                          Get Started
                        </button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
