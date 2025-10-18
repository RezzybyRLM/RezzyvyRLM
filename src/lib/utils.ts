import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return formatDate(d)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function formatSalary(salary: string): string {
  if (!salary) return 'Salary not specified'
  
  // Clean up salary string
  const cleaned = salary.replace(/[^\d,.-]/g, '')
  
  // Try to extract numbers and format
  const numbers = cleaned.match(/\d+/g)
  if (numbers && numbers.length >= 2) {
    const min = parseInt(numbers[0])
    const max = parseInt(numbers[1])
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }
  
  return salary
}

export function getJobTypeColor(jobType: string): string {
  const type = jobType.toLowerCase()
  if (type.includes('full-time')) return 'bg-green-100 text-green-800'
  if (type.includes('part-time')) return 'bg-blue-100 text-blue-800'
  if (type.includes('contract')) return 'bg-purple-100 text-purple-800'
  if (type.includes('remote')) return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-800'
}
