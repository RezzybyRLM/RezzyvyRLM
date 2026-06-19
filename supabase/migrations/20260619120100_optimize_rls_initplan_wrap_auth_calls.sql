-- Perf: stop RLS policies re-evaluating auth.<fn>() once PER ROW. Wrapping the
-- call in a scalar subquery — (select auth.uid()) — lets Postgres evaluate it
-- ONCE per query (initplan), the documented fix for `auth_rls_initplan` and a
-- large speedup on RLS-filtered reads. Semantics are identical. Policies are
-- ALTERed in place (no drop/recreate) so command, roles and checks are kept.
DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
  changed boolean;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_qual := p.qual;
    new_check := p.with_check;
    changed := false;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '\(\s*select\s+(auth\.(uid|role|jwt|email)\(\))\s*\)', '\1', 'gi');
      new_qual := regexp_replace(new_qual, '(auth\.(uid|role|jwt|email)\(\))', '(select \1)', 'g');
      IF new_qual IS DISTINCT FROM p.qual THEN changed := true; END IF;
    END IF;

    IF new_check IS NOT NULL THEN
      new_check := regexp_replace(new_check, '\(\s*select\s+(auth\.(uid|role|jwt|email)\(\))\s*\)', '\1', 'gi');
      new_check := regexp_replace(new_check, '(auth\.(uid|role|jwt|email)\(\))', '(select \1)', 'g');
      IF new_check IS DISTINCT FROM p.with_check THEN changed := true; END IF;
    END IF;

    IF NOT changed THEN CONTINUE; END IF;

    IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)', p.policyname, p.schemaname, p.tablename, new_qual, new_check);
    ELSIF new_qual IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', p.policyname, p.schemaname, p.tablename, new_qual);
    ELSIF new_check IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', p.policyname, p.schemaname, p.tablename, new_check);
    END IF;
  END LOOP;
END $$;
