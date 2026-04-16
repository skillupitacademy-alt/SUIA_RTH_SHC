const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function resetAjayPasswordProduction() {
  console.log('🔄 Resetting password for ajayshah@gmail.com in PRODUCTION RTH database...');
  
  const email = 'ajayshah@gmail.com';
  const newPassword = 'testing';
  
  // Use production RTH database
  const dbUrl = process.env.DATABASE_DIRECT_URL_RTH;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_DIRECT_URL_RTH not found in environment variables');
    return;
  }
  
  console.log('🗄️ Connecting to production RTH database...');
  
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to production RTH database');

    // First, check if user exists
    const userQuery = 'SELECT id, email FROM users WHERE email = $1';
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in production database');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);

    // Generate new password hash
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    console.log(`🔐 Generated new password hash: ${passwordHash.substring(0, 20)}...`);

    // Update password in production database
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = NOW() 
      WHERE email = $2
      RETURNING id, email
    `;
    
    const updateResult = await client.query(updateQuery, [passwordHash, email]);
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Password updated successfully in production database');
      console.log(`   User ID: ${updateResult.rows[0].id}`);
      console.log(`   Email: ${updateResult.rows[0].email}`);
      
      // Test password verification
      const testResult = await bcrypt.compare(newPassword, passwordHash);
      console.log(`🧪 Password verification test: ${testResult ? 'PASS' : 'FAIL'}`);
      
      // Clear any existing login attempts for this user
      const clearAttemptsQuery = `
        DELETE FROM login_attempts 
        WHERE user_id = $1
      `;
      
      const clearResult = await client.query(clearAttemptsQuery, [user.id]);
      console.log(`🧹 Cleared ${clearResult.rowCount} login attempt records`);
      
      console.log('\n🔑 Updated production credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
      console.log('\n✅ You can now test login at: https://user.realtutorialhub.com');
      
    } else {
      console.log('❌ Failed to update password');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

resetAjayPasswordProduction();