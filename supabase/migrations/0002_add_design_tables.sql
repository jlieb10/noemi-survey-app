-- Add design_sets and designs tables to support game functionality
-- This migration adds missing tables required by the application
-- All changes are additive and backwards-compatible

-- Create design_sets table to group related design images
create table if not exists public.design_sets (
  id uuid primary key default gen_random_uuid(),
  source_image_url text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create designs table to store individual design quadrants
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.design_sets(id) on delete cascade,
  quadrant_index integer not null check (quadrant_index >= 0 and quadrant_index <= 3),
  image_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_designs_set_id on public.designs(set_id);
create index if not exists idx_designs_quadrant on public.designs(quadrant_index);

-- Grant appropriate permissions for anonymous users (game functionality)
grant select on public.design_sets to anon;
grant select on public.designs to anon;

-- Grant permissions for authenticated users if needed
grant select on public.design_sets to authenticated;
grant select on public.designs to authenticated;

-- Add a comment to document the purpose
comment on table public.design_sets is 'Stores groups of related design images for the swipe game';
comment on table public.designs is 'Stores individual design quadrants that users can swipe on';