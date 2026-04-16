const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function testPassword() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    // Get user's password hash
    const userQuery = `
      SELECT id, email, password_hash
      FROM users 
      WHERE email = $1
    `;
    
    const result = await client.query(userQuery, ['ajayshah@gmail.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    const testPassword = 'testing';
    
    console.log(`🔍 Testing password "${testPassword}" for user ${user.email}`);
    
    // Test password verification
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    if (isValid) {
      console.log('✅ Password "testing" is CORRECT');
    } else {
      console.log('❌ Password "testing" is INCORRECT');
      
      // Let's try some common variations
      const variations = ['Testing', 'TESTING', 'test', 'password', '123456'];
      
      console.log('🔍 Testing common password variations...');
      for (const variation of variations) {
        const isVariationValid = await bcrypt.compare(variation, user.password_hash);
        if (isVariationValid) {
          console.log(`✅ Correct password is: "${variation}"`);
          return;
        }
      }
      
      console.log('❌ None of the common variations worked');
      console.log('💡 The password might be different than expected');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

testPassword();