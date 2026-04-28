#!/usr/bin/env node
/**
 * 🔍 PREFETCH 503 AUDIT
 * 
 * PURPOSE:
 * Deep static audit to identify:
 * - Every route that can trigger /dashboard/profile prefetch
 * - Every Link/router.push usage
 * - Missing prefetch={false}
 * - Legacy/stale profile routes
 * - Potential SSR sources causing 503 speculative requests
 * 
 * RUN:
 * node scripts/prefetch-503-audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const SEARCH_DIRS = [
  'apps',
  'src',
];

const TARGET_PATTERNS = [
  '/dashboard/profile',
  '/profile',
  'prefetch',
  'next/link',
  'router.push',
  'router.replace',
  'Link',
];

const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

const findings = [];

function shouldScan(filePath) {
  return FILE_EXTENSIONS.includes(path.extname(filePath));
}

function scanFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return;
  }

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    TARGET_PATTERNS.forEach((pattern) => {
      if (line.includes(pattern)) {
        findings.push({
          file: filePath,
          lineNumber: index + 1,
          pattern,
          line: line.trim(),
        });
      }
    });
  });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === 'build'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && shouldScan(fullPath)) {
      scanFile(fullPath);
    }
  }
}

function analyze() {
  console.log('🚀 PREFETCH 503 ROOT CAUSE AUDIT');
  console.log('============================================');

  SEARCH_DIRS.forEach((dir) => {
    walk(path.join(ROOT_DIR, dir));
  });

  const profileLinks = findings.filter(f =>
    f.pattern === '/dashboard/profile'
  );

  const staleProfileLinks = findings.filter(f =>
    f.pattern === '/profile' && !f.line.includes('/dashboard/profile')
  );

  const linkImports = findings.filter(f =>
    f.pattern === 'next/link'
  );

  const missingPrefetchProtection = findings.filter(f =>
    (f.pattern === '/dashboard/profile' ||
     f.pattern === 'router.push' ||
     f.pattern === 'router.replace') &&
    !f.line.includes('prefetch={false}') &&
    !f.line.includes('prefetch={!isProtectedRoute}') &&
    !f.line.includes('SafeLink')
  );

  console.log(`\n📄 TOTAL MATCHES FOUND: ${findings.length}`);

  console.log('\n🔍 PROFILE ROUTE REFERENCES');
  console.log('--------------------------------------------');
  if (profileLinks.length === 0) {
    console.log('   No profile route references found');
  } else {
    profileLinks.forEach(printFinding);
  }

  console.log('\n⚠️  LEGACY / STALE PROFILE ROUTES');
  console.log('--------------------------------------------');
  if (staleProfileLinks.length === 0) {
    console.log('   ✅ No stale profile routes found');
  } else {
    staleProfileLinks.forEach(printFinding);
  }

  console.log('\n🔗 LINK COMPONENT IMPORTS');
  console.log('--------------------------------------------');
  console.log(`   Found ${linkImports.length} Link imports`);

  console.log('\n🚨 POSSIBLE PREFETCH RISK SOURCES');
  console.log('--------------------------------------------');
  if (missingPrefetchProtection.length === 0) {
    console.log('   ✅ No risky navigation sources detected');
  } else {
    missingPrefetchProtection.forEach(printFinding);
  }

  console.log('\n🏁 FINAL VERDICT');
  console.log('============================================');

  if (missingPrefetchProtection.length === 0) {
    console.log('✅ No obvious unsafe prefetch sources found');
  } else {
    console.log(`❌ ${missingPrefetchProtection.length} risky navigation sources detected`);
    console.log('👉 These are likely causing 503 speculative prefetch requests');
  }

  if (staleProfileLinks.length > 0) {
    console.log(`⚠️  ${staleProfileLinks.length} stale profile routes detected`);
    console.log('👉 Legacy routes may still trigger incorrect prefetch');
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('1. Replace risky Link with SafeLink');
  console.log('2. Disable prefetch on all protected routes');
  console.log('3. Remove stale /profile references');
  console.log('4. Audit TopBar, Sidebar, MobileNav, Dropdowns');
  console.log('');
}

function printFinding(f) {
  console.log(`   📁 File: ${f.file}`);
  console.log(`   📍 Line: ${f.lineNumber}`);
  console.log(`   🎯 Pattern: ${f.pattern}`);
  console.log(`   ➡  Code: ${f.line}`);
  console.log('');
}

analyze();
