-- Treat NULL expires_at as still active (RLS was hiding those rows).
DROP POLICY IF EXISTS "Anyone can view active jobs" ON public.jobs;

CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  TO public
  USING (expires_at IS NULL OR expires_at > now());
