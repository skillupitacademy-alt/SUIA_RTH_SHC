/**
 * SHC Admin Cookie Test
 * =====================
 * Tests cookie handling after login
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ADMIN_URL = 'https://admin.skillhubcore.in';
const LOGIN_EMAIL = 'admin@skillhubcore.in';
const LOGIN_PASSWORD = 'testing';

console.log('🍪 SHC Admin Cookie Test');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

async function runTest() {
  try {
    // Step 1: Login
    console.log('✅ Step 1: Login');
    const loginResponse = await fetch(`${ADMIN_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand': 'skillhubcore',
      },
      body: JSON.stringify({
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD,
        platform: 'skillhubcore',
      }),
      credentials: 'include',
    });

    console.log(`   Status: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log(`   ✓ Login successful`);
    console.log(`   User: ${loginData.user.email}`);
    console.log(`   Onboarding Completed: ${loginData.user.onboardingCompleted}`);
    console.log('');

    // Extract cookies from response
    const setCookieHeaders = [];
    loginResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        setCookieHeaders.push(value);
      }
    });
    
    console.log('📋 Cookies set by login:');
    if (setCookieHeaders.length === 0) {
      console.log('   ⚠️  No cookies found in response!');
    } else {
      setCookieHeaders.forEach((cookie, index) => {
        const cookieName = cookie.split('=')[0];
        const hasSecure = cookie.includes('Secure');
        const hasSameSite = cookie.includes('SameSite');
        const domain = cookie.match(/Domain=([^;]+)/)?.[1];
        const path = cookie.match(/Path=([^;]+)/)?.[1];
        
        console.log(`   ${index + 1}. ${cookieName}`);
        console.log(`      Domain: ${domain || 'not set'}`);
        console.log(`      Path: ${path || '/'}`);
        console.log(`      Secure: ${hasSecure}`);
        console.log(`      SameSite: ${hasSameSite ? cookie.match(/SameSite=([^;]+)/)?.[1] : 'not set'}`);
      });
    }
    console.log('');

    // Build cookie header for next request
    const cookieHeader = setCookieHeaders
      .map(cookie => cookie.split(';')[0]) // Get just the name=value part
      .join('; ');

    console.log('🔑 Cookie header for next request:');
    console.log(`   ${cookieHeader.substring(0, 100)}...`);
    console.log('');

    // Step 2: Call /api/auth/me with cookies
    console.log('✅ Step 2: Call /api/auth/me with cookies');
    const meResponse = await fetch(`${ADMIN_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    console.log(`   Status: ${meResponse.status}`);
    console.log(`   Status Text: ${meResponse.statusText}`);
    console.log('');

    if (meResponse.status === 401) {
      console.log('   ❌ Unauthorized - cookies not working!');
      const errorText = await meResponse.text();
      console.log(`   Error: ${errorText}`);
      console.log('');
      throw new Error('Auth validation failed with 401');
    }

    if (!meResponse.ok) {
      throw new Error(`/api/auth/me failed: ${meResponse.status}`);
    }

    const meData = await meResponse.json();
    console.log('   ✅ Auth validation successful!');
    console.log(`   User: ${meData.user.email}`);
    console.log(`   Onboarding Completed: ${meData.user.onboardingCompleted}`);
    console.log('');

    // Step 3: Call /api/auth/me WITHOUT explicit cookies (browser behavior)
    console.log('✅ Step 3: Call /api/auth/me without explicit cookies (simulating browser)');
    const meResponse2 = await fetch(`${ADMIN_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include', // This should send cookies automatically
    });

    console.log(`   Status: ${meResponse2.status}`);
    console.log('');

    if (meResponse2.status === 401) {
      console.log('   ❌ Unauthorized - browser cookies not working!');
      console.log('   This explains why the redirect fails!');
      console.log('');
    } else {
      console.log('   ✅ Browser cookies working!');
      const meData2 = await meResponse2.json();
      console.log(`   Onboarding Completed: ${meData2.user.onboardingCompleted}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎉 TEST COMPLETE!');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ TEST FAILED!');
    console.log('');
    console.log(`Error: ${error.message}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    throw error;
  }
}

// Run the test
runTest()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
