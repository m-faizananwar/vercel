-- Fix super admin RLS policies to resolve circular dependency
-- Users need to be able to check if THEY are super admins without already being super admins

-- Drop existing problematic policies
drop policy if exists "Super admins can view all super admin records" on "public"."super_admins";
drop policy if exists "Super admins can manage super admin records" on "public"."super_admins";

-- Create new policies that allow users to check their own super admin status
-- but still restrict management to existing super admins

-- Policy 1: Users can check if they themselves are super admins
create policy "Users can check their own super admin status"
on "public"."super_admins"
as permissive
for select
to authenticated
using (user_id = auth.uid());

-- Policy 2: Super admins can view all super admin records
create policy "Super admins can view all super admin records"
on "public"."super_admins"
as permissive
for select
to authenticated
using (
    auth.uid() in (select user_id from public.super_admins)
);

-- Policy 3: Super admins can manage super admin records
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
