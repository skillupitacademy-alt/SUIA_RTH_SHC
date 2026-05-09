import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * SIMULATION: How SkillHubCore Admin verifies a user
 */
async function simulateSHCAuth() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL_PEOPLE,
    ssl: { rejectUnauthorized: false }
  });
  
  const testUsers = ['admin@realtutorialhub.com', 'admin@test.com'];

  try {
    await client.connect();
    console.log("--- SHC ADMIN ACCESS SIMULATION ---");
    
    for (const email of testUsers) {
      console.log(`\n🔑 Testing Authentication for: ${email}`);
      
      const res = await client.query(`
        SELECT email, role 
        FROM users 
        WHERE email = $1 AND deleted_at IS NULL
      `, [email]);

      if (res.rows.length === 0) {
        console.log(`❌ ERROR: User not found.`);
        continue;
      }

      const user = res.rows[0];
      
      // THE AUTHORIZATION LOGIC (Same as SHC Admin Middleware)
      const allowedRoles = ['admin', 'super_admin'];
      const isAuthorized = allowedRoles.includes(user.role);

      console.log(`👤 Role found: "${user.role}"`);
      
      if (isAuthorized) {
        console.log(`✅ [SHC ACCESS GRANTED]`);
        console.log(`   Logic: User is a ${user.role}, which is in the allowed SHC Admin list.`);
      } else {
        console.log(`⛔ [SHC ACCESS DENIED]`);
        console.log(`   Logic: Role "${user.role}" does not have SHC management permissions.`);
      }
    }

  } catch (err: any) {
    console.error("ERROR:", err.message);
  } finally {
    await client.end();
  }
}

simulateSHCAuth();
