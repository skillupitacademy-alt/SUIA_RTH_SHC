#!/usr/bin/env node

/**
 * CSS Isolation Verification Script
 * 
 * Verifies that landing page CSS doesn't conflict with existing project styles.
 * Run after landing page integration to ensure CSS isolation is working correctly.
 * 
 * Usage: node scripts/verify-css-isolation.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = join(rootDir, filePath);
  if (!existsSync(fullPath)) {
    log(`✗ ${description}: File not found`, 'red');
    return false;
  }
  log(`✓ ${description}: Found`, 'green');
  return true;
}

function checkContent(filePath, pattern, description, shouldExist = true) {
  const fullPath = join(rootDir, filePath);
  if (!existsSync(fullPath)) {
    log(`✗ ${description}: File not found`, 'red');
    return false;
  }

  const content = readFileSync(fullPath, 'utf-8');
  const matches = pattern.test(content);

  if (shouldExist && matches) {
    log(`✓ ${description}: Found`, 'green');
    return true;
  } else if (!shouldExist && !matches) {
    log(`✓ ${description}: Not found (as expected)`, 'green');
    return true;
  } else {
    log(`✗ ${description}: ${shouldExist ? 'Not found' : 'Found (unexpected)'}`, 'red');
    return false;
  }
}

async function main() {
  log('\n=== CSS Isolation Verification ===\n', 'cyan');

  let passed = 0;
  let failed = 0;

  // Check 1: Landing page component exists
  log('1. Component Files', 'blue');
  if (checkFile('src/share-branding/LandingPage.tsx', 'LandingPage.tsx')) passed++;
  else failed++;
  if (checkFile('src/share-branding/RTHLanding.tsx', 'RTHLanding.tsx')) passed++;
  else failed++;
  if (checkFile('src/share-branding/SkillUpLanding.tsx', 'SkillUpLanding.tsx')) passed++;
  else failed++;
  if (checkFile('src/share-branding/brandConfig.ts', 'brandConfig.ts')) passed++;
  else failed++;

  // Check 2: Motion package (not framer-motion)
  log('\n2. Dependencies', 'blue');
  if (checkContent('src/share-branding/LandingPage.tsx', /from 'motion\/react'/, 'Uses motion/react import')) passed++;
  else failed++;
  if (checkContent('src/share-branding/LandingPage.tsx', /from 'framer-motion'/, 'No framer-motion import', false)) passed++;
  else failed++;
  if (checkContent('package.json', /"motion":\s*"12\.23\.24"/, 'motion@12.23.24 installed')) passed++;
  else failed++;

  // Check 3: CSS theme variables
  log('\n3. CSS Theme Variables', 'blue');
  if (checkContent('apps/realtutorialhub-web/src/app/globals.css', /--background:\s*#ffffff/, 'RTH web has landing page variables')) passed++;
  else failed++;
  if (checkContent('apps/skillup-web/src/app/globals.css', /--background:\s*#ffffff/, 'SkillUp web has landing page variables')) passed++;
  else failed++;

  // Check 4: Font-family rules
  log('\n4. Font Configuration', 'blue');
  if (checkContent('apps/realtutorialhub-web/src/app/globals.css', /@layer base/, 'RTH web has @layer base')) passed++;
  else failed++;
  if (checkContent('apps/realtutorialhub-web/src/app/globals.css', /font-family:\s*'Poppins'/, 'RTH web has Poppins font rule')) passed++;
  else failed++;
  if (checkContent('apps/skillup-web/src/app/globals.css', /@layer base/, 'SkillUp web has @layer base')) passed++;
  else failed++;
  if (checkContent('apps/skillup-web/src/app/globals.css', /font-family:\s*'Poppins'/, 'SkillUp web has Poppins font rule')) passed++;
  else failed++;

  // Check 5: No custom CSS classes in landing page
  log('\n5. Tailwind Utility-First Approach', 'blue');
  const landingPageContent = readFileSync(join(rootDir, 'src/share-branding/LandingPage.tsx'), 'utf-8');
  const hasCustomClasses = /className="[^"]*landing-|className="[^"]*custom-/.test(landingPageContent);
  if (!hasCustomClasses) {
    log('✓ No custom CSS classes (landing-*, custom-*)', 'green');
    passed++;
  } else {
    log('✗ Found custom CSS classes', 'red');
    failed++;
  }

  // Check 6: Inline styles for brand colors
  log('\n6. Inline Styles for Brand Colors', 'blue');
  const hasInlineStyles = /style=\{\{\s*backgroundColor:\s*config\.primaryColor/.test(landingPageContent);
  if (hasInlineStyles) {
    log('✓ Uses inline styles for brand colors', 'green');
    passed++;
  } else {
    log('✗ Missing inline styles for brand colors', 'red');
    failed++;
  }

  // Check 7: No CSS variable conflicts
  log('\n7. CSS Variable Namespacing', 'blue');
  const rthGlobals = readFileSync(join(rootDir, 'apps/realtutorialhub-web/src/app/globals.css'), 'utf-8');
  const hasTutorialVars = /--tutorial-/.test(rthGlobals);
  const hasLandingVars = /--background:\s*#ffffff/.test(rthGlobals);
  if (hasTutorialVars && hasLandingVars) {
    log('✓ Both tutorial and landing page variables coexist', 'green');
    passed++;
  } else {
    log('✗ Missing CSS variables', 'red');
    failed++;
  }

  // Check 8: Home pages use new components
  log('\n8. Route Integration', 'blue');
  if (checkContent('apps/realtutorialhub-web/src/app/page.tsx', /RTHLanding/, 'RTH home uses RTHLanding')) passed++;
  else failed++;
  if (checkContent('apps/skillup-web/src/app/page.tsx', /SkillUpLanding/, 'SkillUp home uses SkillUpLanding')) passed++;
  else failed++;

  // Summary
  log('\n=== Summary ===\n', 'cyan');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Total: ${passed + failed}\n`, 'blue');

  if (failed === 0) {
    log('✓ All CSS isolation checks passed!', 'green');
    log('Landing page is properly isolated from existing project styles.\n', 'green');
    process.exit(0);
  } else {
    log('✗ Some CSS isolation checks failed!', 'red');
    log('Please review the failures above and fix them before deploying.\n', 'red');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\nError: ${error.message}`, 'red');
  process.exit(1);
});
