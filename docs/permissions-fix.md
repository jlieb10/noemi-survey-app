# Database Permissions Issue Resolution

## Problem

Users were encountering this error when submitting surveys:

```
Supabase insert error: 
{code: '42501', details: null, hint: null, message: 'permission denied for schema public'}
```

## Root Cause

The original migration (`0001_init.sql`) created the `participants` and `swipes` tables but did not grant the necessary permissions for anonymous users to insert data. The survey application requires anonymous users to be able to insert survey responses.

## Solution

**Migration 0003_add_missing_permissions.sql** has been added to resolve this issue by adding the required permissions:

```sql
-- Grant permissions to anonymous users (required for public survey access)
grant insert, select on public.participants to anon;
grant insert, select, delete on public.swipes to anon;

-- Grant permissions to authenticated users
grant insert, select, update, delete on public.participants to authenticated;
grant insert, select, update, delete on public.swipes to authenticated;
```

## Action Required

⚠️ **CRITICAL**: This migration must be applied to production databases to fix the permission error.

Run this SQL in your Supabase dashboard SQL editor:

```sql
-- Grant permissions to anonymous users (required for public survey access)
grant insert, select on public.participants to anon;
grant insert, select, delete on public.swipes to anon;

-- Grant permissions to authenticated users
grant insert, select, update, delete on public.participants to authenticated;
grant insert, select, update, delete on public.swipes to authenticated;
```

## Verification

After applying the migration:

1. Submit a test survey
2. Check that you no longer get the "permission denied" error
3. Verify data appears in the `participants` table in Supabase dashboard

## Prevention

The schema verification system (`npm run schema:check`) now tests database permissions as part of the validation process to catch similar issues early.