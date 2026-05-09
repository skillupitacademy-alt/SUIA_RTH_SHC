import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dbs = [
  { name: 'quiz_platform_prod', url: process.env.DATABASE_URL },
  { name: 'rth_prod', url: process.env.DATABASE_URL_RTH },
  { name: 'skillup_prod', url: process.env.DATABASE_URL_SKILLUP },
  { name: 'tutorial_prod', url: process.env.DATABASE_URL_TUTORIAL },
  { name: 'people_prod', url: process.env.DATABASE_URL_PEOPLE },
  { name: 'payment_prod', url: process.env.DATABASE_URL_PAYMENT },
  { name: 'placement_prod', url: process.env.DATABASE_URL_PLACEMENT },
];

async function auditDbs() {
  console.log("--- STARTING LIVE DATABASE AUDIT ---");
  
  for (const dbInfo of dbs) {
    if (!dbInfo.url) {
      console.log(`[${dbInfo.name}] SKIPPED: No URL found in env.`);
      continue;
    }

    const client = new Client({ 
      connectionString: dbInfo.url,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      const tables = res.rows.map(r => r.table_name);
      console.log(`\n### DATABASE: ${dbInfo.name}`);
      console.log(`Tables (${tables.length}): ${tables.join(', ')}`);
      
    } catch (err: any) {
      console.error(`\n### DATABASE: ${dbInfo.name} - ERROR: ${err.message}`);
    } finally {
      await client.end();
    }
  }
}

auditDbs();
