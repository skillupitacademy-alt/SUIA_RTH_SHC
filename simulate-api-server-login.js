const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function simulateApiServerLogin() {
  console.log('🔍 Simulating exact API server login flow...');
  
  const email = 'ajayshah@gmail.com';
  const password = 'testing';
  const platform = 'realtutorialhub';
  const ip = '127.0.0.1';
  
  console.log(`📋 Login attempt:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Platform: ${platform}`);
  console.log(`   IP: ${ip}`);
  
  // Step 1: Resolve brand (from request-brand.ts logic)
  let brand = platform;
  if (platform === 'realtutorialhub') {
    brand = 'realtutorialhub';
  } else if (platform === 'skillup') {
    brand = 'skillup';
  }
  
  console.log(`\n🏷️ Resolved brand: ${brand}`);
  
  if (brand !== 'skillup' && brand !== 'realtutorialhub') {
    console.log('❌ Invalid brand - API would return 400 Bad Request');
    return;
  }
  
  // Step 2: Connect to correct database based on brand
  let dbUrl;
  if (brand === 'realtutorialhub') {
    dbUrl = process.env.DATABASE_URL_RTH;
  } else if (brand === 'skillup') {
    dbUrl = process.env.DATABASE_URL_SKILLUP;
  } else {
    dbUrl = process.env.DATABASE_URL;
  }
  
  console.log(`🗄️ Database URL: ${dbUrl ? 'Found' : 'Missing'}`);
  
  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to brand-specific database');

    // Step 3: Check account lockout (SecurityService.isAccountLocked)
    console.log('\n🔒 Checking account lockout...');
    
    const lockoutQuery = `
      SELECT attempts, locked_until, updated_at
      FROM login_attempts 
      WHERE user_id = (SELECT id FROM users WHERE email = $1) 
        AND ip = $2 
        AND brand = $3
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const lockoutResult = await client.query(lockoutQuery, [email, ip, brand]);
    
    if (lockoutResult.rows.length > 0) {
      const lockout = lockoutResult.rows[0];
      console.log(`   Found lockout record: ${lockout.attempts} attempts`);
      console.log(`   Locked until: ${lockout.locked_until || 'Not locked'}`);
      
      if (lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
        console.log('❌ Account is locked - API would return 423 Locked');
        return;
      }
    } else {
      console.log('   No lockout records found for this IP/brand combination');
    }
    console.log('✅ Account not locked');

    // Step 4: Find user with details (UserRepository.findWithDetails)
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
        u.journey_status,
        up.name,
        up.professional_status,
        up.education_level
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = $1
    `;
    
    const userResult = await client.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found - API would return 401 Unauthorized');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Blocked: ${user.is_blocked}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Has Password Hash: ${user.password_hash ? 'YES' : 'NO'}`);
    console.log(`   Profile Name: ${user.name || 'None'}`);

    // Step 5: Check if user is blocked
    if (user.is_blocked) {
      console.log('❌ User is blocked - API would return 403 Forbidden');
      return;
    }
    console.log('✅ User not blocked');

    // Step 6: Compare password (PasswordService.compare)
    console.log('\n🔐 Comparing password...');
    
    if (!user.password_hash) {
      console.log('❌ No password hash found - API would return 401 Unauthorized');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    console.log(`   Password comparison result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      console.log('❌ Password is incorrect - API would return 401 Unauthorized');
      
      // Track failed login attempt
      console.log('\n📝 Would track failed login attempt...');
      return;
    }
    console.log('✅ Password is correct');

    // Step 7: Get user roles
    console.log('\n🎭 Getting user roles...');
    
    const rolesQuery = `
      SELECT r.id, r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `;
    const rolesResult = await client.query(rolesQuery, [user.id]);
    
    const roleNames = rolesResult.rows.map(r => r.name?.trim().toLowerCase()).filter(Boolean);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin') || roleNames.includes('infrastructure');
    
    console.log(`   Roles: ${rolesResult.rows.map(r => r.name).join(', ') || 'None'}`);
    console.log(`   Is Admin: ${isAdmin}`);

    console.log('\n🎉 All authentication steps passed!');
    console.log('✅ API server should return 200 OK with access token');
    
    console.log('\n🔍 Since simulation passes but real API fails, the issue might be:');
    console.log('   1. Rate limiting (check X-RateLimit headers)');
    console.log('   2. CORS or request validation');
    console.log('   3. Environment differences between local .env and production');
    console.log('   4. Database connection pooling issues');
    console.log('   5. Middleware intercepting the request');

  } catch (error) {
    console.error('❌ Error during simulation:', error.message);
  } finally {
    await client.end();
  }
}

simulateApiServerLogin();