/**
 * Manual Dashboard Reproduction Test
 * 
 * Purpose: Reproduce /dashboard failure WITHOUT Playwright
 * to capture the complete server-side stack trace.
 */

const SKILLUP_URL = 'http://skillup.localhost:3009';
const STUDENT_EMAIL = 'student@skillupitacademy.com';
const STUDENT_PASSWORD = 'Student@123';

async function testDashboard() {
  console.log('=== DASHBOARD REPRODUCTION TEST ===\n');
  
  // Step 1: Login
  console.log('[1/3] Attempting login...');
  const loginResponse = await fetch(`${SKILLUP_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
    credentials: 'include'
  });
  
  if (!loginResponse.ok) {
    console.error(`❌ Login failed: ${loginResponse.status}`);
    process.exit(1);
  }
  
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  console.log(`✅ Login successful: ${loginResponse.status}`);
  console.log(`   Cookie length: ${setCookieHeader?.length || 0}\n`);
  
  // Step 2: Verify auth
  console.log('[2/3] Verifying authentication...');
  const meResponse = await fetch(`${SKILLUP_URL}/api/auth/me`, {
    headers: { Cookie: setCookieHeader || '' },
    credentials: 'include'
  });
  
  if (!meResponse.ok) {
    console.error(`❌ Auth verification failed: ${meResponse.status}`);
    process.exit(1);
  }
  
  const user = await meResponse.json();
  console.log(`✅ Auth verified: ${meResponse.status}`);
  console.log(`   User: ${user.email}`);
  console.log(`   Onboarding: ${user.onboardingCompleted}\n`);
  
  // Step 3: Request dashboard
  console.log('[3/3] Requesting /dashboard...');
  const dashboardResponse = await fetch(`${SKILLUP_URL}/dashboard`, {
    headers: { Cookie: setCookieHeader || '' },
    credentials: 'include'
  });
  
  console.log(`\n=== DASHBOARD RESULT ===`);
  console.log(`HTTP Status: ${dashboardResponse.status}`);
  console.log(`Content-Type: ${dashboardResponse.headers.get('content-type')}`);
  
  if (dashboardResponse.ok) {
    console.log(`✅ Dashboard loaded successfully`);
    const html = await dashboardResponse.text();
    console.log(`   Response length: ${html.length} bytes`);
  } else {
    console.log(`❌ Dashboard failed`);
    const errorText = await dashboardResponse.text();
    console.log(`\n=== ERROR RESPONSE ===`);
    console.log(errorText.substring(0, 2000));
  }
}

testDashboard().catch(err => {
  console.error('\n❌ Test crashed:', err);
  process.exit(1);
});
