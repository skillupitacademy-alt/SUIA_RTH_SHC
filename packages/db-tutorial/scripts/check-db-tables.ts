/**
 * Check database structure
 */

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  console.log('========================================');
  console.log('Database Structure Check');
  console.log('========================================\n');

  try {
    // Check if tutorial_sections table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      );
    `);

    console.log('tutorial_sections table exists:', tableCheck.rows[0]?.exists);

    if (!tableCheck.rows[0]?.exists) {
      console.log('\n❌ tutorial_sections table does not exist!');
      console.log('Run migrations first: npm run db:migrate\n');
      return;
    }

    // List all tables
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\nAll tables in database:');
    for (const row of tables.rows) {
      console.log(`  - ${row.table_name}`);
    }

    // Count rows in key tables
    console.log('\n## Row Counts\n');

    try {
      const domainCount = await db.execute(sql`SELECT COUNT(*) FROM tutorial_domains;`);
      console.log(`tutorial_domains: ${domainCount.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('tutorial_domains: table not found');
    }

    try {
      const subjectCount = await db.execute(sql`SELECT COUNT(*) FROM tutorial_subjects;`);
      console.log(`tutorial_subjects: ${subjectCount.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('tutorial_subjects: table not found');
    }

    try {
      const topicCount = await db.execute(sql`SELECT COUNT(*) FROM tutorial_topics;`);
      console.log(`tutorial_topics: ${topicCount.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('tutorial_topics: table not found');
    }

    try {
      const subtopicCount = await db.execute(sql`SELECT COUNT(*) FROM tutorial_subtopics;`);
      console.log(`tutorial_subtopics: ${subtopicCount.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('tutorial_subtopics: table not found');
    }

    try {
      const sectionCount = await db.execute(sql`SELECT COUNT(*) FROM tutorial_sections;`);
      console.log(`tutorial_sections: ${sectionCount.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('tutorial_sections: table not found');
    }

    console.log('\n========================================');
    console.log('Check Complete');
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error checking database:');
    console.error(error);
    process.exit(1);
  }
}

checkTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
