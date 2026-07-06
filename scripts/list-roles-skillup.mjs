/**
 * Script to list all available roles in SkillUp database
 * Usage: node scripts/list-roles-skillup.mjs
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function listRoles() {
  console.log('🔍 Checking available roles in SkillUp database');
  console.log('📊 Database URL:', process.env.DATABASE_URL_SKILLUP ? 'Found' : 'NOT FOUND');
  
  if (!process.env.DATABASE_URL_SKILLUP) {
    console.error('❌ DATABASE_URL_SKILLUP not found in environment variables');
    process.exit(1);
  }

  try {
    const sql = neon(process.env.DATABASE_URL_SKILLUP);

    // List all roles
    console.log('\n📋 Available roles in roles table:');
    const rolesResult = await sql`
      SELECT id, name 
      FROM roles 
      ORDER BY name
    `;

    if (rolesResult.length === 0) {
      console.log('❌ No roles found in database');
    } else {
      console.log(`✅ Found ${rolesResult.length} role(s):\n`);
      rolesResult.forEach((role, index) => {
        console.log(`${index + 1}. ${role.name}`);
        console.log(`   ID: ${role.id}`);
      });
    }

    // Count users per role
    console.log('\n📊 User count per role:');
    const userCountResult = await sql`
      SELECT 
        r.name as role_name,
        COUNT(ur.user_id) as user_count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      GROUP BY r.id, r.name
      ORDER BY user_count DESC, r.name
    `;

    if (userCountResult.length === 0) {
      console.log('❌ No data found');
    } else {
      userCountResult.forEach((row) => {
        console.log(`  ${row.role_name}: ${row.user_count} user(s)`);
      });
    }

    console.log('\n✅ Role listing complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

listRoles().catch(console.error);
