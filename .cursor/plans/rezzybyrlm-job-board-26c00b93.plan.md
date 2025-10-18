<!-- 26c00b93-384f-43e6-94cc-43bfed396919 60449ba0-e539-40c0-8b0d-e1729edf0bb2 -->
# rezzybyrlm AI Job Aggregator - Implementation Plan

## Overview

Build a full-featured, AI-powered job aggregator that scrapes Indeed listings via Apify and provides AI-powered career tools. The platform aggregates jobs from Indeed while offering unique value through resume optimization, interview preparation, and career coaching features. **Users apply directly on Indeed, not on our platform.**

## IMPORTANT ARCHITECTURAL CHANGE

This is now a **job aggregator**, not a traditional job board:

- Jobs are scraped from Indeed using Apify
- Apply buttons redirect to Indeed (external)
- No internal application system for Indeed jobs
- Employers can still post premium/featured jobs directly (paid)
- Revenue: Premium listings, AI tools subscriptions, donations

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Next.js Project

- Create new Next.js 14+ project with TypeScript, Turbopack, and App Router
- Install dependencies: `tailwindcss@next`, `@supabase/ssr`, `stripe`, `@google/generative-ai`, `apify-client`
- Configure `next.config.mjs` for Vercel deployment optimization
- Set up `tailwind.config.ts` with the custom color palette:
  - Primary Coral: `#FF6B6B`
  - Secondary Dark Brown: `#5D4037`
  - Accent Red: `#D90429`
  - Background: `#F7F7F7`
  - Text: `#212121`

### 1.2 Configure Supabase (Using MCP)

**IMPORTANT: Use Supabase MCP for all database operations during development**

- Use existing Supabase connection from MCP configuration at `.cursor/mcp.json`
- Project ref: `vptsewotbthuklrcamek`
- Initialize Supabase client with environment variables from MCP config
- Create database schema using `mcp_supabase_apply_migration` tool:
  - `users` table (extends auth.users with additional fields: location, preferences)
  - `companies` table (for premium listings: name, logo_url, description, website, created_at)
  - `jobs` table (for premium/featured jobs: title, description, company_id, location, salary_range, is_featured, featured_until, created_at, expires_at)
  - `cached_indeed_jobs` table (title, company, location, description, apply_url, salary, job_type, scraped_at, expires_at, search_query)
  - `resumes` table (user_id, file_name, file_url, content_text, created_at, updated_at)
  - `bookmarks` table (user_id, job_id, source ['indeed'|'premium'], job_snapshot jsonb, created_at)
  - `job_alerts` table (user_id, search_query, location, frequency ['daily'|'weekly'], last_sent_at, is_active)
  - `interview_sessions` table (user_id, job_role, duration, questions jsonb, feedback jsonb, created_at)
  - **`api_usage_tracking` table** (user_id, service ['apify'|'gemini'|'stripe'], endpoint, request_count, cost_estimate, timestamp, metadata jsonb)
  - **`user_plans` table** (user_id, plan_type ['free'|'basic'|'pro'|'enterprise'], stripe_subscription_id, api_quota_remaining, quota_reset_date, created_at, updated_at)
- Set up Row Level Security (RLS) policies using `mcp_supabase_execute_sql`
- Configure Supabase Storage for resume uploads
- Set up Supabase Auth for user authentication

### 1.3 Configure Apify Integration

- Store Apify API token in environment variables
- Create `lib/apify/client.ts` for Apify API calls
- Configure Indeed Scraper actor (https://console.apify.com/actors/hMvNSpz3JnHgl5jkh)
- Set up caching strategy to avoid excessive API calls
- Implement rate limiting and error handling

### 1.4 Set up Internationalization (i18n)

- Install `next-intl` for multi-language support
- Create language files structure: `lib/i18n/locales/[en|es|fr|de]/`
- Configure middleware for locale detection
- Set up translation keys for all UI elements

## Phase 2: Core UI Components

### 2.1 Layout Components

Create in `components/layout/`:

- `Navbar.tsx` - Responsive navigation with logo, search, auth buttons
- `Footer.tsx` - Footer with links, social media (from pagesource.html inspiration)
- `Sidebar.tsx` - Dashboard sidebar for authenticated users

### 2.2 UI Primitives

Create in `components/ui/`:

- `Button.tsx` - Primary, secondary, accent variants
- `Card.tsx` - Job cards (for both Indeed and premium jobs)
- `Input.tsx` - Form inputs with validation styles
- `Select.tsx` - Dropdown selectors
- `Badge.tsx` - For job tags and "Featured" badges
- `SearchBar.tsx` - Hero search component
- `Modal.tsx` - For dialogs and confirmations
- `ExternalLinkButton.tsx` - Special button for Indeed redirects

### 2.3 Extract Logo

- Export logo from `image.png` to `public/images/rezzy-logo.png`
- Create optimized versions (PNG, WebP)
- Implement logo in Navbar component

## Phase 3: Apify/Indeed Integration

### 3.1 Backend API Route (`app/api/fetch-indeed-jobs/route.ts`)

- Accept search parameters (position, location, date range)
- Validate and sanitize input
- **IMPORTANT: Limit maxItems to 10** to control Apify costs and API usage
- Call Apify Indeed Scraper with configuration:
  ```json
  {
    "position": "Software Engineer",
    "country": "us",
    "location": "Austin, TX",
    "maxItems": 10,  // HARD LIMIT: Max 10 jobs per request
    "date": "7"      // Last 7 days for active jobs
  }
  ```

- Wait for actor run completion
- Fetch dataset results (maximum 10 jobs)
- Transform Indeed data to standardized format
- Cache results in Supabase `cached_indeed_jobs` table
- Return JSON to frontend (max 10 jobs)
- Implement pagination on frontend to show cached results across multiple pages

### 3.2 Data Transformation Layer (`lib/apify/transform.ts`)

Map Indeed data to internal format:

- `jobTitle` → `title`
- `company` → `company_name`
- `location` → `location`
- `summary` → `description`
- `url` → `apply_url` (CRITICAL: This is the Indeed external link)
- `salary` → `salary_range`
- `jobType` → `job_type`
- Add `source: "indeed"` flag to distinguish from premium jobs

### 3.3 Scheduled Scraping (Optional)

- Create Vercel Cron Job or Supabase Edge Function
- Run scraper daily for popular searches
- Pre-populate cache with trending positions
- Reduces load time for users

## Phase 4: Public Pages

### 4.1 Home Page (`app/(main)/page.tsx`)

Inspired by pagesource.html structure but redesigned for job aggregator:

- Hero section with large search bar and "EZZY" branding
- Tagline: "Find Your Dream Job + Prepare with AI"
- Featured job listings (mix of Indeed + premium jobs)
- "Why Choose Us" section (AI tools focus)
- Testimonials section
- Company logos carousel
- Call-to-action for AI Interview Pro

### 4.2 Jobs Listing Page (`app/jobs/page.tsx`)

- Search bar with autocomplete
- Advanced filters (location, job type, salary, date posted, source)
- Display Indeed jobs with "Apply on Indeed" external link button
- Display premium jobs with "Featured" badge
- Pagination/infinite scroll
- Map view toggle for geo-based jobs
- Save/bookmark functionality
- Clear visual distinction between Indeed and premium listings

### 4.3 Job Detail Page (`app/jobs/[jobId]/page.tsx`)

**For Indeed Jobs:**

- Full job description from scraped data
- Company info (from Indeed data)
- **"Apply on Indeed" button** - Opens `job.apply_url` in new tab with `target="_blank" rel="noopener noreferrer"`
- AI Resume Suggestion prompt: "Which of your resumes fits this job best?"
- Similar jobs recommendations
- Share functionality
- Bookmark button

**For Premium Jobs:**

- Same layout but "Apply Now" opens internal application form
- Employer contact info

### 4.4 Company Profile Page (`app/companies/[companyId]/page.tsx`)

- Only for companies with premium listings
- Company overview and culture
- All open positions (premium only)
- Company stats and benefits

### 4.5 About & Contact Pages

- `app/(main)/about/page.tsx` - Mission, vision, AI tools focus
- `app/(main)/contact/page.tsx` - Contact form integrated with Supabase

### 4.6 Donation Page (`app/(main)/donate/page.tsx`)

- Stripe Checkout integration
- Preset donation amounts ($5, $10, $25, custom)
- Donation impact messaging: "Help us keep AI tools free for job seekers"
- Thank you confirmation page
- Tax receipt option

## Phase 5: Authentication & User Dashboard

### 5.1 Authentication Setup

- Implement Supabase Auth (email/password, Google OAuth)
- Create auth middleware for protected routes
- Login/Register pages with form validation
- Password reset flow
- Social login buttons

### 5.2 Job Seeker Dashboard (`app/(dashboard)/`)

- `profile/page.tsx` - Edit profile, preferences, location
- `resume-manager/page.tsx` - Upload, manage multiple resumes (PDF, DOCX)
- `bookmarks/page.tsx` - Saved jobs (Both Indeed and premium) with filters
- `job-alerts/page.tsx` - Create/manage custom email alerts
- `interview-sessions/page.tsx` - History of Interview Pro sessions

**Note:** No applications tracking for Indeed jobs (they apply externally)

### 5.3 Employer Dashboard (`app/(dashboard)/`)

**For premium job postings only:**

- `manage-jobs/page.tsx` - Create, edit, delete premium job postings
- `manage-jobs/[jobId]/applications/page.tsx` - View applicants (premium jobs only)
- Company profile editor
- Analytics dashboard (views, clicks, applications)

## Phase 6: AI Features (Core Value Proposition)

### 6.1 Auto Resume Suggest

Location: `lib/ai/resume-matcher.ts`

- Integrate Gemini API
- Function to analyze job description + user's resumes
- Return similarity scores and recommendation
- UI prompt on job detail page: "Which resume should I use?"
- Works for both Indeed and premium jobs

### 6.2 Interview Pro (`app/(dashboard)/interview-pro/page.tsx`)

**Voice-to-Voice Practice Interviews**

Implementation using Web Speech API + Gemini:

1. **Speech Input**: Web Speech API (`webkitSpeechRecognition` or `SpeechRecognition`)
2. **AI Processing**: Send transcript to Gemini API
3. **Speech Output**: Web Speech API (`SpeechSynthesis`)
4. **Flow**:

   - User selects job role/industry
   - Gemini generates interview questions
   - User speaks answer (captured via `SpeechRecognition`)
   - Transcript sent to Gemini for analysis
   - Gemini returns feedback + next question
   - Feedback spoken using `SpeechSynthesis`

Components:

- `InterviewSession.tsx` - Main interview interface
- `VoiceControls.tsx` - Mic toggle, audio visualization
- `FeedbackPanel.tsx` - Display AI feedback
- `SessionHistory.tsx` - Past interview sessions

Create `lib/ai/interview-engine.ts`:

- Initialize Gemini chat session with system prompt
- Generate contextual questions based on job role
- Analyze user responses for content, clarity, confidence
- Provide constructive feedback
- Save session to Supabase

API Route: `app/api/ai/interview/route.ts`

### 6.3 Resume Optimizer (Additional AI Tool)

- AI-powered resume feedback
- ATS optimization suggestions
- Keyword analysis
- Action verb recommendations

### 6.4 Job Alert Intelligence

- Use Gemini for semantic search in job alerts
- Match beyond keywords (skills, experience level)
- Smart notifications

## Phase 7: Employer Features & Payments

### 7.1 Premium Job Posting System

**Why employers would pay:**

- Featured placement at top of search results
- Highlighted with "Featured" badge
- Company branding and logo
- Direct application tracking on platform
- Analytics and insights

Multi-step job creation form:

- Job details (title, description, requirements)
- Rich text editor for descriptions
- Tag selector
- Location (can be remote)
- Salary range (optional)
- Application deadline
- Preview before publish

### 7.2 Stripe Integration

Create `lib/stripe/`:

- `stripe-client.ts` - Initialize Stripe
- `checkout.ts` - Create checkout sessions
- `webhooks.ts` - Handle payment confirmations

Payment flows:

1. **Simple Paid Listing**: $49 for single 30-day job post
2. **Premium Packages**:

   - Basic: $99/month - 3 job posts
   - Pro: $199/month - 10 job posts + featured placement
   - Enterprise: $499/month - Unlimited + priority support

3. **Donations**: One-time contributions
4. **AI Tools Subscription** (Optional): $9.99/month for unlimited Interview Pro

API routes:

- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/stripe/portal/route.ts`

### 7.3 Embeddable Widget (Premium Feature)

- `app/api/widget/[companyId]/route.ts` - JSON endpoint
- Create standalone widget script in `public/widget/`
- Companies get embed code to display their premium jobs on their website
- Styled iframe or JavaScript widget

## Phase 8: Email System

### 8.1 Email Infrastructure

Use Resend or SendGrid with React Email templates

Email types:

- Job alert notifications (daily/weekly digest)
- Password reset
- Account verification
- Bookmark reminders
- Interview Pro session summary
- Premium job posting confirmations (employers)

Create email templates in `lib/emails/templates/`:

- Responsive HTML templates using React Email
- Personalization tokens
- Internationalization support (multiple languages)

### 8.2 Job Alerts Cron

- Set up Vercel Cron Job: `app/api/cron/job-alerts/route.ts`
- Run daily at 9 AM user's local time
- Query Supabase for user alert preferences
- Fetch new Indeed jobs matching criteria (use cache + fresh scrape)
- Send personalized email with job recommendations
- Unsubscribe link in footer

## Phase 9: Advanced Features

### 9.1 User Locator

- Request browser geolocation permission
- Store user's approximate location (city-level, privacy-conscious)
- Auto-populate search with nearby jobs
- Distance calculator for job listings
- "Remote" filter option

### 9.2 Smart Caching Strategy

**Indeed API is expensive - cache aggressively:**

- Cache scraping results in `cached_indeed_jobs` table
- Set TTL (Time To Live) based on search popularity:
  - Popular searches: 6 hours
  - Rare searches: 24 hours
- Stale-while-revalidate pattern
- Background refresh for trending searches

### 9.3 Admin Panel (`app/(dashboard)/admin/`)

- Monitor Apify usage and costs
- View scraping logs and errors
- Manage premium job listings
- User management
- Analytics dashboard
- Configure Apify scraper parameters

### 9.4 Bookmark & Save System

- Users can bookmark both Indeed and premium jobs
- Store `source` field to know where job came from
- For Indeed jobs: Store snapshot of job data (in case it expires on Indeed)
- "Apply" button always uses original source

## Phase 10: Performance & Production

### 10.1 Optimization

- Implement ISR for cached job listings
- Server Components for static content
- Client Components only where needed (search, filters)
- Image optimization with `next/image`
- Code splitting and lazy loading
- Database indexes on `cached_indeed_jobs` (location, title, date)
- Edge caching with Vercel Edge Network

### 10.2 SEO

- Dynamic meta tags for job listings
- Structured data (JSON-LD) for job postings (Schema.org)
- XML sitemap generation (include cached Indeed jobs)
- robots.txt configuration
- Canonical URLs
- Open Graph tags for social sharing

### 10.3 Vercel Deployment

- Configure environment variables (Supabase, Stripe, Apify, Gemini)
- Set up preview deployments for staging
- Production domain configuration
- Vercel Analytics integration
- Error monitoring (Sentry or Vercel Monitoring)

### 10.4 Testing & Quality

- Error boundaries for API failures (Apify, Gemini)
- Loading states and skeletons
- Form validation with `zod`
- Type safety with TypeScript strict mode
- Responsive testing (mobile-first)
- Accessibility audit (WCAG AA)

## Phase 11: Documentation & Launch

### 11.1 Documentation

- `README.md` with setup instructions
- `.env.example` with all required variables
- API documentation for embeddable widget
- User guide: "How to use AI Interview Pro"
- Employer guide: "Why post premium jobs"

### 11.2 Admin Setup

- Initial admin account creation
- Configure Apify scraper test runs
- Set up Stripe products and pricing
- Create email templates in Resend/SendGrid
- Seed database with sample premium jobs

### 11.3 Legal & Compliance

- Privacy Policy (mention Indeed data, cookies, AI processing)
- Terms of Service
- Cookie consent banner
- GDPR compliance (if targeting EU)
- Disclaimer: "Jobs sourced from Indeed.com - we are not affiliated"

### 11.4 Launch Checklist

- Test Apify scraper with multiple search queries
- Verify Indeed external links work correctly
- Test Stripe payments in test mode, then live mode
- Test Interview Pro voice features in multiple browsers
- Security audit (RLS policies, API rate limiting)
- Performance testing (Lighthouse score > 90)
- Cross-browser compatibility
- Monitor Apify usage to avoid overage charges

## Technical Notes

**Key Files to Create:**

- `lib/apify/client.ts` - Apify API client
- `lib/apify/transform.ts` - Data transformation layer
- `lib/supabase/client.ts` - Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/types/database.ts` - TypeScript types from Supabase
- `lib/types/indeed-job.ts` - Indeed job type definitions
- `lib/utils.ts` - Helper functions (cn, formatDate, etc.)
- `middleware.ts` - Auth + i18n middleware
- `app/api/fetch-indeed-jobs/route.ts` - **CRITICAL: Main Indeed integration**
- `app/api/stripe/` - All Stripe routes
- `app/api/ai/` - All AI feature routes

**Environment Variables Required:**

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APIFY_API_TOKEN
STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GEMINI_API_KEY
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
```

**Database Schema Changes:**

- `cached_indeed_jobs` table:
  - id, title, company, location, description, apply_url (Indeed link), salary, job_type, scraped_at, expires_at, search_query
- `jobs` table (premium only):
  - Add `is_featured` boolean
  - Add `featured_until` timestamp
- `bookmarks` table:
  - Add `source` field ('indeed' or 'premium')
  - Store job data snapshot for Indeed jobs

**Critical Implementation Detail:**

```tsx
// Example: JobCard component
<a
  href={job.source === 'indeed' ? job.apply_url : `/jobs/${job.id}/apply`}
  target={job.source === 'indeed' ? '_blank' : '_self'}
  rel={job.source === 'indeed' ? 'noopener noreferrer' : undefined}
  className="apply-button"
>
  {job.source === 'indeed' ? 'Apply on Indeed' : 'Apply Now'}
</a>
```

This plan creates a comprehensive job aggregator with unique AI-powered value propositions, optimized for Vercel deployment and scalable growth.

### To-dos

- [ ] Initialize Next.js 14 project with TypeScript, Tailwind v4, and install all dependencies IN THE  CURRENT WORKSPACE
- [ ] Configure Supabase client, create database schema, set up RLS policies and authentication
- [ ] Set up next-intl for multi-language support with locale files and middleware
- [ ] Create layout components (Navbar, Footer, Sidebar) and UI primitives (Button, Card, Input, etc.)
- [ ] Build homepage inspired by pagesource.html layout with hero search, featured jobs, and testimonials
- [ ] Create jobs listing page with advanced search, filters, and pagination
- [ ] Build job detail page with application form and company info
- [ ] Implement Supabase authentication with login/register pages and middleware
- [ ] Create job seeker dashboard (profile, resume manager, applications, bookmarks, alerts)
- [ ] Build employer dashboard for job posting and application management
- [ ] Set up Stripe for paid job listings, packages, and donations with webhook handling
- [ ] Create donation page with Stripe Checkout integration and thank you flow
- [ ] Integrate Gemini API for auto resume suggestion feature
- [ ] Build Interview Pro with Web Speech API + Gemini for voice-to-voice practice interviews
- [ ] Set up email infrastructure for alerts, notifications, and confirmations with i18n support
- [ ] Implement user locator and geo job manager with location-based filtering
- [ ] Create embeddable job widget API and standalone script for external websites
- [ ] Optimize performance with ISR, caching, image optimization, and SEO implementation
- [ ] Configure and deploy to Vercel with environment variables and analytics