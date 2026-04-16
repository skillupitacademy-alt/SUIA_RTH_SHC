const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function debugLogin() {
  const client = new Client({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    await client.connect();
    console.log('Connected to RTH database');

    const email = 'ajayshah@gmail.com';
    const password = 'testing';
    
    console.log(`🔍 Debugging login for: ${email}`);

    // Step 1: Find user with details (mimicking UserRepository.findWithDetails)
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.is_blocked,
        u.email_verified,
        u.created_at,
        u.updated_at,
        up.name,
        up.professional_status,
        up.education_level,
        ur.role_id,
        r.name as role_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User NOT FOUND');
      return;
    }

    console.log('✅ User found in database');
    const user = userResult.rows[0];
    
    console.log(`📋 User details:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Blocked: ${user.is_blocked}`);
    console.log(`  Email Verified: ${user.email_verified}`);
    console.log(`  Password Hash: ${user.password_hash ? 'EXISTS' : 'MISSING'}`);
    console.log(`  Profile Name: ${user.name || 'NULL'}`);
    console.log(`  Role: ${user.role_name || 'NULL'}`);

    // Step 2: Check if blocked
    if (user.is_blocked) {
      console.log('❌ User is BLOCKED');
      return;
    }

    // Step 3: Verify password
    console.log(`🔐 Testing password verification...`);
    
    if (!user.password_hash) {
      console.log('❌ No password hash found');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT');
    } else {
      console.log('❌ Password is INCORRECT');
      
      // Let's check if the hash format is correct
      console.log(`🔍 Password hash details:`);
      console.log(`  Hash: ${user.password_hash.substring(0, 20)}...`);
      console.log(`  Length: ${user.password_hash.length}`);
      console.log(`  Starts with $2: ${user.password_hash.startsWith('$2')}`);
      
      return;
    }

    // Step 4: Check account lockout
    const lockoutQuery = `
      SELECT attempts, locked_until
      FROM login_attempts 
      WHERE user_id = $1 AND brand = 'realtutorialhub'
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const lockoutResult = await client.query(lockoutQuery, [user.id]);
    
    if (lockoutResult.rows.length > 0) {
      const lockout = lockoutResult.rows[0];
      console.log(`🔒 Lockout status:`);
      console.log(`  Attempts: ${lockout.attempts}`);
      console.log(`  Locked until: ${lockout.locked_until || 'Not locked'}`);
      
      if (lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
        console.log('❌ Account is currently LOCKED');
        return;
      }
    }

    console.log('🎉 All checks passed - login should work!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugLogin();