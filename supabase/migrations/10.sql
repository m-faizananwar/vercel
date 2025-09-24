-- WARNING: This migration introduces plain-text password storage and
-- permissive RLS. FOR DEVELOPMENT / TRANSITION ONLY.

-- 1. Create local user table
create table if not exists public.local_users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password text not null,          -- PLAIN TEXT (temporary / insecure)
    created_at timestamptz not null default now()
);

comment on table public.local_users is 'Local auth replacement. Passwords currently stored in plain text (INSECURE).';

-- 2. Optional: migrate existing auth.users -> local_users with placeholder password
do $$
begin
  if exists (select 1 from pg_catalog.pg_tables where schemaname='auth' and tablename='users') then
    insert into public.local_users (id, email, password)
    select u.id, u.email, '[SET_PASSWORD]'
    from auth.users u
    on conflict (id) do nothing;
  end if;
exception when others then
  raise notice 'Skipped copying from auth.users: %', sqlerrm;
end$$;

-- 3. Drop foreign keys referencing auth.users (if they exist)
alter table if exists public.chats        drop constraint if exists chats_user_id_fkey;
alter table if exists public.teams        drop constraint if exists teams_created_by_fkey;
alter table if exists public.team_members drop constraint if exists team_members_user_id_fkey;
alter table if exists public.super_admins drop constraint if exists super_admins_user_id_fkey;
alter table if exists public.super_admins drop constraint if exists super_admins_created_by_fkey;

-- 4. Recreate foreign keys to local_users
alter table if exists public.chats
  add constraint chats_user_id_fkey
  foreign key (user_id) references public.local_users(id) on delete cascade;

alter table if exists public.teams
  add constraint teams_created_by_fkey
  foreign key (created_by) references public.local_users(id) on delete cascade;

alter table if exists public.team_members
  add constraint team_members_user_id_fkey
  foreign key (user_id) references public.local_users(id) on delete cascade;

alter table if exists public.super_admins
  add constraint super_admins_user_id_fkey
  foreign key (user_id) references public.local_users(id) on delete cascade;

alter table if exists public.super_admins
  add constraint super_admins_created_by_fkey
  foreign key (created_by) references public.local_users(id) on delete set null;

-- 5. Replace RLS policies depending on auth.uid()
--    (Temporary: open or minimally filtered. Secure later.)

-- Chats
drop policy if exists "Allow full access to own chats" on public.chats;
drop policy if exists "Allow public read for shared chats" on public.chats;
create policy "TEMP allow all chats select"
  on public.chats for select to authenticated using (true);
create policy "TEMP allow all chats modify"
  on public.chats for all to authenticated using (true) with check (true);

-- Teams
drop policy if exists "Users can view teams they are members of" on public.teams;
drop policy if exists "Users can create teams" on public.teams;
drop policy if exists "Team admins can update teams" on public.teams;
drop policy if exists "Team admins can delete teams" on public.teams;
drop policy if exists "Allow authenticated users to view all teams" on public.teams;
drop policy if exists "Allow users to create teams" on public.teams;
drop policy if exists "Allow team creators to update their teams" on public.teams;
drop policy if exists "Allow team creators to delete their teams" on public.teams;
create policy "TEMP allow select teams" on public.teams for select to authenticated using (true);
create policy "TEMP allow modify teams" on public.teams for all to authenticated using (true) with check (true);

-- Team members
drop policy if exists "Users can view team members of their teams" on public.team_members;
drop policy if exists "Team admins can manage team members" on public.team_members;
drop policy if exists "Users can join teams (for accepted invitations)" on public.team_members;
drop policy if exists "Allow authenticated users to view all team memberships" on public.team_members;
drop policy if exists "Allow users to insert their own memberships" on public.team_members;
drop policy if exists "Allow users to delete their own memberships" on public.team_members;
drop policy if exists "Allow team creators to manage team memberships" on public.team_members;
create policy "TEMP allow select team_members" on public.team_members for select to authenticated using (true);
create policy "TEMP allow modify team_members" on public.team_members for all to authenticated using (true) with check (true);

-- Super admins
drop policy if exists "Super admins can view all super admin records" on public.super_admins;
drop policy if exists "Super admins can manage super admin records" on public.super_admins;
drop policy if exists "Users can check their own super admin status" on public.super_admins;
create policy "TEMP allow select super_admins" on public.super_admins for select to authenticated using (true);
create policy "TEMP allow modify super_admins" on public.super_admins for all to authenticated using (true) with check (true);

-- 6. (Optional) helper view to inspect local users (INSECURE)
create or replace view public.local_users_public as
  select id, email, created_at from public.local_users;

-- 7. Guidance comments
-- NEXT STEPS (recommended):
--  - Replace plain password with salted hash (bcrypt/argon2) stored in password_hash column.
--  - Introduce a custom RPC login function that validates credentials and issues a JWT (or uses Supabase anon key + custom claims).
--  - Rework RLS to use a custom SQL function current_local_user_id() fed by JWT claim.
--  - Remove TEMP policies and reintroduce least-privilege rules.

-- Rollback helper (manual):
--  - Recreate original FKs to auth.users
--  - Drop local_users table
--  - Restore original policies from prior migrations.

-- End migration
