const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function resetAjayPassword() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    const email = 'ajayshah@gmail.com';
    const newPassword = 'testing';

    console.log(`🔄 Resetting password for ${email}...`);

    // Generate new hash
    const passwordHash = await bcrypt.hash(newPassword, 12);
    console.log(`🔐 Generated new password hash: ${passwordHash.substring(0, 20)}...`);

    // Update password
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [passwordHash, email]
    );

    if (result.rows.length > 0) {
      console.log('✅ Password updated successfully');
      console.log(`   User ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      
      // Verify the hash works
      const isValid = await bcrypt.compare(newPassword, passwordHash);
      console.log(`🧪 Password verification test: ${isValid ? 'PASS' : 'FAIL'}`);
      
      console.log(`\n🔑 Updated credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      
    } else {
      console.log('❌ No user found to update');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetAjayPassword();