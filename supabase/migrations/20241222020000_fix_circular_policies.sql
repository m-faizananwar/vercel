-- Fix the circular dependency in super_admins policies once and for all

-- Drop ALL existing policies on super_admins table
drop policy if exists "Super admins can view all super admin records" on "public"."super_admins";
drop policy if exists "Super admins can manage super admin records" on "public"."super_admins";
drop policy if exists "Users can check their own super admin status" on "public"."super_admins";

-- Create ONLY the simple policy that allows users to check their own status
-- This is the ONLY policy needed for the middleware to work
create policy "Users can check their own super admin status"
on "public"."super_admins"
as permissive
for select
to authenticated
using (user_id = auth.uid());

-- Create a separate policy for INSERT/UPDATE/DELETE that doesn't cause recursion
-- Use a function that checks the table directly without triggering policies
create or replace function public.is_user_super_admin_direct(check_user_id uuid)
returns boolean
language sql
security definer
as $$
    select exists(
        select 1 from public.super_admins 
        where user_id = check_user_id
    );
$$;

-- Policy for management (INSERT/UPDATE/DELETE) using the direct function
create policy "Super admins can manage super admin records"
on "public"."super_admins"
as permissive
for all
to authenticated
using (public.is_user_super_admin_direct(auth.uid()))
with check (public.is_user_super_admin_direct(auth.uid()));
