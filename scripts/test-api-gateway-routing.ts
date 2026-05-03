#!/usr/bin/env tsx
/**
 * Test API Gateway Routing
 * Tests if the gateway is routing RTH requests correctly
 */

async function testGatewayRouting() {
  const baseUrl = 'https://api.realtutorialhub.com';
  
  console.log('\n🔍 Testing API Gateway Routing\n');
  console.log('='.repeat(70));
  console.log(`Base URL: ${baseUrl}\n`);

  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/health`,
      method: 'GET',
      headers: {},
    },
    {
      name: 'RTH Login (with all headers)',
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand': 'realtutorialhub',
        'Origin': 'https://admin.realtutorialhub.com',
      },
      body: {
        email: 'admin@realtutorialhub.com',
        password: 'admin123',
        platform: 'realtutorialhub',
      },
    },
    {
      name: 'SkillUp Login (with all headers)',
      url: `${baseUrl}/api/auth/login`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-brand': 'skillup',
        'Origin': 'https://admin.skillupitacademy.com',
      },
      body: {
        email: 'admin@skillupitacademy.com',
        password: 'admin123',
        platform: 'skillup',
      },
    },
  ];

  for (const test of tests) {
    console.log(`\n📝 Test: ${test.name}`);
    console.log('-'.repeat(70));

    try {
      const options: RequestInit = {
        method: test.method,
        headers: test.headers,
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);

      console.log(`Status: ${response.status} ${response.statusText}`);
      
      // Log important headers
      const importantHeaders = [
        'x-request-id',
        'x-correlation-id',
        'x-cloud-trace-context',
        'x-api-version',
        'x-brand',
        'set-cookie',
      ];

      console.log('\nResponse Headers:');
      importantHeaders.forEach(header => {
        const value = response.headers.get(header);
        if (value) {
          const displayValue = header === 'set-cookie' 
            ? value.substring(0, 100) + '...'
            : value;
          console.log(`   ${header}: ${displayValue}`);
        }
      });

      const text = await response.text();
      
      if (response.ok) {
        console.log('\n✅ SUCCESS');
        console.log(`Response: ${text.substring(0, 300)}...`);
      } else {
        console.log('\n❌ FAILED');
        console.log(`Response: ${text}`);
      }

    } catch (error) {
      console.log(`\n❌ ERROR: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Test complete\n');
}

testGatewayRouting();
