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
