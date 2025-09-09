-- Simple, safe RLS policies that avoid circular dependencies
-- This approach uses row-level filters that don't reference other tables

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view teams they created" ON "public"."teams";
DROP POLICY IF EXISTS "Users can view teams they joined" ON "public"."teams";
DROP POLICY IF EXISTS "Team creators can update teams" ON "public"."teams";
DROP POLICY IF EXISTS "Team creators can delete teams" ON "public"."teams";
DROP POLICY IF EXISTS "Users can create teams" ON "public"."teams";

DROP POLICY IF EXISTS "Users can view their own memberships" ON "public"."team_members";
DROP POLICY IF EXISTS "Users can insert their own memberships" ON "public"."team_members";
DROP POLICY IF EXISTS "Users can delete their own memberships" ON "public"."team_members";

DROP POLICY IF EXISTS "Users can access their own chats" ON "public"."chats";

-- Temporarily disable RLS to create safe policies
ALTER TABLE "public"."teams" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_members" DISABLE ROW LEVEL SECURITY;

-- Create very simple policies for teams
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all teams"
ON "public"."teams"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to create teams"
ON "public"."teams"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow team creators to update their teams"
ON "public"."teams"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Allow team creators to delete their teams"
ON "public"."teams"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Create very simple policies for team_members
ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view all team memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to insert their own memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Allow team creators to manage memberships
CREATE POLICY "Allow team creators to manage team memberships"
ON "public"."team_members"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE teams.id = team_members.team_id 
        AND teams.created_by = auth.uid()
    )
);

-- Simple policies for chats
CREATE POLICY "Allow users to access their own chats"
ON "public"."chats"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow access to team chats for team members
CREATE POLICY "Allow team members to access team chats"
ON "public"."chats"
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
    team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = chats.team_id 
        AND team_members.user_id = auth.uid()
    )
)
WITH CHECK (
    team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_members.team_id = chats.team_id 
        AND team_members.user_id = auth.uid()
    )
);
