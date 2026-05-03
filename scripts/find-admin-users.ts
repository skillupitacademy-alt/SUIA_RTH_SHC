/**
 * Find Admin Users in Both Brands
 * ================================
 * Queries RTH and SkillUp databases to find admin users
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function findAdminUsers() {
  console.log('🔍 Searching for admin users in both brand databases...\n');

  // RTH Database
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 RealTutorialHub Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const rthPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_RTH,
  });

  try {
    // First, check what columns exist
    const columnsResult = await rthPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Available columns:', columnsResult.rows.map(r => r.column_name).join(', '));
    console.log('');

    const rthResult = await rthPool.query(`
      SELECT 
        id,
        email,
        email_verified,
        created_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    if (rthResult.rows.length === 0) {
      console.log('❌ No users found in RTH database\n');
    } else {
      console.log(`✅ Found ${rthResult.rows.length} user(s):\n`);
      rthResult.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email Verified: ${user.email_verified}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Error querying RTH database:', error);
  } finally {
    await rthPool.end();
  }

  // SkillUp Database
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 SkillUp Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const skillupPool = new Pool({
    connectionString: process.env.DATABASE_DIRECT_URL_SKILLUP,
  });

  try {
    // First, check what columns exist
    const columnsResult = await skillupPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Available columns:', columnsResult.rows.map(r => r.column_name).join(', '));
    console.log('');

    const skillupResult = await skillupPool.query(`
      SELECT 
        id,
        email,
        email_verified,
        created_at
      FROM users 
      ORDER BY created_at DESC
      LIMIT 20;
    `);

    if (skillupResult.rows.length === 0) {
      console.log('❌ No users found in SkillUp database\n');
    } else {
      console.log(`✅ Found ${skillupResult.rows.length} user(s):\n`);
      skillupResult.rows.forEach((user, idx) => {
        console.log(`${idx + 1}. Email: ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email Verified: ${user.email_verified}`);
        console.log('');
      });
    }
  } catch (error) {
    console.log('❌ Error querying SkillUp database:', error);
  } finally {
    await skillupPool.end();
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Note: Passwords are hashed and cannot be displayed');
  console.log('   Check seed scripts for test credentials');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

findAdminUsers();
