# Rezzy - AI-Powered Job Aggregator

A comprehensive job aggregator that scrapes Indeed listings via Apify and provides AI-powered career tools. Built with Next.js 14, TypeScript, Supabase, and Google Gemini AI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Apify account
- Google Cloud account (for Gemini AI)
- Stripe account

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd rezzybyrlm
   npm install
   ```

2. **Environment setup**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables (see Environment Variables section below).

3. **Run development server**
   ```bash
   npm run dev
   ```

## 🌟 Features

- ✅ **Job Aggregation**: Scrape and display jobs from Indeed using Apify
- ✅ **AI-Powered Tools**: Resume matching, interview coaching, and career insights
- ✅ **Authentication**: Supabase Auth with Google OAuth
- ✅ **Payments**: Stripe integration for donations and premium features
- ✅ **Responsive Design**: Mobile-first design with Tailwind CSS
- ✅ **Multi-language Support**: Internationalization with next-intl
- ✅ **SEO Optimized**: Sitemap, robots.txt, and meta tags

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **AI**: Google Gemini API
- **Payments**: Stripe
- **Job Scraping**: Apify
- **Deployment**: Vercel

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── fetch-indeed-jobs/  # Indeed job scraping
│   │   ├── ai/            # AI features
│   │   └── stripe/        # Payment processing
│   ├── auth/              # Authentication pages
│   ├── jobs/              # Job listing and detail pages
│   ├── donate/             # Donation page
│   └── (dashboard)/        # Protected dashboard routes
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── lib/                    # Utility libraries
│   ├── supabase/          # Database client
│   ├── apify/             # Job scraping
│   ├── ai/                # Gemini AI integration
│   ├── stripe/            # Payment processing
│   ├── i18n/              # Internationalization
│   └── types/             # TypeScript definitions
└── middleware.ts           # Auth + i18n middleware
```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Apify Configuration
APIFY_API_TOKEN=your_apify_token

# Stripe Configuration
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Configuration (Optional)
RESEND_API_KEY=your_resend_api_key
```

## 🚀 Vercel Deployment

### 1. Connect to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

### 2. Set Environment Variables

In your Vercel dashboard, add all environment variables from `.env.local`.

### 3. Configure Domains

- Set up your custom domain in Vercel
- Update `NEXT_PUBLIC_SITE_URL` to your production URL

### 4. Deploy

```bash
npm run deploy
```

## 🔑 API Setup

### Supabase Setup
1. Create a new Supabase project
2. The database schema is already configured
3. Enable Row Level Security (RLS) policies
4. Set up Supabase Storage for resume uploads

### Apify Setup
1. Create an Apify account
2. Get your API token
3. The Indeed Scraper actor is pre-configured

### Google Gemini AI Setup
1. Create a Google Cloud project
2. Enable the Gemini API
3. Generate an API key

### Stripe Setup
1. Create a Stripe account
2. Get your API keys
3. Set up webhooks pointing to `/api/stripe/webhook`

## 📊 Database Schema

The application uses the following main tables:
- `users` - User profiles and preferences
- `cached_indeed_jobs` - Scraped Indeed job data
- `jobs` - Premium job postings
- `companies` - Company information
- `resumes` - User resume files
- `bookmarks` - Saved jobs
- `job_alerts` - Email alert preferences
- `interview_sessions` - AI interview practice sessions
- `api_usage_tracking` - API usage monitoring
- `user_plans` - Subscription plans

## 🔌 API Endpoints

- `POST /api/fetch-indeed-jobs` - Scrape jobs from Indeed
- `POST /api/ai/resume-match` - Match resumes to job descriptions
- `POST /api/ai/interview/questions` - Generate interview questions
- `POST /api/ai/interview/analyze` - Analyze interview responses
- `POST /api/stripe/checkout` - Create Stripe checkout sessions
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## 🎯 Key Features

### Job Aggregation
- Scrapes Indeed jobs using Apify's Indeed Scraper
- Caches results in Supabase to reduce API costs
- Transforms data to standardized format
- Implements pagination and filtering

### AI Features
- **Resume Matching**: Analyzes job descriptions and matches with user resumes
- **Interview Pro**: Voice-to-voice practice interviews using Web Speech API
- **Smart Alerts**: Semantic job matching beyond keywords

### Authentication
- Supabase Auth with email/password and Google OAuth
- Row Level Security (RLS) policies
- Protected dashboard routes

### Payments
- Stripe integration for donations and premium job postings
- Webhook handling for payment confirmations
- Customer portal for subscription management

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

## 📈 Performance

- ISR (Incremental Static Regeneration) for job listings
- Server Components for static content
- Client Components only where needed
- Image optimization with `next/image`
- Edge caching with Vercel Edge Network

## 🔒 Security

- Row Level Security (RLS) policies
- API rate limiting
- Input validation with Zod
- Secure headers configuration
- CSRF protection

## 📱 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@rezzybyrlm.com or join our Discord community.

## 🙏 Acknowledgments

- Indeed for job data (via Apify)
- Supabase for backend infrastructure
- Google for Gemini AI capabilities
- Stripe for payment processing
- Vercel for hosting and deployment

---

**Ready to deploy?** Follow the Vercel deployment guide above and you'll have your AI-powered job aggregator running in minutes! 🚀