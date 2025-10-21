'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Briefcase, 
  BarChart3, 
  Settings, 
  Plus, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye,
  MousePointer
} from 'lucide-react'

const employerNavItems = [
  {
    name: 'Dashboard',
    href: '/employer',
    icon: BarChart3,
  },
  {
    name: 'Manage Jobs',
    href: '/employer/manage-jobs',
    icon: Briefcase,
  },
  {
    name: 'Analytics',
    href: '/employer/analytics',
    icon: TrendingUp,
  },
  {
    name: 'Company Profile',
    href: '/employer/profile',
    icon: Settings,
  },
]

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={100}
                height={32}
                className="object-contain"
              />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              ×
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {employerNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Rezzy Logo"
                width={100}
                height={32}
                className="object-contain"
              />
            </Link>
          </div>
          <nav className="flex-1 px-4 py-4">
            <ul className="space-y-2">
              {employerNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </Button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Button asChild>
                <Link href="/employer/manage-jobs/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Job
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
