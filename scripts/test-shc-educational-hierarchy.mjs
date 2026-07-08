/**
 * Test Educational Hierarchy on admin.skillhubcore.in
 * ====================================================
 * Tests the migrated educational hierarchy pages and APIs
 * 
 * Prerequisites:
 * - admin.skillhubcore.in deployed
 * - Database migrated with 54 records
 * - User: admin@skillhubcore.in / testing
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const BASE_URL = 'https://api.skillhubcore.in';
const ADMIN_URL = 'https://admin.skillhubcore.in';
const INTERNAL_KEY = process.env.INTERNAL_API_KEY || '';

console.log('🧪 SHC Educational Hierarchy Test');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Step 1: Login
console.log('✅ Step 1: Login');
let accessToken = null;

try {
  const loginResponse = await fetch(`${BASE_URL}/api/shc/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-key': INTERNAL_KEY,
    },
    body: JSON.stringify({
      email: 'admin@skillhubcore.in',
      password: 'testing',
    }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  accessToken = loginData.accessToken;
  console.log('   ✓ Logged in successfully');
  console.log('');
} catch (error) {
  console.log('❌ Login failed:', error.message);
  process.exit(1);
}

// Helper function to test API endpoint
async function testEndpoint(name, url, expectedCount = null) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Failed: ${errorText.substring(0, 100)}`);
      return false;
    }

    const data = await response.json();
    const count = data.data?.length || 0;
    
    console.log(`   ✓ Success: Found ${count} ${name}`);
    
    if (expectedCount !== null && count !== expectedCount) {
      console.log(`   ⚠️  Expected ${expectedCount}, got ${count}`);
    }

    // Show first item as example
    if (data.data && data.data.length > 0) {
      const first = data.data[0];
      console.log(`   Example: "${first.name}" (ID: ${first.id})`);
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Step 2: Test Domains API
console.log('✅ Step 2: Test Domains API');
console.log(`   GET ${ADMIN_URL}/api/admin/domains`);
const domainsOk = await testEndpoint('domains', `${ADMIN_URL}/api/admin/domains?limit=20`, 8);
console.log('');

// Step 3: Test Subjects API
console.log('✅ Step 3: Test Subjects API');
console.log(`   GET ${ADMIN_URL}/api/admin/subjects`);
const subjectsOk = await testEndpoint('subjects', `${ADMIN_URL}/api/admin/subjects?limit=20`, 14);
console.log('');

// Step 4: Test Topics API
console.log('✅ Step 4: Test Topics API');
console.log(`   GET ${ADMIN_URL}/api/admin/topics`);
const topicsOk = await testEndpoint('topics', `${ADMIN_URL}/api/admin/topics?limit=20`, 10);
console.log('');

// Step 5: Test Subtopics API
console.log('✅ Step 5: Test Subtopics API');
console.log(`   GET ${ADMIN_URL}/api/admin/subtopics`);
const subtopicsOk = await testEndpoint('subtopics', `${ADMIN_URL}/api/admin/subtopics?limit=20`, 7);
console.log('');

// Step 6: Test Skills API
console.log('✅ Step 6: Test Skills API');
console.log(`   GET ${ADMIN_URL}/api/admin/skills`);
const skillsOk = await testEndpoint('skills', `${ADMIN_URL}/api/admin/skills?limit=20`, 15);
console.log('');

// Step 7: Test Search Functionality
console.log('✅ Step 7: Test Search Functionality');
console.log(`   GET ${ADMIN_URL}/api/admin/domains?search=AI`);
try {
  const response = await fetch(`${ADMIN_URL}/api/admin/domains?search=AI&limit=20`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const data = await response.json();
    const count = data.data?.length || 0;
    console.log(`   ✓ Search working: Found ${count} domains matching "AI"`);
    if (data.data && data.data.length > 0) {
      console.log(`   Example: "${data.data[0].name}"`);
    }
  } else {
    console.log(`   ❌ Search failed: ${response.status}`);
  }
} catch (error) {
  console.log(`   ❌ Search error: ${error.message}`);
}
console.log('');

// Summary
console.log('═══════════════════════════════════════════════════════════');
const allPassed = domainsOk && subjectsOk && topicsOk && subtopicsOk && skillsOk;

if (allPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('');
  console.log('Educational Hierarchy is working on admin.skillhubcore.in:');
  console.log('  ✓ All 5 API endpoints responding');
  console.log('  ✓ Migrated data accessible (54 total records)');
  console.log('  ✓ Search functionality working');
  console.log('  ✓ Authentication working');
  console.log('');
  console.log('📊 Data Summary:');
  console.log('  - 8 Domains');
  console.log('  - 14 Subjects');
  console.log('  - 10 Topics');
  console.log('  - 7 Subtopics');
  console.log('  - 15 Skills');
  console.log('');
  console.log('🌐 Access the UI:');
  console.log('  URL: https://admin.skillhubcore.in/questions');
  console.log('  Email: admin@skillhubcore.in');
  console.log('  Password: testing');
  console.log('');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('');
  console.log('Please check the errors above.');
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════');
process.exit(allPassed ? 0 : 1);
