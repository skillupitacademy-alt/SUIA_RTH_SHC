/**
 * Test RTH signup specifically to debug the issue
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const API_URL = 'http://localhost:3000/api';

async function testRTHSignup() {
  const timestamp = Date.now();
  const email = `test-rth-${timestamp}@example.com`;
  const password = 'TestPassword123!';
  const name = `RTH Test User ${timestamp}`;
  
  console.log('🧪 Testing RTH Signup');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Name: ${name}`);
  console.log(`   API: ${API_URL}`);
  console.log('');
  
  try {
    console.log('📤 Sending signup request...');
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        platform: 'realtutorialhub',
      }),
    });
    
    console.log(`📥 Response status: ${response.status}`);
    
    const data = await response.text();
    console.log('📥 Response body:');
    console.log(data);
    
    if (!response.ok) {
      console.error('\n❌ Signup failed!');
      try {
        const json = JSON.parse(data);
        console.error('Error details:', JSON.stringify(json, null, 2));
      } catch {
        console.error('Raw error:', data);
      }
      process.exit(1);
    }
    
    console.log('\n✅ Signup successful!');
    const json = JSON.parse(data);
    console.log('User created:', JSON.stringify(json, null, 2));
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error during signup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testRTHSignup();
