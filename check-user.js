const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkUser() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    // Check if user exists
    const userQuery = `
      SELECT id, email, password_hash, created_at, email_verified, is_blocked
      FROM users 
      WHERE email = $1
    `;
    
    const result = await client.query(userQuery, ['ajayshah@gmail.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ User ajayshah@gmail.com NOT FOUND in RTH database');
      
      // Let's see what users exist
      const allUsers = await client.query('SELECT email FROM users LIMIT 10');
      console.log('📋 Existing users in RTH database:');
      allUsers.rows.forEach(user => console.log(`  - ${user.email}`));
    } else {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password Hash: ${user.password_hash ? 'EXISTS' : 'MISSING'}`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  Email Verified: ${user.email_verified}`);
      console.log(`  Is Blocked: ${user.is_blocked}`);
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

checkUser();