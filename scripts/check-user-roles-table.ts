#!/usr/bin/env tsx
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL_RTH });

async function main() {
  console.log('Checking user roles for ajayshah@gmail.com:\n');
  
  const result = await pool.query(`
    SELECT u.id, u.email, array_agg(ur.role) as roles 
    FROM users u 
    LEFT JOIN user_roles ur ON u.id = ur.user_id 
    WHERE u.email = $1
    GROUP BY u.id, u.email
  `, ['ajayshah@gmail.com']);
  
  console.table(result.rows);
  
  await pool.end();
}

main();
