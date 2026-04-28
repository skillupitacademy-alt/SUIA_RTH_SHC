/**
 * Script to check user data in RTH database using Drizzle ORM
 * Usage: node check-user-rth-drizzle.mjs
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

async function checkUser() {
  const email = 'ajayshah@gmail.com';
  
  console.log('🔍 Checking RTH database for user:', email);
  console.log('📊 Database URL:', process.env.DATABASE_URL_RTH ? 'Found' : 'NOT FOUND');
  
  if (!process.env.DATABASE_URL_RTH) {
    console.error('❌ DATABASE_URL_RTH not found in environment variables');
    process.exit(1);
  }

  try {
    // Use HTTP connection instead of WebSocket
    const sql = neon(process.env.DATABASE_URL_RTH);
    const db = drizzle(sql);

    // Query users table
    console.log('\n📋 Querying users table...');
    const usersResult = await sql`
      SELECT 
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
      WHERE email = ${email}
    `;

    if (usersResult.length === 0) {
      console.log('❌ User not found in users table');
      return;
    }

    const user = usersResult[0];
    console.log('✅ User found in users table:');
    console.log(JSON.stringify(user, null, 2));

    // Query user_profiles table
    console.log('\n📋 Querying user_profiles table...');
    const profileResult = await sql`
      SELECT 
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
      WHERE user_id = ${user.id}
    `;

    if (profileResult.length === 0) {
      console.log('⚠️  No profile found in user_profiles table');
    } else {
      console.log('✅ User profile found:');
      console.log(JSON.stringify(profileResult[0], null, 2));
    }

    // Query user_roles table
    console.log('\n📋 Querying user_roles table...');
    const rolesResult = await sql`
      SELECT r.name as role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${user.id}
    `;

    if (rolesResult.length === 0) {
      console.log('⚠️  No roles found');
    } else {
      console.log('✅ User roles:');
      console.log(JSON.stringify(rolesResult, null, 2));
    }

    // Query sessions table
    console.log('\n📋 Querying active sessions...');
    const sessionsResult = await sql`
      SELECT 
        id,
        family_id,
        ip,
        device,
        expires_at,
        created_at
      FROM sessions 
      WHERE user_id = ${user.id}
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (sessionsResult.length === 0) {
      console.log('⚠️  No active sessions found');
    } else {
      console.log(`✅ Found ${sessionsResult.length} active session(s):`);
      console.log(JSON.stringify(sessionsResult, null, 2));
    }

    // Query refresh tokens
    console.log('\n📋 Querying active refresh tokens...');
    const tokensResult = await sql`
      SELECT 
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
      WHERE user_id = ${user.id}
      AND revoked = false
      AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 5
    `;

    if (tokensResult.length === 0) {
      console.log('⚠️  No active refresh tokens found');
    } else {
      console.log(`✅ Found ${tokensResult.length} active refresh token(s):`);
      console.log(JSON.stringify(tokensResult, null, 2));
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

checkUser().catch(console.error);
