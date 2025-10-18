import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          There was an error verifying your email. This could be due to:
        </p>
        <ul className="text-left text-sm text-gray-600 mb-6 space-y-2">
          <li>• The verification link has expired</li>
          <li>• The link has already been used</li>
          <li>• The link is invalid or corrupted</li>
        </ul>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/auth/login">Try Signing In</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/register">Register Again</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
