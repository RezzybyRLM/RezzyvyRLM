'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StartConversationButtonProps {
  otherUserId: string
  otherUserName?: string
  jobTitle?: string
  companyName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function StartConversationButton({
  otherUserId,
  otherUserName,
  jobTitle,
  companyName,
  variant = 'outline',
  size = 'default'
}: StartConversationButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleStartConversation = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (user.id === otherUserId) {
        alert('You cannot start a conversation with yourself')
        return
      }

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId })
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/messages?conversation=${data.conversationId}`)
      } else {
        alert('Failed to start conversation')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleStartConversation}
      disabled={loading}
      variant={variant}
      size={size}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {loading ? 'Starting...' : 'Message'}
    </Button>
  )
}

