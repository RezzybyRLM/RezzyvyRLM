import { IndeedJob, TransformedJob } from '@/lib/types/indeed-job'
import { generateSlug } from '@/lib/utils'

export function transformIndeedJob(indeedJob: IndeedJob, searchQuery: string): TransformedJob {
  return {
    id: generateSlug(`${indeedJob.jobTitle}-${indeedJob.company}-${indeedJob.location}`),
    title: indeedJob.jobTitle,
    company_name: indeedJob.company,
    location: indeedJob.location,
    description: indeedJob.summary,
    apply_url: indeedJob.url,
    salary_range: indeedJob.salary,
    job_type: indeedJob.jobType,
    source: 'indeed',
    scraped_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    search_query: searchQuery,
    indeed_job_id: indeedJob.indeedJobId,
  }
}

export function transformIndeedJobs(indeedJobs: IndeedJob[], searchQuery: string): TransformedJob[] {
  return indeedJobs.map(job => transformIndeedJob(job, searchQuery))
}

export function validateIndeedJob(job: any): job is IndeedJob {
  return (
    job &&
    typeof job.jobTitle === 'string' &&
    typeof job.company === 'string' &&
    typeof job.location === 'string' &&
    typeof job.summary === 'string' &&
    typeof job.url === 'string' &&
    job.jobTitle.length > 0 &&
    job.company.length > 0 &&
    job.location.length > 0 &&
    job.summary.length > 0 &&
    job.url.length > 0
  )
}

export function sanitizeJobData(job: IndeedJob): IndeedJob {
  return {
    ...job,
    jobTitle: job.jobTitle.trim(),
    company: job.company.trim(),
    location: job.location.trim(),
    summary: job.summary.trim(),
    url: job.url.trim(),
    salary: job.salary?.trim(),
    jobType: job.jobType?.trim(),
    postedDate: job.postedDate?.trim(),
    indeedJobId: job.indeedJobId?.trim(),
  }
}
