-- Revert single-team membership restriction.
-- This drops the unique index on (user_id) so users can join/create multiple teams.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'team_members_user_id_unique'
  ) THEN
    EXECUTE 'DROP INDEX public.team_members_user_id_unique';
  END IF;
END $$;

-- (team_id, user_id) composite uniqueness remains to prevent duplicate membership in the same team.
-- No changes to RLS needed.
