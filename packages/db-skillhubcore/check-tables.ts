import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../../.env.local') });

async function checkTables() {
  const databaseUrl = process.env.SKILLHUBCORE_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ SKILLHUBCORE_DATABASE_URL not found');
    process.exit(1);
  }

  console.log('🔍 Checking database tables...');
  console.log('Database:', databaseUrl.replace(/:[^:]*@/, ':****@'));
  console.log('');

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Check for our educational hierarchy tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('domains', 'subjects', 'topics', 'subtopics', 'skills', 'topic_skills')
      ORDER BY table_name;
    `);

    console.log('📊 Educational Hierarchy Tables Found:');
    console.log('─────────────────────────────────────');
    
    if (result.rows.length === 0) {
      console.log('❌ No educational hierarchy tables found!');
      console.log('');
      console.log('💡 Tables need to be created. Run:');
      console.log('   pnpm --filter @quiz/db-skillhubcore db:push');
    } else {
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ✅ ${row.table_name}`);
      });
      console.log('');
      console.log(`✅ Found ${result.rows.length}/6 tables`);
      
      if (result.rows.length < 6) {
        console.log('⚠️  Some tables are missing!');
      }
    }

    // Check for enum types
    console.log('');
    console.log('📝 Enum Types:');
    console.log('─────────────────────────────────────');
    
    const enumResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('entity_status', 'domain_category', 'topic_complexity', 'skill_category')
      ORDER BY typname;
    `);

    if (enumResult.rows.length === 0) {
      console.log('❌ No enum types found!');
    } else {
      enumResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ✅ ${row.typname}`);
      });
      console.log(`✅ Found ${enumResult.rows.length}/4 enum types`);
    }

    // Get total table count
    console.log('');
    console.log('🗄️  All Tables in Database:');
    console.log('─────────────────────────────────────');
    
    const allTables = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log(`Total tables: ${allTables.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkTables();