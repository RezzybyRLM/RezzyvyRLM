'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  CheckCheck, 
  Reply, 
  MoreVertical, 
  Image as ImageIcon, 
  Forward,
  Edit,
  Trash2,
  Smile,
  X
} from 'lucide-react'
import { formatTime } from '@/lib/utils'

const REACTIONS = ['👍', '❤️', '😄', '😮', '😢', '😡']

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
    is_deleted?: boolean
    deleted_at?: string | null
    reactions?: Record<string, string[]>
    image_caption?: string | null
    file_caption?: string | null
    forwarded_from_id?: string | null
    read_by?: string[]
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
  currentUserId: string
  onReply?: (messageId: string) => void
  onForward?: (messageId: string) => void
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  onReaction?: (messageId: string, reaction: string) => void
  formatTime: (date: string) => string
}

export function MessageBubble({ 
  message, 
  isOwn, 
  currentUserId,
  onReply, 
  onForward, 
  onEdit,
  onDelete,
  onReaction,
  formatTime 
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const handleEdit = async () => {
    if (onEdit && editContent.trim() && editContent !== message.content) {
      await onEdit(message.id, editContent)
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (onDelete && confirm('Are you sure you want to delete this message?')) {
      await onDelete(message.id)
    }
  }

  const handleReaction = (reaction: string) => {
    if (onReaction) {
      onReaction(message.id, reaction)
    }
    setShowReactionPicker(false)
  }

  // Get all reactions for this message
  const allReactions = message.reactions 
    ? Object.entries(message.reactions).flatMap(([userId, reactions]) => 
        reactions.map(reaction => ({ userId, reaction }))
      )
    : []

  // Group reactions by emoji
  const reactionGroups = allReactions.reduce((acc, { reaction }) => {
    acc[reaction] = (acc[reaction] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Check if current user has reacted
  const userReactions = message.reactions?.[currentUserId] || []

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
        <div className={`max-w-[70%] rounded-lg p-3 ${
          isOwn
            ? 'bg-gray-300 text-gray-500'
            : 'bg-gray-200 text-gray-500'
        }`}>
          <p className="text-sm italic">[Message deleted]</p>
          <div className={`flex items-center gap-1 mt-1 text-xs ${
            isOwn ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.deleted_at || message.created_at)}</span>
          </div>
        </div>
      </div>
    )
  }

  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setShowContextMenu(true)
  }

  // Close context menu when clicking outside
  useEffect(() => {
    if (showContextMenu) {
      const handleClickOutside = () => setShowContextMenu(false)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showContextMenu])

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 relative`}>
      <div 
        className={`max-w-[40%] rounded-lg p-1.5 text-sm ${
          isOwn
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
        onContextMenu={handleContextMenu}
      >
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

        {/* Forwarded indicator */}
        {message.forwarded_from_id && (
          <div className={`mb-2 text-xs ${
            isOwn ? 'text-white/70' : 'text-gray-500'
          }`}>
            ↪ Forwarded
          </div>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-1.5 space-y-1.5">
            {message.attachments.map((attachment) => (
              <div key={attachment.id}>
                {attachment.file_type.startsWith('image/') ? (
                  <div>
                    <img
                      src={attachment.file_url}
                      alt={attachment.file_name}
                      className="max-w-full max-h-48 rounded object-cover cursor-pointer"
                      onClick={() => window.open(attachment.file_url, '_blank')}
                    />
                    {message.image_caption && (
                      <p className={`text-xs mt-0.5 ${
                        isOwn ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {message.image_caption}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
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
                    {message.file_caption && (
                      <p className={`text-xs mt-1 ${
                        isOwn ? 'text-white/80' : 'text-gray-600'
                      }`}>
                        {message.file_caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy attachment_url support */}
        {message.attachment_url && (!message.attachments || message.attachments.length === 0) && (
          <div className="mb-1.5">
            {message.attachment_type?.startsWith('image/') ? (
              <div>
                <img
                  src={message.attachment_url}
                  alt="Attachment"
                  className="max-w-full max-h-48 rounded object-cover cursor-pointer"
                  onClick={() => window.open(message.attachment_url!, '_blank')}
                />
                {message.image_caption && (
                  <p className={`text-xs mt-0.5 ${
                    isOwn ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {message.image_caption}
                  </p>
                )}
              </div>
            ) : (
              <div>
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
                {message.file_caption && (
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    {message.file_caption}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full p-2 rounded text-sm ${
                isOwn ? 'bg-white/20 text-white' : 'bg-white text-gray-900'
              }`}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEdit}
                className="h-6 px-2 text-xs"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(message.content)
                }}
                className="h-6 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        )}

        {/* Edit indicator */}
        {message.is_edited && !isEditing && (
          <p className={`text-xs mt-1 ${
            isOwn ? 'text-white/70' : 'text-gray-500'
          }`}>
            (edited)
          </p>
        )}

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(reactionGroups).map(([reaction, count]) => (
              <button
                key={reaction}
                onClick={() => handleReaction(reaction)}
                className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                  userReactions.includes(reaction)
                    ? isOwn 
                      ? 'bg-white/30 text-white' 
                      : 'bg-primary/20 text-primary'
                    : isOwn
                      ? 'bg-white/20 text-white/80'
                      : 'bg-gray-200 text-gray-700'
                } hover:opacity-80 transition-opacity`}
              >
                <span>{reaction}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer with time and read receipt */}
        <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${
          isOwn ? 'text-white/70' : 'text-gray-500'
        }`}>
          <span>{formatTime(message.created_at)}</span>
          {isOwn && (
            message.read_by && message.read_by.length > 0 ? (
              <CheckCheck className="h-2.5 w-2.5 text-blue-400" />
            ) : message.is_read ? (
              <CheckCheck className="h-2.5 w-2.5 text-gray-400" />
            ) : (
              <Check className="h-2.5 w-2.5 text-gray-400" />
            )
          )}
        </div>

        {/* Context menu (right-click) */}
        {showContextMenu && (
          <div 
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]"
            style={{ 
              left: `${contextMenuPosition.x}px`, 
              top: `${contextMenuPosition.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onReaction && (
              <button
                onClick={() => {
                  setShowReactionPicker(!showReactionPicker)
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Smile className="h-3.5 w-3.5" />
                React
              </button>
            )}
            {showReactionPicker && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10 border border-gray-200">
                {REACTIONS.map((reaction) => (
                  <button
                    key={reaction}
                    onClick={() => {
                      handleReaction(reaction)
                      setShowReactionPicker(false)
                      setShowContextMenu(false)
                    }}
                    className="text-lg hover:scale-125 transition-transform p-1"
                  >
                    {reaction}
                  </button>
                ))}
              </div>
            )}
            {onReply && (
              <button
                onClick={() => {
                  onReply(message.id)
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Reply className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            {onForward && (
              <button
                onClick={() => {
                  onForward(message.id)
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Forward className="h-3.5 w-3.5" />
                Forward
              </button>
            )}
            {isOwn && onEdit && !isEditing && (
              <button
                onClick={() => {
                  setIsEditing(true)
                  setEditContent(message.content)
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={() => {
                  handleDelete()
                  setShowContextMenu(false)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
