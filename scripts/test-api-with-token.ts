import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const token = process.env.TEST_ADMIN_TOKEN;
const baseUrl = 'https://api.realtutorialhub.com';

async function testAPI() {
  console.log('Testing API with token from .env.local\n');
  console.log('Token:', token?.substring(0, 50) + '...');
  console.log('Token length:', token?.length);
  console.log('Base URL:', baseUrl);
  console.log('\n---\n');

  if (!token) {
    console.log('ERROR: No token found');
    return;
  }

  // Test 1: List sections
  console.log('Test 1: GET /api/admin/layman/sections');
  try {
    const response = await fetch(`${baseUrl}/api/admin/layman/sections`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Sections found:', data.sections?.length || data.total || 0);
    } else {
      const text = await response.text();
      console.log('❌ FAILED');
      console.log('Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ ERROR:', error);
  }

  console.log('\n---\n');

  // Test 2: Review queue
  console.log('Test 2: GET /api/admin/layman/review/queue');
  try {
    const response = await fetch(`${baseUrl}/api/admin/layman/review/queue`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Pending reviews:', data.total || 0);
    } else {
      const text = await response.text();
      console.log('❌ FAILED');
      console.log('Response:', text.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ ERROR:', error);
  }
}

testAPI();
