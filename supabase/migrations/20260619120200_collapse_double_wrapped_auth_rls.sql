-- Normalize any nested (select (select auth.fn())) back to a single
-- (select auth.fn()). The previous wrap pass added a redundant layer on
-- policies that were already optimized (its unwrap step did not match
-- Postgres's normalized "( SELECT auth.uid() AS uid)" form). Semantics are
-- identical; this just removes the extra layer so the end state is clean.
DO $$
DECLARE
  p record;
  q text;
  c text;
  prev text;
  changed boolean;
  pat text := '\(\s*select\s+\(\s*select\s+(auth\.(uid|role|jwt|email)\(\))(\s+as\s+[a-z_]+)?\s*\)(\s+as\s+[a-z_]+)?\s*\)';
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies WHERE schemaname = 'public'
  LOOP
    q := p.qual;
    c := p.with_check;
    changed := false;

    IF q IS NOT NULL THEN
      LOOP
        prev := q;
        q := regexp_replace(q, pat, '(select \1)', 'gi');
        EXIT WHEN q = prev;
      END LOOP;
      IF q IS DISTINCT FROM p.qual THEN changed := true; END IF;
    END IF;

    IF c IS NOT NULL THEN
      LOOP
        prev := c;
        c := regexp_replace(c, pat, '(select \1)', 'gi');
        EXIT WHEN c = prev;
      END LOOP;
      IF c IS DISTINCT FROM p.with_check THEN changed := true; END IF;
    END IF;

    IF NOT changed THEN CONTINUE; END IF;

    IF q IS NOT NULL AND c IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)', p.policyname, p.schemaname, p.tablename, q, c);
    ELSIF q IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', p.policyname, p.schemaname, p.tablename, q);
    ELSIF c IS NOT NULL THEN
      EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', p.policyname, p.schemaname, p.tablename, c);
    END IF;
  END LOOP;
END $$;
