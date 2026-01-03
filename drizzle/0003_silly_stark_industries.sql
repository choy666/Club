DO $$
BEGIN
  ALTER TYPE "public"."due_status" ADD VALUE 'FROZEN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;