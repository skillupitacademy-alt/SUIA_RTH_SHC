#!/usr/bin/env node

/**
 * SkillUp User Investigation Script
 * Deep dive into the SkillUp authentication issue
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection from .env.local
const SKILLUP_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require";

async function investigateSkillUpUser() {
  const client = new Client({
    connectionString: SKILLUP_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Connecting to SkillUp database...');
    await client.connect();

    // 1. Check if user exists
    console.log('\n📋 1. Checking user existence...');
    const userResult = await client.query(`
      SELECT 
        id, 
        email, 
        password_hash, 
        email_verified, 
        is_blocked, 
        created_at,
        updated_at,
        shadow_user_id,
        is_onboarded
      FROM users 
      WHERE email = $1
    `, ['student@skillupitacademy.com']);

    if (userResult.rows.length === 0) {
      console.log('❌ User does not exist in skillup_prod database');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      emailVerified: user.email_verified,
      isBlocked: user.is_blocked,
      shadowUserId: user.shadow_user_id,
      isOnboarded: user.is_onboarded,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });

    // 2. Test password hash
    console.log('\n🔑 2. Testing password hash...');
    const passwordMatch = await bcrypt.compare('testing', user.password_hash);
    console.log('Password verification:', passwordMatch ? '✅ VALID' : '❌ INVALID');
    
    if (!passwordMatch) {
      console.log('Password hash:', user.password_hash.substring(0, 30) + '...');
      
      // Try to update with correct hash
      console.log('🔧 Updating password hash...');
      const correctHash = '$2b$12$iv598PqwDQgtxFO3VS2KE./O3N6PM36NpAg949u2f88LXMkLplfzu';
      await client.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [correctHash, 'student@skillupitacademy.com']
      );
      console.log('✅ Password hash updated');
    }

    // 3. Check user profile
    console.log('\n👤 3. Checking user profile...');
    const profileResult = await client.query(`
      SELECT id, user_id, name, education_level, professional_status, onboarding_completed
      FROM user_profiles 
      WHERE user_id = $1
    `, [user.id]);

    if (profileResult.rows.length === 0) {
      console.log('⚠️ No user profile found, creating one...');
      await client.query(`
        INSERT INTO user_profiles (user_id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [user.id, 'SkillUp Student']);
      console.log('✅ User profile created');
    } else {
      const profile = profileResult.rows[0];
      console.log('✅ User profile found:', {
        id: profile.id,
        name: profile.name,
        educationLevel: profile.education_level,
        professionalStatus: profile.professional_status,
        onboardingCompleted: profile.onboarding_completed
      });
    }

    // 4. Check user roles
    console.log('\n🎭 4. Checking user roles...');
    const rolesResult = await client.query(`
      SELECT r.id, r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [user.id]);

    if (rolesResult.rows.length === 0) {
      console.log('⚠️ No roles assigned, checking if USER role exists...');
      
      const userRoleResult = await client.query(`
        SELECT id, name FROM roles WHERE name = 'USER'
      `);

      if (userRoleResult.rows.length === 0) {
        console.log('⚠️ USER role does not exist, creating it...');
        const newRoleResult = await client.query(`
          INSERT INTO roles (name) VALUES ('USER') RETURNING id, name
        `);
        console.log('✅ USER role created:', newRoleResult.rows[0]);
      }

      // Assign USER role
      const roleToAssign = userRoleResult.rows[0] || (await client.query('SELECT id FROM roles WHERE name = \'USER\'')).rows[0];
      await client.query(`
        INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
      `, [user.id, roleToAssign.id]);
      console.log('✅ USER role assigned');
    } else {
      console.log('✅ User roles found:', rolesResult.rows.map(r => r.name));
    }

    // 5. Check all roles in database
    console.log('\n📋 5. All roles in database:');
    const allRolesResult = await client.query('SELECT id, name FROM roles ORDER BY name');
    console.log('Available roles:', allRolesResult.rows);

    // 6. Final verification query
    console.log('\n🔍 6. Final user verification:');
    const finalResult = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.email_verified, 
        u.is_blocked, 
        u.shadow_user_id,
        u.is_onboarded,
        p.name, 
        r.name as role
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, ['student@skillupitacademy.com']);

    console.log('Final user state:', finalResult.rows);

    // 7. Test password one more time
    console.log('\n🔑 7. Final password test:');
    const finalUserResult = await client.query(
      'SELECT password_hash FROM users WHERE email = $1',
      ['student@skillupitacademy.com']
    );
    
    if (finalUserResult.rows.length > 0) {
      const finalHash = finalUserResult.rows[0].password_hash;
      const finalPasswordMatch = await bcrypt.compare('testing', finalHash);
      console.log('Final password verification:', finalPasswordMatch ? '✅ VALID' : '❌ INVALID');
    }

  } catch (error) {
    console.error('💥 Investigation failed:', error);
  } finally {
    await client.end();
    console.log('\n🏁 Investigation completed');
  }
}

investigateSkillUpUser();