#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ALLOWED_LOCALHOST_PATTERNS = [
  /test\.ts$/,           // Test files
  /spec\.ts$/,           // Spec files
  /\.test\.tsx?$/,       // Test files
  /\.spec\.tsx?$/,       // Spec files
  /vitest\.config/,      // Config files
  /playwright\.config/,  // Config files
];

const CRITICAL_PATHS = [
  'src/share-branding/auth',
  'apps/realtutorialhub-web/src',
  'apps/skillup-web/src',
];

let violations = [];

function shouldCheckFile(filePath) {
  // Skip test files
  if (ALLOWED_LOCALHOST_PATTERNS.some(pattern => pattern.test(filePath))) {
    return false;
  }
  
  // Only check critical paths
  return CRITICAL_PATHS.some(criticalPath => filePath.includes(criticalPath));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check for localhost usage in fetch/API calls
  const localhostPatterns = [
    /['"`]http:\/\/localhost:\d+/g,
    /['"`]https?:\/\/localhost/g,
  ];
  
  for (const pattern of localhostPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({
        file: filePath,
        matches: matches,
      });
    }
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (shouldCheckFile(fullPath)) {
        scanFile(fullPath);
      }
    }
  }
}

console.log('🔍 Scanning for localhost usage in SSR code...\n');

for (const criticalPath of CRITICAL_PATHS) {
  scanDirectory(criticalPath);
}

if (violations.length > 0) {
  console.log('❌ FOUND LOCALHOST USAGE IN SSR CODE:\n');
  
  for (const violation of violations) {
    console.log(`File: ${violation.file}`);
    console.log(`Matches: ${violation.matches.join(', ')}`);
    console.log('');
  }
  
  console.log('🚨 SSR code MUST NOT use localhost');
  console.log('✅ Use request origin instead (headers().get("host"))');
  console.log('');
  
  process.exit(1);
}

console.log('✅ No localhost usage found in SSR code');
console.log('✅ Architecture boundary maintained');
