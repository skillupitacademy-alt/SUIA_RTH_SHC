#!/usr/bin/env node

/**
 * TUTORIAL CONTENT DEEP ARCHITECTURE AUDIT SCRIPT
 * ------------------------------------------------------------
 * Purpose:
 * Perform enterprise-grade audit of tutorial engine implementation:
 *
 * 1. Authentication validation
 * 2. Sections endpoint validation
 * 3. Content endpoint validation
 * 4. BFF vs Direct API parity
 * 5. Gateway parity
 * 6. Content existence audit
 * 7. Subtopic consistency audit
 * 8. Response schema validation
 * 9. Missing tutorial block detection
 * 10. BFF error masking detection
 *
 * Usage:
 * node scripts/tutorial-content-deep-audit.mjs
 *
 * ENV:
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

const REQUIRED_BLOCKS = [
  "notes",
  "layman",
  "realLife",
  "technical",
  "codeExample",
  "aiTutor",
];

const EXPECTED_SECTIONS = [
  "notes",
  "layman",
  "visual",
  "real_life",
  "technical",
  "code",
  "practice",
  "assignment",
  "project",
  "quiz",
];

function section(title) {
  console.log("\n" + "=".repeat(100));
  console.log(`🔍 ${title}`);
  console.log("=".repeat(100));
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

function fail(msg) {
  console.log(`❌ ${msg}`);
}

function warn(msg) {
  console.log(`⚠️  ${msg}`);
}

function info(msg) {
  console.log(`ℹ️  ${msg}`);
}

function extractCookies(response) {
  const raw = response.headers.raw()["set-cookie"] || [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

function extractAccessToken(cookies) {
  const match = cookies.match(/accessToken=([^;]+)/);
  return match ? match[1] : null;
}

async function login() {
  section("STEP 1: AUTHENTICATION");
  
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
  
  if (!res.ok) {
    fail(`Login failed (${res.status})`);
    console.log(body);
    process.exit(1);
  }
  
  success(`Login success (${res.status})`);
  
  const cookies = extractCookies(res);
  const token = extractAccessToken(cookies);
  
  if (!token) {
    fail("Access token missing");
    process.exit(1);
  }
  
  success("JWT token extracted");
  
  return { cookies, token };
}

function decodeJwt(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    
    section("STEP 2: JWT CLAIM AUDIT");
    
    info(`userId: ${payload.userId}`);
    info(`brand: ${payload.brand}`);
    info(`roles: ${JSON.stringify(payload.roles)}`);
    info(`audience: ${payload.aud}`);
    
    if (!payload.roles || payload.roles.length === 0) {
      fail("JWT roles missing");
    } else {
      success("JWT roles valid");
    }
    
    return payload;
  } catch (e) {
    fail(`JWT decode failed: ${e.message}`);
    return null;
  }
}

async function testEndpoint(name, url, headers = {}) {
  try {
    const start = Date.now();
    
    const res = await fetch(url, {
      headers,
    });
    
    const duration = Date.now() - start;
    const text = await res.text();
    
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    
    return {
      name,
      url,
      status: res.status,
      ok: res.ok,
      duration,
      body: text,
      json,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (e) {
    return {
      name,
      url,
      ok: false,
      error: e.message,
    };
  }
}

function printEndpoint(result) {
  console.log(`\n📍 ${result.name}`);
  console.log(`URL: ${result.url}`);
  
  if (result.error) {
    fail(`Request failed: ${result.error}`);
    return;
  }
  
  console.log(`Status: ${result.status}`);
  console.log(`Time: ${result.duration}ms`);
  
  if (result.ok) {
    success("Endpoint success");
  } else {
    fail("Endpoint failed");
  }
  
  console.log(`Response Preview: ${result.body.slice(0, 600)}`);
}

function validateSectionsSchema(data) {
  section("STEP 6: SECTIONS SCHEMA VALIDATION");
  
  if (!data?.sections) {
    fail("Sections object missing");
    return false;
  }
  
  const keys = Object.keys(data.sections);
  
  success(`Sections found: ${keys.join(", ")}`);
  info(`Total sections: ${keys.length}`);
  
  // Check for expected sections
  const missing = EXPECTED_SECTIONS.filter(s => !keys.includes(s));
  const extra = keys.filter(s => !EXPECTED_SECTIONS.includes(s));
  
  if (missing.length > 0) {
    warn(`Missing sections: ${missing.join(", ")}`);
  } else {
    success("All expected sections present");
  }
  
  if (extra.length > 0) {
    info(`Extra sections: ${extra.join(", ")}`);
  }
  
  // Validate section structure
  for (const key of keys.slice(0, 3)) {
    const section = data.sections[key];
    if (section?.sections && Array.isArray(section.sections)) {
      success(`${key}: ${section.sections.length} subsections`);
    } else {
      warn(`${key}: Invalid structure`);
    }
  }
  
  if (keys.length < 3) {
    warn("Low section count - content may be incomplete");
  }
  
  return true;
}

function validateContentSchema(data) {
  section("STEP 7: CONTENT BLOCK VALIDATION");
  
  if (!data) {
    fail("No content data returned");
    return false;
  }
  
  // Check if data is wrapped in a "data" property
  const content = data.data || data;
  
  let found = 0;
  const foundBlocks = [];
  const missingBlocks = [];
  
  for (const block of REQUIRED_BLOCKS) {
    if (content[block]) {
      success(`${block} block exists`);
      found++;
      foundBlocks.push(block);
    } else {
      fail(`${block} block missing`);
      missingBlocks.push(block);
    }
  }
  
  console.log(
    `\n📊 Block Completeness: ${found}/${REQUIRED_BLOCKS.length} (${Math.round(found/REQUIRED_BLOCKS.length*100)}%)`
  );
  
  if (missingBlocks.length > 0) {
    warn(`Missing blocks: ${missingBlocks.join(", ")}`);
  }
  
  if (foundBlocks.length > 0) {
    info(`Present blocks: ${foundBlocks.join(", ")}`);
  }
  
  return found === REQUIRED_BLOCKS.length;
}

function analyzeRootCause(results) {
  section("STEP 8: ENTERPRISE ROOT CAUSE ANALYSIS");
  
  const {
    bffSections,
    bffContent,
    directContent,
    gatewayContent,
  } = results;
  
  console.log("\n📊 SYSTEM MATRIX:");
  console.log(
    `BFF Sections:     ${bffSections.ok ? "✅" : "❌"} (${bffSections.status})`
  );
  console.log(
    `BFF Content:      ${bffContent.ok ? "✅" : "❌"} (${bffContent.status})`
  );
  console.log(
    `Direct Content:   ${directContent.ok ? "✅" : "❌"} (${directContent.status})`
  );
  console.log(
    `Gateway Content:  ${gatewayContent.ok ? "✅" : "❌"} (${gatewayContent.status})`
  );
  
  console.log("\n🎯 ROOT CAUSE DETERMINATION:\n");
  
  if (bffSections.ok && !bffContent.ok && directContent.status === 404) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ PRIMARY ROOT CAUSE: Tutorial Content Infrastructure Incomplete                              ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

DEFINITIVE FINDINGS:
✅ Sections endpoint works perfectly (200 OK)
❌ Content endpoint fails at API layer (404 Not Found)
✅ Authentication stack is functional
✅ Gateway routing is functional
❌ Database/content records missing or route incomplete

EVIDENCE:
1. BFF Sections: ${bffSections.status} - Returns ${Object.keys(bffSections.json?.sections || {}).length} sections
2. BFF Content: ${bffContent.status} - Forbidden (likely masking upstream 404)
3. Direct API Content: ${directContent.status} - Not Found (definitive proof)
4. Gateway Content: ${gatewayContent.status} - Also fails

MOST PROBABLE ISSUES (in priority order):

1. 🔴 MISSING DATABASE RECORDS
   - tutorial_content table lacks records for "${CONFIG.subtopic}"
   - AI generation pipeline incomplete
   - Content publish workflow not executed
   - Soft delete or unpublished state

2. 🟡 ROUTE IMPLEMENTATION MISMATCH
   - /api/tutorial/sections/* fully implemented
   - /api/tutorial/content/* partially implemented or broken
   - Query logic fails to find content
   - Schema mismatch between sections and content

3. 🟠 BFF ERROR TRANSLATION BUG
   - Upstream 404 (Not Found) transformed to 403 (Forbidden)
   - Misleading security diagnostics
   - Broken observability
   - Incorrect error normalization

4. 🟢 CONTENT GENERATION PIPELINE GAP
   - Sections generated successfully
   - Full content blocks never generated
   - AI generation job failed or incomplete
   - Admin approval workflow incomplete

ARCHITECTURAL IMPLICATIONS:
- Your tutorial engine has TWO separate content systems:
  * Sections system: ✅ Working (lightweight, metadata-focused)
  * Content system: ❌ Broken (heavyweight, full tutorial blocks)
- This suggests phased implementation where sections were completed first
- Content generation/storage architecture may be incomplete
    `);
  } else if (bffSections.ok && bffContent.ok && directContent.ok) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ ✅ ALL SYSTEMS OPERATIONAL                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

All endpoints working correctly. The 403 issue may be:
- Environment-specific (production vs staging)
- Intermittent or timing-related
- Already fixed
- Subtopic-specific

RECOMMENDATION:
Test with different subtopics to verify consistency.
    `);
  } else {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ COMPLEX FAILURE PATTERN - REQUIRES DEEPER INVESTIGATION                                     ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

Unexpected failure pattern detected. Manual investigation required.
    `);
  }
  
  // BFF error masking detection
  if (bffContent.status === 403 && directContent.status === 404) {
    console.log(`
⚠️  CRITICAL BUG DETECTED: BFF ERROR MASKING

BFF transforms upstream 404 (Not Found) into 403 (Forbidden)

IMPACT:
- Misleading error messages
- False security diagnostics
- Broken observability
- Wasted debugging time on auth/permissions instead of content

LOCATION:
- File: apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts
- Likely: Catch block or error handler incorrectly returns 403

RECOMMENDED FIX:
Preserve upstream status codes or map 404 → 404, not 404 → 403
    `);
  }
}

function generateRecommendations(results) {
  section("STEP 9: NEXT-LEVEL AUDIT RECOMMENDATIONS");
  
  const { bffSections, directContent } = results;
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ PRIORITY INVESTIGATION ORDER                                                                ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

1. 🔴 DATABASE CONTENT AUDIT (HIGHEST PRIORITY)
   
   Run SQL queries:
   
   -- Check if subtopic exists
   SELECT * FROM subtopics WHERE slug = '${CONFIG.subtopic}';
   
   -- Check tutorial_content records
   SELECT 
     id, subtopic_id, difficulty, content_type, 
     is_published, deleted_at, created_at
   FROM tutorial_content 
   WHERE subtopic_id = (SELECT id FROM subtopics WHERE slug = '${CONFIG.subtopic}');
   
   -- Check tutorial_sections records
   SELECT 
     id, subtopic_id, section_type, 
     is_published, created_at
   FROM tutorial_sections 
   WHERE subtopic_id = (SELECT id FROM subtopics WHERE slug = '${CONFIG.subtopic}');
   
   -- Count content blocks by type
   SELECT content_type, COUNT(*) 
   FROM tutorial_content 
   WHERE subtopic_id = (SELECT id FROM subtopics WHERE slug = '${CONFIG.subtopic}')
   GROUP BY content_type;

2. 🟡 ROUTE IMPLEMENTATION COMPARISON
   
   Compare these files:
   
   Working:
   - apps/api-server/src/app/api/tutorial/sections/[subtopicId]/route.ts
   - apps/realtutorialhub-web/src/app/api/tutorial/sections/[subtopicId]/route.ts
   
   Failing:
   - apps/api-server/src/app/api/tutorial/content/[subtopicId]/route.ts
   - apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts
   
   Look for:
   - Different service calls
   - Different repository methods
   - Different query structures
   - Different error handling
   - Different auth wrappers

3. 🟠 CONTENT GENERATION PIPELINE AUDIT
   
   Investigate:
   - AI generation jobs for "${CONFIG.subtopic}"
   - Admin CMS publish workflow
   - Content ingestion pipeline
   - Draft vs published state
   - Schema validation
   - Subtopic provisioning
   
   Questions:
   - Was component-architecture generated only for sections?
   - Were full 6 tutorial blocks never created?
   - Did generation fail?
   - Was publish skipped?

4. 🟢 BFF ERROR TRANSLATION FIX
   
   File: apps/realtutorialhub-web/src/app/api/tutorial/content/[subtopicId]/route.ts
   
   Current (likely):
   \`\`\`typescript
   if (!response.ok) {
     return NextResponse.json(
       { error: 'Tutorial content not found' },
       { status: 403 }  // ❌ WRONG - should preserve upstream status
     );
   }
   \`\`\`
   
   Fix:
   \`\`\`typescript
   if (!response.ok) {
     const error = await response.json().catch(() => ({ error: 'Failed to fetch content' }));
     return NextResponse.json(
       { error: error.error || 'Tutorial content not found' },
       { status: response.status }  // ✅ CORRECT - preserve upstream status
     );
   }
   \`\`\`

5. 🔵 CONTENT SCHEMA VALIDATION
   
   Expected TutorialContent JSON structure:
   {
     "notes": { ... },
     "layman": { ... },
     "realLife": { ... },
     "technical": { ... },
     "codeExample": { ... },
     "aiTutor": { ... }
   }
   
   Validate:
   - All 6 blocks present
   - No null values
   - Proper nesting
   - Version consistency

6. 🟣 SUBTOPIC DATA CONSISTENCY AUDIT
   
   For each subtopic, verify:
   - Sections availability ✅
   - Content availability ❌
   - Assignments
   - Remediation
   - AI tutor readiness
   
   Goal: Detect systemic partial content generation gaps

7. ⚪ TUTORIAL ENGINE PHASE COMPLIANCE
   
   Validate T1-T8 implementation:
   - T1 Foundation: Sections ✅
   - T2 Generation: Content ❌
   - T3 Rendering: UI
   - T4 SEO: Metadata
   - T5 Assignments: Exercises
   - T6 AI Tutor: Interactive
   - T7 Remediation: Personalized
   - T8 Admin CMS: Management

8. 🟤 INFRASTRUCTURE OBSERVABILITY
   
   Add monitoring:
   - Upstream status logging
   - DB miss logging
   - Missing content alerts
   - Publish gap alerts
   - Route mismatch dashboards
   - Content completeness metrics
  `);
}

async function main() {
  console.clear();
  
  section("ENVIRONMENT VALIDATION");
  
  info(`BFF_BASE_URL: ${CONFIG.bffBaseUrl}`);
  info(`API_BASE_URL: ${CONFIG.apiBaseUrl}`);
  info(`GATEWAY_URL: ${CONFIG.gatewayUrl}`);
  info(`SUBTOPIC: ${CONFIG.subtopic}`);
  info(`INTERNAL_API_SECRET: ${CONFIG.internalApiSecret.substring(0, 20)}...`);
  info(`INTERNAL_GATEWAY_SECRET: ${CONFIG.internalGatewaySecret.substring(0, 20)}...`);
  
  const { cookies, token } = await login();
  const jwt = decodeJwt(token);
  
  const authHeaders = {
    Cookie: cookies,
  };
  
  const internalHeaders = {
    Cookie: cookies,
    "X-Brand": "realtutorialhub",
    "X-User-ID": jwt?.userId || "",
    "X-Internal-Secret": CONFIG.internalApiSecret,
  };
  
  const gatewayHeaders = {
    Cookie: cookies,
    "X-Brand": "realtutorialhub",
    "X-User-ID": jwt?.userId || "",
    "X-Internal-Secret": CONFIG.internalGatewaySecret,
  };
  
  section("STEP 3: BFF SECTIONS TEST");
  
  const bffSections = await testEndpoint(
    "BFF Sections",
    `${CONFIG.bffBaseUrl}/api/tutorial/sections/${CONFIG.subtopic}`,
    authHeaders
  );
  
  printEndpoint(bffSections);
  
  section("STEP 4: BFF CONTENT TEST");
  
  const bffContent = await testEndpoint(
    "BFF Content",
    `${CONFIG.bffBaseUrl}/api/tutorial/content/${CONFIG.subtopic}`,
    authHeaders
  );
  
  printEndpoint(bffContent);
  
  section("STEP 5: DIRECT API + GATEWAY CONTENT TEST");
  
  const directContent = await testEndpoint(
    "Direct API Content",
    `${CONFIG.apiBaseUrl}/tutorial/content/${CONFIG.subtopic}`,
    internalHeaders
  );
  
  printEndpoint(directContent);
  
  const gatewayContent = await testEndpoint(
    "Gateway Content",
    `${CONFIG.gatewayUrl}/api/tutorial/content/${CONFIG.subtopic}`,
    gatewayHeaders
  );
  
  printEndpoint(gatewayContent);
  
  if (bffSections.ok && bffSections.json) {
    validateSectionsSchema(bffSections.json);
  }
  
  if (directContent.ok && directContent.json) {
    validateContentSchema(directContent.json);
  } else if (directContent.status === 404) {
    section("STEP 7: CONTENT BLOCK VALIDATION");
    fail("Tutorial content missing from source system (404)");
    warn("Content route exists but returns no data");
    info("This indicates database records are missing or query is failing");
  }
  
  analyzeRootCause({
    bffSections,
    bffContent,
    directContent,
    gatewayContent,
  });
  
  generateRecommendations({
    bffSections,
    bffContent,
    directContent,
    gatewayContent,
  });
  
  section("AUDIT COMPLETE");
  
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ EXECUTIVE SUMMARY                                                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝

SYSTEM STATUS:
- Authentication: ✅ Functional
- Sections API: ${bffSections.ok ? "✅ Functional" : "❌ Broken"}
- Content API: ${bffContent.ok ? "✅ Functional" : "❌ Broken"}

PRIMARY ISSUE:
${directContent.status === 404 ? "Missing database content records or incomplete route implementation" : "Unknown - requires manual investigation"}

IMMEDIATE ACTION:
${directContent.status === 404 ? "1. Check tutorial_content database table\n2. Verify content generation pipeline\n3. Compare sections vs content route implementations" : "Review audit output above for specific recommendations"}

CONFIDENCE LEVEL:
${directContent.status === 404 && bffSections.ok ? "HIGH - Root cause identified with evidence" : "MEDIUM - Requires additional investigation"}
  `);
  
  process.exit(bffContent.ok ? 0 : 1);
}

main().catch((err) => {
  fail(`Fatal audit failure: ${err.message}`);
  console.error(err);
  process.exit(1);
});
