import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Tests for database schema verification system
 * These tests validate the schema checking functionality and ensure
 * the expected schema file is properly maintained.
 */
describe('Schema Verification System', () => {
  const projectRoot = join(process.cwd());
  const schemaFilePath = join(projectRoot, 'supabase', 'schema.sql');

  describe('Schema File Validation', () => {
    it('should have a valid schema.sql file', () => {
      expect(() => {
        const schemaContent = readFileSync(schemaFilePath, 'utf-8');
        expect(schemaContent).toBeTruthy();
        expect(schemaContent.length).toBeGreaterThan(100);
      }).not.toThrow();
    });

    it('should define all required tables in schema.sql', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      const requiredTables = ['participants', 'swipes', 'design_sets', 'designs'];
      
      for (const table of requiredTables) {
        expect(schemaContent).toContain(`create table if not exists public.${table}`);
      }
    });

    it('should include proper permissions for anonymous users', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      
      // Check for anon permissions on required tables
      expect(schemaContent).toContain('grant insert, select on public.participants to anon');
      expect(schemaContent).toContain('grant insert, select, delete on public.swipes to anon');
      expect(schemaContent).toContain('grant select on public.design_sets to anon');
      expect(schemaContent).toContain('grant select on public.designs to anon');
    });

    it('should include required indexes for performance', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      
      // Check for performance indexes
      expect(schemaContent).toContain('idx_swipes_participant');
      expect(schemaContent).toContain('idx_designs_set_id');
      expect(schemaContent).toContain('idx_designs_quadrant');
    });
  });

  describe('Migration Files', () => {
    it('should have migration files present', () => {
      const migration1Path = join(projectRoot, 'supabase', 'migrations', '0001_init.sql');
      const migration2Path = join(projectRoot, 'supabase', 'migrations', '0002_add_design_tables.sql');
      
      expect(() => {
        readFileSync(migration1Path, 'utf-8');
      }).not.toThrow();
      
      expect(() => {
        readFileSync(migration2Path, 'utf-8');
      }).not.toThrow();
    });

    it('should have consistent table definitions between migrations and schema', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      const migration1 = readFileSync(join(projectRoot, 'supabase', 'migrations', '0001_init.sql'), 'utf-8');
      const migration2 = readFileSync(join(projectRoot, 'supabase', 'migrations', '0002_add_design_tables.sql'), 'utf-8');
      
      // Check that participants table structure is consistent
      if (migration1.includes('create table if not exists public.participants')) {
        expect(schemaContent).toContain('create table if not exists public.participants');
      }
      
      // Check that design tables structure is consistent
      if (migration2.includes('create table if not exists public.design_sets')) {
        expect(schemaContent).toContain('create table if not exists public.design_sets');
      }
    });
  });

  describe('Schema Verification Scripts', () => {
    it('should have schema check script available', () => {
      const schemaCheckScript = join(projectRoot, 'scripts', 'check-schema.mjs');
      
      expect(() => {
        const scriptContent = readFileSync(schemaCheckScript, 'utf-8');
        expect(scriptContent).toContain('SchemaChecker');
        expect(scriptContent).toContain('checkTablesExist');
        expect(scriptContent).toContain('testDatabaseOperations');
      }).not.toThrow();
    });

    it('should have design seeding script available', () => {
      const seedScript = join(projectRoot, 'scripts', 'seed-designs.mjs');
      
      expect(() => {
        const scriptContent = readFileSync(seedScript, 'utf-8');
        expect(scriptContent).toContain('DesignSeeder');
        expect(scriptContent).toContain('seedDesignSets');
        expect(scriptContent).toContain('seedDesigns');
      }).not.toThrow();
    });
  });

  describe('Package.json Script Integration', () => {
    it('should have schema-related scripts defined in package.json', () => {
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      
      expect(packageJson.scripts).toHaveProperty('schema:check');
      expect(packageJson.scripts).toHaveProperty('schema:verify');
      expect(packageJson.scripts).toHaveProperty('db:seed');
      expect(packageJson.scripts).toHaveProperty('db:seed:dry');
    });
  });

  describe('Required Table Structure Validation', () => {
    it('should define participants table with required columns', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      
      // Extract participants table definition
      const participantsTableMatch = schemaContent.match(
        /create table if not exists public\.participants \(([\s\S]*?)\);/
      );
      
      expect(participantsTableMatch).toBeTruthy();
      
      const tableDefinition = participantsTableMatch[1];
      
      // Check for required columns
      expect(tableDefinition).toContain('id bigint');
      expect(tableDefinition).toContain('email text');
      expect(tableDefinition).toContain('marketing_opt_in boolean');
      expect(tableDefinition).toContain('answers jsonb');
      expect(tableDefinition).toContain('location_data jsonb');
      expect(tableDefinition).toContain('is_complete boolean');
      expect(tableDefinition).toContain('created_at timestamptz');
    });

    it('should define swipes table with required columns', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      
      // Extract swipes table definition
      const swipesTableMatch = schemaContent.match(
        /create table if not exists public\.swipes \(([\s\S]*?)\);/
      );
      
      expect(swipesTableMatch).toBeTruthy();
      
      const tableDefinition = swipesTableMatch[1];
      
      // Check for required columns and constraints
      expect(tableDefinition).toContain('id bigint');
      expect(tableDefinition).toContain('participant_id bigint');
      expect(tableDefinition).toContain('card_id');
      expect(tableDefinition).toContain('choice text');
      expect(tableDefinition).toContain('references public.participants(id)');
      expect(tableDefinition).toContain("choice in ('like','dislike','love','not_sure')");
    });

    it('should define designs table with proper foreign key relationships', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      
      // Extract designs table definition
      const designsTableMatch = schemaContent.match(
        /create table if not exists public\.designs \(([\s\S]*?)\);/
      );
      
      expect(designsTableMatch).toBeTruthy();
      
      const tableDefinition = designsTableMatch[1];
      
      // Check for required columns and relationships
      expect(tableDefinition).toContain('id uuid');
      expect(tableDefinition).toContain('set_id uuid');
      expect(tableDefinition).toContain('quadrant_index integer');
      expect(tableDefinition).toContain('image_url text');
      expect(tableDefinition).toContain('references public.design_sets(id)');
      expect(tableDefinition).toContain('quadrant_index >= 0 and quadrant_index <= 3');
    });
  });

  describe('Safety Policy Compliance', () => {
    it('should only contain safe SQL operations in migrations', () => {
      const migration1 = readFileSync(join(projectRoot, 'supabase', 'migrations', '0001_init.sql'), 'utf-8');
      const migration2 = readFileSync(join(projectRoot, 'supabase', 'migrations', '0002_add_design_tables.sql'), 'utf-8');
      
      const allMigrations = migration1 + '\n' + migration2;
      
      // Check for safe operations only
      expect(allMigrations.toLowerCase()).toContain('create table if not exists');
      expect(allMigrations.toLowerCase()).toContain('create index if not exists');
      
      // Ensure no destructive operations
      expect(allMigrations.toLowerCase()).not.toContain('drop table');
      expect(allMigrations.toLowerCase()).not.toContain('drop column');
      expect(allMigrations.toLowerCase()).not.toContain('alter column');
      expect(allMigrations.toLowerCase()).not.toContain('delete from');
      expect(allMigrations.toLowerCase()).not.toContain('truncate');
    });

    it('should use safe default values and constraints', () => {
      const schemaContent = readFileSync(schemaFilePath, 'utf-8');
      
      // Check for safe defaults
      expect(schemaContent).toContain('default false'); // boolean defaults
      expect(schemaContent).toContain("default '{}'"); // jsonb defaults
      expect(schemaContent).toContain('default now()'); // timestamp defaults
      
      // Check for NOT NULL constraints where appropriate
      expect(schemaContent).toContain('answers jsonb not null');
      expect(schemaContent).toContain('image_url text not null');
    });
  });
});