-- Fix duplicate users in get_all_users_with_teams function
-- This removes duplicate users and properly handles users that exist in both tables

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
    -- Get all users from both tables, then deduplicate by email
    with all_users as (
        -- Get users from auth.users
        select
            u.id as user_id,
            u.email,
            u.created_at,
            coalesce(team_stats.team_count, 0) as team_count,
            coalesce(chat_stats.chat_count, 0) as total_chats
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

        -- Get users from local_users
        select
            lu.id as user_id,
            lu.email,
            lu.created_at,
            coalesce(team_stats.team_count, 0) as team_count,
            coalesce(chat_stats.chat_count, 0) as total_chats
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
    ),
    deduplicated_users as (
        -- Remove duplicates by email, keeping the most recent entry
        select distinct on (lower(email))
            user_id,
            email,
            created_at,
            team_count,
            total_chats
        from all_users
        order by lower(email), created_at desc
    )
    select
        du.user_id,
        du.email,
        du.created_at,
        du.team_count,
        du.total_chats,
        exists(select 1 from public.super_admins sa where sa.user_id = du.user_id) as is_super_admin
    from deduplicated_users du
    order by du.created_at desc;
$$;
