#!/usr/bin/env node

/**
 * 🔍 RBAC IMPLEMENTATION VALIDATOR
 * 
 * Quick static analysis to catch obvious RBAC implementation issues
 */

console.log('🔍 RBAC IMPLEMENTATION VALIDATOR');
console.log('=================================');

const fs = require('fs');

console.log('\n📋 Checking RBAC implementation...');

try {
  // Check profile route implementation
  const profileRoute = fs.readFileSync('apps/api-server/src/app/api/auth/profile/route.ts', 'utf8');
  
  console.log('\n🔍 PROFILE ROUTE ANALYSIS:');
  
  // Critical checks
  const checks = [
    {
      pattern: /getRBACRoles\(auth\.roles\)/,
      name: '✅ Secure role normalization (no fallback)',
      critical: true
    },
    {
      pattern: /RBACService\.requirePermission\(rbacUser\.roles, PERMISSIONS\.PROFILE_READ\)/,
      name: '✅ Profile READ permission check',
      critical: true
    },
    {
      pattern: /RBACService\.requirePermission\(rbacUser\.roles, PERMISSIONS\.PROFILE_WRITE\)/,
      name: '✅ Profile WRITE permission check',
      critical: true
    },
    {
      pattern: /STEP_1C_TEST/,
      name: '✅ Debug logging present',
      critical: false
    },
    {
      pattern: /result: 'GRANTED'/,
      name: '✅ GRANTED logging',
      critical: false
    },
    {
      pattern: /result: 'DENIED'/,
      name: '✅ DENIED logging',
      critical: false
    }
  ];
  
  let criticalIssues = 0;
  
  for (const check of checks) {
    if (check.pattern.test(profileRoute)) {
      console.log(`${check.name}`);
    } else {
      const status = check.critical ? '❌ CRITICAL' : '⚠️ WARNING';
      console.log(`${status}: ${check.name.replace('✅ ', '')} - NOT FOUND`);
      if (check.critical) criticalIssues++;
    }
  }
  
  // Check for potential security issues
  console.log('\n🚨 SECURITY ANALYSIS:');
  
  const securityChecks = [
    {
      pattern: /roles: \['student'\]/,
      name: '❌ CRITICAL: Hardcoded roles found',
      shouldNotExist: true
    },
    {
      pattern: /auth\.roles \|\| \[\]/,
      name: '⚠️ WARNING: Empty roles fallback (should be [\'user\'])',
      shouldNotExist: true
    },
    {
      pattern: /\/\/ 🔐 EXISTING AUTH: Keep existing auth check/,
      name: '✅ Existing auth preserved',
      shouldNotExist: false
    }
  ];
  
  for (const check of securityChecks) {
    const found = check.pattern.test(profileRoute);
    if (check.shouldNotExist && found) {
      console.log(`${check.name}`);
      criticalIssues++;
    } else if (!check.shouldNotExist && found) {
      console.log(`${check.name}`);
    } else if (!check.shouldNotExist && !found) {
      console.log(`⚠️ ${check.name.replace('✅ ', '')} - NOT FOUND`);
    }
  }
  
  // Check role normalization function
  console.log('\n🔧 ROLE NORMALIZATION ANALYSIS:');
  
  if (profileRoute.includes('const VALID_ROLES: Set<Role>')) {
    console.log('✅ Valid roles whitelist defined');
  } else {
    console.log('❌ CRITICAL: Valid roles whitelist missing');
    criticalIssues++;
  }
  
  if (profileRoute.includes('filter((role): role is Role => VALID_ROLES.has(role as Role))')) {
    console.log('✅ Role filtering implemented');
  } else {
    console.log('❌ CRITICAL: Role filtering missing');
    criticalIssues++;
  }
  
  // Check AuthContext
  console.log('\n🔍 AUTH CONTEXT ANALYSIS:');
  
  try {
    const authContext = fs.readFileSync('apps/api-server/src/lib/auth-context.ts', 'utf8');
    
    if (authContext.includes('roles?: string[]')) {
      console.log('✅ AuthContext has roles field');
    } else {
      console.log('❌ CRITICAL: AuthContext missing roles field');
      criticalIssues++;
    }
    
    if (authContext.includes('roles: payload.roles || []')) {
      console.log('✅ JWT roles extraction implemented');
    } else {
      console.log('❌ CRITICAL: JWT roles extraction missing');
      criticalIssues++;
    }
    
  } catch (error) {
    console.log('❌ CRITICAL: Cannot read auth-context.ts');
    criticalIssues++;
  }
  
  // Final assessment
  console.log('\n📊 IMPLEMENTATION ASSESSMENT:');
  console.log('============================');
  
  if (criticalIssues === 0) {
    console.log('✅ IMPLEMENTATION: LOOKS GOOD');
    console.log('✅ Ready for runtime testing');
  } else {
    console.log(`❌ IMPLEMENTATION: ${criticalIssues} CRITICAL ISSUES FOUND`);
    console.log('❌ Fix critical issues before runtime testing');
  }
  
  console.log('\n🎯 NEXT STEPS:');
  if (criticalIssues === 0) {
    console.log('1. Run: pnpm dev');
    console.log('2. Execute: node test-rbac-api-runtime.js');
    console.log('3. Follow the manual testing instructions');
    console.log('4. Report back with test results');
  } else {
    console.log('1. Fix the critical issues listed above');
    console.log('2. Re-run this validator');
    console.log('3. Only proceed to runtime testing when all critical issues are resolved');
  }
  
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}