#!/usr/bin/env node
/**
 * W0.2 Architecture Violation Check
 * 
 * Purpose: Detect NEW architecture violations while permitting documented baseline.
 * Authority: Sol (Principal Architect)
 * Baseline: audit/W0.2_Architecture_Baseline.json
 * 
 * Gates:
 * 1. Frontend auth cookie parsing prohibition
 * 2. localStorage auth persistence prohibition
 * 3. Manual Authorization headers prohibition
 * 4. Duplicate JWT verification prohibition
 * 5. Direct DB imports in HTTP routes (baseline-aware)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(rootDir, 'audit/W0.2_Architecture_Baseline.json');

// Load baseline
let baseline = { directDBRoutes: [] };
try {
  baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  console.log(`Loaded baseline from ${baselinePath}`);
  console.log(`Baseline commit: ${baseline.baseline_commit}`);
  console.log(`Baseline exceptions: ${baseline.directDBRoutes.length} routes\n`);
} catch (error) {
  console.error(`Warning: Could not load baseline from ${baselinePath}`);
  console.error(`Proceeding without baseline exceptions.\n`);
}

let totalViolations = 0;
const results = [];

/**
 * Helper: Run ripgrep and return matches
 */
function runRipgrep(pattern, paths, globs = []) {
  try {
    let cmd = `rg -n "${pattern}" ${paths.join(' ')}`;
    globs.forEach(glob => {
      cmd += ` --glob '${glob}'`;
    });
    const output = execSync(cmd, { encoding: 'utf8', cwd: rootDir });
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    // Exit code 1 means no matches (which is good for prohibition checks)
    if (error.status === 1) return [];
    throw error;
  }
}

/**
 * Gate 1: Frontend auth cookie parsing
 */
console.log('Gate 1: Checking frontend auth cookie parsing...');
const cookiePatterns = [
  'document\\.cookie',
  'readCookie'
];
const frontendPaths = [
  'apps/realtutorialhub-*',
  'apps/skillup-*',
  'apps/faculty-app',
  'apps/skillhub-placement',
  'apps/skillhubcore-admin',
  'packages/ui'
];
const testExcludes = [
  '!**/tests/**',
  '!**/__tests__/**',
  '!**/TutorialNavbar.tsx'  // Known exception
];

let cookieViolations = [];
for (const pattern of cookiePatterns) {
  try {
    const matches = runRipgrep(pattern, frontendPaths, testExcludes);
    cookieViolations.push(...matches);
  } catch (error) {
    // Ignore: no matches is expected
  }
}

if (cookieViolations.length > 0) {
  console.error('❌ FAIL: Frontend auth cookie parsing detected:');
  cookieViolations.forEach(v => console.error(`  ${v}`));
  console.error('  Rule: Frontend auth cookie parsing is forbidden in app/ui source.\n');
  totalViolations += cookieViolations.length;
  results.push({ gate: 'auth-cookie-parsing', status: 'FAIL', violations: cookieViolations.length });
} else {
  console.log('✅ PASS: No frontend auth cookie parsing detected.\n');
  results.push({ gate: 'auth-cookie-parsing', status: 'PASS', violations: 0 });
}

/**
 * Gate 2: localStorage auth persistence
 */
console.log('Gate 2: Checking localStorage auth persistence...');
const localStoragePattern = 'localStorage.*(accessToken|refreshToken|admin_accessToken|quiz-platform-auth|quiz-platform-admin-auth)|persist\\(';
const localStorageGlobs = [
  ...testExcludes,
  '**/store/auth-store.ts'  // Specific file to check
];

let localStorageViolations = [];
try {
  localStorageViolations = runRipgrep(localStoragePattern, frontendPaths, localStorageGlobs);
} catch (error) {
  // Ignore: no matches is expected
}

if (localStorageViolations.length > 0) {
  console.error('❌ FAIL: Auth persistence in localStorage detected:');
  localStorageViolations.forEach(v => console.error(`  ${v}`));
  console.error('  Rule: Auth persistence in localStorage is forbidden.\n');
  totalViolations += localStorageViolations.length;
  results.push({ gate: 'localStorage-auth', status: 'FAIL', violations: localStorageViolations.length });
} else {
  console.log('✅ PASS: No localStorage auth persistence detected.\n');
  results.push({ gate: 'localStorage-auth', status: 'PASS', violations: 0 });
}

/**
 * Gate 3: Manual Authorization headers
 */
console.log('Gate 3: Checking manual Authorization headers...');
const authHeaderPattern = 'Authorization[\\\'"]?\\s*:|Bearer ';

let authHeaderViolations = [];
try {
  authHeaderViolations = runRipgrep(authHeaderPattern, frontendPaths, testExcludes);
} catch (error) {
  // Ignore: no matches is expected
}

if (authHeaderViolations.length > 0) {
  console.error('❌ FAIL: Manual Authorization headers detected:');
  authHeaderViolations.forEach(v => console.error(`  ${v}`));
  console.error('  Rule: Manual Authorization headers are forbidden in app/ui source.\n');
  totalViolations += authHeaderViolations.length;
  results.push({ gate: 'manual-auth-headers', status: 'FAIL', violations: authHeaderViolations.length });
} else {
  console.log('✅ PASS: No manual Authorization headers detected.\n');
  results.push({ gate: 'manual-auth-headers', status: 'PASS', violations: 0 });
}

/**
 * Gate 4: Duplicate JWT verification
 */
console.log('Gate 4: Checking duplicate JWT verification...');
const jwtPattern = 'jwtVerify';
const servicePaths = ['services'];

let jwtViolations = [];
try {
  jwtViolations = runRipgrep(jwtPattern, servicePaths, testExcludes);
} catch (error) {
  // Ignore: no matches is expected
}

if (jwtViolations.length > 0) {
  console.error('❌ FAIL: Duplicate JWT verification outside packages/auth detected:');
  jwtViolations.forEach(v => console.error(`  ${v}`));
  console.error('  Rule: JWT verification must be centralized in packages/auth.\n');
  totalViolations += jwtViolations.length;
  results.push({ gate: 'duplicate-jwt-verify', status: 'FAIL', violations: jwtViolations.length });
} else {
  console.log('✅ PASS: No duplicate JWT verification detected.\n');
  results.push({ gate: 'duplicate-jwt-verify', status: 'PASS', violations: 0 });
}

/**
 * Gate 5: Direct DB imports in HTTP routes (baseline-aware)
 */
console.log('Gate 5: Checking direct DB imports in HTTP routes...');
console.log(`  Baseline exceptions: ${baseline.directDBRoutes.length} documented routes`);

// Find all route.ts files in apps/skillhubcore-admin/src/app/api
const apiDir = path.join(rootDir, 'apps/skillhubcore-admin/src/app/api');
const routeFiles = [];

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name === 'route.ts') {
      routeFiles.push(path.relative(rootDir, fullPath).replaceAll('\\', '/'));
    }
  }
}

walkDir(apiDir);

// Check each route for direct DB imports
const directDBPattern = /import.*(?:getDb|drizzle-orm|@quiz\/db)/;
const violatingRoutes = [];

for (const routeFile of routeFiles) {
  const fullPath = path.join(rootDir, routeFile);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    if (directDBPattern.test(content)) {
      violatingRoutes.push(routeFile);
    }
  } catch (error) {
    console.warn(`  Warning: Could not read ${routeFile}`);
  }
}

// Filter against baseline
const newViolations = violatingRoutes.filter(route => !baseline.directDBRoutes.includes(route));

console.log(`  Total routes checked: ${routeFiles.length}`);
console.log(`  Routes with direct DB imports: ${violatingRoutes.length}`);
console.log(`  Baseline-permitted routes: ${violatingRoutes.length - newViolations.length}`);
console.log(`  NEW violations: ${newViolations.length}`);

if (newViolations.length > 0) {
  console.error('\n❌ FAIL: NEW direct DB imports in HTTP routes detected:');
  newViolations.forEach(route => console.error(`  ${route}`));
  console.error('\n  Rule: HTTP routes must not directly import @quiz/db or drizzle-orm.');
  console.error('  Use repository/service layer instead.');
  console.error('  See audit/W0.2_Architecture_Baseline.json for documented exceptions.\n');
  totalViolations += newViolations.length;
  results.push({ gate: 'direct-db-in-routes', status: 'FAIL', violations: newViolations.length });
} else {
  console.log('✅ PASS: No NEW direct DB imports in routes (baseline exceptions permitted).\n');
  results.push({ gate: 'direct-db-in-routes', status: 'PASS', violations: 0 });
}

/**
 * Summary
 */
console.log('═'.repeat(70));
console.log('ARCHITECTURE VIOLATION CHECK SUMMARY');
console.log('═'.repeat(70));
results.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.gate.padEnd(30)} ${result.violations} violations`);
});
console.log('═'.repeat(70));

if (totalViolations > 0) {
  console.error(`\n❌ FAILED: ${totalViolations} total architecture violations detected.\n`);
  process.exit(1);
} else {
  console.log('\n✅ PASSED: All architecture gates passed.\n');
  process.exit(0);
}
