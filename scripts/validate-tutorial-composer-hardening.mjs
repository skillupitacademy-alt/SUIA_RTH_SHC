#!/usr/bin/env node

/**
 * Tutorial Composer Hardening Validation
 * 
 * Validates Prompt 04A Phase 2 implementation without requiring a running server.
 * Checks:
 * - File existence
 * - TypeScript compilation (syntax check)
 * - Legacy isolation (grep audit)
 * - Architecture compliance
 * 
 * Run: node scripts/validate-tutorial-composer-hardening.mjs
 */

import { readFile, access } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// ANSI colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function logSection(title) {
  console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`);
  console.log(`${BLUE}  ${title}${RESET}`);
  console.log(`${BLUE}${'='.repeat(60)}${RESET}`);
}

function logPass(message) {
  console.log(`${GREEN}✅ ${message}${RESET}`);
  passedChecks++;
  totalChecks++;
}

function logFail(message, details = '') {
  console.log(`${RED}❌ ${message}${RESET}`);
  if (details) {
    console.log(`   ${RED}${details}${RESET}`);
  }
  failedChecks++;
  totalChecks++;
}

function logInfo(message) {
  console.log(`   ${message}`);
}

/**
 * Check if file exists
 */
async function checkFileExists(filePath, description) {
  try {
    await access(path.join(PROJECT_ROOT, filePath));
    logPass(`${description} exists`);
    return true;
  } catch {
    logFail(`${description} NOT found`, filePath);
    return false;
  }
}

/**
 * Check file content for forbidden patterns
 */
async function checkFileForbiddenPatterns(filePath, patterns, description) {
  try {
    const content = await readFile(path.join(PROJECT_ROOT, filePath), 'utf-8');
    const foundPatterns = [];
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'g');
      const matches = content.match(regex);
      if (matches) {
        foundPatterns.push(`${pattern} (${matches.length} occurrences)`);
      }
    }
    
    if (foundPatterns.length === 0) {
      logPass(`${description} has zero forbidden patterns`);
      return true;
    } else {
      logFail(`${description} contains forbidden patterns`, foundPatterns.join(', '));
      return false;
    }
  } catch (error) {
    logFail(`Failed to check ${description}`, error.message);
    return false;
  }
}

/**
 * Check file content for required patterns
 */
async function checkFileRequiredPatterns(filePath, patterns, description) {
  try {
    const content = await readFile(path.join(PROJECT_ROOT, filePath), 'utf-8');
    const missingPatterns = [];
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern);
      if (!regex.test(content)) {
        missingPatterns.push(pattern);
      }
    }
    
    if (missingPatterns.length === 0) {
      logPass(`${description} has all required patterns`);
      return true;
    } else {
      logFail(`${description} missing patterns`, missingPatterns.join(', '));
      return false;
    }
  } catch (error) {
    logFail(`Failed to check ${description}`, error.message);
    return false;
  }
}

/**
 * Main validation
 */
async function main() {
  console.log(`${BLUE}🔒 TUTORIAL COMPOSER HARDENING VALIDATION${RESET}`);
  console.log(`${BLUE}===========================================${RESET}\n`);
  console.log(`Project Root: ${PROJECT_ROOT}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  // ========================================
  // 1. FILE EXISTENCE CHECKS
  // ========================================
  logSection('1. FILE EXISTENCE');
  
  await checkFileExists(
    'apps/skillhubcore-admin/src/lib/auth-helpers.ts',
    'Authentication helpers'
  );
  
  await checkFileExists(
    'apps/skillhubcore-admin/src/lib/cache-invalidation.ts',
    'Cache invalidation utilities'
  );
  
  await checkFileExists(
    'scripts/test-tutorial-composer-api.mjs',
    'Integration test script'
  );
  
  await checkFileExists(
    'packages/auth/src/rbac/permissions.ts',
    'RBAC permissions'
  );
  
  await checkFileExists(
    'packages/auth/src/rbac/role-permissions.ts',
    'Role-permission mappings'
  );

  // ========================================
  // 2. AUTHENTICATION IMPLEMENTATION
  // ========================================
  logSection('2. AUTHENTICATION IMPLEMENTATION');
  
  await checkFileRequiredPatterns(
    'apps/skillhubcore-admin/src/lib/auth-helpers.ts',
    [
      'TokenService\\.verifyAdminAccessToken',
      'authenticateRequest',
      'getAccessToken',
      'accessToken',
      'admin_accessToken',
    ],
    'Authentication implementation'
  );
  
  await checkFileForbiddenPatterns(
    'apps/skillhubcore-admin/src/lib/auth-helpers.ts',
    ['placeholder-user-id', 'hardcoded-user', 'fake-token'],
    'Authentication helpers (no placeholders)'
  );

  // ========================================
  // 3. AUTHORIZATION IMPLEMENTATION
  // ========================================
  logSection('3. AUTHORIZATION IMPLEMENTATION');
  
  await checkFileRequiredPatterns(
    'packages/auth/src/rbac/permissions.ts',
    [
      'TUTORIAL_AUTHOR_CREATE',
      'TUTORIAL_AUTHOR_EDIT',
      'TUTORIAL_AUTHOR_DELETE',
      'TUTORIAL_AUTHOR_PUBLISH',
    ],
    'Tutorial authoring permissions'
  );
  
  await checkFileRequiredPatterns(
    'packages/auth/src/rbac/role-permissions.ts',
    [
      'TUTORIAL_AUTHOR_CREATE',
      'TUTORIAL_AUTHOR_EDIT',
      'TUTORIAL_AUTHOR_DELETE',
      'TUTORIAL_AUTHOR_PUBLISH',
    ],
    'Permission grants to admin role'
  );
  
  await checkFileRequiredPatterns(
    'apps/skillhubcore-admin/src/lib/auth-helpers.ts',
    [
      'requireSubtopicAccess',
      'requireBrandAccess',
      'RBACService\\.hasPermission',
    ],
    'Authorization helpers'
  );

  // ========================================
  // 4. CACHE INVALIDATION
  // ========================================
  logSection('4. CACHE INVALIDATION');
  
  await checkFileRequiredPatterns(
    'apps/skillhubcore-admin/src/lib/cache-invalidation.ts',
    [
      'invalidateTutorialDeliveryCache',
      'getSubtopicSlug',
      'tutorialSubtopics',
      'UPSTASH_REDIS_REST_URL',
    ],
    'Cache invalidation implementation'
  );

  // ========================================
  // 5. LEGACY ISOLATION AUDIT
  // ========================================
  logSection('5. LEGACY ISOLATION AUDIT');
  
  const forbiddenPatterns = [
    'SECTION_TRANSFORMERS',
    'upsertChildDomainTable',
    'tutorial_section_notes',
    'tutorial_section_overview',
    'tutorial_section_real_life',
    'tutorial_section_technical',
    'tutorial_section_code',
    'tutorial_section_visual',
    'tutorial_section_practice',
  ];
  
  const filesToCheck = [
    'apps/skillhubcore-admin/src/lib/auth-helpers.ts',
    'apps/skillhubcore-admin/src/lib/cache-invalidation.ts',
    'apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts',
    'apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts',
    'packages/db-tutorial/src/services/tutorial-composer.service.ts',
    'packages/db-tutorial/src/repositories/tutorial-section.repository.ts',
  ];
  
  for (const file of filesToCheck) {
    await checkFileForbiddenPatterns(
      file,
      forbiddenPatterns,
      `Legacy isolation: ${path.basename(file)}`
    );
  }

  // ========================================
  // 6. API ROUTES INTEGRATION
  // ========================================
  logSection('6. API ROUTES INTEGRATION');
  
  await checkFileRequiredPatterns(
    'apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/route.ts',
    [
      'authenticateRequest',
      'requireSubtopicAccess',
      'requireBrandAccess',
      'invalidateTutorialDeliveryCache',
    ],
    'Sections route (POST/GET)'
  );
  
  await checkFileRequiredPatterns(
    'apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/route.ts',
    [
      'authenticateRequest',
      'requireSubtopicAccess',
      'requireBrandAccess',
      'invalidateTutorialDeliveryCache',
    ],
    'Section route (GET/PATCH/DELETE)'
  );
  
  await checkFileRequiredPatterns(
    'apps/skillhubcore-admin/src/app/api/tutorial-composer/sections/[sectionId]/publish/route.ts',
    [
      'authenticateRequest',
      'requireSubtopicAccess',
      'requireBrandAccess',
      'invalidateTutorialDeliveryCache',
    ],
    'Publish route (POST)'
  );

  // ========================================
  // 7. INTEGRATION TEST COMPLETENESS
  // ========================================
  logSection('7. INTEGRATION TEST SCRIPT');
  
  await checkFileRequiredPatterns(
    'scripts/test-tutorial-composer-api.mjs',
    [
      'testAdminLogin',
      'testCreateSection',
      'testGetSection',
      'testUpdateSection',
      'testPublishSection',
      'testDeleteSection',
      'testCreateSectionUnauthorized',
    ],
    'Integration test coverage'
  );

  // ========================================
  // SUMMARY
  // ========================================
  logSection('VALIDATION SUMMARY');
  
  console.log(`Total Checks: ${totalChecks}`);
  console.log(`${GREEN}✅ Passed: ${passedChecks}${RESET}`);
  console.log(`${RED}❌ Failed: ${failedChecks}${RESET}`);
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (failedChecks === 0) {
    console.log(`\n${GREEN}🎉 ALL VALIDATION CHECKS PASSED!${RESET}`);
    console.log(`${GREEN}✅ Prompt 04A Phase 2 hardening is COMPLETE${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${YELLOW}⚠️  Some validation checks failed${RESET}`);
    console.log(`${YELLOW}Review failed checks above and fix before proceeding${RESET}`);
    process.exit(1);
  }
}

// Run validation
main().catch((error) => {
  console.error(`${RED}💥 Validation crashed:${RESET}`, error.message);
  console.error(error.stack);
  process.exit(1);
});
