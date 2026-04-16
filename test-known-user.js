const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testKnownUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    // Check the verified user
    const email = 'rth.pass.1775107336@example.com';
    
    const userQuery = `
      SELECT id, email, password_hash, is_blocked, email_verified
      FROM users 
      WHERE email = $1
    `;
    
    const result = await client.query(userQuery, [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Verified: ${user.email_verified}`);
    console.log(`   Blocked: ${user.is_blocked}`);
    console.log(`   Has password: ${user.password_hash ? 'YES' : 'NO'}`);

    // Set a known password for this user
    const testPassword = 'testing123';
    const passwordHash = await bcrypt.hash(testPassword, 12);
    
    await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    console.log(`✅ Set password to: ${testPassword}`);

    // Test login with this user
    console.log('\n🔍 Testing login with this user...');
    
    const fetch = require('node-fetch');
    const response = await fetch('https://user.realtutorialhub.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: testPassword,
        platform: 'realtutorialhub'
      })
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('Response:', responseText);
    
    if (response.ok) {
      console.log('✅ Login successful with verified user!');
      console.log('🎯 This means the login system is working');
      console.log('🔍 The issue might be specific to ajayshah@gmail.com');
    } else {
      console.log('❌ Login failed even with verified user');
      console.log('🚨 This indicates a system-wide login issue');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testKnownUser();