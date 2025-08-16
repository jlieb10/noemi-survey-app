-- Add missing permissions for anonymous and authenticated users
-- This migration addresses permission denied errors when inserting data
-- All changes are additive and backwards-compatible

-- Grant permissions to anonymous users (required for public survey and game access)
grant insert, select on public.participants to anon;
grant insert, select, delete on public.swipes to anon;

-- Grant permissions to authenticated users
grant insert, select, update, delete on public.participants to authenticated;
grant insert, select, update, delete on public.swipes to authenticated;

-- Add comments for documentation
comment on table public.participants is 'Survey participants and their responses';
comment on table public.swipes is 'User swipe actions for design rating game';