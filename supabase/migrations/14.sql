-- Adjust RLS to work with local_users (no Supabase JWT -> requests hit as role anon)
-- Temporary: relax / disable RLS so server actions using cookie local_user_id succeed.
-- SECURITY WARNING: These policies are permissive. Tighten once proper JWT-based local auth is added.

-- TEAMS ----------------------------------------------------------------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
-- Drop prior policies dynamically
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN (
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='teams'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', rec.policyname);
  END LOOP;
END $$;

-- Allow all (public=anon+authenticated) basic CRUD; server will enforce ownership
CREATE POLICY "public select teams" ON public.teams FOR SELECT TO public USING (true);
CREATE POLICY "public insert teams" ON public.teams FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public update teams" ON public.teams FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "public delete teams" ON public.teams FOR DELETE TO public USING (true);

-- TEAM_MEMBERS ----------------------------------------------------------------
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN (
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='team_members'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', rec.policyname);
  END LOOP;
END $$;

CREATE POLICY "public select team_members" ON public.team_members FOR SELECT TO public USING (true);
CREATE POLICY "public insert team_members" ON public.team_members FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "public update team_members" ON public.team_members FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "public delete team_members" ON public.team_members FOR DELETE TO public USING (true);

-- CHATS ----------------------------------------------------------------------
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN (
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='chats'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chats', rec.policyname);
  END LOOP;
END $$;

CREATE POLICY "public full chats" ON public.chats FOR ALL TO public USING (true) WITH CHECK (true);

-- SUPER_ADMINS (keep ability to list) ---------------------------------------
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE rec record;
BEGIN
  FOR rec IN (
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='super_admins'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.super_admins', rec.policyname);
  END LOOP;
END $$;
CREATE POLICY "public select super_admins" ON public.super_admins FOR SELECT TO public USING (true);
CREATE POLICY "public modify super_admins" ON public.super_admins FOR ALL TO public USING (true) WITH CHECK (true);

-- NOTE: Replace permissive policies once JWT auth for local_users is implemented.
