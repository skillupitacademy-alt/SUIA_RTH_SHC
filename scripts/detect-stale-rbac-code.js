#!/usr/bin/env node
/**
 * 🔍 STALE RBAC CODE DETECTOR
 *
 * Scans codebase for outdated RBAC patterns that should be removed.
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect
const STALE_PATTERNS = [
  {
    name: 'Fallback to [\'user\'] role',
    pattern: /(?:roles?\s*=\s*.*\|\|?\s*\[['"]user['"]\]|roles?\s*=\s*\[['"]user['"]\](?!\s*[,\]]))/g,
    severity: 'HIGH',
    reason: 'No fallback roles allowed - security risk',
  },
  {
    name: 'Hardcoded role checks',
    pattern: /(?<!\/\/.*|\/\*[\s\S]*?\*\/)(?<!ROLES\.|role\s*===\s*['"](?:admin|user|student)['"].*\/\/.*helper)role\s*===\s*['"](?:user|admin|student)['"]/g,
    severity: 'MEDIUM',
    reason: 'Use RBAC permission checks instead',
  },
  {
    name: 'Old auth middleware',
    pattern: /requireAuth\(/g,
    severity: 'LOW',
    reason: 'Should use getAuthContext() instead',
  },
  {
    name: 'Direct role array checks in application code',
    pattern: /(?<!packages\/auth\/src\/rbac\/).*roles\.includes\(/g,
    severity: 'MEDIUM',
    reason: 'Use RBACService.hasPermission() instead',
  },
  {
    name: 'Uppercase role constants',
    pattern: /ROLE\.(USER|ADMIN|STUDENT)/g,
    severity: 'LOW',
    reason: 'Roles should be lowercase strings',
  },
];

// Directories to scan
const SCAN_DIRS = [
  'apps/api-server/src',
  'packages/auth/src',
  'apps/bff/src',
];

// Files to ignore
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.turbo/,
  /dist/,
  /build/,
  /\.test\./,
  /\.spec\./,
  /detect-stale-rbac-code\.js/, // Ignore this file
  /packages\/auth\/src\/rbac\//, // Ignore RBAC internal files
];

function shouldIgnore(filePath) {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Always ignore RBAC internal files
  if (normalizedPath.includes('packages/auth/src/rbac/')) {
    return true;
  }

  return IGNORE_PATTERNS.some(pattern => pattern.test(normalizedPath));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const { name, pattern, severity, reason } of STALE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      findings.push({
        file: filePath,
        pattern: name,
        severity,
        reason,
        count: matches.length,
        matches: matches.slice(0, 3), // Show first 3 matches
      });
    }
  }

  return findings;
}

function scanDirectory(dir, results = []) {
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (shouldIgnore(fullPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const findings = scanFile(fullPath);
      results.push(...findings);
    }
  }

  return results;
}

function groupBySeverity(findings) {
  return findings.reduce((acc, finding) => {
    if (!acc[finding.severity]) {
      acc[finding.severity] = [];
    }
    acc[finding.severity].push(finding);
    return acc;
  }, {});
}

function printFindings(findings) {
  if (findings.length === 0) {
    console.log('\n✅ No stale RBAC code detected!\n');
    return;
  }

  const grouped = groupBySeverity(findings);
  const severities = ['HIGH', 'MEDIUM', 'LOW'];

  console.log('\n' + '='.repeat(70));
  console.log('🔍 STALE RBAC CODE DETECTED');
  console.log('='.repeat(70) + '\n');

  for (const severity of severities) {
    const items = grouped[severity] || [];
    if (items.length === 0) continue;

    const icon = severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`${icon} ${severity} SEVERITY (${items.length} issues)\n`);

    for (const finding of items) {
      console.log(`  📄 ${finding.file}`);
      console.log(`     Pattern: ${finding.pattern}`);
      console.log(`     Reason: ${finding.reason}`);
      console.log(`     Occurrences: ${finding.count}`);
      if (finding.matches.length > 0) {
        console.log(`     Examples: ${finding.matches.join(', ')}`);
      }
      console.log();
    }
  }

  console.log('='.repeat(70));
  console.log(`Total issues found: ${findings.length}`);
  console.log('='.repeat(70) + '\n');

  // Summary by pattern
  const byPattern = findings.reduce((acc, f) => {
    acc[f.pattern] = (acc[f.pattern] || 0) + 1;
    return acc;
  }, {});

  console.log('📊 Summary by pattern:\n');
  for (const [pattern, count] of Object.entries(byPattern)) {
    console.log(`  • ${pattern}: ${count} files`);
  }
  console.log();
}

function main() {
  console.log('🔍 Scanning for stale RBAC code...\n');

  const allFindings = [];

  for (const dir of SCAN_DIRS) {
    console.log(`Scanning ${dir}...`);
    const findings = scanDirectory(dir);
    allFindings.push(...findings);
  }

  printFindings(allFindings);

  if (allFindings.length > 0) {
    console.log('🔧 RECOMMENDED ACTIONS:\n');
    console.log('1. Review each finding and determine if it needs updating');
    console.log('2. Replace hardcoded role checks with RBACService.hasPermission()');
    console.log('3. Remove any fallback role assignments');
    console.log('4. Update tests to use the new RBAC patterns\n');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
