-- Enable Row Level Security
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

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