-- Add super admin functionality
-- Create super_admins table
create table "public"."super_admins" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid references auth.users(id) on delete set null
);

CREATE UNIQUE INDEX super_admins_pkey ON public.super_admins USING btree (id);
CREATE UNIQUE INDEX super_admins_user_id_unique ON public.super_admins USING btree (user_id);

alter table "public"."super_admins" add constraint "super_admins_pkey" PRIMARY KEY using index "super_admins_pkey";
alter table "public"."super_admins" add constraint "super_admins_user_id_unique" UNIQUE using index "super_admins_user_id_unique";

-- Enable RLS on super_admins table
alter table "public"."super_admins" enable row level security;

-- Create policy for super admins to manage super admin table
create policy "Super admins can view all super admin records"
on "public"."super_admins"
as permissive
for select
to authenticated
using (
    auth.uid() in (select user_id from public.super_admins)
);

create policy "Super admins can manage super admin records"
on "public"."super_admins"
as permissive
for all
to authenticated
using (
    auth.uid() in (select user_id from public.super_admins)
)
with check (
    auth.uid() in (select user_id from public.super_admins)
);

-- Create function to check if user is super admin (using direct query to avoid RLS)
create or replace function public.is_super_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
as $$
    select exists(
        select 1 from public.super_admins 
        where super_admins.user_id = is_super_admin.user_id
    );
$$;

-- Update existing RLS policies to allow super admin access
-- Only proceed if the required tables exist

-- Check if tables exist and drop existing conflicting policies
do $$
begin
    -- Drop policies for teams table if it exists
    if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'teams') then
        drop policy if exists "Super admins can view all teams" on "public"."teams";
        drop policy if exists "Super admins can manage all teams" on "public"."teams";
    end if;
    
    -- Drop policies for team_members table if it exists
    if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'team_members') then
        drop policy if exists "Super admins can view all team members" on "public"."team_members";
        drop policy if exists "Super admins can manage all team members" on "public"."team_members";
    end if;
    
    -- Drop policies for chats table if it exists
    if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'chats') then
        drop policy if exists "Super admins can view all chats" on "public"."chats";
        drop policy if exists "Super admins can manage all chats" on "public"."chats";
    end if;
end
$$;

-- Create policies only if tables exist
do $$
begin
    -- Update teams policies to allow super admin access
    if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'teams') then
        execute 'create policy "Super admins can view all teams" on "public"."teams" as permissive for select to authenticated using (public.is_super_admin())';
        execute 'create policy "Super admins can manage all teams" on "public"."teams" as permissive for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin())';
    end if;

    -- Update team_members policies to allow super admin access
    if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'team_members') then
        execute 'create policy "Super admins can view all team members" on "public"."team_members" as permissive for select to authenticated using (public.is_super_admin())';
        execute 'create policy "Super admins can manage all team members" on "public"."team_members" as permissive for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin())';
    end if;

    -- Update chats policies to allow super admin access
    if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'chats') then
        execute 'create policy "Super admins can view all chats" on "public"."chats" as permissive for select to authenticated using (public.is_super_admin())';
        execute 'create policy "Super admins can manage all chats" on "public"."chats" as permissive for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin())';
    end if;
end
$$;

-- Create function to get all users with team info (for super admin)
create or replace function public.get_all_users_with_teams()
returns table (
    user_id uuid,
    email text,
    created_at timestamptz,
    team_count bigint,
    total_chats bigint,
    is_super_admin boolean
)
language sql
security definer
as $$
    -- Get users from both auth.users and local_users tables
    select
        u.id as user_id,
        u.email,
        u.created_at,
        coalesce(team_stats.team_count, 0) as team_count,
        coalesce(chat_stats.chat_count, 0) as total_chats,
        exists(select 1 from public.super_admins sa where sa.user_id = u.id) as is_super_admin
    from auth.users u
    left join (
        select
            tm.user_id,
            count(distinct tm.team_id) as team_count
        from public.team_members tm
        group by tm.user_id
    ) team_stats on team_stats.user_id = u.id
    left join (
        select
            c.user_id,
            count(*) as chat_count
        from public.chats c
        group by c.user_id
    ) chat_stats on chat_stats.user_id = u.id

    UNION ALL

    -- Get users from local_users table
    select
        lu.id as user_id,
        lu.email,
        lu.created_at,
        coalesce(team_stats.team_count, 0) as team_count,
        coalesce(chat_stats.chat_count, 0) as total_chats,
        exists(select 1 from public.super_admins sa where sa.user_id = lu.id) as is_super_admin
    from public.local_users lu
    left join (
        select
            tm.user_id,
            count(distinct tm.team_id) as team_count
        from public.team_members tm
        group by tm.user_id
    ) team_stats on team_stats.user_id = lu.id
    left join (
        select
            c.user_id,
            count(*) as chat_count
        from public.chats c
        group by c.user_id
    ) chat_stats on chat_stats.user_id = lu.id

    order by created_at desc;
$$;

-- Create function to get all teams with detailed stats (for super admin)
create or replace function public.get_all_teams_with_stats()
returns table (
    team_id uuid,
    team_name text,
    description text,
    join_code text,
    created_at timestamptz,
    created_by uuid,
    creator_email text,
    member_count bigint,
    admin_count bigint,
    chat_count bigint
)
language sql
security definer
as $$
    select 
        t.id as team_id,
        t.name as team_name,
        t.description,
        t.join_code,
        t.created_at,
        t.created_by,
        u.email as creator_email,
        coalesce(member_stats.member_count, 0) as member_count,
        coalesce(admin_stats.admin_count, 0) as admin_count,
        coalesce(chat_stats.chat_count, 0) as chat_count
    from public.teams t
    left join auth.users u on u.id = t.created_by
    left join (
        select 
            tm.team_id,
            count(*) as member_count
        from public.team_members tm
        group by tm.team_id
    ) member_stats on member_stats.team_id = t.id
    left join (
        select 
            tm.team_id,
            count(*) as admin_count
        from public.team_members tm
        where tm.role = 'admin'
        group by tm.team_id
    ) admin_stats on admin_stats.team_id = t.id
    left join (
        select 
            c.team_id,
            count(*) as chat_count
        from public.chats c
        where c.team_id is not null
        group by c.team_id
    ) chat_stats on chat_stats.team_id = t.id
    order by t.created_at desc;
$$;

-- Grant necessary permissions
-- Only super admins can execute these functions
revoke execute on function public.get_all_users_with_teams() from public;
revoke execute on function public.get_all_teams_with_stats() from public;

grant execute on function public.get_all_users_with_teams() to authenticated;
grant execute on function public.get_all_teams_with_stats() to authenticated;

-- Add row level security to these functions by checking super admin status in the functions themselves
create or replace function public.get_all_users_with_teams()
returns table (
    user_id uuid,
    email text,
    created_at timestamptz,
    team_count bigint,
    total_chats bigint,
    is_super_admin boolean
)
language sql
security definer
as $$
    -- Check if current user is super admin and return data accordingly
    select 
        u.id as user_id,
        u.email,
        u.created_at,
        coalesce(team_stats.team_count, 0) as team_count,
        coalesce(chat_stats.chat_count, 0) as total_chats,
        exists(select 1 from public.super_admins sa where sa.user_id = u.id) as is_super_admin
    from auth.users u
    left join (
        select 
            tm.user_id,
            count(distinct tm.team_id) as team_count
        from public.team_members tm
        group by tm.user_id
    ) team_stats on team_stats.user_id = u.id
    left join (
        select 
            c.user_id,
            count(*) as chat_count
        from public.chats c
        group by c.user_id
    ) chat_stats on chat_stats.user_id = u.id
    where public.is_super_admin() = true
    order by u.created_at desc;
$$;

create or replace function public.get_all_teams_with_stats()
returns table (
    team_id uuid,
    team_name text,
    description text,
    join_code text,
    created_at timestamptz,
    created_by uuid,
    creator_email text,
    member_count bigint,
    admin_count bigint,
    chat_count bigint
)
language sql
security definer
as $$
    -- Check if current user is super admin and return data accordingly
    select 
        t.id as team_id,
        t.name as team_name,
        t.description,
        t.join_code,
        t.created_at,
        t.created_by,
        u.email as creator_email,
        coalesce(member_stats.member_count, 0) as member_count,
        coalesce(admin_stats.admin_count, 0) as admin_count,
        coalesce(chat_stats.chat_count, 0) as chat_count
    from public.teams t
    left join auth.users u on u.id = t.created_by
    left join (
        select 
            tm.team_id,
            count(*) as member_count
        from public.team_members tm
        group by tm.team_id
    ) member_stats on member_stats.team_id = t.id
    left join (
        select 
            tm.team_id,
            count(*) as admin_count
        from public.team_members tm
        where tm.role = 'admin'
        group by tm.team_id
    ) admin_stats on admin_stats.team_id = t.id
    left join (
        select 
            c.team_id,
            count(*) as chat_count
        from public.chats c
        where c.team_id is not null
        group by c.team_id
    ) chat_stats on chat_stats.team_id = t.id
    where public.is_super_admin() = true
    order by t.created_at desc;
$$;
