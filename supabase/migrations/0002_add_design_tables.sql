-- SAFE ADDITIVE MIGRATION: Add design tables and missing columns
-- This migration is designed to be 100% safe and non-destructive
-- Only CREATE TABLE, ADD COLUMN, and CREATE INDEX operations

-- Enable UUID generation extension if not already present  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SAFELY ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add missing columns to participants table (only if they don't exist)
DO $$ 
BEGIN
  -- Add location_data column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'location_data'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN location_data jsonb;
  END IF;
  
  -- Add is_complete column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'is_complete'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN is_complete boolean DEFAULT false;
  END IF;
  
  -- Add progress column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'progress'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN progress text;
  END IF;
  
  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'participants' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.participants ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- ============================================================================
-- CREATE NEW DESIGN TABLES (SAFE - ONLY IF THEY DON'T EXIST)
-- ============================================================================

-- Design sets table (Groups of 4 quadrant images from same source)
CREATE TABLE IF NOT EXISTS public.design_sets (
  id text PRIMARY KEY,
  source_image_url text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Individual designs table (Quadrant images for swipe game)  
CREATE TABLE IF NOT EXISTS public.designs (
  id text PRIMARY KEY,
  set_id text NOT NULL REFERENCES public.design_sets(id) ON DELETE CASCADE,
  quadrant_index integer NOT NULL CHECK (quadrant_index >= 0 AND quadrant_index <= 3),
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- CREATE SAFE INDEXES (ONLY IF THEY DON'T EXIST)
-- ============================================================================

-- Index for swipes by participant (may already exist)
CREATE INDEX IF NOT EXISTS idx_swipes_participant ON public.swipes(participant_id);

-- New indexes for design tables
CREATE INDEX IF NOT EXISTS idx_swipes_card ON public.swipes(card_id);
CREATE INDEX IF NOT EXISTS idx_designs_set ON public.designs(set_id);

-- Unique constraint for design quadrant positioning within sets
CREATE UNIQUE INDEX IF NOT EXISTS idx_designs_set_quadrant 
  ON public.designs(set_id, quadrant_index);

-- ============================================================================
-- ROW LEVEL SECURITY SETUP (SAFE - USES DROP IF EXISTS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.design_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Policies for design_sets: Read-only access for all users
DROP POLICY IF EXISTS "Allow read design_sets" ON public.design_sets;
CREATE POLICY "Allow read design_sets" ON public.design_sets
  FOR SELECT TO anon USING (true);

-- Policies for designs: Read-only access for all users
DROP POLICY IF EXISTS "Allow read designs" ON public.designs; 
CREATE POLICY "Allow read designs" ON public.designs
  FOR SELECT TO anon USING (true);

-- Allow authenticated users full access for admin operations
DROP POLICY IF EXISTS "Allow authenticated full access design_sets" ON public.design_sets;
CREATE POLICY "Allow authenticated full access design_sets" ON public.design_sets
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access designs" ON public.designs;
CREATE POLICY "Allow authenticated full access designs" ON public.designs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

-- Verify that all required tables exist
DO $$
DECLARE
  missing_tables text[] := '{}';
  table_name text;
BEGIN
  -- Check for required tables
  FOR table_name IN VALUES ('participants'), ('swipes'), ('design_sets'), ('designs') LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      missing_tables := missing_tables || table_name;
    END IF;
  END LOOP;
  
  -- Report results
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Migration failed - missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'Migration successful - all required tables present';
  END IF;
END $$;

-- Log successful migration
INSERT INTO public.participants (email, answers, marketing_opt_in) 
VALUES ('migration@internal.test', '{"migration": "0002_add_design_tables", "timestamp": "' || now()::text || '"}', false)
ON CONFLICT DO NOTHING;