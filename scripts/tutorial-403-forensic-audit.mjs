#!/usr/bin/env node

/**
 * ENTERPRISE TUTORIAL CONTENT 403 FORENSIC AUDIT SCRIPT
 * -----------------------------------------------------
 * Purpose:
 * Diagnose EXACT root cause of /api/tutorial/content/* 403 failures by testing:
 *
 * 1. BFF route
 * 2. Direct API route
 * 3. Gateway route
 * 4. Environment variable presence
 * 5. Internal secret headers
 * 6. Gateway secret headers
 * 7. Auth validity
 * 8. Failure source layer
 *
 * Usage:
 * node scripts/tutorial-403-forensic-audit.mjs
 *
 * Required ENV:
 * TEST_EMAIL=ajayshah@gmail.com
 * TEST_PASSWORD=testing
 * BFF_BASE_URL=https://user.realtutorialhub.com
 * API_BASE_URL=https://quiz-api-server-plldp3atca-as.a.run.app/api
 * GATEWAY_URL=https://api.realtutorialhub.com
 * INTERNAL_API_SECRET=a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da
 * INTERNAL_GATEWAY_SECRET=a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da
 * SUBTOPIC_SLUG=component-architecture
 */

import fetch from "node-fetch";

const CONFIG = {
  email: process.env.TEST_EMAIL || "ajayshah@gmail.com",
  password: process.env.TEST_PASSWORD || "testing",
  
  bffBaseUrl:
    process.env.BFF_BASE_URL ||
    "https://user.realtutorialhub.com",
  
  apiBaseUrl:
    process.env.API_BASE_URL ||
    "https://quiz-api-server-plldp3atca-as.a.run.app/api",
  
  gatewayUrl:
    process.env.GATEWAY_URL ||
    "https://api.realtutorialhub.com",
  
  internalApiSecret:
    process.env.INTERNAL_API_SECRET || 
    "a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da",
  
  internalGatewaySecret:
    process.env.INTERNAL_GATEWAY_SECRET || 
    "a1a1909780cad47dc79fc11faec0169d026d63ab544a5cf01d42b4fd1b0877da",
  
  subtopic:
    process.env.SUBTOPIC_SLUG ||
    "component-architecture",
};

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  console.log(`🔍 ${title}`);
  console.log("=".repeat(80));
}

function logResult(label, success, details = "") {
  console.log(
    `${success ? "✅" : "❌"} ${label}${details ? ` → ${details}` : ""}`
  );
}

function extractCookies(response) {
  const raw = response.headers.raw()["set-cookie"] || [];
  return raw.map(c => c.split(";")[0]).join("; ");
}

function extractAccessToken(cookies) {
  const match = cookies.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

async function login() {
  logSection("STEP 1: AUTHENTICATION TEST");
  
  const res = await fetch(`${CONFIG.bffBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: CONFIG.email,
      password: CONFIG.password,
    }),
  });
  
  const body = await res.text();
  const cookies = extractCookies(res);
  const accessToken = extractAccessToken(cookies);
  
  logResult(
    "Login endpoint",
    res.ok,
    `Status ${res.status}`
  );
  
  if (accessToken) {
    logResult("Access token extracted", true, `Length ${accessToken.length}`);
  } else {
    logResult("Access token extracted", false, "Not found in cookies");
  }
  
  if (!res.ok) {
    console.error("Login failed:", body);
    process.exit(1);
  }
  
  return { cookies, accessToken };
}

async function testRoute(name, url, options = {}) {
  try {
    const start = Date.now();
    
    const res = await fetch(url, options);
    
    const duration = Date.now() - start;
    
    const text = await res.text();
    
    return {
      name,
      url,
      status: res.status,
      ok: res.ok,
      duration,
      body: text.slice(0, 500),
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (err) {
    return {
      name,
      url,
      ok: false,
      error: err.message,
    };
  }
}

function printDetailedResult(result) {
  console.log(`\n📍 ${result.name}`);
  console.log(`URL: ${result.url}`);
  
  if (result.error) {
    console.log(`❌ ERROR: ${result.error}`);
    return;
  }
  
  console.log(`Status: ${result.status}`);
  console.log(`Time: ${result.duration}ms`);
  
  if (result.ok) {
    console.log("✅ SUCCESS");
  } else {
    console.log("❌ FAILED");
  }
  
  console.log(`Response: ${result.body}`);
  
  if (result.status === 403) {
    console.log("🚨 403 DETECTED - FORBIDDEN");
  } else if (result.status === 401) {
    console.log("🚨 401 DETECTED - UNAUTHORIZED");
  }
  
  // Check for specific error patterns
  if (result.body.includes("GATEWAY_URL not configured")) {
    console.log("🎯 DETECTED: BFF missing GATEWAY_URL configuration");
  }
  if (result.body.includes("INTERNAL_API_URL")) {
    console.log("🎯 DETECTED: BFF referencing INTERNAL_API_URL");
  }
  if (result.body.includes("Invalid gateway secret")) {
    console.log("🎯 DETECTED: Gateway secret mismatch");
  }
  if (result.body.includes("Invalid internal service secret")) {
    console.log("🎯 DETECTED: Internal service secret mismatch");
  }
}

async function testUserId(accessToken) {
  logSection("STEP 2: JWT TOKEN ANALYSIS");
  
  if (!accessToken) {
    logResult("JWT token available", false, "Cannot analyze");
    return null;
  }
  
  try {
    // Decode JWT (without verification, just to inspect claims)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      logResult("JWT format", false, "Invalid format");
      return null;
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    logResult("JWT decoded", true);
    console.log("JWT Claims:");
    console.log(`  - userId: ${payload.userId || 'MISSING'}`);
    console.log(`  - originalUserId: ${payload.originalUserId || 'MISSING'}`);
    console.log(`  - shadowUserId: ${payload.shadowUserId || 'MISSING'}`);
    console.log(`  - email: ${payload.email || 'MISSING'}`);
    console.log(`  - brand: ${payload.brand || 'MISSING'}`);
    console.log(`  - roles: ${JSON.stringify(payload.roles || [])}`);
    console.log(`  - audience: ${payload.aud || 'MISSING'}`);
    
    // Check for role issues
    if (!payload.roles || payload.roles.length === 0) {
      logResult("Roles present", false, "No roles in JWT");
    } else {
      logResult("Roles present", true, JSON.stringify(payload.roles));
    }
    
    return payload;
  } catch (err) {
    logResult("JWT decode", false, err.message);
    return null;
  }
}

async function main() {
  console.clear();
  
  logSection("ENVIRONMENT VALIDATION");
  
  logResult(
    "BFF_BASE_URL",
    !!CONFIG.bffBaseUrl,
    CONFIG.bffBaseUrl
  );
  
  logResult(
    "API_BASE_URL",
    !!CONFIG.apiBaseUrl,
    CONFIG.apiBaseUrl
  );
  
  logResult(
    "GATEWAY_URL",
    !!CONFIG.gatewayUrl,
    CONFIG.gatewayUrl
  );
  
  logResult(
    "INTERNAL_API_SECRET",
    !!CONFIG.internalApiSecret,
    `Length ${CONFIG.internalApiSecret.length}`
  );
  
  logResult(
    "INTERNAL_GATEWAY_SECRET",
    !!CONFIG.internalGatewaySecret,
    `Length ${CONFIG.internalGatewaySecret.length}`
  );
  
  logResult(
    "Secrets match",
    CONFIG.internalApiSecret === CONFIG.internalGatewaySecret,
    CONFIG.internalApiSecret === CONFIG.internalGatewaySecret ? "Same value" : "DIFFERENT VALUES"
  );
  
  const { cookies, accessToken } = await login();
  
  const jwtPayload = await testUserId(accessToken);
  
  logSection("STEP 3: BFF TUTORIAL ROUTE TEST");
  
  const bffResult = await testRoute(
    "BFF Tutorial Route",
    `${CONFIG.bffBaseUrl}/api/tutorial/content/${CONFIG.subtopic}`,
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  
  printDetailedResult(bffResult);
  
  logSection("STEP 4: DIRECT API TEST (Bypass BFF)");
  
  const directApiResult = await testRoute(
    "Direct API Route",
    `${CONFIG.apiBaseUrl}/tutorial/content/${CONFIG.subtopic}`,
    {
      headers: {
        Cookie: cookies,
        "X-Brand": "realtutorialhub",
        "X-User-ID": jwtPayload?.userId || "test-user",
        "X-Internal-Secret": CONFIG.internalApiSecret,
      },
    }
  );
  
  printDetailedResult(directApiResult);
  
  logSection("STEP 5: GATEWAY TEST (Bypass BFF)");
  
  const gatewayResult = await testRoute(
    "Gateway Route",
    `${CONFIG.gatewayUrl}/api/tutorial/content/${CONFIG.subtopic}`,
    {
      headers: {
        Cookie: cookies,
        "X-Brand": "realtutorialhub",
        "X-User-ID": jwtPayload?.userId || "test-user",
        "X-Internal-Secret": CONFIG.internalGatewaySecret,
      },
    }
  );
  
  printDetailedResult(gatewayResult);
  
  logSection("STEP 6: WORKING ENDPOINT COMPARISON");
  
  const sectionsResult = await testRoute(
    "Tutorial Sections (Known Working)",
    `${CONFIG.bffBaseUrl}/api/tutorial/sections/${CONFIG.subtopic}`,
    {
      headers: {
        Cookie: cookies,
      },
    }
  );
  
  printDetailedResult(sectionsResult);
  
  logSection("STEP 7: ROOT CAUSE ANALYSIS");
  
  console.log("\n📊 FAILURE MATRIX:");
  console.log(`BFF Tutorial Content:  ${bffResult.ok ? "✅ PASS" : "❌ FAIL"} (${bffResult.status})`);
  console.log(`Direct API:            ${directApiResult.ok ? "✅ PASS" : "❌ FAIL"} (${directApiResult.status})`);
  console.log(`Gateway:               ${gatewayResult.ok ? "✅ PASS" : "❌ FAIL"} (${gatewayResult.status})`);
  console.log(`Tutorial Sections:     ${sectionsResult.ok ? "✅ PASS" : "❌ FAIL"} (${sectionsResult.status})`);
  
  console.log("\n🎯 ROOT CAUSE DETERMINATION:\n");
  
  if (bffResult.status === 403) {
    if (directApiResult.ok && gatewayResult.ok) {
      console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ PRIMARY ROOT CAUSE: BFF LAYER ISSUE                                       ║
╚════════════════════════════════════════════════════════════════════════════╝

EVIDENCE:
- BFF route fails with 403
- Direct API works when called directly
- Gateway works when called directly
- Tutorial sections endpoint works (same auth requirements)

MOST PROBABLE CAUSES:
1. BFF route-specific RBAC logic in requireStudent()
2. BFF route missing environment variable
3. BFF route code difference vs sections route

RECOMMENDED INVESTIGATION:
1. Compare BFF routes:
   - apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts
   - apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts
2. Check requireStudent() vs requireBffAuth() differences
3. Verify both routes use same environment variables
      `);
    } else if (!directApiResult.ok && !gatewayResult.ok) {
      console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ PRIMARY ROOT CAUSE: API SERVER MIDDLEWARE ISSUE                           ║
╚════════════════════════════════════════════════════════════════════════════╝

EVIDENCE:
- BFF route fails with 403
- Direct API fails with ${directApiResult.status}
- Gateway fails with ${gatewayResult.status}
- All paths to API server are failing

MOST PROBABLE CAUSES:
1. proxy.ts middleware rejecting x-internal-secret header
2. Tutorial content route has different middleware than sections
3. RBAC enforcement at API server level

RECOMMENDED INVESTIGATION:
1. Check apps/api-server/src/proxy.ts line 52-106
2. Verify isTutorialRoute exemption logic
3. Compare /api/tutorial/content vs /api/tutorial/sections middleware
      `);
    } else if (directApiResult.ok && !gatewayResult.ok) {
      console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ PRIMARY ROOT CAUSE: BFF ROUTING TO GATEWAY WITH WRONG SECRET              ║
╚════════════════════════════════════════════════════════════════════════════╝

EVIDENCE:
- BFF route fails with 403
- Direct API works (correct secret)
- Gateway fails (wrong/missing secret)
- BFF is likely falling back to Gateway instead of Direct API

MOST PROBABLE CAUSES:
1. Production BFF missing INTERNAL_API_URL environment variable
2. BFF falls back to GATEWAY_URL
3. BFF sends INTERNAL_API_SECRET but Gateway expects INTERNAL_GATEWAY_SECRET
4. Secret mismatch between BFF and Gateway

RECOMMENDED FIX:
1. Set INTERNAL_API_URL in production Cloud Run:
   gcloud run services update realtutorialhub-web \\
     --set-env-vars INTERNAL_API_URL=${CONFIG.apiBaseUrl} \\
     --region asia-southeast1

2. OR set INTERNAL_GATEWAY_SECRET in BFF:
   gcloud run services update realtutorialhub-web \\
     --set-env-vars INTERNAL_GATEWAY_SECRET=${CONFIG.internalGatewaySecret} \\
     --region asia-southeast1
      `);
    } else {
      console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ COMPLEX ROOT CAUSE: MIXED FAILURE PATTERN                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

EVIDENCE:
- BFF route fails with 403
- Direct API: ${directApiResult.ok ? "PASS" : "FAIL"}
- Gateway: ${gatewayResult.ok ? "PASS" : "FAIL"}
- Inconsistent failure pattern

RECOMMENDED INVESTIGATION:
1. Check BFF logs for actual outbound URL
2. Verify which path BFF is taking (direct vs gateway)
3. Check for intermittent failures or caching issues
4. Review Cloud Run environment variables
      `);
    }
  } else {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║ ✅ NO 403 DETECTED - SYSTEM WORKING                                       ║
╚════════════════════════════════════════════════════════════════════════════╝

All routes are working correctly. The 403 issue may be:
- Deployment-specific (production vs staging)
- Intermittent or timing-related
- Already fixed
- Environment-specific

RECOMMENDED ACTIONS:
1. Run this script against production environment
2. Check Cloud Run logs for 403 errors
3. Verify production environment variables match test environment
    `);
  }
  
  logSection("STEP 8: RECOMMENDED ACTIONS");
  
  console.log(`
Priority Fix Order:

1. ✅ Verify production INTERNAL_API_URL environment variable
   - Check: gcloud run services describe realtutorialhub-web --region asia-southeast1
   - Should be: ${CONFIG.apiBaseUrl}

2. ✅ Verify INTERNAL_GATEWAY_SECRET if using Gateway
   - Check: gcloud run services describe realtutorialhub-web --region asia-southeast1
   - Should match: ${CONFIG.internalGatewaySecret.substring(0, 20)}...

3. ✅ Compare BFF route implementations
   - Content route: apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts
   - Sections route: apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts

4. ✅ Audit requireStudent() RBAC logic
   - File: apps/realtutorialhub-web/src/lib/assignment-auth.ts
   - Check role validation logic

5. ✅ Audit proxy.ts internal header support
   - File: apps/api-server/src/proxy.ts
   - Verify x-internal-secret acceptance

6. ✅ Standardize auth headers across all services
   - Unified header naming convention
   - Deprecation plan for legacy headers
  `);
  
  logSection("AUDIT COMPLETE");
  
  process.exit(bffResult.ok ? 0 : 1);
}

main().catch(err => {
  console.error("\n❌ Fatal Audit Failure:", err);
  process.exit(1);
});
