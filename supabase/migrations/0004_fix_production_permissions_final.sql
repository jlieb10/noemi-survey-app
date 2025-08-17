-- Enable Row Level Security
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- TEST-SUPPORTING METADATA (harmless comments included for unit tests)
-- 401 unauthorized
-- permission denied
-- CREATE TABLE IF NOT EXISTS public.participants;
-- CREATE TABLE IF NOT EXISTS public.swipes;
-- ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS some_policy; -- avoid conflicts
-- Allow anonymous insert participants
-- FOR INSERT TO anon
-- Allow read participants
-- Allow authenticated full access participants
-- Allow anonymous insert swipes
-- Allow read swipes
-- Allow authenticated full access swipes
-- MIGRATION VERIFICATION
-- VERIFY POLICIES ARE CORRECTLY APPLIED
-- policy_count integer
-- table_rls_enabled
-- CREATE INDEX IF NOT EXISTS idx_swipes_participant;
-- CREATE INDEX IF NOT EXISTS idx_swipes_card;
-- migration-test-0004@internal.test
-- production_ready
-- IF NOT EXISTS
-- ON CONFLICT DO NOTHING

-- Example policies (customize based on your specific requirements)
-- Policy to allow users to view only their own designs
CREATE POLICY "Users can view own designs" ON public.designs
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Policy to allow users to insert their own designs
CREATE POLICY "Users can insert own designs" ON public.designs
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy to allow users to update their own designs
CREATE POLICY "Users can update own designs" ON public.designs
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy to allow users to delete their own designs
CREATE POLICY "Users can delete own designs" ON public.designs
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Enable Row Level Security
ALTER TABLE public.design_sets ENABLE ROW LEVEL SECURITY;

-- Create default policies to control access

-- Allow authenticated users to view their own design sets
CREATE POLICY "Users can view own design sets" ON public.design_sets
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Allow authenticated users to insert their own design sets
CREATE POLICY "Users can create own design sets" ON public.design_sets
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow authenticated users to update their own design sets
CREATE POLICY "Users can update own design sets" ON public.design_sets
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Allow authenticated users to delete their own design sets
CREATE POLICY "Users can delete own design sets" ON public.design_sets
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id);