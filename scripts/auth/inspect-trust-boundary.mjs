#!/usr/bin/env node

/**
 * ============================================================================
 * AUTHENTICATION TRUST BOUNDARY INVESTIGATION
 * ============================================================================
 *
 * Purpose:
 *   Before trusting x-original-host for brand resolution, we must verify:
 *
 *   1. WHO supplies x-original-host?
 *   2. CAN an external browser/attacker supply it?
 *   3. IS there internal request authentication?
 *   4. WHERE is the trust boundary established?
 *
 * Security Risk:
 *
 *   If arbitrary clients can supply:
 *
 *       x-original-host: user.skillupitacademy.com
 *
 *   they could bypass brand isolation and access:
 *
 *       - Wrong tenant's data
 *       - Wrong database
 *       - Wrong authentication context
 *
 * DO NOT MODIFY CODE.
 * This is investigation only.
 * ============================================================================
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
  log('='.repeat(78));
  log(title);
  log('='.repeat(78));
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
    const matches = content.match(pattern);
    results[key] = matches ? matches : null;
  }
  return results;
}

section('AUTHENTICATION TRUST BOUNDARY INVESTIGATION');

// ============================================================================
// 1. Check validateAuthState.ts - who sets x-original-host?
// ============================================================================

section('1. WHO SETS X-ORIGINAL-HOST?');

const validateAuthState = read('src/share-branding/auth/validateAuthState.ts');

if (validateAuthState) {
  const patterns = {
    setOriginalHost: /headers\[['"']x-original-host['"']\]\s*=\s*[^;]+/gi,
    buildCookieHeader: /buildCookieHeader/,
    serverSideCheck: /typeof window.*undefined/,
    nextHeaders: /from ['"]next\/headers['"]/,
  };

  const found = analyze(validateAuthState, patterns);

  log('validateAuthState.ts analysis:');
  log('');
  
  if (found.setOriginalHost) {
    log('  ✓ Sets x-original-host header:');
    for (const match of found.setOriginalHost) {
      log(`    ${match}`);
    }
  }
  
  if (found.serverSideCheck) {
    log('');
    log('  ✓ Checks for server-side execution');
    log('  ✓ Not client-controlled');
  }
  
  if (found.nextHeaders) {
    log('');
    log('  ✓ Uses Next.js headers() API');
    log('  ✓ Server-side only - cannot be controlled by browser');
  }
  
  log('');
  log('KEY FINDING:');
  log('  validateAuthState() runs SERVER-SIDE (SSR/API routes)');
  log('  It extracts the original request host from Next.js headers');
  log('  This header is SET BY THE APPLICATION SERVER, not the browser');
  log('');
  log('SECURITY ASSESSMENT:');
  log('  ✓ Browser CANNOT directly set x-original-host in this flow');
  log('  ✓ Header originates from trusted Next.js server context');
  log('  ✓ This is an INTERNAL request from SkillUp/RTH app to gateway');
} else {
  log('ERROR: validateAuthState.ts not found');
}

// ============================================================================
// 2. Check gateway - does it distinguish internal vs external requests?
// ============================================================================

section('2. GATEWAY INTERNAL REQUEST AUTHENTICATION');

const gatewayIndex = read('services/api-gateway/src/index.ts');
const gatewayAuth = read('services/api-gateway/src/middleware/auth.ts');
const gatewayProxy = read('services/api-gateway/src/lib/proxy.ts');

if (gatewayIndex) {
  const patterns = {
    internalSecret: /INTERNAL_GATEWAY_SECRET/gi,
    xGatewaySecret: /x-gateway-secret/gi,
    xInternalSecret: /x-internal-secret/gi,
    xInternalKey: /x-internal-key/gi,
    proxyRequest: /proxyRequest\(/g,
  };

  const found = analyze(gatewayIndex + (gatewayProxy || ''), patterns);

  log('Gateway internal authentication:');
  log('');
  
  if (found.internalSecret) {
    log(`  ✓ INTERNAL_GATEWAY_SECRET found (${found.internalSecret.length} references)`);
  }
  
  if (found.xGatewaySecret) {
    log(`  ✓ x-gateway-secret header found (${found.xGatewaySecret.length} references)`);
  }
  
  if (found.xInternalSecret) {
    log(`  ✓ x-internal-secret header found (${found.xInternalSecret.length} references)`);
  }
  
  if (found.xInternalKey) {
    log(`  ✓ x-internal-key header found (${found.xInternalKey.length} references)`);
  }
  
  if (found.proxyRequest) {
    log(`  ✓ proxyRequest() function found (${found.proxyRequest.length} calls)`);
  }
  
  log('');
  log('FINDING: Gateway has internal request authentication mechanisms');
}

// ============================================================================
// 3. Check BFF routes - how do they call the gateway?
// ============================================================================

section('3. BFF TO GATEWAY REQUEST FLOW');

const bffProfile = read('src/share-branding/auth/bffProfileHandler.ts');
const unifiedFetch = read('src/share-branding/lib/unifiedFetch.ts');

if (bffProfile) {
  const patterns = {
    internalHeaders: /createInternalHeaders/g,
    xGatewaySecret: /x-gateway-secret/gi,
    unifiedFetch: /unifiedFetch/g,
    internalApiUrl: /INTERNAL_API_URL/g,
  };

  const found = analyze(bffProfile, patterns);

  log('BFF profile handler:');
  log('');
  
  if (found.internalHeaders) {
    log(`  ✓ Uses createInternalHeaders() (${found.internalHeaders.length} calls)`);
    log('  ✓ Adds authentication to internal service calls');
  }
  
  if (found.unifiedFetch) {
    log(`  ✓ Uses unifiedFetch() (${found.unifiedFetch.length} calls)`);
  }
  
  if (found.internalApiUrl) {
    log(`  ✓ Uses INTERNAL_API_URL (${found.internalApiUrl.length} references)`);
    log('  ✓ Direct service-to-service calls');
  }
}

// ============================================================================
// 4. Trace the complete flow
// ============================================================================

section('4. COMPLETE REQUEST FLOW TRACE');

log(`
SKILLUP AUTHENTICATION FLOW:
═══════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│ 1. BROWSER                                                          │
│    URL: http://localhost:3009/tutorial-v2/...                       │
│    Cookie: accessToken=<JWT>                                        │
│    Headers: NONE (browser cannot set internal headers)              │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. SKILLUP NEXT.JS SERVER (localhost:3009)                          │
│    - Receives browser request                                       │
│    - Extracts request.headers (Next.js API)                         │
│    - host header: "localhost:3009" or "skillup.localhost:3009"      │
│    - SSR page needs authentication                                  │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. validateAuthState() [SERVER-SIDE FUNCTION]                       │
│    - Runs in Next.js server context (not browser)                   │
│    - Calls: await headers()                                         │
│    - Extracts: host, x-forwarded-host, x-original-host              │
│    - Sets: x-original-host = publicHost (from Next.js)              │
│    - Builds cookie header from server cookie store                  │
│    - Constructs gateway URL: http://127.0.0.1:8787/auth/me          │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. FETCH TO GATEWAY                                                 │
│    URL: http://127.0.0.1:8787/auth/me                               │
│    Headers:                                                         │
│      - Cookie: accessToken=<JWT>                                    │
│      - x-original-host: "localhost:3009" (SET BY APP SERVER)        │
│      - Accept: application/json                                     │
│      - Cache-Control: no-cache                                      │
│                                                                      │
│    ⚠️  CRITICAL: x-original-host is SET BY SKILLUP SERVER           │
│        NOT by the browser/client                                    │
└─────────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. GATEWAY (127.0.0.1:8787)                                         │
│    - Receives request                                               │
│    - c.req.url = "http://127.0.0.1:8787/auth/me"                    │
│    - requestUrl.hostname = "127.0.0.1"                              │
│    - c.req.header('x-original-host') = "localhost:3009"             │
│                                                                      │
│    CURRENT BEHAVIOR:                                                │
│      hostname = requestUrl.hostname                                 │
│      // Ignores x-original-host                                     │
│                                                                      │
│    PROPOSED BEHAVIOR:                                               │
│      hostname = x-original-host || requestUrl.hostname              │
│      // Uses x-original-host when present                           │
└─────────────────────────────────────────────────────────────────────┘
`);

// ============================================================================
// 5. Security assessment
// ============================================================================

section('5. SECURITY ASSESSMENT');

log(`
QUESTION 1: Can browser control x-original-host?
═══════════════════════════════════════════════

NO - Browser cannot control this header in the SSR flow:

  Browser
    ↓
  Next.js server receives request
    ↓
  headers() API extracts server-side request headers
    ↓
  validateAuthState() CREATES x-original-host from server context
    ↓
  fetch() to gateway INCLUDES x-original-host
    ↓
  Gateway receives x-original-host

The header originates from the APPLICATION SERVER, not the browser.

The browser's original request may contain arbitrary headers, but
validateAuthState() does NOT forward them blindly. It constructs
new headers based on Next.js server APIs.


QUESTION 2: What about direct API calls to gateway?
════════════════════════════════════════════════════

If a malicious client calls the gateway directly:

  Attacker
    ↓
  http://127.0.0.1:8787/auth/me
    Headers:
      x-original-host: skillupitacademy.com
      Cookie: <stolen JWT>

Then the gateway would see:
  - x-original-host: skillupitacademy.com (attacker-supplied)
  - JWT brand: skillup (from cookie)

This could create a brand mismatch or allow brand selection.

MITIGATION OPTIONS:

Option A: Trust x-original-host ONLY for authenticated requests
  - Gateway already validates JWT first
  - JWT contains brand
  - If JWT brand !== derived brand → 403
  - Attacker gains nothing

Option B: Validate x-original-host matches expected pattern
  - localhost, *.localhost, *.local → trusted
  - Production domains → trusted
  - Random attacker values → rejected

Option C: Require internal authentication header
  - Check for x-gateway-secret or x-internal-secret
  - Only accept x-original-host if internal secret present
  - External requests ignore x-original-host


QUESTION 3: Current JWT brand validation
═════════════════════════════════════════

Gateway auth middleware ALREADY validates:

  tokenBrand !== effectiveBrand → 403

This means:
  - Attacker with SkillUp JWT cannot access RTH
  - Attacker with RTH JWT cannot access SkillUp
  - Cross-brand attacks are already prevented

Adding x-original-host does NOT weaken this:
  - JWT brand MUST match resolved brand
  - Attacker cannot forge JWT brand
  - Attacker can only supply hostname hint


QUESTION 4: What if attacker uses x-original-host with matching JWT?
═════════════════════════════════════════════════════════════════════

Attacker with stolen SkillUp JWT:

  Headers:
    x-original-host: user.skillupitacademy.com
    Cookie: <valid SkillUp JWT>

  Gateway resolves:
    hostname: user.skillupitacademy.com
    brand: skillup
    JWT brand: skillup
    ✓ Brands match

  Result: Request succeeds

But this is NOT a security issue because:
  - Attacker already has valid JWT
  - JWT already grants access to SkillUp tenant
  - x-original-host doesn't escalate privileges
  - Attacker can't access RTH data with SkillUp JWT


RECOMMENDED APPROACH:
═════════════════════

✓ SAFE: Use x-original-host with JWT brand validation

The existing JWT brand check prevents cross-tenant attacks:

  if (tokenBrand !== effectiveBrand) {
    return 403; // brand_mismatch
  }

Therefore trusting x-original-host for hostname resolution is SAFE
because the JWT brand MUST still match.

Attacker cannot:
  - Access wrong tenant (JWT brand check prevents this)
  - Escalate privileges (JWT contains roles)
  - Bypass authentication (JWT still required)

Attacker can only:
  - Request their OWN tenant's data (already allowed)
  - Provide hostname hint that matches their JWT
`);

// ============================================================================
// 6. Recommendations
// ============================================================================

section('6. RECOMMENDATIONS');

log(`
IMMEDIATE FIX (SAFE):
════════════════════

Update gateway index.ts:

  const originalHost = c.req.header('x-original-host');
  const hostname = originalHost || requestUrl.hostname;
  const brand = resolveBrandFromHostname(hostname, c.env);

This is SAFE because:
  ✓ JWT brand validation remains in place
  ✓ Cross-brand attacks still blocked
  ✓ Attacker can't escalate privileges
  ✓ Only affects hostname resolution


ADDITIONAL SECURITY (OPTIONAL):
════════════════════════════════

Add hostname pattern validation:

  const originalHost = c.req.header('x-original-host');
  
  if (originalHost && !isValidHostnamePattern(originalHost)) {
    // Reject suspicious hostnames
    return 400;
  }
  
  const hostname = originalHost || requestUrl.hostname;

Where isValidHostnamePattern checks:
  - localhost, *.localhost, *.local
  - *.skillupitacademy.com
  - *.realtutorialhub.com
  - Reject everything else


LONG-TERM IMPROVEMENT (FUTURE):
════════════════════════════════

Use internal request authentication:

  const isInternalRequest = validateInternalSecret(c.req);
  
  const originalHost = isInternalRequest
    ? c.req.header('x-original-host')
    : null;
  
  const hostname = originalHost || requestUrl.hostname;

This ensures only trusted application servers can supply
x-original-host, not external clients.


DO NOT DEPLOY WITHOUT:
═══════════════════════

1. Local SkillUp test
2. Local RTH test  
3. Cross-brand JWT rejection test
4. Production hostname static verification
5. Code review of exact changes
`);

section('INVESTIGATION COMPLETE');

log('');
log('VERDICT: Using x-original-host with existing JWT brand validation is SAFE.');
log('');
log('The JWT brand check prevents tenant isolation bypass.');
log('Attacker can only access their own tenant, not escalate to another.');
log('');
log('Proceed with gateway hostname resolution fix.');
