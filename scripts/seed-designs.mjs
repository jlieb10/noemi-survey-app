#!/usr/bin/env node

/**
 * Database Seeding Script for Design Data
 * 
 * This script populates the design_sets and designs tables with data
 * from the static JSON file (public/designs/index.json).
 * 
 * Usage:
 *   node scripts/seed-designs.mjs [--dry-run]
 *   
 * Environment variables required:
 *   - VITE_SUPABASE_URL: Supabase project URL
 *   - VITE_SUPABASE_ANON_KEY: Supabase anonymous key (with appropriate permissions)
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
const DESIGNS_JSON_PATH = join(projectRoot, 'public', 'designs', 'index.json');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class DesignSeeder {
  constructor(dryRun = false) {
    this.supabase = null;
    this.dryRun = dryRun;
    this.stats = {
      setsProcessed: 0,
      designsProcessed: 0,
      errors: 0
    };
  }

  /**
   * Initialize Supabase client
   */
  initializeSupabase() {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      this.logError('Missing required environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
      return false;
    }

    try {
      this.supabase = createClient(url, key);
      this.logInfo(`Connected to Supabase: ${url.substring(0, 25)}...`);
      return true;
    } catch (error) {
      this.logError(`Failed to initialize Supabase client: ${error.message}`);
      return false;
    }
  }

  /**
   * Load design data from JSON file
   */
  loadDesignData() {
    try {
      const rawData = readFileSync(DESIGNS_JSON_PATH, 'utf-8');
      const designs = JSON.parse(rawData);
      this.logInfo(`Loaded ${designs.length} designs from JSON file`);
      return designs;
    } catch (error) {
      this.logError(`Could not load designs JSON: ${error.message}`);
      return null;
    }
  }

  /**
   * Group designs by set_id and prepare data structures
   */
  prepareData(designs) {
    const designsBySet = designs.reduce((acc, design) => {
      if (!acc[design.set_id]) {
        acc[design.set_id] = [];
      }
      acc[design.set_id].push(design);
      return acc;
    }, {});

    // Create design_sets data
    const designSets = Object.keys(designsBySet).map(setId => {
      const designs = designsBySet[setId];
      // Try to extract source image name from first design
      const firstImage = designs[0]?.image_url || '';
      const sourceImage = firstImage.replace(/_q[0-3]\.jpg$/, '.jpg');
      
      return {
        id: setId,
        source_image_url: sourceImage,
        note: `Generated from ${designs.length} quadrants`
      };
    });

    this.logInfo(`Prepared ${designSets.length} design sets`);
    return { designSets, designsBySet };
  }

  /**
   * Check if data already exists in the database
   */
  async checkExistingData() {
    try {
      const { data: existingSets, error: setsError } = await this.supabase
        .from('design_sets')
        .select('id')
        .limit(1);

      const { data: existingDesigns, error: designsError } = await this.supabase
        .from('designs')
        .select('id')
        .limit(1);

      if (setsError || designsError) {
        this.logWarning('Could not check existing data - tables may not exist yet');
        return false;
      }

      const hasExistingData = existingSets?.length > 0 || existingDesigns?.length > 0;
      
      if (hasExistingData) {
        this.logWarning('Database already contains design data');
        return true;
      }

      return false;
    } catch (error) {
      this.logWarning(`Error checking existing data: ${error.message}`);
      return false;
    }
  }

  /**
   * Seed design_sets table
   */
  async seedDesignSets(designSets) {
    this.logInfo(`Seeding ${designSets.length} design sets...`);

    if (this.dryRun) {
      this.logInfo('[DRY RUN] Would insert design sets:', designSets.slice(0, 2));
      this.stats.setsProcessed = designSets.length;
      return true;
    }

    try {
      // Use upsert to handle existing IDs gracefully
      const { data, error } = await this.supabase
        .from('design_sets')
        .upsert(designSets, { onConflict: 'id' })
        .select();

      if (error) {
        this.logError(`Failed to seed design sets: ${error.message}`);
        this.stats.errors++;
        return false;
      }

      this.stats.setsProcessed = data?.length || designSets.length;
      this.logSuccess(`Seeded ${this.stats.setsProcessed} design sets`);
      return true;
    } catch (error) {
      this.logError(`Error seeding design sets: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Seed designs table
   */
  async seedDesigns(designsBySet) {
    const allDesigns = Object.values(designsBySet).flat();
    this.logInfo(`Seeding ${allDesigns.length} designs...`);

    if (this.dryRun) {
      this.logInfo('[DRY RUN] Would insert designs:', allDesigns.slice(0, 2));
      this.stats.designsProcessed = allDesigns.length;
      return true;
    }

    try {
      // Use upsert to handle existing IDs gracefully
      const { data, error } = await this.supabase
        .from('designs')
        .upsert(allDesigns, { onConflict: 'id' })
        .select();

      if (error) {
        this.logError(`Failed to seed designs: ${error.message}`);
        this.stats.errors++;
        return false;
      }

      this.stats.designsProcessed = data?.length || allDesigns.length;
      this.logSuccess(`Seeded ${this.stats.designsProcessed} designs`);
      return true;
    } catch (error) {
      this.logError(`Error seeding designs: ${error.message}`);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Verify seeded data
   */
  async verifyData() {
    if (this.dryRun) {
      this.logInfo('[DRY RUN] Skipping verification');
      return true;
    }

    try {
      // Check design_sets count
      const { data: sets, error: setsError } = await this.supabase
        .from('design_sets')
        .select('id');

      // Check designs count
      const { data: designs, error: designsError } = await this.supabase
        .from('designs')
        .select('id');

      if (setsError || designsError) {
        this.logError('Failed to verify seeded data');
        return false;
      }

      this.logInfo(`Verification: ${sets?.length || 0} design sets, ${designs?.length || 0} designs in database`);
      return true;
    } catch (error) {
      this.logError(`Verification error: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      dryRun: this.dryRun,
      success: this.stats.errors === 0,
      stats: this.stats,
      summary: this.stats.errors === 0 
        ? `Successfully processed ${this.stats.setsProcessed} design sets and ${this.stats.designsProcessed} designs`
        : `Completed with ${this.stats.errors} errors`
    };

    return report;
  }

  // Utility methods for colored output
  logError(message) {
    console.error(`${colors.red}ERROR: ${message}${colors.reset}`);
  }

  logWarning(message) {
    console.warn(`${colors.yellow}WARNING: ${message}${colors.reset}`);
  }

  logInfo(message) {
    console.log(`${colors.blue}INFO: ${message}${colors.reset}`);
  }

  logSuccess(message) {
    console.log(`${colors.green}SUCCESS: ${message}${colors.reset}`);
  }
}

/**
 * Main execution function
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const seeder = new DesignSeeder(isDryRun);
  
  console.log(`${colors.bold}${colors.blue}NOEMI Survey App - Design Data Seeding${colors.reset}`);
  if (isDryRun) {
    console.log(`${colors.yellow}DRY RUN MODE - No changes will be made${colors.reset}`);
  }
  console.log('='.repeat(50));

  // Initialize
  if (!seeder.initializeSupabase()) {
    process.exit(1);
  }

  // Load design data
  const designs = seeder.loadDesignData();
  if (!designs) {
    process.exit(1);
  }

  // Prepare data
  const { designSets, designsBySet } = seeder.prepareData(designs);

  // Check existing data
  const hasExistingData = await seeder.checkExistingData();
  if (hasExistingData && !isDryRun) {
    console.log(`${colors.yellow}Warning: Database already contains design data.${colors.reset}`);
    console.log('This will update existing records. Continue? (Press Ctrl+C to abort)');
    // In a real implementation, you might want to wait for user input
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Seed data
  let success = true;
  success = await seeder.seedDesignSets(designSets) && success;
  success = await seeder.seedDesigns(designsBySet) && success;

  if (success) {
    await seeder.verifyData();
  }

  // Generate and display report
  const report = seeder.generateReport();
  
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.bold}SEEDING REPORT${colors.reset}`);
  console.log(`Status: ${report.success ? colors.green + 'SUCCESS' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Mode: ${report.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(report.summary);

  // Exit with appropriate code
  process.exit(report.success ? 0 : 1);
}

// Run the main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`${colors.red}Script failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

export default DesignSeeder;