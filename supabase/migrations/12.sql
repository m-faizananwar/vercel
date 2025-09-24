-- Fix the get_all_users_with_teams function to include local_users table
-- This fixes the issue where newly created users weren't showing in admin dashboard

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
