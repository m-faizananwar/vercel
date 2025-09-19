DROP POLICY IF EXISTS "Users can view teams they created" ON "public"."teams";
DROP POLICY IF EXISTS "Users can view teams they joined" ON "public"."teams";
DROP POLICY IF EXISTS "Team creators can update teams" ON "public"."teams";
DROP POLICY IF EXISTS "Team creators can delete teams" ON "public"."teams";
DROP POLICY IF EXISTS "Users can create teams" ON "public"."teams";

DROP POLICY IF EXISTS "Users can view their own team membership" ON "public"."team_members";
DROP POLICY IF EXISTS "Team creators can view all team members" ON "public"."team_members";
DROP POLICY IF EXISTS "Users can join teams themselves" ON "public"."team_members";
DROP POLICY IF EXISTS "Team creators can manage team members" ON "public"."team_members";
DROP POLICY IF EXISTS "Users can leave teams" ON "public"."team_members";

DROP POLICY IF EXISTS "Team members can access team chats" ON "public"."chats";

CREATE POLICY "Users can create teams"
ON "public"."teams"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view teams they created"
ON "public"."teams"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can update teams they created"
ON "public"."teams"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can delete teams they created"
ON "public"."teams"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can view their own memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can access their own chats"
ON "public"."chats"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_team_admin(team_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.teams 
        WHERE id = team_id_param AND created_by = user_id_param
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_members_for_admin(team_id_param uuid, requesting_user_id uuid)
RETURNS TABLE (
    id uuid,
    team_id uuid,
    user_id uuid,
    role text,
    joined_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF public.is_team_admin(team_id_param, requesting_user_id) THEN
        RETURN QUERY
        SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at
        FROM public.team_members tm
        WHERE tm.team_id = team_id_param;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_team_member_role_by_admin(
    team_id_param uuid,
    target_user_id uuid,
    new_role text,
    requesting_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF public.is_team_admin(team_id_param, requesting_user_id) THEN
        UPDATE public.team_members
        SET role = new_role
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN FOUND;
    END IF;
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_team_member_by_admin(
    team_id_param uuid,
    target_user_id uuid,
    requesting_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF public.is_team_admin(team_id_param, requesting_user_id) THEN
        DELETE FROM public.team_members
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN FOUND;
    END IF;
    RETURN FALSE;
END;
$$;
