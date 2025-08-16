import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Tests for database schema files and structure
 * Ensures schema files exist and contain required content
 */
describe('Database Schema Management', () => {
  const projectRoot = process.cwd();
  const supabasePath = join(projectRoot, 'supabase');
  const expectedSchemaPath = join(supabasePath, 'expected-schema.sql');
  const migrationPath = join(supabasePath, 'migrations', '0002_add_design_tables.sql');
  
  describe('Schema Files Exist', () => {
    it('should have expected-schema.sql file', () => {
      expect(existsSync(expectedSchemaPath)).toBe(true);
    });
    
    it('should have additive migration file', () => {
      expect(existsSync(migrationPath)).toBe(true);
    });
    
    it('should have schema check script', () => {
      const scriptPath = join(projectRoot, 'scripts', 'check-schema-drift.sh');
      expect(existsSync(scriptPath)).toBe(true);
    });
  });
  
  describe('Expected Schema Content', () => {
    it('should define all required tables', () => {
      const schemaContent = readFileSync(expectedSchemaPath, 'utf-8');
      
      // Check for all required tables
      expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS public.participants');
      expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS public.swipes');  
      expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS public.design_sets');
      expect(schemaContent).toContain('CREATE TABLE IF NOT EXISTS public.designs');
    });
    
    it('should include required participant columns', () => {
      const schemaContent = readFileSync(expectedSchemaPath, 'utf-8');
      
      // Key columns for survey functionality
      expect(schemaContent).toContain('email text');
      expect(schemaContent).toContain('answers jsonb NOT NULL');
      expect(schemaContent).toContain('marketing_opt_in boolean');
      expect(schemaContent).toContain('location_data jsonb');
    });
    
    it('should include required swipes columns', () => {
      const schemaContent = readFileSync(expectedSchemaPath, 'utf-8');
      
      // Key columns for swipe game functionality
      expect(schemaContent).toContain('participant_id bigint NOT NULL');
      expect(schemaContent).toContain('card_id text NOT NULL');
      expect(schemaContent).toContain('choice text CHECK');
    });
    
    it('should include required design columns', () => {
      const schemaContent = readFileSync(expectedSchemaPath, 'utf-8');
      
      // Key columns for design management
      expect(schemaContent).toContain('set_id text NOT NULL');
      expect(schemaContent).toContain('quadrant_index integer NOT NULL');
      expect(schemaContent).toContain('image_url text NOT NULL');
    });
    
    it('should include performance indexes', () => {
      const schemaContent = readFileSync(expectedSchemaPath, 'utf-8');
      
      // Critical indexes for app performance
      expect(schemaContent).toContain('idx_swipes_participant');
      expect(schemaContent).toContain('idx_swipes_card');
      expect(schemaContent).toContain('idx_designs_set');
    });
    
    it('should include proper foreign key relationships', () => {
      const schemaContent = readFileSync(expectedSchemaPath, 'utf-8');
      
      // Foreign key constraints for data integrity  
      expect(schemaContent).toContain('REFERENCES public.participants(id)');
      expect(schemaContent).toContain('REFERENCES public.design_sets(id)');
    });
  });
  
  describe('Migration Safety', () => {
    it('should only contain safe operations', () => {
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      
      // Allowed operations
      expect(migrationContent).toMatch(/CREATE TABLE IF NOT EXISTS/);
      expect(migrationContent).toMatch(/CREATE INDEX IF NOT EXISTS/);
      expect(migrationContent).toMatch(/ADD COLUMN/);
      
      // Prohibited operations should not exist
      expect(migrationContent).not.toContain('DROP TABLE');
      expect(migrationContent).not.toContain('DROP COLUMN');
      expect(migrationContent).not.toContain('ALTER COLUMN');
      expect(migrationContent).not.toMatch(/ALTER TABLE.*DROP/);
    });
    
    it('should use conditional column additions', () => {
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      
      // Should check for column existence before adding
      expect(migrationContent).toContain('IF NOT EXISTS');
      expect(migrationContent).toContain('information_schema.columns');
    });
    
    it('should include migration verification', () => {
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      
      // Should verify migration succeeded
      expect(migrationContent).toContain('Migration successful');
      expect(migrationContent).toMatch(/missing_tables.*text\[\]/);
    });
  });
  
  describe('Schema Consistency', () => {
    it('should have consistent table definitions between expected and migration', () => {
      const expectedContent = readFileSync(expectedSchemaPath, 'utf-8');
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      
      // Both should define design_sets with same structure
      const expectedDesignSets = expectedContent.match(/CREATE TABLE[^;]*design_sets[^;]*;/s)?.[0];
      const migrationDesignSets = migrationContent.match(/CREATE TABLE[^;]*design_sets[^;]*;/s)?.[0];
      
      expect(expectedDesignSets).toBeDefined();
      expect(migrationDesignSets).toBeDefined();
      
      // Key fields should match (ignoring whitespace differences)
      expect(expectedDesignSets?.replace(/\s+/g, ' ')).toContain('id text PRIMARY KEY');
      expect(migrationDesignSets?.replace(/\s+/g, ' ')).toContain('id text PRIMARY KEY');
    });
    
    it('should have consistent index definitions', () => {
      const expectedContent = readFileSync(expectedSchemaPath, 'utf-8');
      const migrationContent = readFileSync(migrationPath, 'utf-8');
      
      // Extract index names from both files
      const expectedIndexes = expectedContent.match(/CREATE.*INDEX.*idx_\w+/g) || [];
      const migrationIndexes = migrationContent.match(/CREATE.*INDEX.*idx_\w+/g) || [];
      
      // Migration should create at least some of the expected indexes
      expect(migrationIndexes.length).toBeGreaterThan(0);
      
      // Check that critical indexes are in both
      const criticalIndexes = ['idx_swipes_participant', 'idx_designs_set'];
      criticalIndexes.forEach(indexName => {
        const inExpected = expectedIndexes.some(idx => idx.includes(indexName));
        const inMigration = migrationIndexes.some(idx => idx.includes(indexName));
        
        expect(inExpected).toBe(true);
        expect(inMigration).toBe(true);
      });
    });
  });
  
  describe('Schema Documentation', () => {
    it('should have database schema documentation', () => {
      const docsPath = join(projectRoot, 'docs', 'database-schema.md');
      expect(existsSync(docsPath)).toBe(true);
    });
    
    it('should document safety policy', () => {
      const docsPath = join(projectRoot, 'docs', 'database-schema.md');
      const docsContent = readFileSync(docsPath, 'utf-8');
      
      // Should document allowed and prohibited operations
      expect(docsContent).toContain('ALLOWED Operations');
      expect(docsContent).toContain('PROHIBITED Operations');
      expect(docsContent).toContain('CREATE TABLE IF NOT EXISTS');
      expect(docsContent).toContain('DROP TABLE');
    });
  });
});