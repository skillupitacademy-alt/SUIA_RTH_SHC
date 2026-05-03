const token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJhZjFkODExNy1hNDcxLTQ4NmEtYWUxNy0wNzQzMzM5NzRlYTAiLCJvcmlnaW5hbFVzZXJJZCI6ImFmMWQ4MTE3LWE0NzEtNDg2YS1hZTE3LTA3NDMzMzk3NGVhMCIsInNoYWRvd1VzZXJJZCI6IjVhNzM1MWY5LTU5MzYtNDI5Zi04ZWM0LTgwYjk3YzBiN2UyOSIsImVtYWlsIjoiYWRtaW5AcmVhbHR1dG9yaWFsaHViLmNvbSIsInJvbGVzIjpbImFkbWluIl0sImlzQWRtaW4iOnRydWUsInRva2VuVHlwZSI6ImFkbWluIiwiYnJhbmQiOiJyZWFsdHV0b3JpYWxodWIiLCJhdWQiOiJhZG1pbiIsImlhdCI6MTc3NzgzNDM2MSwiZXhwIjoxNzc3ODM1MjYxfQ.ShyUBK9KGkaWjJtlErjaiF6Ab54H4evRa7lgvnJkgIk";
const baseUrl = 'https://api.realtutorialhub.com';

async function testAPI() {
  console.log('Testing FRESH token generated just now\n');
  
  // Decode token
  const [, payload] = token.split('.');
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
  console.log('Token info:');
  console.log('  Email:', decoded.email);
  console.log('  Issued:', new Date(decoded.iat * 1000).toLocaleString());
  console.log('  Expires:', new Date(decoded.exp * 1000).toLocaleString());
  console.log('  Is expired:', Date.now() > decoded.exp * 1000);
  console.log('\n---\n');

  // Test API
  console.log('Test: GET /api/admin/layman/sections');
  try {
    const response = await fetch(`${baseUrl}/api/admin/layman/sections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS - Sections:', data.sections?.length || data.total || 0);
    } else {
      const text = await response.text();
      console.log('❌ FAILED');
      console.log('Response:', text);
    }
  } catch (error) {
    console.log('❌ ERROR:', error);
  }
}

testAPI();
