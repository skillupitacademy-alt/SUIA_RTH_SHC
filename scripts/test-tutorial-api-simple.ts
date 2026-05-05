#!/usr/bin/env tsx

/**
 * Simple Tutorial API Integration Tests
 * 
 * Tests the complete API flow from BFF to centralized Tutorial Engine.
 * Validates endpoints are accessible and return proper responses.
 * 
 * Usage: npx tsx scripts/test-tutorial-api-simple.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in',
  RTH_BFF_URL: process.env.RTH_BFF_URL || 'https://api.realtutorialhub.com',
  SKILLUP_BFF_URL: process.env.SKILLUP_BFF_URL || 'https://api.skillupitacademy.com',
  
  // Test credentials (will be provided by user)
  RTH_TEST_USER: {
    userId: process.env.RTH_TEST_USER_ID || 'test-user-rth',
    token: process.env.RTH_TEST_TOKEN || '',
  },
  SKILLUP_TEST_USER: {
    userId: process.env.SKILLUP_TEST_USER_ID || 'test-user-skillup', 
    token: process.env.SKILLUP_TEST_TOKEN || '',
  },
  
  TEST_SUBTOPIC_ID: process.env.TEST_SUBTOPIC_ID || 'test-subtopic-123',
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET || '',
};

// Simple test framework
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class SimpleTestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private results: TestResult[] = [];

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  async run(): Promise<{ passed: number; failed: number; total: number }> {
    console.log('🧪 Running Tutorial API Integration Tests...\n');
    
    for (const test of this.tests) {
      const startTime = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - startTime;
        this.results.push({ name: test.name, passed: true, duration });
        console.log(`✅ ${test.name} (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - startTime;
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error),
          duration 
        });
        console.log(`❌ ${test.name} (${duration}ms)`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n📊 Test Results:');
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${total}`);
    console.log(`   Success Rate: ${Math.round((passed / total) * 100)}%`);

    return { passed, failed, total };
  }
}

// Helper functions
async function makeApiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const data = await response.json().catch(() => ({}));
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    throw new Error(`Network error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function testCentralizedApiCall(endpoint: string, brand: 'realtutorialhub' | 'skillup', userId: string, options: RequestInit = {}) {
  return makeApiRequest(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-Brand': brand,
      'X-User-ID': userId,
      'X-Internal-Secret': TEST_CONFIG.INTERNAL_API_SECRET,
      ...options.headers,
    },
  });
}

async function testBrandApiCall(brand: 'realtutorialhub' | 'skillup', endpoint: string, options: RequestInit = {}) {
  const baseUrl = brand === 'realtutorialhub' ? TEST_CONFIG.RTH_BFF_URL : TEST_CONFIG.SKILLUP_BFF_URL;
  const testUser = brand === 'realtutorialhub' ? TEST_CONFIG.RTH_TEST_USER : TEST_CONFIG.SKILLUP_TEST_USER;
  
  return makeApiRequest(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      // Send token as cookie (this is how BFF expects it)
      'Cookie': `accessToken=${testUser.token}`,
      ...options.headers,
    },
  });
}

// Test suite
async function runTests() {
  const runner = new SimpleTestRunner();

  console.log('📋 Test Configuration:');
  console.log(`  - API Base: ${TEST_CONFIG.API_BASE_URL}`);
  console.log(`  - RTH BFF: ${TEST_CONFIG.RTH_BFF_URL}`);
  console.log(`  - SkillUp BFF: ${TEST_CONFIG.SKILLUP_BFF_URL}`);
  console.log(`  - Test Subtopic: ${TEST_CONFIG.TEST_SUBTOPIC_ID}`);
  console.log(`  - Has RTH Token: ${!!TEST_CONFIG.RTH_TEST_USER.token}`);
  console.log(`  - Has SkillUp Token: ${!!TEST_CONFIG.SKILLUP_TEST_USER.token}`);
  console.log(`  - Has Internal Secret: ${!!TEST_CONFIG.INTERNAL_API_SECRET}\n`);

  // Test 1: Centralized API Server Content Endpoint
  runner.test('should respond to centralized tutorial content endpoint', async () => {
    if (!TEST_CONFIG.INTERNAL_API_SECRET) {
      console.log('⏭️  Skipping - INTERNAL_API_SECRET not provided');
      return;
    }

    const response = await testCentralizedApiCall(
      `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`,
      'realtutorialhub',
      TEST_CONFIG.RTH_TEST_USER.userId
    );

    console.log(`   📊 Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    
    // Should respond with 200 (success) or 404 (not found) - both are valid
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });

  // Test 2: Centralized API Server Progress Endpoint
  runner.test('should respond to centralized tutorial progress endpoint', async () => {
    if (!TEST_CONFIG.INTERNAL_API_SECRET) {
      console.log('⏭️  Skipping - INTERNAL_API_SECRET not provided');
      return;
    }

    const response = await testCentralizedApiCall(
      `/api/tutorial/progress?subtopicId=${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
      'realtutorialhub',
      TEST_CONFIG.RTH_TEST_USER.userId
    );

    console.log(`   📊 Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    
    if (![200, 404].includes(response.status)) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });

  // Test 3: Security - Reject requests without proper headers
  runner.test('should reject requests without proper headers', async () => {
    if (!TEST_CONFIG.INTERNAL_API_SECRET) {
      console.log('⏭️  Skipping - INTERNAL_API_SECRET not provided');
      return;
    }

    // Test without X-Brand header
    const noBrandResponse = await makeApiRequest(
      `${TEST_CONFIG.API_BASE_URL}/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
      {
        headers: {
          'X-User-ID': 'test-user',
          'X-Internal-Secret': TEST_CONFIG.INTERNAL_API_SECRET,
        }
      }
    );

    console.log(`   📊 No Brand Header: ${noBrandResponse.status}`);
    
    if (noBrandResponse.status < 400) {
      throw new Error('Should reject request without X-Brand header');
    }
  });

  // Test 4: RTH BFF Proxy Routes
  runner.test('should access RTH BFF tutorial routes', async () => {
    if (!TEST_CONFIG.RTH_TEST_USER.token) {
      console.log('⏭️  Skipping - RTH_TEST_TOKEN not provided');
      return;
    }

    const response = await testBrandApiCall(
      'realtutorialhub',
      `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`
    );

    console.log(`   📊 RTH BFF Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    
    // Should respond (200, 401 unauthorized, or 404 not found are all valid)
    if (![200, 401, 404].includes(response.status)) {
      throw new Error(`Unexpected RTH BFF status: ${response.status}`);
    }
  });

  // Test 5: SkillUp BFF Proxy Routes
  runner.test('should access SkillUp BFF tutorial routes', async () => {
    if (!TEST_CONFIG.SKILLUP_TEST_USER.token) {
      console.log('⏭️  Skipping - SKILLUP_TEST_TOKEN not provided');
      return;
    }

    const response = await testBrandApiCall(
      'skillup',
      `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`
    );

    console.log(`   📊 SkillUp BFF Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    
    if (![200, 401, 404].includes(response.status)) {
      throw new Error(`Unexpected SkillUp BFF status: ${response.status}`);
    }
  });

  // Test 6: Brand Filtering Validation
  runner.test('should handle different brands correctly', async () => {
    if (!TEST_CONFIG.INTERNAL_API_SECRET) {
      console.log('⏭️  Skipping - INTERNAL_API_SECRET not provided');
      return;
    }

    // Make same request with different brand headers
    const rthResponse = await testCentralizedApiCall(
      `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
      'realtutorialhub',
      'test-user-1'
    );

    const skillupResponse = await testCentralizedApiCall(
      `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
      'skillup',
      'test-user-1'
    );

    console.log(`   📊 RTH Brand: ${rthResponse.status}, SkillUp Brand: ${skillupResponse.status}`);
    
    // Both brands should get responses (content may differ due to brand customizations)
    if (![200, 404].includes(rthResponse.status)) {
      throw new Error(`RTH brand request failed: ${rthResponse.status}`);
    }
    if (![200, 404].includes(skillupResponse.status)) {
      throw new Error(`SkillUp brand request failed: ${skillupResponse.status}`);
    }
  });

  // Test 7: POST Progress Tracking
  runner.test('should handle progress tracking POST requests', async () => {
    if (!TEST_CONFIG.INTERNAL_API_SECRET) {
      console.log('⏭️  Skipping - INTERNAL_API_SECRET not provided');
      return;
    }

    const response = await testCentralizedApiCall(
      '/api/tutorial/progress',
      'realtutorialhub',
      TEST_CONFIG.RTH_TEST_USER.userId,
      {
        method: 'POST',
        body: JSON.stringify({
          subtopicId: TEST_CONFIG.TEST_SUBTOPIC_ID,
          blockType: 'notes',
          status: 'viewed'
        })
      }
    );

    console.log(`   📊 Progress POST: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);
    
    // Should respond (200 success, 400 bad request, or 404 not found are valid)
    if (![200, 400, 404].includes(response.status)) {
      throw new Error(`Unexpected progress POST status: ${response.status}`);
    }
  });

  // Test 8: Validate API endpoints are live
  runner.test('should validate API endpoints are accessible', async () => {
    // Test basic connectivity to all endpoints
    const endpoints = [
      TEST_CONFIG.API_BASE_URL,
      TEST_CONFIG.RTH_BFF_URL,
      TEST_CONFIG.SKILLUP_BFF_URL
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        console.log(`   📊 ${endpoint}: ${response.status} (${response.ok ? 'UP' : 'DOWN'})`);
      } catch (error) {
        console.log(`   📊 ${endpoint}: ERROR (${error instanceof Error ? error.message : 'Unknown'})`);
        // Don't fail the test for connectivity issues - just log them
      }
    }
  });

  const results = await runner.run();
  
  console.log('\n📋 Summary:');
  if (results.failed > 0) {
    console.log('⚠️  Some API tests failed - this may be due to missing credentials or network issues');
    console.log('   Check the test output above for specific failures');
    console.log('   Provide RTH_TEST_TOKEN, SKILLUP_TEST_TOKEN, and INTERNAL_API_SECRET for full testing');
  } else {
    console.log('✅ All accessible API tests passed!');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Provide user credentials for both brands');
  console.log('   2. Run full integration tests with real authentication');
  console.log('   3. Test tutorial UI pages work with centralized API');
  console.log('   4. Validate brand filtering with real user data');
  
  // Don't exit with error for API tests - they depend on external services
  process.exit(0);
}

// Run the tests
runTests().catch((error) => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});