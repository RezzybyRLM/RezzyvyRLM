import { createClient } from '@/lib/supabase/server'

export interface ApplicationReceived {
  id: string
  job_id: string
  job_title: string
  applicant_user_id: string
  applicant_name: string
  applicant_email: string
  resume_id: string | null
  resume_url: string | null
  cover_letter_id: string | null
  cover_letter_url: string | null
  status: string
  notes: string | null
  applied_at: string
  created_at: string
}

export async function getApplicationsForEmployer(
  userId: string,
  companyId: string,
  filters?: {
    jobId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }
): Promise<ApplicationReceived[]> {
  const supabase = await createClient()

  // Get all jobs for this company
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .eq('company_id', companyId)

  if (!jobs || jobs.length === 0) {
    return []
  }

  const jobIds = jobs.map(j => j.id)

  // Build query
  let query = supabase
    .from('job_applications_received')
    .select('*')
    .in('job_id', jobIds)
    .order('applied_at', { ascending: false })

  if (filters?.jobId) {
    query = query.eq('job_id', filters.jobId)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.dateFrom) {
    query = query.gte('applied_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('applied_at', filters.dateTo)
  }

  const { data: applications, error } = await query

  if (error || !applications) {
    return []
  }

  // Get applicant details and job titles
  const applicantIds = [...new Set(applications.map(a => a.applicant_user_id))]
  const { data: applicants } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', applicantIds)

  const applicantMap = new Map(
    applicants?.map(a => [a.id, { name: a.full_name || 'Unknown', email: a.email }]) || []
  )

  const jobMap = new Map(jobs.map(j => [j.id, j.title]))

  // Get resume and cover letter URLs
  const resumeIds = applications.map(a => a.resume_id).filter(Boolean) as string[]
  const coverLetterIds = applications.map(a => a.cover_letter_id).filter(Boolean) as string[]

  const { data: resumes } = await supabase
    .from('resumes')
    .select('id, file_url')
    .in('id', resumeIds)

  const { data: coverLetters } = await supabase
    .from('cover_letters')
    .select('id, file_url')
    .in('id', coverLetterIds)

  const resumeMap = new Map(resumes?.map(r => [r.id, r.file_url]) || [])
  const coverLetterMap = new Map(coverLetters?.map(c => [c.id, c.file_url]) || [])

  // Map to ApplicationReceived format
  return applications.map(app => {
    const applicant = applicantMap.get(app.applicant_user_id) || { name: 'Unknown', email: '' }
    
    return {
      id: app.id,
      job_id: app.job_id,
      job_title: jobMap.get(app.job_id) || 'Unknown Job',
      applicant_user_id: app.applicant_user_id,
      applicant_name: applicant.name,
      applicant_email: applicant.email,
      resume_id: app.resume_id,
      resume_url: app.resume_id ? resumeMap.get(app.resume_id) || null : null,
      cover_letter_id: app.cover_letter_id,
      cover_letter_url: app.cover_letter_id ? coverLetterMap.get(app.cover_letter_id) || null : null,
      status: app.status || 'pending',
      notes: app.notes,
      applied_at: app.applied_at || app.created_at || '',
      created_at: app.created_at || '',
    }
  })
}

export async function updateApplicationStatus(
  applicationId: string,
  status: string,
  notes?: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('job_applications_received')
    .update({
      status,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`)
  }
}

export async function addApplicationNotes(
  applicationId: string,
  notes: string
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('job_applications_received')
    .update({
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) {
    throw new Error(`Failed to add notes: ${error.message}`)
  }
}

