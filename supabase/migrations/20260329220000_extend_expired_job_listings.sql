-- Refresh listing end dates that are already past so the public job board (RLS) still returns rows.
-- Safe to run multiple times.
UPDATE public.jobs
SET
  expires_at = NOW() + INTERVAL '120 days',
  updated_at = NOW()
WHERE
  expires_at IS NOT NULL
  AND expires_at < NOW();
