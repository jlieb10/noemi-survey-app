#!/usr/bin/env node

/**
 * Design Data Migration Utility
 * 
 * This script helps migrate design data from the static index.json file 
 * into the Supabase database tables. It can be used to populate the 
 * design_sets and designs tables from existing static data.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const DESIGNS_INDEX_PATH = join(projectRoot, 'public', 'designs', 'index.json');

/**
 * Load and validate the designs index file
 */
function loadDesignsIndex() {
  try {
    const indexData = JSON.parse(readFileSync(DESIGNS_INDEX_PATH, 'utf-8'));
    
    if (!Array.isArray(indexData)) {
      throw new Error('Designs index should be an array');
    }
    
    console.log(`✅ Loaded ${indexData.length} design entries from index.json`);
    return indexData;
  } catch (error) {
    console.error(`❌ Failed to load designs index: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract unique design sets from design entries
 */
function extractDesignSets(designs) {
  const setsMap = new Map();
  
  designs.forEach(design => {
    if (!setsMap.has(design.set_id)) {
      setsMap.set(design.set_id, {
        id: design.set_id,
        // Extract source image from first quadrant image URL
        source_image_url: design.image_url.replace(/_q\d\.jpg$/, '.jpg'),
        note: null
      });
    }
  });
  
  const designSets = Array.from(setsMap.values());
  console.log(`✅ Extracted ${designSets.length} unique design sets`);
  
  return designSets;
}

/**
 * Generate SQL INSERT statements for design sets
 */
function generateDesignSetsSql(designSets) {
  const values = designSets.map(set => 
    `('${set.id}', '${set.source_image_url}', ${set.note ? `'${set.note}'` : 'NULL'})`
  ).join(',\n  ');
  
  return `-- Insert design sets
INSERT INTO public.design_sets (id, source_image_url, note)
VALUES 
  ${values}
ON CONFLICT (id) DO UPDATE SET
  source_image_url = EXCLUDED.source_image_url,
  note = EXCLUDED.note;`;
}

/**
 * Generate SQL INSERT statements for individual designs
 */
function generateDesignsSql(designs) {
  const values = designs.map(design => 
    `('${design.id}', '${design.set_id}', ${design.quadrant_index}, '${design.image_url}')`
  ).join(',\n  ');
  
  return `-- Insert individual designs
INSERT INTO public.designs (id, set_id, quadrant_index, image_url)
VALUES 
  ${values}
ON CONFLICT (id) DO UPDATE SET
  set_id = EXCLUDED.set_id,
  quadrant_index = EXCLUDED.quadrant_index,
  image_url = EXCLUDED.image_url;`;
}

/**
 * Generate complete migration SQL
 */
function generateMigrationSql(designs) {
  const designSets = extractDesignSets(designs);
  
  const sql = [
    '-- Design Data Migration',
    '-- Generated automatically from public/designs/index.json',
    `-- Contains ${designSets.length} design sets and ${designs.length} individual designs`,
    '',
    '-- Begin transaction',
    'BEGIN;',
    '',
    generateDesignSetsSql(designSets),
    '',
    generateDesignsSql(designs),
    '',
    '-- Verify migration results',
    'DO $$',
    'DECLARE',
    '  set_count integer;',
    '  design_count integer;',
    'BEGIN',
    '  SELECT COUNT(*) INTO set_count FROM public.design_sets;',
    '  SELECT COUNT(*) INTO design_count FROM public.designs;',
    '  ',
    `  IF set_count != ${designSets.length} THEN`,
    `    RAISE EXCEPTION 'Expected ${designSets.length} design sets, found %', set_count;`,
    '  END IF;',
    '  ',
    `  IF design_count != ${designs.length} THEN`,
    `    RAISE EXCEPTION 'Expected ${designs.length} designs, found %', design_count;`,
    '  END IF;',
    '  ',
    '  RAISE NOTICE \'Migration successful: % design sets, % designs\', set_count, design_count;',
    'END $$;',
    '',
    '-- Commit transaction',
    'COMMIT;'
  ].join('\n');
  
  return sql;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  
  console.log('🎨 NOEMI Design Data Migration Utility');
  console.log('=====================================');
  
  switch (command) {
    case 'generate': {
      console.log('📝 Generating SQL migration from index.json...');
      const designs = loadDesignsIndex();
      const sql = generateMigrationSql(designs);
      console.log('\n' + sql);
      console.log('\n✅ SQL migration generated successfully!');
      console.log('\n💡 Usage:');
      console.log('1. Copy the SQL above');
      console.log('2. Paste into Supabase SQL editor'); 
      console.log('3. Run to populate design tables');
      break;
    }
      
    case 'validate': {
      console.log('🔍 Validating designs index structure...');
      const indexData = loadDesignsIndex();
      
      // Validate structure
      const requiredFields = ['id', 'set_id', 'quadrant_index', 'image_url'];
      const missingFields = [];
      const invalidEntries = [];
      
      indexData.forEach((design, i) => {
        const missing = requiredFields.filter(field => !(field in design));
        if (missing.length > 0) {
          missingFields.push(`Entry ${i}: missing ${missing.join(', ')}`);
        }
        
        if (typeof design.quadrant_index !== 'number' || 
            design.quadrant_index < 0 || design.quadrant_index > 3) {
          invalidEntries.push(`Entry ${i}: invalid quadrant_index ${design.quadrant_index}`);
        }
      });
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:');
        missingFields.forEach(err => console.error(`  ${err}`));
      }
      
      if (invalidEntries.length > 0) {
        console.error('❌ Invalid entries:');
        invalidEntries.forEach(err => console.error(`  ${err}`));
      }
      
      if (missingFields.length === 0 && invalidEntries.length === 0) {
        console.log('✅ All design entries are valid!');
        const sets = extractDesignSets(indexData);
        console.log(`📊 Summary: ${sets.length} sets, ${indexData.length} designs`);
      } else {
        process.exit(1);
      }
      break;
    }
      
    case 'help':
    default:
      console.log('Usage: node scripts/migrate-design-data.mjs [command]');
      console.log('');
      console.log('Commands:');
      console.log('  generate  Generate SQL migration from index.json (default)');
      console.log('  validate  Validate index.json structure');
      console.log('  help      Show this help message');
      break;
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main();
}