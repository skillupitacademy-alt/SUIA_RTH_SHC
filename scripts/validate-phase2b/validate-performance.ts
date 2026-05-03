/**
 * Performance Validation
 * =======================
 * Validates:
 * - Endpoint latency
 * - Concurrent request handling
 * - Database query performance
 * - Rate limit performance
 * - Response time consistency
 */

import { getAdminToken } from './get-admin-token';

interface ValidationResult {
  passed: boolean;
  score: number;
  tests: number;
  failures: number;
  warnings: string[];
  errors: string[];
  duration: number;
}

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export async function validatePerformance(): Promise<ValidationResult> {
  const startTime = Date.now();
  const tests: TestResult[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const baseUrl = process.env.API_BASE_URL || process.env.GATEWAY_URL || 'https://api.realtutorialhub.com';
  let adminToken: string | null | undefined = process.env.TEST_ADMIN_TOKEN;
  
  // If no token provided, try to login and get one
  if (!adminToken) {
    adminToken = await getAdminToken(baseUrl);
  }

  if (!adminToken) {
    console.log('     ⚠️  TEST_ADMIN_TOKEN not set - skipping performance tests');
    return {
      passed: true,
      score: 50,
      tests: 0,
      failures: 0,
      warnings: ['Performance tests skipped - no admin token provided'],
      errors: [],
      duration: Date.now() - startTime,
    };
  }

  // Test 1: Single Request Latency
  console.log('  🔍 Testing single request latency...');
  try {
    const requestStart = Date.now();
    const response = await fetch(`${baseUrl}/api/admin/layman/sections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    const requestDuration = Date.now() - requestStart;

    if (response.ok && requestDuration < 2000) {
      tests.push({ 
        name: 'Single Request Latency', 
        passed: true, 
        duration: requestDuration 
      });
      console.log(`     ✅ Single request latency: ${requestDuration}ms (< 2000ms)`);
    } else if (response.ok) {
      throw new Error(`Latency too high: ${requestDuration}ms`);
    } else {
      throw new Error(`Request failed: ${response.status}`);
    }
  } catch (error) {
    tests.push({ name: 'Single Request Latency', passed: false, error: String(error) });
    warnings.push(`Single request latency test failed: ${error}`);
  }

  // Test 2: Concurrent Request Handling
  console.log('  🔍 Testing concurrent request handling...');
  try {
    const concurrentRequests = 10;
    const requestStart = Date.now();

    const requests = Array.from({ length: concurrentRequests }, () =>
      fetch(`${baseUrl}/api/admin/layman/sections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })
    );

    const responses = await Promise.all(requests);
    const requestDuration = Date.now() - requestStart;

    const allSuccessful = responses.every(r => r.ok);
    const avgLatency = requestDuration / concurrentRequests;

    if (allSuccessful && requestDuration < 5000) {
      tests.push({ 
        name: 'Concurrent Request Handling', 
        passed: true, 
        duration: requestDuration 
      });
      console.log(`     ✅ ${concurrentRequests} concurrent requests: ${requestDuration}ms (avg: ${avgLatency.toFixed(0)}ms)`);
    } else if (allSuccessful) {
      throw new Error(`Concurrent requests too slow: ${requestDuration}ms`);
    } else {
      const failures = responses.filter(r => !r.ok).length;
      throw new Error(`${failures}/${concurrentRequests} requests failed`);
    }
  } catch (error) {
    tests.push({ name: 'Concurrent Request Handling', passed: false, error: String(error) });
    warnings.push(`Concurrent request test failed: ${error}`);
  }

  // Test 3: Review Queue Performance
  console.log('  🔍 Testing review queue performance...');
  try {
    const requestStart = Date.now();
    const response = await fetch(`${baseUrl}/api/admin/layman/review/queue`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    const requestDuration = Date.now() - requestStart;

    if (response.ok && requestDuration < 3000) {
      tests.push({ 
        name: 'Review Queue Performance', 
        passed: true, 
        duration: requestDuration 
      });
      console.log(`     ✅ Review queue latency: ${requestDuration}ms (< 3000ms)`);
    } else if (response.ok) {
      throw new Error(`Review queue too slow: ${requestDuration}ms`);
    } else {
      throw new Error(`Request failed: ${response.status}`);
    }
  } catch (error) {
    tests.push({ name: 'Review Queue Performance', passed: false, error: String(error) });
    warnings.push(`Review queue performance test failed: ${error}`);
  }

  // Test 4: Response Time Consistency
  console.log('  🔍 Testing response time consistency...');
  try {
    const iterations = 5;
    const latencies: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const requestStart = Date.now();
      const response = await fetch(`${baseUrl}/api/admin/layman/sections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      const requestDuration = Date.now() - requestStart;

      if (response.ok) {
        latencies.push(requestDuration);
      }
    }

    if (latencies.length === iterations) {
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      const variance = maxLatency - minLatency;

      // Consistency check: variance should be reasonable
      if (variance < 1000) {
        tests.push({ 
          name: 'Response Time Consistency', 
          passed: true, 
          duration: Math.round(avgLatency) 
        });
        console.log(`     ✅ Response time consistent: avg ${avgLatency.toFixed(0)}ms, variance ${variance}ms`);
      } else {
        throw new Error(`High variance: ${variance}ms (max: ${maxLatency}ms, min: ${minLatency}ms)`);
      }
    } else {
      throw new Error(`Only ${latencies.length}/${iterations} requests succeeded`);
    }
  } catch (error) {
    tests.push({ name: 'Response Time Consistency', passed: false, error: String(error) });
    warnings.push(`Response time consistency test failed: ${error}`);
  }

  // Test 5: Rate Limit Performance
  console.log('  🔍 Testing rate limit performance...');
  try {
    const requestStart = Date.now();
    
    // Make requests until rate limited
    let requestCount = 0;
    let rateLimited = false;

    while (!rateLimited && requestCount < 120) {
      const response = await fetch(`${baseUrl}/api/admin/layman/sections`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      requestCount++;
      if (response.status === 429) {
        rateLimited = true;
      }
    }

    const requestDuration = Date.now() - requestStart;

    if (rateLimited) {
      tests.push({ 
        name: 'Rate Limit Performance', 
        passed: true, 
        duration: requestDuration 
      });
      console.log(`     ✅ Rate limit triggered after ${requestCount} requests in ${requestDuration}ms`);
    } else {
      throw new Error(`Rate limit not triggered after ${requestCount} requests`);
    }
  } catch (error) {
    tests.push({ name: 'Rate Limit Performance', passed: false, error: String(error) });
    warnings.push(`Rate limit performance test failed: ${error}`);
  }

  // Test 6: Payload Size Handling
  console.log('  🔍 Testing payload size handling...');
  try {
    const largePayload = {
      topicName: 'A'.repeat(1000),
      subtopicName: 'B'.repeat(1000),
      subtopicId: 'test-id',
      brandId: 'realtutorialhub',
    };

    const requestStart = Date.now();
    const response = await fetch(`${baseUrl}/api/admin/layman/prompt/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(largePayload),
    });
    const requestDuration = Date.now() - requestStart;

    // Should handle large payload (either accept or reject quickly)
    if (requestDuration < 3000) {
      tests.push({ 
        name: 'Payload Size Handling', 
        passed: true, 
        duration: requestDuration 
      });
      console.log(`     ✅ Large payload handled in ${requestDuration}ms`);
    } else {
      throw new Error(`Large payload handling too slow: ${requestDuration}ms`);
    }
  } catch (error) {
    tests.push({ name: 'Payload Size Handling', passed: false, error: String(error) });
    warnings.push(`Payload size handling test failed: ${error}`);
  }

  // Calculate results
  const duration = Date.now() - startTime;
  const failures = tests.filter(t => !t.passed).length;
  const passed = failures <= 1; // Allow 1 failure for performance tests
  const score = tests.length > 0 
    ? Math.round(((tests.length - failures) / tests.length) * 100)
    : 0;

  return {
    passed,
    score,
    tests: tests.length,
    failures,
    warnings,
    errors,
    duration,
  };
}
