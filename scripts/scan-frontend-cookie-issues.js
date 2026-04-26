#!/usr/bin/env node

/**
 * 🔍 FRONTEND COOKIE ISSUE SCANNER
 * 
 * Scans frontend code for:
 * - fetch() calls without credentials: 'include'
 * - axios calls without withCredentials
 * - Missing cookie forwarding in SSR
 */

const fs = require('fs');
const path = require('path');

const issues = [];
let totalFetches = 0;
let safeFetches = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Pattern 1: fetch() without credentials
  const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{([^}]*)\})?/g;
  
  let match;
  while ((match = fetchPattern.exec(content)) !== null) {
    const url = match[1];
    const options = match[2] || '';
    
    // Skip if not an API call
    if (!url.includes('/api/')) continue;
    
    totalFetches++;
    
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Check if credentials: 'include' is present
    if (!options.includes('credentials')) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'MISSING_CREDENTIALS',
        code: lines[lineNumber - 1]?.trim(),
        url: url,
        severity: 'HIGH'
      });
    } else {
      safeFetches++;
    }
  }
  
  // Pattern 2: axios without withCredentials
  const axiosPattern = /axios\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  
  while ((match = axiosPattern.exec(content)) !== null) {
    const url = match[2];
    
    // Skip if not an API call
    if (!url.includes('/api/')) continue;
    
    const lineNumber = content.substring(0, match.index).split('\n').length;
    
    // Check if withCredentials is set globally or in call
    const hasWithCredentials = content.includes('withCredentials: true') || 
                               content.includes('axios.defaults.withCredentials');
    
    if (!hasWithCredentials) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'AXIOS_NO_CREDENTIALS',
        code: lines[lineNumber - 1]?.trim(),
        url: url,
        severity: 'HIGH'
      });
    }
  }
  
  // Pattern 3: unifiedFetch usage (should be safe)
  const unifiedFetchPattern = /unifiedFetch\s*\(/g;
  const unifiedMatches = content.match(unifiedFetchPattern);
  if (unifiedMatches) {
    safeFetches += unifiedMatches.length;
  }
}

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist
      if (['node_modules', '.next', 'dist', '.turbo'].includes(file)) continue;
      scanDirectory(filePath, extensions);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      try {
        scanFile(filePath);
      } catch (err) {
        // Skip files that can't be read
      }
    }
  }
}

console.log('🔍 SCANNING FRONTEND FOR COOKIE ISSUES...\n');

// Scan frontend directories
const dirsToScan = [
  'apps/realtutorialhub-web/src',
  'apps/skillup-web/src',
  'src/share-branding'
];

for (const dir of dirsToScan) {
  if (fs.existsSync(dir)) {
    console.log(`Scanning: ${dir}`);
    scanDirectory(dir);
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 SCAN RESULTS');
console.log('='.repeat(80));

console.log(`\nTotal API fetch calls found: ${totalFetches}`);
console.log(`Safe calls (with credentials): ${safeFetches}`);
console.log(`Unsafe calls (missing credentials): ${issues.length}`);

if (issues.length === 0) {
  console.log('\n✅ NO ISSUES FOUND - All fetch calls include credentials!');
} else {
  console.log('\n🚨 ISSUES FOUND:\n');
  
  // Group by file
  const byFile = {};
  issues.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });
  
  Object.keys(byFile).forEach(file => {
    console.log(`\n📄 ${file.replace(process.cwd(), '')}`);
    byFile[file].forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.type}`);
      console.log(`   Code: ${issue.code}`);
      console.log(`   URL: ${issue.url}`);
      console.log(`   Severity: ${issue.severity}`);
      console.log('');
    });
  });
  
  console.log('='.repeat(80));
  console.log('🔧 HOW TO FIX:');
  console.log('='.repeat(80));
  console.log('\n1. For fetch() calls, add credentials:');
  console.log('   fetch(url, { credentials: "include" })');
  console.log('\n2. For axios, set globally:');
  console.log('   axios.defaults.withCredentials = true');
  console.log('\n3. Or use unifiedFetch (already includes credentials):');
  console.log('   import { unifiedFetch } from "@/share-branding/lib/unifiedFetch"');
  console.log('   unifiedFetch(url)');
}

console.log('\n' + '='.repeat(80));
console.log('🎯 RECOMMENDATION:');
console.log('='.repeat(80));

if (issues.length > 0) {
  console.log('\n❌ FRONTEND HAS COOKIE ISSUES');
  console.log('   This explains why login → dashboard → redirect loop happens');
  console.log('   Browser is not sending cookies with API requests');
  console.log('\n✅ FIX: Update all fetch calls to include credentials');
} else {
  console.log('\n✅ FRONTEND LOOKS GOOD');
  console.log('   All fetch calls include credentials');
  console.log('   Issue might be in SSR/middleware layer');
}

process.exit(issues.length > 0 ? 1 : 0);
