#!/usr/bin/env node

/**
 * 🔐 RBAC DEDUPLICATION SCRIPT
 * 
 * Finds and replaces duplicated RBAC logic with centralized enforcer.
 * 
 * Strategy:
 * - Detects unsafe patterns (flags for manual review)
 * - Replaces safe patterns automatically
 * - Generates detailed report
 * 
 * Usage:
 *   node scripts/rbac-deduplicate.js           # dry-run
 *   node scripts/rbac-deduplicate.js --apply   # apply changes
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TARGET_DIRS = [
  'apps/api-server/src',
];

const REPORT = [];

// Safe patterns that can be auto-replaced
const SAFE_PATTERNS = [
  {
    regex: /if\s*\(\s*!user\.roles\.includes\(['"]admin['"]\)\s*\)/g,
    replacement: "if (!hasPermission(user, 'ADMIN_PANEL'))",
    description: 'user.roles.includes("admin")',
    permission: 'ADMIN_PANEL'
  },
  {
    regex: /if\s*\(\s*!roles\.includes\(['"]admin['"]\)\s*\)/g,
    replacement: "if (!hasPermission({ userId, roles }, 'ADMIN_PANEL'))",
    description: 'roles.includes("admin")',
    permission: 'ADMIN_PANEL'
  },
  {
    regex: /if\s*\(\s*user\.roles\.includes\(['"]admin['"]\)\s*\)/g,
    replacement: "if (hasPermission(user, 'ADMIN_PANEL'))",
    description: 'user.roles.includes("admin") positive',
    permission: 'ADMIN_PANEL'
  },
];

// Unsafe patterns that need manual review
const UNSAFE_PATTERNS = [
  /roles\.includes\(['"][^'"]+['"]\)\s*&&/,  // Complex conditions with &&
  /roles\.includes\(['"][^'"]+['"]\)\s*\|\|/, // Complex conditions with ||
  /role\s*===\s*['"][^'"]+['"]\s*&&/,        // Direct role comparison with &&
  /role\s*===\s*['"][^'"]+['"]\s*\|\|/,      // Direct role comparison with ||
];

function isUnsafePattern(content) {
  return UNSAFE_PATTERNS.some(pattern => pattern.test(content));
}

function processFile(filePath, dryRun = true) {
  // Skip test files
  if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
    return;
  }

  // Skip .next build artifacts
  if (filePath.includes('.next')) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;

  let modified = false;
  const fileReport = {
    file: filePath.replace(ROOT, ''),
    changes: [],
    manualReview: []
  };

  // 🔍 Detect unsafe patterns (flag only)
  if (isUnsafePattern(content)) {
    fileReport.manualReview.push('Complex RBAC condition (&&, ||) - needs manual review');
  }

  // 🔁 Apply safe replacements
  for (const pattern of SAFE_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      content = content.replace(pattern.regex, pattern.replacement);
      fileReport.changes.push(`${pattern.description} → ${pattern.permission}`);
      modified = true;
    }
  }

  // 📌 Detect remaining RBAC patterns (manual review)
  if (content.includes('roles.includes(') && !content.includes('canonicalizeRoles')) {
    fileReport.manualReview.push('roles.includes() still present - verify if RBAC check');
  }

  if (content.includes('role === ') || content.includes('role !== ')) {
    fileReport.manualReview.push('Direct role comparison - should use RBAC');
  }

  // ✍️ Add import if modified
  if (modified && !content.includes('hasPermission')) {
    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, "import { hasPermission } from '@quiz/auth/rbac/enforcer';");
      content = lines.join('\n');
    } else {
      content = "import { hasPermission } from '@quiz/auth/rbac/enforcer';\n" + content;
    }
  }

  // 💾 Write changes
  if (!dryRun && modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  // 📊 Add to report if changes or manual review needed
  if (modified || fileReport.manualReview.length > 0) {
    REPORT.push(fileReport);
  }
}

function walk(dir, dryRun) {
  const full = path.join(ROOT, dir);

  if (!fs.existsSync(full)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return;
  }

  for (const file of fs.readdirSync(full)) {
    const filePath = path.join(full, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walk(path.join(dir, file), dryRun);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      processFile(filePath, dryRun);
    }
  }
}

// ----------------------------------
// MAIN EXECUTION
// ----------------------------------

const dryRun = !process.argv.includes('--apply');

console.log('\n🔐 RBAC DEDUPLICATION\n');
console.log('====================================');
console.log(dryRun ? '🔍 DRY RUN MODE' : '⚡ APPLY MODE');
console.log('====================================\n');

TARGET_DIRS.forEach(dir => {
  console.log(`📁 Scanning: ${dir}`);
  walk(dir, dryRun);
});

// ----------------------------------
// REPORT
// ----------------------------------

console.log('\n====================================');
console.log('📊 RBAC DEDUPLICATION REPORT');
console.log('====================================\n');

let totalChanges = 0;
let manualReviewCount = 0;

if (REPORT.length === 0) {
  console.log('✅ No RBAC duplication found!\n');
} else {
  REPORT.forEach(r => {
    console.log(`📁 ${r.file}`);

    if (r.changes.length > 0) {
      console.log(`   ✅ Changes:`);
      r.changes.forEach(c => console.log(`      - ${c}`));
      totalChanges++;
    }

    if (r.manualReview.length > 0) {
      console.log(`   ⚠️  Manual Review:`);
      r.manualReview.forEach(m => console.log(`      - ${m}`));
      manualReviewCount++;
    }

    console.log('');
  });
}

console.log('====================================');
console.log('📊 SUMMARY');
console.log('====================================');
console.log(`Files with changes:      ${totalChanges}`);
console.log(`Files needing review:    ${manualReviewCount}`);
console.log(`Total files flagged:     ${REPORT.length}`);
console.log('====================================\n');

if (dryRun && totalChanges > 0) {
  console.log('👉 Run with --apply to apply safe changes');
  console.log('⚠️  Files marked for manual review will NOT be auto-modified\n');
} else if (!dryRun && totalChanges > 0) {
  console.log('✅ Changes applied!');
  console.log('🔍 Next steps:');
  console.log('   1. Review manual review items');
  console.log('   2. Run: npm run validate:rbac');
  console.log('   3. Run: node scripts/security-tests/audit-auth-system.js\n');
}

process.exit(0);
