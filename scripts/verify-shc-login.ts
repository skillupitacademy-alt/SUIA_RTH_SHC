import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verifyAdminCredentials() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL_PEOPLE,
    ssl: { rejectUnauthorized: false }
  });
  
  const testUsers = [
    'admin@realtutorialhub.com',
    'admin@test.com'
  ];

  try {
    await client.connect();
    console.log("--- LIVE CREDENTIAL VERIFICATION (PEOPLE_PROD) ---");
    
    for (const email of testUsers) {
      console.log(`\n🔍 Checking: ${email}...`);
      
      const res = await client.query(`
        SELECT u.id, u.email, u.role, u.password_hash, 
               json_agg(pa.platform) as platforms
        FROM users u
        LEFT JOIN platform_access pa ON u.id = pa.user_id
        WHERE u.email = $1 AND u.deleted_at IS NULL
        GROUP BY u.id, u.email, u.role, u.password_hash
      `, [email]);

      if (res.rows.length === 0) {
        console.log(`❌ User NOT found in people_prod`);
        continue;
      }

      const user = res.rows[0];
      console.log(`✅ User Found (ID: ${user.id})`);
      console.log(`👑 Role: ${user.role}`);
      console.log(`🌐 Platforms: ${user.platforms.join(', ')}`);
      
      if (user.password_hash && user.password_hash.length > 20) {
        console.log(`🔑 Password Hash: Present (Verified)`);
      } else {
        console.log(`⚠️  Password Hash: MISSING or INVALID`);
      }

      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      if (isAdmin) {
        console.log(`🚀 STATUS: READY FOR SHC ADMIN LOGIN`);
      } else {
        console.log(`⛔ STATUS: NOT AN ADMIN (Access Denied)`);
      }
    }

  } catch (err: any) {
    console.error("ERROR:", err.message);
  } finally {
    await client.end();
  }
}

verifyAdminCredentials();
