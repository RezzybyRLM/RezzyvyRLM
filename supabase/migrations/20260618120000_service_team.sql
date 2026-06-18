-- Service Team (RezzyMeUp) account type: admin-issued signup invites + client order queue

-- Single-use signup links for admins to onboard service-team accounts (service role in API).
CREATE TABLE IF NOT EXISTS public.service_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  invitee_name text,
  invitee_email text,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_invites_no_anon" ON public.service_invites;
CREATE POLICY "service_invites_no_anon" ON public.service_invites FOR ALL USING (false);
COMMENT ON TABLE public.service_invites IS 'Single-use links for admins to onboard Service Team (RezzyMeUp) accounts; use service role in API.';

-- Client service orders fulfilled by the service team.
CREATE TABLE IF NOT EXISTS public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  service_type text NOT NULL,                  -- resume | cover_letter | bio | templates | coaching | vcard | linkedin | application_processing
  title text NOT NULL,
  status text NOT NULL DEFAULT 'new',          -- new | in_progress | delivered | cancelled
  notes text,
  deliverable_url text,
  scheduled_at timestamptz,                     -- coaching sessions
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER helper to avoid RLS recursion when checking the caller's role.
CREATE OR REPLACE FUNCTION public.is_service_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role IN ('service_team','admin','super_admin')
  );
$$;

DROP POLICY IF EXISTS "service_orders_staff_all" ON public.service_orders;
CREATE POLICY "service_orders_staff_all" ON public.service_orders FOR ALL
  USING (public.is_service_staff()) WITH CHECK (public.is_service_staff());
DROP POLICY IF EXISTS "service_orders_client_read" ON public.service_orders;
CREATE POLICY "service_orders_client_read" ON public.service_orders FOR SELECT
  USING (client_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_service_orders_assigned ON public.service_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_service_orders_client ON public.service_orders(client_user_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON public.service_orders(status);
