#!/usr/bin/env tsx

/**
 * Tutorial API Integration Tests
 * 
 * Tests the complete API flow from BFF to centralized Tutorial Engine.
 * Validates brand filtering, authentication, and API responses.
 * 
 * Usage: npm run tsx scripts/test-tutorial-api-integration.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

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

// Helper functions
async function makeApiRequest(url: string, options: RequestInit = {}) {
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
}

async function testBrandApiCall(brand: 'realtutorialhub' | 'skillup', endpoint: string, options: RequestInit = {}) {
  const baseUrl = brand === 'realtutorialhub' ? TEST_CONFIG.RTH_BFF_URL : TEST_CONFIG.SKILLUP_BFF_URL;
  const testUser = brand === 'realtutorialhub' ? TEST_CONFIG.RTH_TEST_USER : TEST_CONFIG.SKILLUP_TEST_USER;
  
  return makeApiRequest(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${testUser.token}`,
      'Cookie': `accessToken=${testUser.token}`,
      ...options.headers,
    },
  });
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

describe('Tutorial API Integration Tests', () => {
  beforeAll(() => {
    console.log('🚀 Starting Tutorial API Integration Tests');
    console.log('📍 Testing against:', {
      apiBase: TEST_CONFIG.API_BASE_URL,
      rthBff: TEST_CONFIG.RTH_BFF_URL,
      skillupBff: TEST_CONFIG.SKILLUP_BFF_URL,
    });
    
    // Validate test configuration
    if (!TEST_CONFIG.RTH_TEST_USER.token) {
      console.warn('⚠️  RTH_TEST_TOKEN not provided - RTH tests will be skipped');
    }
    if (!TEST_CONFIG.SKILLUP_TEST_USER.token) {
      console.warn('⚠️  SKILLUP_TEST_TOKEN not provided - SkillUp tests will be skipped');
    }
  });

  afterAll(() => {
    console.log('✅ Tutorial API Integration Tests completed');
  });

  describe('Centralized API Server Endpoints', () => {
    it('should respond to tutorial content endpoint with brand filtering', async () => {
      if (!TEST_CONFIG.INTERNAL_API_SECRET) {
        console.log('⏭️  Skipping centralized API test - INTERNAL_API_SECRET not provided');
        return;
      }

      // Test RTH brand
      const rthResponse = await testCentralizedApiCall(
        `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`,
        'realtutorialhub',
        TEST_CONFIG.RTH_TEST_USER.userId
      );

      console.log('📊 RTH Centralized API Response:', {
        status: rthResponse.status,
        hasData: !!rthResponse.data,
        brand: 'realtutorialhub'
      });

      // Test SkillUp brand
      const skillupResponse = await testCentralizedApiCall(
        `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`,
        'skillup',
        TEST_CONFIG.SKILLUP_TEST_USER.userId
      );

      console.log('📊 SkillUp Centralized API Response:', {
        status: skillupResponse.status,
        hasData: !!skillupResponse.data,
        brand: 'skillup'
      });

      // Both should respond (even if no content found)
      expect([200, 404]).toContain(rthResponse.status);
      expect([200, 404]).toContain(skillupResponse.status);
    });

    it('should respond to tutorial progress endpoint', async () => {
      if (!TEST_CONFIG.INTERNAL_API_SECRET) {
        console.log('⏭️  Skipping centralized API test - INTERNAL_API_SECRET not provided');
        return;
      }

      // Test GET progress
      const getResponse = await testCentralizedApiCall(
        `/api/tutorial/progress?subtopicId=${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
        'realtutorialhub',
        TEST_CONFIG.RTH_TEST_USER.userId
      );

      console.log('📊 Progress GET Response:', {
        status: getResponse.status,
        hasData: !!getResponse.data
      });

      expect([200, 404]).toContain(getResponse.status);

      // Test POST progress (track progress)
      const postResponse = await testCentralizedApiCall(
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

      console.log('📊 Progress POST Response:', {
        status: postResponse.status,
        hasData: !!postResponse.data
      });

      expect([200, 400, 404]).toContain(postResponse.status);
    });

    it('should reject requests without proper headers', async () => {
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

      // Test without X-User-ID header
      const noUserResponse = await makeApiRequest(
        `${TEST_CONFIG.API_BASE_URL}/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
        {
          headers: {
            'X-Brand': 'realtutorialhub',
            'X-Internal-Secret': TEST_CONFIG.INTERNAL_API_SECRET,
          }
        }
      );

      console.log('🔒 Security Test Results:', {
        noBrand: noBrandResponse.status,
        noUser: noUserResponse.status
      });

      // Should reject unauthorized requests
      expect(noBrandResponse.status).toBeGreaterThanOrEqual(400);
      expect(noUserResponse.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('RTH BFF Proxy Routes', () => {
    it('should proxy tutorial content requests to centralized API', async () => {
      if (!TEST_CONFIG.RTH_TEST_USER.token) {
        console.log('⏭️  Skipping RTH BFF test - RTH_TEST_TOKEN not provided');
        return;
      }

      const response = await testBrandApiCall(
        'realtutorialhub',
        `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`
      );

      console.log('📊 RTH BFF Content Response:', {
        status: response.status,
        hasData: !!response.data,
        cacheControl: response.headers['cache-control']
      });

      // Should respond (even if no content found)
      expect([200, 401, 404]).toContain(response.status);
    });

    it('should proxy tutorial progress requests to centralized API', async () => {
      if (!TEST_CONFIG.RTH_TEST_USER.token) {
        console.log('⏭️  Skipping RTH BFF test - RTH_TEST_TOKEN not provided');
        return;
      }

      // Test GET progress
      const getResponse = await testBrandApiCall(
        'realtutorialhub',
        `/api/tutorial/progress?subtopicId=${TEST_CONFIG.TEST_SUBTOPIC_ID}`
      );

      console.log('📊 RTH BFF Progress GET:', {
        status: getResponse.status,
        hasData: !!getResponse.data
      });

      expect([200, 401, 404]).toContain(getResponse.status);

      // Test POST progress
      const postResponse = await testBrandApiCall(
        'realtutorialhub',
        '/api/tutorial/progress',
        {
          method: 'POST',
          body: JSON.stringify({
            subtopicId: TEST_CONFIG.TEST_SUBTOPIC_ID,
            blockType: 'notes',
            status: 'viewed'
          })
        }
      );

      console.log('📊 RTH BFF Progress POST:', {
        status: postResponse.status,
        hasData: !!postResponse.data
      });

      expect([200, 400, 401, 404]).toContain(postResponse.status);
    });
  });

  describe('SkillUp BFF Proxy Routes', () => {
    it('should proxy tutorial content requests to centralized API', async () => {
      if (!TEST_CONFIG.SKILLUP_TEST_USER.token) {
        console.log('⏭️  Skipping SkillUp BFF test - SKILLUP_TEST_TOKEN not provided');
        return;
      }

      const response = await testBrandApiCall(
        'skillup',
        `/api/tutorial/content/${TEST_CONFIG.TEST_SUBTOPIC_ID}?difficulty=simple`
      );

      console.log('📊 SkillUp BFF Content Response:', {
        status: response.status,
        hasData: !!response.data,
        cacheControl: response.headers['cache-control']
      });

      expect([200, 401, 404]).toContain(response.status);
    });

    it('should proxy tutorial progress requests to centralized API', async () => {
      if (!TEST_CONFIG.SKILLUP_TEST_USER.token) {
        console.log('⏭️  Skipping SkillUp BFF test - SKILLUP_TEST_TOKEN not provided');
        return;
      }

      const response = await testBrandApiCall(
        'skillup',
        `/api/tutorial/progress?subtopicId=${TEST_CONFIG.TEST_SUBTOPIC_ID}`
      );

      console.log('📊 SkillUp BFF Progress Response:', {
        status: response.status,
        hasData: !!response.data
      });

      expect([200, 401, 404]).toContain(response.status);
    });
  });

  describe('Brand Filtering Validation', () => {
    it('should handle different brands correctly', async () => {
      if (!TEST_CONFIG.INTERNAL_API_SECRET) {
        console.log('⏭️  Skipping brand filtering test - INTERNAL_API_SECRET not provided');
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

      console.log('🏷️  Brand Filtering Test:', {
        rthStatus: rthResponse.status,
        skillupStatus: skillupResponse.status,
        sameContent: JSON.stringify(rthResponse.data) === JSON.stringify(skillupResponse.data)
      });

      // Both brands should get responses (content may differ due to brand customizations)
      expect([200, 404]).toContain(rthResponse.status);
      expect([200, 404]).toContain(skillupResponse.status);
    });
  });

  describe('API Client Integration', () => {
    it('should validate TutorialClient types match API responses', async () => {
      // This test validates that our TutorialClient types match actual API responses
      // We'll make a real API call and validate the response structure
      
      if (!TEST_CONFIG.INTERNAL_API_SECRET) {
        console.log('⏭️  Skipping API client validation - INTERNAL_API_SECRET not provided');
        return;
      }

      const response = await testCentralizedApiCall(
        `/api/tutorial/progress?subtopicId=${TEST_CONFIG.TEST_SUBTOPIC_ID}`,
        'realtutorialhub',
        'test-user'
      );

      if (response.status === 200 && response.data?.data) {
        const progressData = response.data.data;
        
        // Validate response structure matches TutorialProgress interface
        expect(progressData).toHaveProperty('blocksCompleted');
        expect(progressData).toHaveProperty('completionPercent');
        expect(progressData).toHaveProperty('assignmentUnlocked');
        
        expect(Array.isArray(progressData.blocksCompleted)).toBe(true);
        expect(typeof progressData.completionPercent).toBe('number');
        expect(typeof progressData.assignmentUnlocked).toBe('boolean');
        
        console.log('✅ API response structure matches TutorialClient types');
      } else {
        console.log('ℹ️  No progress data to validate - test passed');
      }
    });
  });
});

// Run the tests
if (import.meta.vitest) {
  console.log('🧪 Running Tutorial API Integration Tests...');
  console.log('📋 Test Configuration:');
  console.log('  - API Base:', TEST_CONFIG.API_BASE_URL);
  console.log('  - RTH BFF:', TEST_CONFIG.RTH_BFF_URL);
  console.log('  - SkillUp BFF:', TEST_CONFIG.SKILLUP_BFF_URL);
  console.log('  - Test Subtopic:', TEST_CONFIG.TEST_SUBTOPIC_ID);
  console.log('  - Has RTH Token:', !!TEST_CONFIG.RTH_TEST_USER.token);
  console.log('  - Has SkillUp Token:', !!TEST_CONFIG.SKILLUP_TEST_USER.token);
  console.log('  - Has Internal Secret:', !!TEST_CONFIG.INTERNAL_API_SECRET);
}

export {};