#!/usr/bin/env tsx
async function test() {
  const response = await fetch('https://api.realtutorialhub.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@skillhubcore.in',
      password: 'testing',
      platform: 'skillhubcore',
    }),
  });

  console.log(`Status: ${response.status}`);
  if (response.ok) {
    const data = await response.json();
    console.log('✅ LOGIN SUCCESS via RTH gateway');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED:', await response.text());
  }
}
test();
