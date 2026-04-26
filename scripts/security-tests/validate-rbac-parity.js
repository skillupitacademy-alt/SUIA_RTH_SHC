#!/usr/bin/env node

/**
 * 🔐 RBAC PARITY TEST
 * 
 * Validates that RBAC behaves identically across both brands.
 * Tests that role normalization works correctly.
 * 
 * Expected behavior:
 * - RTH user (role: ["user"]) → can access profile
 * - SkillUp student (roles: ["user", "student"]) → can access profile
 * - Both should have IDENTICAL permissions after normalization
 * 
 * CRITICAL: This prevents brand-specific RBAC bugs
 */

const BASE = {
  rth: "https://user.realtutorialhub.com",
  skillup: "https://user.skillupitacademy.com",
};

const USERS = {
  rth: {
    email: "ajayshah@gmail.com",
    password: "testing",
  },
  skillup: {
    email: "student@skillupitacademy.com",
    password: "testing",
  },
};

async function login(base, creds) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(creds),
  });

  if (!res.ok) {
    throw new Error(`Login failed (${res.status})`);
  }

  const cookies = res.headers.get("set-cookie");
  if (!cookies) {
    throw new Error("No cookies received");
  }

  return cookies;
}

async function testEndpoint(base, cookie, endpoint) {
  const res = await fetch(`${base}${endpoint}`, {
    headers: {
      Cookie: cookie,
    },
  });

  return {
    status: res.status,
    ok: res.ok,
  };
}

async function testBrand(label, base, creds) {
  console.log(`\n🔍 Testing ${label}...`);
  
  try {
    const cookie = await login(base, creds);
    console.log("✅ Login successful");

    // Test protected endpoints
    const endpoints = [
      "/api/profile",
      "/api/auth/me",
      "/api/auth/sessions",
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      const result = await testEndpoint(base, cookie, endpoint);
      results[endpoint] = result.status;
      
      if (result.ok) {
        console.log(`✅ ${endpoint} → ${result.status}`);
      } else {
        console.log(`❌ ${endpoint} → ${result.status}`);
      }
    }

    return results;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return null;
  }
}

(async () => {
  console.log("🔐 RBAC PARITY TEST");
  console.log("================================\n");

  const rthResults = await testBrand("RTH", BASE.rth, USERS.rth);
  const skillupResults = await testBrand("SkillUp", BASE.skillup, USERS.skillup);

  console.log("\n================================");
  console.log("📊 PARITY CHECK");
  console.log("================================");

  if (!rthResults || !skillupResults) {
    console.log("❌ PARITY CHECK: FAIL (one or both brands failed)");
    process.exit(1);
  }

  // Check if both brands have identical results
  const endpoints = Object.keys(rthResults);
  let parityPass = true;

  for (const endpoint of endpoints) {
    const rthStatus = rthResults[endpoint];
    const skillupStatus = skillupResults[endpoint];
    
    if (rthStatus === skillupStatus) {
      console.log(`✅ ${endpoint}: RTH=${rthStatus}, SkillUp=${skillupStatus}`);
    } else {
      console.log(`❌ ${endpoint}: RTH=${rthStatus}, SkillUp=${skillupStatus} (MISMATCH)`);
      parityPass = false;
    }
  }

  console.log("\n================================");
  console.log("📊 FINAL RESULTS");
  console.log("================================");

  if (parityPass) {
    console.log("✅ RBAC PARITY: PASS");
    console.log("   Both brands have identical RBAC behavior");
  } else {
    console.log("❌ RBAC PARITY: FAIL");
    console.log("   Brands have different RBAC behavior");
    console.log("   This indicates role normalization is broken");
  }

  process.exit(parityPass ? 0 : 1);
})();
