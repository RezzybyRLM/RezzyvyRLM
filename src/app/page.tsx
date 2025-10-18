'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Hero Image */}
        <div className="mb-12">
          <div className="relative w-64 h-64 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-2xl"></div>
            <div className="relative w-full h-full bg-white rounded-full shadow-2xl flex items-center justify-center">
              <div className="text-8xl">🎨</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            New Site Coming Soon
          </h1>
          
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary mx-auto mb-8 rounded-full"></div>
          
          <div className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            <p className="mb-4">
              We're working hard to bring you an amazing new experience.
            </p>
            <p className="text-primary font-semibold">
              Mad Designer at work! 🚀
            </p>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-6 mb-12">
            <a 
              href="https://facebook.com/RezzybyRLM" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
            >
              <span className="text-xl">📘</span>
            </a>
            <a 
              href="https://twitter.com/RezzybyRLM" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
            >
              <span className="text-xl">🐦</span>
            </a>
            <a 
              href="https://youtube.com/RezzybyRLM" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
            >
              <span className="text-xl">📺</span>
            </a>
            <a 
              href="https://instagram.com/RezzybyRLM" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
            >
              <span className="text-xl">📷</span>
            </a>
          </div>

          {/* Admin Login */}
          <div className="text-center">
            <Link 
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span className="text-xl mr-2">🔐</span>
              Admin Login
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-primary/20 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute top-1/3 right-10 w-20 h-20 bg-secondary/20 rounded-full blur-xl animate-bounce delay-500"></div>
    </div>
  )
}