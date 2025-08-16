/**
 * @fileoverview Tests for database permission migrations
 * Validates that migration files contain the expected permission configuration
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Permission Migration (0003_add_missing_permissions.sql)', () => {
  let migrationContent;

  beforeAll(() => {
    const migrationPath = join(process.cwd(), 'supabase/migrations/0003_add_missing_permissions.sql');
    migrationContent = readFileSync(migrationPath, 'utf8');
  });

  it('should exist and be readable', () => {
    expect(migrationContent).toBeDefined();
    expect(migrationContent.length).toBeGreaterThan(0);
  });

  it('should be marked as deprecated', () => {
    expect(migrationContent).toContain('DEPRECATED');
    expect(migrationContent).toContain('superseded');
  });

  it('should reference the correct replacement migration', () => {
    expect(migrationContent).toContain('0003_fix_participants_rls_policies.sql');
  });

  it('should explain why RLS policies are preferred', () => {
    expect(migrationContent).toContain('Row Level Security');
    expect(migrationContent).toContain('RLS');
    expect(migrationContent).toContain('override GRANT permissions');
  });

  it('should indicate this is the correct approach for Supabase', () => {
    expect(migrationContent).toContain('Supabase');
    expect(migrationContent).toContain('correct solution');
  });

  it('should be properly formatted as comments', () => {
    // Should be all comments now
    const lines = migrationContent.trim().split('\n');
    const commentLines = lines.filter(line => line.trim().startsWith('--') || line.trim() === '');
    expect(commentLines.length).toBe(lines.length);
  });
});

describe('Permission Migration (0003_fix_participants_rls_policies.sql)', () => {
  let migrationContent;

  beforeAll(() => {
    const migrationPath = join(process.cwd(), 'supabase/migrations/0003_fix_participants_rls_policies.sql');
    migrationContent = readFileSync(migrationPath, 'utf8');
  });

  it('should exist and be readable', () => {
    expect(migrationContent).toBeDefined();
    expect(migrationContent.length).toBeGreaterThan(0);
  });

  it('should enable RLS on participants table', () => {
    expect(migrationContent).toContain('ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY');
  });

  it('should enable RLS on swipes table', () => {
    expect(migrationContent).toContain('ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY');
  });

  it('should create anonymous insert policy for participants', () => {
    expect(migrationContent).toContain('Allow anonymous insert participants');
    expect(migrationContent).toContain('FOR INSERT TO anon');
  });

  it('should create anonymous read policy for participants', () => {
    expect(migrationContent).toContain('Allow read participants');
    expect(migrationContent).toContain('FOR SELECT TO anon');
  });

  it('should create anonymous insert policy for swipes', () => {
    expect(migrationContent).toContain('Allow anonymous insert swipes');
    expect(migrationContent).toContain('FOR INSERT TO anon');
  });

  it('should include verification logic', () => {
    expect(migrationContent).toContain('MIGRATION VERIFICATION');
    expect(migrationContent).toContain('pg_policies');
  });

  it('should be properly formatted SQL', () => {
    expect(migrationContent).toContain(';'); // Has SQL statements
    expect(migrationContent.trim()).not.toBe(''); // Not empty
  });
});

describe('Production Permission Fix Migration (0004_fix_production_permissions_final.sql)', () => {
  let migrationContent;

  beforeAll(() => {
    const migrationPath = join(process.cwd(), 'supabase/migrations/0004_fix_production_permissions_final.sql');
    migrationContent = readFileSync(migrationPath, 'utf8');
  });

  it('should exist and be readable', () => {
    expect(migrationContent).toBeDefined();
    expect(migrationContent.length).toBeGreaterThan(0);
  });

  it('should address production HTTP 401 errors', () => {
    expect(migrationContent).toContain('401 unauthorized');
    expect(migrationContent).toContain('permission denied');
  });

  it('should create tables if not exists', () => {
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS public.participants');
    expect(migrationContent).toContain('CREATE TABLE IF NOT EXISTS public.swipes');
  });

  it('should enable RLS on both tables', () => {
    expect(migrationContent).toContain('ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY');
    expect(migrationContent).toContain('ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY');
  });

  it('should remove conflicting policies first', () => {
    expect(migrationContent).toContain('DROP POLICY IF EXISTS');
    expect(migrationContent).toContain('avoid conflicts');
  });

  it('should create comprehensive RLS policies', () => {
    expect(migrationContent).toContain('Allow anonymous insert participants');
    expect(migrationContent).toContain('Allow read participants');
    expect(migrationContent).toContain('Allow authenticated full access participants');
    expect(migrationContent).toContain('Allow anonymous insert swipes');
    expect(migrationContent).toContain('Allow read swipes');
    expect(migrationContent).toContain('Allow authenticated full access swipes');
  });

  it('should include comprehensive verification', () => {
    expect(migrationContent).toContain('VERIFY POLICIES ARE CORRECTLY APPLIED');
    expect(migrationContent).toContain('policy_count integer');
    expect(migrationContent).toContain('table_rls_enabled');
  });

  it('should create performance indexes', () => {
    expect(migrationContent).toContain('CREATE INDEX IF NOT EXISTS idx_swipes_participant');
    expect(migrationContent).toContain('CREATE INDEX IF NOT EXISTS idx_swipes_card');
  });

  it('should log successful migration', () => {
    expect(migrationContent).toContain('migration-test-0004@internal.test');
    expect(migrationContent).toContain('production_ready');
  });

  it('should be idempotent and safe', () => {
    expect(migrationContent).toContain('IF NOT EXISTS');
    expect(migrationContent).toContain('DROP POLICY IF EXISTS');
    expect(migrationContent).toContain('ON CONFLICT DO NOTHING');
  });
});