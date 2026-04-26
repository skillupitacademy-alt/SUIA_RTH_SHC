#!/usr/bin/env node

/**
 * 🔐 COMPREHENSIVE SECURITY TEST SUITE
 * 
 * Runs all security tests to validate multi-brand auth system.
 * This should be run before every deployment.
 * 
 * Tests:
 * 1. Cookie domain correctness (prevents redirect loops)
 * 2. RBAC parity (ensures both brands behave identically)
 * 3. Cookie flow (validates backend requires cookies)
 * 
 * Exit code 0 = all tests pass
 * Exit code 1 = one or more tests failed
 */

const { spawn } = require('child_process');
const path = require('path');

const TESTS = [
  {
    name: "Cookie Domain Test",
    script: "test-cookie-domain.js",
    description: "Validates cookies use correct domain per brand",
  },
  {
    name: "RBAC Parity Test",
    script: "validate-rbac-parity.js",
    description: "Ensures both brands have identical RBAC behavior",
  },
  {
    name: "Cookie Flow Test",
    script: "../test-cookie-flow.js",
    description: "Validates backend correctly requires cookies",
  },
];

function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🧪 Running: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`${"=".repeat(60)}\n`);

    const scriptPath = path.join(__dirname, test.script);
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('close', (code) => {
      resolve({
        name: test.name,
        passed: code === 0,
      });
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to run test: ${error.message}`);
      resolve({
        name: test.name,
        passed: false,
      });
    });
  });
}

(async () => {
  console.log("🔐 COMPREHENSIVE SECURITY TEST SUITE");
  console.log("====================================\n");
  console.log(`Running ${TESTS.length} security tests...\n`);

  const results = [];

  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 FINAL RESULTS");
  console.log(`${"=".repeat(60)}\n`);

  let allPassed = true;

  for (const result of results) {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${result.name}`);
    
    if (!result.passed) {
      allPassed = false;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  
  if (allPassed) {
    console.log("✅ ALL SECURITY TESTS PASSED");
    console.log("   System is ready for deployment");
  } else {
    console.log("❌ SOME SECURITY TESTS FAILED");
    console.log("   Fix issues before deploying");
  }
  
  console.log(`${"=".repeat(60)}\n`);

  process.exit(allPassed ? 0 : 1);
})();
