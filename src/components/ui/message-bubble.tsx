'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, CheckCheck, Reply, MoreVertical, Image as ImageIcon } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface MessageBubbleProps {
  message: {
    id: string
    sender_id: string
    content: string
    is_read: boolean
    created_at: string
    reply_to_message_id?: string | null
    attachment_url?: string | null
    attachment_type?: string | null
    is_edited?: boolean
    edited_at?: string | null
    sender: {
      full_name: string | null
      email: string
      phone_number?: string | null
    }
    reply_to?: {
      id: string
      content: string
      sender: {
        full_name: string | null
        email: string
      }
    } | null
    attachments?: Array<{
      id: string
      file_url: string
      file_type: string
      file_name: string
    }>
  }
  isOwn: boolean
  onReply?: (messageId: string) => void
  formatTime: (date: string) => string
}

export function MessageBubble({ message, isOwn, onReply, formatTime }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        isOwn
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-900'
      }`}>
        {/* Reply context */}
        {message.reply_to && (
          <div className={`mb-2 pl-3 border-l-2 ${
            isOwn ? 'border-white/30' : 'border-gray-400'
          }`}>
            <p className={`text-xs font-medium mb-1 ${
              isOwn ? 'text-white/80' : 'text-gray-600'
            }`}>
              Replying to {message.reply_to.sender.full_name || message.reply_to.sender.email.split('@')[0]}
            </p>
            <p className={`text-xs truncate ${
              isOwn ? 'text-white/70' : 'text-gray-500'
            }`}>
              {message.reply_to.content}
            </p>
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>
                {attachment.file_type.startsWith('image/') ? (
                  <img
                    src={attachment.file_url}
                    alt={attachment.file_name}
                    className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                    onClick={() => window.open(attachment.file_url, '_blank')}
                  />
                ) : (
                  <a
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-2 rounded ${
                      isOwn ? 'bg-white/20' : 'bg-gray-200'
                    } hover:opacity-80 transition-opacity`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm truncate">{attachment.file_name}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy attachment_url support */}
        {message.attachment_url && !message.attachments && (
          <div className="mb-2">
            {message.attachment_type?.startsWith('image/') ? (
              <img
                src={message.attachment_url}
                alt="Attachment"
                className="max-w-full max-h-64 rounded-lg object-cover cursor-pointer"
                onClick={() => window.open(message.attachment_url!, '_blank')}
              />
            ) : (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 p-2 rounded ${
                  isOwn ? 'bg-white/20' : 'bg-gray-200'
                } hover:opacity-80 transition-opacity`}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm">View attachment</span>
              </a>
            )}
          </div>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Edit indicator */}
        {message.is_edited && (
          <p className={`text-xs mt-1 ${
            isOwn ? 'text-white/70' : 'text-gray-500'
          }`}>
            (edited)
          </p>
        )}

        {/* Footer with time and read receipt */}
        <div className={`flex items-center gap-1 mt-1 text-xs ${
          isOwn ? 'text-white/70' : 'text-gray-500'
        }`}>
          <span>{formatTime(message.created_at)}</span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>

        {/* Action buttons (on hover) */}
        {!isOwn && onReply && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(message.id)}
              className="h-6 px-2 text-xs"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

