import { createClient } from '@/lib/supabase/server'

export interface CoverLetter {
  id: string
  user_id: string
  profile_id: string | null
  file_name: string
  file_url: string
  file_size: number | null
  file_type: string | null
  content_text: string | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

export async function getCoverLetters(userId: string, profileId?: string): Promise<CoverLetter[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('cover_letters')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (profileId) {
    query = query.eq('profile_id', profileId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch cover letters: ${error.message}`)
  }

  return data || []
}

export async function deleteCoverLetter(coverLetterId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  // Verify ownership
  const { data: coverLetter, error: fetchError } = await supabase
    .from('cover_letters')
    .select('user_id, file_url')
    .eq('id', coverLetterId)
    .single()

  if (fetchError || !coverLetter) {
    throw new Error('Cover letter not found or access denied')
  }

  const coverLetterData = coverLetter as { user_id: string; file_url: string }

  if (coverLetterData.user_id !== userId) {
    throw new Error('Cover letter not found or access denied')
  }

  // Delete from storage (extract path from URL)
  const urlParts = coverLetterData.file_url.split('/cover-letters/')
  if (urlParts.length > 1) {
    const filePath = urlParts[1]
    await supabase.storage
      .from('cover-letters')
      .remove([filePath])
  }

  // Delete from database
  const { error } = await supabase
    .from('cover_letters')
    .delete()
    .eq('id', coverLetterId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete cover letter: ${error.message}`)
  }
}

export async function setActiveCoverLetter(coverLetterId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  // Set all cover letters to inactive
  await (supabase as any)
    .from('cover_letters')
    .update({ is_active: false })
    .eq('user_id', userId)

  // Set selected cover letter to active
  const { error } = await (supabase as any)
    .from('cover_letters')
    .update({ is_active: true })
    .eq('id', coverLetterId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to set active cover letter: ${error.message}`)
  }
}

