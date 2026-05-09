import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL_TUTORIAL;

async function checkDb() {
  if (!connectionString) {
    console.error('DATABASE_URL_TUTORIAL not found in .env.local');
    return;
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to tutorial_db...');
    const client = await pool.connect();
    
    // 1. List Tables
    console.log('\n--- Tables in public schema ---');
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.table(tablesRes.rows);

    // 2. Check tutorial_subtopics
    console.log('\n--- Sample Subtopics (First 5) ---');
    const subtopicsRes = await client.query('SELECT id, name, slug FROM tutorial_subtopics LIMIT 5');
    console.table(subtopicsRes.rows);

    // 3. Check tutorial_sections
    console.log('\n--- Sample Sections (First 5) ---');
    const sectionsRes = await client.query('SELECT id, subtopic_id, section_type, difficulty, brand_id FROM tutorial_sections LIMIT 5');
    console.table(sectionsRes.rows);

    client.release();
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await pool.end();
  }
}

checkDb();
