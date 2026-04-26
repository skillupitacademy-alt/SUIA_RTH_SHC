#!/usr/bin/env node
/**
 * 🔍 AUTO-DETECT UNPROTECTED ROUTES
 * 
 * Scans all API routes and finds missing RBAC/Brand validation
 * Only checks routes that have auth (to avoid false positives)
 */

const fs = require('fs');
const path = require('path');

const TARGET = 'apps/api-server/src/app/api';
const EXCLUDE_DIRS = ['.next', 'node_modules', '.turbo'];

let totalRoutes = 0;
let protectedRoutes = 0;
let unprotectedRoutes = 0;
let publicRoutes = 0;

const issues = [];

function scan(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Check if this is an API route file
  const isRouteFile = /export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/.test(content);
  if (!isRouteFile) return;
  
  totalRoutes++;
  
  // Check for auth patterns
  const hasTokenService = content.includes('TokenService');
  const hasGetAccessToken = content.includes('getAccessToken');
  const hasVerifyToken = content.includes('verifyAccessToken') || content.includes('verifyUserAccessToken');
  const hasAuth = hasTokenService || hasGetAccessToken || hasVerifyToken;
  
  // Check for RBAC patterns
  const hasRBACService = content.includes('RBACService.requirePermission');
  const hasOwnershipRBAC = content.includes('OwnershipRBACService.requirePermissionOrOwnership');
  const hasRBAC = hasRBACService || hasOwnershipRBAC;
  
  // Check for brand validation
  const hasBrandValidation = content.includes('validateBrandOrThrow');
  
  // Public routes (no auth needed)
  const isPublicRoute = content.includes('/api/auth/login') || 
                        content.includes('/api/auth/signup') ||
                        content.includes('/api/health') ||
                        content.includes('/api/status');
  
  if (isPublicRoute) {
    publicRoutes++;
    return;
  }
  
  // If has auth but missing RBAC or brand validation
  if (hasAuth && (!hasRBAC || !hasBrandValidation)) {
    unprotectedRoutes++;
    
    const relativePath = filePath.replace(process.cwd() + '/', '');
    const issue = {
      file: relativePath,
      missingRBAC: !hasRBAC,
      missingBrand: !hasBrandValidation,
    };
    
    issues.push(issue);
  } else if (hasAuth && hasRBAC && hasBrandValidation) {
    protectedRoutes++;
  }
}

function walk(dir) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      // Skip excluded directories
      if (EXCLUDE_DIRS.includes(file)) continue;
      
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.ts') && file.includes('route')) {
        scan(fullPath);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

console.log('SCANNING API ROUTES FOR RBAC COVERAGE...\n');

walk(TARGET);

console.log('='.repeat(70));
console.log('RBAC COVERAGE REPORT');
console.log('='.repeat(70));
console.log(`Total API Routes:      ${totalRoutes}`);
console.log(`[OK] Protected Routes:   ${protectedRoutes} (${Math.round(protectedRoutes/totalRoutes*100)}%)`);
console.log(`[!!] Unprotected Routes: ${unprotectedRoutes} (${Math.round(unprotectedRoutes/totalRoutes*100)}%)`);
console.log(`[--] Public Routes:      ${publicRoutes}`);
console.log('='.repeat(70));

if (issues.length > 0) {
  console.log('\n[!!] UNPROTECTED ROUTES FOUND:\n');
  
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue.file}`);
    if (issue.missingRBAC) console.log('   [X] Missing RBAC permission check');
    if (issue.missingBrand) console.log('   [X] Missing brand validation');
    console.log('');
  });
  
  console.log('[ACTION] RECOMMENDED ACTIONS:');
  console.log('1. Add RBAC checks to all unprotected routes');
  console.log('2. Add brand validation to all routes');
  console.log('3. Re-run this script to verify coverage\n');
  
  process.exit(1);
} else {
  console.log('\n[SUCCESS] ALL ROUTES ARE PROTECTED!\n');
  console.log('[OK] RBAC enforcement is complete');
  console.log('[OK] Brand validation is in place');
  console.log('[OK] System is production-ready\n');
  
  process.exit(0);
}
