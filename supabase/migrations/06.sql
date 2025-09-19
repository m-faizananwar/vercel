drop policy if exists "Super admins can view all super admin records" on "public"."super_admins";
drop policy if exists "Super admins can manage super admin records" on "public"."super_admins";

create policy "Users can check their own super admin status"
on "public"."super_admins"
as permissive
for select
to authenticated
using (user_id = auth.uid());

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
