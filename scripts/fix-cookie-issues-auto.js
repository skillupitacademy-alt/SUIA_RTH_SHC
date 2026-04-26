#!/usr/bin/env node

/**
 * 🔧 AUTO-FIX COOKIE ISSUES
 * 
 * Automatically adds credentials: 'include' to CRITICAL routes only.
 * Safe and controlled - only fixes protected endpoints.
 */

const fs = require('fs');
const path = require('path');

// Only fix critical protected routes
const CRITICAL_ROUTES = [
  '/api/profile',
  '/api/dashboard',
  '/api/auth/me',
  '/api/auth/sessions',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/onboarding',
  '/api/ai-tutor',
  '/api/tutorial',
  '/api/exam',
  '/api/quiz',
  '/api/reports',
];

let filesFixed = 0;
let issuesFixed = 0;

function isCriticalRoute(url) {
  return CRITICAL_ROUTES.some(route => url.startsWith(route));
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Match fetch calls: fetch('url', {
  const fetchPattern = /fetch\s*\(\s*(['"`])([^'"`]+)\1\s*,\s*\{/g;
  
  const newContent = content.replace(fetchPattern, (match, quote, url, offset) => {
    // Only fix critical routes
    if (!isCriticalRoute(url)) {
      return match;
    }
    
    // Look ahead to check if credentials already exists (search next 500 chars)
    const searchEnd = Math.min(offset + match.length + 500, content.length);
    const snippet = content.substring(offset, searchEnd);
    
    // Skip if already has credentials
    if (snippet.includes('credentials')) {
      return match;
    }
    
    // Add credentials: 'include' after the opening brace
    const fixed = `fetch(${quote}${url}${quote}, { credentials: 'include', `;
    
    modified = true;
    issuesFixed++;
    
    console.log(`   ✓ Fixed: ${url}`);
    
    return fixed;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesFixed++;
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) continue;
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      const wasFixed = fixFile(fullPath);
      if (wasFixed) {
        console.log(`\n📄 ${fullPath}`);
      }
    }
  }
}

console.log('🔧 AUTO-FIXING CRITICAL COOKIE ISSUES...\n');
console.log('Target: CRITICAL protected routes only');
console.log('Action: Adding credentials: \'include\' to fetch calls\n');
console.log('='.repeat(80));

const dirsToScan = [
  'apps/realtutorialhub-web/src',
  'apps/skillup-web/src',
  'src/share-branding',
];

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\nScanning: ${dir}`);
    scanDirectory(dir);
  }
});

console.log('\n' + '='.repeat(80));
console.log('📊 FIX SUMMARY');
console.log('='.repeat(80));
console.log(`\nFiles modified: ${filesFixed}`);
console.log(`Issues fixed: ${issuesFixed}`);

if (filesFixed > 0) {
  console.log('\n✅ AUTO-FIX COMPLETE');
  console.log('\nNext steps:');
  console.log('1. Review changes: git diff');
  console.log('2. Verify: node scripts/scan-frontend-cookie-issues-v2.js');
  console.log('3. Test locally');
  console.log('4. Commit: git add . && git commit -m "fix: add credentials to critical routes"');
} else {
  console.log('\n✓ No fixes needed - all critical routes already have credentials');
}

console.log('\n');
