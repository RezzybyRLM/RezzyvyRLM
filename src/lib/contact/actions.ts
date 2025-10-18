'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ContactFormData {
  name: string
  email: string
  subject?: string
  message: string
}

export async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await (supabase as any)
      .from('contact_messages')
      .insert({
        name: data.name,
        email: data.email,
        subject: data.subject || '',
        message: data.message
      })

    if (error) {
      console.error('Contact form submission error:', error)
      return { success: false, error: 'Failed to submit message. Please try again.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Contact form submission error:', error)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getContactMessages(): Promise<any[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData as any).role !== 'admin') {
    throw new Error('Access denied. Admin role required.')
  }

  const { data, error } = await (supabase as any)
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch contact messages: ${error.message}`)
  }

  return data || []
}

export async function updateContactMessageStatus(id: string, status: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userData || (userData as any).role !== 'admin') {
    throw new Error('Access denied. Admin role required.')
  }

  const { error } = await (supabase as any)
    .from('contact_messages')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update contact message: ${error.message}`)
  }

  revalidatePath('/admin')
}
