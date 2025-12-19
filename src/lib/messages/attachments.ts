import { createClient } from '@/lib/supabase/server'

export interface MessageAttachment {
  id: string
  message_id: string
  file_url: string
  file_type: string
  file_name: string
  file_size: number | null
  created_at: string
}

/**
 * Upload attachment file to Supabase Storage
 */
export async function uploadMessageAttachment(
  file: File,
  messageId: string,
  userId: string
): Promise<{ url: string; error: string | null }> {
  const supabase = await createClient()

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { url: '', error: 'File size exceeds 5MB limit' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return { url: '', error: 'File type not supported. Please upload images (JPEG, PNG, GIF, WebP) or PDFs.' }
  }

  try {
    // Upload to Supabase Storage
    const fileName = `${userId}/${messageId}/${Date.now()}_${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { url: '', error: uploadError.message || 'Failed to upload file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(uploadData.path)

    // Save attachment record to database
    const { error: dbError } = await supabase
      .from('message_attachments')
      .insert({
        message_id: messageId,
        file_url: publicUrl,
        file_type: file.type,
        file_name: file.name,
        file_size: file.size
      })

    if (dbError) {
      // Try to clean up uploaded file
      await supabase.storage
        .from('message-attachments')
        .remove([uploadData.path])
      
      console.error('Database error:', dbError)
      return { url: '', error: 'Failed to save attachment record' }
    }

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return { url: '', error: 'An unexpected error occurred' }
  }
}

/**
 * Get attachments for a message
 */
export async function getMessageAttachments(messageId: string): Promise<MessageAttachment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('message_attachments')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error getting attachments:', error)
    return []
  }

  return data || []
}

/**
 * Delete an attachment
 */
export async function deleteMessageAttachment(
  attachmentId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Get attachment to verify ownership
  const { data: attachment, error: getError } = await supabase
    .from('message_attachments')
    .select(`
      *,
      message:messages!message_attachments_message_id_fkey(sender_id, conversation_id)
    `)
    .eq('id', attachmentId)
    .single()

  if (getError || !attachment) {
    console.error('Error getting attachment:', getError)
    return false
  }

  // Verify user owns the message
  if (attachment.message.sender_id !== userId) {
    console.error('User does not own this attachment')
    return false
  }

  // Extract file path from URL
  const url = new URL(attachment.file_url)
  const pathParts = url.pathname.split('/')
  const filePath = pathParts.slice(pathParts.indexOf('message-attachments')).join('/')

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('message-attachments')
    .remove([filePath])

  if (storageError) {
    console.error('Error deleting from storage:', storageError)
    // Continue to delete from database anyway
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('message_attachments')
    .delete()
    .eq('id', attachmentId)

  if (dbError) {
    console.error('Error deleting attachment:', dbError)
    return false
  }

  return true
}

