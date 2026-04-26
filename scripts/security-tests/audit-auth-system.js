const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "../../");

function scanFiles(dir, callback, excludeDirs = ["node_modules", ".git", ".turbo", "dist", "build"]) {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    
    if (fs.statSync(full).isDirectory()) {
      if (!excludeDirs.includes(file)) {
        scanFiles(full, callback, excludeDirs);
      }
    } else if (full.endsWith(".ts") || full.endsWith(".tsx") || full.endsWith(".js") || full.endsWith(".jsx")) {
      callback(full);
    }
  });
}

let results = {
  fetchWithoutCredentials: [],
  directCookieUsage: [],
  missingCanonicalRoles: false,
  rbacDuplication: [],
  cookieMiddlewareExists: false,
  cookieMiddlewareSecure: false,
  apiClientExists: false,
  apiClientUsesCredentials: false,
  brandIsolationChecks: [],
  gatewayValidation: false,
  refreshEndpointExists: false,
  localStorageTokenUsage: [],
  roleCheckWithoutCanonical: [],
  duplicateBrandLogic: [],
};

console.log("\n🔍 AUTH SYSTEM AUDIT START\n");
console.log("Scanning:", ROOT);
console.log("====================================\n");

// ----------------------------------
// 1. CHECK COOKIE MIDDLEWARE
// ----------------------------------
console.log("1️⃣  Checking cookie middleware...");
const cookieMiddlewarePath = path.join(ROOT, "packages/auth/src/middleware/cookie.middleware.ts");
const cookieMiddlewareAltPath = path.join(ROOT, "packages/auth/src/utils/cookie.ts");

if (fs.existsSync(cookieMiddlewarePath)) {
  results.cookieMiddlewareExists = true;
  const content = fs.readFileSync(cookieMiddlewarePath, "utf8");
  
  if (
    content.includes("httpOnly") &&
    content.includes("secure") &&
    content.includes("sameSite")
  ) {
    results.cookieMiddlewareSecure = true;
  }
} else if (fs.existsSync(cookieMiddlewareAltPath)) {
  results.cookieMiddlewareExists = true;
  const content = fs.readFileSync(cookieMiddlewareAltPath, "utf8");
  
  if (
    content.includes("httpOnly") &&
    content.includes("secure") &&
    content.includes("sameSite")
  ) {
    results.cookieMiddlewareSecure = true;
  }
}

// ----------------------------------
// 2. CHECK API CLIENT
// ----------------------------------
console.log("2️⃣  Checking API client...");
const apiClientPaths = [
  path.join(ROOT, "src/share-branding/lib/api-client.ts"),
  path.join(ROOT, "src/share-branding/services/apiClient.ts"),
  path.join(ROOT, "src/share-branding/utils/api-client.ts"),
  path.join(ROOT, "packages/auth/src/client/api-client.ts"),
];

for (const apiPath of apiClientPaths) {
  if (fs.existsSync(apiPath)) {
    results.apiClientExists = true;
    const content = fs.readFileSync(apiPath, "utf8");
    
    if (content.includes("credentials") && content.includes("include")) {
      results.apiClientUsesCredentials = true;
    }
    break;
  }
}

// ----------------------------------
// 3. CHECK BFF FETCH WITHOUT COOKIE FORWARDING (CRITICAL)
// ----------------------------------
console.log("3️⃣  Scanning BFF fetch calls for missing Cookie header forwarding...");
const frontendPath = path.join(ROOT, "src/share-branding");
if (fs.existsSync(frontendPath)) {
  scanFiles(frontendPath, (file) => {
    // Only check BFF routes (auth folder)
    if (!file.includes("auth")) return;
    
    const content = fs.readFileSync(file, "utf8");
    
    // Check for fetch without Cookie header forwarding
    const fetchMatches = content.match(/fetch\s*\(/g);
    if (fetchMatches) {
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        if (line.includes("fetch(") && !line.includes("//")) {
          // Check if Cookie header is forwarded (BFF → API)
          const contextStart = Math.max(0, idx - 2);
          const contextEnd = Math.min(lines.length, idx + 10);
          const context = lines.slice(contextStart, contextEnd).join("\n");
          
          // BFF calls should forward Cookie header OR use internal auth
          if (!context.includes("Cookie:") && 
              !context.includes("cookie") && 
              !context.includes("X-Internal-Secret") &&
              !context.includes("internalFetch")) {
            results.fetchWithoutCredentials.push({
              file: file.replace(ROOT, ""),
              line: idx + 1,
              code: line.trim(),
              type: "BFF_MISSING_COOKIE_FORWARD"
            });
          }
        }
      });
    }
  });
}

// ----------------------------------
// 4. CHECK DIRECT COOKIE USAGE (SHARED AUTH ROUTES ONLY)
// ----------------------------------
console.log("4️⃣  Checking for direct cookie usage (shared auth routes only)...");
const apiServerPath = path.join(ROOT, "apps/api-server");
const sharedAuthPath = path.join(ROOT, "apps/api-server/src/app/api/auth");
if (fs.existsSync(sharedAuthPath)) {
  scanFiles(sharedAuthPath, (file) => {
    // Skip .next build artifacts
    if (file.includes(".next")) return;
    
    // Skip test files
    if (file.includes("__tests__") || file.includes(".test.") || file.includes(".spec.")) return;
    
    // Skip non-auth cookie files (CSRF, onboarding state)
    if (file.includes("csrf.middleware") || file.includes("onboarding-state-cookie")) return;
    
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    
    lines.forEach((line, idx) => {
      // Check for direct cookie.set usage
      if (line.includes("cookies.set(") || line.includes("cookie.set(")) {
        
        // ✅ ALLOWED: Using proper abstraction
        if (line.includes("setAuthCookies") || line.includes("clearAuthCookies")) {
          return; // Safe usage
        }
        
        // ✅ ALLOWED: Infrastructure tokens (special case in any file)
        if (line.includes("infra_accessToken") || line.includes("infra_refreshToken")) {
          return; // Infrastructure tokens are handled separately
        }
        
        // ❌ FORBIDDEN: Direct auth cookie writes
        if (line.includes("accessToken") || line.includes("refreshToken")) {
          results.directCookieUsage.push({
            file: file.replace(ROOT, ""),
            line: idx + 1,
            code: line.trim()
          });
        }
      }
    });
  });
}

// ----------------------------------
// 5. CHECK CANONICAL ROLES
// ----------------------------------
console.log("5️⃣  Checking canonical roles...");
const canonicalPaths = [
  path.join(ROOT, "packages/auth/src/utils/canonical-roles.ts"),
  path.join(ROOT, "packages/auth/src/rbac/canonical-roles.ts"),
  path.join(ROOT, "packages/auth/src/roles/canonical.ts"),
];

for (const canonicalPath of canonicalPaths) {
  if (fs.existsSync(canonicalPath)) {
    results.missingCanonicalRoles = false;
    break;
  } else {
    results.missingCanonicalRoles = true;
  }
}

// ----------------------------------
// 6. CHECK ROLE CHECKS WITHOUT CANONICAL (SHARED ONLY)
// ----------------------------------
console.log("6️⃣  Checking role checks without canonical normalization (shared only)...");
const sharedPaths = [
  path.join(ROOT, "src/share-branding"),
  path.join(ROOT, "packages/auth"),
  path.join(ROOT, "apps/api-server/src")
];

sharedPaths.forEach(sharedPath => {
  if (!fs.existsSync(sharedPath)) return;
  
  scanFiles(sharedPath, (file) => {
    if (file.includes(".next")) return;
    
    const content = fs.readFileSync(file, "utf8");
    
    // Look for direct role checks
    if (
      (content.includes('role === "student"') || 
       content.includes('role === "user"') ||
       content.includes('roles.includes("student")')) &&
      !content.includes("canonicalRoles") &&
      !content.includes("normalizeRoles")
    ) {
      results.roleCheckWithoutCanonical.push(file.replace(ROOT, ""));
    }
  });
});

// ----------------------------------
// 7. CHECK RBAC DUPLICATION (SHARED ONLY)
// ----------------------------------
console.log("7️⃣  Checking RBAC duplication (shared resources only)...");
const rbacCheckPaths = [
  path.join(ROOT, "src/share-branding"),
  path.join(ROOT, "apps/api-server/src")
];

rbacCheckPaths.forEach(checkPath => {
  if (!fs.existsSync(checkPath)) return;
  
  scanFiles(checkPath, (file) => {
    if (file.includes(".next") || file.includes("packages/auth")) return;
    
    const content = fs.readFileSync(file, "utf8");
    
    if (
      (content.includes("hasPermission(") || 
       content.includes("checkPermission(") ||
       content.includes("canAccess(")) &&
      !file.includes("packages/auth")
    ) {
      results.rbacDuplication.push(file.replace(ROOT, ""));
    }
  });
});

// ----------------------------------
// 8. CHECK BRAND ISOLATION (API-SERVER ONLY)
// ----------------------------------
console.log("8️⃣  Checking brand isolation (api-server only)...");
if (fs.existsSync(apiServerPath)) {
  scanFiles(apiServerPath, (file) => {
    if (file.includes(".next")) return;
    
    const content = fs.readFileSync(file, "utf8");
    
    if (
      content.includes("brand") &&
      (content.includes("getBrandFromHostname") || 
       content.includes("extractBrand") ||
       content.includes("X-Brand"))
    ) {
      results.brandIsolationChecks.push(file.replace(ROOT, ""));
    }
  });
}

// ----------------------------------
// 9. CHECK GATEWAY VALIDATION
// ----------------------------------
console.log("9️⃣  Checking gateway validation...");
const gatewayPath = path.join(ROOT, "apps/api-gateway");
if (fs.existsSync(gatewayPath)) {
  scanFiles(gatewayPath, (file) => {
    const content = fs.readFileSync(file, "utf8");
    
    if (
      content.includes("validateToken") ||
      content.includes("verifyToken") ||
      content.includes("authMiddleware")
    ) {
      results.gatewayValidation = true;
    }
  });
}

// ----------------------------------
// 10. CHECK REFRESH ENDPOINT (API-SERVER ONLY)
// ----------------------------------
console.log("🔟 Checking refresh endpoint (api-server only)...");
if (fs.existsSync(apiServerPath)) {
  scanFiles(apiServerPath, (file) => {
    if (file.includes(".next")) return;
    
    const content = fs.readFileSync(file, "utf8");
    
    if (
      content.includes("/refresh") ||
      content.includes("refreshToken") ||
      content.includes("refresh-token")
    ) {
      results.refreshEndpointExists = true;
    }
  });
}

// ----------------------------------
// 11. CHECK LOCALSTORAGE TOKEN USAGE
// ----------------------------------
console.log("1️⃣1️⃣  Checking localStorage token usage...");
if (fs.existsSync(frontendPath)) {
  scanFiles(frontendPath, (file) => {
    const content = fs.readFileSync(file, "utf8");
    
    if (
      content.includes("localStorage.setItem") &&
      (content.includes("token") || content.includes("accessToken"))
    ) {
      results.localStorageTokenUsage.push(file.replace(ROOT, ""));
    }
  });
}

// ----------------------------------
// 12. CHECK DUPLICATE BRAND LOGIC (SHARED ONLY)
// ----------------------------------
console.log("1️⃣2️⃣  Checking duplicate brand logic (shared resources only)...");
const brandConfigFiles = [];
const brandCheckPaths = [
  path.join(ROOT, "src/share-branding"),
  path.join(ROOT, "packages"),
  path.join(ROOT, "apps/api-server/src")
];

brandCheckPaths.forEach(checkPath => {
  if (!fs.existsSync(checkPath)) return;
  
  scanFiles(checkPath, (file) => {
    if (file.includes(".next") || file.includes("node_modules")) return;
    
    const content = fs.readFileSync(file, "utf8");
    
    if (
      content.includes("realtutorialhub") &&
      content.includes("skillup") &&
      (content.includes("domain") || content.includes("config"))
    ) {
      brandConfigFiles.push(file.replace(ROOT, ""));
    }
  });
});

if (brandConfigFiles.length > 1) {
  results.duplicateBrandLogic = brandConfigFiles;
}

// ----------------------------------
// REPORT
// ----------------------------------
console.log("\n\n====================================");
console.log("🔐 AUTH AUDIT REPORT");
console.log("====================================\n");

let criticalIssues = 0;
let warnings = 0;
let passed = 0;

// 1. Cookie Middleware
console.log("1️⃣  COOKIE MIDDLEWARE");
if (results.cookieMiddlewareExists && results.cookieMiddlewareSecure) {
  console.log("   ✅ PASS - Secure cookie middleware exists");
  passed++;
} else if (results.cookieMiddlewareExists) {
  console.log("   ⚠️  PARTIAL - Cookie middleware exists but may lack security flags");
  console.log("   📍 Risk: MEDIUM - Verify httpOnly, secure, sameSite settings");
  warnings++;
} else {
  console.log("   ❌ FAIL - Cookie middleware MISSING");
  console.log("   📍 Risk: HIGH - No centralized cookie management");
  criticalIssues++;
}

// 2. API Client
console.log("\n2️⃣  API CLIENT");
if (results.apiClientExists && results.apiClientUsesCredentials) {
  console.log("   ✅ PASS - API client exists with credentials");
  passed++;
} else if (results.apiClientExists) {
  console.log("   ⚠️  PARTIAL - API client exists but may not use credentials");
  console.log("   📍 Risk: HIGH - Cookies won't be sent");
  warnings++;
} else {
  console.log("   ❌ FAIL - API client MISSING");
  console.log("   📍 Risk: HIGH - No centralized API calls");
  criticalIssues++;
}

// 3. Fetch without credentials
console.log("\n3️⃣  FETCH CALLS");
if (results.fetchWithoutCredentials.length === 0) {
  console.log("   ✅ PASS - All fetch calls use credentials or apiClient");
  passed++;
} else {
  console.log(`   ❌ FAIL - ${results.fetchWithoutCredentials.length} fetch calls without credentials`);
  console.log("   📍 Risk: HIGH - Cookies won't be sent");
  results.fetchWithoutCredentials.slice(0, 5).forEach(f => {
    console.log(`      ${f.file}:${f.line} - ${f.code}`);
  });
  if (results.fetchWithoutCredentials.length > 5) {
    console.log(`      ... and ${results.fetchWithoutCredentials.length - 5} more`);
  }
  criticalIssues++;
}

// 4. Direct cookie usage
console.log("\n4️⃣  COOKIE USAGE");
if (results.directCookieUsage.length === 0) {
  console.log("   ✅ PASS - No direct auth cookie usage");
  console.log("   All auth cookies use setAuthCookies/clearAuthCookies");
  passed++;
} else {
  console.log(`   ❌ FAIL - ${results.directCookieUsage.length} files with direct auth cookie usage`);
  console.log("   📍 Risk: HIGH - Inconsistent cookie settings");
  console.log("   🔧 Fix: Use setAuthCookies() or clearAuthCookies()");
  results.directCookieUsage.forEach(f => {
    console.log(`      ${f.file}:${f.line}`);
    console.log(`         ${f.code}`);
  });
  criticalIssues++;
}

// 5. Canonical roles
console.log("\n5️⃣  CANONICAL ROLES");
if (!results.missingCanonicalRoles) {
  console.log("   ✅ PASS - Canonical roles utility exists");
  passed++;
} else {
  console.log("   ❌ FAIL - Canonical roles MISSING");
  console.log("   📍 Risk: HIGH - Role normalization not enforced");
  console.log("   📁 Expected: packages/auth/src/utils/canonical-roles.ts");
  criticalIssues++;
}

// 6. Role checks without canonical
console.log("\n6️⃣  ROLE NORMALIZATION USAGE");
if (results.roleCheckWithoutCanonical.length === 0) {
  console.log("   ✅ PASS - No direct role checks found");
  passed++;
} else {
  console.log(`   ⚠️  PARTIAL - ${results.roleCheckWithoutCanonical.length} files with direct role checks`);
  console.log("   📍 Risk: MEDIUM - May bypass canonical normalization");
  results.roleCheckWithoutCanonical.slice(0, 3).forEach(f => console.log(`      ${f}`));
  if (results.roleCheckWithoutCanonical.length > 3) {
    console.log(`      ... and ${results.roleCheckWithoutCanonical.length - 3} more`);
  }
  warnings++;
}

// 7. RBAC duplication
console.log("\n7️⃣  RBAC DUPLICATION");
if (results.rbacDuplication.length === 0) {
  console.log("   ✅ PASS - No RBAC duplication detected");
  passed++;
} else {
  console.log(`   ⚠️  PARTIAL - ${results.rbacDuplication.length} files with RBAC logic outside packages/auth`);
  console.log("   📍 Risk: MEDIUM - Potential logic duplication");
  results.rbacDuplication.slice(0, 3).forEach(f => console.log(`      ${f}`));
  if (results.rbacDuplication.length > 3) {
    console.log(`      ... and ${results.rbacDuplication.length - 3} more`);
  }
  warnings++;
}

// 8. Brand isolation
console.log("\n8️⃣  BRAND ISOLATION");
if (results.brandIsolationChecks.length > 0) {
  console.log(`   ✅ PASS - Brand isolation checks found in ${results.brandIsolationChecks.length} files`);
  passed++;
} else {
  console.log("   ⚠️  PARTIAL - No explicit brand isolation checks found");
  console.log("   📍 Risk: MEDIUM - Verify brand validation exists");
  warnings++;
}

// 9. Gateway validation
console.log("\n9️⃣  GATEWAY VALIDATION");
if (results.gatewayValidation) {
  console.log("   ✅ PASS - Gateway validation exists");
  passed++;
} else {
  console.log("   ⚠️  PARTIAL - Gateway validation not detected");
  console.log("   📍 Risk: MEDIUM - Verify token validation in gateway");
  warnings++;
}

// 10. Refresh endpoint
console.log("\n🔟 REFRESH ENDPOINT");
if (results.refreshEndpointExists) {
  console.log("   ✅ PASS - Refresh endpoint exists");
  passed++;
} else {
  console.log("   ❌ FAIL - Refresh endpoint not found");
  console.log("   📍 Risk: HIGH - Token refresh may not work");
  criticalIssues++;
}

// 11. localStorage usage
console.log("\n1️⃣1️⃣  TOKEN STORAGE");
if (results.localStorageTokenUsage.length === 0) {
  console.log("   ✅ PASS - No localStorage token usage");
  passed++;
} else {
  console.log(`   ❌ FAIL - ${results.localStorageTokenUsage.length} files using localStorage for tokens`);
  console.log("   📍 Risk: HIGH - Tokens should be in httpOnly cookies");
  results.localStorageTokenUsage.forEach(f => console.log(`      ${f}`));
  criticalIssues++;
}

// 12. Duplicate brand logic
console.log("\n1️⃣2️⃣  BRAND LOGIC DUPLICATION");
if (results.duplicateBrandLogic.length <= 1) {
  console.log("   ✅ PASS - Brand config centralized");
  passed++;
} else {
  console.log(`   ⚠️  PARTIAL - ${results.duplicateBrandLogic.length} files with brand config`);
  console.log("   📍 Risk: LOW - Verify only data differs, not logic");
  results.duplicateBrandLogic.forEach(f => console.log(`      ${f}`));
  warnings++;
}

// Summary
console.log("\n====================================");
console.log("📊 SUMMARY");
console.log("====================================");
console.log(`✅ Passed:           ${passed}/12`);
console.log(`⚠️  Warnings:         ${warnings}`);
console.log(`❌ Critical Issues:  ${criticalIssues}`);

if (criticalIssues > 0) {
  console.log("\n🚨 VERDICT: NOT PRODUCTION READY");
  console.log("   Fix critical issues before deployment");
} else if (warnings > 2) {
  console.log("\n⚠️  VERDICT: NEEDS REVIEW");
  console.log("   Address warnings for production safety");
} else {
  console.log("\n✅ VERDICT: PRODUCTION READY");
  console.log("   Minor warnings acceptable");
}

console.log("\n====================================\n");

// Exit code
process.exit(criticalIssues > 0 ? 1 : 0);
