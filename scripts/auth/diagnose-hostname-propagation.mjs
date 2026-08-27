#!/usr/bin/env node

/**
 * ============================================================
 * HOSTNAME PROPAGATION DIAGNOSTIC
 * ============================================================
 *
 * Purpose:
 *   Understand how browser hostname reaches the gateway
 *   before implementing multi-brand fix.
 *
 * This script:
 *   - Reads current gateway/auth code
 *   - Traces hostname propagation path
 *   - Identifies where hostname transformation occurs
 *   - Determines if skillup.localhost would work
 *   - Reports findings without modifying anything
 *
 * DO NOT MODIFY CODE.
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '../..');

function log(message = '') {
  console.log(message);
}

function section(title) {
  log('');
  log('='.repeat(72));
  log(title);
  log('='.repeat(72));
}

function read(file) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function analyze(content, patterns) {
  const results = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = content.match(pattern);
    results[key] = match ? match[0] : null;
  }
  return results;
}

section('HOSTNAME PROPAGATION DIAGNOSTIC');

log(`
This diagnostic traces hostname flow from browser to gateway.

Expected flow:
  Browser: skillup.localhost:3009
      ↓
  SkillUp Next.js app
      ↓
  validateAuthState() or page auth
      ↓
  Gateway URL: 127.0.0.1:8787
      ↓
  Gateway receives request
      ↓
  requestUrl.hostname = ?
`);

// ============================================================
// 1. Check validateAuthState hostname handling
// ============================================================

section('1. VALIDATEAUTHSTATE HOSTNAME HANDLING');

const validateAuthState = read('src/share-branding/auth/validateAuthState.ts');

if (validateAuthState) {
  const patterns = {
    publicHost: /getPublicHostFromHeaders[\s\S]{0,500}/,
    xOriginalHost: /x-original-host/gi,
    xForwardedHost: /x-forwarded-host/gi,
    host: /headers\.get\(['"]host['"]\)/gi,
    gatewayUrl: /gatewayUrl.*\?.*:/,
  };

  const found = analyze(validateAuthState, patterns);

  log('validateAuthState.ts analysis:');
  log('');
  log(`  Reads public host: ${found.publicHost ? 'YES' : 'NO'}`);
  log(`  Uses x-original-host: ${found.xOriginalHost ? 'YES' : 'NO'}`);
  log(`  Uses x-forwarded-host: ${found.xForwardedHost ? 'YES' : 'NO'}`);
  log(`  Uses host header: ${found.host ? 'YES' : 'NO'}`);
  
  if (validateAuthState.includes('getPublicHostFromHeaders')) {
    log('');
    log('  ✓ validateAuthState extracts original hostname');
    log('  ✓ Should preserve skillup.localhost from browser');
  }
  
  if (validateAuthState.includes('x-original-host')) {
    log('  ✓ Sends x-original-host to gateway');
  }
} else {
  log('ERROR: validateAuthState.ts not found');
}

// ============================================================
// 2. Check gateway hostname extraction
// ============================================================

section('2. GATEWAY HOSTNAME EXTRACTION');

const gatewayIndex = read('services/api-gateway/src/index.ts');

if (gatewayIndex) {
  const patterns = {
    requestUrl: /const requestUrl = new URL\(c\.req\.url\)/,
    hostname: /requestUrl\.hostname/g,
    xOriginalHost: /x-original-host/gi,
    xForwardedHost: /x-forwarded-host/gi,
  };

  const found = analyze(gatewayIndex, patterns);
  
  log('Gateway index.ts analysis:');
  log('');
  log(`  Creates URL from c.req.url: ${found.requestUrl ? 'YES' : 'NO'}`);
  log(`  Uses requestUrl.hostname: ${found.hostname ? 'YES' : 'NO'}`);
  log(`  Checks x-original-host: ${found.xOriginalHost ? 'YES' : 'NO'}`);
  
  if (found.requestUrl && found.hostname) {
    log('');
    log('  Gateway extracts hostname from request URL');
    log('  Question: Does c.req.url contain the BROWSER hostname');
    log('           or the GATEWAY hostname (127.0.0.1:8787)?');
  }
} else {
  log('ERROR: Gateway index.ts not found');
}

// ============================================================
// 3. Check gateway auth middleware
// ============================================================

section('3. GATEWAY AUTH MIDDLEWARE');

const gatewayAuth = read('services/api-gateway/src/middleware/auth.ts');

if (gatewayAuth) {
  const patterns = {
    resolveBrand: /export function resolveBrandFromHostname[\s\S]{0,1000}/,
    hostnameIncludes: /hostname\.includes\(['"]skillup['"]\)/,
    envBrand: /env\.BRAND/g,
    requestBrand: /detectRequestBrand/,
    xBrand: /x-brand/gi,
  };

  const found = analyze(gatewayAuth, patterns);
  
  log('Gateway auth.ts analysis:');
  log('');
  log(`  resolveBrandFromHostname exists: ${found.resolveBrand ? 'YES' : 'NO'}`);
  log(`  Uses hostname.includes('skillup'): ${found.hostnameIncludes ? 'YES' : 'NO'}`);
  log(`  Checks env.BRAND: ${found.envBrand ? 'YES' : 'NO'}`);
  log(`  Uses detectRequestBrand: ${found.requestBrand ? 'YES' : 'NO'}`);
  log(`  Uses x-brand header: ${found.xBrand ? 'YES' : 'NO'}`);
  
  if (found.hostnameIncludes) {
    log('');
    log('  Current logic: hostname.includes("skillup")');
    log('  ✓ "skillup.localhost" would match');
    log('  ✓ "127.0.0.1" would NOT match → defaults to realtutorialhub');
  }
  
  if (found.requestBrand) {
    log('');
    log('  detectRequestBrand checks:');
    log('    - x-brand header (from client?)');
    log('    - x-platform header');
    log('  Question: Can client control these headers?');
  }
} else {
  log('ERROR: Gateway auth.ts not found');
}

// ============================================================
// 4. Check current .dev.vars
// ============================================================

section('4. CURRENT .dev.vars CONFIGURATION');

const devVars = read('services/api-gateway/.dev.vars');

if (devVars) {
  const hasBrand = /^BRAND\s*=\s*(\w+)/m.exec(devVars);
  const hasGatewayUrl = /GATEWAY_URL/.test(devVars);
  
  log('Gateway .dev.vars analysis:');
  log('');
  log(`  BRAND variable: ${hasBrand ? hasBrand[1] : 'NOT SET'}`);
  log(`  Contains GATEWAY_URL refs: ${hasGatewayUrl ? 'YES' : 'NO'}`);
  
  if (!hasBrand) {
    log('');
    log('  ⚠️  No BRAND override in .dev.vars');
    log('  ⚠️  Gateway will use hostname-based resolution');
  }
} else {
  log('ERROR: .dev.vars not found');
}

// ============================================================
// 5. Check SkillUp environment
// ============================================================

section('5. SKILLUP WEB ENVIRONMENT');

const skillupEnv = read('apps/skillup-web/.env.local');

if (skillupEnv) {
  const gatewayUrl = /GATEWAY_URL\s*=\s*"([^"]+)"/m.exec(skillupEnv);
  const brand = /NEXT_PUBLIC_BRAND\s*=\s*(\w+)/m.exec(skillupEnv);
  
  log('SkillUp .env.local analysis:');
  log('');
  log(`  GATEWAY_URL: ${gatewayUrl ? gatewayUrl[1] : 'NOT SET'}`);
  log(`  NEXT_PUBLIC_BRAND: ${brand ? brand[1] : 'NOT SET'}`);
  
  if (gatewayUrl && gatewayUrl[1].includes('127.0.0.1')) {
    log('');
    log('  SkillUp calls: ' + gatewayUrl[1]);
    log('  Gateway receives hostname: 127.0.0.1 (NOT skillup.localhost)');
    log('');
    log('  🔴 THIS IS THE PROBLEM:');
    log('     Browser uses: skillup.localhost:3009');
    log('     Gateway sees: 127.0.0.1:8787');
    log('     Brand resolution fails!');
  }
} else {
  log('WARNING: SkillUp .env.local not found');
}

// ============================================================
// 6. Trace request flow
// ============================================================

section('6. COMPLETE REQUEST FLOW ANALYSIS');

log(`
Current flow:
┌────────────────────────────────────────────────────────────────┐
│ 1. Browser                                                     │
│    URL: http://localhost:3009/tutorial-v2/...                  │
│    (or http://skillup.localhost:3009/tutorial-v2/...)          │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 2. SkillUp Next.js (localhost:3009)                            │
│    - Receives request                                          │
│    - Creates JWT with brand: "skillup"                         │
│    - validateAuthState() or page auth needs session            │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 3. validateAuthState() or BFF route                            │
│    - Reads GATEWAY_URL = "http://127.0.0.1:8787"               │
│    - Calls: http://127.0.0.1:8787/auth/me                      │
│    - May include x-original-host header                        │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 4. Gateway (127.0.0.1:8787)                                    │
│    - Receives request                                          │
│    - c.req.url = "http://127.0.0.1:8787/auth/me"               │
│    - requestUrl.hostname = "127.0.0.1"                         │
│    - resolveBrandFromHostname("127.0.0.1")                     │
│      → "127.0.0.1".includes("skillup")? NO                     │
│      → Returns: "realtutorialhub" (default)                    │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│ 5. Gateway auth middleware                                     │
│    - JWT brand: "skillup"                                      │
│    - Gateway brand: "realtutorialhub"                          │
│    - "skillup" !== "realtutorialhub"                           │
│    - Returns: 403 brand_mismatch                               │
└────────────────────────────────────────────────────────────────┘
`);

// ============================================================
// 7. Solution options
// ============================================================

section('7. SOLUTION OPTIONS');

log(`
Option A: Change GATEWAY_URL to use hostname
──────────────────────────────────────────────
  GATEWAY_URL="http://skillup.localhost:8787"
  
  Pros:
    ✓ Gateway receives skillup.localhost hostname
    ✓ hostname.includes("skillup") works
    ✓ Minimal code changes
  
  Cons:
    ✗ Requires matching hostname in browser AND gateway URL
    ✗ More configuration maintenance
    
Option B: Use x-original-host propagation
──────────────────────────────────────────
  Gateway checks x-original-host header first
  
  Pros:
    ✓ Browser hostname preserved
    ✓ Works with 127.0.0.1:8787 gateway
  
  Cons:
    ✗ Requires updating gateway hostname resolution
    ✗ Security: must validate x-original-host source
    
Option C: Restore temporary BRAND=skillup
──────────────────────────────────────────
  Add back BRAND=skillup to .dev.vars
  
  Pros:
    ✓ Immediate fix
    ✓ No code changes
  
  Cons:
    ✗ Single-brand only (breaks RTH localhost)
    ✗ Not a proper multi-brand solution
    
Option D: Use localhost:PORT mapping
─────────────────────────────────────
  Gateway checks requestUrl.port and maps to brand
  
  Pros:
    ✓ Works with 127.0.0.1
    ✓ Port-based tenant resolution
  
  Cons:
    ✗ Port in gateway URL is 8787 (not 3009)
    ✗ Cannot distinguish origin port
    
⭐ RECOMMENDED: Option A + Option B
────────────────────────────────────
  1. Use skillup.localhost for browser URL
  2. Use skillup.localhost in GATEWAY_URL (or hostname matching)
  3. Update resolveBrandFromHostname() for explicit mapping
  4. Add x-original-host fallback for flexibility
`);

// ============================================================
// 8. Next steps
// ============================================================

section('8. RECOMMENDED NEXT STEPS');

log(`
1. IMMEDIATE TEST (proves diagnosis):
   ═══════════════════════════════════
   
   Temporarily restore BRAND=skillup to .dev.vars:
   
   cd services/api-gateway
   echo "BRAND=skillup" >> .dev.vars
   
   Restart gateway and test login.
   This proves the hostname resolution is the issue.

2. PERMANENT FIX (multi-brand support):
   ════════════════════════════════════
   
   Update gateway hostname resolution:
   
   services/api-gateway/src/middleware/auth.ts:
     - Add explicit skillup.localhost → "skillup"
     - Add explicit rth.localhost → "realtutorialhub"
     - Keep production mappings unchanged
     - Reject ambiguous localhost/127.0.0.1
   
   Update local URLs in browser:
     - SkillUp: http://skillup.localhost:3009
     - RTH: http://rth.localhost:3003

3. VALIDATION:
   ═════════════
   
   Test both brands simultaneously:
     ✓ SkillUp login + dashboard
     ✓ RTH login + dashboard
     ✓ Cross-brand JWT rejection
     ✓ Production hostname mappings unchanged

DO NOT:
  ✗ Modify Tutorial V2 code
  ✗ Restore /api/auth/me
  ✗ Change validateAuthState.ts (unless needed)
  ✗ Change production routing
  ✗ Deploy before testing locally
`);

section('DIAGNOSTIC COMPLETE');

log('No files were modified.');
log('Review analysis above before implementing fix.');
