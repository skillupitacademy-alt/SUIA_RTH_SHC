#!/usr/bin/env tsx
/**
 * Diagnose RTH Login Issue
 * Tests different login variations to find what works
 */

async function diagnoseLogin() {
  const baseUrl = 'https://api.realtutorialhub.com';
  const email = 'admin@realtutorialhub.com';
  const password = 'admin123';

  console.log('\n🔍 Diagnosing RTH Login Issue\n');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'With platform parameter',
      body: { email, password, platform: 'realtutorialhub' }
    },
    {
      name: 'Without platform parameter',
      body: { email, password }
    },
    {
      name: 'With brand parameter',
      body: { email, password, brand: 'realtutorialhub' }
    },
    {
      name: 'With both platform and brand',
      body: { email, password, platform: 'realtutorialhub', brand: 'realtutorialhub' }
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('-'.repeat(60));
    console.log(`Request body: ${JSON.stringify(testCase.body)}`);

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.body),
      });

      console.log(`Status: ${response.status} ${response.statusText}`);

      const text = await response.text();
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log(`Response: ${text.substring(0, 200)}...`);
        
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          const tokenMatch = setCookie.match(/accessToken=([^;]+)/);
          if (tokenMatch) {
            console.log(`\n🎫 Token obtained: ${tokenMatch[1].substring(0, 50)}...`);
            console.log(`\n✅ THIS CONFIGURATION WORKS!`);
          }
        }
      } else {
        console.log('❌ FAILED');
        console.log(`Response: ${text.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnosis complete\n');
}

diagnoseLogin();
