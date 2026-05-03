/**
 * Debug Security Test Failures
 * =============================
 * Test the failing security endpoints to see actual error responses
 */

async function loginAndGetToken(): Promise<string | null> {
  const baseUrl = 'https://api.realtutorialhub.com';
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@realtutorialhub.com',
        password: 'admin123',
        platform: 'realtutorialhub',
      }),
    });

    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      const match = setCookieHeader.match(/accessToken=([^;]+)/);
      if (match) return match[1];
    }
  } catch (error) {
    console.log('Login error:', error);
  }
  return null;
}

async function testSecurityEndpoints() {
  console.log('🔐 Getting fresh token...\n');
  const token = await loginAndGetToken();
  
  if (!token) {
    console.log('❌ Failed to get token');
    return;
  }

  const baseUrl = 'https://api.realtutorialhub.com';

  // Test 1: XSS Prevention
  console.log('Test 1: XSS Prevention');
  console.log('='.repeat(60));
  try {
    const xssPayload = {
      rawAIResponse: '<script>alert("XSS")</script><p>Normal content</p>',
      subtopicId: 'test-id',
      brandId: 'realtutorialhub',
    };

    const response = await fetch(`${baseUrl}/api/admin/layman/content/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(xssPayload),
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.log('Error:', error);
  }

  console.log('\n');

  // Test 2: SQL Injection Prevention
  console.log('Test 2: SQL Injection Prevention');
  console.log('='.repeat(60));
  try {
    const sqlPayload = {
      topicName: "'; DROP TABLE tutorial_sections; --",
      subtopicName: "test",
      subtopicId: "test-id",
      brandId: "realtutorialhub",
    };

    const response = await fetch(`${baseUrl}/api/admin/layman/prompt/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sqlPayload),
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.log('Error:', error);
  }

  console.log('\n');

  // Test 3: Oversized Payload
  console.log('Test 3: Oversized Payload (10MB)');
  console.log('='.repeat(60));
  try {
    const largePayload = {
      rawAIResponse: 'A'.repeat(10 * 1024 * 1024), // 10MB
      subtopicId: 'test-id',
      brandId: 'realtutorialhub',
    };

    const response = await fetch(`${baseUrl}/api/admin/layman/content/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(largePayload),
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.log('Error:', error);
  }
}

testSecurityEndpoints();
