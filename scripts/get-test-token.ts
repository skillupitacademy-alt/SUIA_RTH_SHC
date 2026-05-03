/**
 * Get Test Admin Token
 * ====================
 * Attempts to login and retrieve an admin token for testing
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function getToken() {
  const baseUrl = process.env.GATEWAY_URL || 'https://api.realtutorialhub.com';
  
  console.log('🔐 Attempting to get admin token...');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Email: admin@realtutorialhub.com`);
  console.log('');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log('📡 Sending login request...');
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portal-identity': 'admin', // Request admin audience token
      },
      body: JSON.stringify({
        email: 'admin@realtutorialhub.com',
        password: 'admin123',
        platform: 'realtutorialhub',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`   Response status: ${response.status}`);
    console.log('');

    if (!response.ok) {
      console.log('❌ Login failed');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
      process.exit(1);
    }

    // Try to extract token from Set-Cookie header
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log('🍪 Set-Cookie header found');
      const match = setCookie.match(/accessToken=([^;]+)/);
      if (match) {
        const token = match[1];
        console.log('');
        console.log('✅ Token extracted from cookie!');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('To use this token, run:');
        console.log('');
        console.log(`export TEST_ADMIN_TOKEN="${token}"`);
        console.log('');
        console.log('Then run the full validation:');
        console.log('npx tsx scripts/validate-phase2b.ts');
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        process.exit(0);
      }
    }

    // Try to extract from response body
    const data = await response.json();
    console.log('📦 Response body:', JSON.stringify(data, null, 2).substring(0, 500));

    if (data.accessToken || data.token) {
      const token = data.accessToken || data.token;
      console.log('');
      console.log('✅ Token extracted from response body!');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('To use this token, run:');
      console.log('');
      console.log(`export TEST_ADMIN_TOKEN="${token}"`);
      console.log('');
      console.log('Then run the full validation:');
      console.log('npx tsx scripts/validate-phase2b.ts');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      process.exit(0);
    }

    console.log('');
    console.log('⚠️  Login succeeded but no token found in response');
    console.log('   Check if the auth endpoint returns tokens in a different format');
    process.exit(1);

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('❌ Request timed out after 15 seconds');
      console.log('');
      console.log('Possible issues:');
      console.log('  - API server is not responding');
      console.log('  - Network connectivity issues');
      console.log('  - Auth endpoint is slow or hanging');
    } else {
      console.log('❌ Error:', error);
    }
    process.exit(1);
  }
}

getToken();
