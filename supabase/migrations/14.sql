CREATE OR REPLACE FUNCTION public.add_team_creator_and_super_admins_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');

    INSERT INTO public.team_members (team_id, user_id, role)
    SELECT NEW.id, sa.user_id, 'admin'
    FROM public.super_admins sa
    ON CONFLICT (team_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS add_team_creator_as_admin_trigger ON public.teams;
CREATE TRIGGER add_super_admin_team_membership_trigger
    AFTER INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.add_team_creator_and_super_admins_as_admin();

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
    SELECT public.is_team_member_super_admin(team_id_param, target_user_id) INTO target_is_super_admin;

    IF target_is_super_admin AND new_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot demote super admin');
    END IF;

    IF target_is_super_admin THEN
        UPDATE public.team_members
        SET role = 'admin'
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN jsonb_build_object('success', true, 'message', 'Super admin role preserved');
    END IF;

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
    SELECT public.is_team_member_super_admin(team_id_param, target_user_id) INTO target_is_super_admin;

    IF target_is_super_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot remove super admin from team');
    END IF;

    IF public.is_team_admin(team_id_param, requesting_user_id) OR public.is_super_admin(requesting_user_id) THEN
        DELETE FROM public.team_members
        WHERE team_id = team_id_param AND user_id = target_user_id;
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized to manage team members');
    END IF;
END;
$$;

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

CREATE POLICY "Prevent removal of super admin team members"
ON public.team_members
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
    NOT public.is_team_member_super_admin(team_id, user_id)
);

INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, sa.user_id, 'admin'
FROM public.teams t
CROSS JOIN public.super_admins sa
ON CONFLICT (team_id, user_id) DO NOTHING;

COMMENT ON FUNCTION public.add_team_creator_and_super_admins_as_admin() IS 'Automatically adds team creator and all super admins as admins when a team is created';
COMMENT ON FUNCTION public.is_team_member_super_admin(uuid, uuid) IS 'Checks if a user is a super admin';
COMMENT ON FUNCTION public.update_team_member_role_safe(uuid, uuid, text, uuid) IS 'Safely updates team member roles, preventing demotion of super admins';
COMMENT ON FUNCTION public.remove_team_member_safe(uuid, uuid, uuid) IS 'Safely removes team members, preventing removal of super admins';
