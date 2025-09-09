-- Add SUPER_ADMIN automatic membership to new teams with protection
-- This migration ensures that when a team is created, all super admins are automatically added as admins
-- and their membership is protected from demotion or removal

-- First, update the trigger function to add super admins as admins
CREATE OR REPLACE FUNCTION public.add_team_creator_and_super_admins_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Add the team creator as admin (existing functionality)
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');

    -- Add all super admins as admins (new functionality)
    INSERT INTO public.team_members (team_id, user_id, role)
    SELECT NEW.id, sa.user_id, 'admin'
    FROM public.super_admins sa
    ON CONFLICT (team_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Replace the old trigger with the new one
DROP TRIGGER IF EXISTS add_team_creator_as_admin_trigger ON public.teams;
CREATE TRIGGER add_super_admin_team_membership_trigger
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.add_team_creator_and_super_admins_as_admin();

-- Create a function to check if a team member is a super admin
CREATE OR REPLACE FUNCTION public.is_team_member_super_admin(team_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.super_admins sa
        WHERE sa.user_id = user_id_param
    );
$$;

-- Create a function to safely manage team member roles (prevents demotion of super admins)
CREATE OR REPLACE FUNCTION public.update_team_member_role_safe(
    team_id_param uuid,
    target_user_id uuid,
    new_role text,
    requesting_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_is_super_admin boolean;
    result jsonb;
BEGIN
    -- Check if the target user is a super admin
    SELECT public.is_team_member_super_admin(team_id_param, target_user_id) INTO target_is_super_admin;

    -- If target is super admin, only allow admin role (cannot demote)
    IF target_is_super_admin AND new_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot demote super admin');
    END IF;

    -- If target is super admin and trying to demote, block it
    IF target_is_super_admin THEN
        -- Super admins must remain admins, so we can only "update" to admin role
        UPDATE public.team_members
        SET role = 'admin'
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN jsonb_build_object('success', true, 'message', 'Super admin role preserved');
    END IF;

    -- For non-super admins, proceed with normal role update
    -- But only if the requesting user is authorized (team creator or super admin)
    IF public.is_team_admin(team_id_param, requesting_user_id) OR public.is_super_admin(requesting_user_id) THEN
        UPDATE public.team_members
        SET role = new_role
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to manage team members');
    END IF;
END;
$$;

-- Create a function to safely remove team members (prevents removal of super admins)
CREATE OR REPLACE FUNCTION public.remove_team_member_safe(
    team_id_param uuid,
    target_user_id uuid,
    requesting_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_is_super_admin boolean;
    result jsonb;
BEGIN
    -- Check if the target user is a super admin
    SELECT public.is_team_member_super_admin(team_id_param, target_user_id) INTO target_is_super_admin;

    -- Cannot remove super admins from teams
    IF target_is_super_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot remove super admin from team');
    END IF;

    -- For non-super admins, proceed with normal removal
    -- But only if the requesting user is authorized (team creator or super admin)
    IF public.is_team_admin(team_id_param, requesting_user_id) OR public.is_super_admin(requesting_user_id) THEN
        DELETE FROM public.team_members
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to manage team members');
    END IF;
END;
$$;

-- Add RLS policies to protect super admin memberships
-- These policies prevent non-super-admins from modifying super admin team memberships

-- Policy to prevent updating super admin roles
CREATE POLICY "Prevent demotion of super admin team members"
ON public.team_members
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
    NOT (public.is_team_member_super_admin(team_id, user_id) AND role = 'admin')
)
WITH CHECK (
    NOT (public.is_team_member_super_admin(team_id, user_id) AND role != 'admin')
);

-- Policy to prevent deletion of super admin memberships
CREATE POLICY "Prevent removal of super admin team members"
ON public.team_members
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
    NOT public.is_team_member_super_admin(team_id, user_id)
);

-- Update existing teams to add current super admins as admins
-- This handles teams created before this migration
INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, sa.user_id, 'admin'
FROM public.teams t
CROSS JOIN public.super_admins sa
ON CONFLICT (team_id, user_id) DO NOTHING;

-- Add helpful comments
COMMENT ON FUNCTION public.add_team_creator_and_super_admins_as_admin() IS 'Automatically adds team creator and all super admins as admins when a team is created';
COMMENT ON FUNCTION public.is_team_member_super_admin(uuid, uuid) IS 'Checks if a user is a super admin';
COMMENT ON FUNCTION public.update_team_member_role_safe(uuid, uuid, text, uuid) IS 'Safely updates team member roles, preventing demotion of super admins';
COMMENT ON FUNCTION public.remove_team_member_safe(uuid, uuid, uuid) IS 'Safely removes team members, preventing removal of super admins';
