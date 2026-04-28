/**
 * Script to check user data in RTH database
 * Usage: node check-user-rth.js
 */

const { Pool } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

async function checkUser() {
  const email = 'ajayshah@gmail.com';
  
  console.log('🔍 Checking RTH database for user:', email);
  console.log('📊 Database URL:', process.env.DATABASE_URL_RTH ? 'Found' : 'NOT FOUND');
  
  if (!process.env.DATABASE_URL_RTH) {
    console.error('❌ DATABASE_URL_RTH not found in environment variables');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_RTH,
  });

  try {
    // Query users table
    console.log('\n📋 Querying users table...');
    const usersResult = await pool.query(
      `SELECT 
        id, 
        email, 
        email_verified,
        is_blocked,
        is_onboarded,
        primary_goal,
        domain,
        sub_domain,
        time_commitment,
        journey_status,
        created_at,
        updated_at,
        last_active_at
      FROM users 
      WHERE email = $1`,
      [email]
    );

    if (usersResult.rows.length === 0) {
      console.log('❌ User not found in users table');
      await pool.end();
      return;
    }

    const user = usersResult.rows[0];
    console.log('✅ User found in users table:');
    console.log(JSON.stringify(user, null, 2));

    // Query user_profiles table
    console.log('\n📋 Querying user_profiles table...');
    const profileResult = await pool.query(
      `SELECT 
        id,
        user_id,
        name,
        education_level,
        professional_status,
        age_group,
        experience_years,
        domain_interest,
        adaptive_level,
        primary_goal,
        domain,
        sub_domain,
        time_commitment,
        journey_status,
        onboarding_completed,
        created_at,
        updated_at
      FROM user_profiles 
      WHERE user_id = $1`,
      [user.id]
    );

    if (profileResult.rows.length === 0) {
      console.log('⚠️  No profile found in user_profiles table');
    } else {
      console.log('✅ User profile found:');
      console.log(JSON.stringify(profileResult.rows[0], null, 2));
    }

    // Query user_roles table
    console.log('\n📋 Querying user_roles table...');
    const rolesResult = await pool.query(
      `SELECT r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1`,
      [user.id]
    );

    if (rolesResult.rows.length === 0) {
      console.log('⚠️  No roles found');
    } else {
      console.log('✅ User roles:');
      console.log(JSON.stringify(rolesResult.rows, null, 2));
    }

    // Query sessions table
    console.log('\n📋 Querying active sessions...');
    const sessionsResult = await pool.query(
      `SELECT 
        id,
        family_id,
        ip,
        device,
        expires_at,
        created_at
      FROM sessions 
      WHERE user_id = $1 
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 5`,
      [user.id]
    );

    if (sessionsResult.rows.length === 0) {
      console.log('⚠️  No active sessions found');
    } else {
      console.log(`✅ Found ${sessionsResult.rows.length} active session(s):`);
      console.log(JSON.stringify(sessionsResult.rows, null, 2));
    }

    // Query refresh tokens
    console.log('\n📋 Querying active refresh tokens...');
    const tokensResult = await pool.query(
      `SELECT 
        id,
        device_id,
        device_name,
        ip_address,
        user_agent,
        expires_at,
        revoked,
        last_used_at,
        created_at
      FROM refresh_tokens 
      WHERE user_id = $1 
      AND revoked = false
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 5`,
      [user.id]
    );

    if (tokensResult.rows.length === 0) {
      console.log('⚠️  No active refresh tokens found');
    } else {
      console.log(`✅ Found ${tokensResult.rows.length} active refresh token(s):`);
      console.log(JSON.stringify(tokensResult.rows, null, 2));
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await pool.end();
  }
}

checkUser().catch(console.error);
