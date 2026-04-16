#!/usr/bin/env node

/**
 * Fix SkillUp User Profile
 */

const { Client } = require('pg');

const SKILLUP_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require";

async function fixSkillUpUser() {
  const client = new Client({
    connectionString: SKILLUP_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 Fixing SkillUp user profile...');
    await client.connect();

    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['student@skillupitacademy.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log('✅ User ID:', userId);

    // Check if profile exists
    const profileResult = await client.query(
      'SELECT id FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      console.log('📝 Creating user profile...');
      await client.query(`
        INSERT INTO user_profiles (user_id, name, adaptive_level, created_at, updated_at)
        VALUES ($1, $2, 'beginner', NOW(), NOW())
      `, [userId, 'SkillUp Student']);
      console.log('✅ User profile created');
    } else {
      console.log('ℹ️ User profile already exists');
    }

    // Verify final state
    console.log('\n🔍 Final verification:');
    const finalResult = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.email_verified, 
        u.is_blocked,
        p.name, 
        r.name as role
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.email = $1
    `, ['student@skillupitacademy.com']);

    console.log('Final state:', finalResult.rows[0]);

  } catch (error) {
    console.error('💥 Fix failed:', error);
  } finally {
    await client.end();
    console.log('\n🏁 Fix completed');
  }
}

fixSkillUpUser();