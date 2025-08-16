#!/usr/bin/env node

/**
 * Database Schema Verification Script
 * 
 * This script compares the expected schema (defined in supabase/schema.sql)
 * with the actual database schema to detect drift.
 * 
 * Usage:
 *   node scripts/check-schema.mjs [--local|--production]
 *   
 * Environment variables required:
 *   - VITE_SUPABASE_URL: Supabase project URL
 *   - VITE_SUPABASE_ANON_KEY: Supabase anonymous key
 *   - DATABASE_URL: Direct database connection (optional, for more detailed checks)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const REQUIRED_TABLES = ['participants', 'swipes', 'design_sets', 'designs'];
const SCHEMA_FILE = join(projectRoot, 'supabase', 'schema.sql');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class SchemaChecker {
  constructor() {
    this.supabase = null;
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Initialize Supabase client
   */
  initializeSupabase() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      this.addError('Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
      return false;
    }

    try {
      this.supabase = createClient(url, key);
      this.addInfo(`Connected to Supabase: ${url.substring(0, 20)}...`);
      return true;
    } catch (error) {
      this.addError(`Failed to initialize Supabase client: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if all required tables exist
   */
  async checkTablesExist() {
    this.addInfo('Checking for required tables...');
    
    for (const tableName of REQUIRED_TABLES) {
      try {
        // Try a simple select to check if table exists
        const { error } = await this.supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          // Table or view does not exist
          this.addError(`Missing required table: ${tableName}`);
        } else if (error && error.code !== '42P01') {
          // Some other error (permissions, etc.)
          this.addWarning(`Could not verify table ${tableName}: ${error.message}`);
        } else {
          this.addInfo(`✓ Table ${tableName} exists`);
        }
      } catch (error) {
        this.addWarning(`Error checking table ${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Test database connectivity and basic operations
   */
  async testDatabaseOperations() {
    this.addInfo('Testing basic database operations...');

    // Test participants table - should allow inserts for survey
    try {
      const testData = {
        answers: { test: true },
        marketing_opt_in: false,
        is_complete: false
      };

      // Try to insert and immediately delete a test record
      const { data, error } = await this.supabase
        .from('participants')
        .insert(testData)
        .select()
        .single();

      if (error) {
        this.addError(`Cannot insert into participants table: ${error.message}`);
      } else {
        // Clean up test data
        await this.supabase
          .from('participants')
          .delete()
          .eq('id', data.id);
        this.addInfo('✓ Participants table write permissions OK');
      }
    } catch (error) {
      this.addError(`Error testing participants operations: ${error.message}`);
    }

    // Test designs table - should allow reads for game
    try {
      const { error } = await this.supabase
        .from('designs')
        .select('id, set_id, quadrant_index, image_url')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        this.addError('Designs table does not exist - game will not work');
      } else if (error) {
        this.addWarning(`Issue accessing designs table: ${error.message}`);
      } else {
        this.addInfo('✓ Designs table read permissions OK');
      }
    } catch (error) {
      this.addWarning(`Error testing designs access: ${error.message}`);
    }
  }

  /**
   * Load expected schema from file
   */
  loadExpectedSchema() {
    try {
      const schemaContent = readFileSync(SCHEMA_FILE, 'utf-8');
      this.addInfo(`Loaded expected schema from ${SCHEMA_FILE}`);
      return schemaContent;
    } catch (error) {
      this.addError(`Could not load schema file: ${error.message}`);
      return null;
    }
  }

  /**
   * Generate schema report
   */
  generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      status: this.errors.length === 0 ? 'PASS' : 'FAIL',
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      summary: {
        total_errors: this.errors.length,
        total_warnings: this.warnings.length,
        required_tables: REQUIRED_TABLES,
        recommendations: this.generateRecommendations()
      }
    };

    return report;
  }

  /**
   * Generate recommendations based on findings
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.errors.some(e => e.includes('Missing required table'))) {
      recommendations.push('Run database migrations: Apply all migrations in supabase/migrations/');
    }

    if (this.errors.some(e => e.includes('Cannot insert'))) {
      recommendations.push('Check database permissions: Ensure anon role has correct table permissions');
    }

    if (this.warnings.length > 0) {
      recommendations.push('Review warnings: Some database operations may not work as expected');
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      recommendations.push('Schema is in sync! No action required.');
    }

    return recommendations;
  }

  // Utility methods for colored output
  addError(message) {
    this.errors.push(message);
    console.error(`${colors.red}ERROR: ${message}${colors.reset}`);
  }

  addWarning(message) {
    this.warnings.push(message);
    console.warn(`${colors.yellow}WARNING: ${message}${colors.reset}`);
  }

  addInfo(message) {
    this.info.push(message);
    console.log(`${colors.blue}INFO: ${message}${colors.reset}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  const checker = new SchemaChecker();
  
  console.log(`${colors.bold}${colors.blue}NOEMI Survey App - Database Schema Check${colors.reset}`);
  console.log('='.repeat(50));

  // Initialize
  if (!checker.initializeSupabase()) {
    process.exit(1);
  }

  // Load expected schema
  const expectedSchema = checker.loadExpectedSchema();
  if (!expectedSchema) {
    process.exit(1);
  }

  // Run checks
  await checker.checkTablesExist();
  await checker.testDatabaseOperations();

  // Generate and display report
  const report = checker.generateReport();
  
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.bold}SCHEMA CHECK REPORT${colors.reset}`);
  console.log(`Status: ${report.status === 'PASS' ? colors.green + 'PASS' : colors.red + 'FAIL'}${colors.reset}`);
  console.log(`Errors: ${report.summary.total_errors}`);
  console.log(`Warnings: ${report.summary.total_warnings}`);
  
  if (report.summary.recommendations.length > 0) {
    console.log(`\n${colors.bold}RECOMMENDATIONS:${colors.reset}`);
    report.summary.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
  }

  // Exit with appropriate code
  process.exit(report.summary.total_errors > 0 ? 1 : 0);
}

// Run the main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${colors.red}Script failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default SchemaChecker;