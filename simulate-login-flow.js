const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function simulateLoginFlow() {
  console.log('🔍 Simulating complete login flow...');
  
  const email = 'ajayshah@gmail.com';
  const password = 'testing';
  const brand = 'realtutorialhub';

  // Step 1: Connect to the correct database based on brand
  let dbUrl;
  if (brand === 'realtutorialhub') {
    dbUrl = process.env.DATABASE_DIRECT_URL_RTH;
  } else if (brand === 'skillup') {
    dbUrl = process.env.DATABASE_DIRECT_URL_SKILLUP;
  } else {
    dbUrl = process.env.DATABASE_DIRECT_URL;
  }

  console.log(`📊 Brand: ${brand}`);
  console.log(`🗄️ Database: ${brand === 'realtutorialhub' ? 'RTH' : brand === 'skillup' ? 'SkillUp' : 'Main'}`);

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 2: Check account lockout (simplified)
    console.log('\n🔒 Checking account lockout...');
    const lockoutQuery = `
      SELECT attempts, locked_until
      FROM login_attempts 
      WHERE user_id = (SELECT id FROM users WHERE email = $1) 
        AND brand = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const lockoutResult = await client.query(lockoutQuery, [email, brand]);
    
    if (lockoutResult.rows.length > 0) {
      const lockout = lockoutResult.rows[0];
      console.log(`   Attempts: ${lockout.attempts}`);
      console.log(`   Locked until: ${lockout.locked_until || 'Not locked'}`);
      
      if (lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
        console.log('❌ Account is locked');
        return;
      }
    } else {
      console.log('   No lockout records found');
    }
    console.log('✅ Account not locked');

    // Step 3: Find user with details (UserRepository.findWithDetails)
    console.log('\n👤 Finding user with details...');
    
    const userQuery = `
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.is_blocked,
        u.email_verified,
        u.created_at,
        u.shadow_user_id,
        u.is_onboarded,
        u.primary_goal,
        u.domain,
        u.sub_domain,
        u.time_commitment,
        u.journey_status
      FROM users u
      WHERE u.email = $1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Blocked: ${user.is_blocked}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Has Password Hash: ${user.password_hash ? 'YES' : 'NO'}`);

    // Step 4: Check if user is blocked
    if (user.is_blocked) {
      console.log('❌ User is blocked');
      return;
    }
    console.log('✅ User not blocked');

    // Step 5: Compare password (PasswordService.compare)
    console.log('\n🔐 Comparing password...');
    
    if (!user.password_hash) {
      console.log('❌ No password hash found');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log(`   Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log('❌ Password is incorrect');
      return;
    }
    console.log('✅ Password is correct');

    // Step 6: Get user profile and roles (hydrateUserDetails)
    console.log('\n📋 Getting user profile and roles...');
    
    const profileQuery = `
      SELECT * FROM user_profiles WHERE user_id = $1
    `;
    const profileResult = await client.query(profileQuery, [user.id]);
    
    const rolesQuery = `
      SELECT r.id, r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `;
    const rolesResult = await client.query(rolesQuery, [user.id]);
    
    console.log(`   Profile: ${profileResult.rows.length > 0 ? 'Found' : 'Not found'}`);
    console.log(`   Roles: ${rolesResult.rows.map(r => r.name).join(', ') || 'None'}`);

    // Step 7: Check admin status
    const roleNames = rolesResult.rows.map(r => r.name?.trim().toLowerCase()).filter(Boolean);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin') || roleNames.includes('infrastructure');
    
    console.log(`   Is Admin: ${isAdmin}`);

    console.log('\n🎉 All login checks passed!');
    console.log('✅ Login should succeed');
    
    // The issue must be elsewhere in the system
    console.log('\n🔍 Since all checks pass, the issue might be:');
    console.log('   1. API server environment variables');
    console.log('   2. Database connection in production');
    console.log('   3. Brand routing logic');
    console.log('   4. Request parsing or validation');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

simulateLoginFlow();