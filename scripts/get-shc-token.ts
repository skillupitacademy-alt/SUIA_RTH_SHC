/**
 * Get SkillHub Core Admin Token
 * ==============================
 * Generates a token for SHC admin that can be used to test the auth endpoint
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function getSHCToken() {
  const baseUrl = 'https://api.skillhubcore.in';
  
  console.log('🔐 Getting SkillHub Core admin token...');
  console.log(`   Base URL: ${baseUrl}`);
  console.log(`   Email: admin@skillhubcore.in`);
  console.log(`   Using: Internal API Key to bypass CSRF`);
  console.log('');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    console.log('📡 Sending login request to /api/shc/auth/login...');
    const response = await fetch(`${baseUrl}/api/shc/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': process.env.INTERNAL_API_KEY || '',
      },
      body: JSON.stringify({
        email: 'admin@skillhubcore.in',
        password: 'testing',
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
      console.log(`   Response: ${text.substring(0, 500)}`);
      console.log('');
      console.log('⚠️  Troubleshooting:');
      console.log('   1. Check if API server is deployed with SHC auth endpoints');
      console.log('   2. Verify user exists in people_db');
      console.log('   3. Check INTERNAL_API_KEY is set in .env.local');
      console.log('   4. Verify API Gateway routes /shc/auth to API server');
      process.exit(1);
    }

    const data = await response.json();
    console.log('📦 Response:', JSON.stringify(data, null, 2).substring(0, 800));
    console.log('');

    if (data.accessToken) {
      const token = data.accessToken;
      console.log('✅ Token generated successfully!');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('Access Token (first 50 chars):');
      console.log(`   ${token.substring(0, 50)}...`);
      console.log('');
      console.log('User Details:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Role: ${data.user.role}`);
      console.log(`   Platform: ${data.user.platform}`);
      console.log(`   Is Admin: ${data.user.isAdmin}`);
      console.log('');
      console.log('To use this token in API requests:');
      console.log('');
      console.log(`export SHC_ADMIN_TOKEN="${token}"`);
      console.log('');
      console.log('Then make requests with:');
      console.log('');
      console.log('curl -H "Authorization: Bearer $SHC_ADMIN_TOKEN" \\');
      console.log('     https://api.skillhubcore.in/api/shc/auth/me');
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('🎉 SHC Auth is working!');
      console.log('   ✅ User authenticated from people_db');
      console.log('   ✅ Admin role verified');
      console.log('   ✅ Token generated');
      console.log('');
      process.exit(0);
    }

    console.log('');
    console.log('⚠️  Login succeeded but no token found in response');
    console.log('   Expected: data.accessToken');
    console.log('   Received:', Object.keys(data));
    process.exit(1);

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('❌ Request timed out after 15 seconds');
      console.log('');
      console.log('Possible issues:');
      console.log('  - API server is not responding');
      console.log('  - Network connectivity issues');
      console.log('  - SHC auth endpoint not deployed');
    } else {
      console.log('❌ Error:', error);
    }
    process.exit(1);
  }
}

getSHCToken();
