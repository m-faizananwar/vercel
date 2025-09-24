-- Fix infinite recursion in team_members RLS policies
-- This migration removes the circular dependency where team_members policies
-- were trying to query the team_members table itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view team members of their teams" ON "public"."team_members";
DROP POLICY IF EXISTS "Team admins can manage team members" ON "public"."team_members";

-- Create new policies that avoid circular dependency

-- Policy 1: Users can view their own team membership records
CREATE POLICY "Users can view their own team membership"
ON "public"."team_members"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can view team members of teams they created (via teams table)
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

-- Policy 3: Users can insert themselves into teams (for joining)
CREATE POLICY "Users can join teams themselves"
ON "public"."team_members"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 4: Team creators can manage all team members (via teams table)
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

-- Policy 5: Allow users to leave teams (delete their own membership)
CREATE POLICY "Users can leave teams"
ON "public"."team_members"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Update the teams policies to be more efficient as well
-- since they were also contributing to the problem

-- Drop existing teams policies that query team_members
DROP POLICY IF EXISTS "Users can view teams they are members of" ON "public"."teams";
DROP POLICY IF EXISTS "Team admins can update teams" ON "public"."teams";
DROP POLICY IF EXISTS "Team admins can delete teams" ON "public"."teams";

-- Create new teams policies that are more efficient

-- Policy 1: Users can view teams they created
CREATE POLICY "Users can view teams they created"
ON "public"."teams"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Policy 2: Users can view teams where they have a membership record
-- This is safe because we're not querying from within team_members policies
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

-- Policy 3: Team creators can update their teams
CREATE POLICY "Team creators can update teams"
ON "public"."teams"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Policy 4: Team creators can delete their teams
CREATE POLICY "Team creators can delete teams"
ON "public"."teams"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Keep the existing insert policy as it's fine
-- "Users can create teams" policy is already correct

-- Update chats policy to be more efficient too
-- Drop the existing team chats policy
DROP POLICY IF EXISTS "Team members can access team chats" ON "public"."chats";

-- Create a more efficient policy for team chats
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
