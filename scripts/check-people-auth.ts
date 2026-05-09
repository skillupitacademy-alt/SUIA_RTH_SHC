import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkPeopleAdmins() {
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL_PEOPLE,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Searching for admins in people_prod...");
    
    // 1. Check users with admin-related roles
    const res = await client.query(`
      SELECT email, role, platform 
      FROM users 
      WHERE role IN ('admin', 'super_admin', 'faculty')
      LIMIT 10
    `);
    
    console.log("\n### Admin/Faculty users in people_prod:");
    console.table(res.rows);

    // 2. Check platform_access table
    const accessRes = await client.query(`
      SELECT * FROM platform_access LIMIT 5
    `);
    console.log("\n### Platform Access records:");
    console.table(accessRes.rows);

  } catch (err: any) {
    console.error("ERROR:", err.message);
  } finally {
    await client.end();
  }
}

checkPeopleAdmins();
