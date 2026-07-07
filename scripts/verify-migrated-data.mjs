/**
 * Verify migrated data in tutorial_prod database
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const targetDatabaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || 
                          process.env.DATABASE_URL_TUTORIAL;

const pool = new Pool({
  connectionString: targetDatabaseUrl,
  max: 1,
});

async function verify() {
  try {
    const dbName = await pool.query('SELECT current_database()');
    console.log('✅ Connected to database:', dbName.rows[0].current_database);
    console.log('');
    
    // Count records in each table
    console.log('📊 Record counts:\n');
    
    const domains = await pool.query('SELECT COUNT(*) FROM domains WHERE deleted_at IS NULL');
    console.log(`  ✅ Domains:    ${domains.rows[0].count}`);
    
    const subjects = await pool.query('SELECT COUNT(*) FROM subjects WHERE deleted_at IS NULL');
    console.log(`  ✅ Subjects:   ${subjects.rows[0].count}`);
    
    const topics = await pool.query('SELECT COUNT(*) FROM topics WHERE deleted_at IS NULL');
    console.log(`  ✅ Topics:     ${topics.rows[0].count}`);
    
    const subtopics = await pool.query('SELECT COUNT(*) FROM subtopics WHERE deleted_at IS NULL');
    console.log(`  ✅ Subtopics:  ${subtopics.rows[0].count}`);
    
    const skills = await pool.query('SELECT COUNT(*) FROM skills WHERE deleted_at IS NULL');
    console.log(`  ✅ Skills:     ${skills.rows[0].count}`);
    
    console.log('');
    
    // Sample data from each table
    console.log('📄 Sample domains:\n');
    const sampleDomains = await pool.query('SELECT id, name, category, status FROM domains WHERE deleted_at IS NULL LIMIT 3');
    sampleDomains.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.category}, ${row.status})`);
    });
    
    console.log('\n📄 Sample subjects:\n');
    const sampleSubjects = await pool.query(`
      SELECT s.id, s.name, d.name as domain_name, s.status 
      FROM subjects s 
      JOIN domains d ON s.domain_id = d.id 
      WHERE s.deleted_at IS NULL 
      LIMIT 3
    `);
    sampleSubjects.rows.forEach(row => {
      console.log(`  - ${row.name} (Domain: ${row.domain_name}, ${row.status})`);
    });
    
    console.log('\n📄 Sample topics:\n');
    const sampleTopics = await pool.query(`
      SELECT t.id, t.name, s.name as subject_name, t.complexity, t.status 
      FROM topics t 
      JOIN subjects s ON t.subject_id = s.id 
      WHERE t.deleted_at IS NULL 
      LIMIT 3
    `);
    sampleTopics.rows.forEach(row => {
      console.log(`  - ${row.name} (Subject: ${row.subject_name}, ${row.complexity}, ${row.status})`);
    });
    
    console.log('\n📄 Sample skills:\n');
    const sampleSkills = await pool.query('SELECT id, name, category, weight, status FROM skills WHERE deleted_at IS NULL LIMIT 5');
    sampleSkills.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.category}, weight: ${row.weight}, ${row.status})`);
    });
    
    console.log('\n✅ Data verification complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
