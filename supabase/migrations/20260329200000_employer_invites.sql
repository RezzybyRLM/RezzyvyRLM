-- One-time employer onboarding invites (created by admins)
CREATE TABLE IF NOT EXISTS public.employer_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.users (id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.employer_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employer_invites_no_anon"
  ON public.employer_invites FOR ALL
  USING (false);

COMMENT ON TABLE public.employer_invites IS 'Single-use links for admins to onboard employer accounts; use service role in API.';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS employer_company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_employer_company ON public.users (employer_company_id);
