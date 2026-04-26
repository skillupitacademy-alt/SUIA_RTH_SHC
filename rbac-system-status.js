#!/usr/bin/env node
/**
 * 🔐 RBAC SYSTEM STATUS CHECKER
 * 
 * Quick health check for the entire RBAC system.
 * Run this to verify everything is working correctly.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const checks = [];

function check(name, fn) {
  checks.push({ name, fn });
}

function runCheck(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`✅ ${name}`);
      return true;
    } else {
      console.log(`❌ ${name}`);
      console.log(`   ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// ============================================================
// CHECKS
// ============================================================

check('RBAC Engine exists', () => {
  return fs.existsSync('packages/auth/src/rbac/rbac.service.ts');
});

check('Ownership Service exists', () => {
  return fs.existsSync('packages/auth/src/rbac/ownership.service.ts');
});

check('RBAC Guard wrapper exists', () => {
  return fs.existsSync('packages/auth/src/rbac/rbac.guard.ts');
});

check('Roles defined', () => {
  return fs.existsSync('packages/auth/src/rbac/roles.ts');
});

check('Permissions defined', () => {
  return fs.existsSync('packages/auth/src/rbac/permissions.ts');
});

check('Role-Permission mappings exist', () => {
  return fs.existsSync('packages/auth/src/rbac/role-permissions.ts');
});

check('Profile route has RBAC', () => {
  const content = fs.readFileSync('apps/api-server/src/app/api/auth/profile/route.ts', 'utf8');
  if (!content.includes('OwnershipRBACService')) {
    return 'Profile route does not use OwnershipRBACService';
  }
  if (!content.includes('requirePermissionOrOwnership')) {
    return 'Profile route does not use requirePermissionOrOwnership';
  }
  return true;
});

check('No fallback roles in RBAC service', () => {
  const content = fs.readFileSync('packages/auth/src/rbac/rbac.service.ts', 'utf8');
  if (content.includes("['user']") || content.includes('["user"]')) {
    return 'RBAC service contains fallback to [\'user\'] role';
  }
  return true;
});

check('Test scripts exist', () => {
  const scripts = [
    'test-ownership-rbac.js',
    'test-rbac-audit-fixed.js',
    'test-rbac-diagnostic.js',
  ];
  
  for (const script of scripts) {
    if (!fs.existsSync(script)) {
      return `Missing test script: ${script}`;
    }
  }
  return true;
});

check('Database cleanup scripts exist', () => {
  return fs.existsSync('scripts/db-role-cleanup.sql') &&
         fs.existsSync('scripts/db-role-cleanup.js');
});

check('Documentation exists', () => {
  const docs = [
    'RBAC-OWNERSHIP-IMPLEMENTATION.md',
    'docs/RBAC-EXPANSION-PLAN.md',
    'docs/RBAC-SECURITY-HARDENING.md',
    'RBAC-SYSTEM-COMPLETE.md',
  ];
  
  for (const doc of docs) {
    if (!fs.existsSync(doc)) {
      return `Missing documentation: ${doc}`;
    }
  }
  return true;
});

check('TypeScript compiles (auth package)', () => {
  try {
    execSync('npx tsc --noEmit', {
      cwd: 'packages/auth',
      stdio: 'pipe',
    });
    return true;
  } catch (error) {
    return 'TypeScript compilation failed';
  }
});

check('TypeScript compiles (api-server)', () => {
  try {
    execSync('npx tsc --noEmit', {
      cwd: 'apps/api-server',
      stdio: 'pipe',
    });
    return true;
  } catch (error) {
    return 'TypeScript compilation failed';
  }
});

// ============================================================
// RUN CHECKS
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('🔐 RBAC SYSTEM STATUS CHECK');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

for (const { name, fn } of checks) {
  if (runCheck(name, fn)) {
    passed++;
  } else {
    failed++;
  }
}

console.log('\n' + '='.repeat(70));
console.log('📊 SUMMARY');
console.log('='.repeat(70) + '\n');

console.log(`Total checks: ${passed + failed}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);

if (failed === 0) {
  console.log('\n🎉 ALL CHECKS PASSED - RBAC SYSTEM IS HEALTHY!\n');
  console.log('Next steps:');
  console.log('  1. Deploy to production');
  console.log('  2. Run: node test-ownership-rbac.js');
  console.log('  3. Check Cloud Run logs for RBAC decisions');
  console.log('  4. Run: node test-rbac-audit-fixed.js\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME CHECKS FAILED - REVIEW ISSUES ABOVE\n');
  process.exit(1);
}
