#!/usr/bin/env node

/**
 * Test middleware logic to understand why /api/auth/me is being blocked
 */

function testMiddlewareLogic(pathname) {
  console.log(`\nTesting pathname: ${pathname}`);
  
  const isAuthRoute = pathname.startsWith('/api/auth') || 
                      pathname.startsWith('/api/admin/auth');
  
  const isSecurityReport = pathname.toLowerCase().includes('security/report');
  const isClientLogsRoute = pathname === '/api/logs/client';
  const isWorkflowRoute = pathname.startsWith('/api/workflows') || 
                          pathname.startsWith('/api/api/workflows') || 
                          pathname.startsWith('/api/export/workflow') || 
                          pathname.startsWith('/api/api/export/workflow');
  const isHealthRoute =
    pathname === '/api/health' ||
    pathname === '/api/health/live' ||
    pathname === '/api/health/ready';
  const isSearchRoute = pathname === '/api/search';
  const isTelemetryRoute = pathname === '/api/telemetry';
  const isGatewayExemptRoute =
    isHealthRoute ||
    isWorkflowRoute ||
    isAuthRoute ||
    isSearchRoute ||
    isTelemetryRoute ||
    isSecurityReport ||
    isClientLogsRoute;

  console.log(`  isAuthRoute: ${isAuthRoute}`);
  console.log(`  isGatewayExemptRoute: ${isGatewayExemptRoute}`);
  
  const shouldRunMiddleware = !isAuthRoute && !isGatewayExemptRoute;
  console.log(`  shouldRunMiddleware: ${shouldRunMiddleware}`);
  
  return shouldRunMiddleware;
}

// Test the paths
const testPaths = [
  '/api/auth/me',
  '/api/auth/login',
  '/api/admin/auth/me',
  '/api/dashboard',
  '/api/health'
];

console.log('🔍 MIDDLEWARE LOGIC TEST');
console.log('Testing which paths trigger authentication middleware...\n');

testPaths.forEach(path => {
  const shouldRun = testMiddlewareLogic(path);
  console.log(`  Result: ${shouldRun ? '🔒 MIDDLEWARE RUNS' : '✅ MIDDLEWARE SKIPPED'}`);
});