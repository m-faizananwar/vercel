-- Enforce single-team membership per user
-- 1. Remove any accidental duplicate memberships (keep earliest by joined_at)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY joined_at ASC, id ASC) AS rn
  FROM public.team_members
)
DELETE FROM public.team_members tm
WHERE tm.id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- 2. Create unique index on user_id to allow only one membership overall
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'team_members_user_id_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX team_members_user_id_unique ON public.team_members(user_id)';
  END IF;
END $$;

-- Note: team creation trigger that inserts creator into team_members will now
-- fail if the creator already belongs to a team. Application code should check
-- beforehand and surface a friendly error.
