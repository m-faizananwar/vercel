create table "public"."teams" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "join_code" text not null unique,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "created_by" uuid not null references auth.users(id) on delete cascade
);

CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);
CREATE UNIQUE INDEX teams_join_code_unique ON public.teams USING btree (join_code);
alter table "public"."teams" add constraint "teams_pkey" PRIMARY KEY using index "teams_pkey";
alter table "public"."teams" add constraint "teams_join_code_unique" UNIQUE using index "teams_join_code_unique";

create table "public"."team_members" (
    "id" uuid not null default gen_random_uuid(),
    "team_id" uuid not null references public.teams(id) on delete cascade,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "role" text not null default 'member' check (role in ('admin', 'member')),
    "joined_at" timestamp with time zone not null default now()
);

CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);
CREATE UNIQUE INDEX team_members_team_user_unique ON public.team_members USING btree (team_id, user_id);

alter table "public"."team_members" add constraint "team_members_pkey" PRIMARY KEY using index "team_members_pkey";
alter table "public"."team_members" add constraint "team_members_team_user_unique" UNIQUE using index "team_members_team_user_unique";


alter table "public"."chats" add column "team_id" uuid references public.teams(id) on delete cascade;

CREATE INDEX chats_team_id_idx ON public.chats USING btree (team_id);

alter table "public"."teams" enable row level security;
alter table "public"."team_members" enable row level security;

create policy "Users can view teams they are members of"
on "public"."teams"
as permissive
for select
to authenticated
using (
    id in (
        select team_id from public.team_members 
        where user_id = auth.uid()
    )
);

create policy "Users can create teams"
on "public"."teams"
as permissive
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Team admins can update teams"
on "public"."teams"
as permissive
for update
to authenticated
using (
    id in (
        select team_id from public.team_members 
        where user_id = auth.uid() and role = 'admin'
    )
);

create policy "Team admins can delete teams"
on "public"."teams"
as permissive
for delete
to authenticated
using (
    id in (
        select team_id from public.team_members 
        where user_id = auth.uid() and role = 'admin'
    )
);

create policy "Users can view team members of their teams"
on "public"."team_members"
as permissive
for select
to authenticated
using (
    team_id in (
        select team_id from public.team_members 
        where user_id = auth.uid()
    )
);

create policy "Team admins can manage team members"
on "public"."team_members"
as permissive
for all
to authenticated
using (
    team_id in (
        select team_id from public.team_members 
        where user_id = auth.uid() and role = 'admin'
    )
);

create policy "Users can join teams (for accepted invitations)"
on "public"."team_members"
as permissive
for insert
to authenticated
with check (auth.uid() = user_id);


create policy "Team members can access team chats"
on "public"."chats"
as permissive
for all
to authenticated
using (
    team_id is not null and team_id in (
        select team_id from public.team_members 
        where user_id = auth.uid()
    )
)
with check (
    team_id is not null and team_id in (
        select team_id from public.team_members 
        where user_id = auth.uid()
    )
);

create or replace function public.add_team_creator_as_admin()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.team_members (team_id, user_id, role)
    values (new.id, new.created_by, 'admin');
    return new;
end;
$$;

create trigger add_team_creator_as_admin_trigger
    after insert on public.teams
    for each row
    execute function public.add_team_creator_as_admin();

create or replace function public.generate_join_code()
returns text
language plpgsql
as $$
declare
    code text;
    exists_check boolean;
begin
    loop
        code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));
        
        select exists(select 1 from public.teams where join_code = code) into exists_check;
        
        if not exists_check then
            exit;
        end if;
    end loop;
    
    return code;
end;
$$;

create or replace function public.set_team_join_code()
returns trigger
language plpgsql
security definer
as $$
begin
    if new.join_code is null or new.join_code = '' then
        new.join_code := public.generate_join_code();
    end if;
    return new;
end;
$$;


create trigger set_team_join_code_trigger
    before insert on public.teams
    for each row
    execute function public.set_team_join_code();
