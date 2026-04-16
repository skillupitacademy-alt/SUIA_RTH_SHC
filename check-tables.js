#!/usr/bin/env node

/**
 * Database Table Structure Investigation
 */

const { Client } = require('pg');

const SKILLUP_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/skillup_prod?sslmode=require&channel_binding=require";
const RTH_DATABASE_URL = "postgresql://neondb_owner:npg_y5iSrBlo4FMn@ep-round-cherry-a1ogr3gr-pooler.ap-southeast-1.aws.neon.tech/rth_prod?sslmode=require&channel_binding=require";

async function checkDatabase(name, connectionString) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`\n🔍 Checking ${name} database...`);
    await client.connect();

    // Check user_profiles table structure
    console.log('\n📋 User Profiles Table Structure:');
    const profileColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', profileColumns.rows);

    // Check specific user
    const email = name === 'SkillUp' ? 'student@skillupitacademy.com' : 'ajayshah@gmail.com';
    
    console.log(`\n👤 User: ${email}`);
    const userResult = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.email_verified, 
        u.is_blocked,
        u.shadow_user_id,
        u.is_onboarded
      FROM users u
      WHERE u.email = $1
    `, [email]);

    if (userResult.rows.length > 0) {
      console.log('✅ User found:', userResult.rows[0]);
      
      // Check profile
      const profileResult = await client.query(`
        SELECT id, user_id, name
        FROM user_profiles 
        WHERE user_id = $1
      `, [userResult.rows[0].id]);

      console.log('Profile:', profileResult.rows.length > 0 ? profileResult.rows[0] : 'No profile found');

      // Check roles
      const rolesResult = await client.query(`
        SELECT r.name
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `, [userResult.rows[0].id]);

      console.log('Roles:', rolesResult.rows.map(r => r.name));

    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error(`💥 ${name} database error:`, error.message);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🔍 Database Structure Investigation');
  console.log('==================================');

  await checkDatabase('RTH', RTH_DATABASE_URL);
  await checkDatabase('SkillUp', SKILLUP_DATABASE_URL);

  console.log('\n🏁 Investigation completed');
}

main();