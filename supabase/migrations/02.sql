DROP POLICY IF EXISTS "Users can view team members of their teams" ON "public"."team_members";
DROP POLICY IF EXISTS "Team admins can manage team members" ON "public"."team_members";


CREATE POLICY "Users can view their own team membership"
ON "public"."team_members"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Team creators can view all team members"
ON "public"."team_members"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT id FROM public.teams 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can join teams themselves"
ON "public"."team_members"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Team creators can manage team members"
ON "public"."team_members"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    team_id IN (
        SELECT id FROM public.teams 
        WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can leave teams"
ON "public"."team_members"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (user_id = auth.uid());


DROP POLICY IF EXISTS "Users can view teams they are members of" ON "public"."teams";
DROP POLICY IF EXISTS "Team admins can update teams" ON "public"."teams";
DROP POLICY IF EXISTS "Team admins can delete teams" ON "public"."teams";
DROP POLICY IF EXISTS "Team admins can update teams" ON "public"."teams";
DROP POLICY IF EXISTS "Team admins can delete teams" ON "public"."teams";


CREATE POLICY "Users can view teams they created"
ON "public"."teams"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can view teams they joined"
ON "public"."teams"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Team creators can update teams"
ON "public"."teams"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Team creators can delete teams"
ON "public"."teams"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (created_by = auth.uid());


DROP POLICY IF EXISTS "Team members can access team chats" ON "public"."chats";

CREATE POLICY "Team members can access team chats"
ON "public"."chats"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    (team_id IS NULL AND user_id = auth.uid()) OR
    (team_id IS NOT NULL AND team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
    ))
)
WITH CHECK (
    (team_id IS NULL AND user_id = auth.uid()) OR
    (team_id IS NOT NULL AND team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
    ))
);
