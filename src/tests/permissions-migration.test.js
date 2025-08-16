/**
 * Test for the permission migration file
 * Ensures that the migration contains the necessary GRANT statements
 * to fix the "permission denied" error for anonymous users
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(import.meta.dirname, '..', '..');
const MIGRATION_FILE = join(PROJECT_ROOT, 'supabase', 'migrations', '0003_add_missing_permissions.sql');

describe('Permission Migration (0003_add_missing_permissions.sql)', () => {
  let migrationContent;

  beforeAll(() => {
    migrationContent = readFileSync(MIGRATION_FILE, 'utf-8');
  });

  it('should contain GRANT permissions for anonymous users on participants table', () => {
    expect(migrationContent).toContain('grant insert, select on public.participants to anon');
  });

  it('should contain GRANT permissions for anonymous users on swipes table', () => {
    expect(migrationContent).toContain('grant insert, select, delete on public.swipes to anon');
  });

  it('should contain GRANT permissions for authenticated users on participants table', () => {
    expect(migrationContent).toContain('grant insert, select, update, delete on public.participants to authenticated');
  });

  it('should contain GRANT permissions for authenticated users on swipes table', () => {
    expect(migrationContent).toContain('grant insert, select, update, delete on public.swipes to authenticated');
  });

  it('should contain documentation comments', () => {
    expect(migrationContent).toContain('comment on table public.participants');
    expect(migrationContent).toContain('comment on table public.swipes');
  });

  it('should only contain safe additive changes', () => {
    // Ensure no destructive operations are present
    const destructiveOperations = [
      'drop table',
      'drop column',
      'alter column',
      'truncate',
      'revoke'
    ];

    const lowerContent = migrationContent.toLowerCase();
    destructiveOperations.forEach(operation => {
      expect(lowerContent).not.toContain(operation);
    });
  });

  it('should be properly formatted SQL', () => {
    // Check for proper SQL structure
    expect(migrationContent).toContain(';'); // Has SQL statements
    expect(migrationContent.trim()).not.toBe(''); // Not empty
    
    // Check that each GRANT statement is properly terminated
    const grantStatements = migrationContent.match(/grant [^;]+;/gi);
    expect(grantStatements).toHaveLength(4); // Should have 4 GRANT statements
  });
});