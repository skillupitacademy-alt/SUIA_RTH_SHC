#!/usr/bin/env node
/**
 * 🔥 SAFE STUDENT ROLE REMOVAL
 * 
 * Removes student role references from src/ and associated files ONLY.
 * Does NOT touch:
 * - Database
 * - JWT generation
 * - External services
 * 
 * This is Phase 1: UI/Logic cleanup only.
 */

const fs = require('fs');
const path = require('path');

// Only touch src/ and its associated files
const ROOT_DIRS = [
  'apps/api-server/src',
  'apps/skillup-web/src',
  'apps/realtutorialhub-quiz/src',
  'packages/auth/src',
];

const SAFE_REPLACEMENTS = [
  {
    name: 'roles.includes("student")',
    regex: /roles\.includes\(['"`]student['"`]\)/g,
    replace: 'roles.includes("user")',
  },
  {
    name: "role === 'student'",
    regex: /role\s*===\s*['"`]student['"`]/g,
    replace: 'role === "user"',
  },
  {
    name: "role !== 'student'",
    regex: /role\s*!==\s*['"`]student['"`]/g,
    replace: 'role !== "user"',
  },
  {
    name: 'Array with "student"',
    regex: /\[['"`]user['"`],\s*['"`]student['"`]\]/g,
    replace: '["user"]',
  },
];

const RISKY_PATTERNS = [
  { pattern: /\bstudent\b/i, context: 'student reference' },
  { pattern: /roles\s*=\s*\[.*student.*\]/i, context: 'role assignment' },
];

let filesChanged = 0;
let filesReviewed = 0;
const reviewFiles = [];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  let changed = false;
  
  // Apply safe replacements
  for (const rule of SAFE_REPLACEMENTS) {
    if (rule.regex.test(content)) {
      content = content.replace(rule.regex, rule.replace);
      changed = true;
      console.log(`✅ Replaced (${rule.name}) in: ${filePath}`);
    }
  }
  
  // Write changes if any
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesChanged++;
  }
  
  // Flag risky leftovers for manual review
  for (const risky of RISKY_PATTERNS) {
    if (risky.pattern.test(content)) {
      reviewFiles.push({ file: filePath, reason: risky.context });
      break;
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️ Directory not found: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (/\.(ts|tsx|js|jsx)$/.test(fullPath)) {
      filesReviewed++;
      processFile(fullPath);
    }
  }
}

console.log('\n========================================');
console.log('🔥 SAFE STUDENT ROLE REMOVAL');
console.log('========================================');
console.log('Scope: src/ and associated files ONLY');
console.log('');

for (const dir of ROOT_DIRS) {
  console.log(`📂 Processing: ${dir}`);
  walk(dir);
}

console.log('\n========================================');
console.log('✅ REMOVAL COMPLETE');
console.log('========================================');
console.log(`Files reviewed: ${filesReviewed}`);
console.log(`Files changed: ${filesChanged}`);
console.log('');

if (reviewFiles.length > 0) {
  console.log('⚠️ MANUAL REVIEW REQUIRED:');
  console.log('========================================');
  for (const item of reviewFiles) {
    console.log(`📄 ${item.file}`);
    console.log(`   Reason: ${item.reason}`);
  }
  console.log('');
  console.log('These files still contain "student" references.');
  console.log('Review them manually to ensure they are safe to change.');
  console.log('');
}

console.log('Next steps:');
console.log('  1. Review flagged files (if any)');
console.log('  2. Run: npm run validate:rbac');
console.log('  3. Run: node scripts/audit-rbac-duplication.js');
console.log('');
