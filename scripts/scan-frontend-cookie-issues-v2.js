#!/usr/bin/env node

/**
 * 🔍 SMART COOKIE SCANNER V2
 * 
 * Classifies fetch() calls by severity:
 * 🔴 CRITICAL - Protected routes that MUST have credentials
 * 🟡 OPTIONAL - Routes that may need credentials (context-dependent)
 * 🟢 SAFE - Public routes that don't need credentials
 */

const fs = require('fs');
const path = require('path');

// Route classification
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

const SAFE_ROUTES = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/healthz',
];

const issues = [];

function classifyRoute(url) {
  // Check if it's a safe public route
  if (SAFE_ROUTES.some(route => url.startsWith(route))) {
    return 'SAFE';
  }
  
  // Check if it's a critical protected route
  if (CRITICAL_ROUTES.some(route => url.startsWith(route))) {
    return 'CRITICAL';
  }
  
  // Everything else is optional (needs manual review)
  return 'OPTIONAL';
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Match fetch calls - handle multi-line by looking ahead for closing brace
  const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{/g;
  
  let match;
  while ((match = fetchPattern.exec(content)) !== null) {
    const url = match[1];
    
    // Only check API routes
    if (!url.includes('/api/')) continue;
    
    // Find the closing brace for this fetch call (look ahead up to 500 chars)
    const startPos = match.index;
    const searchEnd = Math.min(startPos + 500, content.length);
    const snippet = content.substring(startPos, searchEnd);
    
    // Check if credentials is present in the options object
    if (snippet.includes('credentials')) continue;
    
    const severity = classifyRoute(url);
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    issues.push({
      file: filePath,
      line: lineNumber,
      url,
      severity,
      code: lines[lineNumber - 1]?.trim() || '',
    });
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip common directories
      if (['node_modules', '.next', 'dist', 'build', '.git'].includes(file)) continue;
      scanDirectory(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(fullPath);
    }
  }
}

// Scan directories
console.log('🔍 SCANNING FRONTEND FOR COOKIE ISSUES (SMART V2)...\n');

const dirsToScan = [
  'apps/realtutorialhub-web/src',
  'apps/skillup-web/src',
  'src/share-branding',
];

dirsToScan.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning: ${dir}`);
    scanDirectory(dir);
  }
});

// Group by severity
const critical = issues.filter(i => i.severity === 'CRITICAL');
const optional = issues.filter(i => i.severity === 'OPTIONAL');
const safe = issues.filter(i => i.severity === 'SAFE');

console.log('\n' + '='.repeat(80));
console.log('📊 SMART SCAN RESULTS');
console.log('='.repeat(80));

console.log(`\nTotal API fetch calls analyzed: ${issues.length}`);
console.log(`🔴 CRITICAL issues: ${critical.length}`);
console.log(`🟡 OPTIONAL issues: ${optional.length}`);
console.log(`🟢 SAFE (can ignore): ${safe.length}`);

// Display critical issues
if (critical.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('🔴 CRITICAL ISSUES (MUST FIX)');
  console.log('='.repeat(80));
  
  critical.forEach(issue => {
    console.log(`\n📄 ${issue.file}`);
    console.log(`   Line ${issue.line}: ${issue.url}`);
    console.log(`   Code: ${issue.code}`);
  });
}

// Display optional issues
if (optional.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('🟡 OPTIONAL ISSUES (REVIEW NEEDED)');
  console.log('='.repeat(80));
  
  optional.forEach(issue => {
    console.log(`\n📄 ${issue.file}`);
    console.log(`   Line ${issue.line}: ${issue.url}`);
    console.log(`   Code: ${issue.code}`);
  });
}

// Display safe issues (informational only)
if (safe.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('🟢 SAFE ISSUES (PUBLIC ENDPOINTS - CAN IGNORE)');
  console.log('='.repeat(80));
  
  safe.forEach(issue => {
    console.log(`\n📄 ${issue.file}`);
    console.log(`   Line ${issue.line}: ${issue.url}`);
    console.log(`   Code: ${issue.code}`);
  });
}

// Summary and recommendations
console.log('\n' + '='.repeat(80));
console.log('🎯 RECOMMENDATIONS');
console.log('='.repeat(80));

if (critical.length > 0) {
  console.log('\n🚨 ACTION REQUIRED:');
  console.log(`   ${critical.length} CRITICAL issue(s) found that WILL cause auth failures`);
  console.log('   These routes require authentication and MUST include credentials');
  console.log('\n   Fix with:');
  console.log('   node scripts/fix-cookie-issues-auto.js');
} else {
  console.log('\n✅ NO CRITICAL ISSUES FOUND');
  console.log('   All protected routes properly include credentials');
}

if (optional.length > 0) {
  console.log(`\n⚠️  ${optional.length} OPTIONAL issue(s) need manual review`);
  console.log('   Check if these routes require authentication');
}

if (safe.length > 0) {
  console.log(`\n✓ ${safe.length} public endpoint(s) missing credentials (safe to ignore)`);
  console.log('   These are public routes that don\'t require authentication');
}

console.log('\n' + '='.repeat(80));

// Exit with error if critical issues found
if (critical.length > 0) {
  console.log('\n❌ SCAN FAILED - Critical issues must be fixed before deployment\n');
  process.exit(1);
} else {
  console.log('\n✅ SCAN PASSED - No critical cookie issues detected\n');
  process.exit(0);
}
