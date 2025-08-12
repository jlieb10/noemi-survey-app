#!/usr/bin/env node

/**
 * Smart Playwright setup script that only installs browsers when needed.
 * Skips installation on CI/deployment environments like Netlify.
 * Only installs browsers in development environments or when explicitly requested.
 */

import { execSync } from 'node:child_process';

const isNetlify = process.env.NETLIFY === 'true';
const isCi = process.env.CI === 'true';
const skipPlaywright = process.env.SKIP_PLAYWRIGHT === 'true';
const forcePlaywright = process.env.INSTALL_PLAYWRIGHT === 'true';

/**
 * Determines if Playwright browsers should be installed.
 * @returns {boolean} True if browsers should be installed
 */
function shouldInstallPlaywright() {
  // Never install on Netlify
  if (isNetlify) {
    console.log('🚫 Skipping Playwright install on Netlify');
    return false;
  }
  
  // Skip if explicitly disabled
  if (skipPlaywright) {
    console.log('🚫 Skipping Playwright install (SKIP_PLAYWRIGHT=true)');
    return false;
  }
  
  // Force install if explicitly requested
  if (forcePlaywright) {
    console.log('🎭 Installing Playwright browsers (INSTALL_PLAYWRIGHT=true)');
    return true;
  }
  
  // Skip on most CI environments unless explicitly requested
  if (isCi) {
    console.log('🚫 Skipping Playwright install on CI (set INSTALL_PLAYWRIGHT=true to override)');
    return false;
  }
  
  // Install in development environments
  console.log('🎭 Installing Playwright browsers for development');
  return true;
}

/**
 * Install Playwright browsers with proper error handling.
 */
function installPlaywright() {
  try {
    console.log('Installing Playwright browsers...');
    execSync('npx playwright install', {
      stdio: 'inherit',
      timeout: 300000 // 5 minute timeout
    });
    console.log('✅ Playwright browsers installed successfully');
  } catch (error) {
    console.warn('⚠️  Playwright installation failed, but continuing...');
    console.warn('This may affect E2E tests. Run `npx playwright install` manually if needed.');
    // Don't fail the entire postinstall process
  }
}

// Main execution
if (shouldInstallPlaywright()) {
  installPlaywright();
} else {
  console.log('✅ Playwright setup completed (no installation needed)');
}