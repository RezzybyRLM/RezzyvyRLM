export interface IndeedJob {
  jobTitle: string
  company: string
  location: string
  summary: string
  url: string
  salary?: string
  jobType?: string
  postedDate?: string
  indeedJobId?: string
}

export interface TransformedJob {
  id: string
  title: string
  company_name: string
  location: string
  description: string
  apply_url: string
  salary_range?: string
  job_type?: string
  source: 'indeed' | 'premium'
  scraped_at?: string
  expires_at?: string
  search_query?: string
  indeed_job_id?: string
}

export interface JobSearchParams {
  position: string
  location?: string
  country?: string
  maxItems?: number
  date?: string
}

export interface ApifyScraperConfig {
  position: string
  country: string
  location?: string
  maxItems: number
  date: string
}
