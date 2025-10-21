'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface JobApplication {
  id: string
  user_id: string
  job_id: string | null
  job_source: 'indeed' | 'premium' | 'external'
  job_title: string
  company_name: string
  application_url: string
  application_date: string
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  notes: string | null
  metadata: any
  created_at: string
  updated_at: string
}

export async function saveJobApplication(data: {
  job_id?: string
  job_source: 'indeed' | 'premium' | 'external'
  job_title: string
  company_name: string
  application_url: string
  status?: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
  notes?: string
  metadata?: any
}): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase as any)
    .from('job_applications')
    .insert({
      user_id: user.id,
      job_id: data.job_id || null,
      job_source: data.job_source,
      job_title: data.job_title,
      company_name: data.company_name,
      application_url: data.application_url,
      status: data.status || 'applied',
      notes: data.notes || null,
      metadata: data.metadata || {}
    })

  if (error) {
    throw new Error(`Failed to save job application: ${error.message}`)
  }

  revalidatePath('/profile')
}

export async function getJobApplications(): Promise<JobApplication[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await (supabase as any)
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('application_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch job applications: ${error.message}`)
  }

  return data || []
}

export async function updateJobApplicationStatus(
  applicationId: string,
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
): Promise<void> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await (supabase as any)
    .from('job_applications')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to update job application: ${error.message}`)
  }

  revalidatePath('/profile')
}

