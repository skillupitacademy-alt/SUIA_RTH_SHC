#!/usr/bin/env node

/**
 * 🔐 AUTH SYSTEM STATIC AUDITOR
 * 
 * Scans codebase for authentication patterns, security issues,
 * and code quality problems.
 * 
 * Usage: node tmp/run-auth-audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// 🎯 AUDIT CATEGORIES
const AUDIT_PATTERNS = {
  // 1. AUTHENTICATION PATTERNS
  authentication: {
    shadowUserId: { severity: 'info', description: 'Shadow user ID usage (cross-brand identity)' },
    accessToken: { severity: 'info', description: 'Access token references' },
    refreshToken: { severity: 'info', description: 'Refresh token references' },
    'httpOnly: true': { severity: 'good', description: 'Secure cookie configuration' },
    'httpOnly: false': { severity: 'warning', description: 'Insecure cookie configuration' },
    localStorage: { severity: 'critical', description: 'Insecure token storage (XSS risk)' },
    sessionStorage: { severity: 'critical', description: 'Insecure token storage (XSS risk)' },
  },

  // 2. AUTHORIZATION PATTERNS
  authorization: {
    'requireAuth': { severity: 'info', description: 'Auth middleware usage' },
    'requireRole': { severity: 'info', description: 'Role-based access control' },
    'isProtectedRoute': { severity: 'info', description: 'Route protection' },
    'fetchBackendAuthState': { severity: 'good', description: 'Server-side auth validation' },
    'onboardingCompleted': { severity: 'info', description: 'Onboarding gating' },
  },

  // 3. INTERNAL SECURITY
  internalSecurity: {
    'x-gateway-secret': { severity: 'info', description: 'Gateway secret usage' },
    'x-internal-secret': { severity: 'info', description: 'Internal service secret' },
    'INTERNAL_API_SECRET': { severity: 'info', description: 'Internal API secret reference' },
    'INTERNAL_GATEWAY_SECRET': { severity: 'info', description: 'Gateway secret reference' },
    'process.env.JWT_SECRET': { severity: 'warning', description: 'Direct secret access (use service)' },
  },

  // 4. STALE / LEGACY CODE
  staleCode: {
    FALLBACK_API_BASE: { severity: 'warning', description: 'Deprecated fallback URL (remove after gateway enforcement)' },
    'extractAuthFromRequest': { severity: 'info', description: 'Auth extraction utility (active)' },
    'TODO': { severity: 'info', description: 'TODO comment' },
    'FIXME': { severity: 'warning', description: 'FIXME comment' },
    'HACK': { severity: 'warning', description: 'HACK comment' },
    '@deprecated': { severity: 'warning', description: 'Deprecated code' },
  },

  // 5. SECURITY RISKS
  securityRisks: {
    'eval(': { severity: 'critical', description: 'Code injection risk' },
    'dangerouslySetInnerHTML': { severity: 'warning', description: 'XSS risk' },
    'innerHTML': { severity: 'warning', description: 'XSS risk' },
    '.html(': { severity: 'warning', description: 'XSS risk (jQuery)' },
    'Authorization': { severity: 'info', description: 'Authorization header usage' },
  },

  // 6. CODE DUPLICATION
  duplication: {
    'proxyAuthRequest': { severity: 'good', description: 'Shared BFF proxy (good)' },
    'authBffRoute': { severity: 'good', description: 'Shared auth route logic (good)' },
    'const FALLBACK_API_BASE': { severity: 'warning', description: 'Duplicated fallback URL' },
  }
};

// 🚫 EXCLUDE PATTERNS
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'build',
  '.git',
  'coverage',
  'test-results',
  '__tests__',
  '.kiro'
];

const EXCLUDE_FILES = [
  '.map',
  '.min.js',
  '.bundle.js',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
];

// 📊 RESULTS STORAGE
const results = {
  authentication: [],
  authorization: [],
  internalSecurity: [],
  staleCode: [],
  securityRisks: [],
  duplication: [],
  summary: {
    totalFiles: 0,
    scannedFiles: 0,
    critical: 0,
    warning: 0,
    info: 0,
    good: 0
  }
};

/**
 * Check if path should be excluded
 */
function shouldExclude(fullPath) {
  const relativePath = path.relative(ROOT, fullPath);
  
  // Exclude directories
  for (const dir of EXCLUDE_DIRS) {
    if (relativePath.includes(dir)) return true;
  }
  
  // Exclude files
  for (const ext of EXCLUDE_FILES) {
    if (fullPath.endsWith(ext)) return true;
  }
  
  return false;
}

/**
 * Scan directory recursively
 */
function scanDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    
    if (shouldExclude(fullPath)) continue;

    results.summary.totalFiles++;

    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      scanFile(fullPath);
    }
  }
}

/**
 * Scan individual file
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(ROOT, filePath);
    
    results.summary.scannedFiles++;

    // Scan each category
    Object.entries(AUDIT_PATTERNS).forEach(([category, patterns]) => {
      Object.entries(patterns).forEach(([pattern, config]) => {
        if (content.includes(pattern)) {
          const lines = findPatternLines(content, pattern);
          
          results[category].push({
            file: relativePath,
            pattern,
            severity: config.severity,
            description: config.description,
            lines,
            occurrences: lines.length
          });

          // Update summary counts
          results.summary[config.severity]++;
        }
      });
    });
  } catch (error) {
    console.error(`❌ Error scanning ${filePath}:`, error.message);
  }
}

/**
 * Find line numbers where pattern appears
 */
function findPatternLines(content, pattern) {
  const lines = content.split('\n');
  const matches = [];
  
  lines.forEach((line, index) => {
    if (line.includes(pattern)) {
      matches.push({
        lineNumber: index + 1,
        content: line.trim().substring(0, 100) // First 100 chars
      });
    }
  });
  
  return matches;
}

/**
 * Group results by pattern
 */
function groupByPattern(categoryResults) {
  const grouped = {};
  
  categoryResults.forEach(result => {
    if (!grouped[result.pattern]) {
      grouped[result.pattern] = {
        severity: result.severity,
        description: result.description,
        files: []
      };
    }
    
    grouped[result.pattern].files.push({
      file: result.file,
      occurrences: result.occurrences,
      lines: result.lines
    });
  });
  
  return grouped;
}

/**
 * Get severity emoji
 */
function getSeverityEmoji(severity) {
  const emojis = {
    critical: '🔴',
    warning: '⚠️',
    info: 'ℹ️',
    good: '✅'
  };
  return emojis[severity] || '❓';
}

/**
 * Print category report
 */
function printCategoryReport(categoryName, categoryResults) {
  if (categoryResults.length === 0) {
    console.log(`\n${categoryName.toUpperCase()}: ✅ No issues found`);
    return;
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📋 ${categoryName.toUpperCase()}`);
  console.log(`${'='.repeat(80)}`);

  const grouped = groupByPattern(categoryResults);
  
  Object.entries(grouped).forEach(([pattern, data]) => {
    const emoji = getSeverityEmoji(data.severity);
    console.log(`\n${emoji} Pattern: "${pattern}"`);
    console.log(`   Description: ${data.description}`);
    console.log(`   Severity: ${data.severity.toUpperCase()}`);
    console.log(`   Files: ${data.files.length}`);
    
    // Show first 5 files
    data.files.slice(0, 5).forEach(fileData => {
      console.log(`   - ${fileData.file} (${fileData.occurrences} occurrence${fileData.occurrences > 1 ? 's' : ''})`);
      
      // Show first line for context
      if (fileData.lines.length > 0) {
        console.log(`     Line ${fileData.lines[0].lineNumber}: ${fileData.lines[0].content}`);
      }
    });
    
    if (data.files.length > 5) {
      console.log(`   ... and ${data.files.length - 5} more files`);
    }
  });
}

/**
 * Print summary report
 */
function printSummary() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 AUDIT SUMMARY');
  console.log(`${'='.repeat(80)}`);
  
  console.log(`\n📁 Files:`);
  console.log(`   Total files found: ${results.summary.totalFiles}`);
  console.log(`   Scanned files: ${results.summary.scannedFiles}`);
  
  console.log(`\n🎯 Findings by Severity:`);
  console.log(`   🔴 Critical: ${results.summary.critical}`);
  console.log(`   ⚠️  Warning: ${results.summary.warning}`);
  console.log(`   ℹ️  Info: ${results.summary.info}`);
  console.log(`   ✅ Good: ${results.summary.good}`);
  
  const totalFindings = results.summary.critical + results.summary.warning + results.summary.info + results.summary.good;
  console.log(`\n   Total findings: ${totalFindings}`);
}

/**
 * Print recommendations
 */
function printRecommendations() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('💡 RECOMMENDATIONS');
  console.log(`${'='.repeat(80)}`);
  
  const recommendations = [];
  
  // Check for critical issues
  if (results.summary.critical > 0) {
    recommendations.push({
      priority: '🔴 CRITICAL',
      message: 'Fix critical security issues immediately (localStorage, eval, etc.)'
    });
  }
  
  // Check for FALLBACK_API_BASE
  const fallbackUsage = results.staleCode.filter(r => r.pattern === 'FALLBACK_API_BASE');
  if (fallbackUsage.length > 0) {
    recommendations.push({
      priority: '⚠️ HIGH',
      message: `Remove ${fallbackUsage.length} FALLBACK_API_BASE references (deprecated)`
    });
  }
  
  // Check for localStorage usage
  const localStorageUsage = results.authentication.filter(r => r.pattern === 'localStorage');
  if (localStorageUsage.length > 0) {
    recommendations.push({
      priority: '🔴 CRITICAL',
      message: `Remove ${localStorageUsage.length} localStorage token storage (XSS risk)`
    });
  }
  
  // Check for insecure cookies
  const insecureCookies = results.authentication.filter(r => r.pattern === 'httpOnly: false');
  if (insecureCookies.length > 0) {
    recommendations.push({
      priority: '⚠️ MEDIUM',
      message: `Review ${insecureCookies.length} httpOnly: false cookie configurations`
    });
  }
  
  // Check for TODO/FIXME
  const todos = results.staleCode.filter(r => r.pattern === 'TODO' || r.pattern === 'FIXME');
  if (todos.length > 0) {
    recommendations.push({
      priority: 'ℹ️ LOW',
      message: `Address ${todos.length} TODO/FIXME comments`
    });
  }
  
  if (recommendations.length === 0) {
    console.log('\n✅ No critical recommendations. System looks good!');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.priority}: ${rec.message}`);
    });
  }
}

/**
 * Print security score
 */
function printSecurityScore() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔐 SECURITY SCORE');
  console.log(`${'='.repeat(80)}`);
  
  let score = 100;
  
  // Deduct points for issues
  score -= results.summary.critical * 10;
  score -= results.summary.warning * 2;
  
  // Cap at 0
  score = Math.max(0, score);
  
  let rating = '';
  let emoji = '';
  
  if (score >= 90) {
    rating = 'EXCELLENT';
    emoji = '🏆';
  } else if (score >= 75) {
    rating = 'GOOD';
    emoji = '✅';
  } else if (score >= 60) {
    rating = 'FAIR';
    emoji = '⚠️';
  } else {
    rating = 'NEEDS IMPROVEMENT';
    emoji = '🔴';
  }
  
  console.log(`\n${emoji} Score: ${score}/100 - ${rating}`);
  
  if (results.summary.critical > 0) {
    console.log(`\n🔴 CRITICAL: ${results.summary.critical} critical security issue(s) found!`);
  }
  
  if (results.summary.warning > 0) {
    console.log(`⚠️  WARNING: ${results.summary.warning} warning(s) found`);
  }
  
  if (score === 100) {
    console.log('\n🎉 Perfect score! No security issues detected.');
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 AUTH SYSTEM STATIC AUDITOR');
  console.log('━'.repeat(80));
  console.log(`📂 Scanning: ${ROOT}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log('━'.repeat(80));
  
  const startTime = Date.now();
  
  // Scan the codebase
  scanDir(ROOT);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print reports
  printCategoryReport('AUTHENTICATION', results.authentication);
  printCategoryReport('AUTHORIZATION', results.authorization);
  printCategoryReport('INTERNAL SECURITY', results.internalSecurity);
  printCategoryReport('STALE CODE', results.staleCode);
  printCategoryReport('SECURITY RISKS', results.securityRisks);
  printCategoryReport('CODE DUPLICATION', results.duplication);
  
  printSummary();
  printSecurityScore();
  printRecommendations();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`⏱️  Scan completed in ${duration}s`);
  console.log(`${'='.repeat(80)}\n`);
  
  // Exit with error code if critical issues found
  if (results.summary.critical > 0) {
    process.exit(1);
  }
}

// Run the auditor
main();


/*

PS D:\onlinewebsites\quiz-platform> node tmp/run-auth-audit.js
🔍 AUTH SYSTEM STATIC AUDITOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📂 Scanning: D:\onlinewebsites\quiz-platform
⏰ Started: 2026-04-24T15:27:14.081Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

================================================================================
📋 AUTHENTICATION
================================================================================

ℹ️ Pattern: "accessToken"
   Description: Access token references
   Severity: INFO
   Files: 57
   - apps\api-server\src\app\api\admin\auth\login\route.ts (3 occurrences)
     Line 54: accessTokenCookieName: audience === 'infra' ? 'infra_accessToken' : 'admin_accessToken',
   - apps\api-server\src\app\api\auth\login\route.ts (4 occurrences)
     Line 97: const { _user, accessToken, refreshToken, isAdmin } = await container.get(AuthService).login(email, 
   - apps\api-server\src\app\api\auth\logout\route.ts (8 occurrences)
     Line 21: const adminToken = _req.cookies.get('admin_accessToken')?.value;
   - apps\api-server\src\app\api\auth\me\route.ts (3 occurrences)
     Line 42: const accessToken = tokenService.getAccessToken(req);
   - apps\api-server\src\app\api\auth\onboarding\route.ts (3 occurrences)
     Line 41: const accessToken = tokenService.getAccessToken(req);
   ... and 52 more files

ℹ️ Pattern: "refreshToken"
   Description: Refresh token references
   Severity: INFO
   Files: 53
   - apps\api-server\src\app\api\admin\auth\login\route.ts (3 occurrences)
     Line 55: refreshTokenCookieName: audience === 'infra' ? 'infra_refreshToken' : 'admin_refreshToken',
   - apps\api-server\src\app\api\auth\login\route.ts (4 occurrences)
     Line 97: const { _user, accessToken, refreshToken, isAdmin } = await container.get(AuthService).login(email, 
   - apps\api-server\src\app\api\auth\logout\route.ts (11 occurrences)
     Line 42: const refreshToken = _req.cookies.get('refreshToken')?.value;
   - apps\api-server\src\app\api\auth\me\route.ts (5 occurrences)
     Line 99: ? tokenRepo.withDb(brandContext.db, { refreshTokens: brandContext.tables.refreshTokens })
   - apps\api-server\src\app\api\auth\refresh\route.ts (5 occurrences)
     Line 29: const infraRefresh = _req.cookies.get('infra_refreshToken')?.value;
   ... and 48 more files

✅ Pattern: "httpOnly: true"
   Description: Secure cookie configuration
   Severity: GOOD
   Files: 14
   - apps\api-server\src\app\api\admin\auth\login\route.ts (1 occurrence)
     Line 74: httpOnly: true,
   - apps\api-server\src\app\api\auth\login\route.ts (2 occurrences)
     Line 136: httpOnly: true,
   - apps\api-server\src\app\api\auth\logout\route.ts (1 occurrence)
     Line 77: httpOnly: true,
   - apps\api-server\src\app\api\auth\refresh\route.ts (2 occurrences)
     Line 79: httpOnly: true,
   - apps\api-server\src\app\api\auth\signup\route.ts (2 occurrences)
     Line 62: httpOnly: true,
   ... and 9 more files

ℹ️ Pattern: "shadowUserId"
   Description: Shadow user ID usage (cross-brand identity)
   Severity: INFO
   Files: 41
   - apps\api-server\src\app\api\admin\auth\me\route.ts (3 occurrences)
     Line 68: shadowUserId:
   - apps\api-server\src\app\api\auth\me\route.ts (2 occurrences)
     Line 121: shadowUserId: payload.shadowUserId,
   - apps\api-server\src\lib\request-auth.ts (3 occurrences)
     Line 3: const shadowUserId = headers.get('x-shadow-user-id');
   - apps\api-server\src\modules\auth\admin-auth.service.ts (10 occurrences)
     Line 16: shadowUserId: unknown;
   - apps\api-server\src\modules\auth\login.service.ts (11 occurrences)
     Line 33: user: { id: string; email: string; shadowUserId?: string | null },
   ... and 36 more files

⚠️ Pattern: "httpOnly: false"
   Description: Insecure cookie configuration
   Severity: WARNING
   Files: 2
   - apps\api-server\src\config\production.config.ts (1 occurrence)
     Line 24: httpOnly: false,
   - tmp\run-auth-audit.js (3 occurrences)
     Line 25: 'httpOnly: false': { severity: 'warning', description: 'Insecure cookie configuration' },

🔴 Pattern: "localStorage"
   Description: Insecure token storage (XSS risk)
   Severity: CRITICAL
   Files: 21
   - apps\faculty-app\src\components\attendance-board.tsx (7 occurrences)
     Line 62: const queue = localStorage.getItem(getQueueKey(batchId, sessionId));
   - apps\realtutorialhub-admin\src\hooks\useJobTracker.ts (1 occurrence)
     Line 39: // 1. Load active job IDs from localStorage for the current user
   - apps\realtutorialhub-admin\src\utils\safeLocalStorage.ts (7 occurrences)
     Line 10: export const hasStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage
   - apps\realtutorialhub-admin\tests\e2e\admin-auth.spec.ts (3 occurrences)
     Line 236: localStorage.setItem('quiz-factory-storage-v1', JSON.stringify({ draft: 'SECRET' }));
   - apps\realtutorialhub-admin\tests\e2e\fixtures\auth.ts (1 occurrence)
     Line 40: // Move to a same-origin page so localStorage is accessible before clearing.  
   ... and 16 more files

🔴 Pattern: "sessionStorage"
   Description: Insecure token storage (XSS risk)
   Severity: CRITICAL
   Files: 16
   - apps\realtutorialhub-admin\sentry.client.config.ts (1 occurrence)
     Line 14: sessionId: sessionStorage.getItem('admin_session_id') || 'unknown',
   - apps\realtutorialhub-admin\src\components\providers\MonitoringProvider.tsx (3 occurrences)
     Line 15: const stored = sessionStorage.getItem('admin_session_id');
   - apps\realtutorialhub-admin\src\utils\clientLogger.ts (2 occurrences)
     Line 42: const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('admin_session_id') ?? 'no
   - apps\realtutorialhub-admin\tests\e2e\fixtures\auth.ts (1 occurrence)
     Line 44: sessionStorage.clear();
   - apps\realtutorialhub-quiz\sentry.client.config.ts (1 occurrence)
     Line 15: sessionId: sessionStorage.getItem('quiz_session_id') || 'unknown',
   ... and 11 more files

================================================================================
📋 AUTHORIZATION
================================================================================

ℹ️ Pattern: "onboardingCompleted"
   Description: Onboarding gating
   Severity: INFO
   Files: 27
   - apps\api-server\src\app\api\auth\debug\profile-integrity\route.ts (1 occurrence)       
     Line 71: onboardingCompleted: profileExists && profile.onboardingCompleted === true,   
   - apps\api-server\src\app\api\auth\profile\route.ts (3 occurrences)
     Line 29: onboardingCompleted?: boolean;
   - apps\api-server\src\app\api\auth\refresh\route.ts (1 occurrence)
     Line 116: setOnboardingStateCookie(response, _req, profile?.onboardingCompleted === true);
   - apps\api-server\src\app\api\auth\signup\route.ts (1 occurrence)
     Line 49: const userForDto = { ..._user, profile: { name, onboardingCompleted: false } };
   - apps\api-server\src\dtos\auth.dto.ts (2 occurrences)
     Line 8: onboardingCompleted: boolean; // 🔥 Add for backward compatibility
   ... and 22 more files

ℹ️ Pattern: "isProtectedRoute"
   Description: Route protection
   Severity: INFO
   Files: 4
   - apps\realtutorialhub-admin\src\proxy.ts (4 occurrences)
     Line 32: export function isProtectedRoute(pathname: string): boolean {
   - apps\realtutorialhub-quiz\src\proxy.ts (3 occurrences)
     Line 43: export function isProtectedRoute(pathname: string): boolean {
   - src\share-branding\middleware\authProxy.ts (3 occurrences)
     Line 61: export function isProtectedRoute(pathname: string): boolean {
   - tmp\run-auth-audit.js (1 occurrence)
     Line 34: 'isProtectedRoute': { severity: 'info', description: 'Route protection' },    

✅ Pattern: "fetchBackendAuthState"
   Description: Server-side auth validation
   Severity: GOOD
   Files: 11
   - apps\realtutorialhub-quiz\src\app\(authenticated)\onboarding\page.tsx (2 occurrences)  
     Line 3: import { fetchBackendAuthState } from '../../../../../../src/share-branding/auth/serverAuthState';
   - apps\realtutorialhub-web\src\app\dashboard\page.tsx (2 occurrences)
     Line 3: import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
   - apps\realtutorialhub-web\src\app\dashboard\profile\page.tsx (2 occurrences)
     Line 3: import { fetchBackendAuthState } from '../../../../../../src/share-branding/auth/serverAuthState';
   - apps\realtutorialhub-web\src\app\onboarding\page.tsx (2 occurrences)
     Line 4: import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
   - apps\skillup-web\src\app\dashboard\page.tsx (2 occurrences)
     Line 3: import { fetchBackendAuthState } from '../../../../../src/share-branding/auth/serverAuthState';
   ... and 6 more files

ℹ️ Pattern: "requireRole"
   Description: Role-based access control
   Severity: INFO
   Files: 9
   - packages\auth\src\index.ts (1 occurrence)
     Line 8: export { RBACService, requirePermission, requireRole, requireAdmin } from './rbac.service';
   - packages\auth\src\rbac.service.ts (1 occurrence)
     Line 101: export function requireRole(role: Role) {
   - services\api-gateway\src\middleware\auth.ts (2 occurrences)
     Line 10: requireRole?: 'admin';
   - services\api-gateway\src\routes\routing-table.ts (3 occurrences)
     Line 41: { prefix: '/factory', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/factory', auth: tru
   - services\api-gateway\src\types.ts (1 occurrence)
     Line 64: requireRole?: 'admin';
   ... and 4 more files

ℹ️ Pattern: "requireAuth"
   Description: Auth middleware usage
   Severity: INFO
   Files: 5
   - services\skillhubcore-service\src\middleware\verify-jwt.ts (1 occurrence)
     Line 21: export const requireAuth = createMiddleware(async (c, next) => {
   - services\skillhubcore-service\src\modules\auth\auth.routes.ts (7 occurrences)
     Line 7: import { requireAuth, requirePlatform } from '@/middleware/verify-jwt';        
   - services\skillhubcore-service\src\modules\auth\sso\sso.routes.ts (3 occurrences)       
     Line 4: import { requireAuth, requireRoles } from '@/middleware/verify-jwt';
   - services\skillhubcore-service\src\modules\hierarchy\hierarchy.routes.ts (2 occurrences)
     Line 4: import { requireAuth, requireRoles } from '@/middleware/verify-jwt';
   - tmp\run-auth-audit.js (1 occurrence)
     Line 32: 'requireAuth': { severity: 'info', description: 'Auth middleware usage' },    

================================================================================
📋 INTERNAL SECURITY
================================================================================

ℹ️ Pattern: "x-gateway-secret"
   Description: Gateway secret usage
   Severity: INFO
   Files: 12
   - apps\api-server\src\app\api\auth\me\route.ts (1 occurrence)
     Line 23: * Gateway validates JWT and injects headers (x-user-id, x-brand, x-gateway-secret)
   - apps\api-server\src\middleware\gateway-auth.middleware.ts (2 occurrences)
     Line 18: const gatewaySecret = req.headers.get('x-gateway-secret');
   - apps\faculty-app\src\lib\faculty-api.ts (1 occurrence)
     Line 67: appendHeader(headers, 'x-gateway-secret', process.env.INTERNAL_GATEWAY_SECRET);
   - apps\realtutorialhub-quiz\src\proxy.ts (1 occurrence)
     Line 73: return request.headers.get('x-gateway-secret') === INTERNAL_GATEWAY_SECRET;   
   - apps\skillhub-placement\src\app\api\auth\handoff\route.ts (1 occurrence)
     Line 44: 'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
   ... and 7 more files

ℹ️ Pattern: "x-internal-secret"
   Description: Internal service secret
   Severity: INFO
   Files: 4
   - apps\api-server\src\middleware\gateway-auth.middleware.ts (2 occurrences)
     Line 19: const internalSecret = req.headers.get('x-internal-secret');
   - apps\api-server\src\middleware\internal-auth.middleware.ts (3 occurrences)
     Line 8: * 2. Internal Mode: x-internal-secret + identity headers (NEW)
   - src\share-branding\auth\unifiedBffAuth.ts (1 occurrence)
     Line 95: 'x-internal-secret': internalSecret,
   - tmp\run-auth-audit.js (1 occurrence)
     Line 42: 'x-internal-secret': { severity: 'info', description: 'Internal service secret' },

ℹ️ Pattern: "INTERNAL_API_SECRET"
   Description: Internal API secret reference
   Severity: INFO
   Files: 4
   - apps\api-server\src\middleware\gateway-auth.middleware.ts (1 occurrence)
     Line 21: const expectedInternalSecret = process.env.INTERNAL_API_SECRET;
   - apps\api-server\src\middleware\internal-auth.middleware.ts (4 occurrences)
     Line 38: hasSecret: process.env.INTERNAL_API_SECRET !== undefined,
   - src\share-branding\auth\unifiedBffAuth.ts (2 occurrences)
     Line 82: const internalSecret = process.env.INTERNAL_API_SECRET;
   - tmp\run-auth-audit.js (1 occurrence)
     Line 43: 'INTERNAL_API_SECRET': { severity: 'info', description: 'Internal API secret reference' },

ℹ️ Pattern: "INTERNAL_GATEWAY_SECRET"
   Description: Gateway secret reference
   Severity: INFO
   Files: 13
   - apps\api-server\src\middleware\gateway-auth.middleware.ts (2 occurrences)
     Line 20: const expectedSecret = process.env.INTERNAL_GATEWAY_SECRET;
   - apps\faculty-app\src\lib\faculty-api.ts (1 occurrence)
     Line 67: appendHeader(headers, 'x-gateway-secret', process.env.INTERNAL_GATEWAY_SECRET);
   - apps\realtutorialhub-quiz\src\proxy.ts (3 occurrences)
     Line 5: const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET;
   - apps\skillhub-placement\src\app\api\auth\handoff\route.ts (1 occurrence)
     Line 44: 'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
   - apps\skillhubcore-admin\src\app\api\auth\login\route.ts (1 occurrence)
     Line 39: 'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET ?? '',
   ... and 8 more files

⚠️ Pattern: "process.env.JWT_SECRET"
   Description: Direct secret access (use service)
   Severity: WARNING
   Files: 2
   - apps\skillhubcore-admin\src\lib\skillhubcore-admin-guards.ts (1 occurrence)
     Line 20: const secret = process.env.SKILLHUBCORE_ADMIN_TOTP_SECRET ?? process.env.ADMIN_JWT_SECRET ?? process
   - tmp\run-auth-audit.js (1 occurrence)
     Line 45: 'process.env.JWT_SECRET': { severity: 'warning', description: 'Direct secret access (use service)' }

================================================================================
📋 STALE CODE
================================================================================

ℹ️ Pattern: "TODO"
   Description: TODO comment
   Severity: INFO
   Files: 4
   - apps\api-server\src\app\api\admin\users\route.ts (2 occurrences)
     Line 33: // TODO: Implement user listing logic
   - apps\api-server\src\app\api\features\ai-labs\route.ts (2 occurrences)
     Line 40: // TODO: Implement AI Labs logic
   - packages\auth\src\middleware\auth.middleware.ts (1 occurrence)
     Line 71: // TODO: Implement refresh token extraction from cookies
   - tmp\run-auth-audit.js (4 occurrences)
     Line 52: 'TODO': { severity: 'info', description: 'TODO comment' },

⚠️ Pattern: "FALLBACK_API_BASE"
   Description: Deprecated fallback URL (remove after gateway enforcement)
   Severity: WARNING
   Files: 21
   - apps\realtutorialhub-web\src\app\api\auth\forgot-password\route.ts (2 occurrences)     
     Line 7: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\login\route.ts (2 occurrences)
     Line 7: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\logout\route.ts (2 occurrences)
     Line 8: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\placement-handoff\route.ts (2 occurrences)   
     Line 14: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\refresh\route.ts (2 occurrences)
     Line 7: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   ... and 16 more files

ℹ️ Pattern: "extractAuthFromRequest"
   Description: Auth extraction utility (active)
   Severity: INFO
   Files: 3
   - apps\realtutorialhub-web\src\app\api\onboarding\route.ts (2 occurrences)
     Line 2: import { extractAuthFromRequest, createInternalHeaders } from '../../../../../../src/share-branding/
   - src\share-branding\auth\unifiedBffAuth.ts (2 occurrences)
     Line 29: export async function extractAuthFromRequest(req: NextRequest): Promise<BffAuthResult> {
   - tmp\run-auth-audit.js (1 occurrence)
     Line 51: 'extractAuthFromRequest': { severity: 'info', description: 'Auth extraction utility (active)' },

⚠️ Pattern: "FIXME"
   Description: FIXME comment
   Severity: WARNING
   Files: 1
   - tmp\run-auth-audit.js (4 occurrences)
     Line 53: 'FIXME': { severity: 'warning', description: 'FIXME comment' },

⚠️ Pattern: "HACK"
   Description: HACK comment
   Severity: WARNING
   Files: 1
   - tmp\run-auth-audit.js (1 occurrence)
     Line 54: 'HACK': { severity: 'warning', description: 'HACK comment' },

⚠️ Pattern: "@deprecated"
   Description: Deprecated code
   Severity: WARNING
   Files: 1
   - tmp\run-auth-audit.js (1 occurrence)
     Line 55: '@deprecated': { severity: 'warning', description: 'Deprecated code' },       

================================================================================
📋 SECURITY RISKS
================================================================================

ℹ️ Pattern: "Authorization"
   Description: Authorization header usage
   Severity: INFO
   Files: 20
   - apps\api-server\src\app\api\admin\questions\bulk\route.ts (1 occurrence)
     Line 76: 'Authorization': `Bearer ${process.env.QSTASH_TOKEN}`,
   - apps\api-server\src\app\api\cron\cleanup-reports\route.ts (1 occurrence)
     Line 15: const cronAuth = req.headers.get("Authorization") ?? "";
   - apps\api-server\src\app\api\cron\pdf-health\route.ts (1 occurrence)
     Line 17: const cronAuth = req.headers.get("Authorization") ?? "";
   - apps\api-server\src\lib\cache-headers.ts (1 occurrence)
     Line 20: headers.set('Vary', 'Authorization, Cookie');
   - apps\api-server\src\modules\auth\cors.middleware.ts (1 occurrence)
     Line 5: 'Authorization',
   ... and 15 more files

⚠️ Pattern: "dangerouslySetInnerHTML"
   Description: XSS risk
   Severity: WARNING
   Files: 8
   - docs\completeproject\TutorialSubtopicPage.jsx (1 occurrence)
     Line 186: <span dangerouslySetInnerHTML={{
   - packages\ui\src\components\ui\chart.tsx (1 occurrence)
     Line 83: dangerouslySetInnerHTML={{
   - packages\ui\src\SafeHtml.tsx (1 occurrence)
     Line 40: dangerouslySetInnerHTML={{ __html: clean as unknown as string }}
   - src\share-branding\ExamEngine\components\ui\chart.tsx (1 occurrence)
     Line 83: dangerouslySetInnerHTML={{
   - src\share-branding\PostLandingPage\app\components\ui\chart.tsx (1 occurrence)
     Line 83: dangerouslySetInnerHTML={{
   ... and 3 more files

🔴 Pattern: "eval("
   Description: Code injection risk
   Severity: CRITICAL
   Files: 1
   - tmp\run-auth-audit.js (1 occurrence)
     Line 60: 'eval(': { severity: 'critical', description: 'Code injection risk' },        

⚠️ Pattern: "innerHTML"
   Description: XSS risk
   Severity: WARNING
   Files: 1
   - tmp\run-auth-audit.js (1 occurrence)
     Line 62: 'innerHTML': { severity: 'warning', description: 'XSS risk' },

⚠️ Pattern: ".html("
   Description: XSS risk (jQuery)
   Severity: WARNING
   Files: 1
   - tmp\run-auth-audit.js (1 occurrence)
     Line 63: '.html(': { severity: 'warning', description: 'XSS risk (jQuery)' },

================================================================================
📋 CODE DUPLICATION
================================================================================

✅ Pattern: "proxyAuthRequest"
   Description: Shared BFF proxy (good)
   Severity: GOOD
   Files: 20
   - apps\realtutorialhub-web\src\app\api\auth\forgot-password\route.ts (2 occurrences)     
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\login\route.ts (2 occurrences)
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\logout\route.ts (2 occurrences)
     Line 4: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\refresh\route.ts (2 occurrences)
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\reset-password\route.ts (3 occurrences)      
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   ... and 15 more files

✅ Pattern: "authBffRoute"
   Description: Shared auth route logic (good)
   Severity: GOOD
   Files: 21
   - apps\realtutorialhub-web\src\app\api\auth\forgot-password\route.ts (1 occurrence)      
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\login\route.ts (1 occurrence)
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\logout\route.ts (1 occurrence)
     Line 4: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\placement-handoff\route.ts (1 occurrence)    
     Line 10: } from '../../../../../../../src/share-branding/auth/authBffRoute';
   - apps\realtutorialhub-web\src\app\api\auth\refresh\route.ts (1 occurrence)
     Line 3: import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';
   ... and 16 more files

⚠️ Pattern: "const FALLBACK_API_BASE"
   Description: Duplicated fallback URL
   Severity: WARNING
   Files: 21
   - apps\realtutorialhub-web\src\app\api\auth\forgot-password\route.ts (1 occurrence)      
     Line 7: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\login\route.ts (1 occurrence)
     Line 7: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\logout\route.ts (1 occurrence)
     Line 8: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\placement-handoff\route.ts (1 occurrence)    
     Line 14: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   - apps\realtutorialhub-web\src\app\api\auth\refresh\route.ts (1 occurrence)
     Line 7: const FALLBACK_API_BASE = 'https://api.realtutorialhub.com/api';
   ... and 16 more files

================================================================================
📊 AUDIT SUMMARY
================================================================================

📁 Files:
   Total files found: 3678
   Scanned files: 1954

   Total files found: 3678
   Scanned files: 1954

   Scanned files: 1954

🎯 Findings by Severity:
   🔴 Critical: 38
   ⚠️  Warning: 59
   ℹ️  Info: 256
   ✅ Good: 66

   Total findings: 419

================================================================================
🔐 SECURITY SCORE
================================================================================

🔴 Score: 0/100 - NEEDS IMPROVEMENT
🔐 SECURITY SCORE
================================================================================

🔴 Score: 0/100 - NEEDS IMPROVEMENT

🔴 CRITICAL: 38 critical security issue(s) found!
🔴 Score: 0/100 - NEEDS IMPROVEMENT

🔴 CRITICAL: 38 critical security issue(s) found!

🔴 CRITICAL: 38 critical security issue(s) found!
⚠️  WARNING: 59 warning(s) found

================================================================================
💡 RECOMMENDATIONS
================================================================================
💡 RECOMMENDATIONS
================================================================================
================================================================================

1. 🔴 CRITICAL: Fix critical security issues immediately (localStorage, eval, etc.)

2. ⚠️ HIGH: Remove 21 FALLBACK_API_BASE references (deprecated)

3. 🔴 CRITICAL: Remove 21 localStorage token storage (XSS risk)

4. ⚠️ MEDIUM: Review 2 httpOnly: false cookie configurations

5. ℹ️ LOW: Address 5 TODO/FIXME comments

================================================================================
⏱️  Scan completed in 0.52s
================================================================================


*/