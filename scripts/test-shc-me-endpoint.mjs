/**
 * Test /api/auth/me endpoint
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ADMIN_URL = 'https://admin.skillhubcore.in';

console.log('🧪 Testing /api/auth/me endpoint');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Step 1: Login first
console.log('Step 1: Login');
const loginResponse = await fetch(`${ADMIN_URL}/api/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@skillhubcore.in',
    password: 'testing',
  }),
});

const loginData = await loginResponse.json();
console.log(`Login Status: ${loginResponse.status}`);
console.log(`Onboarding Completed in login: ${loginData.user?.onboardingCompleted}`);
console.log('');

// Get cookies
const cookies = loginResponse.headers.get('set-cookie');
console.log(`Cookies: ${cookies ? 'Set' : 'Not set'}`);
console.log('');

// Step 2: Call /api/auth/me
console.log('Step 2: Call /api/auth/me');
const meResponse = await fetch(`${ADMIN_URL}/api/auth/me`, {
  method: 'GET',
  headers: {
    'Cookie': cookies || '',
  },
  credentials: 'include',
});

console.log(`/api/auth/me Status: ${meResponse.status}`);

if (meResponse.ok) {
  const meData = await meResponse.json();
  console.log('Response:', JSON.stringify(meData, null, 2));
  console.log('');
  console.log(`Onboarding Completed: ${meData.user?.onboardingCompleted}`);
  
  if (meData.user?.onboardingCompleted === true) {
    console.log('✅ onboardingCompleted is TRUE - should redirect to /dashboard');
  } else {
    console.log('❌ onboardingCompleted is FALSE or missing - will redirect to /onboarding');
  }
} else {
  const errorText = await meResponse.text();
  console.log('Error:', errorText);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
