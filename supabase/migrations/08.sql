drop policy if exists "Super admins can view all super admin records" on "public"."super_admins";
drop policy if exists "Super admins can manage super admin records" on "public"."super_admins";
drop policy if exists "Users can check their own super admin status" on "public"."super_admins";

create policy "Users can check their own super admin status"
on "public"."super_admins"
as permissive
for select
to authenticated
using (user_id = auth.uid());

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

create policy "Super admins can manage super admin records"
on "public"."super_admins"
as permissive
for all
to authenticated
using (public.is_user_super_admin_direct(auth.uid()))
with check (public.is_user_super_admin_direct(auth.uid()));
