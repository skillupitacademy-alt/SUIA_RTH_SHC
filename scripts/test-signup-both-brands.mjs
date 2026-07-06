/**
 * Test signup for both RTH and SkillUp brands
 * Verifies that the 'student' role is properly assigned
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000/api';

async function testSignup(brand, apiUrl) {
  const timestamp = Date.now();
  const email = `test-signup-${timestamp}@${brand}.com`;
  const password = 'TestPassword123!';
  const name = `Test User ${brand}`;
  
  console.log(`\n🧪 Testing signup for ${brand.toUpperCase()}`);
  console.log(`   Email: ${email}`);
  console.log(`   API: ${apiUrl}`);
  
  try {
    // Test signup
    const signupResponse = await fetch(`${apiUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });
    
    if (!signupResponse.ok) {
      const errorText = await signupResponse.text();
      console.error(`   ❌ Signup failed (${signupResponse.status}):`, errorText);
      return false;
    }
    
    const signupData = await signupResponse.json();
    console.log(`   ✅ Signup successful`);
    console.log(`   User ID: ${signupData.id}`);
    
    // Try to login to verify user was created properly
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error(`   ❌ Login failed (${loginResponse.status}):`, errorText);
      return false;
    }
    
    const loginData = await loginResponse.json();
    console.log(`   ✅ Login successful`);
    console.log(`   Access token received: ${loginData.accessToken ? 'Yes' : 'No'}`);
    
    // Get user profile to check role
    const profileResponse = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`,
      },
    });
    
    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error(`   ❌ Profile fetch failed (${profileResponse.status}):`, errorText);
      return false;
    }
    
    const profileData = await profileResponse.json();
    console.log(`   ✅ Profile fetched`);
    console.log(`   Role: ${profileData.role}`);
    console.log(`   Is onboarded: ${profileData.isOnboarded}`);
    
    if (profileData.role !== 'student') {
      console.error(`   ❌ Expected role 'student' but got '${profileData.role}'`);
      return false;
    }
    
    console.log(`   ✅ All checks passed for ${brand.toUpperCase()}!`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing signup for both brands...');
  console.log('=====================================');
  
  const rthResult = await testSignup('rth', API_URL);
  const skillupResult = await testSignup('skillup', API_URL);
  
  console.log('\n=====================================');
  console.log('📊 Test Results:');
  console.log(`   RTH: ${rthResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   SkillUp: ${skillupResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (rthResult && skillupResult) {
    console.log('\n✅ All tests passed! Signup works for both brands.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
