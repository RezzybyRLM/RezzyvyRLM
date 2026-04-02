-- Idempotent Stripe webhook audit log (event.id is Stripe event id)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated direct access; service role bypasses RLS
CREATE POLICY "stripe_events_no_public" ON public.stripe_events FOR ALL USING (false);

COMMENT ON TABLE public.stripe_events IS 'Append-only Stripe webhook receipt log for admin audit';
