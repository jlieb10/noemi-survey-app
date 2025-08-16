#!/usr/bin/env node

/**
 * Environment validation script for build-time checks.
 * Ensures required VITE_* environment variables are present.
 * Fails fast with clear error messages if required vars are missing.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Required environment variables for the application
const REQUIRED_VARS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

/**
 * Load environment variables from .env file if it exists.
 * @returns {Object} Environment variables as key-value pairs
 */
function loadEnvFile() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return envVars;
  } catch {
    // .env file doesn't exist or can't be read
    return {};
  }
}

/**
 * Check if all required environment variables are present.
 * @returns {Object} Result with success status and missing variables
 */
function validateEnvironment() {
  const envFile = loadEnvFile();
  const missing = [];

  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName] || envFile[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  return {
    success: missing.length === 0,
    missing,
    foundInEnv: Object.keys(envFile).filter((key) =>
      REQUIRED_VARS.includes(key)
    ),
  };
}

// Main execution
const result = validateEnvironment();

if (!result.success) {
  console.error('❌ Build failed: Missing required environment variables');
  console.error('');
  console.error('Missing variables:');
  result.missing.forEach((varName) => {
    console.error(`  - ${varName}`);
  });
  console.error('');

  if (result.foundInEnv.length > 0) {
    console.error('Found in .env file:');
    result.foundInEnv.forEach((varName) => {
      console.error(`  ✓ ${varName}`);
    });
    console.error('');
    console.error(
      'Note: Make sure these are also set in your deployment environment (Netlify).'
    );
  }

  console.error('Please set these environment variables and try again.');
  console.error(
    'For Netlify, add them in Site Settings > Environment Variables.'
  );

  process.exit(1);
}

console.log('✅ Environment variables validated successfully');
