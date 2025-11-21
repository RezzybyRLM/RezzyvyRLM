/**
 * Seed Data Script
 * 
 * This script populates the database with test data for development and testing.
 * Run with: npx tsx scripts/seed-data.ts
 * 
 * Note: This requires environment variables to be set up for Supabase.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedData() {
  console.log('🌱 Starting seed data script...\n')

  try {
    // Create test companies
    console.log('Creating test companies...')
    const { data: company1, error: company1Error } = await supabase
      .from('companies')
      .insert({
        name: 'TechCorp Inc.',
        description: 'A leading technology company focused on innovation and growth.',
        website: 'https://techcorp.example.com',
        industry: 'Technology',
        size: '51-200',
        location: 'San Francisco, CA',
      })
      .select()
      .single()

    if (company1Error) {
      console.error('Error creating company 1:', company1Error)
    } else {
      console.log('✓ Created company:', company1.name)
    }

    const { data: company2, error: company2Error } = await supabase
      .from('companies')
      .insert({
        name: 'BuildRight Construction',
        description: 'Professional construction services for commercial and residential projects.',
        website: 'https://buildright.example.com',
        industry: 'Construction',
        size: '11-50',
        location: 'Austin, TX',
      })
      .select()
      .single()

    if (company2Error) {
      console.error('Error creating company 2:', company2Error)
    } else {
      console.log('✓ Created company:', company2.name)
    }

    // Create test jobs
    console.log('\nCreating test jobs...')
    if (company1) {
      const jobs = [
        {
          title: 'Senior Software Engineer',
          description: 'We are looking for an experienced software engineer to join our team. You will work on cutting-edge projects and help shape the future of technology.',
          company_id: company1.id,
          location: 'San Francisco, CA',
          salary_range: '$120,000 - $180,000',
          job_type: 'Full-time',
          is_featured: true,
          featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          requirements: ['5+ years experience', 'JavaScript/TypeScript', 'React', 'Node.js'],
          benefits: ['Health Insurance', '401k Matching', 'Remote Work', 'Professional Development'],
          tags: ['engineering', 'full-stack', 'react', 'node'],
        },
        {
          title: 'Product Manager',
          description: 'Join our product team to drive innovation and deliver exceptional user experiences.',
          company_id: company1.id,
          location: 'Remote',
          salary_range: '$100,000 - $140,000',
          job_type: 'Full-time',
          is_featured: false,
          expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          requirements: ['3+ years product management', 'Agile/Scrum', 'Analytics'],
          benefits: ['Health Insurance', '401k Matching', 'Remote Work'],
          tags: ['product', 'management', 'remote'],
        },
        {
          title: 'UX Designer',
          description: 'Create beautiful and intuitive user experiences for our products.',
          company_id: company1.id,
          location: 'New York, NY',
          salary_range: '$80,000 - $120,000',
          job_type: 'Full-time',
          is_featured: true,
          featured_until: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          requirements: ['3+ years UX design', 'Figma', 'User Research'],
          benefits: ['Health Insurance', '401k Matching', 'Flexible Hours'],
          tags: ['design', 'ux', 'ui'],
        },
      ]

      for (const job of jobs) {
        const { error: jobError } = await supabase
          .from('jobs')
          .insert(job)

        if (jobError) {
          console.error('Error creating job:', jobError)
        } else {
          console.log('✓ Created job:', job.title)
        }
      }
    }

    if (company2) {
      const constructionJobs = [
        {
          title: 'Construction Site Manager',
          description: 'Oversee construction projects and ensure quality and safety standards.',
          company_id: company2.id,
          location: 'Austin, TX',
          salary_range: '$60,000 - $90,000',
          job_type: 'Full-time',
          is_featured: false,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          requirements: ['5+ years construction experience', 'OSHA certification', 'Project management'],
          benefits: ['Health Insurance', 'Paid Time Off'],
          tags: ['construction', 'management', 'onsite'],
        },
        {
          title: 'Safety Coordinator',
          description: 'Ensure workplace safety and compliance with safety regulations.',
          company_id: company2.id,
          location: 'Austin, TX',
          salary_range: '$50,000 - $70,000',
          job_type: 'Full-time',
          is_featured: false,
          expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          requirements: ['Safety certification', 'Construction experience'],
          benefits: ['Health Insurance', '401k'],
          tags: ['safety', 'construction', 'compliance'],
        },
      ]

      for (const job of constructionJobs) {
        const { error: jobError } = await supabase
          .from('jobs')
          .insert(job)

        if (jobError) {
          console.error('Error creating job:', jobError)
        } else {
          console.log('✓ Created job:', job.title)
        }
      }
    }

    // Create cached Indeed jobs (sample data)
    console.log('\nCreating sample Indeed jobs...')
    const indeedJobs = [
      {
        title: 'Software Developer',
        company: 'TechStart Solutions',
        location: 'Seattle, WA',
        description: 'Join our growing team of developers working on innovative software solutions.',
        apply_url: 'https://indeed.com/viewjob?jk=123456',
        salary: '$90,000 - $130,000',
        job_type: 'Full-time',
        search_query: 'software engineer',
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: 'Construction Worker',
        company: 'Build Masters',
        location: 'Dallas, TX',
        description: 'Experienced construction worker needed for commercial projects.',
        apply_url: 'https://indeed.com/viewjob?jk=123457',
        salary: '$40,000 - $60,000',
        job_type: 'Full-time',
        search_query: 'construction worker',
        scraped_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    for (const job of indeedJobs) {
      const { error: jobError } = await supabase
        .from('cached_indeed_jobs')
        .insert(job)

      if (jobError) {
        console.error('Error creating Indeed job:', jobError)
      } else {
        console.log('✓ Created Indeed job:', job.title)
      }
    }

    console.log('\n✅ Seed data script completed successfully!')
    console.log('\nNote: User profiles, resumes, and applications should be created through the application UI.')
    console.log('The seed data includes:')
    console.log('- 2 Companies (TechCorp Inc., BuildRight Construction)')
    console.log('- 5 Jobs (3 tech jobs, 2 construction jobs)')
    console.log('- 2 Sample Indeed jobs')
  } catch (error) {
    console.error('❌ Error running seed script:', error)
    process.exit(1)
  }
}

// Run the seed script
seedData()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

