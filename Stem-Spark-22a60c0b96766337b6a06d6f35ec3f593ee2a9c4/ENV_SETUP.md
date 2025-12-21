# Environment Variables Setup

Please create a `.env.local` file in the root directory with the following content:

```
SUPABASE_ACCESS_TOKEN=sbp_de20e135685fd365dda329efbd1a87341e8b1771
POSTGRES_URL=postgres://postgres.qnuevynptgkoivekuzer:p2p3ltyeTTjBAZeQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_USER=postgres
POSTGRES_HOST=db.qnuevynptgkoivekuzer.supabase.co
SUPABASE_JWT_SECRET=f7AKLSs7XeWf9GxqRZMq1m/JyIT41GDig7VwMfNiQn7qvskxBWukjaiEDjUcRRLdNpeEInRyw3kpN++eIS8f9Q==
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudWV2eW5wdGdrb2l2ZWt1emVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM4MzYsImV4cCI6MjA2NDU0OTgzNn0.z3GzoVvcFXFx1CL1LA3cww_0587aUwrlkZStgQFRrww
POSTGRES_PRISMA_URL=postgres://postgres.qnuevynptgkoivekuzer:p2p3ltyeTTjBAZeQ@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PASSWORD=p2p3ltyeTTjBAZeQ
POSTGRES_DATABASE=postgres
SUPABASE_URL=https://qnuevynptgkoivekuzer.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudWV2eW5wdGdrb2l2ZWt1emVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg5NzM4MzYsImV4cCI6MjA2NDU0OTgzNn0.z3GzoVvcFXFx1CL1LA3cww_0587aUwrlkZStgQFRrww
NEXT_PUBLIC_SUPABASE_URL=https://qnuevynptgkoivekuzer.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudWV2eW5wdGdrb2l2ZWt1emVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk3MzgzNiwiZXhwIjoyMDY0NTQ5ODM2fQ.0dzieduL18-aoMkfxPTD95bP7tykb764LAEsuOjUkVA
POSTGRES_URL_NON_POOLING=postgres://postgres.qnuevynptgkoivekuzer:p2p3ltyeTTjBAZeQ@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require

# Resend API Configuration (for email notifications)
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=STEM Spark Academy <noreply@stemspark.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Pages Created

### Main Pages (Authenticated Users)
- `/app/videos/page.tsx` - Redesigned videos page with database integration
- `/app/internships/page.tsx` - Already exists, enhanced with database integration
- `/app/communication-hub/page.tsx` - Already exists, uses database
- `/app/learning-path/page.tsx` - Already exists, uses database
- `/app/ai-tutor/page.tsx` - Already exists, uses database

### Guest Pages (Unauthenticated Users)
- `/app/guest/videos/page.tsx` - Guest version of videos page
- `/app/guest/internships/page.tsx` - Guest version of internships page
- `/app/guest/community/page.tsx` - Guest version of community page
- `/app/guest/learning-path/page.tsx` - Guest version of learning path page
- `/app/guest/ai-tutor/page.tsx` - Guest version of AI tutor page

## Features

All pages:
- Pull data from Supabase database
- Modern, responsive design
- Guest versions with login prompts
- Search and filter functionality
- Loading states
- Error handling

