/**
 * Check if there are any users in SkillHubCore database with empty password_hash
 */
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkUsers() {
  console.log('🔍 Checking SkillHubCore (people) database users\n');
  
  const sql = neon(process.env.DATABASE_URL_PEOPLE);
  
  // Check for users with empty or null password_hash
  const emptyPassword = await sql`
    SELECT id, email, platform, external_id, external_brand, 
           CASE 
             WHEN password_hash = '' THEN 'EMPTY STRING'
             WHEN password_hash IS NULL THEN 'NULL'
             ELSE 'HAS VALUE'
           END as password_status,
           LENGTH(password_hash) as password_length
    FROM users 
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 20
  `;
  
  console.log('Recent users (last 20):');
  emptyPassword.forEach(u => {
    console.log(`  - ${u.email}`);
    console.log(`    Platform: ${u.platform}`);
    console.log(`    External ID: ${u.external_id || 'NULL'}`);
    console.log(`    External Brand: ${u.external_brand || 'NULL'}`);
    console.log(`    Password: ${u.password_status} (length: ${u.password_length})`);
    console.log('');
  });
  
  // Check for constraint violations
  console.log('\n📊 Statistics:');
  const stats = await sql`
    SELECT 
      COUNT(*) as total_users,
      COUNT(CASE WHEN password_hash = '' THEN 1 END) as empty_password,
      COUNT(CASE WHEN password_hash IS NULL THEN 1 END) as null_password,
      COUNT(CASE WHEN external_id IS NOT NULL THEN 1 END) as shadow_users,
      COUNT(CASE WHEN external_id IS NULL THEN 1 END) as direct_users
    FROM users
    WHERE deleted_at IS NULL
  `;
  
  console.log(`  Total users: ${stats[0].total_users}`);
  console.log(`  With empty password: ${stats[0].empty_password}`);
  console.log(`  With null password: ${stats[0].null_password}`);
  console.log(`  Shadow users (has external_id): ${stats[0].shadow_users}`);
  console.log(`  Direct users (no external_id): ${stats[0].direct_users}`);
}

checkUsers().catch(console.error);
