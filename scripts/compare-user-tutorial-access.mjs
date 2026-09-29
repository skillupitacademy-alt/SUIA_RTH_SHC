#!/usr/bin/env node

/**
 * Compare tutorial access for two users
 * READ-ONLY investigation
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function main() {
  const mainPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Comparing Tutorial Access for Two Users ===\n');

    // Get user IDs
    const student = await mainPool.query(
      `SELECT id FROM users WHERE email = $1`,
      ['student@skillupitacademy.com']
    );

    const ajay = await mainPool.query(
      `SELECT id FROM users WHERE email = $1`,
      ['ajayshah@gmail.com']
    );

    if (student.rows.length === 0 || ajay.rows.length === 0) {
      console.log('❌ Users not found');
      return;
    }

    const studentId = student.rows[0].id;
    const ajayId = ajay.rows[0].id;

    console.log('User 1 (404): student@skillupitacademy.com');
    console.log('  ID:', studentId);
    console.log('');
    console.log('User 2 (200): ajayshah@gmail.com');
    console.log('  ID:', ajayId);
    console.log('');

    // Check ALL tutorial_navigation_progress records for both users
    console.log('=== Tutorial Navigation Progress Records ===\n');

    const studentProgress = await tutorialPool.query(
      `SELECT navigation_node_id, status, section_id, subtopic_id 
       FROM tutorial_navigation_progress 
       WHERE user_id = $1`,
      [studentId]
    );

    const ajayProgress = await tutorialPool.query(
      `SELECT navigation_node_id, status, section_id, subtopic_id 
       FROM tutorial_navigation_progress 
       WHERE user_id = $1`,
      [ajayId]
    );

    console.log('User 1 Progress Records:', studentProgress.rows.length);
    studentProgress.rows.forEach((row, idx) => {
      console.log(`  [${idx}] ${row.navigation_node_id}: ${row.status}`);
      console.log(`      subtopicId: ${row.subtopic_id}`);
      console.log(`      sectionId: ${row.section_id}`);
    });
    console.log('');

    console.log('User 2 Progress Records:', ajayProgress.rows.length);
    ajayProgress.rows.forEach((row, idx) => {
      console.log(`  [${idx}] ${row.navigation_node_id}: ${row.status}`);
      console.log(`      subtopicId: ${row.subtopic_id}`);
      console.log(`      sectionId: ${row.section_id}`);
    });
    console.log('');

    // Check specifically for whatisjava
    console.log('=== Specific Check: whatisjava ===\n');

    const studentWhatisjava = await tutorialPool.query(
      `SELECT * FROM tutorial_navigation_progress 
       WHERE user_id = $1 AND navigation_node_id = 'whatisjava'`,
      [studentId]
    );

    const ajayWhatisjava = await tutorialPool.query(
      `SELECT * FROM tutorial_navigation_progress 
       WHERE user_id = $1 AND navigation_node_id = 'whatisjava'`,
      [ajayId]
    );

    console.log('User 1 whatisjava record:', studentWhatisjava.rows.length > 0 ? 'EXISTS' : 'DOES NOT EXIST');
    if (studentWhatisjava.rows.length > 0) {
      console.log('  Details:', JSON.stringify(studentWhatisjava.rows[0], null, 2));
    }
    console.log('');

    console.log('User 2 whatisjava record:', ajayWhatisjava.rows.length > 0 ? 'EXISTS' : 'DOES NOT EXIST');
    if (ajayWhatisjava.rows.length > 0) {
      console.log('  Details:', JSON.stringify(ajayWhatisjava.rows[0], null, 2));
    }
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await mainPool.end();
    await tutorialPool.end();
  }
}

main().catch(console.error);
